from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SCHEMA_VERSION = 1
VALID_STATES = {
    "UNKNOWN",
    "WAITING_FOR_SOURCE",
    "NORMALIZING",
    "BUILDING",
    "VALIDATING",
    "PUBLISHING",
    "READY",
    "FAILED",
}
DEFAULT_STATUS_ROOT = Path(
    os.getenv(
        "WAVE_PIPELINE_STATUS_ROOT",
        str(ROOT / "wavetiles" / ".normalized-product-stage" / ".status"),
    )
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def status_path(model: str, root: Path | None = None) -> Path:
    normalized_model = model.strip().upper()
    if not normalized_model or not normalized_model.replace("_", "").isalnum():
        raise ValueError(f"invalid model name: {model!r}")
    return (root or DEFAULT_STATUS_ROOT) / f"{normalized_model}.json"


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
        "model": model.strip().upper(),
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
