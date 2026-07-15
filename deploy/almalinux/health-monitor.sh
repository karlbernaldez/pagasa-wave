#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="${STATE_DIR:-/var/lib/wavelab-monitor}"
FAILURE_THRESHOLD="${FAILURE_THRESHOLD:-2}"
DISK_THRESHOLD="${DISK_THRESHOLD:-80}"
STATUS_URL="${STATUS_URL:-http://127.0.0.1:5000/status}"
HOST_LABEL="${HOST_LABEL:-$(hostname -f 2>/dev/null || hostname)}"
STATE_FILE="$STATE_DIR/state"

mkdir -p "$STATE_DIR"
chmod 0700 "$STATE_DIR"

failures=()
for service in wavelab-backend nginx redis; do
  if ! systemctl is-active --quiet "$service"; then
    failures+=("service $service is inactive")
  fi
done

if ! curl -fsS --max-time 10 "$STATUS_URL" >/dev/null; then
  failures+=("backend