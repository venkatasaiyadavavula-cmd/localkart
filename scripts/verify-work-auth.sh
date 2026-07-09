#!/usr/bin/env bash
# Verify staff /work routes bypass main AuthGuard (client-side redirect bug detector).
set -euo pipefail

SITE="${SITE_URL:-https://localkart.store}"

fail() { echo "FAIL: $1"; exit 1; }
ok() { echo "OK: $1"; }

html=$(curl -sS --max-time 20 -L "$SITE/work/login" 2>/dev/null || echo "")

if [ -z "$html" ]; then
  fail "/work/login returned empty response"
fi

# Staff login form markers (SSR HTML — must be present)
echo "$html" | grep -q 'data-page="work-login"' || fail "/work/login missing data-page=work-login marker"
echo "$html" | grep -q 'id="staffId"' || fail "/work/login missing staff Login ID input (id=staffId)"
echo "$html" | grep -q 'Work Login' || fail "/work/login missing Work Login heading"
echo "$html" | grep -q 'Start Working' || fail "/work/login missing Start Working submit button"

# Customer login page uses id="phone" — must not appear on /work/login body
body=$(echo "$html" | sed -E 's/<script[^>]*>.*<\/script>//gI')
if echo "$body" | grep -q 'id="phone"'; then
  fail "/work/login contains customer phone input (likely redirected to main login)"
fi

# AuthGuard bundle must skip /work paths (catches client-side redirect even when SSR HTML looks correct)
layout_chunk=$(echo "$html" | grep -oE '/_next/static/chunks/app/layout-[^"]+\.js' | head -1)
if [ -z "$layout_chunk" ]; then
  fail "could not find layout chunk reference in /work/login HTML"
fi

chunk_js=$(curl -sS --max-time 20 "$SITE$layout_chunk" 2>/dev/null || echo "")
if [ -z "$chunk_js" ]; then
  fail "could not fetch layout chunk $layout_chunk"
fi

if ! echo "$chunk_js" | grep -qE 'startsWith\("/work"\)|startsWith\(''/work''\)|"/work"'; then
  fail "AuthGuard layout chunk missing /work bypass (staff login will redirect client-side)"
fi

ok "/work/login renders staff form and AuthGuard bypasses /work routes"
