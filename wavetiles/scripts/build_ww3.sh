#!/bin/bash
set -euo pipefail

# ============================================================
# Usage: ./build_ww3.sh <NCFILE> [VARNAME] [SIGMA]
# Example: ./build_ww3.sh ../input/2026011200/ww3_grdo.20260112T00.nc
# Example: ./build_ww3.sh ../input/2026011200/ww3_grdo.20260112T00.nc hs 1.5
#
# DATE is derived automatically from the filename — do NOT pass it as an argument.
# ============================================================

NCFILE=${1:?"Usage: $0 <NCFILE> [VARNAME] [SIGMA]"}
VARNAME=${2:-hs}
SIGMA=${3:-1.5}

# Guard: catch accidental date-as-sigma (value > 100 makes no sense)
if (( $(echo "$SIGMA > 100" | bc -l) )); then
    echo "✗ SIGMA='$SIGMA' looks like a date, not a sigma value." >&2
    echo "  DATE is derived automatically from the filename." >&2
    echo "  Usage: $0 <NCFILE> [VARNAME] [SIGMA]" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GEOTIFF_DIR="$ROOT/geotiff"
COG_DIR="$ROOT/cog"
TILES_DIR="$ROOT/tiles/WW3"

# Derive DATE from filename — same regex as ww3.py
# e.g. ww3_grdo.20260112T00.nc → 2026011200
DATE=$(echo "$(basename "$NCFILE")" | grep -oP '\d{8}T\d{2}' | tr -d 'T' || true)
if [[ -z "$DATE" ]]; then
    DATE=$(echo "$(basename "$NCFILE")" | grep -oP '\d{10}' || true)
fi
if [[ -z "$DATE" ]]; then
    echo "✗ Could not extract DATE from filename: $NCFILE" >&2
    exit 1
fi

# Paths mirror ww3.py output structure exactly
RGBA_TIF="$GEOTIFF_DIR/WW3_rgba3857/${DATE}/${VARNAME}/${DATE}_${VARNAME}_light_3857_rgba.tif"
COG_TIF="$COG_DIR/${DATE}_${VARNAME}_light_3857_cog.tif"

mkdir -p "$GEOTIFF_DIR" "$COG_DIR" "$TILES_DIR"

echo "============================================"
echo " WW3 → TILES + COG Pipeline"
echo "  NCFILE  : $NCFILE"
echo "  VAR     : $VARNAME"
echo "  DATE    : $DATE"
echo "  SIGMA   : $SIGMA"
echo "  ROOT    : $ROOT"
echo "============================================"

# ----------------------------------------------------------
# 1) Run ww3.py: reproject (zoom-8 res) → smooth → classify → tile
# ----------------------------------------------------------
echo
echo "→ [1/2] Running ww3.py..."
python3 "$SCRIPT_DIR/ww3.py" \
    "$NCFILE" \
    --var         "$VARNAME" \
    --sigma       "$SIGMA" \
    --geotiff-dir "$GEOTIFF_DIR" \
    --tiles-dir   "$TILES_DIR"

# ----------------------------------------------------------
# 2) Build COG from light RGBA
#    (-of COG embeds overviews internally — no separate gdaladdo needed)
# ----------------------------------------------------------
echo
echo "→ [2/2] Building COG from light RGBA..."

if [[ ! -f "$RGBA_TIF" ]]; then
    echo "✗ RGBA TIF not found: $RGBA_TIF" >&2
    exit 1
fi

gdal_translate \
    "$RGBA_TIF" \
    "$COG_TIF" \
    -of COG \
    -co COMPRESS=DEFLATE \
    -co PREDICTOR=2 \
    -co BIGTIFF=IF_SAFER \
    -co RESAMPLING=BILINEAR \
    -co OVERVIEWS=IGNORE_EXISTING

echo
echo "✓ Done."
echo "  Tiles (light) : $TILES_DIR/light/$DATE"
echo "  Tiles (dark)  : $TILES_DIR/dark/$DATE"
echo "  RGBA GeoTIFF  : $RGBA_TIF"
echo "  COG           : $COG_TIF"