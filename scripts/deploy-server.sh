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
# Always run via `next start` — standalone server.js omits .next/static unless copied.
pm2 delete localkart-frontend 2>/dev/null || true
pm2 start ecosystem.config.cjs --cwd "$APP_DIR/frontend"
pm2 save
pm2 status

echo "--- Verify static assets ---"
SITE_URL="${SITE_URL:-https://localkart.store}" bash "$APP_DIR/scripts/verify-static-assets.sh"

echo "=== Deploy complete ==="
