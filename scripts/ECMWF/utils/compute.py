#!/usr/bin/env python3
import xarray as xr
import numpy as np
import rioxarray
import matplotlib.pyplot as plt
from pathlib import Path
import os


INPUT_DIR = Path("./ECMWF/ecmwf_data/AIFS-SINGLE")
OUTPUT_DIR = Path("./ECMWF/ecmwf_data/TIFF")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("🌬️ ECMWF → Wind Magnitude TIFF Generator")
print(f"📂 Input GRIB dir:  {INPUT_DIR}")
print(f"📂 Output TIFF dir: {OUTPUT_DIR}")
print("--------------------------------------------------")

# 🧹 CLEANUP: Remove all previous TIFFs to ensure only latest 4 remain
for old_tif in OUTPUT_DIR.glob("*.tif"):
    old_tif.unlink()
for old_png in OUTPUT_DIR.glob("*.png"):
    old_png.unlink()

# ✅ Get latest 4 GRIB files (sorted newest to oldest)
files = sorted(INPUT_DIR.glob("*.grib2"), reverse=True)[:4]

if not files:
    print("❌ No GRIB files found. Nothing to compute.")
    exit(1)

print(f"🔍 Found {len(files)} GRIB files to process.")

for file in files:
    print("--------------------------------------------------")
    print(f"➡️ Processing GRIB → {file.name}")

    try:
        ds = xr.open_dataset(
            file,
            engine="cfgrib",
            backend_kwargs={
                "filter_by_keys": {"typeOfLevel": "heightAboveGround", "level": 10}
            },
        )

        # TCID Bounding Box (covers the polygon)
        LAT_MIN, LAT_MAX = -10, 40
        LON_MIN, LON_MAX = 80, 170

        ds = ds.sel(latitude=slice(LAT_MAX, LAT_MIN), longitude=slice(LON_MIN, LON_MAX))

        u10 = ds["u10"]
        v10 = ds["v10"]

        # Compute wind magnitude (m/s)
        speed = np.sqrt(u10**2 + v10**2)
        speed.name = "wind_speed"

        # Assign CRS for mapping (EPSG:4326 WGS84 lat/lon)
        speed = speed.rio.write_crs("EPSG:4326", inplace=True)

        # Output names
        tif_path = OUTPUT_DIR / f"{file.stem}_wind.tif"
        png_path = OUTPUT_DIR / f"{file.stem}_preview.png"

        # Save GeoTIFF
        speed.rio.to_raster(tif_path)
        print(f"✅ Saved TIFF: {tif_path.name}")

        # Save PNG quick preview
        plt.figure(figsize=(10, 8))
        plt.imshow(speed, cmap="turbo")
        plt.colorbar(label="Wind speed (m/s)")
        plt.title(f"10m Wind Magnitude ({file.stem})")
        plt.savefig(png_path, dpi=300)
        plt.close()
        print(f"🖼️ Saved preview: {png_path.name}")

    except Exception as e:
        print(f"❌ Failed processing {file.name}: {e}")
        continue

print("--------------------------------------------------")
print("✅ TIFF generation completed (latest 4 only).")
