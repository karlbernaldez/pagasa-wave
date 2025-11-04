import numpy as np
import rioxarray
import rasterio
from pathlib import Path

def extract_uv_from_grib(grib_file, output_dir=".", band_u=1, band_v=2):
    """
    Extract U and V components directly from GRIB file.
    
    Args:
        grib_file: Path to GRIB file with wind data
        output_dir: Directory for output files
        band_u: Band number for U component (default 1)
        band_v: Band number for V component (default 2)
    """
    print(f"📂 Reading GRIB file: {grib_file}")
    
    # Open GRIB with rioxarray
    da = rioxarray.open_rasterio(grib_file)
    
    print(f"   Found {len(da.band)} bands")
    print(f"   Bands available: {list(da.band.values)}")
    
    # Extract U component (band 1)
    u_component = da.sel(band=band_u)
    u_array = u_component.values
    
    # Extract V component (band 2)
    v_component = da.sel(band=band_v)
    v_array = v_component.values
    
    print(f"   U component shape: {u_array.shape}")
    print(f"   V component shape: {v_array.shape}")
    print(f"   U range: {np.nanmin(u_array):.2f} to {np.nanmax(u_array):.2f} m/s")
    print(f"   V range: {np.nanmin(v_array):.2f} to {np.nanmax(v_array):.2f} m/s")
    
    # Calculate wind speed for verification
    speed = np.sqrt(u_array**2 + v_array**2)
    print(f"   Wind speed range: {np.nanmin(speed):.2f} to {np.nanmax(speed):.2f} m/s")
    print(f"   Wind speed range: {np.nanmin(speed)*1.94384:.2f} to {np.nanmax(speed)*1.94384:.2f} kt")
    
    # Save U component
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    u_path = output_dir / "wind_u.tif"
    save_geotiff(u_array, u_component.rio.transform(), u_component.rio.crs, u_path)
    
    # Save V component
    v_path = output_dir / "wind_v.tif"
    save_geotiff(v_array, v_component.rio.transform(), v_component.rio.crs, v_path)
    
    return str(u_path), str(v_path)


def convert_speed_direction_to_uv(speed_file, direction_file=None, output_dir="."):
    """
    Convert wind speed and direction GeoTIFFs to U/V components.
    
    Args:
        speed_file: Path to wind speed GeoTIFF (m/s)
        direction_file: Path to wind direction GeoTIFF (degrees, meteorological convention)
                       If None, assumes direction is in band 2 of speed_file
        output_dir: Directory for output files
    """
    print(f"📂 Reading wind speed: {speed_file}")
    
    # Load speed
    speed_da = rioxarray.open_rasterio(speed_file)
    
    if direction_file is None:
        # Try to get direction from second band
        if len(speed_da.band) >= 2:
            print("   Using band 2 as direction")
            speed = speed_da.sel(band=1).values
            direction = speed_da.sel(band=2).values
        else:
            raise ValueError("Direction file required or speed file must have 2 bands")
    else:
        print(f"📂 Reading wind direction: {direction_file}")
        speed = speed_da.squeeze().values
        direction_da = rioxarray.open_rasterio(direction_file)
        direction = direction_da.squeeze().values
    
    print(f"   Speed range: {np.nanmin(speed):.2f} to {np.nanmax(speed):.2f} m/s")
    print(f"   Direction range: {np.nanmin(direction):.2f} to {np.nanmax(direction):.2f} degrees")
    
    # Convert to U/V components
    # Meteorological convention: direction is where wind comes FROM
    # U = -speed * sin(direction), V = -speed * cos(direction)
    direction_rad = np.deg2rad(direction)
    
    u = -speed * np.sin(direction_rad)
    v = -speed * np.cos(direction_rad)
    
    print(f"   U range: {np.nanmin(u):.2f} to {np.nanmax(u):.2f} m/s")
    print(f"   V range: {np.nanmin(v):.2f} to {np.nanmax(v):.2f} m/s")
    
    # Verify conversion
    calculated_speed = np.sqrt(u**2 + v**2)
    speed_diff = np.nanmean(np.abs(calculated_speed - speed))
    print(f"   Verification: mean speed difference = {speed_diff:.6f} m/s")
    
    # Save components
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    u_path = output_dir / "wind_u.tif"
    save_geotiff(u, speed_da.rio.transform(), speed_da.rio.crs, u_path)
    
    v_path = output_dir / "wind_v.tif"
    save_geotiff(v, speed_da.rio.transform(), speed_da.rio.crs, v_path)
    
    return str(u_path), str(v_path)


def convert_magnitude_only(speed_file, output_dir=".", assumed_direction=270):
    """
    Convert wind speed to U/V assuming constant direction (emergency fallback).
    
    Args:
        speed_file: Path to wind speed GeoTIFF (m/s)
        output_dir: Directory for output files
        assumed_direction: Assumed wind direction in degrees (default 270 = westerly)
    """
    print(f"⚠️  WARNING: Converting with assumed direction {assumed_direction}°")
    print(f"   This will show speed but not actual wind direction!")
    
    speed_da = rioxarray.open_rasterio(speed_file)
    speed = speed_da.squeeze().values
    
    # Create constant direction field
    direction = np.full_like(speed, assumed_direction)
    
    # Convert to U/V
    direction_rad = np.deg2rad(direction)
    u = -speed * np.sin(direction_rad)
    v = -speed * np.cos(direction_rad)
    
    # Save components
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    u_path = output_dir / "wind_u.tif"
    save_geotiff(u, speed_da.rio.transform(), speed_da.rio.crs, u_path)
    
    v_path = output_dir / "wind_v.tif"
    save_geotiff(v, speed_da.rio.transform(), speed_da.rio.crs, v_path)
    
    return str(u_path), str(v_path)


def save_geotiff(data, transform, crs, output_path):
    """Save array as GeoTIFF."""
    profile = {
        "driver": "GTiff",
        "height": data.shape[0],
        "width": data.shape[1],
        "count": 1,
        "dtype": data.dtype,
        "transform": transform,
        "crs": crs,
        "compress": "DEFLATE",
    }
    
    with rasterio.open(output_path, "w", **profile) as dst:
        dst.write(data, 1)
    
    print(f"✅ Saved: {output_path}")


# -------------------------------------------------------
# 🚀 USAGE
# -------------------------------------------------------
if __name__ == "__main__":
    
    # Option 1: Extract from GRIB file (if your GRIB has U/V bands)
    try:
        u_path, v_path = extract_uv_from_grib(
            "20251029180000-0h-oper-fc.grib2",
            output_dir=".",
            band_u=1,  # Adjust based on your GRIB structure
            band_v=2
        )
        print("\n✅ U/V components extracted from GRIB!")
    except Exception as e:
        print(f"\n❌ GRIB extraction failed: {e}")
        print("   Trying alternative methods...\n")
        
        # Option 2: Convert from speed + direction files
        try:
            u_path, v_path = convert_speed_direction_to_uv(
                speed_file="wind_speed.tif",
                direction_file="wind_direction.tif",  # or None if in band 2
                output_dir="."
            )
            print("\n✅ U/V components created from speed + direction!")
        except Exception as e:
            print(f"\n❌ Speed/direction conversion failed: {e}")
            print("   Using fallback method...\n")
            
            # Option 3: Fallback - assume constant direction
            u_path, v_path = convert_magnitude_only(
                speed_file="wind_speed.tif",
                output_dir=".",
                assumed_direction=270  # Westerly wind
            )
            print("\n⚠️  U/V components created with assumed direction!")
            print("   Wind barbs will show speed but not actual direction.")
    
    print(f"\n📁 Output files:")
    print(f"   {u_path}")
    print(f"   {v_path}")
    print(f"\n🚀 Now you can run: python windbarbs.py")