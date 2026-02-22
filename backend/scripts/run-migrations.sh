#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if command -v psql >/dev/null 2>&1; then
  PSQL_BIN="$(command -v psql)"
elif [[ -x "/opt/homebrew/opt/postgresql@16/bin/psql" ]]; then
  PSQL_BIN="/opt/homebrew/opt/postgresql@16/bin/psql"
else
  echo "psql not found. Install PostgreSQL client first."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Applying migrations from ${ROOT_DIR}/migrations"
for file in "${ROOT_DIR}"/migrations/*.sql; do
  echo " - $file"
  "${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "$file"
done

echo "Migrations applied successfully."
