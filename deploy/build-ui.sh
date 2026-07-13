#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> UI: install dependencies and build"
cd "$APP_DIR/ui"
npm ci
npm run build

echo "==> UI build ready: $APP_DIR/ui/dist"
