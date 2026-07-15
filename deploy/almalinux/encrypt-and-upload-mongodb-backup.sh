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
bundle="$BACKUP_ROOT/${stamp}.backup.tar"
encrypted="$bundle.age"
encrypted_checksum="$encrypted.sha256"
partial="$encrypted.partial"

[[ ! -e "$encrypted" && ! -e "$encrypted_checksum" ]] || fail "encrypted output already exists"
trap 'rm -f "$bundle" "$partial"' EXIT
umask 077

tar -C "$BACKUP_ROOT" -cf "$bundle" \
  "$(basename "$archive")" \
  "$(basename "$checksum")" \
  "$(basename "$manifest")"

age -r "$AGE_RECIPIENT" -o "$partial" "$bundle"
mv -f "$partial" "$encrypted"
sha256sum "$encrypted" > "$encrypted_checksum"
chmod 0600 "$encrypted" "$encrypted_checksum"

payload="$(python3 - "$stamp" "$encrypted" "$encrypted_checksum" <<'PY'
import json, os, sys
stamp, encrypted, checksum = sys.argv[1:]
size = os.path.getsize(encrypted)
sha = open(checksum, encoding='utf-8').read().split()[0]
content = (
    "🔐 WaveLab MongoDB encrypted backup copy\n"
    f"Backup: {stamp}\n"
    f"Encrypted file: {os.path.basename(encrypted)}\n"
    f"Size: {size} bytes\n"
    f"SHA-256: {sha}\n"
    "Restore verification: pending\n"
    "Consistency: logical dump, not point-in-time consistent"
)
print(json.dumps({"content": content}))
PY
)"

curl -fsS --max-time 120 \
  -F "payload_json=$payload" \
  -F "files[0]=@$encrypted;type=application/octet-stream" \
  -F "files[1]=@$encrypted_checksum;type=text/plain" \
  "$DISCORD_WEBHOOK_URL" >/dev/null

printf 'result: SUCCESS_ENCRYPTED_COPY_UPLOADED\n'
printf 'encrypted_file: %s\n' "$encrypted"
printf 'encrypted_checksum: %s\n' "$encrypted_checksum"
printf 'next_required_gate: download on a separate trusted machine, verify checksum, decrypt, and perform isolated restore testing\n'
printf 'The private age identity was not used or stored on this server.\n'
