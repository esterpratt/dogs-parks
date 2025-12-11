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

## Root Cause Analysis

The real issue was **not just timeouts** but that the page was blocked from rendering entirely.

In [ParksList.tsx:69](src/components/parks/ParksList.tsx#L69), the component showed a loader while `isLoadingParks || isBuildingIndex`.

The problem:
- `isBuildingIndex` comes from `useParksCrossLanguageFilter()` which fetches parks data for ALL languages (English + Hebrew)
- If these API calls fail or are very slow in CI (network issues, Supabase access problems), `isBuildingIndex` stays true forever
- The page never renders because it's waiting for all language data to load
- This is why search input, navbar, and all other elements were not found - they literally didn't exist in the DOM

## Review

### Changes Made

#### 1. Fixed Search Input Timeout Issues
Updated visibility timeout from default 5s to 15s in:
- [cross-language-search.spec.ts:26, 81, 136](tests/e2e/parks/cross-language-search.spec.ts) - All 3 test cases now wait up to 15s for search input
- [detail-visitor.spec.ts:22](tests/e2e/parks/detail-visitor.spec.ts) - Visitor test now waits up to 15s for search input

**Note: This alone was not sufficient** - it only helped IF the page rendered.

#### 2. Fixed Root Cause: Removed Blocking Loader
Updated [ParksList.tsx:69](src/components/parks/ParksList.tsx#L69):
- Removed `isBuildingIndex` from the loading condition
- Changed from `if (isLoadingParks || isBuildingIndex)` to `if (isLoadingParks)`
- Now the page renders as soon as the primary parks data loads
- Cross-language search index builds in the background and activates when ready
- Basic search still works immediately

#### 3. Added Environment Variables to CI
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
- Page now renders immediately when parks data loads, regardless of cross-language index status
- Cross-language search is now progressive - works as soon as ready, doesn't block page
- Tests should pass consistently in CI
- Better user experience - no waiting for background index building
