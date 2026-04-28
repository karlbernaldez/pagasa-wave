import xarray as xr
import numpy as np
import rioxarray
import matplotlib.pyplot as plt
import glob
import os

# Folder where GRIB2 files are stored
grib_dir = "./ECMWF/ecmwf_data/AIFS-SINGLE"

# Find ALL .grib2 files
grib_files = glob.glob(os.path.join(grib_dir, "*.grib2"))

if not grib_files:
    raise FileNotFoundError("No GRIB2 files found in AIFS-SINGLE directory!")

# Sort by modification time ( newest last )
grib_files.sort(key=os.path.getmtime)

# Latest file
latest_grib = grib_files[-1]

print("Using latest GRIB file:", latest_grib)

# Now open dynamically
ds = xr.open_dataset(
    latest_grib,
    engine="cfgrib",
    backend_kwargs={
        "filter_by_keys": {"typeOfLevel": "heightAboveGround", "level": 10}
    },
)

print(ds)
print(ds.data_vars)  # should list 'u10' and 'v10'

LAT_MIN, LAT_MAX = -10, 40
LON_MIN, LON_MAX = 80, 170

ds = ds.sel(latitude=slice(LAT_MAX, LAT_MIN), longitude=slice(LON_MIN, LON_MAX))

# Extract the 10 m components
u10 = ds["u10"]
v10 = ds["v10"]

# Compute wind magnitude
speed = np.sqrt(u10**2 + v10**2)
speed.name = "wind_speed"

# Assign CRS for mapping
if not speed.rio.crs:
    speed = speed.rio.write_crs("EPSG:4326")

# Export GeoTIFF
speed.rio.to_raster("wind_speed.tif")
print("✅ wind_speed.tif generated successfully")

# Quick visualization
plt.figure(figsize=(10, 8))
plt.imshow(speed, cmap="turbo")
plt.colorbar(label="Wind speed (m/s)")
plt.title("10 m Wind Speed Magnitude")
plt.savefig("wind_colored.png", dpi=300)
print("✅ Preview saved as wind_colored.png")
