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
if [[ "${1:-}" =~ ^[0-9a-f