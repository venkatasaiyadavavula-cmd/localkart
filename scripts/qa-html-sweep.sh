#!/usr/bin/env bash
# HTML sanity sweep — catches issues HTTP 200 checks miss (missing CSS refs, error strings in HTML).
set -euo pipefail

SITE="${SITE_URL:-https://localkart.store}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

pass=0
fail=0
warn=0
ok()   { echo "✅ $1"; pass=$((pass + 1)); }
bad()  { echo "❌ $1"; fail=$((fail + 1)); }
note() { echo "⚠️  $1"; warn=$((warn + 1)); }

# Strip script/style blocks so Next.js hydration JSON doesn't false-positive on "undefined".
strip_scripts() {
  echo "$1" | sed -E 's/<script[^>]*>.*<\/script>//gI; s/<style[^>]*>.*<\/style>//gI'
}

PAGES=(
  /
  /browse
  /browse/groceries
  /login
  /register
  /cart
  /checkout
  /dashboard
  /admin
  /work/login
)

echo "=== HTML sanity sweep: $SITE ==="

for path in "${PAGES[@]}"; do
  html=$(curl -sS --max-time 20 -L "$SITE$path" 2>/dev/null || echo "")
  if [ -z "$html" ]; then
    bad "$path — empty response"
    continue
  fi

  if echo "$html" | grep -qE '/_next/static/(css|chunks)/'; then
    ok "$path — has static asset refs"
  else
    bad "$path — no /_next/static references in HTML"
  fi

  body=$(strip_scripts "$html")
  if echo "$body" | grep -qiE '>undefined<|>NaN<|\[object Object\]|Internal Server Error'; then
    bad "$path — error/placeholder text in HTML body"
  else
    ok "$path — no obvious error strings"
  fi

  if echo "$body" | grep -qiE 'src="undefined"|src=""|src="#"'; then
    note "$path — suspicious empty image src"
  fi
done

if SITE_URL="$SITE" bash "$SCRIPT_DIR/verify-static-assets.sh" >/tmp/verify-static.out 2>&1; then
  ok "$(grep '^OK:' /tmp/verify-static.out | head -1 | sed 's/^OK: //')"
else
  bad "$(grep '^FAIL:' /tmp/verify-static.out | head -1 | sed 's/^FAIL: //')"
fi

echo ""
echo "Passed: $pass | Failed: $fail | Warnings: $warn"
[ "$fail" -eq 0 ]
