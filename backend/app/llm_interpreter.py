import json
import logging
import httpx
from typing import List, Dict, Any, Optional

from .config import settings
from .schemas import (
    DirectiveInterpretationEntry,
    BatteryInput
)
from .guardrails import (
    validate_and_sanitize_directive,
    extract_offline_directive
)

logger = logging.getLogger("energy_optimizer.llm")

LLM_SYSTEM_PROMPT = """You are an expert AI energy systems engineer for the Smart Campus Energy Grid.
Your task is to interpret short natural-language operator notes and convert them into machine-checkable structured directives.

You must return a JSON array containing EXACTLY ONE interpretation object for each operator note, in note_index order (0, 1, ... N-1).

### Supported Directive Types & Structured Adjustment Schemas:
1. solar_reduction:
   - Used when solar PV output is reduced (cleaning, maintenance, cloudy period, etc.).
   - structured_adjustment: {"hours": [int...], "factor": float}
   - IMPORTANT: "factor" is the USABLE FRACTION REMAINING (between 0.0 and 1.0).
     Example: "drop to 20%" -> factor is 0.2.
     Example: "80% reduction" -> factor is 0.2 (1.0 - 0.8).
     Example: "cut solar by 30%" -> factor is 0.7.

2. minimum_battery_reserve:
   - Used when the battery must maintain a minimum stored energy level.
   - structured_adjustment: {"hours": [int...], "minimum_energy_kwh": float}

3. no_charge_window:
   - Used when battery charging is prohibited during specific hours.
   - structured_adjustment: {"hours": [int...]}

4. no_discharge_window:
   - Used when battery discharging is prohibited during specific hours.
   - structured_adjustment: {"hours": [int...]}

5. max_grid_window:
   - Used when grid power import cannot exceed a specific kW/kWh threshold.
   - structured_adjustment: {"hours": [int...], "max_grid_kwh": float}

6. no_op:
   - Used when the note is an irrelevant distractor (e.g. cafeteria food, general meetings, weather tomorrow) or does not affect today's 24-hour campus energy schedule.
   - applies: false
   - structured_adjustment: null

### Rules:
- Time Windows: Start hour is INCLUDED, end hour is EXCLUDED.
  Example: "1 PM to 3 PM" (13:00 to 15:00) -> hours: [13, 14]
  Example: "between 2 PM and 4 PM" -> hours: [14, 15]
  Example: "from 6 PM until 9 PM" -> hours: [18, 19, 20]
  Hours must be unique integers 0 through 23 in ascending order.
- applies must be true for all non-no_op directives, and false ONLY for no_op.
- Output MUST be valid JSON only (no markdown, no backticks, no conversational text).

### Expected Output JSON Format:
[
  {
    "note_index": 0,
    "applies": true,
    "directive_type": "solar_reduction",
    "structured_adjustment": {"hours": [13, 14], "factor": 0.2},
    "explanation": "Solar availability reduced to 20% between 1 PM and 3 PM."
  },
  {
    "note_index": 1,
    "applies": false,
    "directive_type": "no_op",
    "structured_adjustment": null,
    "explanation": "Irrelevant note."
  }
]
"""

async def interpret_with_groq(notes: List[str]) -> Optional[List[Dict[str, Any]]]:
    """Calls Groq Cloud API directly via HTTPX with ultra-low latency."""
    if not settings.groq_api_key:
        return None
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json"
        }
        user_content = json.dumps({"operator_notes": notes})
        body = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": LLM_SYSTEM_PROMPT},
                {"role": "user", "content": f"Operator notes to interpret:\n{user_content}"}
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"} if "llama-3" in settings.groq_model else None
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                logger.warning(f"Groq API returned status {resp.status_code}: {resp.text}")
                return None
            
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for k in ["directives", "directive_interpretation", "notes", "interpretations"]:
                    if k in parsed and isinstance(parsed[k], list):
                        return parsed[k]
                if "note_index" in parsed:
                    return [parsed]
        return None
    except Exception as e:
        logger.warning(f"Groq interpretation failed: {e}")
        return None


async def interpret_with_gemini(notes: List[str]) -> Optional[List[Dict[str, Any]]]:
    """Calls Google Gemini API directly via HTTPX as secondary fallback."""
    if not settings.gemini_api_key:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        headers = {"Content-Type": "application/json"}
        prompt = f"{LLM_SYSTEM_PROMPT}\n\nOperator notes:\n{json.dumps(notes)}"
        body = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
                return None

            data = resp.json()
            content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean possible markdown wrapping
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for k in ["directives", "directive_interpretation", "notes", "interpretations"]:
                    if k in parsed and isinstance(parsed[k], list):
                        return parsed[k]
                if "note_index" in parsed:
                    return [parsed]
        return None
    except Exception as e:
        logger.warning(f"Gemini interpretation failed: {e}")
        return None


async def interpret_operator_notes(
    notes: List[str],
    battery: Optional[BatteryInput] = None
) -> List[DirectiveInterpretationEntry]:
    """
    Interprets operator notes into machine-checkable structured directives.
    Orchestrates Groq -> Gemini -> Offline Fallback, followed by deterministic guardrails.
    """
    raw_results = None

    # 1. Primary: Groq
    if settings.groq_api_key:
        raw_results = await interpret_with_groq(notes)

    # 2. Fallback: Gemini
    if raw_results is None and settings.gemini_api_key:
        raw_results = await interpret_with_gemini(notes)

    final_entries: List[DirectiveInterpretationEntry] = []

    # Map raw results if available
    raw_map = {}
    if raw_results and isinstance(raw_results, list):
        for item in raw_results:
            if isinstance(item, dict) and "note_index" in item:
                try:
                    idx = int(item["note_index"])
                    raw_map[idx] = item
                except (ValueError, TypeError):
                    pass

    # Ensure every note has an entry in order 0..N-1
    for idx, note in enumerate(notes):
        if idx in raw_map:
            sanitized = validate_and_sanitize_directive(raw_map[idx], idx, battery)
        elif raw_results is not None and idx < len(raw_results) and isinstance(raw_results[idx], dict):
            sanitized = validate_and_sanitize_directive(raw_results[idx], idx, battery)
        else:
            # Fallback to deterministic offline rule extractor
            sanitized = extract_offline_directive(note, idx, battery)

        final_entries.append(sanitized)

    return final_entries
