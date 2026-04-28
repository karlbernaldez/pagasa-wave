import rioxarray
import xarray as xr
import numpy as np

def inspect_grib(grib_file):
    """Inspect GRIB file structure to find U/V components."""
    
    print(f"🔍 Inspecting: {grib_file}")
    print("=" * 60)
    
    try:
        # Open with xarray to see all variables
        ds = xr.open_dataset(grib_file, engine='cfgrib')
        
        print("\n📋 Available variables:")
        for var in ds.data_vars:
            print(f"   - {var}")
            print(f"     Shape: {ds[var].shape}")
            print(f"     Dims: {ds[var].dims}")
            if hasattr(ds[var], 'long_name'):
                print(f"     Description: {ds[var].long_name}")
            if hasattr(ds[var], 'units'):
                print(f"     Units: {ds[var].units}")
            print()
        
        # Check for U/V components
        u_vars = [v for v in ds.data_vars if 'u' in v.lower() or 'east' in v.lower()]
        v_vars = [v for v in ds.data_vars if 'v' in v.lower() or 'north' in v.lower()]
        
        if u_vars:
            print(f"✅ Found potential U components: {u_vars}")
        if v_vars:
            print(f"✅ Found potential V components: {v_vars}")
            
        if not u_vars or not v_vars:
            print("⚠️  No obvious U/V components found.")
            print("   Checking rioxarray multi-band approach...")
            
    except Exception as e:
        print(f"⚠️  cfgrib failed: {e}")
        print("   Trying rioxarray approach...")
    
    print("\n" + "=" * 60)
    
    # Try rioxarray approach (multi-band)
    try:
        da = rioxarray.open_rasterio(grib_file)
        print(f"\n📊 Rioxarray info:")
        print(f"   Total bands: {len(da.band)}")
        print(f"   Shape: {da.shape}")
        print(f"   CRS: {da.rio.crs}")
        
        for i, band in enumerate(da.band.values, 1):
            band_data = da.sel(band=band).values
            print(f"\n   Band {i}:")
            print(f"     Min: {np.nanmin(band_data):.4f}")
            print(f"     Max: {np.nanmax(band_data):.4f}")
            print(f"     Mean: {np.nanmean(band_data):.4f}")
            print(f"     Non-NaN pixels: {np.sum(~np.isnan(band_data))}")
            
        print("\n💡 Recommendations:")
        if len(da.band) >= 2:
            print("   ✅ File has multiple bands - likely contains U and V")
            print("   ✅ Try: extract_uv_from_grib() with band_u=1, band_v=2")
        else:
            print("   ⚠️  Only 1 band found - this might be magnitude only")
            print("   ⚠️  You'll need to use convert_speed_direction_to_uv()")
            
    except Exception as e:
        print(f"❌ Rioxarray failed: {e}")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    import sys
    
    # Check command line argument
    if len(sys.argv) > 1:
        grib_file = sys.argv[1]
    else:
        # List common GRIB file patterns
        from pathlib import Path
        grib_files = list(Path(".").glob("*.grib*")) + list(Path(".").glob("*.grb*"))
        
        if grib_files:
            print("Found GRIB files:")
            for i, f in enumerate(grib_files, 1):
                print(f"  {i}. {f}")
            
            if len(grib_files) == 1:
                grib_file = str(grib_files[0])
                print(f"\nUsing: {grib_file}\n")
            else:
                choice = input("\nEnter file number to inspect (or path): ")
                try:
                    grib_file = str(grib_files[int(choice) - 1])
                except:
                    grib_file = choice
        else:
            print("No GRIB files found in current directory.")
            grib_file = input("Enter path to GRIB file: ")
    
    inspect_grib(grib_file)