#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE — Start Unified Development Environment
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "${SCRIPT_DIR}/dev.py" "$@"
