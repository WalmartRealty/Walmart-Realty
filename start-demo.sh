#!/bin/bash
# Walmart Realty — Demo Start Script
# Starts the backend server + opens the site and admin panel in browser.

set -e
cd "$(dirname "$0")/server"

echo ""
echo "============================================"
echo "   WALMART REALTY — DEMO SERVER"
echo "============================================"

# Kill any existing server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   Stopped existing server on :3000" || true
sleep 1

# Start server in background, log to /tmp
NODE_ENV=development node index.js > /tmp/walmart-realty-server.log 2>&1 &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Wait for it to be ready
for i in {1..10}; do
  if curl -s http://localhost:3000/api/properties > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "   ✅  Server running at: http://localhost:3000"
echo "   🏠  Public site:       http://localhost:3000/index.html"
echo "   🔑  Admin panel:       http://localhost:3000/admin.html"
echo "   👤  Login:             admin / admin123"
echo "   📋  Server log:        /tmp/walmart-realty-server.log"
echo "============================================"
echo ""

# Open browser (Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:3000/index.html"
  sleep 1
  open "http://localhost:3000/admin.html"
fi

echo "   Press Ctrl+C to stop the server."
wait $SERVER_PID
