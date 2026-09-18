# GridWise — Autonomous Smart Campus Energy Optimization Platform

GridWise is an enterprise-grade smart campus energy scheduling and operator directive interpretation platform. It couples mathematical linear programming (HiGHS LP) with generative operator intent parsing to minimize campus electricity procurement costs, maximize rooftop solar utilization, and preserve battery energy storage life under dynamic Time-of-Use tariffs.

## Live Deployments

The platform is deployed across dual high-availability cloud environments for zero-downtime evaluation:

| Service / Interface | Public URL | Readiness & Capabilities |
| :--- | :--- | :--- |
| **Judging Base API (Render)** | [`https://bup-preli-26.onrender.com`](https://bup-preli-26.onrender.com) | Canonical FastAPI judging endpoint (`/health` and `/optimize-energy`) |
| **Interactive Cleantech Platform (Vercel)** | [`https://bup-preli-26.vercel.app`](https://bup-preli-26.vercel.app) | Full-stack interactive dashboard, visual dispatch simulator, bilingual toggle |
| **Video Demonstration** | [`YouTube Walkthrough`](https://www.youtube.com/watch?v=dPf1Bo6IvYU) | Architectural overview, live optimization dispatch, and UI walkthrough |
| **Source Code Repository** | [`https://github.com/sabrinamaimon/BUP_PRELI-26`](https://github.com/sabrinamaimon/BUP_PRELI-26) | Complete source tree, Docker orchestration, and test suites |

### Canonical Judging Endpoints
* **`GET /health`**: Readiness endpoint returning HTTP 200 `{"status": "ok"}` (Zero login, zero VPN, CORS enabled).
* **`POST /optimize-energy`**: 24-hour campus energy scheduling and natural language operator directive interpretation endpoint.
* **Video Demonstration**: [YouTube System Walkthrough & Live Dispatch Demo](https://www.youtube.com/watch?v=dPf1Bo6IvYU)

---

## System Architecture

```
                                  ┌─────────────────────────────┐
                                  │   Operator Natural Language │
                                  │   Notes (1-3 Directives)    │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│  Campus 24h Telemetry   │       │ Live Generative LLM Engine  │
│  Demand • Solar • Tariff│       │ (Groq Llama-3.3-70B / AI)   │
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
│ • Hourly Energy Balance Eq.     │
│ • Battery Bounds & Neutrality   │
│ • Global Cost Minimization      │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Production Deliverables         │
│ • Canonical Deployed HTTP API   │
│ • Interactive React Cleantech UI│
│ • Judge & Operator Test Suite   │
└─────────────────────────────────┘
```

---

## Supported Operator Directives

The system strictly supports all 6 canonical directive classes specified in the Problem Statement:

| Directive Type | Semantic Action | `applies` | `structured_adjustment` Shape |
| :--- | :--- | :---: | :--- |
| `solar_reduction` | Reduces usable rooftop solar generation during designated hours. | `true` | `{"hours": [int...], "factor": float}` *(0.0 to 1.0 remaining factor)* |
| `minimum_battery_reserve` | Enforces an elevated minimum stored battery energy level. | `true` | `{"hours": [int...], "minimum_energy_kwh": float}` |
| `no_charge_window` | Prohibits battery charging during designated hours. | `true` | `{"hours": [int...]}` |
| `no_discharge_window` | Prohibits battery discharging during designated hours. | `true` | `{"hours": [int...]}` |
| `max_grid_window` | Caps grid electricity procurement during designated hours. | `true` | `{"hours": [int...], "max_grid_kwh": float}` |
| `no_op` | Irrelevant operational note or distractor (zero schedule impact). | `false` | `null` |

> **Time Window Convention**: All time windows follow the whole-hour rule where the **start hour is included and the end hour is excluded** `[start, end)`.  
> *Example: "1 PM to 3 PM" -> `[13, 14]` (hour 15 is excluded).*

---

## Mathematical Formulation & Solvers

The 24-hour campus energy dispatch is formulated as a continuous Linear Program (LP) over 120 decision variables across all hours `h = 0 .. 23` (`Grid_h`, `Solar_Used_h`, `Battery_Charge_h`, `Battery_Discharge_h`, `Battery_Energy_h`):

### 1. Objective Function (Cost Minimization)
```
Minimize:  Total_Cost = SUM_{h=0..23} ( Grid_h * Tariff_h )
```

### 2. Hourly Energy Balance Equation (for each hour h = 0 .. 23)
```
Grid_h + Solar_Used_h + Battery_Discharge_h = Demand_h + Battery_Charge_h
```

### 3. Solar Utilization Bound
```
0 <= Solar_Used_h <= Solar_Available_h * Factor_h
```

### 4. Battery State-of-Charge (SOC) Dynamics
```
Energy_h = Energy_{h-1} + Battery_Charge_h - Battery_Discharge_h
max(Base_Minimum_kWh, Directive_Minimum_kWh) <= Energy_h <= Capacity_kWh
0 <= Battery_Charge_h <= Max_Charge_Rate_kW
0 <= Battery_Discharge_h <= Max_Discharge_Rate_kW
```

### 5. End-of-Day Battery Neutrality Constraint
```
Energy_23 == Initial_Energy_kWh  (enforced within <= 0.01 kWh tolerance)
```

* **Solver Engine**: `scipy.optimize.linprog(..., method='highs')` (HiGHS Dual Simplex / Interior Point solver).
* **Execution Time**: Complete 24-hour scenario solved in **3 to 8 ms** with guaranteed mathematical global optimality.

---

## Quickstart & Local Reproduction

### Option A: 1-Command Unified Docker Orchestration
Run the entire production stack (FastAPI Backend + React Frontend + Nginx Reverse Proxy) locally:

```bash
docker compose up --build
```
* **Frontend Web Dashboard**: `http://localhost`
* **Health Endpoint**: `http://localhost/health`
* **Optimize Energy Endpoint**: `http://localhost/optimize-energy`

---

### Option B: Local Backend (FastAPI) Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start local development server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Run automated backend tests:
```bash
pytest backend/tests/ -v
python scripts/test_endpoint.py --url http://127.0.0.1:8000
```

---

### Option C: Local Frontend (React + Vite) Setup

```bash
# From repository root
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Live Judge Sample Verification

Test the live production deployment from any terminal:

### 1. Health Readiness Check
```bash
curl -i https://bup-preli-26.onrender.com/health
```
**Expected Response (HTTP 200 OK):**
```json
{"status":"ok"}
```

### 2. Full 24-Hour Energy Optimization Test
```bash
curl -s -X POST https://bup-preli-26.onrender.com/optimize-energy \
  -H "Content-Type: application/json" \
  -d @backend/tests/sample_request.json
```

**Canonical Response:**
```json
{
  "scenario_id": "GRID-101",
  "directive_interpretation": [
    {
      "note_index": 0,
      "applies": true,
      "directive_type": "solar_reduction",
      "structured_adjustment": {"hours": [13, 14], "factor": 0.2},
      "explanation": "Detected solar reduction directive."
    },
    {
      "note_index": 1,
      "applies": true,
      "directive_type": "no_charge_window",
      "structured_adjustment": {"hours": [14, 15]},
      "explanation": "Detected battery no-charge window directive."
    },
    {
      "note_index": 2,
      "applies": false,
      "directive_type": "no_op",
      "structured_adjustment": null,
      "explanation": "Unrelated operational note."
    }
  ],
  "hourly_plan": [
    {
      "hour": 0,
      "grid_kwh": 80.0,
      "solar_used_kwh": 0.0,
      "battery_action": "discharge",
      "battery_kwh": 100.0,
      "battery_energy_after_kwh": 100.0
    }
    // ... exactly 23 more hours ...
  ],
  "total_grid_kwh": 5631.0,
  "total_cost_bdt": 52881.5,
  "peak_grid_kwh": 410.0,
  "plan_summary": "Strategy optimized across 24 hours with 2 active operator directive(s). Total grid import: 5631.00 kWh (Peak: 410.00 kWh) costing 52881.50 BDT. Utilized 1729.00 kWh solar energy. Battery cycled 750.00 kWh charged / 750.00 kWh discharged, satisfying end-of-day neutrality at 200.00 kWh."
}
```


---

## Security & Environment Configuration

All secret keys are injected strictly at runtime via environment variables on hosting providers:

| Variable | Required | Default | Purpose |
| :--- | :---: | :--- | :--- |
| `GROQ_API_KEY` | Optional | `""` | Primary fast LLM provider key (Groq Cloud) |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Llama-3.3-70B model on Groq (< 1s p95 latency) |
| `GEMINI_API_KEY` | Optional | `""` | Secondary fallback LLM key (Google AI Studio) |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Google Gemini model fallback |
| `PORT` | Optional | `8000` | Dynamic service binding port |
| `HOST` | Optional | `0.0.0.0` | Network binding interface |

> **Offline Deterministic Fallback**: In the absence of an external LLM API key or during network downtime, the system deterministically executes an internal regex rule-matching engine covering all 6 directive types, ensuring zero runtime crashes.
