#!/usr/bin/env bash
# Reset production DB test data: backup first, then delete shops/products/orders/users (keep admin).
#
# Usage (on production server):
#   bash scripts/prod-reset-test-data.sh              # before counts only
#   CONFIRM_RESET=yes-delete-test-data bash scripts/prod-reset-test-data.sh
#
# Requires backend/.env with DATABASE_URL or DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_ENV="${BACKEND_ENV:-$ROOT/backend/.env}"
SQL_FILE="$ROOT/scripts/prod-reset-test-data.sql"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/localkart_pre_reset_${TIMESTAMP}.dump"

if [[ ! -f "$BACKEND_ENV" ]]; then
  echo "::error::Missing $BACKEND_ENV"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$BACKEND_ENV"
set +a

build_psql_conn() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    PSQL_CONN="$DATABASE_URL"
    PGDUMP_CONN="$DATABASE_URL"
    return
  fi
  export PGHOST="${DB_HOST:-localhost}"
  export PGPORT="${DB_PORT:-5432}"
  export PGUSER="${DB_USERNAME:-postgres}"
  export PGPASSWORD="${DB_PASSWORD:-}"
  export PGDATABASE="${DB_NAME:-localkart}"
  PSQL_CONN=""
  PGDUMP_CONN=""
}

run_psql() {
  if [[ -n "$PSQL_CONN" ]]; then
    psql "$PSQL_CONN" -v ON_ERROR_STOP=1 "$@"
  else
    psql -v ON_ERROR_STOP=1 "$@"
  fi
}

run_psql_t() {
  if [[ -n "$PSQL_CONN" ]]; then
    psql "$PSQL_CONN" -At "$@"
  else
    psql -At "$@"
  fi
}

print_counts() {
  local label="$1"
  echo ""
  echo "=== Row counts ($label) ==="
  run_psql_t -c "
    SELECT 'shops' AS tbl, COUNT(*)::text FROM shops
    UNION ALL SELECT 'products', COUNT(*)::text FROM products
    UNION ALL SELECT 'orders', COUNT(*)::text FROM orders
    UNION ALL SELECT 'reviews', COUNT(*)::text FROM reviews
    UNION ALL SELECT 'commission_bills', COUNT(*)::text FROM commission_bills
    UNION ALL SELECT 'users_total', COUNT(*)::text FROM users
    UNION ALL SELECT 'users_admin', COUNT(*)::text FROM users WHERE role = 'admin'
    UNION ALL SELECT 'users_seller', COUNT(*)::text FROM users WHERE role = 'seller'
    UNION ALL SELECT 'users_customer', COUNT(*)::text FROM users WHERE role = 'customer'
    UNION ALL SELECT 'staff_members', COUNT(*)::text FROM staff_members
    UNION ALL SELECT 'categories', COUNT(*)::text FROM categories
  " | while IFS='|' read -r key val; do
    printf "  %-20s %s\n" "$key" "$val"
  done
}

clear_redis_carts() {
  if command -v redis-cli >/dev/null 2>&1; then
    local keys n=0
    keys="$(redis-cli --scan --pattern 'cart:*' 2>/dev/null || true)"
    if [[ -n "$keys" ]]; then
      while IFS= read -r k; do
        [[ -z "$k" ]] && continue
        redis-cli DEL "$k" >/dev/null
        n=$((n + 1))
      done <<< "$keys"
      echo "Cleared $n Redis cart key(s)."
    else
      echo "No Redis cart:* keys to clear."
    fi
  else
    echo "redis-cli not found — skipped cart cache cleanup."
  fi
}

build_psql_conn

echo "=== Production test-data reset ==="
echo "Env file: $BACKEND_ENV"
print_counts "BEFORE"

if [[ "${CONFIRM_RESET:-}" != "yes-delete-test-data" ]]; then
  echo ""
  echo "Dry run complete. To backup + delete, set:"
  echo "  CONFIRM_RESET=yes-delete-test-data"
  exit 0
fi

mkdir -p "$BACKUP_DIR"
echo ""
echo "=== pg_dump backup → $BACKUP_FILE ==="
if [[ -n "$PGDUMP_CONN" ]]; then
  pg_dump "$PGDUMP_CONN" -Fc -f "$BACKUP_FILE"
else
  pg_dump -Fc -f "$BACKUP_FILE"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "::error::Backup file was not created"
  exit 1
fi

BACKUP_BYTES="$(wc -c < "$BACKUP_FILE" | tr -d ' ')"
echo "Backup size: $BACKUP_BYTES bytes"
if [[ "$BACKUP_BYTES" -lt 1024 ]]; then
  echo "::error::Backup suspiciously small (<1KB) — aborting"
  exit 1
fi

echo ""
echo "=== Applying deletion SQL ==="
run_psql -f "$SQL_FILE"

clear_redis_carts

print_counts "AFTER"
echo ""
echo "=== Reset complete ==="
