#!/usr/bin/env python3
"""
WW3 gridded NetCDF -> WebMercator float GeoTIFF -> styled RGBA GeoTIFFs -> XYZ tiles.

Daily-run friendly defaults preserve the current single-variable output contract:
  tiles/WW3/<style>/<DATE_TAG>/{z}/{x}/{y}.png
  geotiff/WW3_rgba3857/<DATE_TAG>/<VAR>/<DATE_TAG>_<VAR>_<STYLE>_3857_rgba.tif

Operational controls:
  --vars hs,t01 or --vars all
  --styles light,dark,night or --styles all
  --skip-existing for reruns
  WW3_* environment defaults for scheduled jobs
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np
import rasterio
import xarray as xr
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, calculate_default_transform, reproject

try:
    from scipy.ndimage import gaussian_filter
    HAVE_SCIPY = True
except Exception:
    HAVE_SCIPY = False

M_PER_PX_Z0 = 156543.03392804097
MIN_VALID = 0.05
MAX_VISIBLE = 20.0
DEFAULT_INPUT_DIR = Path(os.getenv("WW3_INPUT_DIR", "../input/2026011200"))
DEFAULT_GEOTIFF_DIR = Path(os.getenv("WW3_GEOTIFF_DIR", "../geotiff"))
DEFAULT_TILES_DIR = Path(os.getenv("WW3_TILES_DIR", "../tiles/WW3"))
DEFAULT_VARS = tuple(v.strip() for v in os.getenv("WW3_VARS", "hs").split(",") if v.strip())
DEFAULT_STYLES = tuple(s.strip() for s in os.getenv("WW3_STYLES", "light,dark").split(",") if s.strip())
DEFAULT_SIGMA = float(os.getenv("WW3_SIGMA", "1.5"))
DEFAULT_ZOOM_MIN = int(os.getenv("WW3_ZOOM_MIN", "0"))
DEFAULT_ZOOM_MAX = int(os.getenv("WW3_ZOOM_MAX", "8"))
DEFAULT_PROCESSES = int(os.getenv("WW3_PROCESSES", "4"))
DEFAULT_STYLE_WORKERS = int(os.getenv("WW3_STYLE_WORKERS", "3"))
LAT_NAMES = ("lat", "latitude", "Latitude", "LATITUDE", "nav_lat", "y", "YLAT")
LON_NAMES = ("lon", "longitude", "Longitude", "LONGITUDE", "nav_lon", "x", "XLON")
TIME_DIMS = ("time", "Time", "forecast_time")

HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)
HW_COLORS_LIGHT = np.array([
    [0xCA, 0xED, 0xFB], [0x60, 0xCA, 0xF3], [0x0E, 0x9E, 0xD4], [0xC1, 0xF1, 0xC9],
    [0x82, 0xE2, 0x8F], [0x01, 0xB0, 0x51], [0xFF, 0xFF, 0x00], [0xFF, 0xE7, 0x01],
    [0xFE, 0xA4, 0x01], [0xFE, 0x00, 0x01], [0xAA, 0x15, 0x01], [0xAB, 0x45, 0x00],
    [0x6C, 0x33, 0x00], [0xD8, 0x6D, 0xCD], [0x79, 0x20, 0x70], [0x51, 0x15, 0x4A],
    [0x15, 0x61, 0x83], [0x0F, 0x29, 0x41], [0x81, 0x81, 0x80], [0x40, 0x40, 0x40],
], dtype=np.uint8)
HW_COLORS_DARK = np.array([
    [8, 40, 60], [12, 70, 100], [18, 110, 150], [20, 140, 160], [30, 170, 140],
    [40, 190, 120], [90, 200, 110], [140, 210, 90], [190, 200, 70], [220, 180, 60],
    [240, 150, 50], [245, 120, 45], [250, 90, 40], [240, 60, 80], [220, 40, 120],
    [190, 30, 150], [140, 30, 170], [100, 30, 180], [160, 160, 160], [210, 210, 210],
], dtype=np.uint8)
HW_COLORS_NIGHT = np.array([
    [8, 8, 8], [30, 0, 0], [60, 0, 0], [90, 10, 0], [120, 20, 0], [150, 30, 0],
    [180, 40, 0], [210, 60, 0], [240, 90, 0], [255, 120, 0], [255, 150, 20],
    [255, 180, 60], [255, 210, 100], [255, 240, 150], [255, 255, 200], [255, 255, 255],
    [255, 255, 255], [255, 255, 255], [200, 200, 200], [160, 160, 160],
], dtype=np.uint8)


@dataclass(frozen=True)
class StyleConfig:
    name: str
    palette: str
    colors: np.ndarray
    alpha_stops: tuple[tuple[float, float], ...] | None = None


@dataclass(frozen=True)
class Config:
    nc_path: Path
    geotiff_dir: Path
    tiles_dir: Path
    variables: tuple[str, ...]
    styles: tuple[str, ...]
    sigma: float
    zoom_min: int
    zoom_max: int
    processes: int
    style_workers: int
    skip_existing: bool
    dry_run: bool


STYLES = {
    "light": StyleConfig("light", "mri3-like", HW_COLORS_LIGHT),
    "dark": StyleConfig("dark", "dark-marine", HW_COLORS_DARK, ((0.0, 0), (0.5, 40), (1.5, 90), (3.0, 160), (6.0, 220), (10.0, 255))),
    "night": StyleConfig("night", "ecdis-night", HW_COLORS_NIGHT, ((0.0, 0), (0.5, 30), (2.0, 110), (5.0, 200), (10.0, 255))),
}


def mkdir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def run(cmd: Sequence[object], dry_run: bool = False) -> None:
    cmd = [str(part) for part in cmd]
    print("->", " ".join(cmd))
    if not dry_run:
        subprocess.run(cmd, check=True)


def require_executable(name: str) -> None:
    if shutil.which(name) is None:
        raise RuntimeError(f"Required executable not found in PATH: {name}")


def gdal2tiles_command() -> list[str]:
    """Return the most portable gdal2tiles invocation for Windows, OSGeo4W, and Linux."""
    try:
        if importlib.util.find_spec("osgeo_utils.gdal2tiles") is not None:
            return [sys.executable, "-m", "osgeo_utils.gdal2tiles"]
    except ModuleNotFoundError:
        pass

    for executable in ("gdal2tiles.py", "gdal2tiles"):
        path = shutil.which(executable)
        if not path:
            continue
        if os.name == "nt" or path.lower().endswith((".py", ".pyw")):
            return [sys.executable, path]
        return [path]

    raise RuntimeError(
        "Could not find gdal2tiles. Install GDAL Python utilities or make gdal2tiles.py available in PATH. "
        "Verify with: python -m osgeo_utils.gdal2tiles --help"
    )


def target_res(zoom_max: int) -> float:
    return M_PER_PX_Z0 / (2 ** zoom_max)


def parse_csv(value: str | None, default: Iterable[str]) -> tuple[str, ...]:
    raw = value if value is not None else ",".join(default)
    parsed = tuple(item.strip() for item in raw.split(",") if item.strip())
    if not parsed:
        raise ValueError("Expected at least one comma-separated value.")
    return parsed


def extract_date_from_name(name: str) -> str:
    match = re.search(r"(\d{8})T(\d{2})", name)
    if match:
        return f"{match.group(1)}{match.group(2)}"
    match = re.search(r"\d{10}", name)
    if match:
        return match.group(0)
    raise ValueError(f"Could not extract date tag from filename: {name}")


def first_time(da: xr.DataArray) -> xr.DataArray:
    for dim in TIME_DIMS:
        if dim in da.dims:
            return da.isel({dim: 0})
    return da


def find_lat_lon(ds: xr.Dataset) -> tuple[xr.DataArray, xr.DataArray]:
    for source in (ds.coords, ds.variables):
        for lat_name in LAT_NAMES:
            for lon_name in LON_NAMES:
                if lat_name in source and lon_name in source:
                    return ds[lat_name], ds[lon_name]
    raise RuntimeError("Could not find latitude/longitude coordinates.")


def needs_flip(lat_values: np.ndarray) -> bool:
    lat = np.asarray(lat_values)
    if lat.ndim == 1:
        return bool(lat[0] < lat[-1])
    if lat.ndim == 2:
        return bool(np.nanmean(lat[0, :]) < np.nanmean(lat[-1, :]))
    return True


def is_point_or_spectral(ds: xr.Dataset) -> bool:
    keys = {name.lower() for name in list(ds.variables) + list(ds.coords)}
    has_station = "station" in keys or "station_name" in keys
    has_freq_dir = ("frequency" in keys or "freq" in keys) and ("direction" in keys or "dir" in keys)
    return has_station and has_freq_dir


def is_gridded(ds: xr.Dataset) -> bool:
    if is_point_or_spectral(ds):
        return False
    try:
        lat_da, lon_da = find_lat_lon(ds)
    except Exception:
        return False
    ignored = {lat_da.name, lon_da.name, *TIME_DIMS}
    return any(ds[name].ndim >= 2 for name in ds.data_vars if name not in ignored)


def pick_latest_gridded_nc(input_dir: Path) -> Path:
    nc_files = sorted(input_dir.rglob("*.nc"))
    if not nc_files:
        raise RuntimeError(f"No .nc files found under {input_dir}")
    for nc_path in reversed(nc_files):
        try:
            with xr.open_dataset(nc_path) as ds:
                if is_gridded(ds):
                    return nc_path
        except Exception as exc:
            print(f"! Skipping unreadable NetCDF: {nc_path} ({exc})")
    raise RuntimeError(f"No gridded WW3 NetCDF files found under {input_dir}")


def detect_gridded_vars(ds: xr.Dataset, lat_name: str, lon_name: str) -> tuple[str, ...]:
    ignored = {lat_name, lon_name, *TIME_DIMS}
    return tuple(
        name for name in ds.data_vars
        if name not in ignored and ds[name].ndim >= 2 and np.issubdtype(ds[name].dtype, np.number)
    )


def resolve_variables(ds: xr.Dataset, requested: tuple[str, ...]) -> tuple[str, ...]:
    lat_da, lon_da = find_lat_lon(ds)
    if len(requested) == 1 and requested[0].lower() == "all":
        variables = detect_gridded_vars(ds, lat_da.name, lon_da.name)
        if not variables:
            raise RuntimeError("No suitable numeric gridded variables found.")
        return variables
    missing = [name for name in requested if name not in ds.data_vars and name not in ds.variables]
    if missing:
        available = ", ".join(sorted(ds.data_vars))
        raise KeyError(f"Variables not found: {missing}. Available data variables: {available}")
    return requested


def resolve_styles(requested: tuple[str, ...]) -> tuple[StyleConfig, ...]:
    names = tuple(STYLES) if len(requested) == 1 and requested[0].lower() == "all" else requested
    missing = [name for name in names if name not in STYLES]
    if missing:
        raise KeyError(f"Unknown styles: {missing}. Available styles: {sorted(STYLES)}")
    return tuple(STYLES[name] for name in names)


def build_float3857(nc_path: Path, var: str, out_tif: Path, sigma: float, zoom_max: int, skip_existing: bool) -> Path:
    if skip_existing and out_tif.exists():
        print(f"= FLOAT GeoTIFF exists, skipping: {out_tif}")
        return out_tif

    with xr.open_dataset(nc_path) as ds:
        if var not in ds.data_vars and var not in ds.variables:
            raise KeyError(f"Variable '{var}' not found. Available: {list(ds.data_vars)}")
        lat_da, lon_da = find_lat_lon(ds)
        data = first_time(ds[var]).astype(np.float32).values
        if data.ndim > 2:
            data = np.squeeze(data)
        if data.ndim != 2:
            raise RuntimeError(f"Variable '{var}' is not 2D after squeeze (ndim={data.ndim}).")
        if needs_flip(lat_da.values):
            data = np.flipud(data)
        lon_min, lon_max = float(np.nanmin(lon_da.values)), float(np.nanmax(lon_da.values))
        lat_min, lat_max = float(np.nanmin(lat_da.values)), float(np.nanmax(lat_da.values))

    src_transform = from_bounds(lon_min, lat_min, lon_max, lat_max, data.shape[1], data.shape[0])
    dst_transform, dst_w, dst_h = calculate_default_transform(
        "EPSG:4326", "EPSG:3857", data.shape[1], data.shape[0], lon_min, lat_min, lon_max, lat_max,
        resolution=target_res(zoom_max),
    )
    dst = np.full((dst_h, dst_w), np.nan, dtype=np.float32)
    reproject(
        source=data, destination=dst, src_transform=src_transform, src_crs="EPSG:4326",
        dst_transform=dst_transform, dst_crs="EPSG:3857", src_nodata=np.nan, dst_nodata=np.nan,
        resampling=Resampling.bilinear,
    )

    if sigma > 0:
        if HAVE_SCIPY:
            invalid = np.isnan(dst)
            fill = dst.copy()
            mean_value = np.nanmean(dst)
            if np.isnan(mean_value):
                raise RuntimeError("All values are NaN after reprojection.")
            fill[invalid] = mean_value
            dst = gaussian_filter(fill, sigma=sigma)
            dst[invalid] = np.nan
        else:
            print("! Sigma > 0 but scipy is unavailable; skipping smoothing.")

    mkdir(out_tif.parent)
    with rasterio.open(
        out_tif, "w", driver="GTiff", height=dst_h, width=dst_w, count=1, dtype=rasterio.float32,
        crs="EPSG:3857", transform=dst_transform, tiled=True, compress="DEFLATE", predictor=2,
        blockxsize=256, blockysize=256, nodata=np.nan,
    ) as raster:
        raster.write(dst, 1)
    print(f"+ FLOAT GeoTIFF (3857, {dst_w}x{dst_h}, res={target_res(zoom_max):.1f}m): {out_tif}")
    return out_tif


def classify_binned(field: np.ndarray, style: StyleConfig) -> np.ndarray:
    invalid = np.isnan(field) | (field <= MIN_VALID) | (field > MAX_VISIBLE)
    safe = field.copy()
    safe[invalid] = HW_BINS[0]
    idx = np.digitize(safe, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(style.colors) - 1)
    rgba = np.zeros((*field.shape, 4), dtype=np.uint8)
    rgba[..., :3] = style.colors[idx]
    if style.alpha_stops is None:
        rgba[..., 3] = np.where(invalid, 0, 255).astype(np.uint8)
    else:
        x, y = zip(*style.alpha_stops)
        alpha = np.interp(safe, x, y)
        alpha[invalid] = 0
        rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


def write_rgba_tif(path: Path, rgba: np.ndarray, transform) -> None:
    mkdir(path.parent)
    with rasterio.open(
        path, "w", driver="GTiff", height=rgba.shape[0], width=rgba.shape[1], count=4,
        dtype=rasterio.uint8, crs="EPSG:3857", transform=transform, tiled=True, compress="DEFLATE",
        predictor=2, blockxsize=256, blockysize=256,
    ) as dst:
        for band in range(4):
            dst.write(rgba[..., band], band + 1)


def tiles_dir_for_var(base: Path, style: str, date_tag: str, var: str, var_count: int) -> Path:
    # Keep existing frontend-compatible path for the normal single-variable hs run.
    return base / style / date_tag if var_count == 1 else base / style / date_tag / var


def legend_path_for_var(base: Path, style: str, date_tag: str, var: str, var_count: int) -> Path:
    return tiles_dir_for_var(base, style, date_tag, var, var_count) / "legend.json"


def build_legend(var: str, date_tag: str, style: StyleConfig, zoom_min: int, zoom_max: int) -> dict:
    return {
        "model": "WW3", "variable": var, "units": "m" if var == "hs" else None,
        "bins": HW_BINS.tolist(), "colors_rgb": style.colors.astype(int).tolist(),
        "min_valid": MIN_VALID, "max_visible": MAX_VISIBLE, "style": style.name,
        "palette": style.palette, "zooms": {"min": zoom_min, "max": zoom_max},
        "date_tag": date_tag, "target_res_m": target_res(zoom_max),
    }


@dataclass(frozen=True)
class TilesetJob:
    float_tif: Path
    rgba_tif: Path
    tiles_out: Path
    legend_out: Path
    var: str
    date_tag: str
    style: StyleConfig
    zoom_min: int
    zoom_max: int
    processes: int
    skip_existing: bool
    dry_run: bool


def tileset_job(job: TilesetJob) -> None:
    if job.skip_existing and job.tiles_out.exists() and any(job.tiles_out.rglob("*.png")):
        print(f"= Tiles exist, skipping {job.style.name}: {job.tiles_out}")
        return
    with rasterio.open(job.float_tif) as src:
        field = src.read(1).astype(np.float32)
        transform = src.transform
    if not job.dry_run:
        write_rgba_tif(job.rgba_tif, classify_binned(field, job.style), transform)
    print(f"+ RGBA GeoTIFF ({job.style.name}) {job.var}: {job.rgba_tif}")
    run(["gdaladdo", "-r", "nearest", job.rgba_tif, "2", "4", "8", "16", "32", "64", "128"], job.dry_run)
    mkdir(job.tiles_out)
    run([
        *gdal2tiles_command(), "--xyz", "-z", f"{job.zoom_min}-{job.zoom_max}", "-r", "near", "-w", "none",
        f"--processes={job.processes}", job.rgba_tif, job.tiles_out,
    ], job.dry_run)
    mkdir(job.legend_out.parent)
    if not job.dry_run:
        with open(job.legend_out, "w", encoding="utf-8") as file:
            json.dump(build_legend(job.var, job.date_tag, job.style, job.zoom_min, job.zoom_max), file, indent=2)
            file.write("\n")
    print(f"+ Tiles ({job.style.name}) {job.var}: {job.tiles_out}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="WW3 NetCDF -> multi-style XYZ tile pipeline")
    parser.add_argument("ncfile", nargs="?", help="Path to NetCDF file. If omitted, latest gridded .nc is selected from --input-dir.")
    parser.add_argument("--input-dir", default=str(DEFAULT_INPUT_DIR))
    parser.add_argument("--var", dest="vars_legacy", default=None, help="Backward-compatible alias for --vars with one variable.")
    parser.add_argument("--vars", default=None, help=f"Comma-separated variables or 'all' (default: {','.join(DEFAULT_VARS)}).")
    parser.add_argument("--styles", default=None, help=f"Comma-separated styles or 'all' (default: {','.join(DEFAULT_STYLES)}).")
    parser.add_argument("--enable-night", action="store_true", help="Backward-compatible shortcut that adds the night style.")
    parser.add_argument("--sigma", type=float, default=DEFAULT_SIGMA)
    parser.add_argument("--geotiff-dir", default=str(DEFAULT_GEOTIFF_DIR))
    parser.add_argument("--tiles-dir", default=str(DEFAULT_TILES_DIR))
    parser.add_argument("--zoom-min", type=int, default=DEFAULT_ZOOM_MIN)
    parser.add_argument("--zoom-max", type=int, default=DEFAULT_ZOOM_MAX)
    parser.add_argument("--processes", type=int, default=DEFAULT_PROCESSES, help="Processes passed to gdal2tiles.py.")
    parser.add_argument("--style-workers", type=int, default=DEFAULT_STYLE_WORKERS, help="Parallel style jobs per variable.")
    parser.add_argument("--skip-existing", action="store_true", help="Skip float/tiles outputs that already exist.")
    parser.add_argument("--list-vars", action="store_true", help="Print detected gridded variables and exit.")
    parser.add_argument("--dry-run", action="store_true", help="Print external commands without running them.")
    return parser.parse_args()


def build_config(args: argparse.Namespace) -> Config:
    nc_path = Path(args.ncfile).resolve() if args.ncfile else pick_latest_gridded_nc(Path(args.input_dir))
    vars_value = args.vars_legacy if args.vars_legacy else args.vars
    styles = list(parse_csv(args.styles, DEFAULT_STYLES))
    if args.enable_night and "night" not in styles:
        styles.append("night")
    if args.zoom_min < 0 or args.zoom_max < args.zoom_min:
        raise ValueError(f"Invalid zoom range: {args.zoom_min}-{args.zoom_max}")
    if args.processes < 1 or args.style_workers < 1:
        raise ValueError("--processes and --style-workers must be >= 1")
    if args.sigma < 0:
        raise ValueError("--sigma must be >= 0")
    return Config(
        nc_path=nc_path, geotiff_dir=Path(args.geotiff_dir), tiles_dir=Path(args.tiles_dir),
        variables=parse_csv(vars_value, DEFAULT_VARS), styles=tuple(styles), sigma=args.sigma,
        zoom_min=args.zoom_min, zoom_max=args.zoom_max, processes=args.processes,
        style_workers=args.style_workers, skip_existing=args.skip_existing, dry_run=args.dry_run,
    )


def print_plan(config: Config, date_tag: str, variables: tuple[str, ...], styles: tuple[StyleConfig, ...]) -> None:
    print("\nWW3 NETCDF -> MULTI-STYLE XYZ PIPELINE")
    print("--------------------------------------------")
    print(f"Input file     : {config.nc_path}")
    print(f"Date tag       : {date_tag}")
    print(f"Variables      : {', '.join(variables)}")
    print(f"Styles         : {', '.join(style.name for style in styles)}")
    print(f"Sigma          : {config.sigma} (scipy={'yes' if HAVE_SCIPY else 'no'})")
    print(f"Target res     : {target_res(config.zoom_max):.1f} m/px (zoom {config.zoom_max})")
    print(f"Zooms          : {config.zoom_min}-{config.zoom_max}")
    print(f"Tile processes : {config.processes}")
    print(f"Style workers  : {config.style_workers}")
    print(f"Skip existing  : {config.skip_existing}")
    print(f"Dry run        : {config.dry_run}\n")


def main() -> None:
    args = parse_args()
    config = build_config(args)
    if not config.dry_run:
        require_executable("gdaladdo")
        gdal2tiles_command()

    date_tag = extract_date_from_name(config.nc_path.name)
    with xr.open_dataset(config.nc_path) as ds:
        variables = resolve_variables(ds, config.variables)
        if args.list_vars:
            print("\n".join(variables))
            return
    styles = resolve_styles(config.styles)
    print_plan(config, date_tag, variables, styles)
    mkdir(config.geotiff_dir)
    mkdir(config.tiles_dir)

    for var in variables:
        print(f"\n=== {var} ===")
        float_tif = config.geotiff_dir / "WW3_float3857" / f"{date_tag}_{var}_3857_float.tif"
        rgba_base = config.geotiff_dir / "WW3_rgba3857" / date_tag / var
        build_float3857(config.nc_path, var, float_tif, config.sigma, config.zoom_max, config.skip_existing)
        jobs = tuple(TilesetJob(
            float_tif=float_tif,
            rgba_tif=rgba_base / f"{date_tag}_{var}_{style.name}_3857_rgba.tif",
            tiles_out=tiles_dir_for_var(config.tiles_dir, style.name, date_tag, var, len(variables)),
            legend_out=legend_path_for_var(config.tiles_dir, style.name, date_tag, var, len(variables)),
            var=var, date_tag=date_tag, style=style, zoom_min=config.zoom_min, zoom_max=config.zoom_max,
            processes=config.processes, skip_existing=config.skip_existing, dry_run=config.dry_run,
        ) for style in styles)
        max_workers = min(len(jobs), config.style_workers)
        if max_workers == 1:
            for job in jobs:
                tileset_job(job)
        else:
            with ProcessPoolExecutor(max_workers=max_workers) as executor:
                list(executor.map(tileset_job, jobs))
        print(f"\n+ {var} done: {date_tag}")

    print("\n+ All WW3 processing complete.")
    print("Generated:")
    for style in styles:
        for var in variables:
            print(f"  - {tiles_dir_for_var(config.tiles_dir, style.name, date_tag, var, len(variables))} ({style.name}/{var})")
    print(f"\nDATE_TAG={date_tag}")


if __name__ == "__main__":
    main()
