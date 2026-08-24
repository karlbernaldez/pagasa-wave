#!/usr/bin/env python3
"""Generate frontend-compatible ECWAM significant-wave-height XYZ PNG tiles from GRIB1."""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
from typing import Iterable

import numpy as np
import xarray as xr
from PIL import Image
from scipy.interpolate import RegularGridInterpolator
from scipy.ndimage import gaussian_filter

from ww3_style import HW_BINS, MAX_VISIBLE, MIN_VALID, STYLES, Style

TILE_SIZE = 256
WEB_MERCATOR_LAT = 85.0511287798066
DEFAULT_ZOOM_MIN = int(os.getenv("ECWAM_ZOOM_MIN", "0"))
DEFAULT_ZOOM_MAX = int(os.getenv("ECWAM_ZOOM_MAX", "8"))
DEFAULT_STYLES = tuple(v.strip() for v in os.getenv("ECWAM_STYLES", "light,dark").split(",") if v.strip())
DEFAULT_GRID_POINTS = int(os.getenv("ECWAM_GRID_POINTS", "271051"))


def parse_csv(value: str | None, default: Iterable[str]) -> tuple[str, ...]:
    parsed = tuple(item.strip() for item in (value or ",".join(default)).split(",") if item.strip())
    if not parsed:
        raise ValueError("Expected at least one comma-separated value")
    return parsed


def open_ecwam_dataset(path: Path, grid_points: int) -> xr.Dataset:
    return xr.open_dataset(
        path,
        engine="cfgrib",
        backend_kwargs={"indexpath": "", "filter_by_keys": {"numberOfPoints": grid_points}},
    )


def normalize_grid(ds: xr.Dataset, var: str, sigma: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if "latitude" not in ds.coords or "longitude" not in ds.coords:
        raise RuntimeError("ECWAM dataset is missing latitude/longitude coordinates")
    if var not in ds.variables:
        raise RuntimeError(f"ECWAM variable {var!r} not found; available: {sorted(ds.data_vars)}")

    lat = np.asarray(ds["latitude"].values, dtype=np.float64)
    lon = np.asarray(ds["longitude"].values, dtype=np.float64)
    data = np.asarray(ds[var].squeeze().values, dtype=np.float32)
    if lat.ndim != 1 or lon.ndim != 1 or data.ndim != 2:
        raise RuntimeError("ECWAM tiler requires one-dimensional latitude/longitude and a two-dimensional field")
    if data.shape != (lat.size, lon.size):
        raise RuntimeError(f"ECWAM field shape {data.shape} does not match {(lat.size, lon.size)}")

    lon = np.where(lon > 180.0, lon - 360.0, lon)
    lat_order = np.argsort(lat)
    lon_order = np.argsort(lon)
    lat = lat[lat_order]
    lon = lon[lon_order]
    data = data[np.ix_(lat_order, lon_order)]
    data[~np.isfinite(data)] = np.nan

    if sigma > 0:
        invalid = np.isnan(data)
        valid = ~invalid
        if not valid.any():
            raise RuntimeError("ECWAM field contains no finite values")
        weights = gaussian_filter(valid.astype(np.float32), sigma=sigma, mode="nearest")
        values = gaussian_filter(np.where(valid, data, 0.0), sigma=sigma, mode="nearest")
        data = np.divide(values, weights, out=np.full_like(values, np.nan), where=weights > 1e-6)
        data[invalid] = np.nan
    return lat, lon, data


def lon_to_tile_x(lon: float, zoom: int) -> int:
    n = 1 << zoom
    return max(0, min(n - 1, int(math.floor((lon + 180.0) / 360.0 * n))))


def lat_to_tile_y(lat: float, zoom: int) -> int:
    lat = max(-WEB_MERCATOR_LAT, min(WEB_MERCATOR_LAT, lat))
    n = 1 << zoom
    rad = math.radians(lat)
    value = (1.0 - math.asinh(math.tan(rad)) / math.pi) / 2.0 * n
    return max(0, min(n - 1, int(math.floor(value))))


def tile_pixel_lonlat(z: int, x: int, y: int) -> tuple[np.ndarray, np.ndarray]:
    n = float(1 << z)
    px = x + (np.arange(TILE_SIZE, dtype=np.float64) + 0.5) / TILE_SIZE
    py = y + (np.arange(TILE_SIZE, dtype=np.float64) + 0.5) / TILE_SIZE
    lon = px / n * 360.0 - 180.0
    merc = math.pi * (1.0 - 2.0 * py / n)
    lat = np.degrees(np.arctan(np.sinh(merc)))
    return np.meshgrid(lon, lat)


def classify(field: np.ndarray, style: Style) -> np.ndarray:
    invalid = ~np.isfinite(field) | (field <= MIN_VALID) | (field > MAX_VISIBLE)
    safe = np.where(invalid, HW_BINS[0], field)
    idx = np.clip(np.digitize(safe, HW_BINS, right=False) - 1, 0, len(style.colors) - 1)
    rgba = np.zeros((*field.shape, 4), dtype=np.uint8)
    rgba[..., :3] = style.colors[idx]
    if style.alpha_stops is None:
        rgba[..., 3] = np.where(invalid, 0, 255).astype(np.uint8)
    else:
        xp, fp = zip(*style.alpha_stops)
        alpha = np.interp(safe, xp, fp)
        alpha[invalid] = 0
        rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


def generate_tiles(lat: np.ndarray, lon: np.ndarray, data: np.ndarray, output: Path, style: Style,
                   zoom_min: int, zoom_max: int, skip_existing: bool) -> int:
    interpolation = RegularGridInterpolator((lat, lon), data, method="linear", bounds_error=False, fill_value=np.nan)
    north, south = min(WEB_MERCATOR_LAT, float(lat[-1])), max(-WEB_MERCATOR_LAT, float(lat[0]))
    west, east = float(lon[0]), float(lon[-1])
    count = 0
    for zoom in range(zoom_min, zoom_max + 1):
        x0, x1 = lon_to_tile_x(west, zoom), lon_to_tile_x(east, zoom)
        y0, y1 = lat_to_tile_y(north, zoom), lat_to_tile_y(south, zoom)
        for x in range(min(x0, x1), max(x0, x1) + 1):
            for y in range(min(y0, y1), max(y0, y1) + 1):
                target = output / str(zoom) / str(x) / f"{y}.png"
                if skip_existing and target.exists():
                    count += 1
                    continue
                lon_grid, lat_grid = tile_pixel_lonlat(zoom, x, y)
                field = interpolation(np.column_stack((lat_grid.ravel(), lon_grid.ravel()))).reshape(TILE_SIZE, TILE_SIZE)
                rgba = classify(field, style)
                if not np.any(rgba[..., 3]):
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(rgba).save(target, format="PNG", optimize=True)
                count += 1
    return count


def legend(var: str, date_tag: str, style: Style, zoom_min: int, zoom_max: int, grid_points: int) -> dict:
    return {
        "model": "ECWAM",
        "variable": var,
        "units": "m" if var == "swh" else None,
        "grid_points": grid_points,
        "bins": HW_BINS.tolist(),
        "colors_rgb": style.colors.astype(int).tolist(),
        "min_valid": MIN_VALID,
        "max_visible": MAX_VISIBLE,
        "style": style.name,
        "palette": style.palette,
        "zooms": {"min": zoom_min, "max": zoom_max},
        "date_tag": date_tag,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="GDAL-free ECWAM GRIB1 to XYZ PNG tiles")
    parser.add_argument("gribfile")
    parser.add_argument("--date-tag", required=True, help="Valid time as YYYYMMDDHH")
    parser.add_argument("--var", default="swh")
    parser.add_argument("--grid-points", type=int, default=DEFAULT_GRID_POINTS)
    parser.add_argument("--sigma", type=float, default=1.5)
    parser.add_argument("--styles", default=None)
    parser.add_argument("--tiles-dir", default="../tiles/ECWAM")
    parser.add_argument("--zoom-min", type=int, default=DEFAULT_ZOOM_MIN)
    parser.add_argument("--zoom-max", type=int, default=DEFAULT_ZOOM_MAX)
    parser.add_argument("--skip-existing", action="store_true")
    args = parser.parse_args()
    if args.zoom_min < 0 or args.zoom_max < args.zoom_min or args.sigma < 0 or args.grid_points <= 0:
        raise SystemExit("Invalid zoom range, sigma, or grid point count")
    if not args.date_tag.isdigit() or len(args.date_tag) != 10:
        raise SystemExit("--date-tag must be YYYYMMDDHH")

    requested_styles = parse_csv(args.styles, DEFAULT_STYLES)
    unknown = sorted(set(requested_styles) - set(STYLES))
    if unknown:
        raise SystemExit(f"Unknown styles: {unknown}")

    gribfile = Path(args.gribfile).resolve()
    with open_ecwam_dataset(gribfile, args.grid_points) as dataset:
        lat, lon, data = normalize_grid(dataset, args.var, args.sigma)

    tiles_root = Path(args.tiles_dir)
    print(
        f"Direct ECWAM tiling: {gribfile.name} var={args.var} "
        f"bounds={lon[0]:.3f},{lat[0]:.3f},{lon[-1]:.3f},{lat[-1]:.3f}"
    )
    total = 0
    for style_name in requested_styles:
        style = STYLES[style_name]
        output = tiles_root / style.name / args.date_tag
        count = generate_tiles(lat, lon, data, output, style, args.zoom_min, args.zoom_max, args.skip_existing)
        output.mkdir(parents=True, exist_ok=True)
        with (output / "legend.json").open("w", encoding="utf-8") as handle:
            json.dump(legend(args.var, args.date_tag, style, args.zoom_min, args.zoom_max, args.grid_points), handle, indent=2)
            handle.write("\n")
        print(f"Generated {count} {style.name} XYZ tiles under {output}")
        total += count
    if total == 0:
        raise SystemExit("ECWAM tiler produced no visible PNG tiles")
    print(f"Direct ECWAM tiling complete: {total} PNG tiles")


if __name__ == "__main__":
    main()
