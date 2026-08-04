#!/usr/bin/env bash
# Burst read endpoints to confirm dashboard GETs use 300/min read throttle (no 429).
set -euo pipefail
API="${API_URL:-https://api.localkart.store/api/v1}"
ADMIN_PHONE="${ADMIN_PHONE:-9999999999}"
ADMIN_PASS="${ADMIN_PASS:-Admin@123}"
BURST="${BURST:-150}"

json_token() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('data',{}).get('accessToken',''))"
}

ADMIN_TOKEN=$(curl -sf -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$ADMIN_PHONE\",\"password\":\"$ADMIN_PASS\"}" | json_token)

if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "FAIL: admin login"
  exit 1
fi

endpoints=(
  "/admin/dashboard"
  "/admin/shops?limit=20"
  "/admin/products?limit=20"
  "/admin/customers?limit=20"
  "/admin/commissions/rates"
  "/commission/admin/summary"
  "/commission/admin/bills?limit=20"
  "/orders/admin/all?limit=20"
  "/returns/admin/all?limit=20"
  "/admin/fraud/suspicious-orders"
)

echo "Bursting ${BURST} requests across ${#endpoints[@]} admin read endpoints..."
fail_429=0
fail_other=0
ok=0

for ((i=1; i<=BURST; i++)); do
  ep="${endpoints[$((i % ${#endpoints[@]}))]}"
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$API${ep}")
  if [[ "$code" == "429" ]]; then
    ((fail_429++)) || true
  elif [[ "$code" =~ ^2 ]]; then
    ((ok++)) || true
  else
    ((fail_other++)) || true
    echo "HTTP $code on $ep"
  fi
done

echo "OK: $ok | 429: $fail_429 | other errors: $fail_other"
if [[ "$fail_429" -gt 0 ]]; then
  echo "FAIL: got 429 under burst (read throttle may not be applied)"
  exit 1
fi
echo "PASS: no 429s in burst"
