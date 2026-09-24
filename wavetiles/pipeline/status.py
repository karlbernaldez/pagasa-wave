from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SCHEMA_VERSION = 1
HISTORY_SCHEMA_VERSION = 1
VALID_STATES = {
    "UNKNOWN",
    "WAITING_FOR_SOURCE",
    "READY_TO_BUILD",
    "NORMALIZING",
    "BUILDING",
    "VALIDATING",
    "PUBLISHING",
    "READY",
    "FAILED",
}
TERMINAL_STATES = {"READY", "FAILED"}
DEFAULT_STATUS_ROOT = Path(
    os.getenv(
        "WAVE_PIPELINE_STATUS_ROOT",
        str(ROOT / "wavetiles" / ".normalized-product-stage" / ".status"),
    )
)
DEFAULT_HISTORY_ROOT = Path(
    os.getenv(
        "WAVE_PIPELINE_HISTORY_ROOT",
        str(ROOT / "wavetiles" / ".normalized-product-stage" / ".history"),
    )
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _normalized_model(model: str) -> str:
    normalized = model.strip().upper()
    if not normalized or not normalized.replace("_", "").isalnum():
        raise ValueError(f"invalid model name: {model!r}")
    return normalized


def status_path(model: str, root: Path | None = None) -> Path:
    return (root or DEFAULT_STATUS_ROOT) / f"{_normalized_model(model)}.json"


def history_path(model: str, root: Path | None = None) -> Path:
    return (root or DEFAULT_HISTORY_ROOT) / f"{_normalized_model(model)}.jsonl"


def _duration_seconds(started_at: str | None, completed_at: str | None) -> float | None:
    if not started_at or not completed_at:
        return None
    try:
        started = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        completed = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
    except ValueError:
        return None
    duration = (completed - started).total_seconds()
    return round(duration, 1) if duration >= 0 else None


def append_run_history(
    model: str,
    state: str,
    *,
    run_id: str,
    root: Path | None = None,
    package_date: str | None = None,
    required_source_cycle: str | None = None,
    source_cycle: str | None = None,
    input_mode: str | None = None,
    frame_count: int | None = None,
    expected_frame_count: int | None = None,
    published: bool | None = None,
    started_at: str | None = None,
    completed_at: str | None = None,
    error: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    normalized_state = state.strip().upper()
    if normalized_state not in TERMINAL_STATES:
        raise ValueError(f"history state must be terminal: {state!r}")
    normalized_run_id = run_id.strip()
    if not normalized_run_id:
        raise ValueError("run_id is required for pipeline history")

    target = history_path(model, root)
    target.parent.mkdir(parents=True, exist_ok=True)
    document: dict[str, Any] = {
        "schemaVersion": HISTORY_SCHEMA_VERSION,
        "eventType": "pipeline_run",
        "runId": normalized_run_id,
        "model": _normalized_model(model),
        "outcome": normalized_state,
        "recordedAt": utc_now(),
    }
    optional = {
        "packageDate": package_date,
        "requiredSourceCycle": required_source_cycle,
        "sourceCycle": source_cycle,
        "inputMode": input_mode,
        "frameCount": frame_count,
        "expectedFrameCount": expected_frame_count,
        "published": published,
        "startedAt": started_at,
        "completedAt": completed_at,
        "durationSeconds": _duration_seconds(started_at, completed_at),
        "error": error,
    }
    document.update({key: value for key, value in optional.items() if value is not None})
    if extra:
        document.update(extra)

    payload = json.dumps(document, sort_keys=True, separators=(",", ":")) + "\n"
    fd = os.open(target, os.O_APPEND | os.O_CREAT | os.O_WRONLY, 0o640)
    try:
        with os.fdopen(fd, "a", encoding="utf-8") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        raise

    return document


def write_status(
    model: str,
    state: str,
    *,
    root: Path | None = None,
    message: str | None = None,
    package_date: str | None = None,
    required_source_cycle: str | None = None,
    source_cycle: str | None = None,
    input_mode: str | None = None,
    frame_count: int | None = None,
    expected_frame_count: int | None = None,
    published: bool | None = None,
    started_at: str | None = None,
    completed_at: str | None = None,
    error: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    normalized_state = state.strip().upper()
    if normalized_state not in VALID_STATES:
        raise ValueError(f"invalid pipeline state: {state!r}")

    target = status_path(model, root)
    target.parent.mkdir(parents=True, exist_ok=True)
    checked_at = utc_now()
    document: dict[str, Any] = {
        "schemaVersion": SCHEMA_VERSION,
        "model": _normalized_model(model),
        "state": normalized_state,
        "lastCheckAt": checked_at,
    }
    optional = {
        "message": message,
        "packageDate": package_date,
        "requiredSourceCycle": required_source_cycle,
        "sourceCycle": source_cycle,
        "inputMode": input_mode,
        "frameCount": frame_count,
        "expectedFrameCount": expected_frame_count,
        "published": published,
        "startedAt": started_at,
        "completedAt": completed_at,
        "error": error,
    }
    document.update({key: value for key, value in optional.items() if value is not None})
    if extra:
        document.update(extra)

    fd, temporary_name = tempfile.mkstemp(prefix=f".{target.name}.", dir=target.parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(document, handle, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, target)
    except Exception:
        temporary.unlink(missing_ok=True)
        raise

    return document
