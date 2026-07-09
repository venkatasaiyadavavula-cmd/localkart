#!/usr/bin/env bash
# Fail if homepage references static assets that return 404/HTML instead of real CSS/JS.
set -euo pipefail

SITE="${SITE_URL:-https://localkart.store}"
MAX_ATTEMPTS="${VERIFY_STATIC_ATTEMPTS:-15}"
SLEEP_SECS="${VERIFY_STATIC_SLEEP:-5}"

check_assets() {
  HOME_HTML=$(curl -sS --max-time 20 -L "$SITE/")
  ASSET_PATH=$(echo "$HOME_HTML" | grep -oE '/_next/static/(css|chunks)/[^"'"'"']+' | head -1)

  if [ -z "$ASSET_PATH" ]; then
    echo "FAIL: homepage missing /_next/static asset references"
    return 1
  fi

  ASSET_HTTP=$(curl -sS -o /tmp/verify_static_asset -w "%{http_code}" --max-time 20 "$SITE$ASSET_PATH")
  ASSET_CT=$(file -b --mime-type /tmp/verify_static_asset 2>/dev/null || echo "unknown")
  ASSET_HEAD=$(head -c 20 /tmp/verify_static_asset 2>/dev/null || true)

  if [ "$ASSET_HTTP" = "200" ] \
    && [[ "$ASSET_CT" == *css* || "$ASSET_CT" == *javascript* || "$ASSET_CT" == *text/plain* ]] \
    && [[ "$ASSET_HEAD" != "<!DOCTYPE html>" ]]; then
    echo "OK: static asset $ASSET_PATH ($ASSET_HTTP, $ASSET_CT)"
  else
    echo "FAIL: static asset $ASSET_PATH — HTTP $ASSET_HTTP type=$ASSET_CT (expected real CSS/JS, not HTML 404)"
    return 1
  fi

  MAN_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "$SITE/manifest.json")
  if [ "$MAN_HTTP" = "200" ]; then
    echo "OK: manifest.json ($MAN_HTTP)"
  else
    echo "FAIL: manifest.json ($MAN_HTTP)"
    return 1
  fi
}

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  if check_assets; then
    exit 0
  fi
  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    echo "Retrying static asset check ($attempt/$MAX_ATTEMPTS)..."
    sleep "$SLEEP_SECS"
  fi
done

exit 1
