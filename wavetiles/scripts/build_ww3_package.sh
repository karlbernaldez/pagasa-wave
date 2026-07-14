#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  bash scripts/build_ww3_package.sh <YYYY-MM-DD|YYYYMMDD> [VARNAME] [SIGMA] [-- extra build_ww3.sh args]

Examples:
  bash scripts/build_ww3_package.sh 2026-06-24
  bash scripts/build_ww3_package.sh 2026-06-24 hs 1.5 --skip-existing
  bash scripts/build_ww3_package.sh 20260624 hs 1.5 --styles light,dark --skip-existing

Environment:
  WW3_PYTHON        Python executable to use. Defaults to wavetiles/.venv/bin/python.
  WW3_VAR           Default variable when VARNAME is omitted. Defaults to hs.
  WW3_SIGMA         Default smoothing sigma when SIGMA is omitted. Defaults to 1.5.
  WW3_NO_INPUT_CHECK Set to 1 to skip package input file checks.
EOF
}

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 2
fi

PACKAGE_DATE=$1
shift

VARNAME=${1:-${WW3_VAR:-hs}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then
  shift
fi

SIGMA=${1:-${WW3_SIGMA:-1.5}}
if [[ $# -gt 0 && "${1:-}" != --* ]]; then
  shift
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_SCRIPT="$SCRIPT_DIR/build_ww3.sh"
PYTHON_BIN="${WW3_PYTHON:-$ROOT/.venv/bin/python}"

if [[ ! -x "$PYTHON_BIN" && ! -f "$PYTHON_BIN" ]]; then
  echo "WW3 Python runtime not found: $PYTHON_BIN" >&2
  echo "Run deploy/almalinux/deploy.sh first, or create the venv manually:" >&2
  echo "  cd $ROOT && python3 -m venv --system-site-packages .venv" >&2
  exit 1
fi

if [[ ! -f "$BUILD_SCRIPT" ]]; then
  echo "WW3 build script not found: $BUILD_SCRIPT" >&2
  exit 1
fi

if ! command -v gdal_translate >/dev/null 2>&1; then
  echo "gdal_translate was not found in PATH. Install GDAL before building WW3 tiles." >&2
  exit 1
fi

"$PYTHON_BIN" - <<'PY'
missing = []
for module in ("numpy", "scipy", "xarray", "netCDF4", "rasterio", "osgeo_utils.gdal2tiles"):
    try:
        __import__(module)
    except Exception as exc:
        missing.append(f"{module}: {exc}")
if missing:
    raise SystemExit("Missing WW3 Python dependencies:\n  " + "\n  ".join(missing))
PY

if [[ "${WW3_NO_INPUT_CHECK:-0}" != "1" ]]; then
  mapfile -t EXPECTED_INPUTS < <("$PYTHON_BIN" - "$PACKAGE_DATE" "$ROOT" <<'PY'
import re
import sys
from datetime import date, timedelta
from pathlib import Path

raw = sys.argv[1]
root = Path(sys.argv[2])
match = re.match(r"^(\d{4})-?(\d{2})-?(\d{2})$", raw)
if not match:
    raise SystemExit(f"Invalid package date {raw!r}; expected YYYY-MM-DD or YYYYMMDD")
base = date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
source_cycle_date = base - timedelta(days=1)
source_cycle_tag = source_cycle_date.strftime("%Y%m%d") + "18"
runs = (
    ("analysis", source_cycle_date, "18"),
    ("24h", base, "18"),
    ("36h", base + timedelta(days=1), "06"),
    ("48h", base + timedelta(days=1), "18"),
)
for label, run_date, hour in runs:
    yyyymmdd = run_date.strftime("%Y%m%d")
    timestamp = f"{yyyymmdd}T{hour}"
    preferred = root / "input" / "ww3" / f"{yyyymmdd}{hour}" / f"ww3_grdo.{timestamp}.nc"
    fallback = root / "input" / "ww3" / source_cycle_tag / f"ww3_grdo.{timestamp}.nc"
    if preferred.exists() or fallback.exists():
        print(f"OK|{label}|{preferred}|{fallback}")
    else:
        print(f"MISSING|{label}|{preferred}|{fallback}")
PY
  )

  MISSING=0
  for line in "${EXPECTED_INPUTS[@]}"; do
    IFS='|' read -r status label preferred fallback <<<"$line"
    if [[ "$status" == "MISSING" ]]; then
      MISSING=1
      echo "Missing input for $label:" >&2
      echo "  preferred: $preferred" >&2
      echo "  fallback : $fallback" >&2
    fi
  done

  if [[ "$MISSING" -eq 1 ]]; then
    echo "One or more WW3 package inputs are missing. Add the NetCDF files, or set WW3_NO_INPUT_CHECK=1 to let build_ww3.sh search more broadly." >&2
    exit 1
  fi
fi

echo "Running WW3 forecast package build"
echo "  package date : $PACKAGE_DATE"
echo "  variable     : $VARNAME"
echo "  sigma        : $SIGMA"
echo "  python       : $PYTHON_BIN"
echo "  root         : $ROOT"

WW3_PYTHON="$PYTHON_BIN" WW3_NO_PAUSE=1 bash "$BUILD_SCRIPT" --package-date "$PACKAGE_DATE" "$VARNAME" "$SIGMA" "$@"

find "$ROOT/tiles" -type d -exec chmod 755 {} \; 2>/dev/null || true
find "$ROOT/tiles" -type f -exec chmod 644 {} \; 2>/dev/null || true

echo
if command -v find >/dev/null 2>&1; then
  echo "Generated sample tiles:"
  find "$ROOT/tiles/WW3" -type f -name '*.png' | head || true
fi
