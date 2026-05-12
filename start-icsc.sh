#!/bin/bash
# ============================================================
#   WALMART REALTY — ICSC 2026 SERVER STARTUP SCRIPT
#   Run this on your laptop at the event.
#   Team members connect via the IP address shown at startup.
# ============================================================

set -e
cd "$(dirname "$0")/server"

echo ""
echo "======================================================"
echo "   🏪  WALMART REALTY — ICSC SERVER STARTUP"
echo "======================================================"

# Kill any existing server on the port
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null && \
    echo "   ✅  Stopped old server on :3000" || true
sleep 1

# ── Environment ─────────────────────────────────────────────
# Load .env if present; otherwise use defaults safe for the event
if [ -f ".env" ]; then
    echo "   📋  Loaded .env config"
    export $(grep -v '^#' .env | xargs 2>/dev/null) || true
fi

# Defaults — override in .env to add email/JWT etc.
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3000}"
export ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-WalmartRealty2024!}"

echo "   🔑  Admin login: $ADMIN_USERNAME / $ADMIN_PASSWORD"
echo "   ⚠️   Change password via admin panel after first login!"
echo ""

# ── Start server ─────────────────────────────────────────────
NODE_ENV=development node index.js &
SERVER_PID=$!

# Wait for server ready
echo "   ⏳  Starting server..."
for i in {1..15}; do
    if curl -s http://localhost:$PORT/api/properties > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

echo ""
echo "   ✅  SERVER IS READY"
echo "======================================================"
echo ""
echo "   Press Ctrl+C to stop."
echo ""

# Open browser on this machine
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:$PORT/admin.html" 2>/dev/null || true
fi

# Keep script alive (server runs as child)
wait $SERVER_PID
