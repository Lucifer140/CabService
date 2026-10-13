#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE — Production Build Script
# Compiles frontend assets into frontend/dist and validates backend modules.
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "============================================================"
echo "📦 Building Sangita Travels Pune (Production)"
echo "============================================================"

# 1. Frontend Build
echo ""
echo "🔹 [1/2] Building frontend SPA with TypeScript and Vite..."
cd "${ROOT_DIR}/frontend"
npm run build
echo "✅ Frontend build successfully compiled into frontend/dist/"

# 2. Backend Validation
echo ""
echo "🔹 [2/2] Validating Python backend syntax and compilation..."
cd "${ROOT_DIR}/backend"
python3 -m py_compile server.py router.py migrate.py core/*.py controllers/*.py repositories/*.py
echo "✅ Backend modules compiled successfully with zero syntax errors."

echo ""
echo "============================================================"
echo "🎉 Build completed successfully!"
echo "To serve production locally: cd backend && python3 server.py"
echo "============================================================"
