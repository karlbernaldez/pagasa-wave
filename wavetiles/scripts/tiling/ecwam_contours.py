#!/usr/bin/env python3
"""Generate labelled ECWAM significant-wave-height contours from GRIB1."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import contourpy
import numpy as np

from ecwam_direct import DEFAULT_GRID_POINTS, normalize_grid, open_ecwam_dataset
from ww3_style import CONTOUR_LEVELS, color_for_height


def build_feature(level: float, points: np.ndarray) -> dict:
    coordinates = [[round(float(lon), 5), round(float(lat), 5)] for lon, lat in points]
    return {
        "type": "Feature",
        "properties": {
            "height": float(level),
            "label": f"{level:g} m",
            "major": float(level).is_integer(),
            "color_light": color_for_height(level, "light"),
            "color_dark": color_for_height(level, "dark"),
        },
        "geometry": {"type": "LineString", "coordinates": coordinates},
    }


def generate_contours(lat: np.ndarray, lon: np.ndarray, data: np.ndarray, levels=CONTOUR_LEVELS) -> dict:
    finite = np.isfinite(data)
    if not finite.any():
        raise RuntimeError("ECWAM field contains no finite values")
    minimum = float(np.nanmin(data))
    maximum = float(np.nanmax(data))
    generator = contourpy.contour_generator(x=lon, y=lat, z=np.ma.masked_invalid(data), name="serial")
    features = []
    for raw_level in levels:
        level = float(raw_level)
        if level < minimum or level > maximum:
            continue
        for line in generator.lines(level):
            if len(line) >= 2:
                features.append(build_feature(level, line))
    return {
        "type": "FeatureCollection",
        "properties": {
            "model": "ECWAM",
            "variable": "swh",
            "units": "m",
            "levels": [float(value) for value in levels],
        },
        "features": features,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="ECWAM GRIB1 to labelled wave-height contour GeoJSON")
    parser.add_argument("gribfile")
    parser.add_argument("--var", default="swh")
    parser.add_argument("--grid-points", type=int, default=DEFAULT_GRID_POINTS)
    parser.add_argument("--sigma", type=float, default=1.5)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    if args.sigma < 0 or args.grid_points <= 0:
        raise SystemExit("Sigma and grid point count must be valid")
    gribfile = Path(args.gribfile).resolve()
    with open_ecwam_dataset(gribfile, args.grid_points) as dataset:
        lat, lon, data = normalize_grid(dataset, args.var, args.sigma)
    document = generate_contours(lat, lon, data)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as handle:
        json.dump(document, handle, separators=(",", ":"), allow_nan=False)
        handle.write("\n")
    print(f"Generated {len(document['features'])} ECWAM contour lines at {output}")


if __name__ == "__main__":
    main()
