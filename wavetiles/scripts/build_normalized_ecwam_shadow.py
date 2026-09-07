#!/usr/bin/env python3
"""Build ECWAM products from the normalized contract into an isolated shadow tree."""

from __future__ import annotations

import argparse
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import xarray as xr

ROOT = Path(__file__).resolve().parents[2]
TILING_DIR = ROOT / "wavetiles" / "scripts" / "tiling"
for path in (ROOT, TILING_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from wavetiles.pipeline.reader import NormalizedCycleReader
from ecwam_contours import generate_contours
from ecwam_direct import (
    DEFAULT_GRID_POINTS,
    DEFAULT_STYLES,
    DEFAULT_ZOOM_MAX,
    DEFAULT_ZOOM_MIN,
    STYLES,
    generate_tiles,
    legend,
    normalize_grid,
    parse_csv,
)

MONTHS = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
DEFAULT_WORKERS = int(os.getenv("ECWAM_SHADOW_BUILD_WORKERS", os.getenv("ECWAM_BUILD_WORKERS", "4")))


def parse_package_date(value: str) -> date:
    raw = value.strip()
    for pattern in ("%Y-%m-%d", "%Y%m%d"):
        try:
            return datetime.strptime(raw, pattern).date()
        except ValueError:
            continue
    raise argparse.ArgumentTypeError("package date must be YYYY-MM-DD or YYYYMMDD")


def package_tag(value: date) -> str:
    return f"{value.year}{MONTHS[value.month - 1]}{value.day:02d}"


def required_reference_time(package_date: date) -> datetime:
    return datetime.combine(package_date - timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc).replace(hour=18)


def frame_dataset(frame) -> xr.Dataset:
    return xr.Dataset(
        data_vars={
            "swh": (
                ("latitude", "longitude"),
                np.asarray(frame.significant_wave_height, dtype=np.float32),
                {"units": "m"},
            )
        },
        coords={
            "latitude": np.asarray(frame.latitude, dtype=np.float64),
            "longitude": np.asarray(frame.longitude, dtype=np.float64),
        },
    )


def build_frame(
    frame,
    output_root: Path,
    tag: str,
    requested_styles: tuple[str, ...],
    sigma: float,
    zoom_min: int,
    zoom_max: int,
    grid_points: int,
    skip_existing: bool,
) -> tuple[int, str, int, int]:
    valid = frame.valid_time.astype("datetime64[h]").astype(datetime).replace(tzinfo=timezone.utc)
    date_tag = valid.strftime("%Y%m%d%H")
    with frame_dataset(frame) as dataset:
        lat, lon, data = normalize_grid(dataset, "swh", sigma)

    png_count = 0
    for style_name in requested_styles:
        style = STYLES[style_name]
        target = output_root / style.name / tag / date_tag
        count = generate_tiles(
            lat,
            lon,
            data,
            target,
            style,
            zoom_min,
            zoom_max,
            skip_existing,
        )
        target.mkdir(parents=True, exist_ok=True)
        with (target / "legend.json").open("w", encoding="utf-8") as handle:
            json.dump(legend("swh", date_tag, style, zoom_min, zoom_max, grid_points), handle, indent=2)
            handle.write("\n")
        png_count += count

    document = generate_contours(lat, lon, data)
    contour_target = output_root / "contours" / tag / date_tag / "contours.geojson"
    contour_target.parent.mkdir(parents=True, exist_ok=True)
    with contour_target.open("w", encoding="utf-8") as handle:
        json.dump(document, handle, separators=(",", ":"), allow_nan=False)
        handle.write("\n")

    return frame.forecast_hour, date_tag, png_count, len(document["features"])


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build isolated ECWAM shadow products from one validated normalized cycle."
    )
    parser.add_argument("cycle_dir", type=Path)
    parser.add_argument("package_date", type=parse_package_date)
    parser.add_argument(
        "--output-root",
        type=Path,
        default=ROOT / "wavetiles" / "shadow-products" / "ECWAM",
        help="Isolated product root; must not equal the production ECWAM output root.",
    )
    parser.add_argument("--sigma", type=float, default=1.5)
    parser.add_argument("--styles", default=None)
    parser.add_argument("--zoom-min", type=int, default=DEFAULT_ZOOM_MIN)
    parser.add_argument("--zoom-max", type=int, default=DEFAULT_ZOOM_MAX)
    parser.add_argument("--grid-points", type=int, default=DEFAULT_GRID_POINTS)
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    parser.add_argument("--skip-existing", action="store_true")
    args = parser.parse_args()

    if args.sigma < 0 or args.zoom_min < 0 or args.zoom_max < args.zoom_min:
        raise SystemExit("Invalid sigma or zoom range")
    if args.grid_points <= 0 or args.workers <= 0:
        raise SystemExit("grid-points and workers must be positive")

    production_root = (ROOT / "wavetiles" / "tiles" / "ECWAM").resolve()
    output_root = args.output_root.resolve()
    if output_root == production_root or production_root in output_root.parents:
        raise SystemExit("Shadow output root must be isolated from the production ECWAM tiles tree")

    requested_styles = parse_csv(args.styles, DEFAULT_STYLES)
    unknown = sorted(set(requested_styles) - set(STYLES))
    if unknown:
        raise SystemExit(f"Unknown styles: {unknown}")

    reader = NormalizedCycleReader(args.cycle_dir)
    if reader.model != "ECWAM":
        raise SystemExit(f"ECWAM shadow builder cannot consume normalized model {reader.model!r}")

    required_reference = required_reference_time(args.package_date)
    actual_reference = reader.reference_datetime().astimezone(timezone.utc)
    if actual_reference != required_reference:
        raise SystemExit(
            "Normalized reference time does not match the package's required previous-day 18Z cycle: "
            f"expected {required_reference.isoformat()}, got {actual_reference.isoformat()}"
        )
    if reader.source_cycle != required_reference.strftime("%Y%m%d%H"):
        raise SystemExit(
            f"Normalized ECWAM source cycle must equal required 18Z reference: {reader.source_cycle}"
        )

    frames = list(reader.iter_frames())
    workers = min(args.workers, len(frames))
    tag = package_tag(args.package_date)
    contour_count = 0
    png_count = 0

    print(f"Building {len(frames)} normalized ECWAM frames with {workers} worker(s)")
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [
            executor.submit(
                build_frame,
                frame,
                output_root,
                tag,
                tuple(requested_styles),
                args.sigma,
                args.zoom_min,
                args.zoom_max,
                args.grid_points,
                args.skip_existing,
            )
            for frame in frames
        ]
        for future in as_completed(futures):
            forecast_hour, date_tag, frame_png_count, contour_features = future.result()
            png_count += frame_png_count
            contour_count += 1
            print(
                f"T+{forecast_hour:02d} {date_tag}: "
                f"shadow tiles generated; contours={contour_features}",
                flush=True,
            )

    if contour_count != len(reader.forecast_hours):
        raise SystemExit(
            f"Expected {len(reader.forecast_hours)} contour frames, generated {contour_count}"
        )
    if png_count <= 0:
        raise SystemExit("Normalized ECWAM shadow build produced no visible PNG tiles")

    metadata = {
        "packageDate": args.package_date.isoformat(),
        "packageTag": tag,
        "sourceCycle": reader.source_cycle,
        "variable": "swh",
        "sigma": str(args.sigma),
        "requiredForecastHours": list(reader.forecast_hours),
    }
    metadata_target = output_root / "contours" / tag / "package.json"
    metadata_target.parent.mkdir(parents=True, exist_ok=True)
    with metadata_target.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)
        handle.write("\n")

    print()
    print(f"+ Normalized ECWAM shadow package complete: {args.package_date.isoformat()}")
    print(f"  Source cycle: {reader.source_cycle}")
    print(f"  Workers: {workers}")
    print(f"  PNG files generated/reused: {png_count}")
    print(f"  Contour files: {contour_count}")
    print(f"  Shadow root: {output_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
