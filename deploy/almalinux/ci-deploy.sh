#!/usr/bin/env bash
set -euo pipefail

DEPLOY_SHA="${1:-}"
PUBLIC_HOST="${2:-}"
APP_ROOT="${APP_ROOT:-/home/wavelab/app}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this deployment entrypoint with sudo/root."
  exit 1
fi

if [[ -z "$DEPLOY_SHA" || -z "$PUBLIC_HOST" ]]; then
  echo "Usage: ci-deploy.sh <commit-sha> <public-host>"
  exit 1
fi

if [[ ! "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid commit SHA: $DEPLOY_SHA"
  exit 1
fi

if [[ ! -d "$APP_ROOT/.git" ]]; then
  echo "WaveLab repository not found at $APP_ROOT"
  exit 1
fi

cd "$APP_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Deployment checkout contains uncommitted changes. Refusing to overwrite them."
  exit 1
fi

git fetch --prune origin dev
git checkout dev
git merge --ff-only "$DEPLOY_SHA"

if [[ "$(git rev-parse HEAD)" != "$DEPLOY_SHA" ]]; then
  echo "Deployment checkout does not match requested commit."
  exit 1
fi

APP_ROOT="$APP_ROOT" bash deploy/almalinux/deploy.sh "$PUBLIC_HOST"
