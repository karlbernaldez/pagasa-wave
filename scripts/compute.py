import xarray as xr
import numpy as np
import rioxarray
import matplotlib.pyplot as plt

# Open only the 10 m wind data
ds = xr.open_dataset(
    "20251029180000-0h-oper-fc.grib2",
    engine="cfgrib",
    backend_kwargs={
        "filter_by_keys": {"typeOfLevel": "heightAboveGround", "level": 10}
    }
)


print(ds)
print(ds.data_vars)  # should list 'u10' and 'v10'

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
