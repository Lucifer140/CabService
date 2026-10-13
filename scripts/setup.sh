#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE — One-Command Project Setup & Bootstrap
# Sets up virtual environments, installs dependencies, initializes configs and DB.
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo "============================================================"
echo "⚡ Bootstrapping Sangita Travels Pune Full-Stack Project"
echo "============================================================"

# 1. Environment files
echo ""
echo "🔹 [1/4] Configuring environment files..."
if [[ ! -f "${BACKEND_DIR}/.env" && -f "${BACKEND_DIR}/.env.example" ]]; then
    cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
    echo "  [+] Created backend/.env"
fi

if [[ ! -f "${FRONTEND_DIR}/.env" && -f "${FRONTEND_DIR}/.env.example" ]]; then
    cp "${FRONTEND_DIR}/.env.example" "${FRONTEND_DIR}/.env"
    echo "  [+] Created frontend/.env"
fi

# 2. Backend Environment
echo ""
echo "🔹 [2/4] Setting up Python backend virtual environment..."
cd "${BACKEND_DIR}"
if [[ ! -d ".venv" ]]; then
    python3 -m venv .venv
    echo "  [+] Created backend/.venv"
fi

PYTHON_BIN="${BACKEND_DIR}/.venv/bin/python3"
PIP_BIN="${BACKEND_DIR}/.venv/bin/pip"

# Install dev dependencies if pip is available
if "${PIP_BIN}" --version &>/dev/null; then
    echo "  [+] Installing backend dev/test dependencies..."
    "${PIP_BIN}" install -q -r requirements-dev.txt || true
fi

# 3. Database Migration & Seed
echo ""
echo "🔹 [3/4] Initializing SQLite database and seeding schema..."
"${PYTHON_BIN}" migrate.py

# 4. Frontend Dependencies
echo ""
echo "🔹 [4/4] Installing frontend npm packages..."
cd "${FRONTEND_DIR}"
npm install

echo ""
echo "============================================================"
echo "🎉 Bootstrap complete! All components ready."
echo "To start development:"
echo "  make dev          # Or: ./scripts/dev.sh"
echo "============================================================"
