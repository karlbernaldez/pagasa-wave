#!/usr/bin/env bash
set -euo pipefail

# Creates one supervised logical backup. This script intentionally does not:
# - schedule itself
# - delete old backups
# - stop or restart application/database services
# - run mongorestore
# - claim point-in-time consistency for a standalone MongoDB server

ENV_FILE="${ENV_FILE:-/etc/wavelab/backend.env}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/wavelab/mongodb}"
CONFIRM_TOKEN="${CONFIRM_TOKEN:-}"
LOCK_FILE="${LOCK_FILE:-/run/lock/wavelab-mongodb-backup.lock}"
MIN_FREE_KIB="${MIN_FREE_KIB:-1048576}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

section() {
  printf '\n== %s ==\n' "$1"
}

[[ "$EUID" -eq 0 ]] || fail "run as root so the protected environment and backup directory can be accessed"
[[ "$CONFIRM_TOKEN" == "CREATE_ONE_SUPERVISED_BACKUP" ]] || fail "set CONFIRM_TOKEN=CREATE_ONE_SUPERVISED_BACKUP explicitly"
[[ -r "$ENV_FILE" ]] || fail "cannot read $ENV_FILE"
command -v mongodump >/dev/null 2>&1 || fail "mongodump is not installed"
command -v mongosh >/dev/null 2>&1 || fail "mongosh is not installed"
command -v sha256sum >/dev/null 2>&1 || fail "sha256sum is not installed"
command -v flock >/dev/null 2>&1 || fail "flock is not installed"

MONGO_URI="$(sed -n 's/^MONGO_URI=//p' "$ENV_FILE" | tail -n 1)"
[[ -n "$MONGO_URI" ]] || fail "MONGO_URI is missing from $ENV_FILE"

umask 077
mkdir -p -m 0700 "$BACKUP_ROOT"
chown root:root "$BACKUP_ROOT"
chmod 0700 "$BACKUP_ROOT"

exec 9>"$LOCK_FILE"
flock -n 9 || fail "another MongoDB backup process is already running"

available_kib="$(df -Pk "$BACKUP_ROOT" | awk 'NR==2 {print $4}')"
[[ "$available_kib" =~ ^[0-9]+$ ]] || fail "could not determine available disk space"
(( available_kib >= MIN_FREE_KIB )) || fail "less than ${MIN_FREE_KIB} KiB is available at $BACKUP_ROOT"

PROBE_JS='const h=db.hello(); print(JSON.stringify({database:db.getName(),ok:h.ok,topology:h.setName?"replicaSet":(h.msg==="isdbgrid"?"sharded":"standalone"),replicaSet:h.setName||null,isWritablePrimary:h.isWritablePrimary===true}));'
probe_json="$(timeout 30 mongosh "$MONGO_URI" --quiet --norc --eval "$PROBE_JS" 2>/dev/null)" || fail "MongoDB topology probe failed"

if ! grep -q '"topology":"standalone"' <<<"$probe_json"; then
  fail "this first supervised-backup implementation is approved only for the inspected standalone topology"
fi

if ! grep -q '"isWritablePrimary":true' <<<"$probe_json"; then
  fail "the inspected standalone MongoDB server is not writable primary"
fi

database_name="$(sed -n 's/.*"database":"\([^"]*\)".*/\1/p' <<<"$probe_json")"
[[ -n "$database_name" ]] || fail "could not determine database name from MongoDB probe"
[[ "$database_name" =~ ^[A-Za-z0-9_-]+$ ]] || fail "database name contains unsupported characters"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive_name="wavelab-${database_name}-${timestamp}.archive.gz"
archive_path="$BACKUP_ROOT/$archive_name"
partial_path="$archive_path.partial"
checksum_path="$archive_path.sha256"
manifest_path="$archive_path.manifest"

[[ ! -e "$archive_path" && ! -e "$partial_path" ]] || fail "backup output already exists"

cleanup_partial() {
  rm -f -- "$partial_path"
}
trap cleanup_partial EXIT

start_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
section "Supervised MongoDB backup"
printf 'database: %s\n' "$database_name"
printf 'topology: standalone\n'
printf 'consistency: logical dump; not point-in-time consistent\n'
printf 'destination: %s\n' "$archive_path"
printf 'start_utc: %s\n' "$start_time"

# The URI is passed directly from a root-readable environment file and is never printed.
# --oplog is deliberately absent because the inspected source is standalone.
if ! timeout 30m mongodump \
  --uri="$MONGO_URI" \
  --db="$database_name" \
  --archive="$partial_path" \
  --gzip; then
  fail "mongodump failed; partial output removed"
fi

[[ -s "$partial_path" ]] || fail "mongodump produced an empty archive"
mv -- "$partial_path" "$archive_path"
chmod 0600 "$archive_path"
sha256sum "$archive_path" >"$checksum_path"
chmod 0600 "$checksum_path"
sha256sum --check "$checksum_path" >/dev/null || fail "checksum verification failed"

end_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
archive_size="$(stat -c '%s' "$archive_path")"
tool_version="$(mongodump --version 2>/dev/null | head -n 1 | tr -d '\r')"
host_name="$(hostname --fqdn 2>/dev/null || hostname)"
checksum_value="$(awk '{print $1}' "$checksum_path")"

cat >"$manifest_path" <<EOF
backup_status=UNVERIFIED_PENDING_RESTORE_TEST
source_host=$host_name
source_database=$database_name
source_topology=standalone
consistency=logical_dump_not_point_in_time_consistent
archive_file=$archive_name
archive_size_bytes=$archive_size
sha256=$checksum_value
mongodump_version=$tool_version
started_utc=$start_time
completed_utc=$end_time
retention_deletion_enabled=false
off_host_copy_verified=false
restore_test_verified=false
EOF
chmod 0600 "$manifest_path"

trap - EXIT
section "Backup result"
printf 'result: SUCCESS_UNVERIFIED\n'
printf 'archive: %s\n' "$archive_path"
printf 'checksum: %s\n' "$checksum_path"
printf 'manifest: %s\n' "$manifest_path"
printf 'archive_size_bytes: %s\n' "$archive_size"
printf 'completed_utc: %s\n' "$end_time"
printf 'next_required_gate: verify checksum, copy off-host, then restore only into an isolated non-production MongoDB instance\n'
printf 'No restore, scheduling, retention deletion, database user change, or service restart was performed.\n'
