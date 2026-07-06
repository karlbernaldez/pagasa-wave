#!/usr/bin/env bash
set -euo pipefail

PUBLIC_HOST="${1:-}"
APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/opt/wavelab/app}"
BACKEND_ENV="${BACKEND_ENV:-/etc/wavelab/backend.env}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/wavelab.conf}"
SERVICE_FILE="${SERVICE_FILE:-/etc/systemd/system/wavelab-backend.service}"

if [[ -z "$PUBLIC_HOST" ]]; then
  PUBLIC_HOST="$(curl -fsS https://ifconfig.me || true)"
fi

if [[ -z "$PUBLIC_HOST" ]]; then
  echo "Usage: sudo bash deploy/almalinux/deploy.sh your-domain.com"
  echo "   or: sudo bash deploy/almalinux/deploy.sh 203.0.113.10"
  echo "No host was provided and public IP auto-detection failed."
  exit 1
fi

PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://$PUBLIC_HOST}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo/root."
  exit 1
fi

if [[ ! -d "$APP_ROOT" ]]; then
  echo "App root not found: $APP_ROOT"
  echo "Clone the repo first, for example:"
  echo "  sudo -u $APP_USER git clone -b main https://github.com/karlbernaldez/pagasa-wave.git $APP_ROOT"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --shell /bin/bash "$APP_USER"
fi

mkdir -p /etc/wavelab
mkdir -p "$APP_ROOT/backend/logs" "$APP_ROOT/backend/frames" "$APP_ROOT/backend/public" "$APP_ROOT/backend/tmp"
chown -R "$APP_USER:$APP_USER" "$APP_ROOT"

if [[ ! -f "$BACKEND_ENV" ]]; then
  cp "$SCRIPT_DIR/backend.env.example" "$BACKEND_ENV"
  sed -i "s|__PUBLIC_ORIGIN__|$PUBLIC_ORIGIN|g" "$BACKEND_ENV"
  chmod 600 "$BACKEND_ENV"
  chown root:root "$BACKEND_ENV"
  echo "Created $BACKEND_ENV from example. Edit it with real secrets before starting production."
  echo "Stopping here to avoid starting with placeholder secrets."
  exit 2
fi

if grep -q "replace-with" "$BACKEND_ENV" || grep -q "mongodb+srv://USER:PASSWORD" "$BACKEND_ENV"; then
  echo "$BACKEND_ENV still contains placeholder values. Edit it before deploying."
  exit 2
fi

dnf install -y git curl nginx redis policycoreutils-python-utils
systemctl enable --now redis nginx

# Allow nginx/httpd to proxy to the Node backend when SELinux is enforcing.
if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" != "Disabled" ]]; then
  setsebool -P httpd_can_network_connect 1
fi

# Frontend env is intentionally not created with secrets. It must contain only public values.
FRONTEND_ENV="$APP_ROOT/frontend/.env.production"
if [[ ! -f "$FRONTEND_ENV" ]]; then
  cp "$SCRIPT_DIR/frontend.env.example" "$FRONTEND_ENV"
  sed -i "s|__PUBLIC_ORIGIN__|$PUBLIC_ORIGIN|g" "$FRONTEND_ENV"
  chown "$APP_USER:$APP_USER" "$FRONTEND_ENV"
  chmod 600 "$FRONTEND_ENV"
  echo "Created $FRONTEND_ENV. Edit VITE_MAPBOX_ACCESS_TOKEN before building if needed."
fi

sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/backend'
  npm ci
  npm test
  npm run test:workflow
  npm ci --omit=dev
"

sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/frontend'
  corepack enable
  corepack prepare pnpm@10.17.1 --activate
  pnpm install --frozen-lockfile
  pnpm test
  pnpm build
"

cp "$SCRIPT_DIR/wavelab-backend.service" "$SERVICE_FILE"
cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF"
sed -i "s/__PUBLIC_HOST__/$PUBLIC_HOST/g" "$NGINX_CONF"

nginx -t
systemctl daemon-reload
systemctl enable --now wavelab-backend
systemctl reload nginx

curl -fsS http://127.0.0.1:5000/status >/dev/null

echo "WaveLab deploy completed."
echo "Public origin used for this deployment: $PUBLIC_ORIGIN"
echo "When a domain is available, update /etc/wavelab/backend.env and frontend/.env.production, rebuild frontend, then enable TLS with certbot."
