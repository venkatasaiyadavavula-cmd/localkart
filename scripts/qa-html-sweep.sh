#!/usr/bin/env bash
# HTML sanity sweep — catches issues HTTP 200 checks miss (missing CSS refs, error strings in HTML).
set -euo pipefail

SITE="${SITE_URL:-https://localkart.store}"

pass=0
fail=0
warn=0
ok()   { echo "✅ $1"; pass=$((pass + 1)); }
bad()  { echo "❌ $1"; fail=$((fail + 1)); }
note() { echo "⚠️  $1"; warn=$((warn + 1)); }

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

  if echo "$html" | grep -qiE 'undefined|NaN|\[object Object\]|Internal Server Error'; then
    bad "$path — error/placeholder text in HTML body"
  else
    ok "$path — no obvious error strings"
  fi

  if echo "$html" | grep -qiE 'src="undefined"|src=""|src="#"'; then
    note "$path — suspicious empty image src"
  fi
done

# Sample asset from homepage
home=$(curl -sS --max-time 20 -L "$SITE/")
asset=$(echo "$home" | grep -oE '/_next/static/css/[^"'"'"']+\.css' | head -1)
if [ -n "$asset" ]; then
  code=$(curl -sS -o /tmp/sweep.css -w "%{http_code}" "$SITE$asset")
  if [ "$code" = "200" ] && head -c 15 /tmp/sweep.css | grep -q '@\|body\|html\|:root'; then
    ok "homepage CSS bundle loads ($asset)"
  else
    bad "homepage CSS bundle broken ($asset HTTP $code)"
  fi
fi

echo ""
echo "Passed: $pass | Failed: $fail | Warnings: $warn"
[ "$fail" -eq 0 ]
