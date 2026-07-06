#!/usr/bin/env bash
# Extended flow tests — staff login, shop toggle, checkout prerequisites
# Requires seed seller: 9988776655 / Shop@123
set -euo pipefail

API="${API_URL:-https://api.localkart.store/api/v1}"
SELLER_PHONE="${SELLER_PHONE:-9988776655}"
SELLER_PASS="${SELLER_PASS:-Shop@123}"
STAFF_ID="${STAFF_ID:-qa_test_worker}"
STAFF_PASS="${STAFF_PASS:-Test@1234}"

pass=0
fail=0

ok() { echo "✅ $1"; pass=$((pass + 1)); }
bad() { echo "❌ $1"; fail=$((fail + 1)); }

echo "=== Extended Flow QA ==="

SELLER_TOKEN=$(curl -sS --max-time 15 -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$SELLER_PHONE\",\"password\":\"$SELLER_PASS\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',''))")

if [ -n "$SELLER_TOKEN" ]; then ok "Seller login"; else bad "Seller login"; fi

SHOP_OPEN=$(curl -sS --max-time 15 "$API/seller/shop" -H "Authorization: Bearer $SELLER_TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('isCurrentlyOpen',''))" 2>/dev/null || echo "")
[ -n "$SHOP_OPEN" ] && ok "Shop status readable (open=$SHOP_OPEN)" || bad "Shop status"

STAFF_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$API/seller/staff/login" \
  -H "Content-Type: application/json" \
  -d "{\"staffId\":\"$STAFF_ID\",\"password\":\"$STAFF_PASS\"}")
[ "$STAFF_HTTP" = "200" ] || [ "$STAFF_HTTP" = "201" ] && ok "Staff login ($STAFF_HTTP)" || bad "Staff login ($STAFF_HTTP)"

STAFF_TOKEN=$(curl -sS --max-time 15 -X POST "$API/seller/staff/login" \
  -H "Content-Type: application/json" \
  -d "{\"staffId\":\"$STAFF_ID\",\"password\":\"$STAFF_PASS\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('data') or d; print(p.get('token',''))" 2>/dev/null || true)

if [ -n "$STAFF_TOKEN" ]; then
  ME_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$API/staff/work/me" -H "Authorization: Bearer $STAFF_TOKEN")
  [ "$ME_HTTP" = "200" ] && ok "Staff work/me" || bad "Staff work/me ($ME_HTTP)"
fi

PAY_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$API/payments/create-order" \
  -H "Content-Type: application/json" -d '{"orderId":"test"}')
[ "$PAY_HTTP" = "401" ] && ok "Payments auth guard (401)" || bad "Payments auth ($PAY_HTTP)"

echo ""
echo "Passed: $pass | Failed: $fail"
[ "$fail" -eq 0 ]
