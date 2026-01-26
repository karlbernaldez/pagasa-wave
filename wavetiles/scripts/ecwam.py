#!/usr/bin/env python3
import os
import json
import subprocess
from pathlib import Path

import numpy as np
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
# CONFIG
# ============================================================
GRIB_FILE = Path("W1P01120000011200011.nc")  # GRIB1 despite .nc
BAND_INDEX = 1  # significant wave height band
TIME_TAG = "2026011200"

OUT_GEOTIFF = Path("../geotiff")
OUT_TILES   = Path("../tiles/ecwam")

ZOOM_MIN = 0
ZOOM_MAX = 8
PROCESSES = 4

# WebMercator meters/px at equator (Mapbox/OSM)
M_PER_PX_Z0 = 156543.03392804097
TARGET_RES_M = M_PER_PX_Z0 / (2**ZOOM_MAX)

SIGMA = 0.8  # float-space smoothing; 0 to disable
MIN_VALID = 0.05  # m; <= this is transparent (land)


# ============================================================
# MRI3 DISCRETE PALETTE (NO PURE BLACK)
# ============================================================
HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)

HW_COLORS = np.array(
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
        [0x40, 0x40, 0x40],  # dark gray instead of black
    ],
    dtype=np.uint8,
)


# ============================================================
# Helpers
# ============================================================
def mkdir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def run(cmd):
    cmd = [str(c) for c in cmd]
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def gdal_read_band_to_array(grib_path: Path, band_index: int):
    """
    Use GDAL via rasterio to read a GRIB band as float32 numpy array,
    along with its georeferencing in EPSG:4326.
    """
    with rasterio.open(grib_path) as src:
        arr = src.read(band_index).astype(np.float32)
        transform = src.transform
        crs = src.crs

        if crs is None:
            crs = "EPSG:4326"  # ECWAM GRIBs are lon/lat

        # Build lon/lat bounds from transform
        height, width = arr.shape
        left, top = transform * (0, 0)
        right, bottom = transform * (width, height)

    # Replace GRIB missing values (often huge like 9999 or 1e20)
    arr = np.where(np.abs(arr) > 1e6, np.nan, arr)

    # Ensure north-up (GDAL usually gives north-up already, but be safe)
    if top < bottom:
        arr = np.flipud(arr)
        top, bottom = bottom, top

    return arr, (left, bottom, right, top)


def reproject_float_to_3857(src: np.ndarray, bounds4326):
    left, bottom, right, top = bounds4326
    h, w = src.shape

    src_transform = from_bounds(left, bottom, right, top, w, h)

    dst_transform, dst_width, dst_height = calculate_default_transform(
        "EPSG:4326",
        "EPSG:3857",
        w,
        h,
        left,
        bottom,
        right,
        top,
        resolution=TARGET_RES_M,
    )

    dst = np.full((dst_height, dst_width), np.nan, dtype=np.float32)

    reproject(
        source=src,
        destination=dst,
        src_transform=src_transform,
        src_crs="EPSG:4326",
        dst_transform=dst_transform,
        dst_crs="EPSG:3857",
        src_nodata=np.nan,
        dst_nodata=np.nan,
        resampling=Resampling.bilinear,
    )

    return dst, dst_transform, dst_width, dst_height


def classify_to_rgba(field: np.ndarray):
    MAX_VISIBLE = 14.0
    mask = np.isnan(field) | (field <= MIN_VALID) | (field > MAX_VISIBLE)

    f = field.copy()
    f[mask] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS) - 1)

    rgba = np.zeros((field.shape[0], field.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS[idx]
    rgba[..., 3] = np.where(mask, 0, 255).astype(np.uint8)

    return rgba


def write_rgba_geotiff(path: Path, rgba, transform):
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
    with rasterio.open(path, "w", **profile) as dst:
        for b in range(4):
            dst.write(rgba[..., b], b + 1)


# ============================================================
# Main
# ============================================================
def main():
    mkdir(OUT_GEOTIFF)
    mkdir(OUT_TILES)

    print("\nECWAM GRIB → MRI3-STYLE XYZ PIPELINE")
    print("--------------------------------------------")
    print(f"GRIB_FILE     : {GRIB_FILE}")
    print(f"BAND_INDEX    : {BAND_INDEX}")
    print(f"ZOOMS         : {ZOOM_MIN}-{ZOOM_MAX}")
    print(f"TARGET_RES_M  : {TARGET_RES_M:.2f} m/px")
    print(f"SIGMA         : {SIGMA}")
    print(f"MIN_VALID     : {MIN_VALID} m")
    print()

    # 1) Read GRIB band
    src4326, bounds4326 = gdal_read_band_to_array(GRIB_FILE, BAND_INDEX)

    # 2) Reproject to 3857
    f3857, dst_transform, _, _ = reproject_float_to_3857(src4326, bounds4326)

    # 3) Optional float smoothing
    if SIGMA > 0 and HAVE_SCIPY:
        mask = np.isnan(f3857)
        fill = f3857.copy()
        fill[mask] = np.nanmean(f3857)
        sm = gaussian_filter(fill, sigma=SIGMA)
        sm[mask] = np.nan
        f3857 = sm

    # 4) Classify → RGBA
    rgba = classify_to_rgba(f3857)

    # 5) Write RGBA GeoTIFF
    out_tif = OUT_GEOTIFF / f"ecwam_hs_{TIME_TAG}_3857_rgba.tif"
    write_rgba_geotiff(out_tif, rgba, dst_transform)
    print(f"✓ RGBA GeoTIFF: {out_tif}")

    # 6) Overviews
    run(["gdaladdo", "-r", "nearest", out_tif, "2", "4", "8", "16", "32", "64", "128"])

    # 7) XYZ tiles
    tiles_out = OUT_TILES / TIME_TAG
    mkdir(tiles_out)
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
            out_tif,
            tiles_out,
        ]
    )

    # Legend
    legend = {
        "model": "ECWAM",
        "variable": "significant_wave_height",
        "units": "m",
        "bins": HW_BINS.tolist(),
        "colors_rgb": HW_COLORS.tolist(),
        "min_valid_m": MIN_VALID,
        "sigma": SIGMA,
    }
    with open(OUT_TILES / "legend.json", "w") as f:
        json.dump(legend, f, indent=2)

    print("\n✓ DONE — NO BLACK BLOBS, TRUE ALPHA")


if __name__ == "__main__":
    main()
