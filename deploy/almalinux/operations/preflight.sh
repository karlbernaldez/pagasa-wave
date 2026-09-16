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
WAVETILES_PYTHON="${WAVETILES_PYTHON:-python3}"

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

branch="$(wavelab_git_branch "$APP_ROOT")"
revision="$(wavelab_git_sha "$APP_ROOT")"
wavelab_log "Preflight starting for $branch @ ${revision:0:12}."

if [[ -n "$EXPECTED_BRANCH" && "$branch" != "$EXPECTED_BRANCH" ]]; then
  echo "Expected deployment branch '$EXPECTED_BRANCH' but checkout is '$branch'." >&2
  exit 1
fi

if ! wavelab_git_clean "$APP_ROOT"; then
  echo "Deployment checkout has uncommitted changes. Refusing to deploy." >&2
  git -C "$APP_ROOT" status --short >&2
  exit 1
fi

wavelab_log "Validating backend environment."
node "$APP_ROOT/backend/scripts/validateDeploymentEnv.js" "$BACKEND_ENV"

wavelab_log "Installing locked repository quality tools."
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT'
  npm ci --ignore-scripts
  npm run quality
"

wavelab_log "Running backend test suites."
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/backend'
  npm ci
  npm test
  npm run test:workflow
"

wavelab_log "Running frontend test suite and production build."
sudo -u "$APP_USER" bash -lc "
  set -euo pipefail
  cd '$APP_ROOT/frontend'
  corepack enable
  corepack prepare pnpm@10.17.1 --activate
  pnpm install --frozen-lockfile
  pnpm test
  pnpm build
"

if [[ "$RUN_WAVETILES_TESTS" == "1" ]]; then
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
else
  wavelab_log "Wave-pipeline tests skipped because RUN_WAVETILES_TESTS=$RUN_WAVETILES_TESTS."
fi

wavelab_log "Validating deployment shell syntax."
bash -n "$APP_ROOT/deploy/almalinux/deploy.sh"
bash -n "$SCRIPT_DIR/preflight.sh"
bash -n "$SCRIPT_DIR/validate-deployment.sh" 2>/dev/null || true

wavelab_log "Preflight passed for ${revision:0:12}."
