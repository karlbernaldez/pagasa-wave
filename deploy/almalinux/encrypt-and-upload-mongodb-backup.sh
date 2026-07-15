#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/wavelab/mongodb}"
MONITOR_ENV="${MONITOR_ENV:-/etc/wavelab/monitor.env}"
CONFIRM_TOKEN="${CONFIRM_TOKEN:-}"
AGE_RECIPIENT="${AGE_RECIPIENT:-}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || fail "run as root"
[[ "$CONFIRM_TOKEN" == "ENCRYPT_AND_UPLOAD_ONE_BACKUP" ]] || fail "set CONFIRM_TOKEN=ENCRYPT_AND_UPLOAD_ONE_BACKUP"
command -v age >/dev/null 2>&1 || fail "age is not installed"
command -v curl >/dev/null 2>&1 || fail "curl is not installed"
[[ "$AGE_RECIPIENT" =~ ^age1[0-9a-z]+$ ]] || fail "AGE_RECIPIENT must be an age public recipient"
[[ -r "$MONITOR_ENV" ]] || fail "cannot read $MONITOR_ENV"

DISCORD_WEBHOOK_URL="$(sed -n 's/^DISCORD_WEBHOOK_URL=//p' "$MONITOR_ENV" | tail -n 1)"
[[ -n "$DISCORD_WEBHOOK_URL" ]] || fail "DISCORD_WEBHOOK_URL is missing from $MONITOR_ENV"

mapfile -t manifests < <(find "$BACKUP_ROOT" -maxdepth 1 -type f -name '*.archive.gz.manifest' -printf '%T@ %p\n' | sort -nr | awk '{print $2}')
((${#manifests[@]} > 0)) || fail "no backup manifest found in $BACKUP_ROOT"
manifest="${manifests[0]}"
archive="${manifest%.manifest}"
checksum="${archive}.sha256"
[[ -f "$archive" && -f "$checksum" ]] || fail "archive or checksum is missing"

(
  cd "$BACKUP_ROOT"
  sha256sum --check -- "$(basename "$checksum")" >/dev/null
)

stamp="$(basename "$archive" .archive.gz)"
bundle="$BACKUP_ROOT/${stamp}.backup.tar