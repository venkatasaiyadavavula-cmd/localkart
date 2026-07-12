#!/usr/bin/env bash
# Fail fast if server-side QA throttle bypass is not active before Playwright.
set -euo pipefail

API="${API_URL:-https://api.localkart.store/api/v1}"
TOKEN="${QA_THROTTLE_BYPASS_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "::error::QA_THROTTLE_BYPASS_TOKEN is not set in CI environment"
  exit 1
fi

echo "=== Verify QA throttle bypass on $API ==="

HITS_429=0
for i in $(seq 1 20); do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-QA-Throttle-Bypass: $TOKEN" \
    -d '{"phone":"0000000000","password":"wrong"}' || echo "000")
  if [ "$CODE" = "429" ]; then
    HITS_429=$((HITS_429 + 1))
  fi
done

if [ "$HITS_429" -gt 0 ]; then
  echo "::error::Server rejected bypass header — $HITS_429/20 login attempts returned 429"
  echo "::error::Check backend/.env has QA_THROTTLE_BYPASS_TOKEN and pm2 was restarted after sync"
  exit 1
fi
echo "✅ Bypass active: 0/20 throttled with X-QA-Throttle-Bypass header"

# Confirm production limits still apply WITHOUT bypass
NO_BYPASS_429=0
for i in $(seq 1 15); do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"0000000000","password":"wrong"}' || echo "000")
  [ "$CODE" = "429" ] && NO_BYPASS_429=$((NO_BYPASS_429 + 1))
done
if [ "$NO_BYPASS_429" -lt 1 ]; then
  echo "::warning::Rate limit without bypass may not be active ($NO_BYPASS_429/15 got 429)"
else
  echo "✅ Production throttle still active without bypass ($NO_BYPASS_429/15 got 429)"
fi
