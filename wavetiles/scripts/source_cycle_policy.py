#!/usr/bin/env python3
"""Read WaveLab's per-model preferred source-cycle hour with an 18Z default."""

from __future__ import annotations

import json
import os
from pathlib import Path

DEFAULT_SOURCE_CYCLE_HOUR_UTC = 18
STANDARD_SOURCE_CYCLE_HOURS_UTC = (0, 6, 12, 18)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_POLICY_PATH = PROJECT_ROOT / "backend" / "tmp" / "wave-ops" / "source-cycle-policy.json"


def policy_path() -> Path:
    return Path(os.environ.get("WAVE_SOURCE_CYCLE_POLICY_PATH", DEFAULT_POLICY_PATH)).resolve()


def allowed_hours(model: str) -> tuple[int, ...]:
    return STANDARD_SOURCE_CYCLE_HOURS_UTC if model.upper() in {"WW3", "ECWAM"} else tuple(range(24))


def preferred_cycle_hour(model: str) -> int:
    code = model.strip().upper()
    allowed = allowed_hours(code)
    try:
        payload = json.loads(policy_path().read_text(encoding="utf-8"))
        value = payload.get("models", {}).get(code, {}).get("preferredHourUtc")
    except (FileNotFoundError, json.JSONDecodeError, OSError, TypeError):
        return DEFAULT_SOURCE_CYCLE_HOUR_UTC

    if isinstance(value, int) and value in allowed:
        return value
    return DEFAULT_SOURCE_CYCLE_HOUR_UTC
