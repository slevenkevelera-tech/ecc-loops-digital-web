#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT/backend"
if [ ! -d node_modules ]; then
  npm install --silent
fi
node server.js &
BACKEND_PID=$!

cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install --silent
fi

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

npm run dev
