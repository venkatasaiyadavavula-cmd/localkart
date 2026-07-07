#!/usr/bin/env bash
# LocalKart quick smoke test — delegates to qa-full.sh for comprehensive checks.
# For a fast page-only check: QA_QUICK=1 ./scripts/qa-smoke.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "${QA_QUICK:-}" = "1" ]; then
  SITE="${SITE_URL:-https://localkart.store}"
  API="${API_URL:-https://api.localkart.store/api/v1}"
  pass=0; fail=0
  check() {
    local label="$1" url="$2" expected="${3:-200}"
    local code
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -L "$url" || echo "000")
    if [[ "$code" == "$expected" ]]; then echo "✅ $label ($code)"; pass=$((pass+1)); else echo "❌ $label — $code"; fail=$((fail+1)); fi
  }
  echo "=== Quick Smoke ==="
  for path in / /login /browse /cart /about /work/login; do check "page $path" "$SITE$path"; done
  check "API products" "$API/catalog/products"
  echo "Passed: $pass | Failed: $fail"
  [ "$fail" -eq 0 ]
else
  exec "$SCRIPT_DIR/qa-full.sh"
fi
