import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_optimize_energy_endpoint():
    json_path = Path(__file__).parent / "sample_request.json"
    with open(json_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    response = client.post("/optimize-energy", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify top-level fields
    assert data["scenario_id"] == "GRID-101"
    assert "directive_interpretation" in data
    assert len(data["directive_interpretation"]) == 3
    assert "hourly_plan" in data
    assert len(data["hourly_plan"]) == 24
    assert "total_grid_kwh" in data
    assert "total_cost_bdt" in data
    assert "peak_grid_kwh" in data
    assert "plan_summary" in data

    # Verify note 2 is no_op
    note_2 = data["directive_interpretation"][2]
    assert note_2["note_index"] == 2
    assert note_2["applies"] is False
    assert note_2["directive_type"] == "no_op"
    assert note_2["structured_adjustment"] is None

def test_optimize_energy_malformed_request():
    # Only 23 hours provided instead of 24
    bad_payload = {
        "scenario_id": "BAD-01",
        "operator_notes": ["Note 1"],
        "hours": [{"hour": i, "demand_kwh": 100, "solar_kwh": 0, "tariff_bdt_per_kwh": 5} for i in range(23)],
        "battery": {
            "capacity_kwh": 500,
            "initial_energy_kwh": 200,
            "minimum_energy_kwh": 50,
            "max_charge_kwh_per_hour": 100,
            "max_discharge_kwh_per_hour": 100
        }
    }
    response = client.post("/optimize-energy", json=bad_payload)
    assert response.status_code == 400
