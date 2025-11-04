import xarray as xr

# Load GRIB2 but filter only U/V @ height_above_ground (10 meters)
ds = xr.open_dataset(
    "20251028000000-0h-oper-fc.grib2",
    engine="cfgrib",
    backend_kwargs={
        "filter_by_keys": {
            "typeOfLevel": "heightAboveGround",
            "level": 10,
        }
    },
)

# Extract U and V (variable names can be "u10" / "v10" or "u" / "v")
u = ds["u10"] if "u10" in ds.variables else ds["u"]
v = ds["v10"] if "v10" in ds.variables else ds["v"]

# Keep only U/V in new dataset
wind = xr.Dataset({"u10": u, "v10": v})

# Save to NetCDF
wind.to_netcdf("wind10m.nc")

print("✅ Saved: wind10m.nc")
