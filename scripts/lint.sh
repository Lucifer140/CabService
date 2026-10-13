#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE — Unified Linting & Quality Check
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "============================================================"
echo "🔍 Running Quality, Linter, and Style Audits"
echo "============================================================"

# 1. Frontend Checks
echo ""
echo "🔹 [1/2] Checking Frontend (Prettier, Oxlint, ESLint)..."
cd "${ROOT_DIR}/frontend"
npm run format:check
npm run lint

# 2. Backend Checks
echo ""
echo "🔹 [2/2] Checking Backend Modules..."
cd "${ROOT_DIR}/backend"
python3 -m py_compile server.py router.py migrate.py core/*.py controllers/*.py repositories/*.py

# If ruff is installed in .venv, run it
if [[ -x "${ROOT_DIR}/backend/.venv/bin/ruff" ]]; then
    "${ROOT_DIR}/backend/.venv/bin/ruff" check .
elif command -v ruff &>/dev/null; then
    ruff check .
fi

echo ""
echo "============================================================"
echo "✅ All code quality and linting checks passed!"
echo "============================================================"
