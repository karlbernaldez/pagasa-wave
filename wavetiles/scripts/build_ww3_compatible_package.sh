#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <YYYY-MM-DD|YYYYMMDD> [VARNAME] [SIGMA] [builder args]" >&2
  exit 2
fi

PACKAGE_DATE=$1
shift
VARNAME=${1:-${WW3_VAR:-hs}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then shift; fi
SIGMA=${1:-${WW3_SIGMA:-1.5}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then shift; fi
EXTRA_ARGS=("$@")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_BIN="${WW3_PYTHON:-$ROOT/.venv/bin/python}"
INPUT_ROOT="${WW3_INPUT_ROOT:-$ROOT/input/ww3}"
NORMALIZED_ROOT="${WAVE_NORMALIZED_ROOT:-$ROOT/normalized}"
OUTPUT_ROOT="${WW3_OUTPUT_ROOT:-$ROOT/tiles/WW3}"
PRODUCT_INPUT="${WW3_PRODUCT_INPUT:-raw}"
WORKERS="${WW3_BUILD_WORKERS:-4}"
SOURCE_CYCLE="${WW3_SOURCE_CYCLE:-}"
SELECTOR="$SCRIPT_DIR/ww3_package_selection.py"
NORMALIZER="$SCRIPT_DIR/normalize_ww3_cycle.py"
NORMALIZED_BUILDER="$SCRIPT_DIR/build_normalized_ww3_shadow.py"
RAW_BUILDER="$SCRIPT_DIR/build_ww3_package.sh"
PUBLISHER="$SCRIPT_DIR/publish_wave_package.py"

case "$PRODUCT_INPUT" in
  raw|normalized) ;;
  *) echo "WW3_PRODUCT_INPUT must be raw or normalized, got: $PRODUCT_INPUT" >&2; exit 2 ;;
esac

if [[ "$PRODUCT_INPUT" == "raw" ]]; then
  exec env WW3_PYTHON="$PYTHON_BIN" WW3_INPUT_ROOT="$INPUT_ROOT" \
    bash "$RAW_BUILDER" "$PACKAGE_DATE" "$VARNAME" "$SIGMA" "${EXTRA_ARGS[@]}"
fi

[[ "$VARNAME" == "hs" ]] || {
  echo "Normalized WW3 product mode currently supports only hs, got: $VARNAME" >&2
  exit 2
}
[[ -x "$PYTHON_BIN" || -f "$PYTHON_BIN" ]] || { echo "WW3 Python runtime not found: $PYTHON_BIN" >&2; exit 1; }
[[ -f "$NORMALIZER" && -f "$NORMALIZED_BUILDER" && -f "$SELECTOR" && -f "$PUBLISHER" ]] || {
  echo "Normalized WW3 pipeline scripts are missing" >&2
  exit 1
}

if [[ -z "$SOURCE_CYCLE" ]]; then
  SOURCE_CYCLE="$($PYTHON_BIN "$SELECTOR" select "$INPUT_ROOT" "$PACKAGE_DATE")" || {
    echo "No complete required WW3 18Z source cycle for package $PACKAGE_DATE" >&2
    exit 1
  }
fi

CYCLE_DIR="$NORMALIZED_ROOT/WW3/$SOURCE_CYCLE"
if [[ ! -s "$CYCLE_DIR/wave.nc" || ! -s "$CYCLE_DIR/manifest.json" ]]; then
  "$PYTHON_BIN" "$NORMALIZER" "$INPUT_ROOT" "$SOURCE_CYCLE" --normalized-root "$NORMALIZED_ROOT"
fi

PACKAGE_TAG="$($PYTHON_BIN - "$PACKAGE_DATE" <<'PY'
import sys
from datetime import datetime
raw=sys.argv[1]
for pattern in ("%Y-%m-%d", "%Y%m%d"):
    try:
        value=datetime.strptime(raw, pattern).date(); break
    except ValueError:
        pass
else:
    raise SystemExit("invalid package date")
months=("JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC")
print(f"{value.year}{months[value.month-1]}{value.day:02d}")
PY
)"

STAGE_ROOT="$ROOT/.normalized-product-stage/WW3-${PACKAGE_TAG}-$$"
trap 'rm -rf -- "$STAGE_ROOT"' EXIT
rm -rf -- "$STAGE_ROOT"

"$PYTHON_BIN" "$NORMALIZED_BUILDER" \
  "$CYCLE_DIR" \
  "$PACKAGE_DATE" \
  --output-root "$STAGE_ROOT" \
  --sigma "$SIGMA" \
  --workers "$WORKERS" \
  "${EXTRA_ARGS[@]}"

"$PYTHON_BIN" "$PUBLISHER" "$STAGE_ROOT" "$OUTPUT_ROOT" "$PACKAGE_TAG"
