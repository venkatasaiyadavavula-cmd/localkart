#!/usr/bin/env bash
# Write QA_THROTTLE_BYPASS_TOKEN into backend/.env safely (handles special chars).
set -euo pipefail

ENV_FILE="${1:-backend/.env}"
TOKEN="${QA_THROTTLE_BYPASS_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "::error::QA_THROTTLE_BYPASS_TOKEN is not set"
  exit 1
fi

if [ "${#TOKEN}" -lt 32 ]; then
  echo "::error::QA_THROTTLE_BYPASS_TOKEN too short (${#TOKEN} chars, need 32+)"
  exit 1
fi

python3 - "$ENV_FILE" "$TOKEN" <<'PY'
import pathlib
import sys

env_file, token = sys.argv[1], sys.argv[2]
path = pathlib.Path(env_file)
lines: list[str] = []
found = False
if path.exists():
    for line in path.read_text(encoding='utf-8').splitlines():
        if line.startswith('QA_THROTTLE_BYPASS_TOKEN='):
            lines.append(f'QA_THROTTLE_BYPASS_TOKEN={token}')
            found = True
        else:
            lines.append(line)
if not found:
    lines.append(f'QA_THROTTLE_BYPASS_TOKEN={token}')
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
PY

STORED=$(grep '^QA_THROTTLE_BYPASS_TOKEN=' "$ENV_FILE" | cut -d= -f2- || true)
if [ -z "$STORED" ]; then
  echo "::error::QA_THROTTLE_BYPASS_TOKEN missing from $ENV_FILE after sync"
  exit 1
fi
if [ "$STORED" != "$TOKEN" ]; then
  echo "::error::QA_THROTTLE_BYPASS_TOKEN length mismatch in $ENV_FILE (expected ${#TOKEN}, got ${#STORED})"
  exit 1
fi
echo "✅ QA_THROTTLE_BYPASS_TOKEN synced to $ENV_FILE (${#STORED} chars, prefix ${STORED:0:4}…)"
