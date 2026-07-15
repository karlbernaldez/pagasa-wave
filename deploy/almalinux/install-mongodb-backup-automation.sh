#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/wavelab/app}"
SOURCE_DIR="$APP_ROOT/deploy/almalinux"
ENV_FILE="/etc/wavelab/mongodb-backup.env"

[[ $EUID -eq 0 ]] || { echo "Run as root" >&2; exit 1; }
for file in wavelab-mongodb-backup wavelab-mongodb-backup.service wavelab-mongodb-backup.timer; do
  [[ -f "$SOURCE_DIR/$file" ]] || { echo "Missing $SOURCE_DIR/$file" >&2; exit 1; }
done
[[ -f "$ENV_FILE" ]] || { echo "Create $ENV_FILE from mongodb-backup.env.example first" >&2; exit 1; }
[[ $(stat -c '%a' "$ENV_FILE") == 600 ]] || { echo "$ENV_FILE must have mode 0600" >&2; exit 1; }
[[ $(stat -c '%U:%G' "$ENV_FILE") == root:root ]] || { echo "$ENV_FILE must be root:root" >&2; exit 1; }

grep -Eq '^AGE_RECIPIENT=age1[0-9a-z]+$' "$ENV_FILE" || { echo "Valid public AGE_RECIPIENT missing" >&2; exit 1; }
grep -Eq '^DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/' "$ENV_FILE" || { echo "Discord webhook missing" >&2; exit 1; }

install -m 0750 -o root -g root "$SOURCE_DIR/wavelab-mongodb-backup" /usr/local/sbin/wavelab-mongodb-backup
install -m 0644 -o root -g root "$SOURCE_DIR/wavelab-mongodb-backup.service" /etc/systemd/system/wavelab-mongodb-backup.service
install -m 0644 -o root -g root "$SOURCE_DIR/wavelab-mongodb-backup.timer" /etc/systemd/system/wavelab-mongodb-backup.timer
install -d -m 0700 -o root -g root /var/backups/wavelab/mongodb

systemd-analyze verify /etc/systemd/system/wavelab-mongodb-backup.service /etc/systemd/system/wavelab-mongodb-backup.timer
systemctl daemon-reload
systemctl enable --now wavelab-mongodb-backup.timer
systemctl list-timers wavelab-mongodb-backup.timer --no-pager

echo "Timer enabled. Run the service manually only during a supervised validation window."
