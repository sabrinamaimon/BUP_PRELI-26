"""
CLI verification script to test a deployed or local GridWise Energy Optimizer endpoint.
Usage:
    python scripts/test_endpoint.py --url http://127.0.0.1:8000
"""

import sys
import json
import argparse
import httpx

SAMPLE_PAYLOAD = {
    "scenario_id": "GRID-TEST-CLI",
    "operator_notes": [
        "Solar output will drop to about 20% from 1 PM to 3 PM.",
        "Do not charge the battery between 2 PM and 4 PM.",
        "The cafeteria menu changes tomorrow."
    ],
    "hours": [
        {"hour": 0, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 6.5},
        {"hour": 1, "demand_kwh": 160, "solar_kwh": 0, "tariff_bdt_per_kwh": 6.0},
        {"hour": 2, "demand_kwh": 150, "solar_kwh": 0, "tariff_bdt_per_kwh": 5.5},
        {"hour": 3, "demand_kwh": 150, "solar_kwh": 0, "tariff_bdt_per_kwh": 5.5},
        {"hour": 4, "demand_kwh": 160, "solar_kwh": 0, "tariff_bdt_per_kwh": 6.0},
        {"hour": 5, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 6.5},
        {"hour": 6, "demand_kwh": 220, "solar_kwh": 15, "tariff_bdt_per_kwh": 7.5},
        {"hour": 7, "demand_kwh": 260, "solar_kwh": 50, "tariff_bdt_per_kwh": 8.0},
        {"hour": 8, "demand_kwh": 320, "solar_kwh": 120, "tariff_bdt_per_kwh": 9.5},
        {"hour": 9, "demand_kwh": 380, "solar_kwh": 200, "tariff_bdt_per_kwh": 10.0},
        {"hour": 10, "demand_kwh": 420, "solar_kwh": 280, "tariff_bdt_per_kwh": 10.5},
        {"hour": 11, "demand_kwh": 450, "solar_kwh": 320, "tariff_bdt_per_kwh": 11.0},
        {"hour": 12, "demand_kwh": 460, "solar_kwh": 340, "tariff_bdt_per_kwh": 11.0},
        {"hour": 13, "demand_kwh": 440, "solar_kwh": 310, "tariff_bdt_per_kwh": 10.5},
        {"hour": 14, "demand_kwh": 410, "solar_kwh": 260, "tariff_bdt_per_kwh": 10.0},
        {"hour": 15, "demand_kwh": 380, "solar_kwh": 180, "tariff_bdt_per_kwh": 9.5},
        {"hour": 16, "demand_kwh": 350, "solar_kwh": 90, "tariff_bdt_per_kwh": 9.0},
        {"hour": 17, "demand_kwh": 330, "solar_kwh": 20, "tariff_bdt_per_kwh": 10.0},
        {"hour": 18, "demand_kwh": 370, "solar_kwh": 0, "tariff_bdt_per_kwh": 13.5},
        {"hour": 19, "demand_kwh": 400, "solar_kwh": 0, "tariff_bdt_per_kwh": 15.0},
        {"hour": 20, "demand_kwh": 390, "solar_kwh": 0, "tariff_bdt_per_kwh": 14.5},
        {"hour": 21, "demand_kwh": 340, "solar_kwh": 0, "tariff_bdt_per_kwh": 12.0},
        {"hour": 22, "demand_kwh": 260, "solar_kwh": 0, "tariff_bdt_per_kwh": 9.0},
        {"hour": 23, "demand_kwh": 200, "solar_kwh": 0, "tariff_bdt_per_kwh": 7.0}
    ],
    "battery": {
        "capacity_kwh": 500,
        "initial_energy_kwh": 200,
        "minimum_energy_kwh": 50,
        "max_charge_kwh_per_hour": 100,
        "max_discharge_kwh_per_hour": 100
    }
}

def main():
    parser = argparse.ArgumentParser(description="Test GridWise API Endpoint")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="Base URL of service")
    args = parser.parse_args()

    base_url = args.url.rstrip("/")
    print(f"\n=======================================================")
    print(f"Testing GridWise Service at: {base_url}")
    print(f"=======================================================\n")

    with httpx.Client(timeout=30.0) as client:
        # 1. Test /health
        print("1. Checking GET /health ...")
        try:
            r_health = client.get(f"{base_url}/health")
            print(f"   Status Code: {r_health.status_code}")
            print(f"   Response: {r_health.json()}")
            assert r_health.status_code == 200
            assert r_health.json() == {"status": "ok"}
            print("   [PASS] /health is ready!")
        except Exception as e:
            print(f"   [FAIL] /health error: {e}")
            sys.exit(1)

        # 2. Test /optimize-energy
        print("\n2. Checking POST /optimize-energy ...")
        try:
            r_opt = client.post(f"{base_url}/optimize-energy", json=SAMPLE_PAYLOAD)
            print(f"   Status Code: {r_opt.status_code}")
            if r_opt.status_code != 200:
                print(f"   Response Text: {r_opt.text}")
                sys.exit(1)

            data = r_opt.json()
            print(f"   Scenario ID: {data['scenario_id']}")
            print(f"   Total Grid Energy: {data['total_grid_kwh']} kWh")
            print(f"   Total Cost: {data['total_cost_bdt']} BDT")
            print(f"   Peak Grid: {data['peak_grid_kwh']} kWh")
            print(f"\n   Directive Interpretations:")
            for d in data["directive_interpretation"]:
                print(f"     - Note {d['note_index']}: type={d['directive_type']}, applies={d['applies']}, adj={d['structured_adjustment']}")
            print(f"\n   Plan Summary:\n   {data['plan_summary']}")
            print("\n   [PASS] /optimize-energy returned valid schedule!")
        except Exception as e:
            print(f"   [FAIL] /optimize-energy error: {e}")
            sys.exit(1)

    print("\nAll pre-flight checks passed successfully!\n")

if __name__ == "__main__":
    main()
