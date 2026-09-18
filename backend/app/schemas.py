from typing import List, Optional, Literal, Union, Dict, Any
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------
# Health Schema
# ---------------------------------------------------------
class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"

# ---------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------
class HourInput(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    demand_kwh: float = Field(..., ge=0, description="Campus electricity demand in kWh")
    solar_kwh: float = Field(..., ge=0, description="Baseline solar energy available in kWh")
    tariff_bdt_per_kwh: float = Field(..., ge=0, description="Grid electricity tariff in BDT per kWh")

class BatteryInput(BaseModel):
    capacity_kwh: float = Field(..., gt=0, description="Maximum energy battery can store in kWh")
    initial_energy_kwh: float = Field(..., ge=0, description="Battery energy at start of hour 0 in kWh")
    minimum_energy_kwh: float = Field(..., ge=0, description="Base reserve level battery must not drop below")
    max_charge_kwh_per_hour: float = Field(..., ge=0, description="Max energy added in one hour (kW/h)")
    max_discharge_kwh_per_hour: float = Field(..., ge=0, description="Max energy removed in one hour (kW/h)")

class OptimizeEnergyRequest(BaseModel):
    scenario_id: str = Field(..., description="Unique scenario identifier")
    operator_notes: List[str] = Field(..., min_length=1, max_length=3, description="1 to 3 operator natural-language notes")
    hours: List[HourInput] = Field(..., description="Hourly energy parameters for exactly 24 hours")
    battery: BatteryInput = Field(..., description="Battery technical specifications")

    @field_validator("hours")
    @classmethod
    def validate_hours_length_and_sequence(cls, v: List[HourInput]) -> List[HourInput]:
        if len(v) != 24:
            raise ValueError(f"The 'hours' array must contain exactly 24 entries (received {len(v)}).")
        hours_list = [entry.hour for entry in v]
        if hours_list != list(range(24)):
            raise ValueError("The 'hours' array must be strictly indexed from 0 through 23 in sequence.")
        return v

# ---------------------------------------------------------
# Directive Interpretation Schemas
# ---------------------------------------------------------
DirectiveType = Literal[
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op"
]

class SolarReductionAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Affected hours (0-23)")
    factor: float = Field(..., ge=0.0, le=1.0, description="Usable fraction remaining (e.g. 0.2 for 80% reduction)")

class MinimumBatteryReserveAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Affected hours (0-23)")
    minimum_energy_kwh: float = Field(..., ge=0.0, description="Minimum battery reserve required")

class NoChargeWindowAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Affected hours (0-23)")

class NoDischargeWindowAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Affected hours (0-23)")

class MaxGridWindowAdjustment(BaseModel):
    hours: List[int] = Field(..., description="Affected hours (0-23)")
    max_grid_kwh: float = Field(..., ge=0.0, description="Maximum allowable grid import in kWh")

# Union of valid structured adjustments or None
StructuredAdjustmentUnion = Optional[
    Union[
        SolarReductionAdjustment,
        MinimumBatteryReserveAdjustment,
        NoChargeWindowAdjustment,
        NoDischargeWindowAdjustment,
        MaxGridWindowAdjustment,
        Dict[str, Any]
    ]
]

class DirectiveInterpretationEntry(BaseModel):
    note_index: int = Field(..., ge=0, description="Zero-based index corresponding to operator_notes")
    applies: bool = Field(..., description="true for applicable non-no_op directives, false only for no_op")
    directive_type: DirectiveType = Field(..., description="Identified directive type or no_op")
    structured_adjustment: StructuredAdjustmentUnion = Field(None, description="Directive parameters or null for no_op")
    explanation: str = Field(..., description="Short explanation of interpretation")

# ---------------------------------------------------------
# Hourly Plan & Optimization Response Schemas
# ---------------------------------------------------------
BatteryAction = Literal["charge", "discharge", "idle"]

class HourlyPlanEntry(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour index 0 through 23")
    grid_kwh: float = Field(..., ge=0.0, description="Grid energy purchased in this hour")
    solar_used_kwh: float = Field(..., ge=0.0, description="Solar energy utilized in this hour")
    battery_action: BatteryAction = Field(..., description="'charge', 'discharge', or 'idle'")
    battery_kwh: float = Field(..., ge=0.0, description="Magnitude of battery energy flow (0 if idle)")
    battery_energy_after_kwh: float = Field(..., ge=0.0, description="Battery state of charge at end of hour")

class OptimizeEnergyResponse(BaseModel):
    scenario_id: str = Field(..., description="Matches the incoming scenario_id")
    directive_interpretation: List[DirectiveInterpretationEntry] = Field(..., description="Interpretation for each note")
    hourly_plan: List[HourlyPlanEntry] = Field(..., description="24-hour optimized energy dispatch")
    total_grid_kwh: float = Field(..., ge=0.0, description="Sum of grid energy across 24 hours")
    total_cost_bdt: float = Field(..., ge=0.0, description="Total cost of grid electricity in BDT")
    peak_grid_kwh: float = Field(..., ge=0.0, description="Maximum single-hour grid import")
    plan_summary: str = Field(..., description="Concise human-readable explanation of optimization strategy")
