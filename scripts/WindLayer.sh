#!/usr/bin/env bash
set -euo pipefail

##############################################
## LOAD ENV VARIABLES
##############################################

if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo "❌ .env file not found!"
  exit 1
fi

##############################################
## CONFIGURATION
##############################################

CYCLES=("18" "12" "06" "00")  # newest → oldest

GRIB_DIR="$BASE/AIFS-SINGLE"
TIFF_DIR="$BASE/TIFF"
COLOR_DIR="$BASE/COLORIZED"
GEOJSON_DIR="$BASE/GEOJSON"

# Load Python venv
source "$(dirname "$0")venv/bin/activate"

# Export Mapbox token globally
export MAPBOX_ACCESS_TOKEN="$MAPBOX_TOKEN"

##############################################
## DEPENDENCY CHECKS
##############################################

for bin in aws jq wget curl python3; do
  command -v "$bin" >/dev/null || {
    echo "❌ Required binary missing: $bin"
    exit 1
  }
done

##############################################
## LOG HELPERS
##############################################

log()  { printf "\n[%s] %s\n" "$(date -u +"%H:%M:%S")" "$1"; }
info() { log "ℹ️  $1"; }
warn() { log "⚠️  $1"; }
err()  { log "❌ $1"; }

##############################################
## DIRECTORY INIT
##############################################

ensure_dirs() {
  mkdir -p "$GRIB_DIR" "$TIFF_DIR" "$COLOR_DIR" "$GEOJSON_DIR"
}

ensure_dirs

##############################################
## CLEANUP HELPER
##############################################

cleanup_latest() {
  local dir="$1"
  local pattern="$2"

  find "$dir" -type f -name "$pattern" -printf '%T@ %p\n' 2>/dev/null \
    | sort -nr \
    | tail -n +5 \
    | cut -d' ' -f2- \
    | xargs -r rm
}

##############################################
## DOWNLOAD GRIB CYCLE
##############################################

download_cycle() {
  local date="$1"
  local cycle="$2"
  local file="${date}${cycle}0000-0h-oper-fc.grib2"
  local url="https://data.ecmwf.int/forecasts/${date}/${cycle}z/aifs-single/0p25/oper/${file}"

  [[ -s "$GRIB_DIR/$file" ]] && {
    info "Already exists → $file"
    return 0
  }

  info "Downloading GRIB → $file"
  wget -q -T 20 -c "$url" -O "$GRIB_DIR/$file" || {
    err "Failed download: $file"
    rm -f "$GRIB_DIR/$file"
    return 1
  }

  info "Downloaded → $file"
}

##############################################
## RETRY HELPER
##############################################

retry() {
  local cmd="$1"
  local attempts=3
  local delay=180

  for ((i=1; i<=attempts; i++)); do
    info "Attempt $i/$attempts → $cmd"
    if eval "$cmd"; then
      info "Success"
      return 0
    fi
    warn "Failed attempt $i"
    sleep "$delay"
    delay=$((delay * 2))
  done

  err "All attempts failed → $cmd"
  return 1
}

##############################################
## STEP 1: WIND PARTICLE DATA
##############################################

log "📥 Running download.py for wind vector data"
python3 ECMWF/utils/download.py
log "✅ Finished download.py"

##############################################
## STEP 2: AIFS CYCLES
##############################################

log "🧹 Cleaning GRIB_DIR before downloading..."
rm -f "$GRIB_DIR"/*.grib2 2>/dev/null || true

TODAY=$(date -u +"%Y%m%d")
YEST=$(date -u -d "yesterday" +"%Y%m%d")

LATEST_DATE=""
LATEST_CYCLE=""

for hh in "${CYCLES[@]}"; do
  if download_cycle "$TODAY" "$hh"; then
    LATEST_DATE="$TODAY"
    LATEST_CYCLE="$hh"
    break
  fi
done

if [[ -z "$LATEST_CYCLE" ]]; then
  warn "No cycle found today, fallback: $YEST 18Z"
  LATEST_DATE="$YEST"
  LATEST_CYCLE="18"
  download_cycle "$LATEST_DATE" "$LATEST_CYCLE" || true
fi

ANCHOR_TS=$(date -u -d "${LATEST_DATE} ${LATEST_CYCLE}:00:00" +%s)

for offset in 6 12 18; do
  ts=$((ANCHOR_TS - offset * 3600))
  download_cycle \
    "$(date -u -d "@$ts" +"%Y%m%d")" \
    "$(date -u -d "@$ts" +"%H")" || true
done

cleanup_latest "$GRIB_DIR" "*.grib2"

##############################################
## STEP 3: GRIB → TIFF
##############################################

log "🔧 Converting to TIFF"
python3 ECMWF/utils/computev2.py
cleanup_latest "$TIFF_DIR" "*.tif"

##############################################
## STEP 4: COLORIZE
##############################################

log "🎨 Applying SolarStorm colormap"
python3 ECMWF/utils/colorizev2.py
cleanup_latest "$COLOR_DIR" "*_solarstorm.tif"

##############################################
## MAPBOX UPLOAD HELPER
##############################################

upload_to_mapbox() {
  local tif="$1"
  local tileset="$2"
  local name="$3"

  local CRED
  CRED=$(curl -s -X POST \
    "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME/credentials?access_token=$MAPBOX_TOKEN")

  local BUCKET KEY
  BUCKET=$(echo "$CRED" | jq -r '.bucket')
  KEY=$(echo "$CRED" | jq -r '.key')

  export AWS_ACCESS_KEY_ID=$(echo "$CRED" | jq -r '.accessKeyId')
  export AWS_SECRET_ACCESS_KEY=$(echo "$CRED" | jq -r '.secretAccessKey')
  export AWS_SESSION_TOKEN=$(echo "$CRED" | jq -r '.sessionToken')

  retry "aws s3 cp \"$tif\" \"s3://$BUCKET/$KEY\" --region us-east-1 --endpoint-url https://s3.amazonaws.com"

  local URL="https://$BUCKET.s3.amazonaws.com/$KEY"

  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"$URL\",
      \"tileset\": \"$tileset\",
      \"name\": \"$name\"
    }" \
    "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME?access_token=$MAPBOX_TOKEN" \
    | jq .
}

##############################################
## STEP 5: UPLOADS
##############################################

log "🌈 Uploading Solarstorm"
upload_to_mapbox "wind_solarstorm.tif" "$MAPBOX_USERNAME.windtif" "Wind Layer Default"

log "🌙 Uploading Darkstorm"
upload_to_mapbox "wind_darkstorm.tif" "$MAPBOX_USERNAME.darktif" "Wind Layer Dark"

retry "tilesets upload-raster-source --replace \"$MAPBOX_USERNAME\" ECMWF ECMWF/ecmwf_data/ECMWF.grib2"
retry "tilesets publish \"$MAPBOX_USERNAME.ecmwf\""

##############################################
## STEP 6: GEOJSON
##############################################

log "🔁 Convert GRIB → GeoJSON"
python3 ECMWF/utils/grib_to_geojson.py

log "📦 Exporting GeoJSON to frontend"
mkdir -p "$FRONTEND_GEOJSON"
cp -f "$GEOJSON_DIR"/*.geojson "$FRONTEND_GEOJSON"

##############################################
## DONE
##############################################

log "🌎 COMPLETE — everything updated."
echo "----------------------------------"
