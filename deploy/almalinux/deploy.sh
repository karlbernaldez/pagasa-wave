#!/usr/bin/env bash
set -euo pipefail

PUBLIC_HOST="${1:-}"
APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
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
  echo "  sudo -u $APP_USER git clone -b dev https://github.com/karlbernaldez/pagasa-wave.git $APP_ROOT"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIST="$APP_ROOT/frontend/dist"
WAVETILES_ROOT="$APP_ROOT/wavetiles/tiles"

make_path_traversable() {
  local path="$1"
  while [[ "$path" != "/" && -n "$path" ]]; do
    chmod o+x "$path" 2>/dev/null || true
    path="$(dirname "$path")"
  done
}

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --shell /bin/bash "$APP_USER"
fi

DEPLOY_SHA="$(sudo -u "$APP_USER" git -C "$APP_ROOT" rev-parse HEAD)"

mkdir -p /etc/wavelab
mkdir -p "$APP_ROOT/backend/logs" "$APP_ROOT/backend/frames" "$APP_ROOT/backend/public" "$APP_ROOT/backend/tmp"
mkdir -p "$WAVETILES_ROOT"

# Do not chown the whole repository. That changes .git ownership and prevents
# the deployment operator from running git fetch/pull after a deploy. Restrict
# ownership changes to runtime/build output paths that the app actually writes.
chown -R "$APP_USER:$APP_USER" \
  "$APP_ROOT/backend/logs" \
  "$APP_ROOT/backend/frames" \
  "$APP_ROOT/backend/public" \
  "$APP_ROOT/backend/tmp" \
  "$WAVETILES_ROOT"

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
FRONTEND_ENV="$APP_ROOT/frontend/.env"
if [[ ! -f "$FRONTEND_ENV" ]]; then
  if [[ -f "$SCRIPT_DIR/frontend.env.example" ]]; then
    cp "$SCRIPT_DIR/frontend.env.example" "$FRONTEND_ENV"
    sed -i "s|__PUBLIC_ORIGIN__|$PUBLIC_ORIGIN|g" "$FRONTEND_ENV"
  else
    cat > "$FRONTEND_ENV" <<EOF
VITE_API_URL=$PUBLIC_ORIGIN
VITE_WW3_TILE_BASE=$PUBLIC_ORIGIN/wavetiles
VITE_MAPBOX_ACCESS_TOKEN=replace-with-public-mapbox-token
EOF
  fi
  chown "$APP_USER:$APP_USER" "$FRONTEND_ENV"
  chmod 600 "$FRONTEND_ENV"
  echo "Created $FRONTEND_ENV. Edit VITE_MAPBOX_ACCESS_TOKEN before building if needed."
fi

if ! grep -q "^VITE_WW3_TILE_BASE=" "$FRONTEND_ENV"; then
  printf '\nVITE_WW3_TILE_BASE=%s/wavetiles\n' "$PUBLIC_ORIGIN" >> "$FRONTEND_ENV"
  chown "$APP_USER:$APP_USER" "$FRONTEND_ENV"
  chmod 600 "$FRONTEND_ENV"
fi

if grep -q "replace-with-public-mapbox-token" "$FRONTEND_ENV"; then
  echo "$FRONTEND_ENV still contains the placeholder Mapbox token. Edit it before deploying."
  exit 2
fi

# Install full backend dependencies first so deployment preflight can execute
# against the exact code and dependency set that is about to be activated.
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/backend'
  npm ci
"

# Validate the current environment with the current security rules before the
# running API is interrupted. This catches restart-unsafe configuration such as
# production + COOKIE_SECURE=false while the previous backend remains online.
node "$APP_ROOT/backend/scripts/validateDeploymentEnv.js" "$BACKEND_ENV"

sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/backend'
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

if [[ ! -d "$FRONTEND_DIST" ]]; then
  echo "Frontend build output not found: $FRONTEND_DIST"
  exit 1
fi

# Record the exact repository revision that produced the currently served Vite
# bundle. This makes stale frontend deployments visible without inspecting asset hashes.
printf '%s\n' "$DEPLOY_SHA" > "$FRONTEND_DIST/deployed-revision.txt"

# Vite recreates frontend/dist during each build. Re-apply web-server-safe
# permissions and SELinux labels so Nginx can serve public assets such as
# /pagasa-logo.png, favicons, and immutable /assets/* files after every deploy.
#
# The Nginx worker normally runs as nginx, not as the wavelab app user. That
# means built files must be world-readable and every parent directory in the
# served path must be world-traversable. Apply ownership first, then chmod, so
# restrictive umasks from the build cannot leave files as 660/770.
chown -R "$APP_USER:$APP_USER" "$FRONTEND_DIST"
make_path_traversable "$FRONTEND_DIST"
make_path_traversable "$WAVETILES_ROOT"
# Batch chmod arguments so large WW3/ECWAM tile caches do not spawn one chmod
# process per file during every deployment.
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

if [[ -f "$FRONTEND_DIST/pagasa-logo.png" ]]; then
  ls -lah "$FRONTEND_DIST/pagasa-logo.png"
else
  echo "Expected frontend public asset missing: $FRONTEND_DIST/pagasa-logo.png"
  exit 1
fi

# Keep installed package-builder wrappers and units synchronized with the same
# repository revision as the application. Existing environment files are never overwritten.
if [[ -f "$SCRIPT_DIR/wavelab-ww3-package-builder" ]]; then
  install -o root -g root -m 0755 \
    "$SCRIPT_DIR/wavelab-ww3-package-builder" \
    /usr/local/sbin/wavelab-ww3-package-builder
fi
if [[ -f "$SCRIPT_DIR/wavelab-ww3-package-builder.service" ]]; then
  install -o root -g root -m 0644 \
    "$SCRIPT_DIR/wavelab-ww3-package-builder.service" \
    /etc/systemd/system/wavelab-ww3-package-builder.service
fi
if [[ -f "$SCRIPT_DIR/wavelab-ww3-package-builder.timer" ]]; then
  install -o root -g root -m 0644 \
    "$SCRIPT_DIR/wavelab-ww3-package-builder.timer" \
    /etc/systemd/system/wavelab-ww3-package-builder.timer
fi
if [[ -f "$SCRIPT_DIR/wavelab-ecwam-package-builder" ]]; then
  install -o root -g root -m 0755 \
    "$SCRIPT_DIR/wavelab-ecwam-package-builder" \
    /usr/local/sbin/wavelab-ecwam-package-builder
fi
if [[ -f "$SCRIPT_DIR/wavelab-ecwam-package-builder.service" ]]; then
  install -o root -g root -m 0644 \
    "$SCRIPT_DIR/wavelab-ecwam-package-builder.service" \
    /etc/systemd/system/wavelab-ecwam-package-builder.service
fi
if [[ -f "$SCRIPT_DIR/wavelab-ecwam-package-builder.timer" ]]; then
  install -o root -g root -m 0644 \
    "$SCRIPT_DIR/wavelab-ecwam-package-builder.timer" \
    /etc/systemd/system/wavelab-ecwam-package-builder.timer
fi

cp "$SCRIPT_DIR/wavelab-backend.service" "$SERVICE_FILE"
cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF"
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
# `enable --now` does not restart an already-running service. Explicit restart
# guarantees that backend code/config from DEPLOY_SHA is actually activated.
systemctl restart wavelab-backend
systemctl reload nginx

# Give the restarted API a bounded startup window before declaring deployment failure.
backend_ready=0
for _ in {1..20}; do
  if curl -fsS --max-time 5 http://127.0.0.1:5000/status >/dev/null; then
    backend_ready=1
    break
  fi
  sleep 1
done
if [[ "$backend_ready" -ne 1 ]]; then
  echo "Backend did not become healthy after restart."
  exit 1
fi

# Validate that root-level Vite public assets and the deployed revision marker are reachable.
curl -fsSI --max-time 10 "http://127.0.0.1/pagasa-logo.png" >/dev/null
curl -fsS --max-time 10 "http://127.0.0.1/deployed-revision.txt" | grep -Fx "$DEPLOY_SHA" >/dev/null

echo "WaveLab deploy completed."
echo "Deployed revision: $DEPLOY_SHA"
echo "Public origin used for this deployment: $PUBLIC_ORIGIN"
echo "App root used for this deployment: $APP_ROOT"
echo "WW3 tile base used for this deployment: $PUBLIC_ORIGIN/wavetiles"
echo "When a domain is available, update /etc/wavelab/backend.env and frontend/.env.production, rebuild frontend, then enable TLS with certbot."
