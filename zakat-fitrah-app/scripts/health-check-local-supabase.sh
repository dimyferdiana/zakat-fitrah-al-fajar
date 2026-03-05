#!/usr/bin/env bash

set -euo pipefail

DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_zakat-fitrah-app}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "${GREEN}PASS${NC}  $1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  echo -e "${YELLOW}WARN${NC}  $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "${RED}FAIL${NC}  $1"
}

run_sql() {
  local sql="$1"
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -At -c "$sql"
}

echo "== Local Supabase Health Check =="
echo "Container : $DB_CONTAINER"
echo "Database  : $DB_NAME"
echo

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker tidak ditemukan di PATH"
  exit 1
fi

if [[ ! -d "supabase/migrations" ]]; then
  echo "Jalankan script dari root project (folder yang berisi supabase/migrations)."
  exit 1
fi

if ! docker inspect "$DB_CONTAINER" >/dev/null 2>&1; then
  echo "Container '$DB_CONTAINER' tidak ditemukan. Pastikan Supabase lokal sudah running."
  exit 1
fi

container_status=$(docker inspect -f '{{.State.Status}}' "$DB_CONTAINER")
if [[ "$container_status" != "running" ]]; then
  echo "Container '$DB_CONTAINER' tidak running (status: $container_status)."
  exit 1
fi
pass "Container database running"

if run_sql "select 1;" >/dev/null 2>&1; then
  pass "Koneksi database lokal"
else
  fail "Tidak bisa konek ke database lokal"
fi

file_versions=$(ls supabase/migrations/*.sql | xargs -n1 basename | sed -E 's/^([0-9]{3}).*/\1/' | sort -u)
db_versions=$(run_sql "select version from supabase_migrations.schema_migrations order by version;")

missing_in_db=$(comm -23 <(echo "$file_versions") <(echo "$db_versions") || true)
extra_in_db=$(comm -13 <(echo "$file_versions") <(echo "$db_versions") || true)

if [[ -z "$missing_in_db" ]]; then
  pass "Semua migration file (.sql) sudah tercatat di DB"
else
  fail "Migration berikut belum tercatat di DB: $(echo "$missing_in_db" | tr '\n' ' ')"
fi

if [[ -z "$extra_in_db" ]]; then
  pass "Tidak ada versi migration asing di DB"
else
  warn "Ada versi di DB yang tidak punya file .sql lokal: $(echo "$extra_in_db" | tr '\n' ' ')"
fi

bucket_exists=$(run_sql "select exists(select 1 from storage.buckets where id='bukti-bayar');")
if [[ "$bucket_exists" == "t" ]]; then
  pass "Bucket storage bukti-bayar tersedia"
else
  fail "Bucket storage bukti-bayar belum ada"
fi

bucket_size=$(run_sql "select file_size_limit from storage.buckets where id='bukti-bayar' limit 1;")
if [[ "$bucket_size" == "1048576" ]]; then
  pass "Limit bucket bukti-bayar = 1MB"
else
  warn "Limit bucket bukti-bayar bukan 1MB (nilai: ${bucket_size:-N/A})"
fi

proof_policies=$(run_sql "select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('Authenticated can view bukti bayar','Admin and petugas can upload bukti bayar','Owners can update bukti bayar','Owners can delete bukti bayar');")
if [[ "$proof_policies" == "4" ]]; then
  pass "4 policy storage bukti-bayar terpasang"
else
  fail "Policy storage bukti-bayar tidak lengkap (ditemukan: $proof_policies/4)"
fi

ledger_policies=$(run_sql "select count(*) from pg_policies where schemaname='public' and tablename='account_ledger_entries';")
if [[ "$ledger_policies" -ge "4" ]]; then
  pass "RLS account_ledger_entries tersedia ($ledger_policies policies)"
else
  fail "RLS account_ledger_entries kurang dari ekspektasi (ditemukan: $ledger_policies)"
fi

latest_balances_view=$(run_sql "select to_regclass('public.account_latest_balances') is not null;")
if [[ "$latest_balances_view" == "t" ]]; then
  pass "View account_latest_balances tersedia"
else
  fail "View account_latest_balances belum tersedia"
fi

widget_constraint=$(run_sql "select exists(select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid where t.relname='dashboard_widgets' and c.conname='dashboard_widgets_widget_type_check');")
if [[ "$widget_constraint" == "t" ]]; then
  pass "Constraint dashboard_widgets_widget_type_check tersedia"
else
  fail "Constraint dashboard_widgets_widget_type_check tidak ditemukan"
fi

echo
echo "== Ringkasan =="
echo "PASS : $PASS_COUNT"
echo "WARN : $WARN_COUNT"
echo "FAIL : $FAIL_COUNT"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi

exit 0
