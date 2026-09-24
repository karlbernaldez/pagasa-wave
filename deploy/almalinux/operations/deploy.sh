#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALMALINUX_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

PUBLIC_HOST="${1:-}"
APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
BACKEND_ENV="${BACKEND_ENV:-/etc/wavelab/backend.env}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/wavelab.conf}"
SERVICE_FILE="${SERVICE_FILE:-/etc/systemd/system/wavelab-backend.service}"
REPORT_ROOT="${REPORT_ROOT:-/var/log/wavelab/deployments}"

wavelab_require_root

if [[ ! -d "$APP_ROOT/.git" ]]; then
  echo "App root not found or is not a Git checkout: $APP_ROOT" >&2
  exit 1
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --shell /bin/bash "$APP_USER"
fi
APP_GROUP="$(id -gn "$APP_USER")"

if [[ -z "$PUBLIC_HOST" ]]; then
  PUBLIC_HOST="$(curl -fsS --max-time 10 https://ifconfig.me || true)"
fi
if [[ -z "$PUBLIC_HOST" ]]; then
  echo "Usage: sudo bash deploy/almalinux/deploy.sh your-domain.com" >&2
  echo "   or: sudo bash deploy/almalinux/deploy.sh 203.0.113.10" >&2
  exit 1
fi

PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://$PUBLIC_HOST}"
DEPLOY_SHA="$(sudo -u "$APP_USER" git -C "$APP_ROOT" rev-parse HEAD)"
DEPLOY_SHORT_SHA="${DEPLOY_SHA:0:12}"
mkdir -p "$REPORT_ROOT"
chmod 0750 "$REPORT_ROOT"
chown root:"$APP_GROUP" "$REPORT_ROOT"
DEPLOY_LOG="$REPORT_ROOT/$(date '+%Y-%m-%d_%H%M%S')_${DEPLOY_SHORT_SHA}.deploy.log"
touch "$DEPLOY_LOG"
chown root:"$APP_GROUP" "$DEPLOY_LOG"
chmod 0640 "$DEPLOY_LOG"
exec > >(tee -a "$DEPLOY_LOG") 2>&1

wavelab_log "WaveLab deployment starting."
wavelab_log "Revision: $DEPLOY_SHA"
wavelab_log "Public origin: $PUBLIC_ORIGIN"
wavelab_log "App root: $APP_ROOT"
wavelab_log "Deployment log: $DEPLOY_LOG"

make_path_traversable() {
  local target="$1"
  while [[ "$target" != "/" && -n "$target" ]]; do
    chmod o+x "$target" 2>/dev/null || true
    target="$(dirname "$target")"
  done
}

mkdir -p /etc/wavelab
mkdir -p "$APP_ROOT/backend/logs" "$APP_ROOT/backend/frames" "$APP_ROOT/backend/public" "$APP_ROOT/backend/tmp"
WAVETILES_ROOT="$APP_ROOT/wavetiles/tiles"
PIPELINE_RUNTIME_ROOT="$APP_ROOT/wavetiles/.normalized-product-stage"
PIPELINE_HISTORY_ROOT="$PIPELINE_RUNTIME_ROOT/.history"
mkdir -p "$WAVETILES_ROOT" "$PIPELINE_HISTORY_ROOT"
chown -R "$APP_USER:$APP_GROUP" \
  "$APP_ROOT/backend/logs" \
  "$APP_ROOT/backend/frames" \
  "$APP_ROOT/backend/public" \
  "$APP_ROOT/backend/tmp" \
  "$WAVETILES_ROOT" \
  "$PIPELINE_RUNTIME_ROOT"

if [[ ! -f "$BACKEND_ENV" ]]; then
  cp "$ALMALINUX_DIR/backend.env.example" "$BACKEND_ENV"
  sed -i "s|__PUBLIC_ORIGIN__|$PUBLIC_ORIGIN|g" "$BACKEND_ENV"
  chmod 600 "$BACKEND_ENV"
  chown root:root "$BACKEND_ENV"
  echo "Created $BACKEND_ENV from example. Add real secrets and run deployment again." >&2
  exit 2
fi

if grep -q "replace-with" "$BACKEND_ENV" || grep -q "mongodb+srv://USER:PASSWORD" "$BACKEND_ENV"; then
  echo "$BACKEND_ENV still contains placeholder values." >&2
  exit 2
fi

dnf install -y git curl nginx redis policycoreutils-python-utils
systemctl enable --now redis nginx

if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" != "Disabled" ]]; then
  setsebool -P httpd_can_network_connect 1
fi

FRONTEND_ENV="$APP_ROOT/frontend/.env"
if [[ ! -f "$FRONTEND_ENV" ]]; then
  if [[ -f "$ALMALINUX_DIR/frontend.env.example" ]]; then
    cp "$ALMALINUX_DIR/frontend.env.example" "$FRONTEND_ENV"
    sed -i "s|__PUBLIC_ORIGIN__|$PUBLIC_ORIGIN|g" "$FRONTEND_ENV"
  else
    cat > "$FRONTEND_ENV" <<EOF
VITE_API_URL=$PUBLIC_ORIGIN
VITE_WW3_TILE_BASE=$PUBLIC_ORIGIN/wavetiles
VITE_MAPBOX_ACCESS_TOKEN=replace-with-public-mapbox-token
EOF
  fi
  chown "$APP_USER:$APP_GROUP" "$FRONTEND_ENV"
  chmod 600 "$FRONTEND_ENV"
  echo "Created $FRONTEND_ENV. Configure its public Mapbox token and run deployment again." >&2
  exit 2
fi

if ! grep -q "^VITE_WW3_TILE_BASE=" "$FRONTEND_ENV"; then
  printf '\nVITE_WW3_TILE_BASE=%s/wavetiles\n' "$PUBLIC_ORIGIN" >> "$FRONTEND_ENV"
  chown "$APP_USER:$APP_GROUP" "$FRONTEND_ENV"
  chmod 600 "$FRONTEND_ENV"
fi
if grep -q "replace-with-public-mapbox-token" "$FRONTEND_ENV"; then
  echo "$FRONTEND_ENV still contains the placeholder Mapbox token." >&2
  exit 2
fi

wavelab_log "Running required pre-deployment validation."
APP_USER="$APP_USER" APP_ROOT="$APP_ROOT" BACKEND_ENV="$BACKEND_ENV" RUN_WAVETILES_TESTS=1 \
  bash "$SCRIPT_DIR/preflight.sh"

wavelab_log "Installing production backend dependency set."
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/backend'
  npm ci --omit=dev
"

FRONTEND_DIST="$APP_ROOT/frontend/dist"
if [[ ! -d "$FRONTEND_DIST" ]]; then
  echo "Frontend build output not found after preflight: $FRONTEND_DIST" >&2
  exit 1
fi
printf '%s\n' "$DEPLOY_SHA" > "$FRONTEND_DIST/deployed-revision.txt"

chown -R "$APP_USER:$APP_GROUP" "$FRONTEND_DIST"
make_path_traversable "$FRONTEND_DIST"
make_path_traversable "$WAVETILES_ROOT"
find "$FRONTEND_DIST" -type d -exec chmod 755 {} +
find "$FRONTEND_DIST" -type f -exec chmod 644 {} +
find "$WAVETILES_ROOT" -type d -exec chmod 755 {} +
find "$WAVETILES_ROOT" -type f -exec chmod 644 {} +

if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" != "Disabled" ]]; then
  if command -v semanage >/dev/null 2>&1; then
    semanage fcontext -a -t httpd_sys_content_t "$FRONTEND_DIST(/.*)?" 2>/dev/null \
      || semanage fcontext -m -t httpd_sys_content_t "$FRONTEND_DIST(/.*)?"
    semanage fcontext -a -t httpd_sys_content_t "$WAVETILES_ROOT(/.*)?" 2>/dev/null \
      || semanage fcontext -m -t httpd_sys_content_t "$WAVETILES_ROOT(/.*)?"
  fi
  restorecon -Rv "$FRONTEND_DIST" "$WAVETILES_ROOT"
fi

if [[ ! -f "$FRONTEND_DIST/pagasa-logo.png" ]]; then
  echo "Expected frontend asset missing: $FRONTEND_DIST/pagasa-logo.png" >&2
  exit 1
fi

install_optional() {
  local source="$1"
  local target="$2"
  local mode="$3"
  if [[ -f "$source" ]]; then
    install -o root -g root -m "$mode" "$source" "$target"
  fi
}

install_optional "$ALMALINUX_DIR/wavelab-ww3-package-builder" /usr/local/sbin/wavelab-ww3-package-builder 0755
install_optional "$ALMALINUX_DIR/wavelab-ww3-package-builder.service" /etc/systemd/system/wavelab-ww3-package-builder.service 0644
install_optional "$ALMALINUX_DIR/wavelab-ww3-package-builder.timer" /etc/systemd/system/wavelab-ww3-package-builder.timer 0644
install_optional "$ALMALINUX_DIR/wavelab-ecwam-package-builder" /usr/local/sbin/wavelab-ecwam-package-builder 0755
install_optional "$ALMALINUX_DIR/wavelab-ecwam-package-builder.service" /etc/systemd/system/wavelab-ecwam-package-builder.service 0644
install_optional "$ALMALINUX_DIR/wavelab-ecwam-package-builder.timer" /etc/systemd/system/wavelab-ecwam-package-builder.timer 0644

wavelab_log "Synchronizing required WaveLab operational automation."
systemctl daemon-reload
systemctl enable --now wavelab-ww3-package-builder.timer wavelab-ecwam-package-builder.timer

APP_ROOT="$APP_ROOT" bash "$ALMALINUX_DIR/install-wave-source-readiness.sh"
APP_ROOT="$APP_ROOT" bash "$ALMALINUX_DIR/install-wave-model-operations.sh"

MONITOR_ENV="/etc/wavelab/monitor.env"
if [[ ! -f "$MONITOR_ENV" ]]; then
  echo "Required health-monitor environment file is missing: $MONITOR_ENV" >&2
  exit 2
fi
install -o root -g root -m 0755 "$ALMALINUX_DIR/health-monitor.sh" /usr/local/sbin/wavelab-health-monitor
install -o root -g root -m 0644 "$ALMALINUX_DIR/wavelab-health-monitor.service" /etc/systemd/system/wavelab-health-monitor.service
install -o root -g root -m 0644 "$ALMALINUX_DIR/wavelab-health-monitor.timer" /etc/systemd/system/wavelab-health-monitor.timer
systemd-analyze verify /etc/systemd/system/wavelab-health-monitor.service /etc/systemd/system/wavelab-health-monitor.timer
systemctl daemon-reload
systemctl enable --now wavelab-health-monitor.timer

MONGODB_BACKUP_ENV="/etc/wavelab/mongodb-backup.env"
if [[ ! -f "$MONGODB_BACKUP_ENV" ]]; then
  echo "Required MongoDB backup environment file is missing: $MONGODB_BACKUP_ENV" >&2
  exit 2
fi
APP_ROOT="$APP_ROOT" bash "$ALMALINUX_DIR/install-mongodb-backup-automation.sh"

cp "$ALMALINUX_DIR/wavelab-backend.service" "$SERVICE_FILE"
cp "$ALMALINUX_DIR/nginx.conf" "$NGINX_CONF"
sed -i \
  -e "s|__APP_USER__|$APP_USER|g" \
  -e "s|__APP_ROOT__|$APP_ROOT|g" \
  "$SERVICE_FILE"
sed -i \
  -e "s|__PUBLIC_HOST__|$PUBLIC_HOST|g" \
  -e "s|__FRONTEND_ROOT__|$FRONTEND_DIST|g" \
  -e "s|__APP_ROOT__|$APP_ROOT|g" \
  "$NGINX_CONF"

nginx -t
systemctl daemon-reload
systemctl enable wavelab-backend
systemctl restart wavelab-backend
systemctl reload nginx

backend_ready=0
for _ in {1..20}; do
  if curl -fsS --max-time 5 http://127.0.0.1:5000/status >/dev/null; then
    backend_ready=1
    break
  fi
  sleep 1
done
if [[ "$backend_ready" -ne 1 ]]; then
  echo "Backend did not become healthy after restart." >&2
  exit 1
fi

curl -fsSI --max-time 10 "http://127.0.0.1/pagasa-logo.png" >/dev/null
curl -fsS --max-time 10 "http://127.0.0.1/deployed-revision.txt" | grep -Fx "$DEPLOY_SHA" >/dev/null

wavelab_log "Running required post-deployment validation and report generation."
APP_ROOT="$APP_ROOT" APP_USER="$APP_USER" BACKEND_ENV="$BACKEND_ENV" REPORT_ROOT="$REPORT_ROOT" \
  bash "$SCRIPT_DIR/validate-deployment.sh"

wavelab_log "WaveLab deploy completed successfully."
wavelab_log "Deployed revision: $DEPLOY_SHA"
wavelab_log "Public origin: $PUBLIC_ORIGIN"
wavelab_log "Detailed deployment log: $DEPLOY_LOG"
