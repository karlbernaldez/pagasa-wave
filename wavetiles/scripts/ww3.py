#!/usr/bin/env python3

import xarray as xr
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from matplotlib import cm
import sys
import json

# Usage:
# python3 nc_to_colored_geotiff.py input.nc hs output.tif colormap

nc_file = sys.argv[1]
var_name = sys.argv[2]
out_tif = sys.argv[3]
cmap_name = sys.argv[4] if len(sys.argv) > 4 else "viridis"

# -------------------------------------------------
# Load NetCDF
# -------------------------------------------------
ds = xr.open_dataset(nc_file)

data = ds[var_name][0].values  # first timestep
lats = ds["latitude"].values
lons = ds["longitude"].values

# Rasterio expects origin at top-left
data = np.flipud(data)

# -------------------------------------------------
# Mask invalid / black areas
# -------------------------------------------------
mask = np.isnan(data)

valid = data[~mask]
data_min = float(valid.min())
data_max = float(valid.max())

scaled = np.zeros_like(data, dtype=np.float32)
scaled[~mask] = (data[~mask] - data_min) / (data_max - data_min)
scaled = np.clip(scaled, 0, 1)

# -------------------------------------------------
# Apply colormap with alpha
# -------------------------------------------------
cmap = cm.get_cmap(cmap_name)

rgba = cmap(scaled)                 # RGBA in 0–1
rgba[..., 3] = np.where(mask, 0, 1) # transparent where masked

rgba_uint8 = (rgba * 255).astype(np.uint8)

# -------------------------------------------------
# Write RGBA GeoTIFF (EPSG:4326)
# -------------------------------------------------
transform = from_bounds(
    lons.min(), lats.min(),
    lons.max(), lats.max(),
    width=rgba_uint8.shape[1],
    height=rgba_uint8.shape[0]
)

with rasterio.open(
    out_tif,
    "w",
    driver="GTiff",
    height=rgba_uint8.shape[0],
    width=rgba_uint8.shape[1],
    count=4,                      # RGBA
    dtype=np.uint8,
    crs="EPSG:4326",
    transform=transform,
    tiled=True,
    compress="DEFLATE",
    predictor=2
) as dst:
    for i in range(4):
        dst.write(rgba_uint8[:, :, i], i + 1)

# -------------------------------------------------
# Save metadata for legend scaling
# -------------------------------------------------
meta_file = out_tif.replace(".tif", "_metadata.json")
with open(meta_file, "w") as f:
    json.dump(
        {"min": data_min, "max": data_max},
        f,
        indent=2
    )

print(f"✓ RGBA GeoTIFF written: {out_tif}")
print(f"✓ Metadata written: {meta_file}")
