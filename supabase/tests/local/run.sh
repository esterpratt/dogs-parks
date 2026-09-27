#!/usr/bin/env bash

set -euo pipefail

# This runner always rebuilds the isolated fixture so characterization tests cannot
# inherit local rows or accidentally use the repository's linked Supabase project.
readonly SUPABASE_TEST_WORKDIR="supabase/tests/local"
readonly EXCLUDED_SERVICES="imgproxy,logflare,postgres-meta,studio,supavisor,vector"
readonly EXPECTED_SUPABASE_VERSION="2.109.1"
readonly LOCAL_DB_CONTAINER="supabase_db_dogs-parks-ownership-tests"
readonly OWNERSHIP_HARDENING_MIGRATION="supabase/migrations/20260927193000_harden_existing_dog_ownership.sql"
readonly RUNTIME_FUNCTIONS_DIR="supabase/tests/local/supabase/.runtime-functions"

cleanup() {
  if [[ "${KEEP_LOCAL_SUPABASE:-0}" != "1" ]]; then
    supabase stop --workdir "${SUPABASE_TEST_WORKDIR}" --no-backup >/dev/null
  fi

  rm -f \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user/index.ts" \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user/deno.json" \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user/.npmrc" \
    "${RUNTIME_FUNCTIONS_DIR}/_shared/cors.ts"
  rmdir \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user" \
    "${RUNTIME_FUNCTIONS_DIR}/_shared" \
    "${RUNTIME_FUNCTIONS_DIR}" \
    2>/dev/null || true
}

trap cleanup EXIT

actual_supabase_version="$(supabase --version)"
if [[ "${actual_supabase_version}" != "${EXPECTED_SUPABASE_VERSION}" ]]; then
  echo "Expected Supabase CLI ${EXPECTED_SUPABASE_VERSION}, found ${actual_supabase_version}." >&2
  exit 1
fi

mkdir -p "${RUNTIME_FUNCTIONS_DIR}/delete-user" "${RUNTIME_FUNCTIONS_DIR}/_shared"
cp \
  supabase/functions/delete-user/index.ts \
  supabase/functions/delete-user/deno.json \
  supabase/functions/delete-user/.npmrc \
  "${RUNTIME_FUNCTIONS_DIR}/delete-user/"
cp supabase/functions/_shared/cors.ts "${RUNTIME_FUNCTIONS_DIR}/_shared/cors.ts"

supabase stop --workdir "${SUPABASE_TEST_WORKDIR}" --no-backup >/dev/null 2>&1 || true
supabase start \
  --workdir "${SUPABASE_TEST_WORKDIR}" \
  --exclude "${EXCLUDED_SERVICES}" \
  >/dev/null
supabase db reset \
  --local \
  --workdir "${SUPABASE_TEST_WORKDIR}" \
  --no-seed

# Supabase status emits local development credentials; pass them only to this process.
status_json="$(supabase status --workdir "${SUPABASE_TEST_WORKDIR}" -o json)"
local_api_url="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).API_URL)' "${status_json}")"
local_anon_key="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).ANON_KEY)' "${status_json}")"
local_service_role_key="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).SERVICE_ROLE_KEY)' "${status_json}")"

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/current-baseline.test.mjs

# The security contract runs separately so the baseline remains permanent evidence
# of the behavior that the first additive ownership migration must replace.
docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${OWNERSHIP_HARDENING_MIGRATION}"

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/hardening-contract.test.mjs

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/delete-user-contract.test.mjs
