import xarray as xr
import matplotlib.pyplot as plt
import sys
import os

# Usage:
# python3 visualize_nc_to_png.py input.nc hs output.png
nc_file = sys.argv[1]
var_name = sys.argv[2]
out_png = sys.argv[3] if len(sys.argv) > 3 else f"{var_name}.png"

ds = xr.open_dataset(nc_file)

# select first timestep
data = ds[var_name][0].values
lats = ds['latitude'].values
lons = ds['longitude'].values

plt.figure(figsize=(10,8))
plt.pcolormesh(lons, lats, data, shading='auto', cmap='viridis')
plt.colorbar(label=var_name)
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.title(f"{var_name} from {os.path.basename(nc_file)}")

plt.savefig(out_png, dpi=150, bbox_inches='tight')
plt.close()

print(f"✓ Saved visualization to {out_png}")
