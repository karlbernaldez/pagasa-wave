#!/usr/bin/env python3
"""Detect ready operational wave sources and emit one-shot builder signals."""

from __future__ import annotations

import argparse
import json
import os
import sys
import tarfile
import time
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path, PurePosixPath
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "wavetiles" / "scripts"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import ecwam_package_selection as ecwam
import ww3_package_selection as ww3
from source_cycle_policy import preferred_cycle_hour
from wavetiles.pipeline.status import status_path, write_status

MODELS = ("WW3", "ECWAM")
EXPECTED_FRAME_COUNT = 21
DEFAULT_SIGNAL_ROOT = Path(
    os.getenv("WAVE_SOURCE_SIGNAL_ROOT", "/var/lib/wavelab-wave-source-readiness")
)
DEFAULT_STATUS_ROOT = ROOT / "wavetiles" / ".normalized-product-stage" / ".status"


@dataclass(frozen=True)
class ReadinessResult:
    model: str
    package_date: date
    source_cycle: str
    preferred_hour_utc: int
    ready: bool
    reason: str


def manila_today(now: datetime | None = None) -> date:
    current = now or datetime.now(tz=ZoneInfo("Asia/Manila"))
    if current.tzinfo is None:
        current = current.replace(tzinfo=ZoneInfo("Asia/Manila"))
    return current.astimezone(ZoneInfo("Asia/Manila")).date()


def package_tag(value: date) -> str:
    months = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
    return f"{value.year}{months[value.month - 1]}{value.day:02d}"


def read_json(path: Path) -> dict | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def published_for_cycle(model: str, package_date: date, source_cycle: str) -> bool:
    metadata = read_json(
        ROOT
        / "wavetiles"
        / "tiles"
        / model
        / "contours"
        / package_tag(package_date)
        / "package.json"
    )
    if not metadata:
        return False
    return (
        metadata.get("packageDate") == package_date.isoformat()
        and metadata.get("sourceCycle") == source_cycle
        and metadata.get("requiredForecastHours") == list(range(0, 61, 3))
    )


def existing_status(model: str) -> dict | None:
    return read_json(status_path(model, DEFAULT_STATUS_ROOT))


def already_signaled_or_running(model: str, package_date: date, source_cycle: str) -> bool:
    snapshot = existing_status(model)
    if not snapshot:
        return False
    if snapshot.get("packageDate") != package_date.isoformat():
        return False
    if snapshot.get("requiredSourceCycle") != source_cycle:
        return False
    return snapshot.get("state") in {
        "READY_TO_BUILD",
        "NORMALIZING",
        "BUILDING",
        "VALIDATING",
        "PUBLISHING",
        "READY",
        "FAILED",
    }


def ww3_archive_complete(archive: Path, package_date: date, cycle_hour: int) -> bool:
    required_cycle = ww3.required_source_cycle(package_date, cycle_hour)
    expected = {
        f"{required_cycle}/ww3_grdo.{stamp[:8]}T{stamp[8:]}.nc"
        for stamp in ww3.required_valid_times(package_date, cycle_hour)
    }
    try:
        with tarfile.open(archive, "r:gz") as handle:
            names = set()
            for member in handle.getmembers():
                path = PurePosixPath(member.name)
                if path.is_absolute() or ".." in path.parts or member.issym() or member.islnk() or member.isdev():
                    return False
                if member.isfile():
                    names.add(path.as_posix())
    except (OSError, tarfile.TarError):
        return False
    return expected.issubset(names)


def assess_ww3(package_date: date) -> ReadinessResult:
    hour = preferred_cycle_hour("WW3")
    source_cycle = ww3.required_source_cycle(package_date, hour)
    input_root = Path(os.getenv("WW3_INPUT_ROOT", ROOT / "wavetiles" / "input" / "ww3"))
    staged = input_root / source_cycle
    if ww3.cycle_is_complete(staged, package_date):
        return ReadinessResult("WW3", package_date, source_cycle, hour, True, "Required WW3 cycle is staged and complete.")

    source_root = Path(os.getenv("WW3_SOURCE_ARCHIVE_DIR", "/home/darwin/ww3_nc"))
    archive = source_root / f"ww3_{source_cycle}.tar.gz"
    if not archive.is_file():
        return ReadinessResult("WW3", package_date, source_cycle, hour, False, "Required WW3 archive has not arrived yet.")

    stability_minutes = int(os.getenv("WW3_ARCHIVE_STABILITY_MINUTES", os.getenv("ARCHIVE_STABILITY_MINUTES", "10")))
    age_seconds = max(0.0, time.time() - archive.stat().st_mtime)
    if age_seconds < stability_minutes * 60:
        remaining = max(1, int((stability_minutes * 60 - age_seconds + 59) // 60))
        return ReadinessResult(
            "WW3",
            package_date,
            source_cycle,
            hour,
            False,
            f"WW3 archive is still settling; about {remaining} minute(s) remain before validation.",
        )

    if not ww3_archive_complete(archive, package_date, hour):
        return ReadinessResult("WW3", package_date, source_cycle, hour, False, "WW3 archive is stable but does not contain the complete required T+0 through T+60 cycle.")
    return ReadinessResult("WW3", package_date, source_cycle, hour, True, "Required WW3 archive is stable and complete.")


def assess_ecwam(package_date: date) -> ReadinessResult:
    hour = preferred_cycle_hour("ECWAM")
    source_cycle = ecwam.target_source_cycle(package_date, hour).strftime("%Y%m%d%H")
    input_root = Path(os.getenv("ECWAM_INPUT_ROOT", "/home/darwin/ecmwf/ecwam"))
    cycle_dir = input_root / source_cycle
    if ecwam.cycle_is_complete(cycle_dir, package_date):
        return ReadinessResult("ECWAM", package_date, source_cycle, hour, True, "Required ECWAM cycle is complete through T+60.")
    return ReadinessResult("ECWAM", package_date, source_cycle, hour, False, "Required ECWAM cycle is missing or incomplete through T+60.")


def signal_path(model: str) -> Path:
    return DEFAULT_SIGNAL_ROOT / f"{model}.ready"


def clear_signal(model: str) -> None:
    signal_path(model).unlink(missing_ok=True)


def emit_signal(result: ReadinessResult) -> None:
    DEFAULT_SIGNAL_ROOT.mkdir(parents=True, exist_ok=True)
    target = signal_path(result.model)
    temporary = target.with_name(f".{target.name}.{os.getpid()}.tmp")
    temporary.write_text(f"{result.package_date.isoformat()}|{result.source_cycle}\n", encoding="utf-8")
    os.replace(temporary, target)


def record_waiting(result: ReadinessResult) -> None:
    clear_signal(result.model)
    write_status(
        result.model,
        "WAITING_FOR_SOURCE",
        message=result.reason,
        package_date=result.package_date.isoformat(),
        required_source_cycle=result.source_cycle,
        frame_count=0,
        expected_frame_count=EXPECTED_FRAME_COUNT,
        published=False,
        extra={"preferredSourceCycleHourUtc": result.preferred_hour_utc},
    )


def record_ready(result: ReadinessResult) -> None:
    write_status(
        result.model,
        "READY_TO_BUILD",
        message=f"{result.reason} Builder signal emitted.",
        package_date=result.package_date.isoformat(),
        required_source_cycle=result.source_cycle,
        source_cycle=result.source_cycle,
        frame_count=EXPECTED_FRAME_COUNT,
        expected_frame_count=EXPECTED_FRAME_COUNT,
        published=False,
        extra={"preferredSourceCycleHourUtc": result.preferred_hour_utc},
    )
    emit_signal(result)


def scan_model(model: str, package_date: date) -> ReadinessResult:
    result = assess_ww3(package_date) if model == "WW3" else assess_ecwam(package_date)

    if published_for_cycle(model, package_date, result.source_cycle):
        clear_signal(model)
        return ReadinessResult(model, package_date, result.source_cycle, result.preferred_hour_utc, False, "Package is already published for the required source cycle.")

    if already_signaled_or_running(model, package_date, result.source_cycle):
        return ReadinessResult(model, package_date, result.source_cycle, result.preferred_hour_utc, False, "Builder was already signaled or has already processed this source cycle.")

    if result.ready:
        record_ready(result)
    else:
        record_waiting(result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Check configured WaveLab source cycles and emit builder-ready signals.")
    parser.add_argument("--model", choices=MODELS, action="append", dest="models")
    parser.add_argument("--package-date", type=date.fromisoformat)
    args = parser.parse_args()

    package_date = args.package_date or manila_today()
    models = tuple(args.models or MODELS)
    for model in models:
        result = scan_model(model, package_date)
        print(
            json.dumps(
                {
                    "model": result.model,
                    "packageDate": result.package_date.isoformat(),
                    "sourceCycle": result.source_cycle,
                    "preferredSourceCycleHourUtc": result.preferred_hour_utc,
                    "ready": result.ready,
                    "reason": result.reason,
                },
                sort_keys=True,
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
