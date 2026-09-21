#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
BACKEND_ENV="${BACKEND_ENV:-/etc/wavelab/backend.env}"
EXPECTED_BRANCH="${EXPECTED_BRANCH:-main}"
RUN_WAVETILES_TESTS="${RUN_WAVETILES_TESTS:-1}"
WAVETILES_PYTHON="${WAVETILES_PYTHON:-$APP_ROOT/wavetiles/.venv/bin/python}"
STATUS_ROOT="${STATUS_ROOT:-/var/lib/wavelab/deployment-status}"
PREFLIGHT_STATUS_FILE="$STATUS_ROOT/preflight.json"

wavelab_require_root
for command_name in git node npm curl; do
  wavelab_require_command "$command_name"
done

if [[ ! -d "$APP_ROOT/.git" ]]; then
  echo "WaveLab Git checkout not found: $APP_ROOT" >&2
  exit 1
fi
if [[ ! -f "$BACKEND_ENV" ]]; then
  echo "Backend environment file not found: $BACKEND_ENV" >&2
  exit 1
fi

mkdir -p "$STATUS_ROOT"
chmod 0755 "$STATUS_ROOT"

branch="$(wavelab_git_branch "$APP_ROOT")"
revision="$(wavelab_git_sha "$APP_ROOT")"
current_stage="initialization"
completed_stages=()

write_preflight_status() {
  local result="$1"
  local failed_stage="${2:-}"
  local generated_at
  generated_at="$(wavelab_now)"
  COMPLETED_STAGES="$(printf '%s\n' "${completed_stages[@]:-}")" \
  PREFLIGHT_RESULT="$result" PREFLIGHT_FAILED_STAGE="$failed_stage" \
  PREFLIGHT_GENERATED_AT="$generated_at" PREFLIGHT_REVISION="$revision" PREFLIGHT_BRANCH="$branch" \
  node <<'NODE' > "$PREFLIGHT_STATUS_FILE.tmp"
const stages = (process.env.COMPLETED_STAGES || '').split('\n').filter(Boolean);
const payload = {
  schemaVersion: 1,
  generatedAt: process.env.PREFLIGHT_GENERATED_AT,
  revision: process.env.PREFLIGHT_REVISION,
  branch: process.env.PREFLIGHT_BRANCH,
  result: process.env.PREFLIGHT_RESULT,
  completedStages: stages,
  failedStage: process.env.PREFLIGHT_FAILED_STAGE || null,
};
process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
NODE
  install -o root -g root -m 0644 "$PREFLIGHT_STATUS_FILE.tmp" "$PREFLIGHT_STATUS_FILE"
  rm -f "$PREFLIGHT_STATUS_FILE.tmp"
}

on_preflight_error() {
  local exit_code=$?
  set +e
  write_preflight_status FAIL "$current_stage"
  wavelab_log "Preflight failed during: $current_stage"
  exit "$exit_code"
}
trap on_preflight_error ERR

wavelab_log "Preflight starting for $branch @ ${revision:0:12}."

current_stage="git checkout validation"
if [[ -n "$EXPECTED_BRANCH" && "$branch" != "$EXPECTED_BRANCH" ]]; then
  echo "Expected deployment branch '$EXPECTED_BRANCH' but checkout is '$branch'." >&2
  false
fi
if ! wavelab_git_clean "$APP_ROOT"; then
  echo "Deployment checkout has uncommitted changes. Refusing to deploy." >&2
  git -C "$APP_ROOT" status --short >&2
  false
fi
completed_stages+=(git_checkout)

current_stage="backend environment validation"
wavelab_log "Validating backend environment."
node "$APP_ROOT/backend/scripts/validateDeploymentEnv.js" "$BACKEND_ENV"
completed_stages+=(backend_environment)

current_stage="repository quality"
wavelab_log "Installing locked repository quality tools and running quality gates."
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT'
  npm ci --ignore-scripts
  npm run quality
"
completed_stages+=(repository_quality)

current_stage="backend tests"
wavelab_log "Running backend test suites."
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/backend'
  npm ci
  npm test
"
completed_stages+=(backend_tests)

current_stage="backend workflow tests"
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/backend'
  npm run test:workflow
"
completed_stages+=(backend_workflow_tests)

current_stage="frontend tests and build"
wavelab_log "Running frontend test suite and production build."
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/frontend'
  corepack enable
  corepack prepare pnpm@10.17.1 --activate
  pnpm install --frozen-lockfile
  pnpm test
"
completed_stages+=(frontend_tests)

sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/frontend'
  pnpm build
"
completed_stages+=(frontend_build)

if [[ "$RUN_WAVETILES_TESTS" == "1" ]]; then
  current_stage="wave pipeline tests"
  wavelab_require_command "$WAVETILES_PYTHON"
  wavelab_log "Running normalized wave-pipeline validation suites with $WAVETILES_PYTHON."
  sudo -u "$APP_USER" bash -lc "
    set -euo pipefail
    cd '$APP_ROOT'
    '$WAVETILES_PYTHON' -m unittest \
      wavetiles.tests.test_wave_contract \
      wavetiles.tests.test_normalized_reader \
      wavetiles.tests.test_normalized_wave_runner \
      wavetiles.tests.test_wave_pipeline_status \
      wavetiles.tests.test_wave_source_readiness \
      wavetiles.tests.test_wave_package_publisher \
      wavetiles.tests.test_ww3_package_selection \
      wavetiles.tests.test_ww3_adapter \
      wavetiles.tests.test_ecwam_adapter \
      -v
  "
  completed_stages+=(wave_pipeline_tests)
else
  wavelab_log "Wave-pipeline tests skipped because RUN_WAVETILES_TESTS=$RUN_WAVETILES_TESTS."
  completed_stages+=(wave_pipeline_tests_skipped)
fi

current_stage="shell syntax validation"
wavelab_log "Validating deployment shell syntax."
bash -n "$APP_ROOT/deploy/almalinux/deploy.sh"
bash -n "$SCRIPT_DIR/deploy.sh"
bash -n "$SCRIPT_DIR/preflight.sh"
bash -n "$SCRIPT_DIR/validate-deployment.sh"
completed_stages+=(shell_syntax)

current_stage="report generation"
write_preflight_status PASS
trap - ERR
wavelab_log "Preflight passed for ${revision:0:12}."
wavelab_log "Preflight status: $PREFLIGHT_STATUS_FILE"
