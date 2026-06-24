#!/usr/bin/env bash
set -euo pipefail

# WW3 operational wrapper.
#
# Compatible usage:
#   ./build_ww3.sh <NCFILE> [VARNAME] [SIGMA]
#
# Operational usage:
#   WW3_STYLES=light,dark ./build_ww3.sh <NCFILE> hs 1.5 --skip-existing
#   ./build_ww3.sh <NCFILE> hs 1.5 --styles light,dark,night --zoom-max 8
#
# DATE is derived from the filename; do not pass it as an argument.

usage() {
    cat >&2 <<'EOF'
Usage: build_ww3.sh <NCFILE> [VARNAME] [SIGMA] [-- extra ww3.py args]

Environment overrides:
  WW3_VAR             Variable to process when VARNAME is omitted (default: hs)
  WW3_SIGMA           Smoothing sigma when SIGMA is omitted (default: 1.5)
  WW3_STYLES          Comma-separated styles for ww3.py (default from ww3.py)
  WW3_COG_STYLE       Style used to build the COG (default: light)
  WW3_SKIP_COG        Set to 1 to skip COG creation
  WW3_PYTHON          Python executable (default: python3)
  WW3_GDAL_TRANSLATE  gdal_translate executable (default: gdal_translate)
EOF
}

if [[ $# -lt 1 ]]; then
    usage
    exit 2
fi

NCFILE=$1
shift

VARNAME=${1:-${WW3_VAR:-hs}}
if [[ $# -gt 0 ]]; then
    shift
fi

SIGMA=${1:-${WW3_SIGMA:-1.5}}
if [[ $# -gt 0 ]]; then
    shift
fi

python3 - "$SIGMA" <<'PY'
import sys
try:
    sigma = float(sys.argv[1])
except ValueError:
    raise SystemExit(f"Invalid SIGMA value: {sys.argv[1]!r}")
if sigma < 0:
    raise SystemExit("SIGMA must be >= 0")
if sigma > 100:
    raise SystemExit(
        f"SIGMA={sigma!r} looks like a date, not a sigma value. DATE is derived from the filename."
    )
PY

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_BIN=${WW3_PYTHON:-python3}
GDAL_TRANSLATE=${WW3_GDAL_TRANSLATE:-gdal_translate}

GEOTIFF_DIR="$ROOT/geotiff"
COG_DIR="$ROOT/cog"
TILES_DIR="$ROOT/tiles/WW3"
COG_STYLE=${WW3_COG_STYLE:-light}

DATE=$(basename "$NCFILE" | grep -oE '[0-9]{8}T[0-9]{2}' | tr -d 'T' || true)
if [[ -z "$DATE" ]]; then
    DATE=$(basename "$NCFILE" | grep -oE '[0-9]{10}' || true)
fi
if [[ -z "$DATE" ]]; then
    echo "Could not extract DATE from filename: $NCFILE" >&2
    exit 1
fi

RGBA_TIF="$GEOTIFF_DIR/WW3_rgba3857/${DATE}/${VARNAME}/${DATE}_${VARNAME}_${COG_STYLE}_3857_rgba.tif"
COG_TIF="$COG_DIR/${DATE}_${VARNAME}_${COG_STYLE}_3857_cog.tif"

mkdir -p "$GEOTIFF_DIR" "$COG_DIR" "$TILES_DIR"

cat <<EOF
============================================
 WW3 -> TILES + COG Pipeline
  NCFILE    : $NCFILE
  VAR       : $VARNAME
  DATE      : $DATE
  SIGMA     : $SIGMA
  COG_STYLE : $COG_STYLE
  ROOT      : $ROOT
============================================
EOF

echo
echo "-> [1/2] Running ww3.py..."
"$PYTHON_BIN" "$SCRIPT_DIR/ww3.py" \
    "$NCFILE" \
    --var "$VARNAME" \
    --sigma "$SIGMA" \
    --geotiff-dir "$GEOTIFF_DIR" \
    --tiles-dir "$TILES_DIR" \
    "$@"

if [[ "${WW3_SKIP_COG:-0}" == "1" ]]; then
    echo
    echo "+ Skipping COG creation because WW3_SKIP_COG=1"
    exit 0
fi

echo
echo "-> [2/2] Building COG from ${COG_STYLE} RGBA..."

if [[ ! -f "$RGBA_TIF" ]]; then
    echo "RGBA TIF not found: $RGBA_TIF" >&2
    echo "Check that --styles includes '$COG_STYLE' or set WW3_COG_STYLE to a generated style." >&2
    exit 1
fi

"$GDAL_TRANSLATE" \
    "$RGBA_TIF" \
    "$COG_TIF" \
    -of COG \
    -co COMPRESS=DEFLATE \
    -co PREDICTOR=2 \
    -co BIGTIFF=IF_SAFER \
    -co RESAMPLING=BILINEAR \
    -co OVERVIEWS=IGNORE_EXISTING

echo
echo "+ Done."
echo "  Tiles root : $TILES_DIR"
echo "  RGBA TIF   : $RGBA_TIF"
echo "  COG        : $COG_TIF"
