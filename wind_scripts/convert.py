#!/usr/bin/env python3
"""
Convert ECMWF OpenData GRIB2 files to line-delimited GeoJSON for Mapbox tilesets
"""

import json
import numpy as np
import xarray as xr
import sys
from pathlib import Path

def grib2_to_line_delimited_geojson(grib_file, output_file, grid_step=1):
    """
    Convert GRIB2 to line-delimited GeoJSON
    
    Args:
        grib_file: Path to GRIB2 file
        output_file: Path to output .geojson file
        grid_step: Sample every Nth point (1=all points, 2=every other point, etc.)
    """
    print(f"Opening GRIB file: {grib_file}")
    
    # Open GRIB file with cfgrib engine, filtering for 10m winds specifically
    ds = xr.open_dataset(
        grib_file, 
        engine='cfgrib',
        backend_kwargs={'filter_by_keys': {
            'typeOfLevel': 'heightAboveGround',
            'level': 10
        }}
    )
    
    # Get available variables
    print(f"Available variables: {list(ds.data_vars)}")
    
    # Try to find u10 and v10 (10m wind components)
    u10 = None
    v10 = None
    
    # Common variable names for 10m winds
    u_names = ['u10', 'u10m', '10u', 'u_component_of_wind_10m']
    v_names = ['v10', 'v10m', '10v', 'v_component_of_wind_10m']
    
    for var in ds.data_vars:
        var_lower = str(var).lower()
        if any(name in var_lower for name in u_names):
            u10 = ds[var]
            print(f"Found U component: {var}")
        if any(name in var_lower for name in v_names):
            v10 = ds[var]
            print(f"Found V component: {var}")
    
    if u10 is None or v10 is None:
        print("\nAvailable variables:")
        for var in ds.data_vars:
            print(f"  - {var}: {ds[var].attrs.get('long_name', 'No description')}")
        raise ValueError("Could not find u10 and v10 wind components. Check variable names above.")
    
    # Get coordinates
    lats = ds.latitude.values
    lons = ds.longitude.values
    
    # Handle time dimension if present
    if 'time' in ds.dims:
        times = ds.time.values
        print(f"Time steps: {len(times)}")
    else:
        times = [None]
    
    # Handle step/forecast dimension if present
    if 'step' in ds.dims:
        steps = ds.step.values
        print(f"Forecast steps: {len(steps)}")
    else:
        steps = [None]
    
    print(f"Grid size: {len(lats)} x {len(lons)}")
    print(f"Grid step: {grid_step} (sampling every {grid_step} point(s))")
    
    total_points = (len(lats[::grid_step]) * len(lons[::grid_step]) * 
                    len(times) * len(steps))
    print(f"Total features to generate: {total_points:,}")
    
    # Write line-delimited GeoJSON
    with open(output_file, 'w') as f:
        feature_count = 0
        
        for time_idx, time in enumerate(times):
            for step_idx, step in enumerate(steps):
                # Select data for this time/step
                if time is not None and step is not None:
                    u_data = u10.isel(time=time_idx, step=step_idx).values
                    v_data = v10.isel(time=time_idx, step=step_idx).values
                elif time is not None:
                    u_data = u10.isel(time=time_idx).values
                    v_data = v10.isel(time=time_idx).values
                elif step is not None:
                    u_data = u10.isel(step=step_idx).values
                    v_data = v10.isel(step=step_idx).values
                else:
                    u_data = u10.values
                    v_data = v10.values
                
                # Calculate wind speed and direction
                wind_speed = np.sqrt(u_data**2 + v_data**2)
                wind_direction = (np.arctan2(v_data, u_data) * 180 / np.pi + 180) % 360
                
                # Sample grid points
                for i in range(0, len(lats), grid_step):
                    for j in range(0, len(lons), grid_step):
                        lat = float(lats[i])
                        lon = float(lons[j])
                        
                        # Normalize longitude to -180 to 180
                        if lon > 180:
                            lon = lon - 360
                        
                        u_val = float(u_data[i, j])
                        v_val = float(v_data[i, j])
                        speed = float(wind_speed[i, j])
                        direction = float(wind_direction[i, j])
                        
                        # Skip if data is NaN
                        if np.isnan(u_val) or np.isnan(v_val):
                            continue
                        
                        # Create feature
                        feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [lon, lat]
                            },
                            "properties": {
                                "u10": round(u_val, 3),
                                "v10": round(v_val, 3),
                                "wind_speed": round(speed, 3),
                                "wind_direction": round(direction, 1)
                            }
                        }
                        
                        # Add time/step info if available
                        if time is not None:
                            feature["properties"]["timestamp"] = str(time)
                        if step is not None:
                            # Convert step to hours if it's a timedelta
                            if hasattr(step, 'total_seconds'):
                                hours = int(step.total_seconds() / 3600)
                            else:
                                hours = int(step)
                            feature["properties"]["forecast_hour"] = hours
                        
                        # Write as single line
                        f.write(json.dumps(feature) + '\n')
                        feature_count += 1
                        
                        if feature_count % 10000 == 0:
                            print(f"Processed {feature_count:,} features...", end='\r')
        
        print(f"\nTotal features written: {feature_count:,}")
    
    print(f"Output saved to: {output_file}")
    print(f"File size: {Path(output_file).stat().st_size / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python grib2_to_geojson.py <input.grib2> [output.geojson] [grid_step]")
        print("\nExample:")
        print("  python grib2_to_geojson.py ecmwf_data.grib2 wind_data.geojson 2")
        print("\nArguments:")
        print("  input.grib2  - Input GRIB2 file")
        print("  output.geojson - Output file (default: wind_data.geojson)")
        print("  grid_step    - Sample every Nth point (default: 1, try 2-4 for smaller files)")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "wind_data.geojson"
    grid_step = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    
    try:
        grib2_to_line_delimited_geojson(input_file, output_file, grid_step)
        print("\n✓ Conversion complete!")
        print(f"\nNext steps:")
        print(f"1. tilesets upload-source <username> ecmwf-wind-source {output_file}")
        print(f"2. tilesets create <username>.20251023 --recipe ecmwf_recipe.json --name '20251023'")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)