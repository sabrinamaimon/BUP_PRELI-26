import re
from typing import List, Dict, Any, Optional
from .schemas import (
    DirectiveInterpretationEntry,
    DirectiveType,
    BatteryInput
)

SUPPORTED_DIRECTIVES = {
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op"
}

def sanitize_hours(raw_hours: Any) -> List[int]:
    """
    Ensures hours are a sorted list of unique integers strictly between 0 and 23.
    """
    if not isinstance(raw_hours, list):
        return []
    
    clean_hours = set()
    for h in raw_hours:
        try:
            val = int(h)
            if 0 <= val <= 23:
                clean_hours.add(val)
        except (ValueError, TypeError):
            continue
            
    return sorted(list(clean_hours))


def parse_time_window_to_hours(start_str: str, end_str: str) -> List[int]:
    """
    Converts 12h or 24h start/end strings into start-inclusive, end-exclusive hours.
    e.g., "1 PM", "3 PM" -> 13:00 to 15:00 -> [13, 14]
    """
    def to_24h(t_str: str) -> Optional[int]:
        s = t_str.strip().lower()
        # Check for AM/PM
        match_ampm = re.match(r"^(\d{1,2})(?::00)?\s*(am|pm)$", s)
        if match_ampm:
            hr = int(match_ampm.group(1))
            meridiem = match_ampm.group(2)
            if meridiem == "pm" and hr != 12:
                hr += 12
            elif meridiem == "am" and hr == 12:
                hr = 0
            return hr
        
        # Check for 24h format (e.g. "13:00" or "13")
        match_24 = re.match(r"^(\d{1,2})(?::00)?$", s)
        if match_24:
            hr = int(match_24.group(1))
            if 0 <= hr <= 24:
                return hr
        return None

    s_hr = to_24h(start_str)
    e_hr = to_24h(end_str)

    if s_hr is not None and e_hr is not None and s_hr < e_hr:
        return list(range(max(0, s_hr), min(24, e_hr)))
    return []


def validate_and_sanitize_directive(
    raw_entry: Dict[str, Any],
    note_index: int,
    battery: Optional[BatteryInput] = None
) -> DirectiveInterpretationEntry:
    """
    Validates an untrusted dictionary from the LLM against the canonical rules:
    - Must be a supported directive type.
    - If no_op: applies=False, structured_adjustment=None.
    - If not no_op: applies=True, hours must be unique ascending integers in [0..23].
    - Clamps solar factor between 0.0 and 1.0.
    - Clamps reserve between 0.0 and capacity.
    - Safe fallback on errors to no_op.
    """
    raw_type = str(raw_entry.get("directive_type", "no_op")).strip().lower()
    if raw_type not in SUPPORTED_DIRECTIVES:
        raw_type = "no_op"

    explanation = str(raw_entry.get("explanation", "Interpreted operator note.")).strip()
    if not explanation:
        explanation = "Interpreted operator note."

    # If no_op or invalid type
    if raw_type == "no_op":
        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=False,
            directive_type="no_op",
            structured_adjustment=None,
            explanation=explanation
        )

    raw_adj = raw_entry.get("structured_adjustment")
    if not isinstance(raw_adj, dict):
        # Malformed adjustment: fail safe to no_op
        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=False,
            directive_type="no_op",
            structured_adjustment=None,
            explanation="Invalid structured adjustment format; safely defaulting to no_op."
        )

    # Sanitize hours
    hours = sanitize_hours(raw_adj.get("hours", []))
    if not hours:
        # A non-no_op directive with no valid hours is meaningless
        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=False,
            directive_type="no_op",
            structured_adjustment=None,
            explanation="No valid hours specified; safely defaulting to no_op."
        )

    # Validate specific directive adjustments
    if raw_type == "solar_reduction":
        try:
            factor = float(raw_adj.get("factor", 1.0))
            factor = max(0.0, min(1.0, factor))
            factor = round(factor, 4)
        except (ValueError, TypeError):
            factor = 1.0

        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=True,
            directive_type="solar_reduction",
            structured_adjustment={"hours": hours, "factor": factor},
            explanation=explanation
        )

    elif raw_type == "minimum_battery_reserve":
        try:
            min_kwh = float(raw_adj.get("minimum_energy_kwh", 0.0))
            if battery:
                min_kwh = max(0.0, min(battery.capacity_kwh, min_kwh))
            else:
                min_kwh = max(0.0, min_kwh)
            min_kwh = round(min_kwh, 4)
        except (ValueError, TypeError):
            min_kwh = 0.0

        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=True,
            directive_type="minimum_battery_reserve",
            structured_adjustment={"hours": hours, "minimum_energy_kwh": min_kwh},
            explanation=explanation
        )

    elif raw_type == "no_charge_window":
        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=True,
            directive_type="no_charge_window",
            structured_adjustment={"hours": hours},
            explanation=explanation
        )

    elif raw_type == "no_discharge_window":
        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=True,
            directive_type="no_discharge_window",
            structured_adjustment={"hours": hours},
            explanation=explanation
        )

    elif raw_type == "max_grid_window":
        try:
            max_grid = float(raw_adj.get("max_grid_kwh", 0.0))
            max_grid = max(0.0, max_grid)
            max_grid = round(max_grid, 4)
        except (ValueError, TypeError):
            max_grid = 0.0

        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=True,
            directive_type="max_grid_window",
            structured_adjustment={"hours": hours, "max_grid_kwh": max_grid},
            explanation=explanation
        )

    # Catch-all safe fallback
    return DirectiveInterpretationEntry(
        note_index=note_index,
        applies=False,
        directive_type="no_op",
        structured_adjustment=None,
        explanation=explanation
    )


def extract_offline_directive(note: str, note_index: int, battery: Optional[BatteryInput] = None) -> DirectiveInterpretationEntry:
    """
    Deterministic rule-based extractor used as an offline emergency fallback
    if all LLM API providers are unreachable.
    Guarantees the system never crashes or returns a 500 error.
    """
    text = note.strip().lower()

    # Distractor patterns
    distractor_keywords = ["cafeteria", "menu", "lunch", "weather forecast tomorrow", "holiday", "meeting", "bus", "library"]
    if any(k in text for k in distractor_keywords):
        return DirectiveInterpretationEntry(
            note_index=note_index,
            applies=False,
            directive_type="no_op",
            structured_adjustment=None,
            explanation="Unrelated operational note."
        )

    # 1. Solar Reduction
    if "solar" in text or "pv" in text or "panel" in text:
        # Extract hours (e.g. 1 PM to 3 PM or 13:00 to 15:00 or between 1 and 3)
        hours = []
        time_match = re.search(r"(\d{1,2}(?::00)?\s*(?:am|pm)?)\s*(?:to|until|-|and)\s*(\d{1,2}(?::00)?\s*(?:am|pm)?)", text)
        if time_match:
            hours = parse_time_window_to_hours(time_match.group(1), time_match.group(2))
        
        # Extract factor (e.g. drop to 20%, 80% reduction, one-fifth)
        factor = 1.0
        if "one-fifth" in text:
            factor = 0.2
        elif "one-fourth" in text or "quarter" in text:
            factor = 0.25
        elif "half" in text:
            factor = 0.5
        else:
            pct_match = re.search(r"(\d{1,3})%", text)
            if pct_match:
                pct = float(pct_match.group(1))
                if "drop to" in text or "fall to" in text or "leave" in text:
                    factor = pct / 100.0
                elif "reduction" in text or "reduce" in text or "drop by" in text or "cut" in text:
                    factor = max(0.0, 1.0 - (pct / 100.0))
                else:
                    factor = pct / 100.0

        if hours:
            return DirectiveInterpretationEntry(
                note_index=note_index,
                applies=True,
                directive_type="solar_reduction",
                structured_adjustment={"hours": hours, "factor": round(factor, 4)},
                explanation="Detected solar reduction directive."
            )

    # 2. No Charge Window
    if ("not charge" in text or "no charge" in text or "do not charge" in text or "disable charging" in text) and "battery" in text:
        hours = []
        time_match = re.search(r"(\d{1,2}(?::00)?\s*(?:am|pm)?)\s*(?:to|until|-|and)\s*(\d{1,2}(?::00)?\s*(?:am|pm)?)", text)
        if time_match:
            hours = parse_time_window_to_hours(time_match.group(1), time_match.group(2))
        if hours:
            return DirectiveInterpretationEntry(
                note_index=note_index,
                applies=True,
                directive_type="no_charge_window",
                structured_adjustment={"hours": hours},
                explanation="Detected battery no-charge window directive."
            )

    # 3. No Discharge Window
    if ("not discharge" in text or "no discharge" in text or "do not discharge" in text or "disable discharging" in text) and "battery" in text:
        hours = []
        time_match = re.search(r"(\d{1,2}(?::00)?\s*(?:am|pm)?)\s*(?:to|until|-|and)\s*(\d{1,2}(?::00)?\s*(?:am|pm)?)", text)
        if time_match:
            hours = parse_time_window_to_hours(time_match.group(1), time_match.group(2))
        if hours:
            return DirectiveInterpretationEntry(
                note_index=note_index,
                applies=True,
                directive_type="no_discharge_window",
                structured_adjustment={"hours": hours},
                explanation="Detected battery no-discharge window directive."
            )

    # 4. Minimum Battery Reserve
    if "reserve" in text or ("keep at least" in text and "battery" in text) or "minimum battery" in text:
        hours = []
        time_match = re.search(r"(\d{1,2}(?::00)?\s*(?:am|pm)?)\s*(?:to|until|-|and)\s*(\d{1,2}(?::00)?\s*(?:am|pm)?)", text)
        if time_match:
            hours = parse_time_window_to_hours(time_match.group(1), time_match.group(2))
        kwh_match = re.search(r"(\d+(?:\.\d+)?)\s*kwh", text)
        kwh_val = float(kwh_match.group(1)) if kwh_match else 100.0
        if hours:
            return DirectiveInterpretationEntry(
                note_index=note_index,
                applies=True,
                directive_type="minimum_battery_reserve",
                structured_adjustment={"hours": hours, "minimum_energy_kwh": round(kwh_val, 4)},
                explanation="Detected minimum battery reserve requirement."
            )

    # 5. Max Grid Window
    if "grid" in text and ("limit" in text or "max" in text or "exceed" in text or "cap" in text):
        hours = []
        time_match = re.search(r"(\d{1,2}(?::00)?\s*(?:am|pm)?)\s*(?:to|until|-|and)\s*(\d{1,2}(?::00)?\s*(?:am|pm)?)", text)
        if time_match:
            hours = parse_time_window_to_hours(time_match.group(1), time_match.group(2))
        kwh_match = re.search(r"(\d+(?:\.\d+)?)\s*kwh", text)
        kwh_val = float(kwh_match.group(1)) if kwh_match else 150.0
        if hours:
            return DirectiveInterpretationEntry(
                note_index=note_index,
                applies=True,
                directive_type="max_grid_window",
                structured_adjustment={"hours": hours, "max_grid_kwh": round(kwh_val, 4)},
                explanation="Detected maximum grid import restriction."
            )

    # Default to no_op
    return DirectiveInterpretationEntry(
        note_index=note_index,
        applies=False,
        directive_type="no_op",
        structured_adjustment=None,
        explanation="No applicable energy directive detected."
    )
