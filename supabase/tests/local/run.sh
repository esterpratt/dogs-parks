#!/usr/bin/env bash

set -euo pipefail

# This runner always rebuilds the isolated fixture so characterization tests cannot
# inherit local rows or accidentally use the repository's linked Supabase project.
readonly SUPABASE_TEST_WORKDIR="supabase/tests/local"
readonly EXCLUDED_SERVICES="edge-runtime,imgproxy,logflare,postgres-meta,studio,supavisor,vector"
readonly EXPECTED_SUPABASE_VERSION="2.109.1"

cleanup() {
  if [[ "${KEEP_LOCAL_SUPABASE:-0}" != "1" ]]; then
    supabase stop --workdir "${SUPABASE_TEST_WORKDIR}" --no-backup >/dev/null
  fi
}

trap cleanup EXIT

actual_supabase_version="$(supabase --version)"
if [[ "${actual_supabase_version}" != "${EXPECTED_SUPABASE_VERSION}" ]]; then
  echo "Expected Supabase CLI ${EXPECTED_SUPABASE_VERSION}, found ${actual_supabase_version}." >&2
  exit 1
fi

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
