#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE — Database Migration Script
# Runs SQLite enterprise relational schema upgrades and verifies WAL mode.
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

echo "============================================================"
echo "💾 Running Database Migrations for Sangita Travels Pune"
echo "============================================================"

# Prefer virtual environment python if present
if [[ -f "${BACKEND_DIR}/.venv/bin/python3" ]]; then
    PYTHON_BIN="${BACKEND_DIR}/.venv/bin/python3"
else
    PYTHON_BIN="python3"
fi

cd "${BACKEND_DIR}"
"${PYTHON_BIN}" migrate.py "$@"

echo "============================================================"
echo "✅ Database schema migration successfully verified!"
echo "============================================================"
