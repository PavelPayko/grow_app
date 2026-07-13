#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> API: install dependencies"
cd "$APP_DIR/api"
npm ci --omit=dev

echo "==> UI: install dependencies and build"
cd "$APP_DIR/ui"
npm ci
npm run build

echo "==> API: restart via PM2"
cd "$APP_DIR"
pm2 startOrRestart ecosystem.config.cjs --env production

echo "==> Deploy finished"
echo "    UI build: $APP_DIR/ui/dist"
echo "    API:      pm2 status grow-api"
