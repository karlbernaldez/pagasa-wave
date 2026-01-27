#!/usr/bin/env python3
import os
import json
import re
import subprocess
import numpy as np
import xarray as xr
import rasterio
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject, Resampling
from tqdm import tqdm

# ============================================================
# CONFIG
# ============================================================
NC_FILE = "../input/mri3_2026011200/2026011200_PH.nc"
OUT_DIR = "../tiles/MRI3"

ZOOM_MIN = 0
ZOOM_MAX = 8
PROCESSES = 4

# WebMercator meters/px at equator
M_PER_PX_Z0 = 156543.03392804097
TARGET_RES_M = M_PER_PX_Z0 / (2 ** ZOOM_MAX)

NODATA = -9999.0


# ============================================================
# DATE NORMALIZATION
# ============================================================
def normalize_date_tag(s: str) -> str:
    m = re.search(r"(\d{8})T(\d{2})", s)
    if m:
        return f"{m.group(1)}{m.group(2)}"
    m2 = re.search(r"\d{10}", s)
    return m2.group(0) if m2 else "unknown"


DATE_TAG = normalize_date_tag(NC_FILE)


# ============================================================
# PALETTES / BINS (MRI3)
# ============================================================
HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)

HW_COLORS_LIGHT = np.array([
    [0xCA,0xED,0xFB],[0x60,0xCA,0xF3],[0x0E,0x9E,0xD4],[0xC1,0xF1,0xC9],[0x82,0xE2,0x8F],
    [0x01,0xB0,0x51],[0xFF,0xFF,0x00],[0xFF,0xE7,0x01],[0xFE,0xA4,0x01],[0xFE,0x00,0x01],
    [0xAA,0x15,0x01],[0xAB,0x45,0x00],[0x6C,0x33,0x00],[0xD8,0x6D,0xCD],[0x79,0x20,0x70],
    [0x51,0x15,0x4A],[0x15,0x61,0x83],[0x0F,0x29,0x41],[0x81,0x81,0x80],[0x40,0x40,0x40],
], dtype=np.uint8)

HW_COLORS_DARK = np.array([
    [8, 40, 60],[12, 70, 100],[18, 110, 150],[20, 140, 160],[30, 170, 140],
    [40, 190, 120],[90, 200, 110],[140, 210, 90],[190, 200, 70],[220, 180, 60],
    [240, 150, 50],[245, 120, 45],[250, 90, 40],[240, 60, 80],[220, 40, 120],
    [190, 30, 150],[140, 30, 170],[100, 30, 180],[160, 160, 160],[210, 210, 210],
], dtype=np.uint8)

VARIABLES = {
    "hw": {
        "var": "hw",
        "bins": HW_BINS,
        "units": "m",
        "smooth": True,
    }
}


# ============================================================
# HELPERS
# ============================================================
def mkdir(p):
    os.makedirs(p, exist_ok=True)

def run(cmd):
    subprocess.run(cmd, check=True)

def classify_light(field, bins, colors):
    rgba = np.zeros((*field.shape, 4), dtype=np.uint8)
    mask = (field == NODATA) | np.isnan(field)
    f = field.copy()
    f[mask] = bins[0]

    idx = np.digitize(f, bins) - 1
    idx = np.clip(idx, 0, len(colors) - 1)

    rgba[..., :3] = colors[idx]
    rgba[..., 3] = np.where(mask, 0, 255).astype(np.uint8)
    return rgba

def classify_dark(field, bins, colors):
    rgba = np.zeros((*field.shape, 4), dtype=np.uint8)
    mask = (field == NODATA) | np.isnan(field)
    f = field.copy()
    f[mask] = bins[0]

    idx = np.digitize(f, bins) - 1
    idx = np.clip(idx, 0, len(colors) - 1)
    rgba[..., :3] = colors[idx]

    alpha = np.interp(
        f,
        [0.0, 0.5, 1.5, 3.0, 6.0, 10.0],
        [0,   40,  90,  160, 220, 255],
    )
    alpha[mask] = 0
    rgba[..., 3] = alpha.astype(np.uint8)
    return rgba

def write_rgba_geotiff(path, rgba, transform):
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
        for i in range(4):
            dst.write(rgba[..., i], i + 1)

def build_overviews(tif):
    run(["gdaladdo", "-r", "nearest", tif, "2", "4", "8", "16", "32", "64", "128"])

def gdal2tiles_xyz(tif, out_dir):
    mkdir(out_dir)
    run([
        "gdal2tiles.py",
        "--xyz",
        "-z", f"{ZOOM_MIN}-{ZOOM_MAX}",
        "-r", "near",
        "-w", "none",
        f"--processes={PROCESSES}",
        tif,
        out_dir,
    ])


# ============================================================
# MAIN
# ============================================================
def main():
    ds = xr.open_dataset(NC_FILE)
    lats = ds["lat"].values
    lons = ds["lon"].values
    n_time = len(ds.time)

    legend = {}

    for key, cfg in VARIABLES.items():
        for style in ("light", "dark"):
            mkdir(f"{OUT_DIR}/{style}/{DATE_TAG}/{key}")

        legend[key] = {
            "model": "MRI3",
            "variable": cfg["var"],
            "units": cfg["units"],
            "bins": cfg["bins"].tolist(),
            "styles": ["light", "dark"],
            "date": DATE_TAG,
            "zoom": [ZOOM_MIN, ZOOM_MAX],
            "target_resolution_m": TARGET_RES_M,
        }

        for t in tqdm(range(n_time), desc=f"MRI3 {key}"):
            src = ds[cfg["var"]].isel(time=t).values.astype(np.float32)
            src = np.flipud(src)
            src[np.isnan(src)] = NODATA

            src_transform = from_bounds(
                lons.min(), lats.min(), lons.max(), lats.max(),
                src.shape[1], src.shape[0]
            )

            dst_transform, w, h = calculate_default_transform(
                "EPSG:4326", "EPSG:3857",
                src.shape[1], src.shape[0],
                lons.min(), lats.min(), lons.max(), lats.max(),
                resolution=TARGET_RES_M
            )

            dst = np.full((h, w), NODATA, dtype=np.float32)

            reproject(
                src, dst,
                src_transform=src_transform,
                src_crs="EPSG:4326",
                dst_transform=dst_transform,
                dst_crs="EPSG:3857",
                src_nodata=NODATA,
                dst_nodata=NODATA,
                resampling=Resampling.bilinear,
            )

            for style in ("light", "dark"):
                rgba = (
                    classify_light(dst, cfg["bins"], HW_COLORS_LIGHT)
                    if style == "light"
                    else classify_dark(dst, cfg["bins"], HW_COLORS_DARK)
                )

                tmp = f"/tmp/mri3_{key}_{style}_{t:03d}.tif"
                write_rgba_geotiff(tmp, rgba, dst_transform)
                build_overviews(tmp)

                out_tiles = f"{OUT_DIR}/{style}/{DATE_TAG}/{key}/{t:03d}"
                gdal2tiles_xyz(tmp, out_tiles)
                os.remove(tmp)

    with open(f"{OUT_DIR}/legend.json", "w") as f:
        json.dump(legend, f, indent=2)

    print(f"\n✓ DONE: {OUT_DIR}")
    print(f"✓ Date tag: {DATE_TAG}")
    print(f"✓ Styles: light, dark")


if __name__ == "__main__":
    main()
