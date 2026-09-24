#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="${STATE_DIR:-/var/lib/wavelab-monitor}"
FAILURE_THRESHOLD="${FAILURE_THRESHOLD:-2}"
DISK_THRESHOLD="${DISK_THRESHOLD:-80}"
STATUS_URL="${STATUS_URL:-http://127.0.0.1:5000/status}"
HOST_LABEL="${HOST_LABEL:-$(hostname -f 2>/dev/null || hostname)}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
PIPELINE_ALERTS_ENABLED="${PIPELINE_ALERTS_ENABLED:-1}"
PIPELINE_ALERT_CHECK="${PIPELINE_ALERT_CHECK:-$APP_ROOT/backend/scripts/checkPipelineAlerts.js}"
STATE_FILE="$STATE_DIR/state"

mkdir -p "$STATE_DIR"
chmod 0700 "$STATE_DIR"

send_discord() {
  local message="$1"
  local payload
  payload=$(printf '%s' "$message" | python3 -c 'import json,sys; print(json.dumps({"content": sys.stdin.read()}))')
  curl -fsS --max-time 15 -H 'Content-Type: application/json' -d "$payload" "$DISCORD_WEBHOOK_URL" >/dev/null
}

failures=()
for service in wavelab-backend nginx redis; do
  if ! systemctl is-active --quiet "$service"; then
    failures+=("service $service is inactive")
  fi
done

if ! curl -fsS --max-time 10 "$STATUS_URL" >/dev/null; then
  failures+=("backend status endpoint is unavailable")
fi
if [[ "$PIPELINE_ALERTS_ENABLED" == "1" ]]; then
  if [[ ! -r "$PIPELINE_ALERT_CHECK" ]]; then
    failures+=("pipeline alert checker is unavailable: $PIPELINE_ALERT_CHECK")
  else
    if pipeline_alert_json="$(cd "$APP_ROOT/backend" && node "$PIPELINE_ALERT_CHECK" 2>/dev/null)"; then
      while IFS= read -r pipeline_alert; do
        [[ -n "$pipeline_alert" ]] && failures+=("pipeline: $pipeline_alert")
      done < <(
        printf '%s' "$pipeline_alert_json" | node -e '
          let raw = "";
          process.stdin.on("data", (chunk) => { raw += chunk; });
          process.stdin.on("end", () => {
            try {
              const payload = JSON.parse(raw);
              for (const alert of payload.alerts || []) {
                if (alert?.message) process.stdout.write(String(alert.message) + "\n");
              }
            } catch {
              process.exitCode = 1;
            }
          });
        '
      )
    else
      failures+=("pipeline alert evaluation failed")
    fi
  fi
fi

disk_usage=$(df -P / | awk 'NR==2 {gsub(/%/, "", $5); print $5}')
if [[ ! "$disk_usage" =~ ^[0-9]+$ ]]; then
  failures+=("could not determine root disk usage")
elif (( disk_usage >= DISK_THRESHOLD )); then
  failures+=("root disk usage is ${disk_usage}%")
fi

previous_state="healthy"
previous_count=0
if [[ -r "$STATE_FILE" ]]; then
  read -r previous_state previous_count < "$STATE_FILE" || true
fi

if ((${#failures[@]} == 0)); then
  printf 'healthy 0\n' > "$STATE_FILE"
  if [[ "$previous_state" == "alerting" ]]; then
    send_discord "✅ WaveLab recovered on ${HOST_LABEL}. Services, backend status, disk usage, and pipeline telemetry checks are healthy."
  fi
  logger -t wavelab-health-monitor "healthy; disk=${disk_usage}%"
  exit 0
fi

current_count=$((previous_count + 1))
current_state="failing"
if (( current_count >= FAILURE_THRESHOLD )); then
  current_state="alerting"
fi
printf '%s %s\n' "$current_state" "$current_count" > "$STATE_FILE"

failure_text=$(printf '%s; ' "${failures[@]}")
logger -p daemon.warning -t wavelab-health-monitor "failure ${current_count}/${FAILURE_THRESHOLD}: ${failure_text}"

if [[ "$current_state" == "alerting" && "$previous_state" != "alerting" ]]; then
  send_discord "🚨 WaveLab production alert on ${HOST_LABEL}: ${failure_text}"
fi

exit 1
