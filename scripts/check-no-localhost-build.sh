#!/usr/bin/env bash
# Fail if production frontend build output contains localhost API URLs.
set -euo pipefail

FRONTEND_DIR="${1:-frontend}"
STATIC_DIR="$FRONTEND_DIR/.next/static"

if [ ! -d "$STATIC_DIR" ]; then
  echo "FAIL: $STATIC_DIR not found — run frontend build first"
  exit 1
fi

if grep -rq 'localhost:3001' "$STATIC_DIR"; then
  echo "FAIL: built frontend contains localhost:3001 (dev API URL leaked into production bundle)"
  grep -rl 'localhost:3001' "$STATIC_DIR" | head -5
  exit 1
fi

echo "OK: no localhost:3001 in frontend build output"
