#!/usr/bin/env python3
"""Read WaveLab's per-model preferred source-cycle hour with an 18Z default."""

from __future__ import annotations

import json
import os
from datetime import date, timedelta
from pathlib import Path

DEFAULT_SOURCE_CYCLE_HOUR_UTC = 18
STANDARD_SOURCE_CYCLE_HOURS_UTC = (0, 6, 12, 18)
DEFAULT_SOURCE_CYCLE_DATE_MODE = "automatic"
SOURCE_CYCLE_DATE_MODES = ("automatic", "same_day", "previous_day")
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_POLICY_PATH = PROJECT_ROOT / "backend" / "tmp" / "wave-ops" / "source-cycle-policy.json"


def policy_path() -> Path:
    return Path(os.environ.get("WAVE_SOURCE_CYCLE_POLICY_PATH", DEFAULT_POLICY_PATH)).resolve()


def allowed_hours(model: str) -> tuple[int, ...]:
    return STANDARD_SOURCE_CYCLE_HOURS_UTC if model.upper() in {"WW3", "ECWAM"} else tuple(range(24))


def _model_policy(model: str) -> dict:
    code = model.strip().upper()
    try:
        payload = json.loads(policy_path().read_text(encoding="utf-8"))
        value = payload.get("models", {}).get(code, {})
    except (FileNotFoundError, json.JSONDecodeError, OSError, TypeError, AttributeError):
        return {}
    return value if isinstance(value, dict) else {}


def preferred_cycle_hour(model: str) -> int:
    code = model.strip().upper()
    allowed = allowed_hours(code)
    value = _model_policy(code).get("preferredHourUtc")
    if isinstance(value, int) and value in allowed:
        return value
    return DEFAULT_SOURCE_CYCLE_HOUR_UTC


def cycle_date_mode(model: str) -> str:
    value = _model_policy(model).get("cycleDateMode")
    return value if value in SOURCE_CYCLE_DATE_MODES else DEFAULT_SOURCE_CYCLE_DATE_MODE


def source_cycle_date(
    package_date: date,
    model: str,
    cycle_hour: int | None = None,
    date_mode: str | None = None,
) -> date:
    hour = preferred_cycle_hour(model) if cycle_hour is None else int(cycle_hour)
    mode = cycle_date_mode(model) if date_mode is None else date_mode
    if mode not in SOURCE_CYCLE_DATE_MODES:
        mode = DEFAULT_SOURCE_CYCLE_DATE_MODE

    if mode == "same_day":
        return package_date
    if mode == "previous_day":
        return package_date - timedelta(days=1)
    return package_date if hour == 0 else package_date - timedelta(days=1)
