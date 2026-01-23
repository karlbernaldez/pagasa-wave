#!/bin/bash
set -e

NCFILE=$1
VARNAME=$2
DATE=$3
SIGMA=${4:-1.2}

mkdir -p geotiff tiles cog

echo "→ Build smooth MRI3-style RGBA GeoTIFF in EPSG:3857..."
python3 ww3.py \
  "$NCFILE" \
  "$VARNAME" \
  "geotiff/${DATE}_${VARNAME}_3857_rgba.tif" \
  "$SIGMA"

echo "→ Build Cloud-Optimized GeoTIFF..."
gdal_translate \
  "geotiff/${DATE}_${VARNAME}_3857_rgba.tif" \
  "cog/${DATE}_${VARNAME}_3857_cog.tif" \
  -of COG \
  -co COMPRESS=DEFLATE \
  -co PREDICTOR=2 \
  -co BIGTIFF=IF_SAFER \
  -co RESAMPLING=NEAREST

echo "→ Overviews (nearest)..."
gdaladdo -r nearest "cog/${DATE}_${VARNAME}_3857_cog.tif" 2 4 8 16 32 64 128

echo "→ Tiles (nearest; already discrete RGBA)..."
gdal2tiles.py \
  --xyz \
  -z 0-8 \
  --processes=4 \
  -r near \
  -w none \
  "cog/${DATE}_${VARNAME}_3857_cog.tif" \
  "tiles/ww3/${DATE}_${VARNAME}"

echo "✓ Tiles ready: tiles/ww3/${DATE}_${VARNAME}"
