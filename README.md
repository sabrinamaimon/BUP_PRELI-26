# GridWise — Smart Campus Energy Optimization Platform
**BUP CSE Fest 2026 Hackathon — Online Preliminary Round**

### 🚀 Live Production Deployments
- **Judging API Base URL (Render)**: [https://bup-preli-26.onrender.com](https://bup-preli-26.onrender.com)
  - Readiness Health Endpoint: `GET https://bup-preli-26.onrender.com/health`
  - Optimization Endpoint: `POST https://bup-preli-26.onrender.com/optimize-energy`
- **Interactive Cleantech Dashboard (Vercel)**: [https://bup-preli-26.vercel.app](https://bup-preli-26.vercel.app)
- **Source Repository**: [https://github.com/sabrinamaimon/BUP_PRELI-26](https://github.com/sabrinamaimon/BUP_PRELI-26)

---


## Architecture & System Overview

```
                                  ┌─────────────────────────────┐
                                  │   Operator Natural Language │
                                  │   Notes (1-3 Directives)    │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│  Campus 24h Telemetry   │       │ LLM / Semantic Interpreter  │
│  Demand • Solar • Tariff│       │ (Groq / Gemini / Fallback)  │
└────────────┬────────────┘       └──────────────┬──────────────┘
             │                                   │
             │   ┌───────────────────────────────┘
             ▼   ▼
┌─────────────────────────────────┐
│ Deterministic Guardrail Layer   │
│ • Valid Types • 0-23 Ascending  │
│ • Range Bounds • No-Op Filter   │
│ • Start-inclusive/End-exclusive │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Mathematical Optimization Model │
│ • SciPy HiGHS Linear Program    │
│ • Energy Balance Constraints    │
│ • Battery Bounds & Neutrality   │
│ • Cost Minimization (SUM BDT)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Production Outputs              │
│ • Canonical Deployed HTTP API   │
│ • Interactive React Cleantech UI│
│ • Judge & Operator Test Suite   │
└─────────────────────────────────┘
```

---

## 1. Backend Service (Canonical Judging API)

The backend provides the two canonical endpoints evaluated by the judging harness:
- **`GET /health`**: Returns HTTP 200 `{"status": "ok"}`.
- **`POST /optimize-energy`**: Accepts 24-hour scenario telemetry + operator notes, interprets directives, solves the cost-minimizing Linear Program, and returns the machine-checkable schedule.

### Supported Directives

| Directive Type | Meaning | Required Adjustment Shape |
| :--- | :--- | :--- |
| `solar_reduction` | Reduces usable rooftop solar during specific hours. | `{"hours": [int...], "factor": float}` (0.0 to 1.0 usable fraction remaining) |
| `minimum_battery_reserve` | Enforces a minimum battery energy level during specific hours. | `{"hours": [int...], "minimum_energy_kwh": float}` |
| `no_charge_window` | Prohibits battery charging during specific hours. | `{"hours": [int...]}` |
| `no_discharge_window` | Prohibits battery discharging during specific hours. | `{"hours": [int...]}` |
| `max_grid_window` | Restricts grid electricity import during specific hours. | `{"hours": [int...], "max_grid_kwh": float}` |
| `no_op` | Distractor or irrelevant note with zero impact on today's schedule. | `null` (with `applies: false`) |

### Backend Local Quickstart

```bash
# 1. Navigate to backend directory
cd backend

# 2. Setup Python virtual environment
python -m venv .venv
# On Linux/macOS: source .venv/bin/activate
# On Windows: .\.venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Optional: Set API keys for live LLM
cp .env.example .env

# 5. Start the backend service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Backend Testing & Verification
```bash
# Run complete test suite (12 tests)
pytest backend/tests/ -v

# Run CLI verification tool
python scripts/test_endpoint.py --url http://127.0.0.1:8000
```

### Backend Docker Fallback
```bash
cd backend
docker build -t bup-gridwise-optimizer:latest .
docker run -d -p 8000:8000 --name gridwise-api bup-gridwise-optimizer:latest
curl http://127.0.0.1:8000/health
```

---

## 2. Frontend Cleantech Dashboard

A modern, responsive Single Page Application (SPA) designed with the Sapphire Electric & Cleantech palette.

### Key Features:
- **Interactive 24h Energy Chart**: Visualizes Demand, Solar, Battery SoC, and Grid Import.
- **Operator Directive Studio**: Live natural-language input with speech recognition and Bengali/English translation.
- **Judge Compliance Harness**: Built-in test harness verifying compliance with the official rubric.
- **Digital Energy Passport**: Generates verifiable dispatch credentials and summaries.

### Frontend Quickstart:
```bash
# From repository root
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Mathematical Modeling & Solvers

- **Optimization Formulation**: Linear Programming (LP) over 120 decision variables $\{G_h, S^{\text{used}}_h, B^{\text{charge}}_h, B^{\text{discharge}}_h, E_h\}_{h=0}^{23}$.
- **Solver**: `scipy.optimize.linprog(..., method='highs')` (HiGHS dual simplex / interior point engine).
- **Runtime Performance**: Solves a complete 24-hour scenario with directives in **$3 \text{ to } 8 \text{ ms}$**.
- **Neutrality**: Guarantees end-of-day battery neutrality ($E_{23} = E_{\text{initial}}$) and hourly energy balance within $\le 0.01\text{ kWh}$.

---

## 4. Environment Variables & Model Providers

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `GROQ_API_KEY` | Optional | `""` | Primary fast LLM provider key (Groq Cloud) |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Ultra-fast Llama-3 model on Groq (<1s p95 latency) |
| `GEMINI_API_KEY` | Optional | `""` | Secondary fallback LLM key (Google AI Studio) |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Google Gemini model fallback |
| `PORT` | Optional | `8000` (Render: dynamic) | Service listening port |
| `HOST` | Optional | `0.0.0.0` | Binding network interface |

> 🛡️ **Offline Deterministic Fallback**: If neither Groq nor Gemini API key is provided, the service deterministically falls back to an internal regex rule-matching engine for all 6 canonical directive types, ensuring zero runtime crashes.

---

## 5. Public Sample Verification Test

### Health Check:
```bash
curl -i https://bup-preli-26.onrender.com/health
# Returns HTTP 200 OK: {"status": "ok"}
```

### Full 24-Hour Optimization Test:
```bash
curl -s -X POST https://bup-preli-26.onrender.com/optimize-energy \
  -H "Content-Type: application/json" \
  -d @backend/tests/sample_request.json
```

---

## 6. Secret Handling & Reproducibility Guidelines

- **Zero Baked-in Credentials**: No secret API keys, tokens, or credentials are committed to this repository. All credentials are injected strictly at runtime via environment variables on hosting providers.
- **Error Boundaries**: Malformed inputs or LLM provider errors return controlled HTTP 400 or HTTP 500 JSON without leaking system stack traces or sensitive environment variables.

