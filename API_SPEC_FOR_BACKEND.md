# GridWise API Specification for Backend Engineer (Member 2)

Welcome! This document provides the exact contract, schemas, and guardrails required to build the backend service for the **GridWise Smart Campus Energy Optimization Challenge**.

---

## 1. Endpoints Required

### Endpoint 1: Readiness Health Check
- **Method**: `GET`
- **Path**: `/health`
- **Status**: `200 OK`
- **Response**:
```json
{
  "status": "ok"
}
```

---

### Endpoint 2: Primary Energy Optimization
- **Method**: `POST`
- **Path**: `/optimize-energy`
- **Status**: `200 OK`
- **Request Body**:
```json
{
  "scenario_id": "GRID-101",
  "operator_notes": [
    "Solar output will drop to about 20% from 1 PM to 3 PM.",
    "Do not charge the battery between 2 PM and 4 PM.",
    "The cafeteria menu changes tomorrow."
  ],
  "hours": [
    {"hour": 0, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 7.0},
    {"hour": 1, "demand_kwh": 160, "solar_kwh": 0, "tariff_bdt_per_kwh": 7.0},
    {"hour": 2, "demand_kwh": 150, "solar_kwh": 0, "tariff_bdt_per_kwh": 7.0},
    {"hour": 3, "demand_kwh": 140, "solar_kwh": 0, "tariff_bdt_per_kwh": 6.5},
    {"hour": 4, "demand_kwh": 145, "solar_kwh": 0, "tariff_bdt_per_kwh": 6.5},
    {"hour": 5, "demand_kwh": 160, "solar_kwh": 5, "tariff_bdt_per_kwh": 6.5},
    {"hour": 6, "demand_kwh": 190, "solar_kwh": 35, "tariff_bdt_per_kwh": 7.5},
    {"hour": 7, "demand_kwh": 240, "solar_kwh": 90, "tariff_bdt_per_kwh": 8.0},
    {"hour": 8, "demand_kwh": 310, "solar_kwh": 160, "tariff_bdt_per_kwh": 9.5},
    {"hour": 9, "demand_kwh": 380, "solar_kwh": 230, "tariff_bdt_per_kwh": 10.0},
    {"hour": 10, "demand_kwh": 410, "solar_kwh": 280, "tariff_bdt_per_kwh": 10.5},
    {"hour": 11, "demand_kwh": 430, "solar_kwh": 300, "tariff_bdt_per_kwh": 10.5},
    {"hour": 12, "demand_kwh": 420, "solar_kwh": 310, "tariff_bdt_per_kwh": 10.5},
    {"hour": 13, "demand_kwh": 400, "solar_kwh": 290, "tariff_bdt_per_kwh": 10.5},
    {"hour": 14, "demand_kwh": 390, "solar_kwh": 250, "tariff_bdt_per_kwh": 10.5},
    {"hour": 15, "demand_kwh": 360, "solar_kwh": 180, "tariff_bdt_per_kwh": 10.0},
    {"hour": 16, "demand_kwh": 320, "solar_kwh": 110, "tariff_bdt_per_kwh": 9.5},
    {"hour": 17, "demand_kwh": 300, "solar_kwh": 40, "tariff_bdt_per_kwh": 11.0},
    {"hour": 18, "demand_kwh": 350, "solar_kwh": 0, "tariff_bdt_per_kwh": 12.5},
    {"hour": 19, "demand_kwh": 380, "solar_kwh": 0, "tariff_bdt_per_kwh": 12.5},
    {"hour": 20, "demand_kwh": 340, "solar_kwh": 0, "tariff_bdt_per_kwh": 11.5},
    {"hour": 21, "demand_kwh": 280, "solar_kwh": 0, "tariff_bdt_per_kwh": 9.5},
    {"hour": 22, "demand_kwh": 240, "solar_kwh": 0, "tariff_bdt_per_kwh": 8.5},
    {"hour": 23, "demand_kwh": 200, "solar_kwh": 0, "tariff_bdt_per_kwh": 7.5}
  ],
  "battery": {
    "capacity_kwh": 500,
    "initial_energy_kwh": 200,
    "minimum_energy_kwh": 50,
    "max_charge_kwh_per_hour": 100,
    "max_discharge_kwh_per_hour": 100
  }
}
```

- **Response Body**:
```json
{
  "scenario_id": "GRID-101",
  "directive_interpretation": [
    {
      "note_index": 0,
      "applies": true,
      "directive_type": "solar_reduction",
      "structured_adjustment": {
        "hours": [13, 14],
        "factor": 0.2
      },
      "explanation": "Solar availability reduced by 80% (usable factor 0.2) between 1 PM and 3 PM."
    },
    {
      "note_index": 1,
      "applies": true,
      "directive_type": "no_charge_window",
      "structured_adjustment": {
        "hours": [14, 15]
      },
      "explanation": "Battery charging prohibited between 2 PM and 4 PM."
    },
    {
      "note_index": 2,
      "applies": false,
      "directive_type": "no_op",
      "structured_adjustment": null,
      "explanation": "Distractor note regarding cafeteria menu; does not affect energy schedule."
    }
  ],
  "hourly_plan": [
    {
      "hour": 0,
      "grid_kwh": 180.0,
      "solar_used_kwh": 0.0,
      "battery_action": "idle",
      "battery_kwh": 0.0,
      "battery_energy_after_kwh": 200.0
    }
    // ... 23 more hours ...
  ],
  "total_grid_kwh": 4120.0,
  "total_cost_bdt": 39850.0,
  "peak_grid_kwh": 310.0,
  "plan_summary": "Managed 24-hour campus dispatch under solar curtailment and charge lockout. Peak shaved hours 18-20 using battery storage."
}
```

---

## 2. Canonical Directive Types & Shapes

| Directive Type | Meaning | `applies` | `structured_adjustment` Shape |
| :--- | :--- | :--- | :--- |
| `solar_reduction` | Usable solar fraction remaining | `true` | `{"hours": [int, ...], "factor": float}` *(e.g. 80% reduction -> factor 0.2)* |
| `minimum_battery_reserve` | Elevated minimum reserve in kWh | `true` | `{"hours": [int, ...], "minimum_energy_kwh": float}` |
| `no_charge_window` | Lockout battery charging | `true` | `{"hours": [int, ...]}` |
| `no_discharge_window` | Lockout battery discharging | `true` | `{"hours": [int, ...]}` |
| `max_grid_window` | Cap grid import in kWh | `true` | `{"hours": [int, ...], "max_grid_kwh": float}` |
| `no_op` | Irrelevant / distractor note | `false` | `null` |

### Critical Time Convention:
Whole-hour windows: **start hour is included, end hour is excluded**.
- "1 PM to 3 PM" -> `[13, 14]`
- "2 PM and 4 PM" -> `[14, 15]`
- "6 PM until 9 PM" -> `[18, 19, 20]`
- All hours arrays must contain unique integers 0..23 in strictly ascending order.

---

## 3. Mathematical Constraints Every Judge Will Verify

1. **Energy Balance**:
   `grid_kwh + solar_used_kwh + battery_discharge_kwh = demand_kwh + battery_charge_kwh` for every hour.
2. **Solar Bounds**:
   `0 <= solar_used_kwh <= effective_solar_kwh` (where `effective_solar = original_solar * factor` if reduced).
3. **Battery State of Charge Transition**:
   - `charge`: `E_after = E_before + battery_kwh`
   - `discharge`: `E_after = E_before - battery_kwh`
   - `idle`: `E_after = E_before` and `battery_kwh = 0`
4. **Battery Energy Bounds**:
   `max(base_minimum_kwh, directive_minimum_kwh) <= E_after <= capacity_kwh`
5. **Rate Limits**:
   `battery_charge <= max_charge_per_hour` and `battery_discharge <= max_discharge_per_hour`
6. **End-of-Day Neutrality**:
   `battery_energy_after_kwh[hour 23] == initial_energy_kwh` (hour 0 start)
7. **Cost Minimization**:
   Minimize `total_cost_bdt = SUM(grid_kwh[h] * tariff_bdt_per_kwh[h])`
