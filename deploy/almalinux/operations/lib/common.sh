#!/usr/bin/env bash
set -euo pipefail

wavelab_now() {
  date --iso-8601=seconds
}

wavelab_log() {
  printf '[%s] %s\n' "$(wavelab_now)" "$*"
}

wavelab_require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Run this command with sudo/root." >&2
    exit 1
  fi
}

wavelab_require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is unavailable: $command_name" >&2
    exit 1
  fi
}

wavelab_service_state() {
  local unit="$1"
  systemctl is-active "$unit" 2>/dev/null || true
}

wavelab_timer_state() {
  local unit="$1"
  local state
  state="$(wavelab_service_state "$unit")"
  if [[ "$state" == "active" ]]; then
    printf 'active'
  else
    printf '%s' "${state:-unavailable}"
  fi
}

wavelab_check_http() {
  local url="$1"
  curl -fsS --max-time 10 "$url" >/dev/null
}

wavelab_git_branch() {
  local root="$1"
  git -C "$root" branch --show-current 2>/dev/null || printf 'detached'
}

wavelab_git_sha() {
  local root="$1"
  git -C "$root" rev-parse HEAD
}

wavelab_git_clean() {
  local root="$1"
  [[ -z "$(git -C "$root" status --porcelain)" ]]
}
