#!/usr/bin/env bash
# Production deploy — run on DigitalOcean server (also called from GitHub Actions)
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/localkart}"
BRANCH="${DEPLOY_BRANCH:-main}"

echo "=== LocalKart deploy ==="
echo "Dir: $APP_DIR | Branch: $BRANCH"
date

cd "$APP_DIR"

echo "--- Git pull ---"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "--- Backend ---"
cd "$APP_DIR/backend"
npm ci
npm run build
npm run migration:run

echo "--- Frontend ---"
cd "$APP_DIR/frontend"
npm ci
npm run build
bash scripts/copy-standalone-assets.sh

echo "--- PM2 restart ---"
pm2 restart localkart-backend
if pm2 describe localkart-frontend 2>/dev/null | grep -qE 'standalone/server|server\.js'; then
  echo "Recreating frontend PM2 process (was standalone server.js → npm start)"
  pm2 delete localkart-frontend
  HOSTNAME=0.0.0.0 PORT=3000 pm2 start npm --name localkart-frontend --cwd "$APP_DIR/frontend" -- start
else
  pm2 restart localkart-frontend
fi
pm2 save
pm2 status

echo "=== Deploy complete ==="
