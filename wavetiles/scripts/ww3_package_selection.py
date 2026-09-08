#!/usr/bin/env python3
"""Select the configured previous-day WW3 source cycle for a forecast package date."""

from __future__ import annotations

import argparse
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from source_cycle_policy import preferred_cycle_hour

CYCLE_RE = re.compile(r"\d{10}")
PACKAGE_DATE_RE = re.compile(r"(\d{4})-?(\d{2})-?(\d{2})")
REQUIRED_FORECAST_HOURS = tuple(range(0, 61, 3))


def parse_package_date(raw: str) -> date:
    match = PACKAGE_DATE_RE.fullmatch(raw)
    if not match:
        raise ValueError(f"invalid package date {raw!r}; expected YYYY-MM-DD or YYYYMMDD")
    return date(*map(int, match.groups()))


def manila_today(now: datetime | None = None) -> date:
    current = now or datetime.now(tz=ZoneInfo("Asia/Manila"))
    if current.tzinfo is None:
        current = current.replace(tzinfo=ZoneInfo("Asia/Manila"))
    return current.astimezone(ZoneInfo("Asia/Manila")).date()


def source_cycle_hour() -> int:
    return preferred_cycle_hour("WW3")


def required_source_cycle(package_date: date, cycle_hour: int | None = None) -> str:
    hour = source_cycle_hour() if cycle_hour is None else cycle_hour
    return (package_date - timedelta(days=1)).strftime("%Y%m%d") + f"{hour:02d}"


def required_valid_times(package_date: date, cycle_hour: int | None = None) -> tuple[str, ...]:
    hour = source_cycle_hour() if cycle_hour is None else cycle_hour
    analysis_time = datetime.combine(
        package_date - timedelta(days=1), datetime.min.time()
    ).replace(hour=hour)
    return tuple(
        (analysis_time + timedelta(hours=forecast_hour)).strftime("%Y%m%d%H")
        for forecast_hour in REQUIRED_FORECAST_HOURS
    )


def package_tag(package_date: date) -> str:
    months = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
    return f"{package_date.year}{months[package_date.month - 1]}{package_date.day:02d}"


def cycle_is_complete(cycle_dir: Path, package_date: date) -> bool:
    if not cycle_dir.is_dir() or not CYCLE_RE.fullmatch(cycle_dir.name):
        return False
    cycle_hour = source_cycle_hour()
    if cycle_dir.name != required_source_cycle(package_date, cycle_hour):
        return False
    return all(
        (cycle_dir / f"ww3_grdo.{stamp[:8]}T{stamp[8:]}.nc").is_file()
        for stamp in required_valid_times(package_date, cycle_hour)
    )


def select_source_cycle(input_root: Path, package_date: date) -> Path | None:
    if not input_root.is_dir():
        return None
    cycle_dir = input_root / required_source_cycle(package_date)
    return cycle_dir if cycle_is_complete(cycle_dir, package_date) else None


def print_manifest(input_root: Path, package_date: date, source_cycle: str | None) -> int:
    cycle_hour = source_cycle_hour()
    required_cycle = required_source_cycle(package_date, cycle_hour)
    if source_cycle is not None and source_cycle != required_cycle:
        return 1
    cycle_dir = input_root / required_cycle
    if not cycle_is_complete(cycle_dir, package_date):
        return 1
    tag = package_tag(package_date)
    for forecast_hour, stamp in zip(
        REQUIRED_FORECAST_HOURS, required_valid_times(package_date, cycle_hour)
    ):
        label = "analysis" if forecast_hour == 0 else f"{forecast_hour}h"
        timestamp = f"{stamp[:8]}T{stamp[8:]}"
        ncfile = cycle_dir / f"ww3_grdo.{timestamp}.nc"
        print(f"{label}|{stamp}|{timestamp}|{tag}|{ncfile}|{cycle_dir.name}")
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

    args = parser.parse_args()
    if args.command == "today":
        print(datetime.now(tz=ZoneInfo(args.timezone)).date().isoformat())
        return 0

    parsed_date = parse_package_date(args.package_date)
    if args.command == "target":
        print(required_source_cycle(parsed_date))
        return 0
    if args.command == "select":
        selected = select_source_cycle(args.input_root, parsed_date)
        if selected is None:
            return 1
        print(selected.name)
        return 0

    return print_manifest(args.input_root, parsed_date, args.source_cycle)


if __name__ == "__main__":
    raise SystemExit(main())
