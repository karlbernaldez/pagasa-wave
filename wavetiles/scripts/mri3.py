#!/usr/bin/env python3
import os
import json
import numpy as np
import xarray as xr
import rasterio
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject, Resampling
from tqdm import tqdm
import subprocess

NC_FILE = "../input/mri3_2026011200/2026011200_PH.nc"
OUT_DIR = "../tiles/mri"
ZOOM_MIN = 0
ZOOM_MAX = 8

# --- WebMercator meters/pixel at equator (Mapbox/OSM convention)
M_PER_PX_Z0 = 156543.03392804097
TARGET_RES_M = M_PER_PX_Z0 / (2 ** ZOOM_MAX)  # e.g. z8 ≈ 611.5 m/px

# -------------------------
# MRI3 DISCRETE STYLE (from your matplotlib colors)
# -------------------------
HW_BINS = np.array([0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20], dtype=np.float32)
HW_COLORS = np.array([
    [0xCA,0xED,0xFB],[0x60,0xCA,0xF3],[0x0E,0x9E,0xD4],[0xC1,0xF1,0xC9],[0x82,0xE2,0x8F],
    [0x01,0xB0,0x51],[0xFF,0xFF,0x00],[0xFF,0xE7,0x01],[0xFE,0xA4,0x01],[0xFE,0x00,0x01],
    [0xAA,0x15,0x01],[0xAB,0x45,0x00],[0x6C,0x33,0x00],[0xD8,0x6D,0xCD],[0x79,0x20,0x70],
    [0x51,0x15,0x4A],[0x15,0x61,0x83],[0x0F,0x29,0x41],[0x81,0x81,0x80],[0x00,0x00,0x00],
], dtype=np.uint8)

# Peak period bins (tune to your operational standard)
TP_BINS = np.array([0,2,4,6,8,10,12,14,16,18,20], dtype=np.float32)
TP_COLORS = np.array([
    [0xCA,0xED,0xFB],[0x60,0xCA,0xF3],[0x0E,0x9E,0xD4],[0xC1,0xF1,0xC9],[0x82,0xE2,0x8F],
    [0x01,0xB0,0x51],[0xFF,0xFF,0x00],[0xFE,0xA4,0x01],[0xFE,0x00,0x01],[0x00,0x00,0x00],
], dtype=np.uint8)

# Direction as raster is not recommended; include only if you insist.
DW_BINS = np.array([0,60,120,180,240,300,360], dtype=np.float32)
DW_COLORS = np.array([
    [255,0,0],[255,255,0],[0,255,0],[0,255,255],[0,0,255],[255,0,255]
], dtype=np.uint8)

VARIABLES = {
    "hw":   {"var": "hw", "bins": HW_BINS, "colors": HW_COLORS, "units": "m", "smooth": True},
    "tp_w": {"var": "pw", "bins": TP_BINS, "colors": TP_COLORS, "units": "s", "smooth": True},
    # "dw":   {"var": "dw", "bins": DW_BINS, "colors": DW_COLORS, "units": "deg", "smooth": False},
}

NODATA = -9999.0

def mkdir(p):
    os.makedirs(p, exist_ok=True)

def run(cmd):
    subprocess.run(cmd, check=True)

def classify_to_rgba(data, bins, colors, nodata_value=NODATA):
    rgba = np.zeros((data.shape[0], data.shape[1], 4), dtype=np.uint8)

    mask = (data == nodata_value) | np.isnan(data)
    d = data.copy()
    d[mask] = bins[0]

    idx = np.digitize(d, bins, right=False) - 1
    idx = np.clip(idx, 0, len(colors) - 1)

    rgba[..., :3] = colors[idx]
    rgba[..., 3] = np.where(mask, 0, 255).astype(np.uint8)
    return rgba

def write_rgba_geotiff_3857(path, rgba, transform, width, height):
    profile = {
        "driver": "GTiff",
        "height": height,
        "width": width,
        "count": 4,
        "dtype": rasterio.uint8,
        "crs": "EPSG:3857",
        "transform": transform,
        "compress": "DEFLATE",
        "predictor": 2,
        "tiled": True,
        "blockxsize": 256,
        "blockysize": 256,
    }
    with rasterio.open(path, "w", **profile) as dst:
        for i in range(4):
            dst.write(rgba[:, :, i], i + 1)

def build_overviews_nearest(tif_3857):
    run(["gdaladdo", "-r", "nearest", tif_3857, "2", "4", "8", "16", "32", "64", "128"])

def gdal2tiles_xyz(tif_3857, out_dir):
    mkdir(out_dir)
    run([
        "gdal2tiles.py",
        "--xyz",                       # IMPORTANT: XYZ for Mapbox
        "-z", f"{ZOOM_MIN}-{ZOOM_MAX}",
        "-r", "near",
        "-w", "none",
        "--processes=4",
        tif_3857,
        out_dir
    ])

def reproject_float_to_3857(src_data_2d, lons, lats, smooth=True):
    """
    src_data_2d is north-up already (we will flip before calling this).
    We create a 4326 transform, then reproject into 3857 at TARGET_RES_M.
    """
    h, w = src_data_2d.shape

    src_transform = from_bounds(
        float(lons.min()), float(lats.min()),
        float(lons.max()), float(lats.max()),
        w, h
    )

    # Destination grid in 3857 with target resolution
    dst_transform, dst_width, dst_height = calculate_default_transform(
        "EPSG:4326",
        "EPSG:3857",
        w,
        h,
        float(lons.min()), float(lats.min()), float(lons.max()), float(lats.max()),
        resolution=TARGET_RES_M
    )

    dst = np.full((dst_height, dst_width), NODATA, dtype=np.float32)

    # rasterio reproject can't use NaN nodata reliably; use explicit NODATA value
    src = src_data_2d.astype(np.float32).copy()
    src[np.isnan(src)] = NODATA

    resamp = Resampling.bilinear if smooth else Resampling.nearest

    reproject(
        source=src,
        destination=dst,
        src_transform=src_transform,
        src_crs="EPSG:4326",
        dst_transform=dst_transform,
        dst_crs="EPSG:3857",
        src_nodata=NODATA,
        dst_nodata=NODATA,
        resampling=resamp,
    )

    return dst, dst_transform, dst_width, dst_height

def main():
    mkdir(OUT_DIR)
    ds = xr.open_dataset(NC_FILE)
    lats = ds["lat"].values
    lons = ds["lon"].values
    n_time = len(ds.time)

    legend = {}

    for key, cfg in VARIABLES.items():
        var_dir = os.path.join(OUT_DIR, key)
        mkdir(var_dir)

        legend[key] = {
            "var": cfg["var"],
            "units": cfg["units"],
            "bins": cfg["bins"].tolist(),
            "colors_rgb": cfg["colors"].tolist(),
            "zoom": [ZOOM_MIN, ZOOM_MAX],
            "target_resolution_m": TARGET_RES_M,
        }

        for t in tqdm(range(n_time), desc=f"prod {key}"):
            data = ds[cfg["var"]].isel(time=t).values
            data = np.flipud(data)  # make north-up

            # Reproject FLOAT to 3857 at target resolution (this is the smoothing step)
            f3857, dst_transform, dst_width, dst_height = reproject_float_to_3857(
                data, lons, lats, smooth=cfg.get("smooth", True)
            )

            # Classify into MRI3 discrete colors
            rgba = classify_to_rgba(f3857, cfg["bins"], cfg["colors"])

            tmp3857 = f"/tmp/{key}_{t:04d}_3857_rgba.tif"
            write_rgba_geotiff_3857(tmp3857, rgba, dst_transform, dst_width, dst_height)

            # Build nearest pyramids so zoomed-out stays crisp (no muddy mixing)
            build_overviews_nearest(tmp3857)

            out_tiles = os.path.join(var_dir, f"{key}_{t:04d}")
            gdal2tiles_xyz(tmp3857, out_tiles)

            try:
                os.remove(tmp3857)
            except FileNotFoundError:
                pass

    with open(os.path.join(OUT_DIR, "legend.json"), "w") as f:
        json.dump(legend, f, indent=2)

    print(f"✓ DONE: {OUT_DIR}")
    print(f"✓ Legend: {os.path.join(OUT_DIR, 'legend.json')}")

if __name__ == "__main__":
    main()
