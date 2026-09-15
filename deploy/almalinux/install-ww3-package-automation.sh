#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { echo "Run this installer as root." >&2; exit 1; }

APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
DEPLOY_ROOT="$APP_ROOT/deploy/almalinux"
WAVETILES_ROOT="$APP_ROOT/wavetiles"
ENV_FILE=/etc/wavelab/ww3-package-builder.env

for path in \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder" \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder.service" \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder.timer" \
  "$DEPLOY_ROOT/ww3-package-builder.env.example"; do
  [[ -f "$path" ]] || { echo "Missing $path" >&2; exit 1; }
done

id wavelab >/dev/null 2>&1 || { echo "The wavelab account does not exist." >&2; exit 1; }
install -d -m 0755 /etc/wavelab
install -d -o wavelab -g wavelab -m 0755 \
  "$WAVETILES_ROOT/normalized/WW3" \
  "$WAVETILES_ROOT/.normalized-product-stage"

if [[ ! -e "$ENV_FILE" ]]; then
  install -o root -g root -m 0600 "$DEPLOY_ROOT/ww3-package-builder.env.example" "$ENV_FILE"
  echo "Created $ENV_FILE. Review it before starting the service."
else
  chown root:root "$ENV_FILE"
  chmod 0600 "$ENV_FILE"
fi

install -o root -g root -m 0755 \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder" \
  /usr/local/sbin/wavelab-ww3-package-builder
install -o root -g root -m 0644 \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder.service" \
  /etc/systemd/system/wavelab-ww3-package-builder.service
install -o root -g root -m 0644 \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder.timer" \
  /etc/systemd/system/wavelab-ww3-package-builder.timer

systemd-analyze verify \
  /etc/systemd/system/wavelab-ww3-package-builder.service \
  /etc/systemd/system/wavelab-ww3-package-builder.timer
systemctl daemon-reload
systemctl enable --now wavelab-ww3-package-builder.timer
systemctl list-timers wavelab-ww3-package-builder.timer --no-pager

echo "WW3 timer enabled. Keep CLEANUP_DRY_RUN=1 until deletion candidates have been reviewed."
echo "Run the service manually only during a supervised validation window."
