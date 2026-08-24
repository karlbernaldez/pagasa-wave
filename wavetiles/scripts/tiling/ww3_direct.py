#!/usr/bin/env python3
"""Generate frontend-compatible WW3 XYZ PNG tiles without GDAL or Rasterio."""

from __future__ import annotations

import argparse
import json
import math
import os
import re
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
DEFAULT_ZOOM_MIN = int(os.getenv("WW3_ZOOM_MIN", "0"))
DEFAULT_ZOOM_MAX = int(os.getenv("WW3_ZOOM_MAX", "8"))
DEFAULT_STYLES = tuple(v.strip() for v in os.getenv("WW3_STYLES", "light,dark").split(",") if v.strip())
LAT_NAMES = ("lat", "latitude", "Latitude", "LATITUDE", "nav_lat", "y", "YLAT")
LON_NAMES = ("lon", "longitude", "Longitude", "LONGITUDE", "nav_lon", "x", "XLON")
TIME_DIMS = ("time", "Time", "forecast_time")


def parse_csv(value: str | None, default: Iterable[str]) -> tuple[str, ...]:
    parsed = tuple(item.strip() for item in (value or ",".join(default)).split(",") if item.strip())
    if not parsed:
        raise ValueError("Expected at least one comma-separated value")
    return parsed


def extract_date(name: str) -> str:
    match = re.search(r"(\d{8})T(\d{2})", name) or re.search(r"(\d{10})", name)
    if not match:
        raise ValueError(f"Could not extract date from {name}")
    return "".join(match.groups())


def find_coordinate(ds: xr.Dataset, names: tuple[str, ...]) -> xr.DataArray:
    for name in names:
        if name in ds.coords or name in ds.variables:
            return ds[name]
    raise RuntimeError(f"Missing coordinate; checked {names}")


def first_time(da: xr.DataArray) -> xr.DataArray:
    for dim in TIME_DIMS:
        if dim in da.dims:
            return da.isel({dim: 0})
    return da


def normalize_grid(ds: xr.Dataset, var: str, sigma: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    lat = np.asarray(find_coordinate(ds, LAT_NAMES).values, dtype=np.float64)
    lon = np.asarray(find_coordinate(ds, LON_NAMES).values, dtype=np.float64)
    data = np.asarray(first_time(ds[var]).squeeze().values, dtype=np.float32)
    if lat.ndim != 1 or lon.ndim != 1 or data.ndim != 2:
        raise RuntimeError("Direct tiler currently requires one-dimensional latitude/longitude and a two-dimensional field")
    if data.shape != (lat.size, lon.size):
        raise RuntimeError(f"Field shape {data.shape} does not match latitude/longitude sizes {(lat.size, lon.size)}")
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
            raise RuntimeError("WW3 field contains no finite values")
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
    lon_grid, lat_grid = np.meshgrid(lon, lat)
    return lon_grid, lat_grid


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


def legend(var: str, date_tag: str, style: Style, zoom_min: int, zoom_max: int) -> dict:
    return {
        "model": "WW3", "variable": var, "units": "m" if var == "hs" else None,
        "bins": HW_BINS.tolist(), "colors_rgb": style.colors.astype(int).tolist(),
        "min_valid": MIN_VALID, "max_visible": MAX_VISIBLE, "style": style.name,
        "palette": style.palette, "zooms": {"min": zoom_min, "max": zoom_max}, "date_tag": date_tag,
    }


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


def main() -> None:
    parser = argparse.ArgumentParser(description="GDAL-free WW3 NetCDF to XYZ PNG tiles")
    parser.add_argument("ncfile")
    parser.add_argument("--var", default="hs")
    parser.add_argument("--sigma", type=float, default=1.5)
    parser.add_argument("--styles", default=None)
    parser.add_argument("--tiles-dir", default="../tiles/WW3")
    parser.add_argument("--zoom-min", type=int, default=DEFAULT_ZOOM_MIN)
    parser.add_argument("--zoom-max", type=int, default=DEFAULT_ZOOM_MAX)
    parser.add_argument("--skip-existing", action="store_true")
    args = parser.parse_args()
    if args.zoom_min < 0 or args.zoom_max < args.zoom_min or args.sigma < 0:
        raise SystemExit("Invalid zoom range or sigma")
    requested_styles = parse_csv(args.styles, DEFAULT_STYLES)
    unknown = sorted(set(requested_styles) - set(STYLES))
    if unknown:
        raise SystemExit(f"Unknown styles: {unknown}")
    ncfile = Path(args.ncfile).resolve()
    date_tag = extract_date(ncfile.name)
    with xr.open_dataset(ncfile) as ds:
        if args.var not in ds.variables:
            raise SystemExit(f"Variable {args.var!r} not found; available: {sorted(ds.data_vars)}")
        lat, lon, data = normalize_grid(ds, args.var, args.sigma)
    tiles_root = Path(args.tiles_dir)
    print(f"Direct WW3 tiling: {ncfile.name} var={args.var} bounds={lon[0]:.3f},{lat[0]:.3f},{lon[-1]:.3f},{lat[-1]:.3f}")
    total = 0
    for style_name in requested_styles:
        style = STYLES[style_name]
        output = tiles_root / style.name / date_tag
        count = generate_tiles(lat, lon, data, output, style, args.zoom_min, args.zoom_max, args.skip_existing)
        output.mkdir(parents=True, exist_ok=True)
        with (output / "legend.json").open("w", encoding="utf-8") as handle:
            json.dump(legend(args.var, date_tag, style, args.zoom_min, args.zoom_max), handle, indent=2)
            handle.write("\n")
        print(f"Generated {count} {style.name} XYZ tiles under {output}")
        total += count
    if total == 0:
        raise SystemExit("Direct tiler produced no visible PNG tiles")
    print(f"Direct WW3 tiling complete: {total} PNG tiles")


if __name__ == "__main__":
    main()
