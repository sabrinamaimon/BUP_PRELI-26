# GridWise: LLM-Assisted Smart Campus Energy Optimizer
**BUP CSE Fest 2026 Hackathon — Online Preliminary Round**

---

## 1. Overview & Architecture

GridWise is an automated energy scheduling and operator-directive interpretation system for the Bangladesh University of Professionals (BUP) smart campus. It consumes a 24-hour campus energy forecast (demand, rooftop solar, and hourly grid tariffs) alongside 1–3 unstructured, natural-language campus operator notes.

The service uses a high-performance **LLM $\rightarrow$ Deterministic Guardrails $\rightarrow$ Linear Programming Optimizer** pipeline:
1. **LLM Directive Interpreter:** Translates natural-language operator notes into structured, machine-checkable operational directives.
2. **Deterministic Guardrails:** Strict post-processing layer verifying hour conventions (start-inclusive, end-exclusive $[13, 14]$ for 1 PM to 3 PM), non-negative bounds, solar factor semantics (remaining fraction), and strict `no_op` null-adjustment formatting.
3. **SciPy HiGHS Optimizer:** Formulates the campus power flow into a 120-variable Linear Program (LP) solved in $< 10\text{ ms}$, guaranteeing global cost minimization while strictly obeying physical battery boundaries, charge/discharge rates, and end-of-day battery neutrality ($E_{23} = E_{\text{init}}$).
4. **Independent Auditor:** Recalculates all totals directly from the generated schedule to guarantee zero discrepancy.

```
[ POST /optimize-energy ]
           │
           ▼
[ Pydantic Schema Validation ]  ── Rejects malformed JSON with HTTP 400
           │
           ▼
[ LLM Interpreter (Groq / Gemini) ]
           │
           ▼
[ Deterministic Guardrail Layer ] ── Validates hours [0..23], types, clamps ranges
           │
           ▼
[ SciPy HiGHS Linear Program ]  ── Minimizes total grid purchase cost
           │
           ▼
[ Post-Solve Schedule Auditor ] ── Verifies energy balance & recalculates totals
           │
           ▼
[ HTTP 200 JSON Response ]
```

---

## 2. Supported Directives

| Directive Type | Meaning | Required Adjustment Shape |
| :--- | :--- | :--- |
| `solar_reduction` | Reduces usable rooftop solar during specific hours. | `{"hours": [int...], "factor": float}` (0.0 to 1.0 usable fraction remaining) |
| `minimum_battery_reserve` | Enforces a minimum battery energy level during specific hours. | `{"hours": [int...], "minimum_energy_kwh": float}` |
| `no_charge_window` | Prohibits battery charging during specific hours. | `{"hours": [int...]}` |
| `no_discharge_window` | Prohibits battery discharging during specific hours. | `{"hours": [int...]}` |
| `max_grid_window` | Restricts grid electricity import during specific hours. | `{"hours": [int...], "max_grid_kwh": float}` |
| `no_op` | Distractor or irrelevant note with zero impact on today's schedule. | `null` (with `applies: false`) |

---

## 3. Environment Variables & Secret Handling

The service reads configuration from environment variables or a local `.env` file. **Never commit secrets to git.**

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | API Key for Groq Cloud (Ultra-low latency LLM) | `""` |
| `GEMINI_API_KEY` | API Key for Google AI Studio (Fallback LLM) | `""` |
| `GROQ_MODEL` | Groq Model Identifier | `llama-3.3-70b-versatile` |
| `GEMINI_MODEL` | Gemini Model Identifier | `gemini-2.5-flash` |
| `HOST` | Bind address | `0.0.0.0` |
| `PORT` | Service port | `8000` |

> [!NOTE]
> If neither API key is provided, the backend seamlessly falls back to an offline deterministic rule-based extractor to guarantee zero crashes during offline evaluation or sandboxed judge runs.

---

## 4. Local Quickstart (From Clean Environment)

### Prerequisites
- Python 3.11+
- pip & venv
- Git

### Step-by-Step Setup
```bash
# 1. Clone repository
git clone <YOUR_REPO_URL>
cd BUP_PRELI-26

# 2. Navigate to backend directory
cd backend

# 3. Create and activate a Python virtual environment
# On Linux/macOS:
python3 -m venv .venv
source .venv/bin/activate

# On Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment variables (optional for live LLM)
cp .env.example .env
# Edit .env and insert your GROQ_API_KEY or GEMINI_API_KEY

# 6. Start the API service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 5. Verification & Testing

### 1. Test Health Endpoint
```bash
curl http://127.0.0.1:8000/health
```
**Expected Response:**
```json
{"status": "ok"}
```

### 2. Test Energy Optimization Endpoint (Public Sample Case)
```bash
curl -X POST http://127.0.0.1:8000/optimize-energy \
  -H "Content-Type: application/json" \
  -d @tests/sample_request.json
```

### 3. Run Automated Pytest Suite
```bash
# From the backend directory
pytest tests/ -v
```

### 4. Run CLI Validation Script
```bash
# From repository root
python scripts/test_endpoint.py --url http://127.0.0.1:8000
```

---

## 6. Docker Fallback Image

### Building the Image Locally
```bash
cd backend
docker build -t bup-gridwise-optimizer:latest .
```

### Running the Container
```bash
docker run -d \
  -p 8000:8000 \
  -e GROQ_API_KEY="your_groq_key_here" \
  --name gridwise-service \
  bup-gridwise-optimizer:latest
```

### Verify Container Health
```bash
curl http://127.0.0.1:8000/health
```

---

## 7. Mathematical Modeling & Solvers
- **Formulation:** Linear Programming (LP) with decision variables $\{G_h, S^{\text{used}}_h, B^{\text{charge}}_h, B^{\text{discharge}}_h, E_h\}_{h=0}^{23}$.
- **Solver:** `scipy.optimize.linprog(..., method='highs')` utilizing the HiGHS dual simplex / interior point engine.
- **Complexity & Runtime:** 120 continuous variables, 49 linear equality constraints. Typical solve time: **$3 \text{ to } 8 \text{ ms}$**.
- **Neutrality & Neutral Balancing:** Guarantees $E_{23} = E_{\text{initial}}$ and energy balance $\le 0.01\text{ kWh}$ absolute error.

---

## 8. Known Limitations & Edge Cases Handled
- **Paraphrasing Robustness:** Handles various time expressions ("1 PM to 3 PM", "13:00 to 15:00", "from 1 to 3 PM") and percentage formats ("drop to 20%", "80% reduction", "one-fifth output").
- **Malformed Input Protection:** Returns HTTP 400 with structured validation messages for invalid JSON shapes or mismatched hour arrays ($N \neq 24$).
- **Distractor Filtering:** Irrelevant notes correctly marked with `applies = false`, `directive_type = "no_op"`, and `structured_adjustment = null`.
