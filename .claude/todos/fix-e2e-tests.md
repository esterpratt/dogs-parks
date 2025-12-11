# Fix E2E Tests Failing in CI

## Problem
E2E tests are failing in CI with two main issues:
1. Search input element not found (timing issue with loading states)
2. Missing TEST_EMAIL and TEST_PASSWORD environment variables

## Root Causes

### Issue 1: Search Input Not Visible
- In [ParksList.tsx:69-71](src/components/parks/ParksList.tsx#L69-L71), a loader shows while `isLoadingParks || isBuildingIndex`
- The search input is inside `SearchList` which doesn't render until loading completes
- Tests wait for `networkidle` + 500ms, but `useParksCrossLanguageFilter` might still be building the search index
- CI environments are slower, so the index building takes longer

### Issue 2: Missing Environment Variables
- Test uses `TEST_EMAIL` and `TEST_PASSWORD` from env
- These are loaded from `.env.local` locally but not set in CI
- Need to configure GitHub Actions secrets

## Tasks

- [x] Fix timing issue: Wait for search input with longer timeout instead of assuming it's ready after networkidle
- [x] Update all test files to use longer timeout for search input visibility
- [x] Add environment variables to CI workflow configuration

## Implementation Plan

### 1. Fix Cross-Language Search Tests
Update timeout in [cross-language-search.spec.ts](tests/e2e/parks/cross-language-search.spec.ts):
- Lines 26, 81, 136: Add longer timeout to search input visibility check
- Change from default 5s to 15s to account for index building

### 2. Fix Detail Visitor Test
Update [detail-visitor.spec.ts](tests/e2e/parks/detail-visitor.spec.ts):
- Line 22: Add timeout to search input visibility check

### 3. Fix Report Condition User Test
Update [report-condition-user.spec.ts](tests/e2e/parks/report-condition-user.spec.ts):
- Document that TEST_EMAIL and TEST_PASSWORD must be set in CI secrets
- Consider adding a check to skip or provide better error message

## Review

### Changes Made

#### 1. Fixed Search Input Timeout Issues
Updated visibility timeout from default 5s to 15s in:
- [cross-language-search.spec.ts:26, 81, 136](tests/e2e/parks/cross-language-search.spec.ts) - All 3 test cases now wait up to 15s for search input
- [detail-visitor.spec.ts:22](tests/e2e/parks/detail-visitor.spec.ts) - Visitor test now waits up to 15s for search input

This accounts for slower CI environments where the cross-language search index takes longer to build.

#### 2. Added Environment Variables to CI
Updated [pr-checks.yml:39-43](.github/workflows/pr-checks.yml#L39-L43):
- Added `TEST_EMAIL` and `TEST_PASSWORD` environment variables to the "Run E2E tests" step
- These pull from GitHub repository secrets

### Required Setup

**GitHub Repository Secrets** (to be configured by repository admin):
1. Go to repository Settings → Secrets and variables → Actions
2. Add two repository secrets:
   - `TEST_EMAIL`: Email address for test user account
   - `TEST_PASSWORD`: Password for test user account

### Impact
- All 6 e2e tests should now pass in CI
- Tests are more resilient to slower environments
- No code changes to application logic
