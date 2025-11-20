#!/usr/bin/env bash
set -euo pipefail

##############################################
## LOAD ENV VARIABLES
##############################################

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
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
## LOG HELPER
##############################################
log() { printf "\n[%s] %s\n" "$(date -u +"%H:%M:%S")" "$1"; }


##############################################
## DOWNLOAD GRIB CYCLE
##############################################
download_cycle() {
    local date="$1"
    local cycle="$2"
    local file="${date}${cycle}0000-0h-oper-fc.grib2"
    local url="https://data.ecmwf.int/forecasts/${date}/${cycle}z/aifs-single/0p25/oper/${file}"

    [[ -s "$GRIB_DIR/$file" ]] && { log "🟢 Already exists → $file"; return 0; }

    log "⬇️ Downloading GRIB → $file"
    wget -q -T 20 -c "$url" -O "$GRIB_DIR/$file" \
        || { log "❌ Failed download: $file"; rm -f "$GRIB_DIR/$file"; return 1; }

    log "✅ Downloaded"
}

##############################################
## STEP 1: WIND PARTICLE DATA (download.py)
##############################################
log "📥 Running download.py for wind vector data"
python3 ECMWF/utils/download.py
log "✅ Finished download.py"


##############################################
## STEP 2: AIFS Cycles (Wind Magnitude)
##############################################
TODAY=$(date -u +"%Y%m%d")
YEST=$(date -u -d "yesterday" +"%Y%m%d")

log "📅 Looking for latest cycle $(date -u)"
mkdir -p "$GRIB_DIR"

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
    log "⚠️ No cycle found today, fallback: $YEST 18Z"
    LATEST_DATE="$YEST"
    LATEST_CYCLE="18"
    download_cycle "$LATEST_DATE" "$LATEST_CYCLE" || true
fi

# backfill by -6h -12h -18h
ANCHOR_TS=$(date -u -d "${LATEST_DATE} ${LATEST_CYCLE}:00:00" +%s)
for offset in 6 12 18; do
    ts=$((ANCHOR_TS - offset * 3600))
    download_cycle "$(date -u -d "@$ts" +"%Y%m%d")" "$(date -u -d "@$ts" +"%H")" || true
done


log "🧹 Keep only latest 4 GRIB files"
ls -1t "$GRIB_DIR"/*.grib2 2>/dev/null | tail -n +5 | xargs -r rm


##############################################
## STEP 3: Convert GRIB → TIFF
##############################################
log "🔧 Converting to TIFF (compute.py)"
# python3 ECMWF/utils/compute.py
python3 ECMWF/utils/computev2.py

log "🧹 Keep only latest 4 TIFF"
ls -1t "$TIFF_DIR"/*.tif | tail -n +5 | xargs -r rm

##############################################
## STEP 4: Colorize TIFF → Solarstorm
##############################################
log "🎨 Applying SolarStorm colormap"
python3 ECMWF/utils/colorizev2.py

log "🧹 Keep only latest 4 colorized TIFF"
ls -1t "$COLOR_DIR"/*_solarstorm.tif | tail -n +5 | xargs -r rm


##############################################
## RETRY HELPER
##############################################
retry() {
  local cmd="$1"
  local attempts=3
  local delay=180

  for ((i=1; i<=attempts; i++)); do
    log "🔄 Attempt $i/$attempts: $cmd"

    if eval "$cmd"; then
      log "✅ Success"
      return 0
    fi

    log "⚠️ Failed attempt $i"
    sleep "$delay"
    delay=$((delay * 2))
  done

  log "❌ All attempts failed → $cmd"
  return 1
}


##############################################
## FETCH MAPBOX UPLOAD CREDENTIALS
##############################################

log "🔑 Fetching temporary Mapbox S3 upload credentials..."

CREDENTIALS_JSON="$(curl -s -X POST \
  "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME/credentials?access_token=$MAPBOX_TOKEN")"

export AWS_ACCESS_KEY_ID="$(echo "$CREDENTIALS_JSON" | jq -r '.accessKeyId')"
export AWS_SECRET_ACCESS_KEY="$(echo "$CREDENTIALS_JSON" | jq -r '.secretAccessKey')"
export AWS_SESSION_TOKEN="$(echo "$CREDENTIALS_JSON" | jq -r '.sessionToken')"
export AWS_BUCKET="$(echo "$CREDENTIALS_JSON" | jq -r '.bucket')"
export AWS_KEY="$(echo "$CREDENTIALS_JSON" | jq -r '.key')"

log "🔐 AWS credentials loaded."
log "• AWS_BUCKET=$AWS_BUCKET"
log "• AWS_KEY=$AWS_KEY"


##############################################
## UPLOAD / PUBLISH PROCESS
##############################################

log "🚀 Uploading to Mapbox S3..."

# Add your upload command here once ready:
retry "aws s3 cp wind_speed.tif \"s3://$AWS_BUCKET/$AWS_KEY\" --region us-east-1 --endpoint-url https://s3.amazonaws.com"

UPLOAD_URL="https://$AWS_BUCKET.s3.amazonaws.com/$AWS_KEY"

log "🛰  Creating Mapbox upload job..."
log "🌍 Public S3 URL: $UPLOAD_URL"

UPLOAD_PAYLOAD=$(cat <<EOF
{
  "url": "$UPLOAD_URL",
  "tileset": "$MAPBOX_USERNAME.windtif",
  "name": "Wind Layer"
}
EOF
)

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$UPLOAD_PAYLOAD" \
  "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME?access_token=$MAPBOX_TOKEN" \
  | jq .

# retry "tilesets upload-raster-source --replace \"$MAPBOX_USERNAME\" ECMWF ECMWF/ecmwf_data/ECMWF.grib2"
# retry "tilesets publish \"$MAPBOX_USERNAME.ecmwf\""


##############################################
## STEP 6: GEOJSON → frontend/public/geojson
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
