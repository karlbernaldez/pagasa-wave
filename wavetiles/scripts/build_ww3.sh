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

pause_on_error() {
    local status=$?
    if [[ $status -ne 0 && -t 0 && "${WW3_NO_PAUSE:-0}" != "1" ]]; then
        echo
        echo "WW3 build failed with exit code $status."
        echo "Review the error above. Set WW3_NO_PAUSE=1 to disable this prompt."
        read -r -p "Press Enter to close this terminal..." _ || true
    fi
    exit "$status"
}
trap pause_on_error EXIT

usage() {
    cat >&2 <<'EOF'
Usage: build_ww3.sh <NCFILE> [VARNAME] [SIGMA] [-- extra ww3.py args]

Examples:
  ./build_ww3.sh ../input/ww3/2026062318/ww3_grdo.20260623T18.nc hs 1.5 --skip-existing
  ./build_ww3.sh ../input/ww3/2026062318/ww3_grdo.20260623T18.nc hs 1.5 --styles light,dark,night

Environment overrides:
  WW3_VAR             Variable to process when VARNAME is omitted (default: hs)
  WW3_SIGMA           Smoothing sigma when SIGMA is omitted (default: 1.5)
  WW3_STYLES          Comma-separated styles for ww3.py (default from ww3.py)
  WW3_COG_STYLE       Style used to build the COG (default: light)
  WW3_SKIP_COG        Set to 1 to skip COG creation
  WW3_PYTHON          Python executable override, for example: python or py
  WW3_GDAL_TRANSLATE  gdal_translate executable (default: gdal_translate)
  WW3_NO_PAUSE        Set to 1 to avoid pause-on-error in interactive terminals
EOF
}

add_gdal_path_if_needed() {
    if command -v gdaladdo >/dev/null 2>&1; then
        return 0
    fi

    local gdal_dir
    for gdal_dir in "/c/OSGeo4W/bin" "/c/OSGeo4W64/bin"; do
        if [[ -x "$gdal_dir/gdaladdo.exe" || -x "$gdal_dir/gdaladdo" ]]; then
            export PATH="$gdal_dir:$PATH"
            return 0
        fi
    done
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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WW3_SCRIPT="$SCRIPT_DIR/tiling/ww3.py"
GDAL_TRANSLATE=${WW3_GDAL_TRANSLATE:-gdal_translate}

PYTHON_BIN=${WW3_PYTHON:-}
PYTHON_ARGS=()
if [[ -z "$PYTHON_BIN" ]]; then
    if command -v python3 >/dev/null 2>&1 && python3 -c "import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)" >/dev/null 2>&1; then
        PYTHON_BIN=python3
    elif command -v python >/dev/null 2>&1 && python -c "import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)" >/dev/null 2>&1; then
        PYTHON_BIN=python
    elif command -v py >/dev/null 2>&1 && py -3 -c "import sys; sys.exit(0 if sys.version_info[0] == 3 else 1)" >/dev/null 2>&1; then
        PYTHON_BIN=py
        PYTHON_ARGS=(-3)
    else
        echo "Python 3 was not found. Install Python 3 or set WW3_PYTHON to a working executable." >&2
        exit 1
    fi
fi

# Add OSGeo4W only after Python selection so OSGeo4W's python.exe does not shadow the normal Python.
add_gdal_path_if_needed

if [[ ! -f "$WW3_SCRIPT" ]]; then
    echo "WW3 tiling script not found: $WW3_SCRIPT" >&2
    echo "Current directory: $(pwd)" >&2
    exit 1
fi

if [[ ! -f "$NCFILE" ]]; then
    echo "NetCDF file not found: $NCFILE" >&2
    echo "Current directory: $(pwd)" >&2
    parent_dir="$(dirname "$NCFILE")"
    if [[ -d "$parent_dir" ]]; then
        echo "Files in $parent_dir:" >&2
        ls -1 "$parent_dir" >&2 || true
    else
        echo "Parent directory does not exist: $parent_dir" >&2
    fi
    exit 1
fi

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    echo "Python executable not found: $PYTHON_BIN" >&2
    exit 1
fi

"$PYTHON_BIN" "${PYTHON_ARGS[@]}" - "$SIGMA" <<'PY'
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
  PYTHON    : $PYTHON_BIN ${PYTHON_ARGS[*]}
  ROOT      : $ROOT
============================================
EOF

echo
echo "-> [1/2] Running ww3.py..."
"$PYTHON_BIN" "${PYTHON_ARGS[@]}" "$WW3_SCRIPT" \
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
if ! command -v "$GDAL_TRANSLATE" >/dev/null 2>&1; then
    echo "gdal_translate executable not found: $GDAL_TRANSLATE" >&2
    exit 1
fi

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
