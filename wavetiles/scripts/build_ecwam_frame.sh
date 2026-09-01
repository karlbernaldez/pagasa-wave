#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  bash scripts/build_ecwam_frame.sh <PACKAGE_DATE> <FORECAST_HOUR> [VARNAME] [SIGMA] [--source-cycle YYYYMMDDHH] [tiler args]

Examples:
  bash scripts/build_ecwam_frame.sh 2026-09-02 7
  bash scripts/build_ecwam_frame.sh 2026-09-01 30 swh 1.5 --source-cycle 2026083118 --skip-existing

Notes:
  - FORECAST_HOUR must be between 0 and 48 inclusive.
  - Required package frames remain 0h, 24h, 36h, and 48h.
  - Intermediate frames are generated only when requested and are cached in the normal package tree.
  - Package metadata is used to pin the same source cycle as the required package frames.
  - For older packages without metadata, pass --source-cycle explicitly to avoid mixing model cycles.
EOF
}

if [[ $# -lt 2 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 2
fi

PACKAGE_DATE=$1
FORECAST_HOUR=$2
shift 2

[[ "$FORECAST_HOUR" =~ ^[0-9]+$ ]] || { echo "FORECAST_HOUR must be an integer between 0 and 48" >&2; exit 2; }
(( FORECAST_HOUR >= 0 && FORECAST_HOUR <= 48 )) || { echo "FORECAST_HOUR must be between 0 and 48" >&2; exit 2; }

VARNAME=${1:-${ECWAM_VAR:-swh}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then shift; fi
SIGMA=${1:-${ECWAM_SIGMA:-1.5}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then shift; fi

SOURCE_CYCLE=${ECWAM_SOURCE_CYCLE:-}
EXTRA_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-cycle)
      [[ $# -ge 2 ]] || { echo "--source-cycle requires YYYYMMDDHH" >&2; exit 2; }
      SOURCE_CYCLE=$2
      shift 2
      ;;
    --source-cycle=*)
      SOURCE_CYCLE=${1#*=}
      shift
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_BIN="${ECWAM_PYTHON:-$ROOT/.venv/bin/python}"
INPUT_ROOT="${ECWAM_INPUT_ROOT:-/home/darwin/ecmwf/ecwam}"
OUTPUT_ROOT="${ECWAM_OUTPUT_ROOT:-$ROOT/tiles/ECWAM}"
GRID_POINTS="${ECWAM_GRID_POINTS:-271051}"
TILER="$SCRIPT_DIR/tiling/ecwam_direct.py"
CONTOUR_GENERATOR="$SCRIPT_DIR/tiling/ecwam_contours.py"
SELECTOR="$SCRIPT_DIR/ecwam_package_selection.py"

[[ -x "$PYTHON_BIN" || -f "$PYTHON_BIN" ]] || { echo "ECWAM Python runtime not found: $PYTHON_BIN" >&2; exit 1; }
[[ -f "$TILER" ]] || { echo "ECWAM tiler not found: $TILER" >&2; exit 1; }
[[ -f "$CONTOUR_GENERATOR" ]] || { echo "ECWAM contour generator not found: $CONTOUR_GENERATOR" >&2; exit 1; }
[[ -f "$SELECTOR" ]] || { echo "ECWAM package selector not found: $SELECTOR" >&2; exit 1; }
[[ -n "$OUTPUT_ROOT" && "$OUTPUT_ROOT" != "/" ]] || { echo "Unsafe ECWAM output root: $OUTPUT_ROOT" >&2; exit 2; }
[[ -z "$SOURCE_CYCLE" || "$SOURCE_CYCLE" =~ ^[0-9]{10}$ ]] || { echo "Invalid ECWAM source cycle: $SOURCE_CYCLE" >&2; exit 2; }

PACKAGE_TAG="$($PYTHON_BIN - "$PACKAGE_DATE" <<'PY'
import sys
from datetime import datetime
months = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
raw = sys.argv[1].replace("-", "")
d = datetime.strptime(raw, "%Y%m%d")
print(f"{d.year}{months[d.month - 1]}{d.day:02d}")
PY
)"

metadata_target="$OUTPUT_ROOT/contours/$PACKAGE_TAG/package.json"
if [[ -z "$SOURCE_CYCLE" && -s "$metadata_target" ]]; then
  SOURCE_CYCLE="$($PYTHON_BIN - "$metadata_target" <<'PY'
import json
import sys
from pathlib import Path
value = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")).get("sourceCycle", "")
if value:
    print(value)
PY
)"
fi

if [[ -z "$SOURCE_CYCLE" ]]; then
  echo "ECWAM package metadata is missing for $PACKAGE_DATE; pass --source-cycle explicitly to avoid mixing model cycles" >&2
  exit 1
fi

if ! FRAME="$($PYTHON_BIN "$SELECTOR" frame "$INPUT_ROOT" "$PACKAGE_DATE" --forecast-hour "$FORECAST_HOUR" --source-cycle "$SOURCE_CYCLE")"; then
  echo "ECWAM source cycle $SOURCE_CYCLE does not contain forecast hour ${FORECAST_HOUR}h for package $PACKAGE_DATE" >&2
  exit 1
fi

IFS='|' read -r label run_tag package_tag gribfile resolved_source_cycle <<<"$FRAME"
[[ "$package_tag" == "$PACKAGE_TAG" ]] || { echo "Resolved ECWAM frame has unexpected package tag" >&2; exit 1; }
[[ "$resolved_source_cycle" == "$SOURCE_CYCLE" ]] || { echo "Resolved ECWAM frame has unexpected source cycle" >&2; exit 1; }
[[ -f "$gribfile" && -r "$gribfile" ]] || { echo "ECWAM frame input is missing or unreadable: $gribfile" >&2; exit 1; }

contour_target="$OUTPUT_ROOT/contours/$PACKAGE_TAG/$run_tag/contours.geojson"
light_target="$OUTPUT_ROOT/light/$PACKAGE_TAG/$run_tag"
dark_target="$OUTPUT_ROOT/dark/$PACKAGE_TAG/$run_tag"

has_pngs() {
  local target=$1
  [[ -d "$target" ]] && find "$target" -type f -name '*.png' -print -quit | grep -q .
}

frame_complete() {
  [[ -s "$contour_target" ]] && has_pngs "$light_target" && has_pngs "$dark_target"
}

if frame_complete; then
  echo "ECWAM ${FORECAST_HOUR}h frame already cached for $PACKAGE_DATE at $run_tag"
  exit 0
fi

lock_root="$OUTPUT_ROOT/.locks"
mkdir -p "$lock_root"
lock_file="$lock_root/${PACKAGE_TAG}-${run_tag}.lock"
exec 9>"$lock_file"
if ! flock -n 9; then
  echo "ECWAM ${FORECAST_HOUR}h frame build is already running for $PACKAGE_DATE at $run_tag"
  exit 0
fi

if frame_complete; then
  echo "ECWAM ${FORECAST_HOUR}h frame already cached for $PACKAGE_DATE at $run_tag"
  exit 0
fi

echo "Building on-demand ECWAM frame"
echo "  package date  : $PACKAGE_DATE"
echo "  forecast hour : ${FORECAST_HOUR}h"
echo "  valid time    : $run_tag"
echo "  source cycle  : $resolved_source_cycle"
echo "  input         : $gribfile"

"$PYTHON_BIN" "$TILER" "$gribfile" \
  --date-tag "$run_tag" \
  --var "$VARNAME" \
  --grid-points "$GRID_POINTS" \
  --sigma "$SIGMA" \
  --tiles-dir "$OUTPUT_ROOT" \
  --skip-existing \
  "${EXTRA_ARGS[@]}"

"$PYTHON_BIN" "$CONTOUR_GENERATOR" "$gribfile" \
  --var "$VARNAME" \
  --grid-points "$GRID_POINTS" \
  --sigma "$SIGMA" \
  --output "$contour_target"
[[ -s "$contour_target" ]] || { echo "ECWAM contour output is missing or empty: $contour_target" >&2; exit 1; }
chmod 644 "$contour_target" 2>/dev/null || true
chmod 755 "$(dirname "$contour_target")" 2>/dev/null || true

for style in light dark; do
  source_dir="$OUTPUT_ROOT/$style/$run_tag"
  target_dir="$OUTPUT_ROOT/$style/$PACKAGE_TAG/$run_tag"
  if [[ -d "$source_dir" ]]; then
    mkdir -p "$(dirname "$target_dir")"
    rm -rf "$target_dir"
    mv "$source_dir" "$target_dir"
    find "$target_dir" -type d -exec chmod 755 {} + 2>/dev/null || true
    find "$target_dir" -type f -exec chmod 644 {} + 2>/dev/null || true
  fi
done

frame_complete || { echo "ECWAM on-demand frame outputs are incomplete for $run_tag" >&2; exit 1; }
echo "+ ECWAM ${FORECAST_HOUR}h frame cached for $PACKAGE_DATE at $run_tag"
