import numpy as np
from scipy.optimize import linprog
from typing import List, Tuple, Dict, Any, Optional
from .schemas import (
    OptimizeEnergyRequest,
    HourlyPlanEntry,
    DirectiveInterpretationEntry,
    BatteryAction
)

def solve_energy_schedule(
    request: OptimizeEnergyRequest,
    directives: List[DirectiveInterpretationEntry]
) -> Tuple[List[HourlyPlanEntry], float, float, float]:
    """
    Formulates and solves the 24-hour campus energy optimization problem
    as a Linear Program (LP) using SciPy's HiGHS solver.

    Minimizes total grid electricity purchase cost subject to:
    - Hourly campus demand balance
    - Effective solar limits (including solar_reduction)
    - Battery bounds & dynamic minimum reserve
    - Battery charge/discharge rate limits
    - Directive windows (no_charge, no_discharge, max_grid)
    - End-of-day battery neutrality (E_23 == initial_energy_kwh)
    """
    T = 24
    hours_data = request.hours
    battery = request.battery

    # 1. Initialize hourly directive parameters
    effective_solar = [h.solar_kwh for h in hours_data]
    min_reserve = [battery.minimum_energy_kwh for _ in range(T)]
    allow_charge = [True] * T
    allow_discharge = [True] * T
    max_grid_limit = [float("inf")] * T

    # 2. Apply validated directives
    for entry in directives:
        if not entry.applies or entry.directive_type == "no_op" or not entry.structured_adjustment:
            continue

        adj = entry.structured_adjustment
        # Handle dict or Pydantic model
        adj_dict = adj if isinstance(adj, dict) else adj.model_dump()
        affected_hours = adj_dict.get("hours", [])

        if entry.directive_type == "solar_reduction":
            factor = float(adj_dict.get("factor", 1.0))
            for h in affected_hours:
                if 0 <= h < T:
                    effective_solar[h] = hours_data[h].solar_kwh * factor

        elif entry.directive_type == "minimum_battery_reserve":
            req_min = float(adj_dict.get("minimum_energy_kwh", battery.minimum_energy_kwh))
            for h in affected_hours:
                if 0 <= h < T:
                    min_reserve[h] = max(min_reserve[h], req_min)

        elif entry.directive_type == "no_charge_window":
            for h in affected_hours:
                if 0 <= h < T:
                    allow_charge[h] = False

        elif entry.directive_type == "no_discharge_window":
            for h in affected_hours:
                if 0 <= h < T:
                    allow_discharge[h] = False

        elif entry.directive_type == "max_grid_window":
            cap = float(adj_dict.get("max_grid_kwh", 0.0))
            for h in affected_hours:
                if 0 <= h < T:
                    max_grid_limit[h] = min(max_grid_limit[h], cap)

    # 3. Formulate Linear Program
    # Decision variables per hour h:
    # idx 0: G_h (grid_kwh)
    # idx 1: S_h (solar_used_kwh)
    # idx 2: C_h (battery_charge_kwh)
    # idx 3: D_h (battery_discharge_kwh)
    # idx 4: E_h (battery_energy_after_kwh)
    num_vars_per_hour = 5
    total_vars = T * num_vars_per_hour

    def var_idx(h: int, var_type: int) -> int:
        return h * num_vars_per_hour + var_type

    # Objective coefficients
    c = np.zeros(total_vars)
    # Small epsilon to avoid degenerate simultaneous charge & discharge and battery cycling
    eps_cycle = 1e-5

    for h in range(T):
        tariff = hours_data[h].tariff_bdt_per_kwh
        c[var_idx(h, 0)] = tariff              # Cost of grid electricity
        c[var_idx(h, 1)] = 0.0                 # Solar is free
        c[var_idx(h, 2)] = eps_cycle           # Slight penalty for battery charge
        c[var_idx(h, 3)] = eps_cycle           # Slight penalty for battery discharge
        c[var_idx(h, 4)] = 0.0                 # Energy level

    # Variable bounds
    bounds = []
    for h in range(T):
        # G_h: [0, max_grid_limit[h]]
        bounds.append((0.0, max_grid_limit[h]))
        # S_h: [0, effective_solar[h]]
        bounds.append((0.0, max(0.0, effective_solar[h])))
        # C_h: [0, max_charge_kwh_per_hour] (or 0 if no_charge)
        max_ch = battery.max_charge_kwh_per_hour if allow_charge[h] else 0.0
        bounds.append((0.0, max(0.0, max_ch)))
        # D_h: [0, max_discharge_kwh_per_hour] (or 0 if no_discharge)
        max_dis = battery.max_discharge_kwh_per_hour if allow_discharge[h] else 0.0
        bounds.append((0.0, max(0.0, max_dis)))
        # E_h: [min_reserve[h], capacity_kwh]
        bounds.append((min_reserve[h], battery.capacity_kwh))

    # Equality constraints: A_eq @ x == b_eq
    # 1. Energy balance for each hour: G_h + S_h + D_h - C_h = demand_h  (T rows)
    # 2. Battery state transition:
    #    h=0: E_0 - C_0 + D_0 = initial_energy_kwh
    #    h>0: E_h - E_{h-1} - C_h + D_h = 0  (T rows)
    # 3. End-of-day battery neutrality: E_23 = initial_energy_kwh  (1 row)
    num_eq = T + T + 1
    A_eq = np.zeros((num_eq, total_vars))
    b_eq = np.zeros(num_eq)

    row = 0
    # Energy balance
    for h in range(T):
        A_eq[row, var_idx(h, 0)] = 1.0   # G_h
        A_eq[row, var_idx(h, 1)] = 1.0   # S_h
        A_eq[row, var_idx(h, 3)] = 1.0   # D_h
        A_eq[row, var_idx(h, 2)] = -1.0  # -C_h
        b_eq[row] = hours_data[h].demand_kwh
        row += 1

    # Battery transitions
    # Hour 0
    A_eq[row, var_idx(0, 4)] = 1.0   # E_0
    A_eq[row, var_idx(0, 2)] = -1.0  # -C_0
    A_eq[row, var_idx(0, 3)] = 1.0   # +D_0
    b_eq[row] = battery.initial_energy_kwh
    row += 1

    # Hours 1 to 23
    for h in range(1, T):
        A_eq[row, var_idx(h, 4)] = 1.0      # E_h
        A_eq[row, var_idx(h - 1, 4)] = -1.0 # -E_{h-1}
        A_eq[row, var_idx(h, 2)] = -1.0     # -C_h
        A_eq[row, var_idx(h, 3)] = 1.0      # +D_h
        b_eq[row] = 0.0
        row += 1

    # End of day neutrality: E_{23} == initial_energy_kwh
    A_eq[row, var_idx(T - 1, 4)] = 1.0
    b_eq[row] = battery.initial_energy_kwh
    row += 1

    # 4. Solve using HiGHS
    res = linprog(
        c=c,
        A_eq=A_eq,
        b_eq=b_eq,
        bounds=bounds,
        method="highs"
    )

    if not res.success:
        # If strictly constrained or unfeasible due to excessive directives, fallback relax grid limits
        raise RuntimeError(f"Optimizer failed to find feasible schedule: {res.message}")

    x = res.x

    # 5. Build Hourly Plan
    hourly_plan: List[HourlyPlanEntry] = []
    total_grid_kwh = 0.0
    total_cost_bdt = 0.0
    peak_grid_kwh = 0.0

    for h in range(T):
        g_val = max(0.0, float(x[var_idx(h, 0)]))
        s_val = max(0.0, float(x[var_idx(h, 1)]))
        c_val = max(0.0, float(x[var_idx(h, 2)]))
        d_val = max(0.0, float(x[var_idx(h, 3)]))
        e_val = max(0.0, float(x[var_idx(h, 4)]))

        # Classify battery action
        action: BatteryAction = "idle"
        act_kwh = 0.0

        if c_val > 1e-4 and c_val >= d_val:
            action = "charge"
            act_kwh = c_val
        elif d_val > 1e-4 and d_val > c_val:
            action = "discharge"
            act_kwh = d_val
        else:
            action = "idle"
            act_kwh = 0.0

        # Adjust solar or grid for micro precision rounding to perfectly satisfy energy balance
        # grid_kwh + solar_used_kwh + battery_discharge_kwh = demand_kwh + battery_charge_kwh
        dem = hours_data[h].demand_kwh
        net_battery = (act_kwh if action == "discharge" else 0.0) - (act_kwh if action == "charge" else 0.0)
        
        # Energy balance adjustment
        balance_discrepancy = dem - (g_val + s_val + net_battery)
        if abs(balance_discrepancy) > 1e-6:
            g_val += balance_discrepancy
            g_val = max(0.0, g_val)

        # Rounding
        g_round = round(g_val, 4)
        s_round = round(s_val, 4)
        act_round = round(act_kwh, 4)
        e_round = round(e_val, 4)

        if h == T - 1:
            # Enforce exact end-of-day neutrality to 4 decimal places
            e_round = round(battery.initial_energy_kwh, 4)

        total_grid_kwh += g_round
        total_cost_bdt += g_round * hours_data[h].tariff_bdt_per_kwh
        if g_round > peak_grid_kwh:
            peak_grid_kwh = g_round

        hourly_plan.append(
            HourlyPlanEntry(
                hour=h,
                grid_kwh=g_round,
                solar_used_kwh=s_round,
                battery_action=action,
                battery_kwh=act_round,
                battery_energy_after_kwh=e_round
            )
        )

    total_grid_kwh = round(total_grid_kwh, 4)
    total_cost_bdt = round(total_cost_bdt, 4)
    peak_grid_kwh = round(peak_grid_kwh, 4)

    return hourly_plan, total_grid_kwh, total_cost_bdt, peak_grid_kwh
