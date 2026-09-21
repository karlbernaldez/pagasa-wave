#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Compatibility entrypoint. Deployment implementation lives under operations/
# so validation, reporting, and deployment concerns remain grouped together.
exec bash "$SCRIPT_DIR/operations/deploy.sh" "$@"
