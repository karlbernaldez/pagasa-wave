import pygrib
import numpy as np
from scipy.interpolate import griddata
import json

# === 1. Open GRIB file ===
grbs = pygrib.open("era5_ph_wind_wave.grib")

# Containers
wind_data = {}
wave_data = {}

# === 2. Extract variables ===
for grb in grbs:
    if grb.shortName in ['10u', '10v']:  # pygrib uses shortName '10u' and '10v' for 10m winds
        wind_data[grb.shortName] = grb.values
        lats, lons = grb.latlons()  # grid coordinates for wind
    elif grb.shortName in ['mwd', 'mwp', 'swh']:
        wave_data[grb.shortName] = grb.values
        wave_lats, wave_lons = grb.latlons()  # usually coarser grid

# Confirm required wind variables are present
if '10u' not in wind_data or '10v' not in wind_data:
    raise ValueError("Wind variables not found in GRIB file. Check variable names.")

# === 3. Interpolate wave data onto wind grid ===
wave_interp = {}
for key, data in wave_data.items():
    points = np.array([wave_lons.flatten(), wave_lats.flatten()]).T
    values = data.flatten()
    wave_interp[key] = griddata(points, values, (lons, lats), method='linear')

# === 4. Compute wind speed and direction ===
u10 = wind_data['10u']
v10 = wind_data['10v']

wind_speed = np.sqrt(u10**2 + v10**2)
wind_dir = (np.arctan2(u10, v10) * 180/np.pi) % 360  # degrees clockwise from north

# === 5. Create GeoJSON features (subsampled + domain filter) ===
features = []

# Subsampling step
step = 15

# Define your domain (example: Philippines bounding box)
lon_min, lat_min = 110, 0
lon_max, lat_max = 155, 27

for i in range(0, lats.shape[0], step):
    for j in range(0, lats.shape[1], step):
        lat = lats[i, j]
        lon = lons[i, j]
        
        # Only include points inside the domain
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon), float(lat)]
                },
                "properties": {
                    "windSpeed": float(wind_speed[i, j]),
                    "windDirection": float(wind_dir[i, j]),
                    "waveDirection": float(wave_interp['mwd'][i, j]) if 'mwd' in wave_interp else None,
                    "wavePeriod": float(wave_interp['mwp'][i, j]) if 'mwp' in wave_interp else None,
                    "waveHeight": float(wave_interp['swh'][i, j]) if 'swh' in wave_interp else None
                }
            }
            features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

# === 6. Save to file ===
with open("era5_ph_wind_wave.geojson", "w") as f:
    json.dump(geojson, f)

print("✅ Conversion complete. Saved as era5_ph_wind_wave.json")
