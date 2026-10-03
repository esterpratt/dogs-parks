#!/usr/bin/env bash

set -euo pipefail

# This runner always rebuilds the isolated fixture so characterization tests cannot
# inherit local rows or accidentally use the repository's linked Supabase project.
readonly SUPABASE_TEST_WORKDIR="supabase/tests/local"
readonly EXCLUDED_SERVICES="imgproxy,logflare,postgres-meta,studio,supavisor,vector"
readonly EXPECTED_SUPABASE_VERSION="2.109.1"
readonly LOCAL_DB_CONTAINER="supabase_db_dogs-parks-ownership-tests"
readonly OWNERSHIP_HARDENING_MIGRATION="supabase/migrations/20260927193000_harden_existing_dog_ownership.sql"
readonly MEMBERSHIP_FOUNDATION_MIGRATION="supabase/migrations/20260928120000_add_dog_membership_foundation.sql"
readonly PRIVATE_IMAGE_FOUNDATION_MIGRATION="supabase/migrations/20261002120000_add_private_dog_image_foundation.sql"
readonly OWNERSHIP_ACTIONS_MIGRATION="supabase/migrations/20261002150000_add_dog_ownership_actions.sql"
readonly DEPARTURE_ENUMS_MIGRATION="supabase/migrations/20261003100000_extend_dog_departure_enums.sql"
readonly TRANSFER_DEPARTURE_MIGRATION="supabase/migrations/20261003110000_add_dog_transfer_departure.sql"
readonly DELETION_ENUMS_MIGRATION="supabase/migrations/20261003130000_extend_dog_deletion_enums.sql"
readonly UNANIMOUS_DELETION_MIGRATION="supabase/migrations/20261003140000_add_unanimous_dog_deletion.sql"
readonly RUNTIME_FUNCTIONS_DIR="supabase/tests/local/supabase/.runtime-functions"

cleanup() {
  if [[ "${KEEP_LOCAL_SUPABASE:-0}" != "1" ]]; then
    supabase stop --workdir "${SUPABASE_TEST_WORKDIR}" --no-backup >/dev/null
  fi

  rm -f \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user/index.ts" \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user/deno.json" \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user/.npmrc" \
    "${RUNTIME_FUNCTIONS_DIR}/process-dog-storage-jobs/index.ts" \
    "${RUNTIME_FUNCTIONS_DIR}/process-dog-storage-jobs/deno.json" \
    "${RUNTIME_FUNCTIONS_DIR}/process-dog-storage-jobs/.npmrc" \
    "${RUNTIME_FUNCTIONS_DIR}/_shared/cors.ts"
  rmdir \
    "${RUNTIME_FUNCTIONS_DIR}/delete-user" \
    "${RUNTIME_FUNCTIONS_DIR}/process-dog-storage-jobs" \
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

mkdir -p \
  "${RUNTIME_FUNCTIONS_DIR}/delete-user" \
  "${RUNTIME_FUNCTIONS_DIR}/process-dog-storage-jobs" \
  "${RUNTIME_FUNCTIONS_DIR}/_shared"
cp \
  supabase/functions/delete-user/index.ts \
  supabase/functions/delete-user/deno.json \
  supabase/functions/delete-user/.npmrc \
  "${RUNTIME_FUNCTIONS_DIR}/delete-user/"
cp supabase/functions/_shared/cors.ts "${RUNTIME_FUNCTIONS_DIR}/_shared/cors.ts"
cp \
  supabase/functions/process-dog-storage-jobs/index.ts \
  supabase/functions/process-dog-storage-jobs/deno.json \
  supabase/functions/process-dog-storage-jobs/.npmrc \
  "${RUNTIME_FUNCTIONS_DIR}/process-dog-storage-jobs/"

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

# Seed prototype-shaped rows before the foundation migration so its reconciliation
# behavior is covered by the same local Auth-backed contract as new invariants.
SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node supabase/tests/local/seed-membership-foundation.mjs

docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${MEMBERSHIP_FOUNDATION_MIGRATION}"

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/membership-foundation-contract.test.mjs

# Seed a legacy user-scoped dog image immediately before the image migration so
# its metadata/job reconciliation is tested independently from membership setup.
SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node supabase/tests/local/seed-private-image-foundation.mjs

docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${PRIVATE_IMAGE_FOUNDATION_MIGRATION}"

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/private-image-foundation-contract.test.mjs

docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${OWNERSHIP_ACTIONS_MIGRATION}"

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/ownership-actions-contract.test.mjs

docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${DEPARTURE_ENUMS_MIGRATION}"
docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${TRANSFER_DEPARTURE_MIGRATION}"

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/transfer-departure-contract.test.mjs

docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${DELETION_ENUMS_MIGRATION}"
docker exec -i "${LOCAL_DB_CONTAINER}" psql -U postgres -d postgres -q -1 -v ON_ERROR_STOP=1 \
  < "${UNANIMOUS_DELETION_MIGRATION}"

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/dog-deletion-contract.test.mjs

SUPABASE_LOCAL_URL="${local_api_url}" \
SUPABASE_LOCAL_ANON_KEY="${local_anon_key}" \
SUPABASE_LOCAL_SERVICE_ROLE_KEY="${local_service_role_key}" \
  node --test supabase/tests/local/delete-user-contract.test.mjs
