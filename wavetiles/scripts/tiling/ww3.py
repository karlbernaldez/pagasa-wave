#!/usr/bin/env python3
"""
WW3 NetCDF (gridded) → WebMercator FLOAT GeoTIFF (once) → MULTI-STYLE RGBA GeoTIFFs → XYZ tiles

Outputs (per var):
  - tiles/WW3/light/<DATE_TAG>/{z}/{x}/{y}.png
  - tiles/WW3/dark/<DATE_TAG>/{z}/{x}/{y}.png
Optionally:
  - tiles/WW3/night/<DATE_TAG>/{z}/{x}/{y}.png

Usage (CLI):
  python3 ww3.py <NCFILE> [--var VAR] [--sigma S] [--geotiff-dir D] [--tiles-dir D]
                           [--zoom-min Z] [--zoom-max Z] [--processes N] [--enable-night]

Requires: rasterio, numpy, xarray, GDAL utilities (gdaladdo, gdal2tiles.py) in PATH.
Optional: scipy for gaussian smoothing.
"""

import argparse
import json
import re
import subprocess
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

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


# ============================================================
# DEFAULTS
# ============================================================
DEFAULT_INPUT_DIR   = Path("../input/2026011200/")
DEFAULT_GEOTIFF_DIR = Path("../geotiff")
DEFAULT_TILES_DIR   = Path("../tiles/WW3")
DEFAULT_FIXED_VARS  = ["hs"]
DEFAULT_SIGMA       = 1.5   # gaussian smoothing in float space
DEFAULT_ZOOM_MIN    = 0
DEFAULT_ZOOM_MAX    = 8
DEFAULT_PROCESSES   = 4

M_PER_PX_Z0  = 156543.03392804097
TARGET_RES_M = M_PER_PX_Z0 / (2 ** DEFAULT_ZOOM_MAX)

MIN_VALID   = 0.05   # m; <= this → transparent
MAX_VISIBLE = 20.0   # m; >  this → transparent


# ============================================================
# BINS / PALETTES
# ============================================================
HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)

HW_COLORS_DEFAULT = np.array(
    [
        [0xCA, 0xED, 0xFB], [0x60, 0xCA, 0xF3], [0x0E, 0x9E, 0xD4],
        [0xC1, 0xF1, 0xC9], [0x82, 0xE2, 0x8F], [0x01, 0xB0, 0x51],
        [0xFF, 0xFF, 0x00], [0xFF, 0xE7, 0x01], [0xFE, 0xA4, 0x01],
        [0xFE, 0x00, 0x01], [0xAA, 0x15, 0x01], [0xAB, 0x45, 0x00],
        [0x6C, 0x33, 0x00], [0xD8, 0x6D, 0xCD], [0x79, 0x20, 0x70],
        [0x51, 0x15, 0x4A], [0x15, 0x61, 0x83], [0x0F, 0x29, 0x41],
        [0x81, 0x81, 0x80], [0x40, 0x40, 0x40],
    ],
    dtype=np.uint8,
)

HW_COLORS_DARK = np.array(
    [
        [8,  40,  60], [12,  70, 100], [18, 110, 150], [20, 140, 160],
        [30, 170, 140], [40, 190, 120], [90, 200, 110], [140, 210,  90],
        [190, 200, 70], [220, 180,  60], [240, 150,  50], [245, 120,  45],
        [250,  90,  40], [240,  60,  80], [220,  40, 120], [190,  30, 150],
        [140,  30, 170], [100,  30, 180], [160, 160, 160], [210, 210, 210],
    ],
    dtype=np.uint8,
)

HW_COLORS_NIGHT = np.array(
    [
        [8,   8,   8], [30,   0,   0], [60,   0,   0], [90,  10,   0],
        [120, 20,   0], [150,  30,   0], [180,  40,   0], [210,  60,   0],
        [240, 90,   0], [255, 120,   0], [255, 150,  20], [255, 180,  60],
        [255, 210, 100], [255, 240, 150], [255, 255, 200], [255, 255, 255],
        [255, 255, 255], [255, 255, 255], [200, 200, 200], [160, 160, 160],
    ],
    dtype=np.uint8,
)


# ============================================================
# Helpers
# ============================================================
def run(cmd: list) -> None:
    cmd = [str(c) for c in cmd]
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def mkdir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def extract_date_from_name(name: str) -> str:
    m = re.search(r"(\d{8})T(\d{2})", name)
    if m:
        return f"{m.group(1)}{m.group(2)}"
    m2 = re.search(r"\d{10}", name)
    if m2:
        return m2.group(0)
    return "unknown"


def first_time(da: xr.DataArray) -> xr.DataArray:
    for tdim in ("time", "Time", "forecast_time"):
        if tdim in da.dims:
            return da.isel({tdim: 0})
    return da


def find_lat_lon(ds: xr.Dataset):
    lat_names = ("lat", "latitude", "Latitude", "LATITUDE", "nav_lat", "y", "YLAT")
    lon_names = ("lon", "longitude", "Longitude", "LONGITUDE", "nav_lon", "x", "XLON")
    for src in (ds.coords, ds.variables):
        for la in lat_names:
            for lo in lon_names:
                if la in src and lo in src:
                    return ds[la], ds[lo]
    raise RuntimeError("Could not find lat/lon coordinates.")


def needs_flip(lat_vals: np.ndarray) -> bool:
    lat = np.asarray(lat_vals)
    if lat.ndim == 1:
        return bool(lat[0] < lat[-1])
    if lat.ndim == 2:
        return bool(np.nanmean(lat[0, :]) < np.nanmean(lat[-1, :]))
    return True


def is_point_or_spectral(ds: xr.Dataset) -> bool:
    keys = {v.lower() for v in list(ds.variables) + list(ds.coords)}
    has_station = "station" in keys or "station_name" in keys
    has_freq_dir = ("frequency" in keys or "freq" in keys) and (
        "direction" in keys or "dir" in keys
    )
    return has_station and has_freq_dir


def is_gridded(ds: xr.Dataset) -> bool:
    if is_point_or_spectral(ds):
        return False
    try:
        lat_da, lon_da = find_lat_lon(ds)
    except Exception:
        return False
    ignore = {lat_da.name, lon_da.name, "time", "Time", "forecast_time"}
    return any(ds[v].ndim >= 2 for v in ds.data_vars if v not in ignore)


def pick_latest_gridded_nc(input_dir: Path) -> Path:
    ncs = sorted(input_dir.rglob("*.nc"))
    if not ncs:
        raise RuntimeError(f"No .nc files found under {input_dir}")
    for nc in reversed(ncs):
        try:
            if is_gridded(xr.open_dataset(nc)):
                return nc
        except Exception:
            continue
    raise RuntimeError(f"No gridded WW3 NetCDF files found under {input_dir}")


def detect_gridded_vars(ds: xr.Dataset, lat_name: str, lon_name: str) -> list:
    ignore = {lat_name, lon_name, "time", "Time", "forecast_time"}
    return [
        v for v in ds.data_vars
        if v not in ignore
        and ds[v].ndim >= 2
        and np.issubdtype(ds[v].dtype, np.number)
    ]


# ============================================================
# Reproject + smooth: NetCDF var → float32 GeoTIFF (EPSG:3857)
# ============================================================
def build_float3857(
    nc_path: Path, var: str, out_tif: Path, sigma: float, zoom_max: int
) -> Path:
    target_res = M_PER_PX_Z0 / (2 ** zoom_max)

    ds = xr.open_dataset(nc_path)
    if var not in ds.data_vars and var not in ds.variables:
        raise KeyError(f"Variable '{var}' not found. Available: {list(ds.data_vars)}")

    lat_da, lon_da = find_lat_lon(ds)
    data = first_time(ds[var]).astype(np.float32).values

    if data.ndim > 2:
        data = np.squeeze(data)
    if data.ndim != 2:
        raise RuntimeError(
            f"Variable '{var}' is not 2D after squeeze (ndim={data.ndim})."
        )

    if needs_flip(lat_da.values):
        data = np.flipud(data)

    lon_min = float(np.nanmin(lon_da))
    lon_max = float(np.nanmax(lon_da))
    lat_min = float(np.nanmin(lat_da))
    lat_max = float(np.nanmax(lat_da))

    src_transform = from_bounds(
        lon_min, lat_min, lon_max, lat_max, data.shape[1], data.shape[0]
    )

    dst_transform, dst_w, dst_h = calculate_default_transform(
        "EPSG:4326", "EPSG:3857",
        data.shape[1], data.shape[0],
        lon_min, lat_min, lon_max, lat_max,
        resolution=target_res,
    )

    dst = np.full((dst_h, dst_w), np.nan, dtype=np.float32)
    reproject(
        source=data,
        destination=dst,
        src_transform=src_transform,
        src_crs="EPSG:4326",
        dst_transform=dst_transform,
        dst_crs="EPSG:3857",
        src_nodata=np.nan,
        dst_nodata=np.nan,
        resampling=Resampling.bilinear,
    )

    if sigma > 0:
        if HAVE_SCIPY:
            mask = np.isnan(dst)
            fill = dst.copy()
            mean_val = np.nanmean(dst)
            if np.isnan(mean_val):
                raise RuntimeError("All values are NaN after reprojection.")
            fill[mask] = mean_val
            sm = gaussian_filter(fill, sigma=sigma)
            sm[mask] = np.nan
            dst = sm
        else:
            print("! SIGMA > 0 but scipy not available; skipping smoothing.")

    mkdir(out_tif.parent)
    with rasterio.open(
        out_tif, "w",
        driver="GTiff", height=dst_h, width=dst_w,
        count=1, dtype=rasterio.float32,
        crs="EPSG:3857", transform=dst_transform,
        tiled=True, compress="DEFLATE", predictor=2,
        blockxsize=256, blockysize=256, nodata=np.nan,
    ) as f:
        f.write(dst, 1)

    print(f"✓ FLOAT GeoTIFF (3857, {dst_w}x{dst_h} px, res={target_res:.1f}m): {out_tif}")
    return out_tif


# ============================================================
# Classifiers: hard np.digitize bins — matches ECWAM / MRI3 style
# ============================================================
def _mask(field: np.ndarray) -> np.ndarray:
    return np.isnan(field) | (field <= MIN_VALID) | (field > MAX_VISIBLE)


def classify_default(field: np.ndarray) -> np.ndarray:
    invalid = _mask(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_DEFAULT) - 1)

    rgba = np.zeros((*field.shape, 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_DEFAULT[idx]
    rgba[..., 3] = np.where(invalid, 0, 255).astype(np.uint8)
    return rgba


def classify_dark(field: np.ndarray) -> np.ndarray:
    invalid = _mask(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_DARK) - 1)

    rgba = np.zeros((*field.shape, 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_DARK[idx]

    alpha = np.interp(
        f,
        [0.0, 0.5, 1.5, 3.0, 6.0, 10.0],
        [0,   40,  90,  160, 220, 255],
    )
    alpha[invalid] = 0
    rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


def classify_night(field: np.ndarray) -> np.ndarray:
    invalid = _mask(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_NIGHT) - 1)

    rgba = np.zeros((*field.shape, 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_NIGHT[idx]

    alpha = np.interp(f, [0.0, 0.5, 2.0, 5.0, 10.0], [0, 30, 110, 200, 255])
    alpha[invalid] = 0
    rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


CLASSIFIERS = {
    "light": classify_default,
    "dark":  classify_dark,
    "night": classify_night,
}


def write_rgba_tif(path: Path, rgba: np.ndarray, transform) -> None:
    mkdir(path.parent)
    with rasterio.open(
        path, "w",
        driver="GTiff", height=rgba.shape[0], width=rgba.shape[1],
        count=4, dtype=rasterio.uint8,
        crs="EPSG:3857", transform=transform,
        tiled=True, compress="DEFLATE", predictor=2,
        blockxsize=256, blockysize=256,
    ) as dst:
        for b in range(4):
            dst.write(rgba[..., b], b + 1)


# ============================================================
# Tile job (runs in worker process)
# ============================================================
def tileset_job(args):
    (
        float_tif, rgba_tif, tiles_out, legend_out,
        var, date_tag, style, palette, colors_rgb,
        zoom_min, zoom_max, processes,
    ) = args

    with rasterio.open(float_tif) as src:
        field = src.read(1).astype(np.float32)
        transform = src.transform

    rgba = CLASSIFIERS[style](field)
    write_rgba_tif(rgba_tif, rgba, transform)
    print(f"✓ RGBA GeoTIFF ({style}) {var}: {rgba_tif}")

    # Use nearest-neighbor to preserve hard color band edges — matches ECWAM/MRI3
    run(["gdaladdo", "-r", "nearest", rgba_tif, "2", "4", "8", "16", "32", "64", "128"])

    mkdir(tiles_out)
    run([
        "gdal2tiles.py", "--xyz",
        "-z", f"{zoom_min}-{zoom_max}",
        "-r", "near",               # nearest — preserves sharp color bands
        "-w", "none",
        f"--processes={processes}",
        rgba_tif, tiles_out,
    ])

    legend = {
        "model": "WW3",
        "variable": var,
        "units": "m" if var == "hs" else None,
        "bins": HW_BINS.tolist(),
        "colors_rgb": colors_rgb,
        "min_valid": MIN_VALID,
        "max_visible": MAX_VISIBLE,
        "style": style,
        "palette": palette,
        "zooms": {"min": zoom_min, "max": zoom_max},
        "date_tag": date_tag,
        "target_res_m": M_PER_PX_Z0 / (2 ** zoom_max),
    }
    mkdir(legend_out.parent)
    with open(legend_out, "w") as f:
        json.dump(legend, f, indent=2)

    print(f"✓ Tiles ({style}) {var}: {tiles_out}")


# ============================================================
# CLI
# ============================================================
def parse_args():
    p = argparse.ArgumentParser(
        description="WW3 NetCDF → multi-style XYZ tile pipeline"
    )
    p.add_argument("ncfile", nargs="?",
                   help="Path to NetCDF file (overrides INPUT_DIR auto-detect)")
    p.add_argument("--var",          dest="varname", default=None,
                   help="Variable name (default: hs)")
    p.add_argument("--sigma",        type=float,     default=None,
                   help=f"Gaussian smoothing sigma (default: {DEFAULT_SIGMA})")
    p.add_argument("--geotiff-dir",  default=None,   help="Output GeoTIFF dir")
    p.add_argument("--tiles-dir",    default=None,   help="Output tiles dir")
    p.add_argument("--zoom-min",     type=int,       default=None)
    p.add_argument("--zoom-max",     type=int,       default=None)
    p.add_argument("--processes",    type=int,       default=None)
    p.add_argument("--enable-night", action="store_true", default=False)
    return p.parse_args()


# ============================================================
# Main
# ============================================================
def main():
    args = parse_args()

    nc_path      = Path(args.ncfile).resolve() if args.ncfile else None
    geotiff_dir  = Path(args.geotiff_dir) if args.geotiff_dir else DEFAULT_GEOTIFF_DIR
    tiles_dir    = Path(args.tiles_dir)   if args.tiles_dir   else DEFAULT_TILES_DIR
    sigma        = args.sigma     if args.sigma     is not None else DEFAULT_SIGMA
    zoom_min     = args.zoom_min  if args.zoom_min  is not None else DEFAULT_ZOOM_MIN
    zoom_max     = args.zoom_max  if args.zoom_max  is not None else DEFAULT_ZOOM_MAX
    processes    = args.processes if args.processes is not None else DEFAULT_PROCESSES
    fixed_vars   = [args.varname] if args.varname else DEFAULT_FIXED_VARS
    enable_night = args.enable_night

    if nc_path is None:
        nc_path = pick_latest_gridded_nc(DEFAULT_INPUT_DIR)

    date_tag   = extract_date_from_name(nc_path.name)
    target_res = M_PER_PX_Z0 / (2 ** zoom_max)

    print("\nWW3 NETCDF → MULTI-STYLE XYZ PIPELINE")
    print("--------------------------------------------")
    print(f"Input file   : {nc_path}")
    print(f"Date tag     : {date_tag}")
    print(f"Sigma        : {sigma} (scipy={'yes' if HAVE_SCIPY else 'no'})")
    print(f"Target res   : {target_res:.1f} m/px  (zoom {zoom_max})")
    print(f"Zooms        : {zoom_min}-{zoom_max}")
    print(f"Processes    : {processes}")

    mkdir(geotiff_dir)
    mkdir(tiles_dir)

    ds = xr.open_dataset(nc_path)
    lat_da, lon_da = find_lat_lon(ds)

    vars_to_process = [v for v in fixed_vars if v in ds.data_vars or v in ds.variables]
    missing = [v for v in fixed_vars if v not in vars_to_process]
    if missing:
        print(f"Note: vars not found, skipping: {missing}")
    if not vars_to_process and not fixed_vars:
        vars_to_process = detect_gridded_vars(ds, lat_da.name, lon_da.name)
    if not vars_to_process:
        raise RuntimeError("No suitable 2D gridded variables found.")

    print(f"Variables    : {vars_to_process}\n")

    styles = [
        {"style": "light", "palette": "mri3-like",   "colors_rgb": HW_COLORS_DEFAULT.tolist()},
        {"style": "dark",  "palette": "dark-marine",  "colors_rgb": HW_COLORS_DARK.tolist()},
    ]
    if enable_night:
        styles.append(
            {"style": "night", "palette": "ecdis-night", "colors_rgb": HW_COLORS_NIGHT.tolist()}
        )

    for var in vars_to_process:
        print(f"\n=== {var} ===")

        float_tif = geotiff_dir / "WW3_float3857" / f"{date_tag}_{var}_3857_float.tif"
        rgba_base = geotiff_dir / "WW3_rgba3857" / date_tag / var

        mkdir(float_tif.parent)
        mkdir(rgba_base)

        # 1) Reproject + smooth ONCE at zoom-max resolution
        build_float3857(nc_path, var, float_tif, sigma, zoom_max)

        # 2) Classify + tile each style in parallel
        jobs = [
            (
                float_tif,
                rgba_base / f"{date_tag}_{var}_{s['style']}_3857_rgba.tif",
                tiles_dir / s["style"] / date_tag,
                tiles_dir / s["style"] / "legend.json",
                var, date_tag, s["style"], s["palette"], s["colors_rgb"],
                zoom_min, zoom_max, processes,
            )
            for s in styles
        ]

        with ProcessPoolExecutor(max_workers=min(len(jobs), 3)) as exe:
            list(exe.map(tileset_job, jobs))

        print(f"\n✓ {var} done: {date_tag}")

    print("\n✓ All processing complete.")
    print("Generated:")
    for s in styles:
        print(f"  - {tiles_dir / s['style'] / date_tag}  ({s['style']})")

    print(f"\nDATE_TAG={date_tag}")


if __name__ == "__main__":
    main()
