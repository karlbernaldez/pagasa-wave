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

# Clean GRIB_DIR before starting
log "🧹 Cleaning GRIB_DIR before downloading..."
rm -f "$GRIB_DIR"/*.grib2 2>/dev/null || true

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


# ##############################################
# ## UPLOAD / PUBLISH PROCESS (SOLAR + DARK)
# ##############################################

# ##############################################
# ## 1) SOLARSTORM UPLOAD
# ##############################################
log "🔑 Requesting fresh credentials for Solarstorm..."

SOLAR_CRED=$(curl -s -X POST \
  "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME/credentials?access_token=$MAPBOX_TOKEN")

SOLAR_AWS_BUCKET=$(echo "$SOLAR_CRED" | jq -r '.bucket')
SOLAR_AWS_KEY=$(echo "$SOLAR_CRED" | jq -r '.key')
export AWS_ACCESS_KEY_ID=$(echo "$SOLAR_CRED" | jq -r '.accessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo "$SOLAR_CRED" | jq -r '.secretAccessKey')
export AWS_SESSION_TOKEN=$(echo "$SOLAR_CRED" | jq -r '.sessionToken')

log "🌈 Uploading Solarstorm → S3"
retry "aws s3 cp wind_solarstorm.tif \
  \"s3://$SOLAR_AWS_BUCKET/$SOLAR_AWS_KEY\" \
  --region us-east-1 --endpoint-url https://s3.amazonaws.com"

SOLAR_URL="https://$SOLAR_AWS_BUCKET.s3.amazonaws.com/$SOLAR_AWS_KEY"

log "🌈 Submitting Solarstorm upload job..."

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
        \"url\": \"$SOLAR_URL\",
        \"tileset\": \"$MAPBOX_USERNAME.windtif\",
        \"name\": \"Wind Layer Default\"
      }" \
  "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME?access_token=$MAPBOX_TOKEN" \
  | jq .


##############################################
## 2) DARKSTORM UPLOAD
##############################################
log "🔑 Requesting fresh credentials for Darkstorm..."

DARK_CRED=$(curl -s -X POST \
  "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME/credentials?access_token=$MAPBOX_TOKEN")

DARK_AWS_BUCKET=$(echo "$DARK_CRED" | jq -r '.bucket')
DARK_AWS_KEY=$(echo "$DARK_CRED" | jq -r '.key')

export AWS_ACCESS_KEY_ID=$(echo "$DARK_CRED" | jq -r '.accessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo "$DARK_CRED" | jq -r '.secretAccessKey')
export AWS_SESSION_TOKEN=$(echo "$DARK_CRED" | jq -r '.sessionToken')

log "🌙 Uploading Darkstorm → S3"
retry "aws s3 cp wind_darkstorm.tif \
  \"s3://$DARK_AWS_BUCKET/$DARK_AWS_KEY\" \
  --region us-east-1 --endpoint-url https://s3.amazonaws.com"

DARK_URL="https://$DARK_AWS_BUCKET.s3.amazonaws.com/$DARK_AWS_KEY"

log "🌙 Submitting Darkstorm upload job..."

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
        \"url\": \"$DARK_URL\",
        \"tileset\": \"$MAPBOX_USERNAME.darktif\",
        \"name\": \"Wind Layer Dark\"
      }" \
  "https://api.mapbox.com/uploads/v1/$MAPBOX_USERNAME?access_token=$MAPBOX_TOKEN" \
  | jq .


log "🌀 Both Solarstorm + Darkstorm uploaded successfully!"

retry "tilesets upload-raster-source --replace \"$MAPBOX_USERNAME\" ECMWF ECMWF/ecmwf_data/ECMWF.grib2"
retry "tilesets publish \"$MAPBOX_USERNAME.ecmwf\""


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
