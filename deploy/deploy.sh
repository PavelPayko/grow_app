#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKIP_UI_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --skip-ui-build) SKIP_UI_BUILD=1 ;;
    -h|--help)
      echo "Usage: $0 [--skip-ui-build]"
      echo "  --skip-ui-build  Only API + PM2; ui/dist must already exist (see deploy/publish.sh)"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

echo "==> API: install dependencies"
cd "$APP_DIR/api"
npm ci --omit=dev

if [[ "$SKIP_UI_BUILD" -eq 1 ]]; then
  if [[ ! -d "$APP_DIR/ui/dist" ]] || [[ -z "$(ls -A "$APP_DIR/ui/dist" 2>/dev/null)" ]]; then
    echo "ERROR: ui/dist is missing. Build locally: ./deploy/build-ui.sh" >&2
    echo "       Or upload from your machine: DEPLOY_HOST=user@host ./deploy/publish.sh" >&2
    exit 1
  fi
  echo "==> UI: skip build (using existing ui/dist)"
else
  echo "==> UI: install dependencies and build"
  cd "$APP_DIR/ui"
  npm ci
  npm run build
fi

echo "==> API: restart via PM2"
cd "$APP_DIR"
pm2 startOrRestart ecosystem.config.cjs --env production

echo "==> Deploy finished"
echo "    UI build: $APP_DIR/ui/dist"
echo "    API:      pm2 status grow-api"