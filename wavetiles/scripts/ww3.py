#!/usr/bin/env python3
import os
import re
import json
import subprocess
from pathlib import Path

import numpy as np
import xarray as xr
import rasterio
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject, Resampling

# Optional smoothing
try:
    from scipy.ndimage import gaussian_filter
    HAVE_SCIPY = True
except Exception:
    HAVE_SCIPY = False


# ============================================================
# CONFIG — EDIT HERE ONLY
# ============================================================
INPUT_DIR = Path("../input/2026011200/")     # folder that contains WW3 NetCDF outputs
OUTPUT_GEOTIFF_DIR = Path("../geotiff")
OUTPUT_COG_DIR = Path("../cog")
OUTPUT_TILES_DIR = Path("../tiles/ww3")

# Variable selection strategy:
# - If FIXED_VARS is non-empty, only these variables will be processed (if present).
# - If FIXED_VARS is empty, variables are auto-detected from the dataset.
FIXED_VARS = ["hs"]  # e.g. ["hs", "tp", "fp"]; set [] to auto-detect all 2D gridded vars

# Smoothing and resampling
SIGMA = 0.8           # gaussian sigma (pixels in 3857 grid)
UPSCALE = 1        # increases target grid resolution (2.0 = 2x width/height)
ZOOMS = "0-8"         # XYZ zoom range for tiles
PROCESSES = 4         # gdal2tiles processes

# If you want to force a particular file instead of auto-selecting latest gridded file:
FORCE_NCFILE = None   # set to a Path(".../ww3_grdo....nc") or leave as None


HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32
)

HW_COLORS = np.array([
    [0xCA,0xED,0xFB],[0x60,0xCA,0xF3],[0x0E,0x9E,0xD4],[0xC1,0xF1,0xC9],[0x82,0xE2,0x8F],
    [0x01,0xB0,0x51],[0xFF,0xFF,0x00],[0xFF,0xE7,0x01],[0xFE,0xA4,0x01],[0xFE,0x00,0x01],
    [0xAA,0x15,0x01],[0xAB,0x45,0x00],[0x6C,0x33,0x00],[0xD8,0x6D,0xCD],[0x79,0x20,0x70],
    [0x51,0x15,0x4A],[0x15,0x61,0x83],[0x0F,0x29,0x41],[0x81,0x81,0x80],[0x00,0x00,0x00],
], dtype=np.uint8)


# ============================================================
# Utility helpers
# ============================================================
def run(cmd):
    cmd = [str(c) for c in cmd]
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)

def extract_date_from_name(name: str) -> str:
    # Matches "20260115T00" from filenames like ww3_grdo.20260115T00.nc
    m = re.search(r"\d{8}T\d{2}", name)
    return m.group(0) if m else "unknown"

def first_time(da: xr.DataArray) -> xr.DataArray:
    for tdim in ("time", "Time", "forecast_time"):
        if tdim in da.dims:
            return da.isel({tdim: 0})
    return da

def find_lat_lon_da(ds: xr.Dataset):
    """
    Robustly find latitude/longitude in either coords or variables, with common naming.
    Returns (lat_da, lon_da) as DataArrays.
    """
    lat_candidates = ("lat", "latitude", "Latitude", "LATITUDE", "nav_lat", "y", "YLAT")
    lon_candidates = ("lon", "longitude", "Longitude", "LONGITUDE", "nav_lon", "x", "XLON")

    # 1) Prefer coords
    for la in lat_candidates:
        for lo in lon_candidates:
            if la in ds.coords and lo in ds.coords:
                return ds[la], ds[lo]

    # 2) Fall back to variables
    for la in lat_candidates:
        for lo in lon_candidates:
            if la in ds.variables and lo in ds.variables:
                return ds[la], ds[lo]

    raise RuntimeError(
        "Could not find lat/lon. Checked coords and variables for common names "
        f"(lat candidates: {lat_candidates}, lon candidates: {lon_candidates})."
    )

def is_point_or_spectral(ds: xr.Dataset) -> bool:
    """
    Heuristic: WW3 point/spectral files usually have 'station' and frequency/direction axes,
    and do NOT represent a 2D lat/lon field.
    """
    vars_lower = {v.lower() for v in list(ds.variables) + list(ds.coords)}
    has_station = "station" in vars_lower or "station_name" in vars_lower
    has_freq_dir = ("frequency" in vars_lower or "freq" in vars_lower) and ("direction" in vars_lower or "dir" in vars_lower)
    return has_station and has_freq_dir

def is_gridded(ds: xr.Dataset) -> bool:
    """
    Determine whether dataset plausibly contains gridded fields suitable for raster tiling.
    """
    if is_point_or_spectral(ds):
        return False

    try:
        lat_da, lon_da = find_lat_lon_da(ds)
    except Exception:
        return False

    # Must have at least one 2D-ish variable (excluding lat/lon itself)
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

    # Pick latest by filename sort, but verify gridded content by opening datasets
    for nc in reversed(ncs):
        try:
            ds = xr.open_dataset(nc)
            if is_gridded(ds):
                return nc
        except Exception:
            continue

    raise RuntimeError(
        "No gridded WW3 NetCDF files found. "
        "Your input directory may contain only point/spectral products."
    )

def detect_gridded_vars(ds: xr.Dataset, lat_name: str, lon_name: str):
    """
    Auto-detect candidate variables to render: 2D+ numeric fields that are not lat/lon/time.
    """
    ignore = {lat_name, lon_name, "time", "Time", "forecast_time"}
    vars_out = []
    for v in ds.data_vars:
        if v in ignore:
            continue
        da = ds[v]
        if da.ndim >= 2 and np.issubdtype(da.dtype, np.number):
            vars_out.append(v)
    return vars_out

def classify_to_rgba(field_float: np.ndarray, mask: np.ndarray, bins: np.ndarray, colors: np.ndarray) -> np.ndarray:
    rgba = np.zeros((field_float.shape[0], field_float.shape[1], 4), dtype=np.uint8)
    f = field_float.copy()
    f[mask] = bins[0]

    idx = np.digitize(f, bins, right=False) - 1
    idx = np.clip(idx, 0, len(colors) - 1)

    rgba[..., :3] = colors[idx]
    rgba[..., 3] = np.where(mask, 0, 255).astype(np.uint8)
    return rgba


# ============================================================
# Core rendering: NetCDF var -> Smooth MRI3 RGBA GeoTIFF (EPSG:3857)
# ============================================================
def render_mri3_rgba_3857(nc_path: Path, var: str, out_tif: Path, sigma: float):
    ds = xr.open_dataset(nc_path)

    if var not in ds.variables and var not in ds.data_vars:
        raise KeyError(f"Variable '{var}' not found. Available data_vars: {list(ds.data_vars)}")

    lat_da, lon_da = find_lat_lon_da(ds)
    lat = lat_da.values
    lon = lon_da.values

    da = first_time(ds[var]).astype(np.float32)
    data = da.values

    # If time dimension exists, first_time removed it; now ensure we have 2D
    if data.ndim > 2:
        # Fallback: squeeze any singleton dimensions (common in WW3 outputs)
        data = np.squeeze(data)

    if data.ndim != 2:
        raise RuntimeError(f"Variable '{var}' is not 2D after slicing/squeezing (ndim={data.ndim}).")

    # For many WW3 grids, lat/lon are 1D; for some, they are 2D (curvilinear).
    # We will use bounds-based transform (rectangular extent) for both.
    lon_min, lon_max = float(np.nanmin(lon)), float(np.nanmax(lon))
    lat_min, lat_max = float(np.nanmin(lat)), float(np.nanmax(lat))

    # Ensure north-up: top row should correspond to max latitude
    # If lat is 1D, we can check ordering; if 2D, we assume flip to match prior behavior.
    data = np.flipud(data)

    mask = np.isnan(data)

    src_transform = from_bounds(
        lon_min, lat_min, lon_max, lat_max,
        data.shape[1], data.shape[0]
    )
    src_crs = "EPSG:4326"
    dst_crs = "EPSG:3857"

    # Determine destination grid, then upscale resolution for smoother tiles
    dst_transform, dst_width, dst_height = calculate_default_transform(
        src_crs, dst_crs,
        data.shape[1], data.shape[0],
        lon_min, lat_min, lon_max, lat_max
    )
    dst_width = int(dst_width * UPSCALE)
    dst_height = int(dst_height * UPSCALE)

    # Recompute transform for new size using bounds
    dst_transform, _, _ = calculate_default_transform(
        src_crs, dst_crs,
        data.shape[1], data.shape[0],
        lon_min, lat_min, lon_max, lat_max,
        dst_width=dst_width, dst_height=dst_height
    )

    dst = np.full((dst_height, dst_width), np.nan, dtype=np.float32)
    dst_mask = np.ones((dst_height, dst_width), dtype=np.uint8)  # 1 = masked

    # Reproject float with bilinear
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

    # Reproject mask with nearest
    reproject(
        source=mask.astype(np.uint8),
        destination=dst_mask,
        src_transform=src_transform,
        src_crs=src_crs,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        src_nodata=1,
        dst_nodata=1,
        resampling=Resampling.nearest,
    )
    dst_mask = dst_mask.astype(bool)

    # Optional gaussian smoothing in float space
    if sigma > 0:
        if not HAVE_SCIPY:
            print("WARNING: scipy not installed; skipping gaussian smoothing (pip install scipy).")
        else:
            fill = dst.copy()
            fill[dst_mask] = np.nan
            mean_val = np.nanmean(fill)
            if np.isnan(mean_val):
                # Entire field is masked; nothing to render
                mean_val = 0.0
            fill[np.isnan(fill)] = mean_val
            fill = gaussian_filter(fill, sigma=sigma)
            fill[dst_mask] = np.nan
            dst = fill

    rgba = classify_to_rgba(dst, np.isnan(dst) | dst_mask, HW_BINS, HW_COLORS)

    out_tif.parent.mkdir(parents=True, exist_ok=True)

    profile = {
        "driver": "GTiff",
        "height": rgba.shape[0],
        "width": rgba.shape[1],
        "count": 4,
        "dtype": rasterio.uint8,
        "crs": dst_crs,
        "transform": dst_transform,
        "tiled": True,
        "compress": "DEFLATE",
        "predictor": 2,
        "blockxsize": 256,
        "blockysize": 256,
    }

    with rasterio.open(out_tif, "w", **profile) as out:
        for b in range(4):
            out.write(rgba[:, :, b], b + 1)

    meta_file = out_tif.with_suffix("").as_posix() + "_legend.json"
    with open(meta_file, "w") as f:
        json.dump({"var": var, "bins": HW_BINS.tolist(), "colors_rgb": HW_COLORS.tolist()}, f, indent=2)

    print(f"✓ RGBA GeoTIFF (3857): {out_tif}")
    print(f"✓ Legend metadata     : {meta_file}")


# ============================================================
# End-to-end pipeline
# ============================================================
def main():
    # Ensure output dirs exist
    OUTPUT_GEOTIFF_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_COG_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_TILES_DIR.mkdir(parents=True, exist_ok=True)

    # Select NetCDF
    nc_path = Path(FORCE_NCFILE).resolve() if FORCE_NCFILE else pick_latest_gridded_nc(INPUT_DIR)
    date = extract_date_from_name(nc_path.name)

    print("\nWW3 AUTO TILE PIPELINE")
    print("--------------------------------------------")
    print(f"Input file : {nc_path}")
    print(f"Date tag   : {date}")
    print(f"Sigma      : {SIGMA} (scipy={'yes' if HAVE_SCIPY else 'no'})")
    print(f"Upscale    : {UPSCALE}")
    print(f"Zooms      : {ZOOMS}")
    print(f"Processes  : {PROCESSES}")
    print()

    # Open dataset once for variable detection
    ds = xr.open_dataset(nc_path)
    lat_da, lon_da = find_lat_lon_da(ds)

    if FIXED_VARS:
        vars_to_process = [v for v in FIXED_VARS if v in ds.data_vars or v in ds.variables]
        missing = [v for v in FIXED_VARS if v not in vars_to_process]
        if missing:
            print(f"Note: requested vars not found and will be skipped: {missing}")
    else:
        vars_to_process = detect_gridded_vars(ds, lat_da.name, lon_da.name)

    if not vars_to_process:
        raise RuntimeError("No suitable 2D gridded variables found to render/til e.")

    print(f"Variables : {vars_to_process}\n")

    for var in vars_to_process:
        rgba_tif = OUTPUT_GEOTIFF_DIR / f"{date}_{var}_3857_rgba.tif"
        cog_tif = OUTPUT_COG_DIR / f"{date}_{var}_3857_cog.tif"
        tiles_out = OUTPUT_TILES_DIR / date / var
        tiles_out.mkdir(parents=True, exist_ok=True)

        print(f"\n=== {var} ===")

        # 1) Render MRI3 RGBA GeoTIFF in EPSG:3857
        render_mri3_rgba_3857(nc_path, var, rgba_tif, SIGMA)

        # 2) Build COG
        run([
            "gdal_translate",
            rgba_tif,
            cog_tif,
            "-of", "COG",
            "-co", "COMPRESS=DEFLATE",
            "-co", "PREDICTOR=2",
            "-co", "BIGTIFF=IF_SAFER",
            "-co", "RESAMPLING=NEAREST",
        ])

        # 3) Overviews
        run([
            "gdaladdo", "-r", "nearest",
            cog_tif,
            "2", "4", "8", "16", "32", "64", "128"
        ])

        # 4) Tiles
        run([
            "gdal2tiles.py",
            "--xyz",
            "-z", ZOOMS,
            "--processes", str(PROCESSES),
            "-r", "near",
            "-w", "none",
            cog_tif,
            tiles_out
        ])

        print(f"✓ Tiles ready: {tiles_out}")

    print("\n✓ All processing complete.")


if __name__ == "__main__":
    main()
