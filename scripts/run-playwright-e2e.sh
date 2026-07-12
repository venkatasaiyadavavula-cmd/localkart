#!/usr/bin/env bash
# Run Playwright live-site E2E against production (or SITE_URL).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="${SITE_URL:-https://localkart.store}"
API="${API_URL:-https://api.localkart.store/api/v1}"

echo "=== Playwright live-site E2E ==="
echo "Site: $SITE"
echo "API:  $API"

cd "$ROOT/e2e"
if [ ! -d node_modules ]; then
  npm ci
fi
npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium

export SITE_URL="$SITE"
export API_URL="$API"
export CUST_PHONE="${CUST_PHONE:-9876512345}"
export CUST_PASS="${CUST_PASS:-Customer@123}"
export SELL_PHONE="${SELL_PHONE:-9988776655}"
export SELL_PASS="${SELL_PASS:-Shop@123}"
export ADMIN_PHONE="${ADMIN_PHONE:-9999999999}"
export ADMIN_PASS="${ADMIN_PASS:-Admin@123}"
export STAFF_ID="${STAFF_ID:-qa_test_worker}"
export STAFF_PASS="${STAFF_PASS:-Test@1234}"
# CI-only: must match QA_THROTTLE_BYPASS_TOKEN on the API server (GitHub Actions secret).
export QA_THROTTLE_BYPASS_TOKEN="${QA_THROTTLE_BYPASS_TOKEN:-}"

# Desktop full suite (live-site.spec.ts + live-site-extended.spec.ts); mobile runs key flows
npx playwright test --project=desktop "$@"
DESKTOP_RC=$?

npx playwright test --project=mobile tests/live-site.spec.ts -g "Homepage|Staff|Browse" "$@" || true

exit $DESKTOP_RC
