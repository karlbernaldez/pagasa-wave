#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { echo "Run this installer as root." >&2; exit 1; }

APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
DEPLOY_ROOT="$APP_ROOT/deploy/almalinux"
TRIGGER_ROOT="$APP_ROOT/backend/tmp/wave-ops"

for path in \
  "$DEPLOY_ROOT/wavelab-ww3-manual-build.path" \
  "$DEPLOY_ROOT/wavelab-ecwam-manual-build.path"; do
  [[ -f "$path" ]] || { echo "Missing $path" >&2; exit 1; }
done

id wavelab >/dev/null 2>&1 || { echo "The wavelab account does not exist." >&2; exit 1; }

for unit in wavelab-ww3-package-builder.service wavelab-ecwam-package-builder.service; do
  systemctl cat "$unit" >/dev/null 2>&1 || {
    echo "Required builder unit is not installed: $unit" >&2
    exit 1
  }
done

install -d -o wavelab -g wavelab -m 0750 "$TRIGGER_ROOT"
install -o wavelab -g wavelab -m 0640 /dev/null "$TRIGGER_ROOT/ww3.trigger"
install -o wavelab -g wavelab -m 0640 /dev/null "$TRIGGER_ROOT/ecwam.trigger"

sed "s|__APP_ROOT__|$APP_ROOT|g" \
  "$DEPLOY_ROOT/wavelab-ww3-manual-build.path" \
  > /etc/systemd/system/wavelab-ww3-manual-build.path
sed "s|__APP_ROOT__|$APP_ROOT|g" \
  "$DEPLOY_ROOT/wavelab-ecwam-manual-build.path" \
  > /etc/systemd/system/wavelab-ecwam-manual-build.path
chmod 0644 \
  /etc/systemd/system/wavelab-ww3-manual-build.path \
  /etc/systemd/system/wavelab-ecwam-manual-build.path

systemd-analyze verify \
  /etc/systemd/system/wavelab-ww3-manual-build.path \
  /etc/systemd/system/wavelab-ecwam-manual-build.path
systemctl daemon-reload
systemctl enable --now \
  wavelab-ww3-manual-build.path \
  wavelab-ecwam-manual-build.path

systemctl status \
  wavelab-ww3-manual-build.path \
  wavelab-ecwam-manual-build.path \
  --no-pager

echo "Wave model supervised manual-build triggers are enabled."
echo "The backend can request only the existing WW3 and ECWAM systemd builder services by updating controlled trigger files."
