#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE — Database Seed Script
# Seeds or refreshes initial default data (admins, fleet, pricing, tours, SEO)
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

echo "============================================================"
echo "🌱 Seeding Database Initial Content & Default Roles"
echo "============================================================"

if [[ -f "${BACKEND_DIR}/.venv/bin/python3" ]]; then
    PYTHON_BIN="${BACKEND_DIR}/.venv/bin/python3"
else
    PYTHON_BIN="python3"
fi

cd "${BACKEND_DIR}"
"${PYTHON_BIN}" migrate.py "$@"

echo ""
echo "============================================================"
echo "✅ Seeding verification completed!"
echo "Default Accounts:"
echo "  - Super Admin : admin   / admin123"
echo "  - Manager     : manager / manager123"
echo "  - Staff       : staff   / staff123"
echo "  - Editor      : editor  / editor123"
echo "============================================================"
