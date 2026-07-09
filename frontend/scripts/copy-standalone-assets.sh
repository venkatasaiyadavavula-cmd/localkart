#!/usr/bin/env bash
# Next.js standalone output does not include .next/static or public — copy after every build.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"

if [ ! -d "$STANDALONE" ]; then
  echo "copy-standalone-assets: .next/standalone not found (is output: 'standalone' set?)" >&2
  exit 1
fi

echo "Copying static assets into standalone bundle..."
mkdir -p "$STANDALONE/.next"
rm -rf "$STANDALONE/.next/static"
cp -r "$ROOT/.next/static" "$STANDALONE/.next/static"

rm -rf "$STANDALONE/public"
cp -r "$ROOT/public" "$STANDALONE/public"

echo "Standalone assets ready: .next/static + public"
