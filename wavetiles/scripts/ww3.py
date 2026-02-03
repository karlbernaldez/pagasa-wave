#!/usr/bin/env python3
"""
WW3 NetCDF (gridded) → WebMercator FLOAT GeoTIFF (once) → MULTI-STYLE RGBA GeoTIFFs → XYZ tiles

Outputs (per var):
  - tiles/WW3/light/<DATE_TAG>/<var>/{z}/{x}/{y}.png
  - tiles/WW3/dark/<DATE_TAG>/<var>/{z}/{x}/{y}.png
Optionally:
  - tiles/WW3/night/<DATE_TAG>/<var>/{z}/{x}/{y}.png

Notes:
- Reprojects + smooths ONCE per variable to an intermediate float32 3857 GeoTIFF.
- Then generates multiple styled RGBA GeoTIFFs + tilesets in PARALLEL.
- Requires: rasterio, numpy, xarray, GDAL utilities (gdaladdo, gdal2tiles.py) in PATH.
- Optional: scipy for gaussian smoothing.
"""

import os
import re
import json
import subprocess
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import xarray as xr
import rasterio
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject, Resampling

# Optional smoothing
try:
    from scipy.ndimage import gaussian_filter  # type: ignore

    HAVE_SCIPY = True
except Exception:
    HAVE_SCIPY = False


# ============================================================
# CONFIG — EDIT HERE ONLY
# ============================================================
INPUT_DIR = Path("../input/2026011200/")  # folder that contains WW3 NetCDF outputs
OUTPUT_GEOTIFF_DIR = Path("../geotiff")
OUTPUT_TILES_DIR = Path("../tiles/WW3")

# Variable selection:
FIXED_VARS = [
    "hs"
]  # set [] to auto-detect 2D vars (NOTE: bins/colors below are for HS)

# Reprojection/smoothing
SIGMA = 0.8  # gaussian sigma in pixels in 3857 grid (0 to disable)
UPSCALE = 1.0  # 2.0 = 2x width/height in 3857 (heavier, smoother)
ZOOM_MIN = 0
ZOOM_MAX = 8
PROCESSES = 4  # gdal2tiles internal workers per style

# Force a particular file (optional)
FORCE_NCFILE = None  # e.g. Path("../input/.../ww3_grdo.20260115T00.nc")

# Visibility thresholds (tuned like ECWAM)
MIN_VALID = 0.05  # m; <= this is transparent
MAX_VISIBLE = 20.0  # m; > this is transparent (avoid extreme junk)


# ============================================================
# BINS / PALETTES (HS)
# ============================================================
HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)

# Default (MRI3-like)
HW_COLORS_DEFAULT = np.array(
    [
        [0xCA, 0xED, 0xFB],
        [0x60, 0xCA, 0xF3],
        [0x0E, 0x9E, 0xD4],
        [0xC1, 0xF1, 0xC9],
        [0x82, 0xE2, 0x8F],
        [0x01, 0xB0, 0x51],
        [0xFF, 0xFF, 0x00],
        [0xFF, 0xE7, 0x01],
        [0xFE, 0xA4, 0x01],
        [0xFE, 0x00, 0x01],
        [0xAA, 0x15, 0x01],
        [0xAB, 0x45, 0x00],
        [0x6C, 0x33, 0x00],
        [0xD8, 0x6D, 0xCD],
        [0x79, 0x20, 0x70],
        [0x51, 0x15, 0x4A],
        [0x15, 0x61, 0x83],
        [0x0F, 0x29, 0x41],
        [0x81, 0x81, 0x80],
        [0x40, 0x40, 0x40],
    ],
    dtype=np.uint8,
)

# Dark-safe palette
HW_COLORS_DARK = np.array(
    [
        [8, 40, 60],
        [12, 70, 100],
        [18, 110, 150],
        [20, 140, 160],
        [30, 170, 140],
        [40, 190, 120],
        [90, 200, 110],
        [140, 210, 90],
        [190, 200, 70],
        [220, 180, 60],
        [240, 150, 50],
        [245, 120, 45],
        [250, 90, 40],
        [240, 60, 80],
        [220, 40, 120],
        [190, 30, 150],
        [140, 30, 170],
        [100, 30, 180],
        [160, 160, 160],
        [210, 210, 210],
    ],
    dtype=np.uint8,
)

# Optional ECDIS-ish night palette
HW_COLORS_NIGHT = np.array(
    [
        [8, 8, 8],
        [30, 0, 0],
        [60, 0, 0],
        [90, 10, 0],
        [120, 20, 0],
        [150, 30, 0],
        [180, 40, 0],
        [210, 60, 0],
        [240, 90, 0],
        [255, 120, 0],
        [255, 150, 20],
        [255, 180, 60],
        [255, 210, 100],
        [255, 240, 150],
        [255, 255, 200],
        [255, 255, 255],
        [255, 255, 255],
        [255, 255, 255],
        [200, 200, 200],
        [160, 160, 160],
    ],
    dtype=np.uint8,
)

ENABLE_NIGHT = False  # set True if you want WW3/night output too


# ============================================================
# Helpers
# ============================================================
def run(cmd):
    cmd = [str(c) for c in cmd]
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def mkdir(p: Path):
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


def find_lat_lon_da(ds: xr.Dataset):
    lat_candidates = ("lat", "latitude", "Latitude", "LATITUDE", "nav_lat", "y", "YLAT")
    lon_candidates = (
        "lon",
        "longitude",
        "Longitude",
        "LONGITUDE",
        "nav_lon",
        "x",
        "XLON",
    )

    for la in lat_candidates:
        for lo in lon_candidates:
            if la in ds.coords and lo in ds.coords:
                return ds[la], ds[lo]
    for la in lat_candidates:
        for lo in lon_candidates:
            if la in ds.variables and lo in ds.variables:
                return ds[la], ds[lo]

    raise RuntimeError(
        "Could not find lat/lon. Checked coords and variables for common names."
    )


def is_point_or_spectral(ds: xr.Dataset) -> bool:
    vars_lower = {v.lower() for v in list(ds.variables) + list(ds.coords)}
    has_station = "station" in vars_lower or "station_name" in vars_lower
    has_freq_dir = ("frequency" in vars_lower or "freq" in vars_lower) and (
        "direction" in vars_lower or "dir" in vars_lower
    )
    return has_station and has_freq_dir


def is_gridded(ds: xr.Dataset) -> bool:
    if is_point_or_spectral(ds):
        return False
    try:
        lat_da, lon_da = find_lat_lon_da(ds)
    except Exception:
        return False
    ignore = {lat_da.name, lon_da.name, "time", "Time", "forecast_time"}
    for v in ds.data_vars:
        if v in ignore:
            continue
        if ds[v].ndim >= 2:
            return True
    return False


def pick_latest_gridded_nc(input_dir: Path) -> Path:
    ncs = sorted(input_dir.rglob("*.nc"))
    if not ncs:
        raise RuntimeError(f"No .nc files found under {input_dir}")

    for nc in reversed(ncs):
        try:
            ds = xr.open_dataset(nc)
            if is_gridded(ds):
                return nc
        except Exception:
            continue

    raise RuntimeError("No gridded WW3 NetCDF files found under input dir.")


def detect_gridded_vars(ds: xr.Dataset, lat_name: str, lon_name: str):
    ignore = {lat_name, lon_name, "time", "Time", "forecast_time"}
    out = []
    for v in ds.data_vars:
        if v in ignore:
            continue
        da = ds[v]
        if da.ndim >= 2 and np.issubdtype(da.dtype, np.number):
            out.append(v)
    return out


def _needs_flip_north_up(lat_vals: np.ndarray) -> bool:
    # Returns True if first row corresponds to SOUTH (lat increasing), so we need flipud.
    lat = np.asarray(lat_vals)
    if lat.ndim == 1:
        return bool(lat[0] < lat[-1])  # increasing => south->north
    if lat.ndim == 2:
        top_mean = np.nanmean(lat[0, :])
        bot_mean = np.nanmean(lat[-1, :])
        return bool(top_mean < bot_mean)
    return True


# ============================================================
# Reproject/smooth once: NetCDF var → float32 GeoTIFF (EPSG:3857)
# ============================================================
def build_float3857_geotiff(
    nc_path: Path, var: str, out_float_tif: Path, sigma: float, upscale: float
):
    ds = xr.open_dataset(nc_path)

    if var not in ds.data_vars and var not in ds.variables:
        raise KeyError(f"Variable '{var}' not found. Available: {list(ds.data_vars)}")

    lat_da, lon_da = find_lat_lon_da(ds)
    lat = lat_da.values
    lon = lon_da.values

    da = first_time(ds[var]).astype(np.float32)
    data = da.values

    if data.ndim > 2:
        data = np.squeeze(data)

    if data.ndim != 2:
        raise RuntimeError(
            f"Variable '{var}' is not 2D after slicing/squeezing (ndim={data.ndim})."
        )

    # Handle orientation (north-up)
    if _needs_flip_north_up(lat):
        data = np.flipud(data)

    # Compute bounds in 4326 using min/max (rectangular extent)
    lon_min, lon_max = float(np.nanmin(lon)), float(np.nanmax(lon))
    lat_min, lat_max = float(np.nanmin(lat)), float(np.nanmax(lat))

    src_transform = from_bounds(
        lon_min, lat_min, lon_max, lat_max, data.shape[1], data.shape[0]
    )
    src_crs = "EPSG:4326"
    dst_crs = "EPSG:3857"

    # Base grid sizing in 3857
    dst_transform, dst_width, dst_height = calculate_default_transform(
        src_crs,
        dst_crs,
        data.shape[1],
        data.shape[0],
        lon_min,
        lat_min,
        lon_max,
        lat_max,
    )

    dst_width = int(dst_width * float(upscale))
    dst_height = int(dst_height * float(upscale))

    # Recompute transform for new size
    dst_transform, _, _ = calculate_default_transform(
        src_crs,
        dst_crs,
        data.shape[1],
        data.shape[0],
        lon_min,
        lat_min,
        lon_max,
        lat_max,
        dst_width=dst_width,
        dst_height=dst_height,
    )

    dst = np.full((dst_height, dst_width), np.nan, dtype=np.float32)

    reproject(
        source=data,
        destination=dst,
        src_transform=src_transform,
        src_crs=src_crs,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        src_nodata=np.nan,
        dst_nodata=np.nan,
        resampling=Resampling.bilinear,
    )

    # Optional smoothing in float space
    if sigma and sigma > 0:
        if HAVE_SCIPY:
            mask = np.isnan(dst)
            fill = dst.copy()
            mean_val = np.nanmean(dst)
            if np.isnan(mean_val):
                raise RuntimeError(
                    "All values are NaN after reprojection; check input grid/var."
                )
            fill[mask] = mean_val
            sm = gaussian_filter(fill, sigma=float(sigma))
            sm[mask] = np.nan
            dst = sm
        else:
            print("! SIGMA > 0 but scipy not available; skipping smoothing.\n")

    # Write float GeoTIFF
    mkdir(out_float_tif.parent)
    profile = {
        "driver": "GTiff",
        "height": dst.shape[0],
        "width": dst.shape[1],
        "count": 1,
        "dtype": rasterio.float32,
        "crs": dst_crs,
        "transform": dst_transform,
        "tiled": True,
        "compress": "DEFLATE",
        "predictor": 2,
        "blockxsize": 256,
        "blockysize": 256,
        "nodata": np.nan,
    }

    with rasterio.open(out_float_tif, "w", **profile) as out:
        out.write(dst, 1)

    print(f"✓ FLOAT GeoTIFF (3857): {out_float_tif}")
    return out_float_tif


# ============================================================
# Classifiers (float → RGBA)
# ============================================================
def _mask_invalid(field: np.ndarray) -> np.ndarray:
    return np.isnan(field) | (field <= MIN_VALID) | (field > MAX_VISIBLE)


def classify_rgba_default(field: np.ndarray) -> np.ndarray:
    invalid = _mask_invalid(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_DEFAULT) - 1)

    rgba = np.zeros((field.shape[0], field.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_DEFAULT[idx]
    rgba[..., 3] = np.where(invalid, 0, 255).astype(np.uint8)
    return rgba


def classify_rgba_dark(field: np.ndarray) -> np.ndarray:
    invalid = _mask_invalid(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_DARK) - 1)

    rgba = np.zeros((field.shape[0], field.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_DARK[idx]

    # Alpha ramp tuned for dark basemaps
    alpha = np.interp(
        f,
        [0.0, 0.5, 1.5, 3.0, 6.0, 10.0],
        [0, 40, 90, 160, 220, 255],
    )
    alpha[invalid] = 0
    rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


def classify_rgba_night(field: np.ndarray) -> np.ndarray:
    invalid = _mask_invalid(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_NIGHT) - 1)

    rgba = np.zeros((field.shape[0], field.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_NIGHT[idx]

    alpha = np.interp(
        f,
        [0.0, 0.5, 2.0, 5.0, 10.0],
        [0, 30, 110, 200, 255],
    )
    alpha[invalid] = 0
    rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


def write_rgba_geotiff(path: Path, rgba: np.ndarray, transform) -> None:
    profile = {
        "driver": "GTiff",
        "height": rgba.shape[0],
        "width": rgba.shape[1],
        "count": 4,
        "dtype": rasterio.uint8,
        "crs": "EPSG:3857",
        "transform": transform,
        "tiled": True,
        "compress": "DEFLATE",
        "predictor": 2,
        "blockxsize": 256,
        "blockysize": 256,
    }
    mkdir(path.parent)
    with rasterio.open(path, "w", **profile) as dst:
        for b in range(4):
            dst.write(rgba[..., b], b + 1)


# ============================================================
# Style worker: float tif → rgba tif → overviews → tiles → legend
# ============================================================
def generate_tileset_job(args):
    (
        float_tif,
        rgba_tif,
        tiles_out,
        legend_out,
        var_name,
        date_tag,
        style_name,
        palette_name,
        colors_rgb,
        classify_kind,
    ) = args

    mkdir(rgba_tif.parent)
    mkdir(tiles_out)

    with rasterio.open(float_tif) as src:
        field = src.read(1).astype(np.float32)
        transform = src.transform

    if classify_kind == "default":
        rgba = classify_rgba_default(field)
    elif classify_kind == "dark":
        rgba = classify_rgba_dark(field)
    elif classify_kind == "night":
        rgba = classify_rgba_night(field)
    else:
        raise ValueError(f"Unknown classify_kind: {classify_kind}")

    write_rgba_geotiff(rgba_tif, rgba, transform)
    print(f"✓ RGBA GeoTIFF ({style_name}) {var_name}: {rgba_tif}")

    run(["gdaladdo", "-r", "nearest", rgba_tif, "2", "4", "8", "16", "32", "64", "128"])

    run(
        [
            "gdal2tiles.py",
            "--xyz",
            "-z",
            f"{ZOOM_MIN}-{ZOOM_MAX}",
            "-r",
            "near",
            "-w",
            "none",
            f"--processes={PROCESSES}",
            rgba_tif,
            tiles_out,
        ]
    )

    legend = {
        "model": "WW3",
        "variable": var_name,
        "units": "m" if var_name == "hs" else None,
        "bins": HW_BINS.tolist(),
        "colors_rgb": colors_rgb,
        "min_valid": MIN_VALID,
        "max_visible": MAX_VISIBLE,
        "sigma": SIGMA,
        "upscale": UPSCALE,
        "style": style_name,
        "palette": palette_name,
        "zooms": {"min": ZOOM_MIN, "max": ZOOM_MAX},
        "date_tag": date_tag,
    }
    mkdir(legend_out.parent)
    with open(legend_out, "w") as f:
        json.dump(legend, f, indent=2)

    print(f"✓ Tiles ({style_name}) {var_name}: {tiles_out}")
    print(f"✓ Legend ({style_name}) {var_name}: {legend_out}")


# ============================================================
# Main
# ============================================================
def main():
    print("\nWW3 NETCDF → MULTI-STYLE XYZ PIPELINE")
    print("--------------------------------------------")

    mkdir(OUTPUT_GEOTIFF_DIR)
    mkdir(OUTPUT_TILES_DIR)

    nc_path = (
        Path(FORCE_NCFILE).resolve()
        if FORCE_NCFILE
        else pick_latest_gridded_nc(INPUT_DIR)
    )
    date_tag = extract_date_from_name(nc_path.name)

    print(f"Input file : {nc_path}")
    print(f"Date tag   : {date_tag}")
    print(f"Sigma      : {SIGMA} (scipy={'yes' if HAVE_SCIPY else 'no'})")
    print(f"Upscale    : {UPSCALE}")
    print(f"Zooms      : {ZOOM_MIN}-{ZOOM_MAX}")
    print(f"Processes  : {PROCESSES}")
    print()

    ds = xr.open_dataset(nc_path)
    lat_da, lon_da = find_lat_lon_da(ds)

    if FIXED_VARS:
        vars_to_process = [
            v for v in FIXED_VARS if v in ds.data_vars or v in ds.variables
        ]
        missing = [v for v in FIXED_VARS if v not in vars_to_process]
        if missing:
            print(f"Note: requested vars not found and will be skipped: {missing}")
    else:
        vars_to_process = detect_gridded_vars(ds, lat_da.name, lon_da.name)

    if not vars_to_process:
        raise RuntimeError("No suitable 2D gridded variables found to render/tile.")

    print(f"Variables : {vars_to_process}\n")

    # Styles (always light+dark)
    styles = [
        {
            "style_name": "light",
            "palette_name": "mri3-like",
            "classify_kind": "default",
            "colors_rgb": HW_COLORS_DEFAULT.tolist(),
        },
        {
            "style_name": "dark",
            "palette_name": "dark-marine",
            "classify_kind": "dark",
            "colors_rgb": HW_COLORS_DARK.tolist(),
        },
    ]
    if ENABLE_NIGHT:
        styles.append(
            {
                "style_name": "night",
                "palette_name": "ecdis-night",
                "classify_kind": "night",
                "colors_rgb": HW_COLORS_NIGHT.tolist(),
            }
        )

    # Process each variable: reproject once → run styles in parallel
    for var in vars_to_process:
        print(f"\n=== {var} ===")

        float_dir = OUTPUT_GEOTIFF_DIR / "WW3_float3857"
        rgba_dir = OUTPUT_GEOTIFF_DIR / "WW3_rgba3857" / date_tag / var

        mkdir(float_dir)
        mkdir(rgba_dir)

        float_tif = float_dir / f"{date_tag}_{var}_3857_float.tif"

        # 1) Reproject/smooth ONCE per var
        build_float3857_geotiff(nc_path, var, float_tif, SIGMA, UPSCALE)

        # 2) Run styles in parallel
        jobs = []
        for s in styles:
            tiles_out = OUTPUT_TILES_DIR / s["style_name"] / date_tag 
            legend_out = OUTPUT_TILES_DIR / s["style_name"] / "legend.json"
            rgba_tif = rgba_dir / f"{date_tag}_{var}_{s['style_name']}_3857_rgba.tif"

            jobs.append(
                (
                    float_tif,
                    rgba_tif,
                    tiles_out,
                    legend_out,
                    var,
                    date_tag,
                    s["style_name"],
                    s["palette_name"],
                    s["colors_rgb"],
                    s["classify_kind"],
                )
            )

        max_workers = min(len(jobs), 3)
        with ProcessPoolExecutor(max_workers=max_workers) as exe:
            list(exe.map(generate_tileset_job, jobs))

        print(f"\n✓ {var} done: {date_tag}")

    print("\n✓ All processing complete.")
    print("Generated:")
    for s in styles:
        print(
            f"  - {OUTPUT_TILES_DIR / s['style_name'] / date_tag}  ({s['style_name']})"
        )


if __name__ == "__main__":
    main()
