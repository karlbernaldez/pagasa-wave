#!/usr/bin/env python3
"""
inspect_models.py — Inspect WW3 (.nc), MRI3 (.nc), and ECWAM (GRIB1) files.

Usage:
  python3 inspect_models.py --ww3  ../input/2026011200/ww3_grdo.20260115T00.nc
                             --mri3 ../input/mri3_2026011200/2026011200_PH.nc
                             --ecwam ../input/12/00/W1P01120000011200011

  # Or just point at a directory and let it find files:
  python3 inspect_models.py --ww3-dir  ../input/2026011200/
                             --mri3-dir ../input/mri3_2026011200/
                             --ecwam    ../input/12/00/W1P01120000011200011
"""

import argparse
import sys
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
# Formatting helpers
# ══════════════════════════════════════════════════════════════════════════
W = 72

def header(title: str):
    print("\n" + "═" * W)
    print(f"  {title}")
    print("═" * W)

def section(title: str):
    print(f"\n  ── {title} {'─' * (W - len(title) - 6)}")

def row(label: str, value):
    print(f"    {label:<30} {value}")

def warn(msg: str):
    print(f"    ⚠  {msg}")

def ok(msg: str):
    print(f"    ✓  {msg}")


def stats_str(arr: np.ndarray, nodata=None) -> str:
    a = arr.astype(np.float32)
    if nodata is not None:
        a = np.where(a == nodata, np.nan, a)
    valid = a[~np.isnan(a)]
    if valid.size == 0:
        return "all NaN / no valid data"
    return (
        f"min={valid.min():.3f}  max={valid.max():.3f}  "
        f"mean={valid.mean():.3f}  valid={valid.size:,}  "
        f"nan={np.isnan(a).sum():,}  shape={arr.shape}"
    )


# ══════════════════════════════════════════════════════════════════════════
# NetCDF inspector (WW3 + MRI3)
# ══════════════════════════════════════════════════════════════════════════
def inspect_nc(path: Path, label: str):
    header(f"{label}  —  {path.name}")

    if not HAVE_XR:
        warn("xarray not installed — cannot inspect NetCDF")
        return

    if not path.exists():
        warn(f"File not found: {path}")
        return

    try:
        ds = xr.open_dataset(path)
    except Exception as e:
        warn(f"Could not open file: {e}")
        return

    # ── File info ──────────────────────────────────────────────────────────
    section("File")
    row("Path", path)
    row("Size", f"{path.stat().st_size / 1e6:.2f} MB")

    # ── Global attributes ──────────────────────────────────────────────────
    if ds.attrs:
        section("Global Attributes")
        for k, v in ds.attrs.items():
            row(k, str(v)[:80])

    # ── Dimensions ────────────────────────────────────────────────────────
    section("Dimensions")
    for dim, size in ds.dims.items():
        row(dim, size)

    # ── Coordinates ───────────────────────────────────────────────────────
    section("Coordinates")
    for name, coord in ds.coords.items():
        vals = coord.values
        if np.issubdtype(vals.dtype, np.number) and vals.size > 1:
            row(name,
                f"shape={vals.shape}  dtype={vals.dtype}  "
                f"range=[{float(vals.min()):.4f}, {float(vals.max()):.4f}]  "
                f"step≈{abs(float(vals[1]-vals[0])):.4f}")
        else:
            row(name, f"shape={vals.shape}  dtype={vals.dtype}  first={vals.flat[0]}")

    # ── Lat/Lon resolution ─────────────────────────────────────────────────
    section("Spatial Resolution")
    lat_names = ("lat", "latitude", "Latitude", "nav_lat", "y")
    lon_names = ("lon", "longitude", "Longitude", "nav_lon", "x")
    lat_da = lon_da = None
    for la in lat_names:
        if la in ds.coords or la in ds.variables:
            lat_da = ds[la]
            break
    for lo in lon_names:
        if lo in ds.coords or lo in ds.variables:
            lon_da = ds[lo]
            break

    if lat_da is not None and lon_da is not None:
        lats = lat_da.values.ravel()
        lons = lon_da.values.ravel()
        lat_res = abs(float(np.diff(np.sort(np.unique(lats))).mean())) if lats.size > 1 else None
        lon_res = abs(float(np.diff(np.sort(np.unique(lons))).mean())) if lons.size > 1 else None
        row("Lat range",  f"[{lats.min():.4f}, {lats.max():.4f}]")
        row("Lon range",  f"[{lons.min():.4f}, {lons.max():.4f}]")
        if lat_res:
            row("Lat resolution", f"~{lat_res:.4f}°  (~{lat_res * 111:.1f} km)")
        if lon_res:
            row("Lon resolution", f"~{lon_res:.4f}°  (~{lon_res * 111:.1f} km at equator)")

        # Expected zoom-8 pixel density check
        target_res_deg = (156543.03392804097 / (2**8)) / 111000
        if lat_res:
            oversample = lat_res / target_res_deg
            row("Zoom-8 oversample factor",
                f"~{oversample:.1f}x  "
                f"({'upsampling needed ⬆' if oversample > 1 else 'already fine ✓'})")
    else:
        warn("Could not find lat/lon coordinates")

    # ── Time ──────────────────────────────────────────────────────────────
    section("Time")
    for tdim in ("time", "Time", "forecast_time"):
        if tdim in ds.coords or tdim in ds.dims:
            t = ds[tdim].values
            row("Time dim", tdim)
            row("N timesteps", len(t))
            row("First", str(t[0])[:30])
            row("Last",  str(t[-1])[:30])
            if len(t) > 1:
                try:
                    delta = (t[1] - t[0]) / np.timedelta64(1, "h")
                    row("Interval", f"~{delta:.1f} h")
                except Exception:
                    pass
            break
    else:
        warn("No time dimension found (single-time file?)")

    # ── Data variables ─────────────────────────────────────────────────────
    section("Data Variables")
    for vname, da in ds.data_vars.items():
        print(f"\n    [{vname}]")
        row("  dtype",  da.dtype)
        row("  dims",   da.dims)
        row("  shape",  da.shape)
        row("  units",  da.attrs.get("units", "—"))
        row("  long_name", da.attrs.get("long_name", da.attrs.get("standard_name", "—"))[:60])

        # Load first timestep for stats
        try:
            if any(d in da.dims for d in ("time", "Time", "forecast_time")):
                arr = da.isel({d: 0 for d in da.dims
                               if d in ("time", "Time", "forecast_time")}).values
            else:
                arr = da.values

            arr = arr.astype(np.float32)
            # Common GRIB/NC fill value detection
            arr = np.where(np.abs(arr) > 1e10, np.nan, arr)
            fill = da.attrs.get("_FillValue", da.attrs.get("missing_value", None))
            if fill is not None:
                arr = np.where(arr == float(fill), np.nan, arr)

            row("  stats (t=0)", stats_str(arr))

        except Exception as e:
            warn(f"Could not compute stats for {vname}: {e}")

    # ── CRS / projection ───────────────────────────────────────────────────
    section("CRS / Projection")
    crs_found = False
    for attr in ("crs", "projection", "grid_mapping"):
        if attr in ds.attrs:
            row(attr, ds.attrs[attr])
            crs_found = True
    if not crs_found:
        ok("Assumed EPSG:4326 (regular lat/lon, no explicit CRS attr)")

    ds.close()


# ══════════════════════════════════════════════════════════════════════════
# GRIB inspector (ECWAM)
# ══════════════════════════════════════════════════════════════════════════
def inspect_grib(path: Path, label: str):
    header(f"{label}  —  {path.name}")

    if not path.exists():
        warn(f"File not found: {path}")
        return

    if not HAVE_RIO:
        warn("rasterio not installed — cannot inspect GRIB")
        return

    try:
        src = rasterio.open(path)
    except Exception as e:
        warn(f"Could not open file: {e}")
        return

    section("File")
    row("Path",   path)
    row("Size",   f"{path.stat().st_size / 1e6:.2f} MB")
    row("Driver", src.driver)
    row("Format", "GRIB1/GRIB2 (rasterio)")

    section("Raster Info")
    row("CRS",       src.crs)
    row("Width",     src.width)
    row("Height",    src.height)
    row("N bands",   src.count)
    row("Dtype",     src.dtypes[0])
    row("Transform", src.transform)
    row("Bounds",    src.bounds)

    section("Spatial Resolution")
    res_x, res_y = src.res
    row("Pixel size (native)", f"{res_x:.6f} x {res_y:.6f}  (CRS units)")
    if src.crs and src.crs.is_geographic:
        row("Approx res (lat)",  f"~{res_y * 111:.2f} km")
        row("Approx res (lon)",  f"~{res_x * 111:.2f} km at equator")
        target_res_deg = (156543.03392804097 / (2**8)) / 111000
        oversample = res_y / target_res_deg
        row("Zoom-8 oversample factor",
            f"~{oversample:.1f}x  "
            f"({'upsampling needed ⬆' if oversample > 1 else 'already fine ✓'})")

    section("Band Statistics")
    for i in range(1, src.count + 1):
        arr = src.read(i).astype(np.float32)
        nodata = src.nodata
        meta = src.tags(i)
        name = meta.get("GRIB_ELEMENT", meta.get("long_name", f"Band {i}"))
        level = meta.get("GRIB_SHORT_NAME", meta.get("GRIB_LEVEL_TYPE", ""))
        print(f"\n    [Band {i}]  {name}  {level}")
        row("  nodata",  nodata)
        row("  stats",   stats_str(arr, nodata=nodata))
        if meta:
            for k, v in list(meta.items())[:8]:
                row(f"  {k}", str(v)[:70])

    src.close()


# ══════════════════════════════════════════════════════════════════════════
# Auto-find helpers
# ══════════════════════════════════════════════════════════════════════════
def find_nc(directory: Path) -> Path:
    ncs = sorted(directory.rglob("*.nc"))
    if not ncs:
        raise FileNotFoundError(f"No .nc files found under {directory}")
    # Prefer gridded (has lat+lon dims)
    if HAVE_XR:
        for nc in reversed(ncs):
            try:
                ds = xr.open_dataset(nc)
                has_latlon = any(c in ds.coords for c in ("lat","latitude","lon","longitude"))
                if has_latlon:
                    return nc
            except Exception:
                continue
    return ncs[-1]


# ══════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════
def parse_args():
    p = argparse.ArgumentParser(
        description="Inspect WW3/MRI3 NetCDF and ECWAM GRIB files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--ww3",      type=Path, default=None, help="Path to WW3 .nc file")
    p.add_argument("--ww3-dir",  type=Path, default=None, help="Dir to auto-find WW3 .nc")
    p.add_argument("--mri3",     type=Path, default=None, help="Path to MRI3 .nc file")
    p.add_argument("--mri3-dir", type=Path, default=None, help="Dir to auto-find MRI3 .nc")
    p.add_argument("--ecwam",    type=Path, default=None, help="Path to ECWAM GRIB file")
    return p.parse_args()


def main():
    args = parse_args()

    ran_anything = False

    # ── WW3 ───────────────────────────────────────────────────────────────
    ww3_path = args.ww3
    if ww3_path is None and args.ww3_dir:
        try:
            ww3_path = find_nc(args.ww3_dir)
        except FileNotFoundError as e:
            warn(str(e))
    if ww3_path:
        inspect_nc(ww3_path, "WW3  (NetCDF)")
        ran_anything = True

    # ── MRI3 ──────────────────────────────────────────────────────────────
    mri3_path = args.mri3
    if mri3_path is None and args.mri3_dir:
        try:
            mri3_path = find_nc(args.mri3_dir)
        except FileNotFoundError as e:
            warn(str(e))
    if mri3_path:
        inspect_nc(mri3_path, "MRI3  (NetCDF)")
        ran_anything = True

    # ── ECWAM ─────────────────────────────────────────────────────────────
    if args.ecwam:
        inspect_grib(args.ecwam, "ECWAM  (GRIB1)")
        ran_anything = True

    if not ran_anything:
        print("\nNo files specified. Examples:")
        print("  python3 inspect_models.py \\")
        print("    --ww3  ../input/2026011200/ww3_grdo.20260115T00.nc \\")
        print("    --mri3 ../input/mri3_2026011200/2026011200_PH.nc \\")
        print("    --ecwam ../input/12/00/W1P01120000011200011")
        sys.exit(1)

    print("\n" + "═" * W)
    print("  Inspection complete.")
    print("═" * W + "\n")


if __name__ == "__main__":
    main()