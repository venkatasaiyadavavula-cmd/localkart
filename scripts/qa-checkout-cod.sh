#!/usr/bin/env bash
# Post-deploy COD checkout test — uses Kadapa coords within 10 km of seed shop
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/qa-throttle-bypass.sh
source "$ROOT/scripts/qa-throttle-bypass.sh"
qa_throttle_init_curl_headers

API="${API_URL:-https://api.localkart.store/api/v1}"
CUSTOMER_PHONE="${CUSTOMER_PHONE:-9876512345}"
CUSTOMER_PASS="${CUSTOMER_PASS:-Customer@123}"

pass=0
fail=0
ok() { echo "✅ $1"; pass=$((pass + 1)); }
bad() { echo "❌ $1"; fail=$((fail + 1)); }

echo "=== COD Checkout QA ==="

TOKEN=$(curl -sS --max-time 15 -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  "${QA_THROTTLE_CURL_HEADERS[@]}" \
  -d "{\"phone\":\"$CUSTOMER_PHONE\",\"password\":\"$CUSTOMER_PASS\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))")

[ -n "$TOKEN" ] && ok "Customer login" || { bad "Customer login"; exit 1; }

PRODUCT_ID=$(curl -sS --max-time 15 "${QA_THROTTLE_CURL_HEADERS[@]}" "$API/catalog/products?limit=50" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d if isinstance(d,list) else d.get('data',[])
if isinstance(items,dict): items=items.get('items') or items.get('products') or []
for p in items:
  stock=int(p.get('stock',0) or 0)
  shop_open=p.get('shop',{}).get('isCurrentlyOpen')
  if stock > 0 and shop_open is not False:
    print(p['id']); break
else:
  print(items[0]['id'] if items else '')
")

[ -n "$PRODUCT_ID" ] && ok "Product found ($PRODUCT_ID)" || { bad "No products"; exit 1; }

curl -sS -X DELETE "${QA_THROTTLE_CURL_HEADERS[@]}" "$API/cart" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true
ADD_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$API/cart/items" \
  "${QA_THROTTLE_CURL_HEADERS[@]}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}")
[ "$ADD_HTTP" = "200" ] || [ "$ADD_HTTP" = "201" ] && ok "Add to cart ($ADD_HTTP)" || bad "Add to cart ($ADD_HTTP)"

ORDER_RESP=$(curl -sS --max-time 30 -X POST "$API/orders" \
  "${QA_THROTTLE_CURL_HEADERS[@]}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "cod",
    "shippingAddress": {
      "name": "QA Test",
      "phone": "+919876512345",
      "address": "Near RTC Bus Stand, Kadapa",
      "city": "Kadapa",
      "state": "Andhra Pradesh",
      "pincode": "516001",
      "latitude": 14.4673,
      "longitude": 78.8242
    },
    "deliveryNotes": "QA COD smoke test"
  }')

ORDER_ID=$(echo "$ORDER_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id', d.get('data',{}).get('id','')))" 2>/dev/null || true)
if [ -n "$ORDER_ID" ]; then
  ok "COD order created ($ORDER_ID)"
else
  MSG=$(echo "$ORDER_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message','unknown'))" 2>/dev/null || echo "$ORDER_RESP")
  bad "COD order failed: $MSG"
fi

echo ""
echo "Passed: $pass | Failed: $fail"
[ "$fail" -eq 0 ]
