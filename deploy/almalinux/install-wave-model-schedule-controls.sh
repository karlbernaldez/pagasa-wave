#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { echo "Run this installer as root." >&2; exit 1; }

APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
DEPLOY_ROOT="$APP_ROOT/deploy/almalinux"
HELPER_SOURCE="$DEPLOY_ROOT/wavelab-wave-model-ops.mjs"
HELPER_TARGET="/usr/local/sbin/wavelab-wave-model-ops"
SUDOERS_FILE="/etc/sudoers.d/wavelab-wave-model-ops"

[[ -f "$HELPER_SOURCE" ]] || { echo "Missing $HELPER_SOURCE" >&2; exit 1; }
id "$APP_USER" >/dev/null 2>&1 || { echo "The $APP_USER account does not exist." >&2; exit 1; }

for unit in wavelab-ww3-package-builder.timer wavelab-ecwam-package-builder.timer; do
  systemctl cat "$unit" >/dev/null 2>&1 || {
    echo "Required timer unit is not installed: $unit" >&2
    exit 1
  }
done

install -o root -g root -m 0755 "$HELPER_SOURCE" "$HELPER_TARGET"
mkdir -p /etc/wavelab/wave-model-schedules
chown root:root /etc/wavelab/wave-model-schedules
chmod 0755 /etc/wavelab/wave-model-schedules

cat > "$SUDOERS_FILE" <<EOF
$APP_USER ALL=(root) NOPASSWD: $HELPER_TARGET *
EOF
chown root:root "$SUDOERS_FILE"
chmod 0440 "$SUDOERS_FILE"

if command -v visudo >/dev/null 2>&1; then
  visudo -cf "$SUDOERS_FILE"
fi

"$HELPER_TARGET" status WW3 >/dev/null
"$HELPER_TARGET" status ECWAM >/dev/null

echo "Wave model schedule controls installed."
echo "The $APP_USER account may invoke only the validated WaveLab operations helper through sudo."
