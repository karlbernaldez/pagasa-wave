#!/usr/bin/env python3
"""
ECWAM GRIB/GRIB1 (.nc extension sometimes) → WebMercator RGBA GeoTIFF → XYZ tiles
Outputs BOTH:
  - tiles/ecwam/<TIME_TAG>/{z}/{x}/{y}.png          (default/light basemap)
  - tiles/ecwam-dark/<TIME_TAG>/{z}/{x}/{y}.png     (dark basemap)
Optionally:
  - tiles/ecwam-night/<TIME_TAG>/{z}/{x}/{y}.png    (ECDIS night palette)

Notes:
- Reprojects + smooths ONCE, then generates multiple styled tilesets in PARALLEL.
- Uses true alpha (transparent where invalid/land/calm threshold).
- Requires: rasterio, numpy, GDAL utilities (gdaladdo, gdal2tiles.py) in PATH.
- Optional: scipy for gaussian smoothing.
"""

import json
import subprocess
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor

import numpy as np
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
# CONFIG
# ============================================================
GRIB_FILE = Path("../input/12/00/W1P01120000011200011")  # GRIB1 despite .nc
BAND_INDEX = 1
TIME_TAG = "2026011200"

OUT_GEOTIFF = Path("../geotiff")
OUT_TILES = Path("../tiles")

ZOOM_MIN = 0
ZOOM_MAX = 8
PROCESSES = 4  # gdal2tiles internal workers

# WebMercator meters/px at equator (Mapbox/OSM)
M_PER_PX_Z0 = 156543.03392804097
TARGET_RES_M = M_PER_PX_Z0 / (2**ZOOM_MAX)

SIGMA = 0.8  # float-space smoothing; 0 to disable
MIN_VALID = 0.05  # m; <= this is treated as transparent
MAX_VISIBLE = 14.0  # m; > this is transparent (avoid weird extremes)


# ============================================================
# BINS (shared)
# ============================================================
HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)

# ============================================================
# DEFAULT (MRI3-like) PALETTE (no pure black)
# ============================================================
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

# ============================================================
# DARK MAP PALETTE (dark-safe, less neon)
# ============================================================
HW_COLORS_DARK = np.array(
    [
        [8, 40, 60],     # <0.25 deep navy-ish
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

# ============================================================
# ECDIS NIGHT PALETTE (optional)
# ============================================================
HW_COLORS_ECDIS = np.array(
    [
        [8, 8, 8],       # calm – nearly invisible
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

# Toggle this if you want ecwam-night output too
ENABLE_ECDIS_NIGHT = False


# ============================================================
# Helpers
# ============================================================
def mkdir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def run(cmd) -> None:
    cmd = [str(c) for c in cmd]
    print("→", " ".join(cmd))
    subprocess.run(cmd, check=True)


def gdal_read_band_to_array(grib_path: Path, band_index: int):
    """
    Read band as float32 numpy array, attempt CRS from source; fallback EPSG:4326.
    Returns: (array, bounds4326=(left,bottom,right,top))
    """
    with rasterio.open(grib_path) as src:
        arr = src.read(band_index).astype(np.float32)
        transform = src.transform
        crs = src.crs

        if crs is None:
            crs = "EPSG:4326"

        height, width = arr.shape
        left, top = transform * (0, 0)
        right, bottom = transform * (width, height)

    # Replace missing values (GRIB often uses huge sentinels)
    arr = np.where(np.abs(arr) > 1e6, np.nan, arr)

    # Ensure north-up
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

    return dst, dst_transform


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
    with rasterio.open(path, "w", **profile) as dst:
        for b in range(4):
            dst.write(rgba[..., b], b + 1)


def _mask_invalid(field: np.ndarray) -> np.ndarray:
    return np.isnan(field) | (field <= MIN_VALID) | (field > MAX_VISIBLE)


def _idx_from_bins(field: np.ndarray) -> np.ndarray:
    idx = np.digitize(field, HW_BINS, right=False) - 1
    return np.clip(idx, 0, len(HW_BINS) - 2)  # colors length = bins-1 effectively


# ============================================================
# Classifiers
# ============================================================
def classify_to_rgba_default(field: np.ndarray) -> np.ndarray:
    invalid = _mask_invalid(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_DEFAULT) - 1)

    rgba = np.zeros((field.shape[0], field.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_DEFAULT[idx]
    rgba[..., 3] = np.where(invalid, 0, 255).astype(np.uint8)
    return rgba


def classify_to_rgba_dark(field: np.ndarray) -> np.ndarray:
    invalid = _mask_invalid(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_DARK) - 1)

    rgba = np.zeros((field.shape[0], field.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_DARK[idx]

    # Alpha ramp tuned for dark basemaps (calm seas fade out)
    alpha = np.interp(
        f,
        [0.0, 0.5, 1.5, 3.0, 6.0, 10.0],
        [0,   40,  90,  160, 220, 255],
    )
    alpha[invalid] = 0
    rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


def classify_to_rgba_ecdis(field: np.ndarray) -> np.ndarray:
    invalid = _mask_invalid(field)
    f = field.copy()
    f[invalid] = HW_BINS[0]

    idx = np.digitize(f, HW_BINS, right=False) - 1
    idx = np.clip(idx, 0, len(HW_COLORS_ECDIS) - 1)

    rgba = np.zeros((field.shape[0], field.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = HW_COLORS_ECDIS[idx]

    # Night mode: keep calm nearly invisible, danger pops
    alpha = np.interp(
        f,
        [0.0, 0.5, 2.0, 5.0, 10.0],
        [0,   30,  110, 200, 255],
    )
    alpha[invalid] = 0
    rgba[..., 3] = alpha.astype(np.uint8)
    return rgba


# ============================================================
# Tileset job (runs in worker process)
# ============================================================
def generate_tileset_job(args):
    (
        f3857,
        dst_transform,
        out_root,
        time_tag,
        style_name,
        palette_name,
        classify_fn,
        colors_rgb,
    ) = args

    mkdir(out_root)
    mkdir(OUT_GEOTIFF)

    out_tif = OUT_GEOTIFF / f"ecwam_hs_{time_tag}_{style_name}_3857_rgba.tif"
    rgba = classify_fn(f3857)
    write_rgba_geotiff(out_tif, rgba, dst_transform)
    print(f"✓ RGBA GeoTIFF ({style_name}): {out_tif}")

    run(["gdaladdo", "-r", "nearest", out_tif, "2", "4", "8", "16", "32", "64", "128"])

    tiles_out = out_root / time_tag
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

    legend = {
        "model": "ECWAM",
        "variable": "significant_wave_height",
        "units": "m",
        "bins": HW_BINS.tolist(),
        "colors_rgb": colors_rgb,
        "min_valid_m": MIN_VALID,
        "max_visible_m": MAX_VISIBLE,
        "sigma": SIGMA,
        "style": style_name,
        "palette": palette_name,
        "zooms": {"min": ZOOM_MIN, "max": ZOOM_MAX},
        "time_tag": time_tag,
    }
    with open(out_root / "legend.json", "w") as f:
        json.dump(legend, f, indent=2)

    print(f"✓ Tiles ({style_name}): {tiles_out}")
    print(f"✓ Legend ({style_name}): {out_root / 'legend.json'}")


# ============================================================
# Main
# ============================================================
def main():
    print("\nECWAM GRIB → MULTI-STYLE XYZ PIPELINE")
    print("--------------------------------------------")
    print(f"GRIB_FILE     : {GRIB_FILE}")
    print(f"BAND_INDEX    : {BAND_INDEX}")
    print(f"ZOOMS         : {ZOOM_MIN}-{ZOOM_MAX}")
    print(f"TARGET_RES_M  : {TARGET_RES_M:.2f} m/px")
    print(f"SIGMA         : {SIGMA} (scipy={'yes' if HAVE_SCIPY else 'no'})")
    print(f"MIN_VALID     : {MIN_VALID} m")
    print(f"MAX_VISIBLE   : {MAX_VISIBLE} m")
    print()

    mkdir(OUT_TILES)
    mkdir(OUT_GEOTIFF)

    # 1) Read GRIB band
    src4326, bounds4326 = gdal_read_band_to_array(GRIB_FILE, BAND_INDEX)

    # 2) Reproject to 3857
    f3857, dst_transform = reproject_float_to_3857(src4326, bounds4326)

    # 3) Optional float smoothing
    if SIGMA > 0:
        if HAVE_SCIPY:
            mask = np.isnan(f3857)
            fill = f3857.copy()
            mean_val = np.nanmean(f3857)
            if np.isnan(mean_val):
                raise RuntimeError("All values are NaN after reprojection; check input band / bounds.")
            fill[mask] = mean_val
            sm = gaussian_filter(fill, sigma=SIGMA)
            sm[mask] = np.nan
            f3857 = sm
        else:
            print("! SIGMA > 0 but scipy not available; skipping smoothing.\n")

    # 4) Define styles (default + dark always)
    styles = [
        {
            "style_name": "default",
            "palette_name": "mri3-like",
            "out_root": OUT_TILES / "ECWAM/light",
            "classify_fn": classify_to_rgba_default,
            "colors_rgb": HW_COLORS_DEFAULT.tolist(),
        },
        {
            "style_name": "dark",
            "palette_name": "dark-marine",
            "out_root": OUT_TILES / "ECWAM/dark",
            "classify_fn": classify_to_rgba_dark,
            "colors_rgb": HW_COLORS_DARK.tolist(),
        },
    ]

    if ENABLE_ECDIS_NIGHT:
        styles.append(
            {
                "style_name": "night",
                "palette_name": "ecdis-night",
                "out_root": OUT_TILES / "ecwam-night",
                "classify_fn": classify_to_rgba_ecdis,
                "colors_rgb": HW_COLORS_ECDIS.tolist(),
            }
        )

    # 5) Run styles in parallel (2–3 workers is usually enough)
    jobs = [
        (
            f3857,
            dst_transform,
            s["out_root"],
            TIME_TAG,
            s["style_name"],
            s["palette_name"],
            s["classify_fn"],
            s["colors_rgb"],
        )
        for s in styles
    ]

    max_workers = min(len(jobs), 3)
    with ProcessPoolExecutor(max_workers=max_workers) as exe:
        list(exe.map(generate_tileset_job, jobs))

    print("\n✓ DONE — generated:")
    for s in styles:
        print(f"  - {s['out_root'] / TIME_TAG}  ({s['style_name']})")


if __name__ == "__main__":
    main()
