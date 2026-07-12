#!/usr/bin/env bash
# Security regression checks — run against deployed API (default: production).
set -euo pipefail

API="${API_URL:-https://api.localkart.store/api/v1}"
PASS=0
FAIL=0

ok() { echo "✅ $1"; PASS=$((PASS + 1)); }
bad() { echo "❌ $1"; FAIL=$((FAIL + 1)); }

echo "=== LocalKart security smoke ==="
echo "API: $API"

CUST_PHONE="${CUST_PHONE:-9876512345}"
CUST_PASS="${CUST_PASS:-Customer@123}"
SELL_PHONE="${SELL_PHONE:-9988776655}"
SELL_PASS="${SELL_PASS:-Shop@123}"
STAFF_ID="${STAFF_ID:-qa_test_worker}"
STAFF_PASS="${STAFF_PASS:-Test@1234}"

# ── Security headers (Helmet) ───────────────────────────────────────────────
echo "--- Security headers ---"
HEADERS=$(curl -sSI "$API/catalog/products" | tr -d '\r')
if echo "$HEADERS" | grep -qi 'x-content-type-options'; then
  ok "X-Content-Type-Options header present"
else
  bad "missing X-Content-Type-Options (Helmet may not be active)"
fi

# ── SQL injection probe (should not 500 on production) ───────────────────────
echo "--- SQLi probe on search ---"
CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$API/catalog/products?query=%27%20OR%201%3D1--")
if [ "$CODE" = "200" ] || [ "$CODE" = "400" ]; then
  ok "SQLi probe handled safely (HTTP $CODE)"
elif [ "$CODE" = "500" ] && [[ "$API" == *localhost* ]]; then
  echo "⚠️ skip SQLi probe (local DB incomplete — HTTP 500)"
else
  bad "SQLi probe unexpected response (HTTP $CODE)"
fi

# ── Auth: obtain tokens BEFORE throttle burst ────────────────────────────────
echo "--- Auth token checks ---"
LOGIN=$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$CUST_PHONE\",\"password\":\"$CUST_PASS\"}")
ACCESS=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or d).get('accessToken',''))" 2>/dev/null || true)
REFRESH=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or d).get('refreshToken',''))" 2>/dev/null || true)

if [ -n "$REFRESH" ]; then
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$API/users/profile" -H "Authorization: Bearer $REFRESH")
  if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
    ok "refresh token rejected on protected route (HTTP $CODE)"
  else
    bad "refresh token accepted as access token (HTTP $CODE)"
  fi
else
  echo "⚠️ skip refresh-token test (customer login failed: $(echo "$LOGIN" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("message",""))' 2>/dev/null))"
fi

if [ -n "$ACCESS" ]; then
  TAMPERED="${ACCESS}x"
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$API/users/profile" -H "Authorization: Bearer $TAMPERED")
  if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
    ok "tampered JWT rejected (HTTP $CODE)"
  else
    bad "tampered JWT accepted (HTTP $CODE)"
  fi
else
  echo "⚠️ skip tampered JWT test"
fi

SELL_LOGIN=$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"phone\":\"$SELL_PHONE\",\"password\":\"$SELL_PASS\"}")
SELL_TOKEN=$(echo "$SELL_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or d).get('accessToken',''))" 2>/dev/null || true)

# ── IDOR: customer A cannot read customer B order ─────────────────────────────
echo "--- IDOR: cross-customer order ---"
if [ -n "$ACCESS" ] && [ -n "$SELL_TOKEN" ]; then
  ORDERS=$(curl -sS "$API/orders/seller/all?limit=1" -H "Authorization: Bearer $SELL_TOKEN")
  VICTIM_ORDER=$(echo "$ORDERS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
data=d.get('data') or d
orders=data if isinstance(data,list) else data.get('data',[])
print(orders[0]['id'] if orders else '')
" 2>/dev/null || true)
  if [ -n "$VICTIM_ORDER" ]; then
    CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$API/orders/$VICTIM_ORDER" -H "Authorization: Bearer $ACCESS")
    if [ "$CODE" = "403" ] || [ "$CODE" = "404" ]; then
      ok "customer cannot read seller order by ID (HTTP $CODE)"
    else
      bad "IDOR: customer read seller order (HTTP $CODE)"
    fi
  else
    echo "⚠️ skip IDOR order test (no seller orders)"
  fi
else
  echo "⚠️ skip IDOR order test (login failed)"
fi

# ── Staff isolation: staff token cannot hit /orders ───────────────────────────
echo "--- Staff token isolation ---"
STAFF_LOGIN=$(curl -sS -X POST "$API/seller/staff/login" -H 'Content-Type: application/json' \
  -d "{\"staffId\":\"$STAFF_ID\",\"password\":\"$STAFF_PASS\"}")
STAFF_TOKEN=$(echo "$STAFF_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or (d.get('data') or {}).get('token',''))" 2>/dev/null || true)
if [ -n "$STAFF_TOKEN" ]; then
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$API/orders" -H "Authorization: Bearer $STAFF_TOKEN")
  if [ "$CODE" = "403" ]; then
    ok "staff token blocked from /orders (HTTP 403)"
  else
    bad "staff token reached /orders (HTTP $CODE)"
  fi
else
  echo "⚠️ skip staff isolation (staff login failed)"
fi

# ── Media IDOR: signed URL for another user's key ─────────────────────────────
echo "--- IDOR: media signed-url ---"
if [ -n "$ACCESS" ]; then
  FAKE_KEY="avatars/00000000-0000-0000-0000-000000000001/secret.jpg"
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$API/media/signed-url/$FAKE_KEY" -H "Authorization: Bearer $ACCESS")
  if [ "$CODE" = "403" ] || [ "$CODE" = "404" ] || [ "$CODE" = "400" ]; then
    ok "media signed-url denied for foreign key (HTTP $CODE)"
  else
    bad "media signed-url IDOR (HTTP $CODE)"
  fi
else
  echo "⚠️ skip media IDOR test"
fi

# ── Address mass-assignment: userId cannot be reassigned ─────────────────────
echo "--- Address userId mass-assignment ---"
if [ -n "$ACCESS" ]; then
  ADDR=$(curl -sS -X POST "$API/addresses" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
    -d '{"label":"SecurityTest","fullAddress":"123 Test Lane"}')
  ADDR_ID=$(echo "$ADDR" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or d).get('id',''))" 2>/dev/null || true)
  if [ -n "$ADDR_ID" ]; then
    PUT_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X PUT "$API/addresses/$ADDR_ID" \
      -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
      -d '{"userId":"00000000-0000-0000-0000-000000000001","fullAddress":"Injected"}')
  if [ "$PUT_CODE" = "400" ]; then
      ok "address update rejects foreign userId field (HTTP 400)"
    else
      AFTER=$(curl -sS "$API/addresses/$ADDR_ID" -H "Authorization: Bearer $ACCESS" 2>/dev/null || curl -sS "$API/addresses" -H "Authorization: Bearer $ACCESS")
      LEAKED=$(echo "$AFTER" | python3 -c "
import sys,json
d=json.load(sys.stdin)
data=d.get('data') or d
items=data if isinstance(data,list) else [data]
for a in items:
  if a.get('fullAddress')=='Injected' and a.get('userId')=='00000000-0000-0000-0000-000000000001':
    print('yes'); break
" 2>/dev/null || true)
      if [ "$LEAKED" = "yes" ]; then
        bad "address userId mass-assignment succeeded"
      else
        ok "address userId not reassigned via PUT"
      fi
    fi
    curl -sS -o /dev/null -X DELETE "$API/addresses/$ADDR_ID" -H "Authorization: Bearer $ACCESS" 2>/dev/null || true
  else
    echo "⚠️ skip address mass-assignment (could not create address)"
  fi
else
  echo "⚠️ skip address mass-assignment"
fi

# ── Auth: login throttle LAST (expect 429 after burst) ────────────────────────
echo "--- Rate limit: login ---"
THROTTLE_HITS=0
for i in $(seq 1 15); do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"phone":"0000000000","password":"wrong"}' || echo "000")
  if [ "$CODE" = "429" ]; then
    THROTTLE_HITS=$((THROTTLE_HITS + 1))
  fi
done
if [ "$THROTTLE_HITS" -ge 1 ]; then
  ok "login endpoint throttled (429 observed)"
else
  bad "login endpoint not throttled after 15 rapid attempts"
fi

echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
