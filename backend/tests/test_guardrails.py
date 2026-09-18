import pytest
from app.guardrails import (
    parse_time_window_to_hours,
    sanitize_hours,
    validate_and_sanitize_directive,
    extract_offline_directive
)
from app.schemas import BatteryInput

@pytest.fixture
def sample_battery():
    return BatteryInput(
        capacity_kwh=500.0,
        initial_energy_kwh=200.0,
        minimum_energy_kwh=50.0,
        max_charge_kwh_per_hour=100.0,
        max_discharge_kwh_per_hour=100.0
    )

def test_time_window_parsing():
    # 1 PM to 3 PM -> [13, 14]
    assert parse_time_window_to_hours("1 PM", "3 PM") == [13, 14]
    assert parse_time_window_to_hours("13:00", "15:00") == [13, 14]
    assert parse_time_window_to_hours("9 am", "12 pm") == [9, 10, 11]
    assert parse_time_window_to_hours("2 PM", "4 PM") == [14, 15]

def test_sanitize_hours():
    assert sanitize_hours([15, 13, 14, 13]) == [13, 14, 15]
    assert sanitize_hours([-5, 0, 23, 24, 99]) == [0, 23]
    assert sanitize_hours("not a list") == []

def test_solar_reduction_guardrails(sample_battery):
    # Valid
    entry = validate_and_sanitize_directive({
        "directive_type": "solar_reduction",
        "structured_adjustment": {"hours": [13, 14], "factor": 0.2},
        "explanation": "Panel cleaning"
    }, note_index=0, battery=sample_battery)
    assert entry.applies is True
    assert entry.directive_type == "solar_reduction"
    adj = entry.structured_adjustment if isinstance(entry.structured_adjustment, dict) else entry.structured_adjustment.model_dump()
    assert adj["hours"] == [13, 14]
    assert adj["factor"] == 0.2

    # Factor clamping: > 1.0 -> clamped to 1.0, < 0.0 -> clamped to 0.0
    entry_clamped = validate_and_sanitize_directive({
        "directive_type": "solar_reduction",
        "structured_adjustment": {"hours": [13, 14], "factor": 1.5},
        "explanation": "Over factor"
    }, note_index=0, battery=sample_battery)
    adj_clamped = entry_clamped.structured_adjustment if isinstance(entry_clamped.structured_adjustment, dict) else entry_clamped.structured_adjustment.model_dump()
    assert adj_clamped["factor"] == 1.0

def test_no_op_guardrails(sample_battery):
    entry = validate_and_sanitize_directive({
        "directive_type": "no_op",
        "structured_adjustment": {"hours": [1, 2]},
        "explanation": "Cafeteria note"
    }, note_index=2, battery=sample_battery)
    assert entry.applies is False
    assert entry.directive_type == "no_op"
    assert entry.structured_adjustment is None

def test_malformed_llm_safe_fallback(sample_battery):
    # Unknown directive type -> safe fallback to no_op
    entry = validate_and_sanitize_directive({
        "directive_type": "unsupported_nuclear_power",
        "structured_adjustment": {"hours": [1]}
    }, note_index=1, battery=sample_battery)
    assert entry.applies is False
    assert entry.directive_type == "no_op"
    assert entry.structured_adjustment is None

def test_offline_extractor_distractor(sample_battery):
    entry = extract_offline_directive("The cafeteria menu changes tomorrow.", 0, sample_battery)
    assert entry.applies is False
    assert entry.directive_type == "no_op"
    assert entry.structured_adjustment is None

def test_offline_extractor_solar_reduction(sample_battery):
    entry = extract_offline_directive("Solar output will drop to about 20% from 1 PM to 3 PM.", 0, sample_battery)
    assert entry.applies is True
    assert entry.directive_type == "solar_reduction"
    adj = entry.structured_adjustment if isinstance(entry.structured_adjustment, dict) else entry.structured_adjustment.model_dump()
    assert adj["hours"] == [13, 14]
    assert abs(adj["factor"] - 0.2) < 1e-4

def test_offline_extractor_no_charge(sample_battery):
    entry = extract_offline_directive("Do not charge the battery between 2 PM and 4 PM.", 1, sample_battery)
    assert entry.applies is True
    assert entry.directive_type == "no_charge_window"
    adj = entry.structured_adjustment if isinstance(entry.structured_adjustment, dict) else entry.structured_adjustment.model_dump()
    assert adj["hours"] == [14, 15]

