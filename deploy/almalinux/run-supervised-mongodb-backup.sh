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
