#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/e2e"

export SITE_URL="${SITE_URL:-https://localkart.store}"
export API_URL="${API_URL:-https://api.localkart.store/api/v1}"
export QA_THROTTLE_BYPASS_TOKEN="${QA_THROTTLE_BYPASS_TOKEN:-}"

echo "Route sweep → $SITE_URL"
npx playwright test tests/route-sweep.spec.ts --project=desktop --reporter=line

echo ""
echo "=== Markdown report (head) ==="
head -n 80 route-sweep-report.md || true
