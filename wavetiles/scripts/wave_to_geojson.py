#!/usr/bin/env python3
"""
wave_to_geojson.py — Convert WW3, MRI3, and ECWAM wave model files to GeoJSON.

Output filenames:
  ww3-wave-today.geojson
  mri3-wave-today.geojson
  ecwam-wave-today.geojson

With --all-times:
  ww3-wave-today.geojson, ww3-wave-today-t001.geojson, ...

Usage:
  python3 wave_to_geojson.py --ww3  ../input/ww3.nc
  python3 wave_to_geojson.py --mri3 ../input/mri3.nc
  python3 wave_to_geojson.py --ecwam ../input/W1P011200...

  # Per-model subsampling steps (overrides --step for that model)
  python3 wave_to_geojson.py \\
      --ww3  ../input/ww3.nc  --ww3-step  2 \\
      --mri3 ../input/mri3.nc --mri3-step 4 \\
      --ecwam ../input/ecwam  --ecwam-step 6

  # Global fallback step (used when a model-specific step is not set)
  python3 wave_to_geojson.py --ww3 ... --step 3

  # Crop + subsample
  python3 wave_to_geojson.py --ww3 ... --bbox 115 5 135 25 --ww3-step 2

  # All MRI3 timesteps
  python3 wave_to_geojson.py --mri3 ... --all-times --mri3-step 3

  # Override output directory
  python3 wave_to_geojson.py --ww3 ... --out ./my_geojson
"""

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

# ── optional deps ──────────────────────────────────────────────────────────
try:
    import xarray as xr
    HAVE_XR = True
except ImportError:
    HAVE_XR = False

try:
    import rasterio
    HAVE_RIO = True
except ImportError:
    HAVE_RIO = False


# ══════════════════════════════════════════════════════════════════════════
# CONFIG DEFAULTS
# ══════════════════════════════════════════════════════════════════════════
DEFAULT_STEP       = 4           # global fallback subsampling step
DEFAULT_OUTPUT_DIR = Path("./geojson_output")
DEFAULT_BBOX       = None        # (lon_min, lat_min, lon_max, lat_max) or None

NODATA_ECWAM = 9999.0
FILL_THRESH  = 1e10


# ══════════════════════════════════════════════════════════════════════════
# ECWAM band layout (1-based)
# ══════════════════════════════════════════════════════════════════════════
ECWAM_BANDS = {
    "waveHeight"        : 1,
    "waveDirection"     : 2,
    "wavePeriod"        : 3,
    "windSeaHeight"     : 4,
    "windSeaPeriod"     : 5,
    "windSeaDirection"  : 6,
    "swell2Height"      : 7,
    "swell1Height"      : 8,
    "swell3Height"      : 9,
    "swell3Direction"   : 10,
    "swell2Direction"   : 11,
    "swell1Period"      : 12,
    "swell1Direction"   : 13,
    "swell3Period"      : 14,
    "swell2Period"      : 15,
    "peakPeriod"        : 16,
    "windSpeed"         : 17,
    "windDirection"     : 18,
    "peakPeriodAlt"     : 19,
    "spectralWidth"     : 20,
    "stokesDriftU"      : 21,
    "stokesDriftV"      : 22,
}


# ══════════════════════════════════════════════════════════════════════════
# Shared helpers
# ══════════════════════════════════════════════════════════════════════════
def safe(val) -> "float | None":
    if val is None:
        return None
    v = float(val)
    if math.isnan(v) or math.isinf(v) or abs(v) >= FILL_THRESH:
        return None
    return v


def uv_to_met_speed_dir(u: np.ndarray, v: np.ndarray):
    """Wind U/V → speed (m/s) + meteorological direction (deg FROM, CW from N)."""
    speed     = np.sqrt(u ** 2 + v ** 2)
    direction = (np.degrees(np.arctan2(u, v)) + 180.0) % 360.0
    return speed, direction


def uv_to_ocean_speed_dir(u: np.ndarray, v: np.ndarray):
    """Stokes drift U/V → speed + direction TOWARD (oceanographic convention)."""
    speed     = np.sqrt(u ** 2 + v ** 2)
    direction = (np.degrees(np.arctan2(u, v))) % 360.0
    return speed, direction


def fp_to_tp(fp: np.ndarray) -> np.ndarray:
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(fp > 0, 1.0 / fp, np.nan)


def epoch_to_iso(epoch_seconds: int) -> str:
    try:
        return datetime.fromtimestamp(int(epoch_seconds),
                                      tz=timezone.utc).strftime("%Y%m%dT%H%M")
    except Exception:
        return str(epoch_seconds)


def write_geojson(features: list, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump({"type": "FeatureCollection", "features": features},
                  f, separators=(",", ":"))
    print(f"  ✅  Saved: {out_path}  ({len(features):,} points)")


def bbox_filter(bbox, lons_1d, lats_1d, step):
    """Return (row_indices, col_indices) filtered by bbox and step."""
    if bbox:
        lon_min, lat_min, lon_max, lat_max = bbox
        cols = np.where((lons_1d >= lon_min) & (lons_1d <= lon_max))[0][::step]
        rows = np.where((lats_1d >= lat_min) & (lats_1d <= lat_max))[0][::step]
    else:
        cols = np.arange(0, len(lons_1d), step)
        rows = np.arange(0, len(lats_1d), step)
    return rows, cols


def nc_load(ds, name: str, t_idx: int) -> "np.ndarray | None":
    """Load a 2-D (lat × lon) slice from an xarray Dataset at time index t_idx."""
    if name not in ds.data_vars and name not in ds.coords:
        return None
    da        = ds[name]
    time_dims = [d for d in da.dims if d in ("time", "Time", "forecast_time")]
    if time_dims:
        da = da.isel({d: t_idx for d in time_dims})
    arr  = da.values.astype(np.float32)
    fill = da.attrs.get("_FillValue", da.attrs.get("missing_value"))
    if fill is not None:
        arr[arr == float(fill)] = np.nan
    arr[np.abs(arr) > FILL_THRESH] = np.nan
    return arr


def nc_time_label(ds, t_idx: int) -> str:
    for tdim in ("time", "Time", "forecast_time"):
        if tdim in ds.coords:
            t_val = str(ds[tdim].values[t_idx])[:16]
            return t_val.replace("-", "").replace(":", "").replace(" ", "T")
    return f"t{t_idx:03d}"


def make_out_path(out_dir: Path, model: str, t_idx: int, all_times: bool) -> Path:
    """
    Build the fixed output filename:
      single timestep  →  {model}-wave-today.geojson
      multiple steps   →  {model}-wave-today-t{NNN}.geojson  (t000 keeps clean name)
    """
    base = f"{model.lower()}-wave-today"
    if all_times and t_idx > 0:
        base = f"{base}-t{t_idx:03d}"
    return out_dir / f"{base}.geojson"


def resolve_step(model_step: "int | None", global_step: int) -> int:
    """Return the model-specific step if provided, otherwise the global fallback."""
    return model_step if model_step is not None else global_step


# ══════════════════════════════════════════════════════════════════════════
# WW3 (NetCDF)
# ══════════════════════════════════════════════════════════════════════════
def _ww3_features(ds, t_idx: int, rows, cols, lats, lons) -> list:
    hs   = nc_load(ds, "hs",   t_idx)
    fp   = nc_load(ds, "fp",   t_idx)
    tp   = fp_to_tp(fp) if fp is not None else None
    dir_ = nc_load(ds, "dir",  t_idx)
    dp   = nc_load(ds, "dp",   t_idx)
    uwnd = nc_load(ds, "uwnd", t_idx)
    vwnd = nc_load(ds, "vwnd", t_idx)
    phs  = [nc_load(ds, f"phs{i}",  t_idx) for i in range(3)]
    ptp  = [nc_load(ds, f"ptp{i}",  t_idx) for i in range(3)]
    pdir = [nc_load(ds, f"pdir{i}", t_idx) for i in range(3)]

    wind_speed = wind_dir = None
    if uwnd is not None and vwnd is not None:
        wind_speed, wind_dir = uv_to_met_speed_dir(uwnd, vwnd)

    features = []
    for i in rows:
        lat = float(lats[i])
        for j in cols:
            lon = float(lons[j])

            def v(arr):
                return safe(arr[i, j]) if arr is not None else None

            if hs is not None and np.isnan(hs[i, j]):
                continue

            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "model"          : "WW3",
                    "waveHeight"     : v(hs),
                    "peakPeriod"     : v(tp),
                    "waveDirection"  : v(dir_),
                    "peakDirection"  : v(dp),
                    "windSpeed"      : v(wind_speed),
                    "windDirection"  : v(wind_dir),
                    "seaHeight"      : v(phs[0]),
                    "seaPeriod"      : v(ptp[0]),
                    "seaDirection"   : v(pdir[0]),
                    "swell1Height"   : v(phs[1]),
                    "swell1Period"   : v(ptp[1]),
                    "swell1Direction": v(pdir[1]),
                    "swell2Height"   : v(phs[2]),
                    "swell2Period"   : v(ptp[2]),
                    "swell2Direction": v(pdir[2]),
                },
            })
    return features


def convert_ww3(nc_path: Path, out_dir: Path,
                step: int, bbox, all_times: bool):
    if not HAVE_XR:
        print("  ❌  xarray not installed"); return
    print(f"\n🌊 WW3  → GeoJSON: {nc_path.name}  (step={step})")

    ds   = xr.open_dataset(nc_path)
    lats = ds["latitude"].values
    lons = ds["longitude"].values
    rows, cols = bbox_filter(bbox, lons, lats, step)

    n_times = ds.sizes.get("time", ds.sizes.get("Time", 1))
    t_range = range(n_times) if all_times else range(1)

    for t in t_range:
        features = _ww3_features(ds, t, rows, cols, lats, lons)
        out_file = make_out_path(out_dir, "ww3", t, all_times)
        write_geojson(features, out_file)

    ds.close()


# ══════════════════════════════════════════════════════════════════════════
# MRI3 (NetCDF)
# ══════════════════════════════════════════════════════════════════════════
def _mri3_features(ds, t_idx: int, rows, cols, lats, lons) -> list:
    hw    = nc_load(ds, "hw",    t_idx)
    pw    = nc_load(ds, "pw",    t_idx)
    tp    = nc_load(ds, "tp",    t_idx)
    dw    = nc_load(ds, "dw",    t_idx)
    u     = nc_load(ds, "u",     t_idx)
    v_    = nc_load(ds, "v",     t_idx)
    hws   = nc_load(ds, "hws",   t_idx)
    hww   = nc_load(ds, "hww",   t_idx)
    psea  = nc_load(ds, "psea",  t_idx)
    hw_w  = nc_load(ds, "hw_w",  t_idx)
    tp_w  = nc_load(ds, "tp_w",  t_idx)
    dw_w  = nc_load(ds, "dw_w",  t_idx)
    hw_s1 = nc_load(ds, "hw_s1", t_idx)
    tp_s1 = nc_load(ds, "tp_s1", t_idx)
    dw_s1 = nc_load(ds, "dw_s1", t_idx)
    hw_s2 = nc_load(ds, "hw_s2", t_idx)
    tp_s2 = nc_load(ds, "tp_s2", t_idx)
    dw_s2 = nc_load(ds, "dw_s2", t_idx)

    wind_speed = wind_dir = None
    if u is not None and v_ is not None:
        wind_speed, wind_dir = uv_to_met_speed_dir(u, v_)

    features = []
    for i in rows:
        lat = float(lats[i])
        for j in cols:
            lon = float(lons[j])

            def v(arr):
                return safe(arr[i, j]) if arr is not None else None

            if hw is not None and np.isnan(hw[i, j]):
                continue

            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "model"           : "MRI3",
                    "waveHeight"      : v(hw),
                    "wavePeriod"      : v(pw),
                    "peakPeriod"      : v(tp),
                    "waveDirection"   : v(dw),
                    "windSpeed"       : v(wind_speed),
                    "windDirection"   : v(wind_dir),
                    "swellHeight"     : v(hws),
                    "windSeaHeight"   : v(hww),
                    "seaLevelPressure": v(psea),
                    "windSeaHeight_w" : v(hw_w),
                    "windSeaPeriod_w" : v(tp_w),
                    "windSeaDir_w"    : v(dw_w),
                    "swell1Height"    : v(hw_s1),
                    "swell1Period"    : v(tp_s1),
                    "swell1Direction" : v(dw_s1),
                    "swell2Height"    : v(hw_s2),
                    "swell2Period"    : v(tp_s2),
                    "swell2Direction" : v(dw_s2),
                },
            })
    return features


def convert_mri3(nc_path: Path, out_dir: Path,
                 step: int, bbox, all_times: bool):
    if not HAVE_XR:
        print("  ❌  xarray not installed"); return
    print(f"\n🌊 MRI3 → GeoJSON: {nc_path.name}  (step={step})")

    ds   = xr.open_dataset(nc_path)
    lats = ds["lat"].values
    lons = ds["lon"].values
    rows, cols = bbox_filter(bbox, lons, lats, step)

    n_times = ds.sizes.get("time", 1)
    t_range = range(n_times) if all_times else range(1)

    for t in t_range:
        features = _mri3_features(ds, t, rows, cols, lats, lons)
        out_file = make_out_path(out_dir, "mri3", t, all_times)
        write_geojson(features, out_file)

    ds.close()


# ══════════════════════════════════════════════════════════════════════════
# ECWAM (GRIB1)
# ══════════════════════════════════════════════════════════════════════════
def convert_ecwam(grib_path: Path, out_dir: Path,
                  step: int, bbox):
    if not HAVE_RIO:
        print("  ❌  rasterio not installed"); return
    print(f"\n🌊 ECWAM → GeoJSON: {grib_path.name}  (step={step})")

    src             = rasterio.open(str(grib_path))
    transform       = src.transform
    height, width   = src.height, src.width

    # Read all 22 bands at once
    bands: dict[str, np.ndarray] = {}
    for key, band_idx in ECWAM_BANDS.items():
        arr                            = src.read(band_idx).astype(np.float64)
        arr[arr == NODATA_ECWAM]       = np.nan
        arr[np.abs(arr) > FILL_THRESH] = np.nan
        bands[key] = arr

    # Derived: Stokes drift speed + direction
    bands["stokesDriftSpeed"], \
    bands["stokesDriftDirection"] = uv_to_ocean_speed_dir(
        bands["stokesDriftU"], bands["stokesDriftV"]
    )

    # Coordinate arrays
    lons_1d    = np.array([transform.c + (j + 0.5) * transform.a for j in range(width)])
    lats_1d    = np.array([transform.f + (i + 0.5) * transform.e for i in range(height)])
    rows, cols = bbox_filter(bbox, lons_1d, lats_1d, step)

    # Timestamp from GRIB metadata
    meta       = src.tags(1)
    valid_ts   = int(meta.get("GRIB_VALID_TIME", 0))
    time_label = epoch_to_iso(valid_ts) if valid_ts else grib_path.name
    print(f"  🕐  Valid time: {time_label}")
    src.close()

    # All property keys to emit (drop raw U/V, keep derived speed/dir)
    all_keys = [
        k for k in list(ECWAM_BANDS.keys()) + ["stokesDriftSpeed", "stokesDriftDirection"]
        if k not in ("stokesDriftU", "stokesDriftV")
    ]

    features = []
    for i in rows:
        lat = float(lats_1d[i])
        for j in cols:
            lon = float(lons_1d[j])

            if np.isnan(bands["waveHeight"][i, j]):
                continue

            props = {"model": "ECWAM"}
            for key in all_keys:
                props[key] = safe(bands[key][i, j] if key in bands else None)

            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": props,
            })

    out_file = make_out_path(out_dir, "ecwam", 0, False)
    write_geojson(features, out_file)


# ══════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════
def parse_args():
    p = argparse.ArgumentParser(
        description="Convert WW3, MRI3, and ECWAM wave model files to GeoJSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # ── Input files / directories ──────────────────────────────────────────
    p.add_argument("--ww3",       type=Path, help="WW3 .nc file")
    p.add_argument("--ww3-dir",   type=Path, help="Directory of WW3 .nc files")
    p.add_argument("--mri3",      type=Path, help="MRI3 .nc file")
    p.add_argument("--mri3-dir",  type=Path, help="Directory of MRI3 .nc files")
    p.add_argument("--ecwam",     type=Path, help="ECWAM GRIB file")
    p.add_argument("--ecwam-dir", type=Path, help="Directory of ECWAM GRIB files")

    # ── Subsampling ────────────────────────────────────────────────────────
    p.add_argument(
        "--step", type=int, default=DEFAULT_STEP,
        help=f"Global fallback subsampling step (default: {DEFAULT_STEP}). "
             "Used when a model-specific step is not set.",
    )
    p.add_argument(
        "--ww3-step", type=int, default=None,
        help="Subsampling step for WW3 (overrides --step)",
    )
    p.add_argument(
        "--mri3-step", type=int, default=None,
        help="Subsampling step for MRI3 (overrides --step)",
    )
    p.add_argument(
        "--ecwam-step", type=int, default=None,
        help="Subsampling step for ECWAM (overrides --step)",
    )

    # ── Other options ──────────────────────────────────────────────────────
    p.add_argument(
        "--out", type=Path, default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})",
    )
    p.add_argument(
        "--bbox", type=float, nargs=4,
        metavar=("LON_MIN", "LAT_MIN", "LON_MAX", "LAT_MAX"),
        help="Bounding-box filter  e.g. --bbox 115 5 135 25",
    )
    p.add_argument(
        "--all-times", action="store_true",
        help="Export every timestep (MRI3 has 73, WW3 usually 1)",
    )
    return p.parse_args()


def main():
    args = parse_args()
    bbox = tuple(args.bbox) if args.bbox else DEFAULT_BBOX
    ran  = False

    # Resolve per-model steps (fall back to global --step if not set)
    ww3_step   = resolve_step(args.ww3_step,   args.step)
    mri3_step  = resolve_step(args.mri3_step,  args.step)
    ecwam_step = resolve_step(args.ecwam_step, args.step)

    print(f"📐  Steps — WW3: {ww3_step}  MRI3: {mri3_step}  ECWAM: {ecwam_step}")

    # ── WW3 ───────────────────────────────────────────────────────────────
    ww3_files = ([args.ww3] if args.ww3
                 else sorted(args.ww3_dir.rglob("*.nc")) if args.ww3_dir
                 else [])
    if args.ww3_dir:
        print(f"🔍  WW3:   {len(ww3_files)} file(s) in {args.ww3_dir}")
    for f in ww3_files:
        convert_ww3(f, args.out, step=ww3_step, bbox=bbox, all_times=args.all_times)
        ran = True

    # ── MRI3 ──────────────────────────────────────────────────────────────
    mri3_files = ([args.mri3] if args.mri3
                  else sorted(args.mri3_dir.rglob("*.nc")) if args.mri3_dir
                  else [])
    if args.mri3_dir:
        print(f"🔍  MRI3:  {len(mri3_files)} file(s) in {args.mri3_dir}")
    for f in mri3_files:
        convert_mri3(f, args.out, step=mri3_step, bbox=bbox, all_times=args.all_times)
        ran = True

    # ── ECWAM ─────────────────────────────────────────────────────────────
    if args.ecwam_dir:
        ecwam_files = sorted(args.ecwam_dir.glob("W1P0*"))
        if not ecwam_files:
            ecwam_files = [f for f in sorted(args.ecwam_dir.iterdir())
                           if f.is_file() and not f.name.startswith(".")]
        print(f"🔍  ECWAM: {len(ecwam_files)} file(s) in {args.ecwam_dir}")
    elif args.ecwam:
        ecwam_files = [args.ecwam]
    else:
        ecwam_files = []
    for f in ecwam_files:
        convert_ecwam(f, args.out, step=ecwam_step, bbox=bbox)
        ran = True

    if not ran:
        print("\n❌  No files specified. Run with --help for usage.")
        sys.exit(1)

    print(f"\n✅  All done. GeoJSON files written to: {args.out.resolve()}")


if __name__ == "__main__":
    main()