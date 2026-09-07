#!/usr/bin/env python3
"""Normalize one retained ECWAM forecast window without changing published products."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from wavetiles.pipeline.adapters.ecwam import ECWAMGRIBAdapter
from wavetiles.pipeline.contract import DEFAULT_FORECAST_HOURS


def parse_reference_time(value: str) -> datetime:
    raw = value.strip()
    for pattern in ("%Y%m%d%H", "%Y-%m-%dT%H:%MZ", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.strptime(raw, pattern).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise argparse.ArgumentTypeError(
        "reference time must be YYYYMMDDHH or an explicit UTC ISO timestamp such as 2026-09-06T18:00Z"
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a WaveLab normalized ECWAM cycle in shadow mode."
    )
    parser.add_argument(
        "source_root",
        type=Path,
        help="ECWAM input root containing source-cycle directories, or one source-cycle directory.",
    )
    parser.add_argument(
        "reference_time",
        type=parse_reference_time,
        help="WaveLab T+0 retained valid time (UTC).",
    )
    parser.add_argument(
        "--grid-points",
        type=int,
        default=271051,
        help="Expected ECWAM high-resolution grid point count.",
    )
    parser.add_argument(
        "--normalized-root",
        type=Path,
        default=ROOT / "wavetiles" / "normalized",
        help="Destination root. Default: wavetiles/normalized",
    )
    args = parser.parse_args()

    adapter = ECWAMGRIBAdapter(grid_points=args.grid_points)
    source_cycle = adapter.discover_cycle(args.source_root, reference_time=args.reference_time)
    result = adapter.normalize(
        source_cycle,
        args.normalized_root,
        forecast_hours=DEFAULT_FORECAST_HOURS,
    )
    print(
        json.dumps(
            {
                "model": result.model,
                "sourceCycle": result.source_cycle,
                "referenceTime": result.reference_time.isoformat().replace("+00:00", "Z"),
                "frameCount": result.frame_count,
                "dataset": str(result.dataset_path),
                "manifest": str(result.manifest_path),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
