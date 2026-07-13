#!/usr/bin/env bash
set -euo pipefail

# Deploy from a local machine: build UI here, upload dist, restart API on server.
#
# Usage:
#   DEPLOY_HOST=user@server ./deploy/publish.sh
#   DEPLOY_HOST=user@server DEPLOY_PATH=/opt/grow_app ./deploy/publish.sh
#
# Requires: ssh, Node.js locally (rsync optional — falls back to tar over ssh)

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_HOST="${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. growapp@203.0.113.10)}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/grow_app}"

echo "==> Build UI locally"
"$APP_DIR/deploy/build-ui.sh"

echo "==> Upload ui/dist to $DEPLOY_HOST:$DEPLOY_PATH"
if command -v rsync >/dev/null 2>&1; then
  rsync -avz --delete "$APP_DIR/ui/dist/" "$DEPLOY_HOST:$DEPLOY_PATH/ui/dist/"
else
  echo "    rsync not found, using tar over ssh"
  ssh "$DEPLOY_HOST" "rm -rf '$DEPLOY_PATH/ui/dist' && mkdir -p '$DEPLOY_PATH/ui'"
  tar -czf - -C "$APP_DIR/ui" dist | ssh "$DEPLOY_HOST" "tar -xzf - -C '$DEPLOY_PATH/ui'"
fi

echo "==> Update API on server and restart PM2"
ssh "$DEPLOY_HOST" "cd '$DEPLOY_PATH' && git pull && ./deploy/deploy.sh --skip-ui-build"

echo "==> Publish finished"
