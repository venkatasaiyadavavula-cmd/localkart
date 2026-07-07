#!/usr/bin/env bash
# Razorpay readiness check — run after keys are configured on server
set -euo pipefail

API="${API_URL:-https://api.localkart.store/api/v1}"
CUSTOMER_PHONE="${CUSTOMER_PHONE:-9876512345}"
CUSTOMER_PASS="${CUSTOMER_PASS:-Customer@123}"

pass=0
fail=0
ok() { echo "✅ $1"; pass=$((pass + 1)); }
bad() { echo "❌ $1"; fail=$((fail + 1)); }

echo "=== Razorpay / Payments QA ==="

# Unauthenticated should be 401
UNAUTH=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$API/payments/create-order" \
  -H "Content-Type: application/json" -d '{"orderId":"test"}')
[ "$UNAUTH" = "401" ] && ok "Auth guard (401 without token)" || bad "Auth guard ($UNAUTH)"

TOKEN=$(curl -sS --max-time 15 -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$CUSTOMER_PHONE\",\"password\":\"$CUSTOMER_PASS\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

if [ -z "$TOKEN" ]; then
  bad "Customer login failed"
  exit 1
fi
ok "Customer login"

# With token but fake order — 503 if disabled, 404 if enabled but order missing
AUTH_RESP=$(curl -sS --max-time 15 -w "\n%{http_code}" -X POST "$API/payments/create-order" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"00000000-0000-0000-0000-000000000000"}')
HTTP=$(echo "$AUTH_RESP" | tail -1)
BODY=$(echo "$AUTH_RESP" | sed '$d')

case "$HTTP" in
  503)
    bad "Payments disabled (PAYMENTS_ENABLED != true or keys missing)"
    echo "   → Set PAYMENTS_ENABLED=true + RAZORPAY_KEY_ID/SECRET in backend/.env, restart PM2"
    ;;
  404)
    ok "Payments enabled (404 for missing order — gateway ready)"
    ;;
  400)
    ok "Payments enabled (400 — gateway responding)"
    ;;
  *)
    bad "Unexpected payments response ($HTTP): $BODY"
    ;;
esac

echo ""
echo "Passed: $pass | Failed: $fail"
[ "$fail" -eq 0 ]
