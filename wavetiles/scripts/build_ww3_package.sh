#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  bash scripts/build_ww3_package.sh <YYYY-MM-DD|YYYYMMDD> [VARNAME] [SIGMA] [--source-cycle YYYYMMDDHH] [direct tiler args]

Examples:
  bash scripts/build_ww3_package.sh 2026-07-14
  bash scripts/build_ww3_package.sh 2026-07-14 hs 1.5 --source-cycle 2026071318 --skip-existing
  bash scripts/build_ww3_package.sh 20260714 hs 1.5 --styles light,dark --skip-existing

Environment:
  WW3_PYTHON         Python executable. Defaults to wavetiles/.venv/bin/python.
  WW3_VAR            Default variable. Defaults to hs.
  WW3_SIGMA          Default smoothing sigma. Defaults to 1.5.
  WW3_INPUT_ROOT     Cycle-folder root. Defaults to wavetiles/input/ww3.
  WW3_SOURCE_CYCLE   Optional exact source cycle folder (YYYYMMDDHH).
  WW3_NO_INPUT_CHECK Set to 1 to skip the package input preflight.
EOF
}

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 2
fi

PACKAGE_DATE=$1
shift
VARNAME=${1:-${WW3_VAR:-hs}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then shift; fi
SIGMA=${1:-${WW3_SIGMA:-1.5}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then shift; fi

SOURCE_CYCLE=${WW3_SOURCE_CYCLE:-}
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
PYTHON_BIN="${WW3_PYTHON:-$ROOT/.venv/bin/python}"
INPUT_ROOT="${WW3_INPUT_ROOT:-$ROOT/input/ww3}"
TILER="$SCRIPT_DIR/tiling/ww3_direct.py"
SELECTOR="$SCRIPT_DIR/ww3_package_selection.py"

[[ -x "$PYTHON_BIN" || -f "$PYTHON_BIN" ]] || { echo "WW3 Python runtime not found: $PYTHON_BIN" >&2; exit 1; }
[[ -f "$TILER" ]] || { echo "Direct WW3 tiler not found: $TILER" >&2; exit 1; }
[[ -f "$SELECTOR" ]] || { echo "WW3 package selector not found: $SELECTOR" >&2; exit 1; }
[[ -z "$SOURCE_CYCLE" || "$SOURCE_CYCLE" =~ ^[0-9]{10}$ ]] || { echo "Invalid source cycle: $SOURCE_CYCLE" >&2; exit 2; }

"$PYTHON_BIN" - <<'PY'
missing = []
for module in ("numpy", "scipy", "xarray", "netCDF4", "PIL"):
    try:
        __import__(module)
    except Exception as exc:
        missing.append(f"{module}: {exc}")
if missing:
    raise SystemExit("Missing direct WW3 tiler dependencies:\n  " + "\n  ".join(missing))
PY

MANIFEST_ARGS=(manifest "$INPUT_ROOT" "$PACKAGE_DATE")
[[ -z "$SOURCE_CYCLE" ]] || MANIFEST_ARGS+=(--source-cycle "$SOURCE_CYCLE")
if ! mapfile -t PACKAGE_RUNS < <("$PYTHON_BIN" "$SELECTOR" "${MANIFEST_ARGS[@]}"); then
  if [[ "${WW3_NO_INPUT_CHECK:-0}" == "1" ]]; then
    echo "No complete source cycle found; WW3_NO_INPUT_CHECK does not permit cross-cycle input mixing" >&2
  else
    echo "No single source cycle contains all exact required valid-time files for package $PACKAGE_DATE" >&2
  fi
  exit 1
fi
[[ ${#PACKAGE_RUNS[@]} -eq 4 ]] || { echo "Expected four WW3 package inputs, got ${#PACKAGE_RUNS[@]}" >&2; exit 1; }

IFS='|' read -r _ _ _ _ _ RESOLVED_SOURCE_CYCLE <<<"${PACKAGE_RUNS[0]}"
[[ -n "$RESOLVED_SOURCE_CYCLE" ]] || { echo "Source cycle was not resolved" >&2; exit 1; }

echo "Running GDAL-free WW3 forecast package build"
echo "  package date : $PACKAGE_DATE"
echo "  source cycle : $RESOLVED_SOURCE_CYCLE"
echo "  variable     : $VARNAME"
echo "  sigma        : $SIGMA"
echo "  python       : $PYTHON_BIN"
echo "  root         : $ROOT"

for line in "${PACKAGE_RUNS[@]}"; do
  IFS='|' read -r label run_tag timestamp package_tag ncfile source_cycle <<<"$line"
  [[ "$source_cycle" == "$RESOLVED_SOURCE_CYCLE" ]] || { echo "Manifest mixed source cycles" >&2; exit 1; }
  [[ -f "$ncfile" ]] || { echo "Missing exact input for $label: $ncfile" >&2; exit 1; }
  echo
  echo "-> [$label] $run_tag"
  echo "   Source cycle: $source_cycle"
  echo "   Input: $ncfile"
  "$PYTHON_BIN" "$TILER" "$ncfile" \
    --var "$VARNAME" \
    --sigma "$SIGMA" \
    --tiles-dir "$ROOT/tiles/WW3" \
    "${EXTRA_ARGS[@]}"

  date_tag=${timestamp/T/}
  shopt -s nullglob
  for source_dir in "$ROOT/tiles/WW3"/*/"$date_tag"; do
    style_dir=$(dirname "$source_dir")
    target_dir="$style_dir/$package_tag/$date_tag"
    mkdir -p "$(dirname "$target_dir")"
    rm -rf "$target_dir"
    mv "$source_dir" "$target_dir"
    echo "   Package tiles: $target_dir"
  done
  shopt -u nullglob
done

find "$ROOT/tiles" -type d -exec chmod 755 {} \; 2>/dev/null || true
find "$ROOT/tiles" -type f -exec chmod 644 {} \; 2>/dev/null || true

echo
echo "+ WW3 forecast package complete: $PACKAGE_DATE (source cycle $RESOLVED_SOURCE_CYCLE)"
find "$ROOT/tiles/WW3" -type f -name '*.png' | head || true
