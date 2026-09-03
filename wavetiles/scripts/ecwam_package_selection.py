#!/usr/bin/env python3
"""Select the required aligned ECWAM source cycle for a forecast package date."""

from __future__ import annotations

import argparse
import re
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

CYCLE_RE = re.compile(r"\d{10}")
PACKAGE_DATE_RE = re.compile(r"(\d{4})-?(\d{2})-?(\d{2})")
ECWAM_FILE_RE = re.compile(
    r"^W1P(?P<cycle_mmdd>\d{4})(?P<cycle_hhmm>\d{4})(?P<valid_mmddhh>\d{6})(?P<suffix>\d{3})$"
)
REQUIRED_FORECAST_HOURS = tuple(range(0, 61, 3))
TARGET_CYCLE_HOUR = 18


def parse_package_date(raw: str) -> date:
    match = PACKAGE_DATE_RE.fullmatch(raw)
    if not match:
        raise ValueError(f"invalid package date {raw!r}; expected YYYY-MM-DD or YYYYMMDD")
    return date(*map(int, match.groups()))


def target_source_cycle(package_date: date) -> datetime:
    return datetime.combine(package_date - timedelta(days=1), time(hour=TARGET_CYCLE_HOUR))


def required_valid_times(package_date: date) -> tuple[datetime, ...]:
    start = target_source_cycle(package_date)
    return tuple(start + timedelta(hours=hour) for hour in REQUIRED_FORECAST_HOURS)


def forecast_valid_time(package_date: date, forecast_hour: int) -> datetime:
    if forecast_hour not in REQUIRED_FORECAST_HOURS:
        raise ValueError("forecast hour must be from 0 through 60 in 3-hour increments")
    return target_source_cycle(package_date) + timedelta(hours=forecast_hour)


def package_tag(package_date: date) -> str:
    months = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
    return f"{package_date.year}{months[package_date.month - 1]}{package_date.day:02d}"


def valid_time_from_name(path: Path, cycle_time: datetime) -> datetime | None:
    match = ECWAM_FILE_RE.fullmatch(path.name)
    if not match:
        return None

    expected_cycle_mmdd = cycle_time.strftime("%m%d")
    expected_cycle_hhmm = cycle_time.strftime("%H") + "00"
    if (
        match.group("cycle_mmdd") != expected_cycle_mmdd
        or match.group("cycle_hhmm") != expected_cycle_hhmm
    ):
        return None

    raw = match.group("valid_mmddhh")
    month, day, hour = int(raw[:2]), int(raw[2:4]), int(raw[4:])
    candidates = []
    for year in (cycle_time.year - 1, cycle_time.year, cycle_time.year + 1):
        try:
            candidates.append(datetime(year, month, day, hour))
        except ValueError:
            pass
    if not candidates:
        return None
    return min(candidates, key=lambda value: abs(value - cycle_time))


def files_by_valid_time(cycle_dir: Path) -> dict[datetime, Path]:
    if not cycle_dir.is_dir() or not CYCLE_RE.fullmatch(cycle_dir.name):
        return {}
    cycle_time = datetime.strptime(cycle_dir.name, "%Y%m%d%H")
    result: dict[datetime, Path] = {}
    for path in cycle_dir.iterdir():
        if not path.is_file() or ".idx" in path.name:
            continue
        valid = valid_time_from_name(path, cycle_time)
        if valid is None:
            continue
        previous = result.get(valid)
        if previous is None or (not previous.name.endswith("001") and path.name.endswith("001")):
            result[valid] = path
    return result


def cycle_is_complete(cycle_dir: Path, package_date: date) -> bool:
    available = files_by_valid_time(cycle_dir)
    return all(value in available for value in required_valid_times(package_date))


def select_source_cycle(input_root: Path, package_date: date) -> Path | None:
    target = input_root / target_source_cycle(package_date).strftime("%Y%m%d%H")
    return target if cycle_is_complete(target, package_date) else None


def resolve_cycle_dir(input_root: Path, package_date: date, source_cycle: str | None) -> Path | None:
    target_name = target_source_cycle(package_date).strftime("%Y%m%d%H")
    if source_cycle and source_cycle != target_name:
        return None
    cycle_dir = input_root / target_name
    if not cycle_is_complete(cycle_dir, package_date):
        return None
    return cycle_dir


def print_manifest(input_root: Path, package_date: date, source_cycle: str | None) -> int:
    cycle_dir = resolve_cycle_dir(input_root, package_date, source_cycle)
    if cycle_dir is None:
        return 1
    available = files_by_valid_time(cycle_dir)
    tag = package_tag(package_date)
    for forecast_hour, valid in zip(REQUIRED_FORECAST_HOURS, required_valid_times(package_date)):
        stamp = valid.strftime("%Y%m%d%H")
        print(f"{forecast_hour}h|{stamp}|{tag}|{available[valid]}|{cycle_dir.name}")
    return 0


def print_frame(
    input_root: Path,
    package_date: date,
    forecast_hour: int,
    source_cycle: str | None,
) -> int:
    cycle_dir = resolve_cycle_dir(input_root, package_date, source_cycle)
    if cycle_dir is None:
        return 1

    try:
        valid = forecast_valid_time(package_date, forecast_hour)
    except ValueError:
        return 1
    available = files_by_valid_time(cycle_dir)
    gribfile = available.get(valid)
    if gribfile is None:
        return 1

    stamp = valid.strftime("%Y%m%d%H")
    print(f"{forecast_hour}h|{stamp}|{package_tag(package_date)}|{gribfile}|{cycle_dir.name}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    today_parser = subparsers.add_parser("today")
    today_parser.add_argument("--timezone", default="Asia/Manila")
    target_parser = subparsers.add_parser("target")
    target_parser.add_argument("package_date")
    select_parser = subparsers.add_parser("select")
    select_parser.add_argument("input_root", type=Path)
    select_parser.add_argument("package_date")
    manifest_parser = subparsers.add_parser("manifest")
    manifest_parser.add_argument("input_root", type=Path)
    manifest_parser.add_argument("package_date")
    manifest_parser.add_argument("--source-cycle")
    frame_parser = subparsers.add_parser("frame")
    frame_parser.add_argument("input_root", type=Path)
    frame_parser.add_argument("package_date")
    frame_parser.add_argument("--forecast-hour", required=True, type=int)
    frame_parser.add_argument("--source-cycle")
    args = parser.parse_args()

    if args.command == "today":
        print(datetime.now(tz=ZoneInfo(args.timezone)).date().isoformat())
        return 0

    parsed_date = parse_package_date(args.package_date)
    if args.command == "target":
        print(target_source_cycle(parsed_date).strftime("%Y%m%d%H"))
        return 0
    if args.command == "select":
        selected = select_source_cycle(args.input_root, parsed_date)
        if selected is None:
            return 1
        print(selected.name)
        return 0
    if args.command == "manifest":
        return print_manifest(args.input_root, parsed_date, args.source_cycle)
    return print_frame(args.input_root, parsed_date, args.forecast_hour, args.source_cycle)


if __name__ == "__main__":
    raise SystemExit(main())
