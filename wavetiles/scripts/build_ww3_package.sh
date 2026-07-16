#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  bash scripts/build_ww3_package.sh <YYYY-MM-DD|YYYYMMDD> [VARNAME] [SIGMA] [direct tiler args]

Examples:
  bash scripts/build_ww3_package.sh 2026-07-14
  bash scripts/build_ww3_package.sh 2026-07-14 hs 1.5 --skip-existing
  bash scripts/build_ww3_package.sh 20260714 hs 1.5 --styles light,dark --skip-existing

Environment:
  WW3_PYTHON         Python executable. Defaults to wavetiles/.venv/bin/python.
  WW3_VAR            Default variable. Defaults to hs.
  WW3_SIGMA          Default smoothing sigma. Defaults to 1.5.
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
EXTRA_ARGS=("$@")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_BIN="${WW3_PYTHON:-$ROOT/.venv/bin/python}"
TILER="$SCRIPT_DIR/tiling/ww3_direct.py"

[[ -x "$PYTHON_BIN" || -f "$PYTHON_BIN" ]] || { echo "WW3 Python runtime not found: $PYTHON_BIN" >&2; exit 1; }
[[ -f "$TILER" ]] || { echo "Direct WW3 tiler not found: $TILER" >&2; exit 1; }

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

mapfile -t PACKAGE_RUNS < <("$PYTHON_BIN" - "$PACKAGE_DATE" "$ROOT" <<'PY'
import re, sys
from datetime import date, timedelta
from pathlib import Path
raw, root_raw = sys.argv[1:]
match = re.fullmatch(r"(\d{4})-?(\d{2})-?(\d{2})", raw)
if not match:
    raise SystemExit(f"Invalid package date {raw!r}; expected YYYY-MM-DD or YYYYMMDD")
base = date(*map(int, match.groups()))
root = Path(root_raw)
package_tag = f"{base.year}{('JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC')[base.month-1]}{base.day:02d}"
runs = (
    ("analysis", base - timedelta(days=1), "18"),
    ("24h", base, "18"),
    ("36h", base + timedelta(days=1), "06"),
    ("48h", base + timedelta(days=1), "18"),
)
for label, run_date, hour in runs:
    ymd = run_date.strftime("%Y%m%d")
    run_tag = ymd + hour
    timestamp = ymd + "T" + hour
    preferred = root / "input" / "ww3" / run_tag / f"ww3_grdo.{timestamp}.nc"
    matches = [preferred]
    if not preferred.exists():
        matches.extend(sorted((root / "input" / "ww3").glob(f"*/ww3_grdo.{timestamp}.nc")))
    found = next((p for p in matches if p.exists()), None)
    print(f"{label}|{run_tag}|{timestamp}|{package_tag}|{found or preferred}|{'OK' if found else 'MISSING'}")
PY
)

MISSING=0
for line in "${PACKAGE_RUNS[@]}"; do
  IFS='|' read -r label run_tag timestamp package_tag ncfile status <<<"$line"
  if [[ "$status" == "MISSING" ]]; then
    MISSING=1
    echo "Missing input for $label: $ncfile" >&2
  fi
done
if [[ "$MISSING" -eq 1 && "${WW3_NO_INPUT_CHECK:-0}" != "1" ]]; then
  exit 1
fi

echo "Running GDAL-free WW3 forecast package build"
echo "  package date : $PACKAGE_DATE"
echo "  variable     : $VARNAME"
echo "  sigma        : $SIGMA"
echo "  python       : $PYTHON_BIN"
echo "  root         : $ROOT"

for line in "${PACKAGE_RUNS[@]}"; do
  IFS='|' read -r label run_tag timestamp package_tag ncfile status <<<"$line"
  [[ "$status" == "OK" ]] || continue
  echo
  echo "-> [$label] $run_tag"
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
echo "+ WW3 forecast package complete: $PACKAGE_DATE"
find "$ROOT/tiles/WW3" -type f -name '*.png' | head || true
