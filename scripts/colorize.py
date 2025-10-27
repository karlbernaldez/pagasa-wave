import numpy as np
import matplotlib.pyplot as plt
import rasterio
from rasterio.transform import from_origin
from matplotlib import colormaps
import rioxarray

# Open your float32 GeoTIFF
da = rioxarray.open_rasterio("wind_speed.tif")
data = da.squeeze().values  # remove extra band dimension if any

# Clip and normalize to 0–1 range for color mapping
data = np.clip(data, 0, 30) / 30.0

# Apply a Matplotlib colormap (turbo gives nice vibrant look)
colormap = colormaps.get_cmap('turbo')
rgba = (colormap(data)[:, :, :3] * 255).astype(np.uint8)

# Get transform and metadata for saving
transform = da.rio.transform()
crs = da.rio.crs

# Build rasterio profile manually
profile = {
    "driver": "GTiff",
    "height": rgba.shape[0],
    "width": rgba.shape[1],
    "count": 3,  # RGB
    "dtype": "uint8",
    "crs": crs,
    "transform": transform,
    "photometric": "RGB"
}

# Write out as 8-bit RGB GeoTIFF
with rasterio.open("wind_speed_color.tif", "w", **profile) as dst:
    for i in range(3):
        dst.write(rgba[:, :, i], i + 1)

print("✅ Created wind_speed_color.tif (8-bit RGB, ready for Mapbox)")
