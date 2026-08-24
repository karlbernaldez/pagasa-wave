#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  bash scripts/build_ecwam_package.sh <YYYY-MM-DD|YYYYMMDD> [VARNAME] [SIGMA] [--source-cycle YYYYMMDDHH] [tiler args]

Examples:
  bash scripts/build_ecwam_package.sh 2026-08-24
  bash scripts/build_ecwam_package.sh 2026-08-24 swh 1.5 --source-cycle 2026082400 --skip-existing
  ECWAM_OUTPUT_ROOT=/tmp/ecwam-package bash scripts/build_ecwam_package.sh 2026-08-24 swh 1.5 --source-cycle 2026082400

Environment:
  ECWAM_PYTHON         Python executable. Defaults to wavetiles/.venv/bin/python.
  ECWAM_VAR            Default variable. Defaults to swh.
  ECWAM_SIGMA          Default smoothing sigma. Defaults to 1.5.
  ECWAM_GRID_POINTS    High-resolution grid point count. Defaults to 271051.
  ECWAM_INPUT_ROOT     Cycle-folder root. Defaults to /home/darwin/ecmwf/ecwam.
  ECWAM_OUTPUT_ROOT    Output root. Defaults to wavetiles/tiles/ECWAM.
  ECWAM_SOURCE_CYCLE   Optional exact source cycle folder (YYYYMMDDHH).
EOF
}

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 2
fi

PACKAGE_DATE=$1
shift
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
[[ -z "$SOURCE_CYCLE" || "$SOURCE_CYCLE" =~ ^[0-9]{10}$ ]] || { echo "Invalid ECWAM source cycle: $SOURCE_CYCLE" >&2; exit 2; }
[[ "$GRID_POINTS" =~ ^[0-9]+$ ]] || { echo "Invalid ECWAM grid point count: $GRID_POINTS" >&2; exit 2; }
[[ -n "$OUTPUT_ROOT" && "$OUTPUT_ROOT" != "/" ]] || { echo "Unsafe ECWAM output root: $OUTPUT_ROOT" >&2; exit 2; }

"$PYTHON_BIN" - <<'PY'
missing = []
for module in ("numpy", "scipy", "xarray", "PIL", "contourpy", "cfgrib", "eccodes"):
    try:
        __import__(module)
    except Exception as exc:
        missing.append(f"{module}: {exc}")
if missing:
    raise SystemExit("Missing ECWAM dependencies:\n  " + "\n  ".join(missing))
PY

if [[ -z "$SOURCE_CYCLE" ]]; then
  if ! SOURCE_CYCLE="$($PYTHON_BIN "$SELECTOR" select "$INPUT_ROOT" "$PACKAGE_DATE")"; then
    echo "No single ECWAM source cycle contains all exact required valid times for package $PACKAGE_DATE" >&2
    exit 1
  fi
fi

if ! MANIFEST="$($PYTHON_BIN "$SELECTOR" manifest "$INPUT_ROOT" "$PACKAGE_DATE" --source-cycle "$SOURCE_CYCLE")"; then
  echo "ECWAM source cycle $SOURCE_CYCLE is incomplete for package $PACKAGE_DATE" >&2
  exit 1
fi
mapfile -t PACKAGE_RUNS <<<"$MANIFEST"
[[ ${#PACKAGE_RUNS[@]} -eq 4 ]] || { echo "Expected four ECWAM package inputs, got ${#PACKAGE_RUNS[@]}" >&2; exit 1; }

IFS='|' read -r _ _ PACKAGE_TAG _ RESOLVED_SOURCE_CYCLE <<<"${PACKAGE_RUNS[0]}"
[[ -n "$RESOLVED_SOURCE_CYCLE" ]] || { echo "ECWAM source cycle was not resolved" >&2; exit 1; }
[[ -n "$PACKAGE_TAG" ]] || { echo "ECWAM package tag was not resolved" >&2; exit 1; }

echo "Running isolated ECWAM forecast package build"
echo "  package date : $PACKAGE_DATE"
echo "  source cycle : $RESOLVED_SOURCE_CYCLE"
echo "  input root   : $INPUT_ROOT"
echo "  output root  : $OUTPUT_ROOT"
echo "  variable     : $VARNAME"
echo "  grid points  : $GRID_POINTS"
echo "  sigma        : $SIGMA"
echo "  python       : $PYTHON_BIN"
echo "  root         : $ROOT"

mkdir -p "$OUTPUT_ROOT"

for line in "${PACKAGE_RUNS[@]}"; do
  IFS='|' read -r label run_tag package_tag gribfile source_cycle <<<"$line"
  [[ "$source_cycle" == "$RESOLVED_SOURCE_CYCLE" ]] || { echo "ECWAM manifest mixed source cycles" >&2; exit 1; }
  [[ "$package_tag" == "$PACKAGE_TAG" ]] || { echo "ECWAM manifest mixed package tags" >&2; exit 1; }
  [[ -f "$gribfile" ]] || { echo "Missing ECWAM input for $label: $gribfile" >&2; exit 1; }
  [[ -r "$gribfile" ]] || { echo "ECWAM input is not readable by $(id -un): $gribfile" >&2; exit 1; }

  echo
  echo "-> [$label] $run_tag"
  echo "   Source cycle: $source_cycle"
  echo "   Input: $gribfile"

  "$PYTHON_BIN" "$TILER" "$gribfile" \
    --date-tag "$run_tag" \
    --var "$VARNAME" \
    --grid-points "$GRID_POINTS" \
    --sigma "$SIGMA" \
    --tiles-dir "$OUTPUT_ROOT" \
    "${EXTRA_ARGS[@]}"

  contour_target="$OUTPUT_ROOT/contours/$package_tag/$run_tag/contours.geojson"
  "$PYTHON_BIN" "$CONTOUR_GENERATOR" "$gribfile" \
    --var "$VARNAME" \
    --grid-points "$GRID_POINTS" \
    --sigma "$SIGMA" \
    --output "$contour_target"
  [[ -s "$contour_target" ]] || { echo "ECWAM contour output is missing or empty: $contour_target" >&2; exit 1; }
  chmod 644 "$contour_target" 2>/dev/null || true
  chmod 755 "$(dirname "$contour_target")" 2>/dev/null || true
  echo "   Package contours: $contour_target"

  shopt -s nullglob
  for source_dir in "$OUTPUT_ROOT"/*/"$run_tag"; do
    style_dir=$(dirname "$source_dir")
    [[ "$(basename "$style_dir")" == "contours" ]] && continue
    target_dir="$style_dir/$package_tag/$run_tag"
    mkdir -p "$(dirname "$target_dir")"
    rm -rf "$target_dir"
    mv "$source_dir" "$target_dir"
    find "$target_dir" -type d -exec chmod 755 {} + 2>/dev/null || true
    find "$target_dir" -type f -exec chmod 644 {} + 2>/dev/null || true
    echo "   Package tiles: $target_dir"
  done
  shopt -u nullglob
done

contour_count=$(find "$OUTPUT_ROOT/contours/$PACKAGE_TAG" -mindepth 2 -maxdepth 2 -type f -name 'contours.geojson' -size +0c | wc -l)
[[ "$contour_count" -eq 4 ]] || { echo "Expected four non-empty ECWAM contour files for $PACKAGE_TAG, got $contour_count" >&2; exit 1; }

echo
echo "+ ECWAM forecast package complete: $PACKAGE_DATE (source cycle $RESOLVED_SOURCE_CYCLE)"
echo "  Contour files: $contour_count"
find "$OUTPUT_ROOT" -type f \( -name '*.png' -o -name 'contours.geojson' \) | head || true
