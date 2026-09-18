# GridWise — Smart Campus Energy Optimization Platform

**Autonomous 24-Hour Energy Scheduling & Natural Language Operator Directive Engine**

GridWise is an enterprise-grade cleantech platform designed for smart campus energy management. It integrates rooftop solar photovoltaics (PV), battery energy storage systems (BESS), and dynamic grid tariffs, combining a deterministic mathematical optimization engine with natural-language operator directive interpretation.

---

## Key Capabilities

- **Autonomous 24-Hour Energy Dispatch**: Formulates an optimal hourly energy schedule minimizing total grid electricity procurement cost (BDT) while strictly preserving battery neutrality, rate limits, and supply-demand equilibrium.
- **Natural-Language Operator Directive Parsing**: Interprets complex operational instructions (e.g. maintenance windows, solar curtailment, minimum reserve mandates, grid caps) and safely isolates irrelevant distractors.
- **Multimodal Voice Control**: Native Web Speech API integration with bidirectional English and Bengali voice recognition and Text-to-Speech (TTS) audio playback.
- **Dual Runtime Architecture**:
  1. **Autonomous Client Solver**: High-fidelity in-browser deterministic optimization engine with live visual analytics and state-of-charge progression.
  2. **Production HTTP API Connector**: Seamlessly hooks into the deployed backend API (`GET /health` and `POST /optimize-energy`).
- **Judge & Operator Harness**: Built-in 7-category compliance validator that executes the exact judging schema against candidate responses.
- **Digital Energy Passport**: 1-click dynamic QR verification code and printable dispatch report.

---

## Quickstart (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm 9+

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/sabrinamaimon/BUP_PRELI-26.git
cd BUP_PRELI-26

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application will be accessible at: `http://localhost:3000` (or `http://localhost:5173`).

---

## Docker Fallback Execution

As required for evaluation and fallback deployment:

### Build Image
```bash
docker build -t gridwise-frontend:latest .
```

### Run Container
```bash
docker run -d -p 80:80 --name gridwise-app gridwise-frontend:latest
```

Access the service at `http://localhost/`.

---

## API Endpoints & Contract

The application connects to two canonical HTTP endpoints:

### 1. Health Readiness
- **Route**: `GET /health`
- **Response**: `{"status": "ok"}`

### 2. Primary Optimization
- **Route**: `POST /optimize-energy`
- **Request**: 24-hour hourly demand, solar availability, tariff array, battery specifications, and 1-3 operator notes.
- **Response**: Machine-checkable `directive_interpretation` array, 24-hour `hourly_plan`, `total_grid_kwh`, `total_cost_bdt`, and `peak_grid_kwh`.

Detailed schema documentation is available in [API_SPEC_FOR_BACKEND.md](./API_SPEC_FOR_BACKEND.md).

---

## System Architecture

```
                                  ┌─────────────────────────────┐
                                  │   Operator Natural Language │
                                  │   Notes (Voice / Text)      │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│  Campus 24h Telemetry   │       │ LLM / Semantic Interpreter  │
│  Demand • Solar • Tariff│       │ (Structured Directive Cast) │
└────────────┬────────────┘       └──────────────┬──────────────┘
             │                                   │
             │   ┌───────────────────────────────┘
             ▼   ▼
┌─────────────────────────────────┐
│ Deterministic Guardrail Layer   │
│ • Valid Types • 0-23 Ascending  │
│ • Range Bounds • No-Op Filter   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Mathematical Optimization Model │
│ • Energy Balance               │
│ • Battery Bounds & Neutrality   │
│ • Cost Minimization (SUM BDT)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ GridWise Visualization Suite    │
│ • Interactive Dispatch Schedule │
│ • Battery SOC Progression Chart │
│ • Digital QR Energy Passport    │
└─────────────────────────────────┘
```

---

## Deployment Configuration

- **Vercel**: Pre-configured with [`vercel.json`](./vercel.json) for Single-Page Application (SPA) routing.
- **Docker**: Pre-configured with multi-stage [`Dockerfile`](./Dockerfile) and optimized [`nginx.conf`](./nginx.conf).
- **Environment**: Configurable via `.env` with `VITE_BACKEND_URL`.
