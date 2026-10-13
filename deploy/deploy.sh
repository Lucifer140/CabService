#!/usr/bin/env bash
# ==============================================================================
# SANGITA TRAVELS PUNE (PUNE MUMBAI CAB) - ZERO-DOWNTIME PRODUCTION DEPLOY SCRIPT
# Pulls latest commits, applies migrations, builds frontend, and reloads services
# ==============================================================================

set -euo pipefail

APP_DIR="/var/www/punemumbaicab"
cd "$APP_DIR"

echo "🚀 [1/5] Pulling latest production release..."
git pull origin main

echo "📦 [2/5] Installing/verifying backend dependencies..."
if [ -f "backend/requirements.txt" ]; then
    pip3 install -r backend/requirements.txt --quiet
fi

echo "🗄️ [3/5] Running database schema migrations..."
python3 backend/migrate.py up

echo "🎨 [4/5] Building frontend production bundle..."
cd "$APP_DIR/frontend"
npm ci --silent
npm run build
cd "$APP_DIR"

echo "🔄 [5/5] Reloading application service..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart sangita-cab
    sudo systemctl reload nginx
fi

echo "🩺 Smoke Testing Health Endpoint..."
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health || echo "500")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Deploy SUCCESSFUL! Server is healthy (HTTP 200)."
else
    echo "❌ WARNING: Health check failed with status $HTTP_STATUS!"
    exit 1
fi
