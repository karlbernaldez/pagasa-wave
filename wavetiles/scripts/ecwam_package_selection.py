#!/usr/bin/env python3
"""Select one complete ECWAM source cycle for a forecast package date."""

from __future__ import annotations

import argparse
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

CYCLE_RE = re.compile(r"\d{10}")
PACKAGE_DATE_RE = re.compile(r"(\d{4})-?(\d{2})-?(\d{2})")
ECWAM_FILE_RE = re.compile(
    r"^W1P(?P<cycle_mmdd>\d{4})(?P<cycle_hhmm>\d{4})(?P<valid_mmddhh>\d{6})(?P<suffix>\d{3})$"
)


def parse_package_date(raw: str) -> date:
    match = PACKAGE_DATE_RE.fullmatch(raw)
    if not match:
        raise ValueError(f"invalid package date {raw!r}; expected YYYY-MM-DD or YYYYMMDD")
    return date(*map(int, match.groups()))


def required_valid_times(package_date: date) -> tuple[datetime, ...]:
    start = datetime(package_date.year, package_date.month, package_date.day)
    return (
        start,
        start + timedelta(hours=24),
        start + timedelta(hours=36),
        start + timedelta(hours=48),
    )


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
    cycles = (
        sorted(
            (path for path in input_root.iterdir() if path.is_dir() and CYCLE_RE.fullmatch(path.name)),
            key=lambda path: path.name,
            reverse=True,
        )
        if input_root.is_dir()
        else []
    )
    return next((path for path in cycles if cycle_is_complete(path, package_date)), None)


def print_manifest(input_root: Path, package_date: date, source_cycle: str | None) -> int:
    cycle_dir = input_root / source_cycle if source_cycle else select_source_cycle(input_root, package_date)
    if cycle_dir is None:
        return 1
    available = files_by_valid_time(cycle_dir)
    required = required_valid_times(package_date)
    if not all(value in available for value in required):
        return 1
    labels = ("analysis", "24h", "36h", "48h")
    tag = package_tag(package_date)
    for label, valid in zip(labels, required):
        stamp = valid.strftime("%Y%m%d%H")
        print(f"{label}|{stamp}|{tag}|{available[valid]}|{cycle_dir.name}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    today_parser = subparsers.add_parser("today")
    today_parser.add_argument("--timezone", default="Asia/Manila")
    select_parser = subparsers.add_parser("select")
    select_parser.add_argument("input_root", type=Path)
    select_parser.add_argument("package_date")
    manifest_parser = subparsers.add_parser("manifest")
    manifest_parser.add_argument("input_root", type=Path)
    manifest_parser.add_argument("package_date")
    manifest_parser.add_argument("--source-cycle")
    args = parser.parse_args()
    if args.command == "today":
        print(datetime.now(tz=ZoneInfo(args.timezone)).date().isoformat())
        return 0
    parsed_date = parse_package_date(args.package_date)
    if args.command == "select":
        selected = select_source_cycle(args.input_root, parsed_date)
        if selected is None:
            return 1
        print(selected.name)
        return 0
    return print_manifest(args.input_root, parsed_date, args.source_cycle)


if __name__ == "__main__":
    raise SystemExit(main())
