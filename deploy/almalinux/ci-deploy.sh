#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
STATE_DIR="${STATE_DIR:-/var/lib/wavelab/deployments}"
LOG_DIR="${LOG_DIR:-/var/log/wavelab}"

# Backward-compatible deploy syntax:
#   ci-deploy.sh <sha> <public-host>
# Explicit syntax:
#   ci-deploy.sh deploy <sha> <public-host>
#   ci-deploy.sh rollback <sha> <public-host>
if [[ "${1:-}" =~ ^[0-9a-f]{40}$ ]]; then
  ACTION="deploy"
  TARGET_SHA="$1"
  PUBLIC_HOST="${2:-}"
else
  ACTION="${1:-}"
  TARGET_SHA="${2:-}"
  PUBLIC_HOST="${3:-}"
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this deployment entrypoint with sudo/root."
  exit 1
fi

if [[ "$ACTION" != "deploy" && "$ACTION" != "rollback" ]]; then
  echo "Usage: ci-deploy.sh [deploy|rollback] <commit-sha> <public-host>"
  exit 1
fi

if [[ ! "$TARGET_SHA" =~ ^[0-9a-f]{40}$ || -z "$PUBLIC_HOST" ]]; then
  echo "Usage: ci-deploy.sh [deploy|rollback] <commit-sha> <public-host>"
  exit 1
fi

if ! id "$APP_USER" >/dev/null 2>&1 || [[ ! -d "$APP_ROOT/.git" ]]; then
  echo "Production application checkout is not ready at $APP_ROOT."
  exit 1
fi

run_git() {
  sudo -u "$APP_USER" git -C "$APP_ROOT" "$@"
}

mkdir -p "$STATE_DIR" "$LOG_DIR"
chmod 750 "$STATE_DIR" "$LOG_DIR"

if [[ -n "$(run_git status --porcelain)" ]]; then
  echo "Deployment checkout contains uncommitted changes. Refusing to overwrite them."
  exit 1
fi

STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
PREVIOUS_SHA="$(run_git rev-parse HEAD)"
LOG_FILE="$LOG_DIR/deploy-$(date -u +%Y%m%dT%H%M%SZ)-${TARGET_SHA:0:12}.log"
ROLLBACK_SMOKE_COPY="$(mktemp /tmp/wavelab-smoke.XXXXXX)"
trap 'rm -f "$ROLLBACK_SMOKE_COPY"' EXIT

if [[ -f "$APP_ROOT/deploy/almalinux/smoke-test.sh" ]]; then
  cp "$APP_ROOT/deploy/almalinux/smoke-test.sh" "$ROLLBACK_SMOKE_COPY"
  chmod 700 "$ROLLBACK_SMOKE_COPY"
else
  : > "$ROLLBACK_SMOKE_COPY"
fi

exec > >(tee -a "$LOG_FILE") 2>&1

on_failure() {
  local exit_code=$?
  echo "Deployment action failed (action=$ACTION target=$TARGET_SHA previous=$PREVIOUS_SHA exit=$exit_code)."
  systemctl --no-pager --full status wavelab-backend nginx redis || true
  journalctl --no-pager -u wavelab-backend -n 100 || true
  exit "$exit_code"
}
trap on_failure ERR

echo "Starting action=$ACTION target=$TARGET_SHA previous=$PREVIOUS_SHA at $STARTED_AT"
run_git fetch --prune origin "$DEPLOY_BRANCH"
run_git cat-file -e "$TARGET_SHA^{commit}"

if ! run_git merge-base --is-ancestor "$TARGET_SHA" "origin/$DEPLOY_BRANCH"; then
  echo "Target commit is not reachable from origin/$DEPLOY_BRANCH."
  exit 1
fi

if [[ "$ACTION" == "deploy" ]]; then
  run_git checkout "$DEPLOY_BRANCH"
  run_git merge --ff-only "$TARGET_SHA"
else
  # Rollback intentionally checks out an exact historical main commit in detached HEAD.
  # A later normal deployment returns the checkout to DEPLOY_BRANCH.
  run_git checkout --detach "$TARGET_SHA"
fi

if [[ "$(run_git rev-parse HEAD)" != "$TARGET_SHA" ]]; then
  echo "Deployment checkout does not match requested commit."
  exit 1
fi

printf '%s\n' "$PREVIOUS_SHA" > "$STATE_DIR/previous-sha"
printf '%s\n' "$TARGET_SHA" > "$STATE_DIR/current-sha"
printf '%s\n' "$ACTION" > "$STATE_DIR/last-action"
printf '%s\n' "$STARTED_AT" > "$STATE_DIR/started-at"

APP_USER="$APP_USER" APP_ROOT="$APP_ROOT" bash "$APP_ROOT/deploy/almalinux/deploy.sh" "$PUBLIC_HOST"

if [[ "$ACTION" == "deploy" && -f "$APP_ROOT/deploy/almalinux/smoke-test.sh" ]]; then
  bash "$APP_ROOT/deploy/almalinux/smoke-test.sh" "$PUBLIC_HOST"
elif [[ "$ACTION" == "rollback" && -s "$ROLLBACK_SMOKE_COPY" ]]; then
  bash "$ROLLBACK_SMOKE_COPY" "$PUBLIC_HOST"
else
  systemctl is-active --quiet wavelab-backend
  curl -fsS --max-time 10 http://127.0.0.1:5000/status >/dev/null
  curl -fsSI --max-time 10 -H "Host: $PUBLIC_HOST" http://127.0.0.1/ >/dev/null
fi

FINISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '%s\n' "$FINISHED_AT" > "$STATE_DIR/finished-at"
printf '%s\n' "$TARGET_SHA" > "$STATE_DIR/last-successful-sha"
echo "Completed action=$ACTION target=$TARGET_SHA at $FINISHED_AT"
