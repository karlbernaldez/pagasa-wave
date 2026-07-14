#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-deploy}"
TARGET_SHA="${2:-}"
PUBLIC_HOST="${3:-}"
APP_USER="${APP_USER:-wavelab}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
STATE_DIR="${STATE_DIR:-/var/lib/wavelab/deployments}"
LOG_DIR="${LOG_DIR:-/var/log/wavelab}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this deployment entrypoint with sudo/root."
  exit 1
fi

run_git() {
  sudo -u "$APP_USER" git -C "$APP_ROOT" "$@"
}

d