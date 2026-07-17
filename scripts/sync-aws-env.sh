#!/usr/bin/env bash
# Write AWS S3 credentials into backend/.env safely (handles special chars).
set -euo pipefail

ENV_FILE="${1:-backend/.env}"

for var in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION AWS_BUCKET_NAME; do
  if [ -z "${!var:-}" ]; then
    echo "::error::${var} is not set"
    exit 1
  fi
done

python3 - "$ENV_FILE" <<'PY'
import os
import pathlib
import sys

env_file = sys.argv[1]
path = pathlib.Path(env_file)
updates = {
    "AWS_ACCESS_KEY_ID": os.environ["AWS_ACCESS_KEY_ID"],
    "AWS_SECRET_ACCESS_KEY": os.environ["AWS_SECRET_ACCESS_KEY"],
    "AWS_REGION": os.environ["AWS_REGION"],
    "AWS_BUCKET_NAME": os.environ["AWS_BUCKET_NAME"],
}
lines: list[str] = []
found = {k: False for k in updates}
if path.exists():
    for line in path.read_text(encoding="utf-8").splitlines():
        key = line.split("=", 1)[0] if "=" in line else ""
        if key in updates:
            lines.append(f"{key}={updates[key]}")
            found[key] = True
        else:
            lines.append(line)
for key, value in updates.items():
    if not found[key]:
        lines.append(f"{key}={value}")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

KEY_ID=$(grep '^AWS_ACCESS_KEY_ID=' "$ENV_FILE" | cut -d= -f2-)
if [ "$KEY_ID" = "your_access_key" ]; then
  echo "::error::AWS_ACCESS_KEY_ID still placeholder in $ENV_FILE"
  exit 1
fi
echo "✅ AWS env synced to $ENV_FILE (key prefix ${KEY_ID:0:4}… region $(grep '^AWS_REGION=' "$ENV_FILE" | cut -d= -f2-))"
