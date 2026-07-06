#!/usr/bin/env bash
# LocalKart E2E smoke test — run against production or staging
set -euo pipefail

SITE="${SITE_URL:-https://localkart.store}"
API="${API_URL:-https://api.localkart.store/api/v1}"

pass=0
fail=0

check() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -L "$url" || echo "000")
  if [[ "$code" == "$expected" ]]; then
    echo "✅ $label ($code)"
    pass=$((pass + 1))
  else
    echo "❌ $label — expected $expected, got $code ($url)"
    fail=$((fail + 1))
  fi
}

check_post() {
  local label="$1"
  local url="$2"
  local body="$3"
  local expected="${4:-200}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$url" \
    -H "Content-Type: application/json" -d "$body" || echo "000")
  if [[ "$code" == "$expected" ]]; then
    echo "✅ $label ($code)"
    pass=$((pass + 1))
  else
    echo "❌ $label — expected $expected, got $code ($url)"
    fail=$((fail + 1))
  fi
}

echo "=== LocalKart Smoke Test ==="
echo "Site: $SITE"
echo "API:  $API"
echo ""

echo "--- Frontend Pages ---"
for path in / /login /register /browse /browse/groceries /cart /checkout /wishlist /videos /orders/track /work/login /dashboard /seller-onboarding /about /privacy /terms /browse?sale=true; do
  check "page $path" "$SITE$path"
done

echo ""
echo "--- API Endpoints ---"
check "GET /catalog/products" "$API/catalog/products"
check "GET /catalog/categories" "$API/catalog/categories"
check "GET /catalog/today-offers" "$API/catalog/today-offers"
check "GET /catalog/featured-videos" "$API/catalog/featured-videos"
check_post "POST /auth/login (bad creds → 401)" "$API/auth/login" '{"email":"test@test.com","password":"wrong"}' "401"

echo ""
echo "--- Summary ---"
echo "Passed: $pass"
echo "Failed: $fail"

if [[ $fail -gt 0 ]]; then
  exit 1
fi
