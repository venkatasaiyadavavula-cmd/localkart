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

echo "--- PM2 restart ---"
pm2 restart localkart-backend localkart-frontend
pm2 save
pm2 status

echo "=== Deploy complete ==="
