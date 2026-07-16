#!/usr/bin/env python3
"""Select one complete WW3 source cycle for a forecast package date."""

from __future__ import annotations

import argparse
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

CYCLE_RE = re.compile(r"\d{10}")
PACKAGE_DATE_RE = re.compile(r"(\d{4})-?(\d{2})-?(\d{2})")


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


def required_valid_times(package_date: date) -> tuple[str, ...]:
    return (
        (package_date - timedelta(days=1)).strftime("%Y%m%d") + "18",
        package_date.strftime("%Y%m%d") + "18",
        (package_date + timedelta(days=1)).strftime("%Y%m%d") + "06",
        (package_date + timedelta(days=1)).strftime("%Y%m%d") + "18",
    )


def package_tag(package_date: date) -> str:
    months = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
    return f"{package_date.year}{months[package_date.month - 1]}{package_date.day:02d}"


def cycle_is_complete(cycle_dir: Path, package_date: date) -> bool:
    if not cycle_dir.is_dir() or not CYCLE_RE.fullmatch(cycle_dir.name):
        return False
    return all(
        (cycle_dir / f"ww3_grdo.{stamp[:8]}T{stamp[8:]}.nc").is_file()
        for stamp in required_valid_times(package_date)
    )


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
    if cycle_dir is None or not cycle_is_complete(cycle_dir, package_date):
        return 1
    labels = ("analysis", "24h", "36h", "48h")
    tag = package_tag(package_date)
    for label, stamp in zip(labels, required_valid_times(package_date)):
        timestamp = f"{stamp[:8]}T{stamp[8:]}"
        ncfile = cycle_dir / f"ww3_grdo.{timestamp}.nc"
        print(f"{label}|{stamp}|{timestamp}|{tag}|{ncfile}|{cycle_dir.name}")
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
