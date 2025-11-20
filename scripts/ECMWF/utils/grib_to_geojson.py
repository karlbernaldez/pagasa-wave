#!/usr/bin/env python3
import pygrib
import numpy as np
from scipy.interpolate import griddata
from pathlib import Path
import json
import re

# === CONFIG ===
GRIB_DIR = Path("./ECMWF/ecmwf_data/AIFS-SINGLE")
OUTPUT_DIR = Path("./ECMWF/ecmwf_data/GEOJSON")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Domain (Philippines example)
lon_min, lat_min = 80, -10
lon_max, lat_max = 170, 40

# LAT_MIN, LAT_MAX = -10, 40
# LON_MIN, LON_MAX = 80, 170

step = 7  # subsampling step (higher = fewer vectors)


def process_grib(grib_file: Path):
    print(f"\n🌪 Processing GRIB → GeoJSON: {grib_file.name}")

    grbs = pygrib.open(str(grib_file))

    wind_data = {}
    wave_data = {}

    # === Extract variables from GRIB ===
    for grb in grbs:
        if grb.shortName in ['10u', '10v']:
            wind_data[grb.shortName] = grb.values
            lats, lons = grb.latlons()

        elif grb.shortName in ['mwd', 'mwp', 'swh']:  # wave variables
            wave_data[grb.shortName] = grb.values
            wave_lats, wave_lons = grb.latlons()

    if '10u' not in wind_data or '10v' not in wind_data:
        print("⚠️  Skipped (wind data missing)")
        return

    # === Interpolate wave to wind grid (if wave exists) ===
    wave_interp = {}
    if wave_data:
        print("🌊 Interpolating wave to wind grid...")
        for key, data in wave_data.items():
            points = np.array([wave_lons.flatten(), wave_lats.flatten()]).T
            values = data.flatten()
            wave_interp[key] = griddata(
                points, values, (lons, lats), method='linear'
            )

    # === Compute wind speed and direction ===
    u10 = wind_data['10u']
    v10 = wind_data['10v']

    wind_speed = np.sqrt(u10 ** 2 + v10 ** 2)
    wind_dir = (np.arctan2(u10, v10) * 180 / np.pi) % 360

    # === Create GeoJSON features ===
    features = []
    for i in range(0, lats.shape[0], step):
        for j in range(0, lats.shape[1], step):
            lat = float(lats[i, j])
            lon = float(lons[i, j])

            # apply bounding box filter
            if not (lat_min <= lat <= lat_max and lon_min <= lon <= lon_max):
                continue

            feature = {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "windSpeed": float(wind_speed[i, j]),
                    "windDirection": float(wind_dir[i, j]),
                    "waveDirection": float(wave_interp['mwd'][i, j]) if 'mwd' in wave_interp else None,
                    "wavePeriod": float(wave_interp['mwp'][i, j]) if 'mwp' in wave_interp else None,
                    "waveHeight": float(wave_interp['swh'][i, j]) if 'swh' in wave_interp else None,
                }
            }
            features.append(feature)

    # === Output filename based on GRIB timestamp ===
    stamp = re.sub(r"\.grib2$", "", grib_file.name)
    output_file = OUTPUT_DIR / f"{stamp}.geojson"

    with open(output_file, "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f)

    print(f"✅ Saved: {output_file}")
    print(f"📍 Points: {len(features)}")


def main():
    grib_files = sorted(GRIB_DIR.glob("*.grib2"))
    if not grib_files:
        print("\n❌ No GRIB files found in AIFS-SINGLE/")
        return

    print(f"\n🔍 Found {len(grib_files)} GRIB files to convert")

    for grib in grib_files:
        process_grib(grib)

    print("\n✅ GeoJSON generation complete.")


if __name__ == "__main__":
    main()
