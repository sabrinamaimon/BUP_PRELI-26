import json
import time
from pathlib import Path
from app.schemas import OptimizeEnergyRequest, DirectiveInterpretationEntry
from app.optimizer import solve_energy_schedule
from app.verifier import verify_and_recalculate_schedule

def load_sample_request() -> OptimizeEnergyRequest:
    json_path = Path(__file__).parent / "sample_request.json"
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return OptimizeEnergyRequest(**data)

def test_optimizer_baseline_and_directives():
    req = load_sample_request()
    
    # Directives corresponding to GRID-101
    directives = [
        DirectiveInterpretationEntry(
            note_index=0,
            applies=True,
            directive_type="solar_reduction",
            structured_adjustment={"hours": [13, 14], "factor": 0.2},
            explanation="Solar output drop to 20% from 1 PM to 3 PM."
        ),
        DirectiveInterpretationEntry(
            note_index=1,
            applies=True,
            directive_type="no_charge_window",
            structured_adjustment={"hours": [14, 15]},
            explanation="Do not charge battery between 2 PM and 4 PM."
        ),
        DirectiveInterpretationEntry(
            note_index=2,
            applies=False,
            directive_type="no_op",
            structured_adjustment=None,
            explanation="Cafeteria menu note."
        )
    ]

    start = time.perf_counter()
    plan, total_grid, total_cost, peak_grid = solve_energy_schedule(req, directives)
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Ensure lightning-fast execution (< 100ms)
    assert elapsed_ms < 100, f"Optimizer took too long: {elapsed_ms:.1f}ms"
    assert len(plan) == 24

    # Verify no charging in hours 14 and 15
    for h in [14, 15]:
        assert plan[h].battery_action != "charge"
        assert plan[h].battery_kwh == 0.0 or plan[h].battery_action == "discharge" or plan[h].battery_action == "idle"

    # Verify solar usage at hours 13 and 14 does not exceed 20% of original solar
    orig_solar_13 = req.hours[13].solar_kwh
    orig_solar_14 = req.hours[14].solar_kwh
    assert plan[13].solar_used_kwh <= orig_solar_13 * 0.2 + 0.01
    assert plan[14].solar_used_kwh <= orig_solar_14 * 0.2 + 0.01

    # End-of-day battery neutrality
    assert abs(plan[23].battery_energy_after_kwh - req.battery.initial_energy_kwh) < 0.01

    # Energy balance audit
    for h in range(24):
        p = plan[h]
        dem = req.hours[h].demand_kwh
        supply = p.grid_kwh + p.solar_used_kwh + (p.battery_kwh if p.battery_action == "discharge" else 0.0)
        demand_load = dem + (p.battery_kwh if p.battery_action == "charge" else 0.0)
        assert abs(supply - demand_load) < 0.01

    # Audit & recalculate
    v_grid, v_cost, v_peak, summary = verify_and_recalculate_schedule(req, directives, plan)
    assert abs(v_grid - total_grid) < 0.01
    assert abs(v_cost - total_cost) < 0.01
    assert abs(v_peak - peak_grid) < 0.01
    assert "Strategy optimized across 24 hours" in summary
