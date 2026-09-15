#!/usr/bin/env python3
"""Write one structured WaveLab wave-pipeline status snapshot."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from wavetiles.pipeline.status import VALID_STATES, write_status


def parse_bool(value: str) -> bool:
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes"}:
        return True
    if normalized in {"0", "false", "no"}:
        return False
    raise argparse.ArgumentTypeError("expected true/false")


def main() -> int:
    parser = argparse.ArgumentParser(description="Write a WaveLab wave-pipeline status snapshot.")
    parser.add_argument("model")
    parser.add_argument("state", choices=sorted(VALID_STATES))
    parser.add_argument("--message")
    parser.add_argument("--package-date")
    parser.add_argument("--required-source-cycle")
    parser.add_argument("--source-cycle")
    parser.add_argument("--input-mode")
    parser.add_argument("--frame-count", type=int)
    parser.add_argument("--expected-frame-count", type=int)
    parser.add_argument("--published", type=parse_bool)
    parser.add_argument("--started-at")
    parser.add_argument("--completed-at")
    parser.add_argument("--error")
    args = parser.parse_args()

    write_status(
        args.model,
        args.state,
        message=args.message,
        package_date=args.package_date,
        required_source_cycle=args.required_source_cycle,
        source_cycle=args.source_cycle,
        input_mode=args.input_mode,
        frame_count=args.frame_count,
        expected_frame_count=args.expected_frame_count,
        published=args.published,
        started_at=args.started_at,
        completed_at=args.completed_at,
        error=args.error,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
