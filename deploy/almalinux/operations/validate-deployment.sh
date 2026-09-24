#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
BACKEND_ENV="${BACKEND_ENV:-/etc/wavelab/backend.env}"
REPORT_ROOT="${REPORT_ROOT:-/var/log/wavelab/deployments}"
STATUS_ROOT="${STATUS_ROOT:-/var/lib/wavelab/deployment-status}"
EXPECTED_BRANCH="${EXPECTED_BRANCH:-main}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:5000/status}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1}"
REQUIRE_PREFLIGHT="${REQUIRE_PREFLIGHT:-1}"
PIPELINE_HISTORY_ROOT="${PIPELINE_HISTORY_ROOT:-$APP_ROOT/wavetiles/.normalized-product-stage/.history}"

wavelab_require_root
for command_name in git curl systemctl journalctl node; do
  wavelab_require_command "$command_name"
done

APP_GROUP="$(id -gn "$APP_USER" 2>/dev/null || echo root)"
mkdir -p "$REPORT_ROOT" "$STATUS_ROOT"
chown root:"$APP_GROUP" "$REPORT_ROOT" 2>/dev/null || true
chmod 0750 "$REPORT_ROOT"
chmod 0755 "$STATUS_ROOT"

revision="$(wavelab_git_sha "$APP_ROOT")"
short_revision="${revision:0:12}"
branch="$(wavelab_git_branch "$APP_ROOT")"
host_name="$(hostname -f 2>/dev/null || hostname)"
generated_at="$(wavelab_now)"
stamp="$(date '+%Y-%m-%d_%H%M%S')"
report_id="${stamp}_${short_revision}"
text_report="$REPORT_ROOT/$report_id.report.txt"
json_report="$REPORT_ROOT/$report_id.json"
latest_json="$STATUS_ROOT/latest.json"
preflight_json="$STATUS_ROOT/preflight.json"

checks=()
failed=0
warnings=0

record_check() {
  local key="$1"
  local label="$2"
  local status="$3"
  local detail="${4:-}"
  checks+=("$key|$label|$status|$detail")
  case "$status" in
    PASS) ;;
    WARN) warnings=$((warnings + 1)) ;;
    *) failed=$((failed + 1)) ;;
  esac
}

if [[ "$branch" == "$EXPECTED_BRANCH" ]]; then
  record_check git_branch "Deployment branch" PASS "$branch"
else
  record_check git_branch "Deployment branch" FAIL "expected $EXPECTED_BRANCH; found $branch"
fi

if wavelab_git_clean "$APP_ROOT"; then
  record_check git_clean "Git working tree" PASS clean
else
  record_check git_clean "Git working tree" FAIL dirty
fi

preflight_stages=""
preflight_valid=0
if [[ -f "$preflight_json" ]]; then
  preflight_meta="$(node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log([p.revision||'',p.result||'UNKNOWN',(p.completedStages||[]).join(',')].join('|'));" "$preflight_json" 2>/dev/null || true)"
  IFS='|' read -r preflight_revision preflight_result preflight_stages <<< "$preflight_meta"
  if [[ "$preflight_revision" != "$revision" ]]; then
    record_check preflight_revision "Preflight revision" FAIL "report does not match $short_revision"
  elif [[ "$preflight_result" != "PASS" ]]; then
    record_check preflight_result "Pre-deployment validation" FAIL "$preflight_result"
  else
    preflight_valid=1
    record_check preflight_revision "Preflight revision" PASS "$short_revision"
  fi
elif [[ "$REQUIRE_PREFLIGHT" == "1" ]]; then
  record_check preflight_report "Pre-deployment validation report" FAIL "required report is not available"
else
  record_check preflight_report "Pre-deployment validation report" WARN "not available"
fi

record_preflight_stage() {
  local stage="$1"
  local label="$2"
  if [[ "$preflight_valid" -ne 1 ]]; then
    return
  fi
  if [[ ",$preflight_stages," == *",$stage,"* ]]; then
    record_check "preflight_$stage" "$label" PASS passed
  else
    record_check "preflight_$stage" "$label" FAIL "missing from preflight report"
  fi
}
record_preflight_stage repository_quality "Repository quality"
record_preflight_stage backend_tests "Backend tests"
record_preflight_stage backend_workflow_tests "Backend workflow tests"
record_preflight_stage frontend_tests "Frontend tests"
record_preflight_stage frontend_build "Frontend production build"
if [[ "$preflight_valid" -eq 1 ]]; then
  if [[ ",$preflight_stages," == *",wave_pipeline_tests,"* ]]; then
    record_check preflight_wave_pipeline_tests "Wave pipeline tests" PASS passed
  elif [[ ",$preflight_stages," == *",wave_pipeline_tests_skipped,"* ]]; then
    record_check preflight_wave_pipeline_tests "Wave pipeline tests" WARN skipped
  else
    record_check preflight_wave_pipeline_tests "Wave pipeline tests" FAIL "missing from preflight report"
  fi
fi
record_preflight_stage shell_syntax "Deployment shell syntax"

if [[ -f "$APP_ROOT/frontend/dist/deployed-revision.txt" ]] && \
  grep -Fx "$revision" "$APP_ROOT/frontend/dist/deployed-revision.txt" >/dev/null 2>&1; then
  record_check frontend_revision "Frontend revision marker" PASS "$short_revision"
else
  record_check frontend_revision "Frontend revision marker" FAIL "does not match repository revision"
fi

if [[ -f "$BACKEND_ENV" ]]; then
  backend_environment="$(node -e "const fs=require('fs'); const text=fs.readFileSync(process.argv[1],'utf8'); const line=text.split(/\\r?\\n/).find((entry)=>entry.trim().startsWith('NODE_ENV=')); console.log(line ? line.slice(line.indexOf('=')+1).trim().replace(/^['\"]|['\"]$/g,'') : 'unset');" "$BACKEND_ENV")"
  record_check backend_env_file "Backend environment file" PASS "NODE_ENV=${backend_environment:-unset}"
else
  backend_environment="unavailable"
  record_check backend_env_file "Backend environment file" FAIL missing
fi

if [[ -d "$PIPELINE_HISTORY_ROOT" ]]; then
  if sudo -u "$APP_USER" test -r "$PIPELINE_HISTORY_ROOT" && \
    sudo -u "$APP_USER" test -w "$PIPELINE_HISTORY_ROOT"; then
    record_check pipeline_history_access "Pipeline telemetry storage" PASS "read/write"
  else
    record_check pipeline_history_access "Pipeline telemetry storage" FAIL "not readable/writable by $APP_USER"
  fi

  telemetry_probe="$PIPELINE_HISTORY_ROOT/.deployment-write-probe"
  if sudo -u "$APP_USER" sh -c "printf '%s\n' probe > '$telemetry_probe'" 2>/dev/null && \
    sudo -u "$APP_USER" rm -f "$telemetry_probe" 2>/dev/null; then
    record_check pipeline_history_write "Pipeline telemetry write probe" PASS "append path usable"
  else
    rm -f "$telemetry_probe" 2>/dev/null || true
    record_check pipeline_history_write "Pipeline telemetry write probe" FAIL "unable to create/remove probe"
  fi

  telemetry_meta="$(
    sudo -u "$APP_USER" node - "$PIPELINE_HISTORY_ROOT" <<'NODE' 2>/dev/null || true
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
let files = 0;
let records = 0;
let invalid = 0;
let bytes = 0;
for (const name of fs.readdirSync(root).filter((entry) => entry.endsWith('.jsonl'))) {
  const target = path.join(root, name);
  const raw = fs.readFileSync(target, 'utf8');
  files += 1;
  bytes += fs.statSync(target).size;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row?.eventType === 'pipeline_run' && row?.runId && row?.model && row?.outcome) {
        records += 1;
      } else {
        invalid += 1;
      }
    } catch {
      invalid += 1;
    }
  }
}
process.stdout.write([files, records, invalid, bytes].join('|'));
NODE
  )"
  IFS='|' read -r telemetry_files telemetry_records telemetry_invalid telemetry_bytes <<< "$telemetry_meta"
  telemetry_files="${telemetry_files:-0}"
  telemetry_records="${telemetry_records:-0}"
  telemetry_invalid="${telemetry_invalid:-0}"
  telemetry_bytes="${telemetry_bytes:-0}"

  if [[ "$telemetry_invalid" -eq 0 ]]; then
    record_check pipeline_history_integrity "Pipeline telemetry integrity" PASS "$telemetry_records records in $telemetry_files file(s)"
  else
    record_check pipeline_history_integrity "Pipeline telemetry integrity" WARN "$telemetry_invalid malformed record(s)"
  fi
  record_check pipeline_history_size "Pipeline telemetry storage size" PASS "${telemetry_bytes} bytes"
else
  record_check pipeline_history_access "Pipeline telemetry storage" FAIL "missing: $PIPELINE_HISTORY_ROOT"
fi

service_units=(wavelab-backend.service nginx.service redis.service)
service_json=()
for unit in "${service_units[@]}"; do
  state="$(wavelab_service_state "$unit")"
  key="${unit%.service}"
  key="${key//-/_}"
  service_json+=("$key=$state")
  if [[ "$state" == "active" ]]; then
    record_check "service_$key" "$unit" PASS active
  else
    record_check "service_$key" "$unit" FAIL "${state:-unavailable}"
  fi
done

if wavelab_check_http "$BACKEND_URL"; then
  record_check backend_http "Backend /status" PASS reachable
else
  record_check backend_http "Backend /status" FAIL unreachable
fi

if curl -fsS --max-time 10 "$FRONTEND_URL/deployed-revision.txt" | grep -Fx "$revision" >/dev/null 2>&1; then
  record_check frontend_http "Served frontend revision" PASS "$short_revision"
else
  record_check frontend_http "Served frontend revision" FAIL mismatch
fi

if curl -fsSI --max-time 10 "$FRONTEND_URL/pagasa-logo.png" >/dev/null 2>&1; then
  record_check frontend_asset "Frontend public asset" PASS reachable
else
  record_check frontend_asset "Frontend public asset" FAIL unreachable
fi

timer_units=(
  wavelab-health-monitor.timer
  wavelab-wave-source-readiness.timer
  wavelab-ww3-package-builder.timer
  wavelab-ecwam-package-builder.timer
  wavelab-mongodb-backup.timer
)
timer_json=()
for unit in "${timer_units[@]}"; do
  state="$(wavelab_timer_state "$unit")"
  key="${unit%.timer}"
  key="${key#wavelab-}"
  key="${key//-/_}"
  timer_json+=("$key=$state")
  if [[ "$state" == "active" ]]; then
    record_check "timer_$key" "$unit" PASS active
  else
    record_check "timer_$key" "$unit" FAIL "${state:-unavailable}"
  fi
done

backend_started_at="$(systemctl show wavelab-backend.service --property=ActiveEnterTimestamp --value 2>/dev/null || true)"
if [[ -n "$backend_started_at" ]]; then
  recent_error_count="$(journalctl -u wavelab-backend.service --since "$backend_started_at" -p err --no-pager -q 2>/dev/null | sed '/^-- No entries --$/d' | sed '/^[[:space:]]*$/d' | wc -l | tr -d ' ')"
else
  recent_error_count=0
fi

if [[ "$recent_error_count" -eq 0 ]]; then
  record_check backend_errors "Backend errors since current start" PASS 0
else
  record_check backend_errors "Backend errors since current start" WARN "$recent_error_count"
fi

result="PASS"
if [[ "$failed" -gt 0 ]]; then
  result="FAIL"
elif [[ "$warnings" -gt 0 ]]; then
  result="WARN"
fi

{
  echo "WaveLab Deployment Validation Report"
  echo "===================================="
  echo "Generated: $generated_at"
  echo "Host: $host_name"
  echo "Revision: $revision"
  echo "Branch: $branch"
  echo "Backend environment: ${backend_environment:-unset}"
  echo "Backend started: ${backend_started_at:-unavailable}"
  echo
  printf '%-42s %-6s %s\n' "Check" "Status" "Detail"
  printf '%-42s %-6s %s\n' "-----" "------" "------"
  for entry in "${checks[@]}"; do
    IFS='|' read -r _key label status detail <<< "$entry"
    printf '%-42s %-6s %s\n' "$label" "$status" "$detail"
  done
  echo
  echo "RESULT: $result"
  echo "Failures: $failed"
  echo "Warnings: $warnings"
} > "$text_report"
chmod 0640 "$text_report"
chown root:"$APP_GROUP" "$text_report" 2>/dev/null || true

CHECKS_DATA="$(printf '%s\n' "${checks[@]}")" \
SERVICES_DATA="$(printf '%s\n' "${service_json[@]}")" \
TIMERS_DATA="$(printf '%s\n' "${timer_json[@]}")" \
GENERATED_AT="$generated_at" HOST_NAME="$host_name" REVISION="$revision" SHORT_REVISION="$short_revision" \
BRANCH="$branch" RESULT="$result" BACKEND_ENVIRONMENT="${backend_environment:-unset}" \
BACKEND_STARTED_AT="$backend_started_at" RECENT_ERROR_COUNT="$recent_error_count" REPORT_ID="$report_id" \
node <<'NODE' > "$json_report"
const parseChecks = (raw) => raw.split('\n').filter(Boolean).map((line) => {
  const [key, label, status, ...detail] = line.split('|');
  return { key, label, status, detail: detail.join('|') || null };
});
const parseMap = (raw) => Object.fromEntries(raw.split('\n').filter(Boolean).map((line) => {
  const separator = line.indexOf('=');
  return [line.slice(0, separator), line.slice(separator + 1)];
}));
const payload = {
  schemaVersion: 1,
  available: true,
  generatedAt: process.env.GENERATED_AT,
  reportId: process.env.REPORT_ID,
  result: process.env.RESULT,
  host: process.env.HOST_NAME,
  revision: process.env.REVISION,
  shortRevision: process.env.SHORT_REVISION,
  branch: process.env.BRANCH,
  backendEnvironment: process.env.BACKEND_ENVIRONMENT || 'unset',
  backend: {
    startedAt: process.env.BACKEND_STARTED_AT || null,
    recentErrorCount: Number(process.env.RECENT_ERROR_COUNT || 0),
  },
  services: parseMap(process.env.SERVICES_DATA || ''),
  timers: parseMap(process.env.TIMERS_DATA || ''),
  checks: parseChecks(process.env.CHECKS_DATA || ''),
};
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
NODE
chmod 0640 "$json_report"
chown root:"$APP_GROUP" "$json_report" 2>/dev/null || true
install -o root -g root -m 0644 "$json_report" "$latest_json"

wavelab_log "Deployment validation result: $result"
wavelab_log "Text report: $text_report"
wavelab_log "JSON report: $json_report"
wavelab_log "Latest status: $latest_json"

if [[ "$result" == "FAIL" ]]; then
  exit 1
fi
