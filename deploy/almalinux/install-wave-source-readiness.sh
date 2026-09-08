#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { echo "Run this installer as root." >&2; exit 1; }

APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
DEPLOY_ROOT="$APP_ROOT/deploy/almalinux"
CHECKER="$APP_ROOT/wavetiles/scripts/check_wave_source_readiness.py"
STATE_ROOT=/var/lib/wavelab-wave-source-readiness

for path in \
  "$CHECKER" \
  "$DEPLOY_ROOT/wavelab-wave-source-readiness.service" \
  "$DEPLOY_ROOT/wavelab-wave-source-readiness.timer" \
  "$DEPLOY_ROOT/wavelab-wave-source-readiness.path" \
  "$DEPLOY_ROOT/wavelab-ww3-source-ready.path" \
  "$DEPLOY_ROOT/wavelab-ecwam-source-ready.path" \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder.service" \
  "$DEPLOY_ROOT/wavelab-ecwam-package-builder.service"; do
  [[ -f "$path" ]] || { echo "Missing $path" >&2; exit 1; }
done

id wavelab >/dev/null 2>&1 || { echo "The wavelab account does not exist." >&2; exit 1; }
install -d -o wavelab -g wavelab -m 0755 "$STATE_ROOT"
install -d -o wavelab -g wavelab -m 0755 "$APP_ROOT/wavetiles/.normalized-product-stage/.status"

install -o root -g root -m 0644 \
  "$DEPLOY_ROOT/wavelab-wave-source-readiness.service" \
  "$DEPLOY_ROOT/wavelab-wave-source-readiness.timer" \
  "$DEPLOY_ROOT/wavelab-wave-source-readiness.path" \
  "$DEPLOY_ROOT/wavelab-ww3-source-ready.path" \
  "$DEPLOY_ROOT/wavelab-ecwam-source-ready.path" \
  "$DEPLOY_ROOT/wavelab-ww3-package-builder.service" \
  "$DEPLOY_ROOT/wavelab-ecwam-package-builder.service" \
  /etc/systemd/system/

systemd-analyze verify \
  /etc/systemd/system/wavelab-wave-source-readiness.service \
  /etc/systemd/system/wavelab-wave-source-readiness.timer \
  /etc/systemd/system/wavelab-wave-source-readiness.path \
  /etc/systemd/system/wavelab-ww3-source-ready.path \
  /etc/systemd/system/wavelab-ecwam-source-ready.path \
  /etc/systemd/system/wavelab-ww3-package-builder.service \
  /etc/systemd/system/wavelab-ecwam-package-builder.service

systemctl daemon-reload
systemctl enable --now \
  wavelab-wave-source-readiness.timer \
  wavelab-wave-source-readiness.path \
  wavelab-ww3-source-ready.path \
  wavelab-ecwam-source-ready.path
systemctl start wavelab-wave-source-readiness.service

systemctl list-timers wavelab-wave-source-readiness.timer --no-pager
systemctl status wavelab-wave-source-readiness.path --no-pager
systemctl status wavelab-ww3-source-ready.path --no-pager
systemctl status wavelab-ecwam-source-ready.path --no-pager

echo "Wave source readiness signaling is enabled."
echo "Existing hourly builder timers remain enabled as rollout fallback until readiness-triggered runs are proven."
