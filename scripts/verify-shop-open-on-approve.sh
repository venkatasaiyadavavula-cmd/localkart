#!/usr/bin/env bash
set -euo pipefail
API="${API_URL:-https://api.localkart.store/api/v1}"
SELLER_PHONE="${SELLER_PHONE:-8832102208}"
PASSWORD="${PASSWORD:-OpenShopTest@123}"
SUFFIX="${SUFFIX:-$(date +%s | tail -c 9)}"

json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print($1)" 2>/dev/null || true
}

if [[ -z "${SELLER_PHONE}" ]]; then
  SELLER_PHONE="8${SUFFIX}"
  CUSTOMER_PHONE="7${SUFFIX}"
  PASSWORD="OpenShopTest@123"
  echo "Registering seller $SELLER_PHONE and customer $CUSTOMER_PHONE"
  curl -sf -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    -d "{\"name\":\"Seller $SUFFIX\",\"phone\":\"$SELLER_PHONE\",\"password\":\"$PASSWORD\"}"
  curl -sf -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    -d "{\"name\":\"Customer $SUFFIX\",\"phone\":\"$CUSTOMER_PHONE\",\"password\":\"$PASSWORD\"}"
  echo "Run seller onboarding UI separately or use existing pending shop"
fi

SELLER_TOKEN=$(curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$SELLER_PHONE\",\"password\":\"$PASSWORD\"}" | json_field "d.get('accessToken') or d.get('data',{}).get('accessToken')")

PROFILE=$(curl -sf "$API/users/profile" -H "Authorization: Bearer $SELLER_TOKEN")
SHOP_ID=$(echo "$PROFILE" | json_field "d.get('data',d).get('shop',{}).get('id') or d.get('shop',{}).get('id')")
SHOP_STATUS=$(echo "$PROFILE" | json_field "d.get('data',d).get('shop',{}).get('status') or d.get('shop',{}).get('status')")
SHOP_OVERRIDE=$(echo "$PROFILE" | json_field "d.get('data',d).get('shop',{}).get('manualOverride') or d.get('shop',{}).get('manualOverride')")

echo "Shop $SHOP_ID status=$SHOP_STATUS manualOverride=$SHOP_OVERRIDE"

ADMIN_TOKEN=$(curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"phone":"9999999999","password":"Admin@123"}' | json_field "d.get('accessToken') or d.get('data',{}).get('accessToken')")

if [[ "$SHOP_STATUS" != "approved" ]]; then
  echo "Approving shop..."
  APPROVED=$(curl -sf -X PUT "$API/admin/shops/$SHOP_ID/approve" -H "Authorization: Bearer $ADMIN_TOKEN")
  echo "$APPROVED" | python3 -m json.tool | head -20
else
  echo "Shop already approved"
  APPROVED="$PROFILE"
fi

OV=$(echo "$APPROVED" | json_field "d.get('manualOverride') or d.get('data',{}).get('shop',{}).get('manualOverride') or d.get('data',d).get('shop',{}).get('manualOverride')")
echo "After approve manualOverride=$OV"
[[ "$OV" == "none" ]] || { echo "FAIL: expected manualOverride=none"; exit 1; }

PUBLIC=$(curl -sf "$API/seller/shop/id/$SHOP_ID")
OPEN=$(echo "$PUBLIC" | json_field "d.get('data',d).get('isCurrentlyOpen')")
echo "isCurrentlyOpen=$OPEN"
[[ "$OPEN" == "True" ]] || [[ "$OPEN" == "true" ]] || { echo "FAIL: shop not open"; exit 1; }

PRODUCT_NAME="Open Test Product $SUFFIX"
PROD=$(curl -sf -X POST "$API/catalog/seller/products" \
  -H "Authorization: Bearer $SELLER_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"name\":\"$PRODUCT_NAME\",\"description\":\"test\",\"price\":25,\"stock\":5,\"categoryType\":\"groceries\"}")
PRODUCT_ID=$(echo "$PROD" | json_field "d.get('id') or d.get('data',{}).get('id')")
echo "Product $PRODUCT_ID created"
curl -sf -X PUT "$API/admin/products/$PRODUCT_ID/approve" -H "Authorization: Bearer $ADMIN_TOKEN"

CUSTOMER_PHONE="${CUSTOMER_PHONE:-7${SUFFIX}}"
CUST_TOKEN=$(curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$CUSTOMER_PHONE\",\"password\":\"$PASSWORD\"}" | json_field "d.get('accessToken') or d.get('data',{}).get('accessToken')")

ADD=$(curl -s -w "\n%{http_code}" -X POST "$API/cart/items" \
  -H "Authorization: Bearer $CUST_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}")
HTTP=$(echo "$ADD" | tail -1)
BODY=$(echo "$ADD" | head -n -1)
echo "Add to cart HTTP $HTTP"
[[ "$HTTP" == "200" ]] || [[ "$HTTP" == "201" ]] || { echo "$BODY"; exit 1; }

echo "Force closing shop..."
curl -sf -X PUT "$API/seller/shop/toggle" \
  -H "Authorization: Bearer $SELLER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"manualOverride":"force_closed"}'

ADD_CLOSED=$(curl -s -w "\n%{http_code}" -X POST "$API/cart/items" \
  -H "Authorization: Bearer $CUST_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}")
HTTP2=$(echo "$ADD_CLOSED" | tail -1)
BODY2=$(echo "$ADD_CLOSED" | head -n -1)
echo "Add when closed HTTP $HTTP2 body=$BODY2"
[[ "$HTTP2" == "400" ]] || { echo "FAIL: expected 400 when closed"; exit 1; }

echo "ALL CHECKS PASSED"
echo "SELLER_PHONE=$SELLER_PHONE CUSTOMER_PHONE=$CUSTOMER_PHONE SHOP_ID=$SHOP_ID"
