#!/bin/bash
set -e

NCFILE=$1
VARNAME=$2
DATE=$3
CMAP=${4:-viridis}

mkdir -p geotiff tiles cog

echo "→ Generating WW3 RGBA GeoTIFF..."
python3 scripts/ww3.py \
  "$NCFILE" \
  "$VARNAME" \
  "geotiff/${DATE}_${VARNAME}.tif" \
  "$CMAP"

# -------------------------------------------------
# Reproject to Web Mercator (preserve alpha)
# -------------------------------------------------
echo "→ Reprojecting to EPSG:3857..."
gdalwarp \
  -t_srs EPSG:3857 \
  -dstalpha \
  -r bilinear \
  -wo SOURCE_EXTRA=100 \
  -overwrite \
  "geotiff/${DATE}_${VARNAME}.tif" \
  "geotiff/${DATE}_${VARNAME}_3857.tif"

# -------------------------------------------------
# Build Cloud-Optimized GeoTIFF
# -------------------------------------------------
echo "→ Building Cloud-Optimized GeoTIFF..."
gdal_translate \
  "geotiff/${DATE}_${VARNAME}_3857.tif" \
  "cog/${DATE}_${VARNAME}_3857_cog.tif" \
  -of COG \
  -co COMPRESS=DEFLATE \
  -co PREDICTOR=2 \
  -co BIGTIFF=IF_SAFER \
  -co RESAMPLING=BILINEAR

# -------------------------------------------------
# Generate XYZ tiles
# -------------------------------------------------
echo "→ Generating XYZ tiles..."
gdal2tiles.py \
  --xyz \
  -z 0-8 \
  --processes=4 \
  --resampling=bilinear \
  "cog/${DATE}_${VARNAME}_3857_cog.tif" \
  "tiles/ww3/${DATE}_${VARNAME}"

echo "✓ Tiles ready in tiles/ww3/${DATE}_${VARNAME}"
