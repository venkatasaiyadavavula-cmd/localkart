#!/usr/bin/env bash
# LocalKart full regression QA — API + page smoke across all roles.
# Usage: SITE_URL=... API_URL=... ./scripts/qa-full.sh
set -euo pipefail

SITE="${SITE_URL:-https://localkart.store}"
API="${API_URL:-https://api.localkart.store/api/v1}"

CUST_PHONE="${CUST_PHONE:-9876512345}"
CUST_PASS="${CUST_PASS:-Customer@123}"
SELL_PHONE="${SELL_PHONE:-9988776655}"
SELL_PASS="${SELL_PASS:-Shop@123}"
ADMIN_PHONE="${ADMIN_PHONE:-9999999999}"
ADMIN_PASS="${ADMIN_PASS:-Admin@123}"
STAFF_ID="${STAFF_ID:-qa_test_worker}"
STAFF_PASS="${STAFF_PASS:-Test@1234}"

pass=0
fail=0
warn=0

ok()   { echo "✅ $1"; pass=$((pass + 1)); }
bad()  { echo "❌ $1"; fail=$((fail + 1)); }
note() { echo "⚠️  $1"; warn=$((warn + 1)); }

json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print($1)" 2>/dev/null || echo ""
}

http_code() {
  curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "$@"
}

post_json() {
  curl -sS --max-time 20 -X POST "$1" -H "Content-Type: application/json" "${@:2}"
}

get_auth() {
  curl -sS --max-time 20 "$1" -H "Authorization: Bearer $2"
}

echo "=============================================="
echo " LocalKart Full QA — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo " Site: $SITE"
echo " API:  $API"
echo "=============================================="
echo ""

# ── PART 5: TypeScript (local only) ─────────────────────────────
if [ -d backend/node_modules ] && [ -d frontend/node_modules ]; then
  echo "--- TypeScript ---"
  if (cd backend && npm run build >/dev/null 2>&1); then ok "backend build"; else bad "backend build"; fi
  if (cd frontend && npm run type-check >/dev/null 2>&1); then ok "frontend tsc --noEmit"; else bad "frontend tsc --noEmit"; fi
  echo ""
fi

# ── PART 5: Public pages ────────────────────────────────────────
echo "--- Frontend pages (HTTP) ---"
PAGES=(
  /
  /login
  /register
  /forgot-password
  /about
  /browse
  /browse/groceries
  /browse/fashion
  /browse/electronics
  /browse/beauty
  /browse/accessories
  /browse/home-essentials
  /browse?sale=true
  /cart
  /videos
  /terms
  /privacy
  /orders/track
  /work/login
  /seller-onboarding
  /shop/sri-venkateswara-kirana---general-store
  /checkout
  /orders
  /profile
  /wishlist
  /profile/addresses
  /dashboard
  /dashboard/orders
  /dashboard/products
  /dashboard/staff
  /dashboard/shop-settings
  /dashboard/offers
  /dashboard/ads
  /dashboard/earnings
  /dashboard/commission
  /dashboard/subscription
  /admin
  /admin/sellers
  /admin/products
  /admin/commissions
  /admin/disputes
  /admin/customers
  /admin/settings
  /work
  /work/orders
  /work/products
)
for path in "${PAGES[@]}"; do
  code=$(http_code -L "$SITE$path")
  if [ "$code" = "200" ] || [ "$code" = "307" ]; then
    ok "page $path ($code)"
  else
    bad "page $path — HTTP $code"
  fi
done
echo ""

# ── PART 1 & 5: Auth ────────────────────────────────────────────
echo "--- Auth ---"
LOGIN_BAD=$(post_json "$API/auth/login" -d '{"phone":"0000000000","password":"wrong"}' | json_field "d.get('statusCode','')")
[ "$LOGIN_BAD" = "401" ] && ok "login wrong password → 401" || bad "login wrong password (got $LOGIN_BAD)"

REG_BAD=$(http_code -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d '{"phone":"bad","password":"x","name":"T"}')
[ "$REG_BAD" = "400" ] && ok "register invalid → 400" || bad "register invalid ($REG_BAD)"

REG_DUP=$(http_code -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$CUST_PHONE\",\"password\":\"Test@1234\",\"name\":\"Dup\"}")
[ "$REG_DUP" = "400" ] && ok "register duplicate phone → 400" || bad "register duplicate ($REG_DUP)"

CUST_TOKEN=$(post_json "$API/auth/login" -d "{\"phone\":\"$CUST_PHONE\",\"password\":\"$CUST_PASS\"}" | json_field "d.get('accessToken','')")
[ -n "$CUST_TOKEN" ] && ok "customer login" || bad "customer login"

SELL_TOKEN=$(post_json "$API/auth/login" -d "{\"phone\":\"$SELL_PHONE\",\"password\":\"$SELL_PASS\"}" | json_field "d.get('accessToken','')")
[ -n "$SELL_TOKEN" ] && ok "seller login" || bad "seller login"

ADMIN_TOKEN=$(post_json "$API/auth/login" -d "{\"phone\":\"$ADMIN_PHONE\",\"password\":\"$ADMIN_PASS\"}" | json_field "d.get('accessToken','')")
[ -n "$ADMIN_TOKEN" ] && ok "admin login" || bad "admin login"

OTP_HTTP=$(http_code -X POST "$API/auth/send-otp" -H "Content-Type: application/json" \
  -d "{\"phone\":\"$CUST_PHONE\",\"mode\":\"reset_password\"}")
[ "$OTP_HTTP" = "200" ] && ok "forgot-password send-otp → 200" || note "forgot-password send-otp ($OTP_HTTP) — needs WhatsApp for full round-trip"

STAFF_RESP=$(post_json "$API/seller/staff/login" -d "{\"staffId\":\"$STAFF_ID\",\"password\":\"$STAFF_PASS\"}")
STAFF_TOKEN=$(echo "$STAFF_RESP" | json_field "(d.get('data') or d).get('token','')")
[ -n "$STAFF_TOKEN" ] && ok "staff login" || bad "staff login"

# Session / profile
PROF_HTTP=$(http_code "$API/users/profile" -H "Authorization: Bearer $CUST_TOKEN")
[ "$PROF_HTTP" = "200" ] && ok "customer profile (session)" || bad "customer profile ($PROF_HTTP)"

CUST_ON_ADMIN=$(http_code "$API/admin/dashboard" -H "Authorization: Bearer $CUST_TOKEN")
[ "$CUST_ON_ADMIN" = "401" ] || [ "$CUST_ON_ADMIN" = "403" ] && ok "customer blocked from admin" || bad "customer admin access ($CUST_ON_ADMIN)"
echo ""

# ── PART 1: Catalog, location, cart ─────────────────────────────
echo "--- Customer catalog & cart ---"
CAT_HTTP=$(http_code "$API/catalog/categories")
[ "$CAT_HTTP" = "200" ] && ok "catalog categories" || bad "catalog categories ($CAT_HTTP)"

PROD_HTTP=$(http_code "$API/catalog/products?limit=5")
[ "$PROD_HTTP" = "200" ] && ok "catalog products" || bad "catalog products ($PROD_HTTP)"

SVC=$(curl -sS "$API/location/check-serviceability?lat=14.4673&lng=78.8242")
echo "$SVC" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('serviceable') else 1)" \
  && ok "serviceability Kadapa" || bad "serviceability Kadapa"

PROD_ID=$(curl -sS "$API/catalog/products?limit=50" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d if isinstance(d,list) else (d.get('data') or d)
if isinstance(items,dict): items=items.get('items') or items.get('products') or []
for p in items:
  stock=int(p.get('stock',0) or 0)
  shop_open=p.get('shop',{}).get('isCurrentlyOpen')
  if stock > 0 and shop_open is not False:
    print(p['id'])
    break
else:
  # Fallback: first product (may fail with stock/closed errors)
  print(items[0]['id'] if items else '')
")

if [ -n "$PROD_ID" ]; then
  curl -sS -X DELETE "$API/cart" -H "Authorization: Bearer $CUST_TOKEN" >/dev/null 2>&1 || true
  ADD_HTTP=$(http_code -X POST "$API/cart/items" -H "Authorization: Bearer $CUST_TOKEN" \
    -H "Content-Type: application/json" -d "{\"productId\":\"$PROD_ID\",\"quantity\":1}")
  [ "$ADD_HTTP" = "200" ] || [ "$ADD_HTTP" = "201" ] && ok "cart add item" || bad "cart add ($ADD_HTTP)"

  CART_CNT=$(get_auth "$API/cart" "$CUST_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('items',[])))")
  [ "${CART_CNT:-0}" -ge 1 ] && ok "cart has items ($CART_CNT)" || bad "cart empty after add"
else
  note "skipped cart tests — no products"
fi

WISH_HTTP=$(http_code "$API/wishlist" -H "Authorization: Bearer $CUST_TOKEN")
[ "$WISH_HTTP" = "200" ] && ok "wishlist list" || bad "wishlist ($WISH_HTTP)"

if [ -n "$PROD_ID" ]; then
  WISH_TOGGLE=$(post_json "$API/wishlist/toggle" -H "Authorization: Bearer $CUST_TOKEN" \
    -d "{\"productId\":\"$PROD_ID\"}" | json_field "d.get('added')")
  [ "$WISH_TOGGLE" = "True" ] && ok "wishlist toggle add" || note "wishlist toggle add ($WISH_TOGGLE)"
  post_json "$API/wishlist/toggle" -H "Authorization: Bearer $CUST_TOKEN" \
    -d "{\"productId\":\"$PROD_ID\"}" >/dev/null
fi

ADDR_HTTP=$(http_code "$API/addresses" -H "Authorization: Bearer $CUST_TOKEN")
[ "$ADDR_HTTP" = "200" ] && ok "addresses list" || bad "addresses ($ADDR_HTTP)"
echo ""

# ── PART 1: COD checkout (if cart has items) ────────────────────
echo "--- COD checkout ---"
ORDER_ID=""
if [ -n "$PROD_ID" ] && [ "${CART_CNT:-0}" -ge 1 ]; then
  ORDER_RESP=$(post_json "$API/orders" -H "Authorization: Bearer $CUST_TOKEN" \
    -d '{"paymentMethod":"cod","shippingAddress":{"name":"QA","phone":"+919876512345","address":"RTC Bus Stand","city":"Kadapa","state":"Andhra Pradesh","pincode":"516001","latitude":14.4673,"longitude":78.8242}}')
  ORDER_ID=$(echo "$ORDER_RESP" | json_field "d.get('id','')")
  ORDER_STATUS=$(echo "$ORDER_RESP" | json_field "d.get('status','')")
  if [ -n "$ORDER_ID" ]; then
    ok "COD order placed ($ORDER_STATUS)"
    POST_CART=$(get_auth "$API/cart" "$CUST_TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('items',[])))")
    [ "${POST_CART:-1}" = "0" ] && ok "cart cleared after order" || bad "cart not cleared ($POST_CART items)"
  else
    bad "COD order failed: $(echo "$ORDER_RESP" | head -c 200)"
  fi
else
  note "skipped COD order — empty cart"
fi

RAZORPAY_HTTP=$(http_code -X POST "$API/orders" -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"razorpay","shippingAddress":{"name":"QA","phone":"+919876512345","address":"Test","city":"Kadapa","state":"AP","pincode":"516001","latitude":14.4673,"longitude":78.8242}}')
[ "$RAZORPAY_HTTP" = "400" ] && ok "razorpay blocked when PAYMENTS_ENABLED=false" || note "razorpay order HTTP $RAZORPAY_HTTP"

PAY_HTTP=$(http_code -X POST "$API/payments/create-order" -H "Authorization: Bearer $CUST_TOKEN" \
  -H "Content-Type: application/json" -d '{"orderId":"00000000-0000-0000-0000-000000000000"}')
[ "$PAY_HTTP" = "503" ] && ok "payments/create-order → 503 (disabled)" || note "payments create-order ($PAY_HTTP)"
echo ""

# ── PART 2: Seller ───────────────────────────────────────────────
echo "--- Seller APIs ---"
for ep in /seller/shop /seller/dashboard /catalog/seller/products /orders/seller/all \
  /seller/daily-offers /seller/ads /seller/staff /seller/earnings /seller/subscription \
  /commission/my-bills; do
  code=$(http_code "$API$ep" -H "Authorization: Bearer $SELL_TOKEN")
  [ "$code" = "200" ] && ok "seller $ep" || bad "seller $ep ($code)"
done

if [ -n "$ORDER_ID" ]; then
  SELL_ORDERS=$(get_auth "$API/orders/seller/all" "$SELL_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d.get('data') or d.get('orders') or (d if isinstance(d,list) else [])
print(len(items) if isinstance(items,list) else 0)
")
  [ "${SELL_ORDERS:-0}" -ge 1 ] && ok "seller sees orders ($SELL_ORDERS)" || bad "seller orders empty"
fi
echo ""

# ── PART 3: Staff ───────────────────────────────────────────────
echo "--- Staff APIs ---"
for ep in /staff/work/me /staff/work/orders /staff/work/products; do
  code=$(http_code "$API$ep" -H "Authorization: Bearer $STAFF_TOKEN")
  [ "$code" = "200" ] && ok "staff $ep" || bad "staff $ep ($code)"
done
echo ""

# ── PART 4: Admin ────────────────────────────────────────────────
echo "--- Admin APIs ---"
for ep in /admin/dashboard /admin/shops/pending /admin/shops /admin/products/pending \
  /admin/commissions/summary /admin/commissions/transactions /admin/fraud/suspicious-orders \
  /returns/admin/all; do
  code=$(http_code "$API$ep" -H "Authorization: Bearer $ADMIN_TOKEN")
  [ "$code" = "200" ] && ok "admin $ep" || bad "admin $ep ($code)"
done
echo ""

# ── Summary ─────────────────────────────────────────────────────
echo "=============================================="
echo " Passed: $pass | Failed: $fail | Warnings: $warn"
echo "=============================================="

[ "$fail" -eq 0 ]
