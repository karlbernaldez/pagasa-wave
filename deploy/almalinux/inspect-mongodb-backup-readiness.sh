#!/usr/bin/env bash
set -euo pipefail

# Read-only production inspection for MongoDB backup and restore planning.
# This script does not create backups, restore data, change users, or modify MongoDB.

ENV_FILE="${ENV_FILE:-/etc/wavelab/backend.env}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/wavelab/mongodb}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

section() {
  printf '\n== %s ==\n' "$1"
}

[[ -r "$ENV_FILE" ]] || fail "cannot read $ENV_FILE; run with appropriate privileges"

# Read the value without sourcing the environment file. Never print the URI.
MONGO_URI="$(sed -n 's/^MONGO_URI=//p' "$ENV_FILE" | tail -n 1)"
[[ -n "$MONGO_URI" ]] || fail "MONGO_URI is missing from $ENV_FILE"

section "Host"
printf 'hostname: %s\n' "$(hostname --fqdn 2>/dev/null || hostname)"
printf 'timestamp_utc: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'kernel: %s\n' "$(uname -r)"
if [[ -r /etc/os-release ]]; then
  . /etc/os-release
  printf 'os: %s\n' "${PRETTY_NAME:-unknown}"
fi

section "MongoDB database tools"
for tool in mongosh mongodump mongorestore; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf '%s: %s\n' "$tool" "$(command -v "$tool")"
    "$tool" --version 2>/dev/null | head -n 1 || true
  else
    printf '%s: NOT INSTALLED\n' "$tool"
  fi
done

section "Filesystem capacity"
printf 'configured_backup_root: %s\n' "$BACKUP_ROOT"
df -hP / "$ENV_FILE" 2>/dev/null | awk 'NR == 1 || !seen[$6]++'
if [[ -e "$BACKUP_ROOT" ]]; then
  stat -c 'backup_root_mode: %a owner=%U group=%G type=%F' "$BACKUP_ROOT"
  df -hP "$BACKUP_ROOT" | awk 'NR == 1 || NR == 2'
else
  printf 'backup_root_status: ABSENT (expected during inspection-only phase)\n'
fi

section "Service context"
for unit in wavelab-backend nginx redis; do
  if systemctl list-unit-files "$unit.service" --no-legend 2>/dev/null | grep -q "^$unit.service"; then
    printf '%s: active=%s enabled=%s\n' \
      "$unit" \
      "$(systemctl is-active "$unit" 2>/dev/null || true)" \
      "$(systemctl is-enabled "$unit" 2>/dev/null || true)"
  else
    printf '%s: unit not found\n' "$unit"
  fi
done

section "Read-only MongoDB topology and size probe"
if ! command -v mongosh >/dev/null 2>&1; then
  printf 'probe: SKIPPED because mongosh is not installed\n'
  exit 0
fi

PROBE_JS='const h=db.hello(); const s=db.stats({scale:1}); print(JSON.stringify({database:db.getName(),ok:h.ok,topology:h.setName?"replicaSet":(h.msg==="isdbgrid"?"sharded":"standalone"),replicaSet:h.setName||null,isWritablePrimary:h.isWritablePrimary===true,secondary:h.secondary===true,memberCount:Array.isArray(h.hosts)?h.hosts.length:null,collections:s.collections,views:s.views,objects:s.objects,dataSizeBytes:s.dataSize,storageSizeBytes:s.storageSize,indexSizeBytes:s.indexSize,totalSizeBytes:s.totalSize,freeStorageSizeBytes:s.freeStorageSize},null,2));'

probe_output="$(mktemp)"
probe_error="$(mktemp)"
trap 'rm -f "$probe_output" "$probe_error"' EXIT
chmod 600 "$probe_output" "$probe_error"

if timeout 30 mongosh "$MONGO_URI" --quiet --norc --eval "$PROBE_JS" >"$probe_output" 2>"$probe_error"; then
  cat "$probe_output"
  printf 'probe_result: SUCCESS\n'
else
  printf 'probe_result: FAILED\n'
  printf 'probe_error: connection or authorization failed; details withheld to avoid exposing credentials\n'
  exit 2
fi

section "Inspection result"
printf 'No MongoDB writes, backups, restores, user changes, directory creation, or service restarts were performed.\n'
