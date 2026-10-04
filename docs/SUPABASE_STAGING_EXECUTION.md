# Staging execution manifest

Execution date: 2026-10-04. S1–S4 are complete; S5 tooling, fixtures and browser preview are available. The full ownership UI/native matrix and support-policy work remain.

## Current staging result

- Permanent project: [klavhub-staging](https://supabase.com/dashboard/project/uhdzwzuyiztktxthwdfp), ref `uhdzwzuyiztktxthwdfp`, same organization and Frankfurt region as production, PostgreSQL 17.11. Production is PostgreSQL 15.8; this rehearsal ran against the actual staging version.
- The repository link and `.env.local` still target production. Staging uses a separately linked `.private/staging/workdir` and `.env.staging.local`. Guarded scripts verify the exact project and reject production destinations.
- Reviewed schema bootstrap created 23 public tables, 11 Storage policies, the enabled Auth profile trigger and notification Realtime publication. Four outgoing webhook triggers and unused network/crypto extensions were omitted. The already-disabled legacy Auth deletion trigger was omitted; account cleanup uses the reviewed Edge Function. Six historical ledger entries were reconciled only after verifying the baseline. Original migrations remain unchanged.
- Imported two independent, confirmed staging Auth accounts with new IDs/passwords. Their original emails are retained; the fake test address needs no confirmation email. User references and Storage folders were consistently remapped. Public signup is disabled; email/password login remains enabled.
- Selected legacy import: 2 profiles, 4 dogs (including 2 soft-deleted), 3 memberships, 7 image metadata rows, 1 friendship, 2 notification preferences, 3 favorites, 367 parks, 1101 park translations and 4 condition rules. Both users' legacy media and the entire parks bucket were copied: 46 actual files, including initial JSON catalogs, with exact byte/MIME/checksum verification. Two Storage placeholders were excluded. No unrelated profiles, visits, device tokens or message/notification history were copied.
- All nine feature migrations were applied in separate ordered transactions. Seven legacy dog photos were copied and verified into the private dogs bucket; original files remain retained. Unknown uploader attribution stays null and main-image choices were verified. The original 256000-byte bucket limit was restored after copying oversized historical park files.
- Only `delete-user` and `process-dog-storage-jobs` were deployed, both with gateway `verify_jwt=true` and internal authentication. The worker requires the exact injected modern secret; the tooling resolves it by digest without logging it. No push/mail functions or scheduler were deployed. Manually drain jobs after destructive testing.
- `SHARED_DOG_OWNERSHIP`: WEB enabled, minimum build 1; iOS/Android disabled. Six durable synthetic accounts and five fixture dogs cover solo/shared/private/friend/outsider/cleanup and an actual unknown-uploader PNG. Destructive checks use separate disposable dogs/accounts.
- A separate staging-only migration enables the production Data API aggregate setting used by `reviews.rank.avg()`. It lives under `supabase/staging/migrations`, outside production deployable migrations. [Supabase aggregate configuration](https://supabase.com/blog/postgrest-aggregate-functions) documents this role setting and configuration reload. This changes no RLS policy or execution grant.
- Production application data, schema, functions, credentials and compatibility settings were not changed. Checked-in CI contains no DB/function deployment; external hosting integration settings remain unverified. This task changes tooling/configuration/documentation, with no application bundle source changes.

## Open staging and find logins

From the repository root:

```sh
npm run dev:staging
```

Open <http://127.0.0.1:5173>. The script validates staging URL/key and explicitly overrides Vite's production `.env.local` backend variables. Normal startup preserves all staging data.

Open `.private/staging/logins.json` locally for the two imported accounts' emails, independent passwords and staging user IDs. Open `.private/staging/synthetic-fixtures.json` for synthetic role credentials and dog IDs. These ignored files have private permissions; do not commit or paste them into chat. Login at `/login?mode=login`; ownership is `/dogs/<dogId>/ownership`, account review is `/profile/<stagingUserId>/settings/delete-account`.

## Repeatable maintenance

Requires the existing authenticated Supabase CLI 2.109.1 and protected local manifests/workdir. These commands do not rebuild staging automatically:

```sh
node supabase/staging/migrate.mjs
node supabase/staging/migrate.mjs --apply
node supabase/staging/fixtures.mjs
node supabase/staging/fixtures.mjs --apply
node supabase/staging/drain-storage.mjs
node supabase/staging/verify-import.mjs
npm run test:e2e:staging
```

Migration and fixture commands default to a dry-run; `--apply` executes only missing migrations or creates missing marked synthetic fixtures. Existing synthetic dog state is preserved. Deleted synthetic identities/dogs can be recreated. Migration reruns verify applied SQL against the repository; no table truncation or automatic production sync occurs. Legacy import is intentionally closed after the ownership upgrade; a future personal-data refresh needs its own reviewed scope. `bootstrap.mjs` rejects an occupied destination. Deploy functions with `node supabase/staging/deploy-functions.mjs` when intentionally updating staging.

`smoke.mjs` executes destructive backend journeys on disposable fixtures; `browser-smoke.mjs` checks imported logins and shared rosters with pinned agent-browser. Both target only staging. Keep `npm run test:supabase` on its separate disposable Docker environment.

## Verification and remaining coverage

- Exact selected-data comparison passed before and after upgrade: 1494 source records, 46 retained legacy files, 7 migrated private photos and both confirmed logins. Expected differences are documented remappings/schema transformations.
- Eleven live backend smoke checks passed: private owner roster, outsider/anonymous denial, signup/privileged endpoint denial, invite acceptance, request approval, transfer, departure, unanimous deletion, caller-derived account erasure and shared-dog preservation. Worker drained migration and disposable cleanup jobs; latest state was 9 completed and no pending/failed jobs.
- Four browser smoke checks passed: both imported accounts' ownership/account-review routes and primary/private-owner shared rosters. Staging catalog requests were observed; no production requests or page exceptions occurred in those smoke checks. Screenshot inspection confirmed the ownership page renders correctly.
- Existing Playwright suite passed all six park tests, including Hebrew/English cross-language search, visitor details and authenticated condition-modal opening. Initial runs stopped on missing browser/video dependencies; Playwright Chromium and FFmpeg were installed without changing project dependencies. After the staging aggregate migration, the anonymous park-rating API query passed and all six browser tests passed again without the rank error. Event/notification fetch console errors still occurred during the parallel suite; event RPCs succeeded in direct authenticated calls. Those logs remain a follow-up, so the passing suite does not establish zero console errors.
- Vitest passed 71 tests across 10 files. Lint, production build, all 15 script syntax checks and `git diff --check` passed; the existing build chunk-size warning remains. Full SQL/Edge contract tests were previously verified locally and were not rerun against permanent staging.
- Remaining: full two-browser UI invite/request/transfer/departure/deletion journeys, photo upload/main-selection/deletion UI, notification/refresh/RTL matrix, native builds, injected partial-cleanup failure, and operational support decisions/recovery implementation. The backend rehearsal and preview do not establish these untested paths or authorize production release.
- Production webhook credential remediation and actual old-client compatibility remain separate production rollout prerequisites. See the production runbook.

## Historical S1 inventory

The sections below record the earlier read-only inventory before the user created staging and supplied data selection. Their pending-input statements are historical; the current result above supersedes them.

## Verified target and source

- Source commit: `7b8e00179749ec1490b3022628128316c6a61600`.
- Installed Supabase CLI: `2.109.1`; project-list, create, dump, query and migration-list help inspected.
- Authenticated production metadata: `klavhub`, ref `kbsjdfzpeianxhidguam`, organization `gbrjjdkznfgppptizsue`, Frankfurt `eu-central-1`, PostgreSQL `15.8.1.040` / engine 15, `ACTIVE_HEALTHY`.
- The repository remains linked to production. No linking change was made.
- Accessible project listing contains production and an unrelated inactive project; no `klavhub-staging` exists in that listing. Destination ref is unresolved.
- Working tree was clean on entry; task branch: `chore/supabase-staging-inventory`.

## Live schema and deployment inventory

- All 23 public application tables have RLS enabled. Policy semantics and execution grants still need detailed review; enabled RLS alone does not prove authorization.
- Auth triggers: `add_user_trigger` → `add_user`; `on_user_deleted` → `delete_user_folder`. Trigger enabled state and full behavior remain to review.
- Storage buckets `users`, `parks`, `dogs` are public, each with a 256000-byte limit and no configured MIME allowlist. Storage policies and selected objects remain to inventory.
- Realtime publication includes `public.notifications`.
- Extensions: plpgsql 1.0, pg_stat_statements 1.10, uuid-ossp 1.1, pgcrypto 1.3, pgjwt 0.2.0, pgsodium 3.1.8, supabase_vault 0.2.8, http 1.6, pg_net 0.14.0, moddatetime 1.0. Verify availability on the new project's actual PostgreSQL version before bootstrap.
- `cron.job` is absent. This does not rule out external schedulers.
- Deployed Edge Functions: `delete-user` v9, `send-new-park-mail` v9, `send-report-park-mail` v4, `check-review-reports` v5, `send-push-notification` v42. All report gateway `verify_jwt=true`; deployed source/internal authentication remains to review. `process-dog-storage-jobs` is absent.
- Four webhook triggers still contain inline JWTs and production destinations: `newParkHook`, `reportParkHook`, `reviewReportCountHook`, `sendPushNotification`. Credential-presence flags were queried without printing credentials. Production remediation is outstanding and remains outside this staging operation.

## Migration ledger

Read with `supabase migration list --linked`. Applied versions:

```text
20260906155031
20260913142712
20260913150025
20260913152814
20260918174629
20260918180306
```

All nine feature migrations in the [ordered production inventory](SUPABASE_PRODUCTION_ROLLOUT_PLAN.md#ordered-feature-migration-inventory) are absent from the live ledger. No migration was applied or repaired. The undocumented baseline still prevents bootstrapping an empty project by replaying the repository ledger alone.

## Protected local schema artifacts

Schema-only export completed with `supabase db dump --linked --file .private/staging/production-schema.sql`. No selected application records, Auth users or photos were exported.

- Directory permissions: 0700; SQL files: 0600; `.private/` is ignored by git.
- Raw schema: 113858 bytes; SHA-256 `9ce4902ef7d3c070009729c865b791efb801a196dbbec72b8eed3a8950897d5b`.
- Bootstrap candidate: `.private/staging/bootstrap-candidate.sql`; SHA-256 `c291ade8f5eda53821288af20735710be29a85b53e0679fad13380ce1e6dcd56`.
- The candidate removes exactly the four webhook trigger statements. Checks found no remaining production ref or literal `Bearer eyJ` string. This is limited screening, not complete sanitization approval.
- The raw export contains sensitive webhook arguments. Keep it private. The candidate must undergo full definition/grant/external-destination review and comparison with the local baseline before any import. Auth triggers, Storage policies/settings and baseline-history reconciliation still need explicit handling.

These are machine-local artifacts, not committed backups or an executed bootstrap. Original migration files remain unchanged.

## Automation and client findings

Checked-in workflows perform PR checks/reviews, CodeQL and manual PR creation. None contains database or function deployment. The PR e2e workflow uses secrets whose backend target is not verified. External hosting/GitHub integration settings remain unverified; this inventory does not clear a future client-code push for automatic hosting deployment.

The client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Browser OAuth returns to `/auth-callback` on the current origin. Staging mode must explicitly supply both backend variables because `.env.local` also participates in Vite mode loading. No environment file or client behavior was changed.

## Pending inputs and next action

Requested from Ester:

1. Organization/region choice and acceptable billing. Matching production means organization `gbrjjdkznfgppptizsue`, region `eu-central-1`; do not infer paid-resource authorization.
2. Exact own and test-profile IDs or emails, whether to include all their dogs/photos, and park scope.
3. Independent staging account setup through a secure local mechanism once the destination exists; do not put passwords in chat or git.

Selection, user-ID mappings, per-table destination counts and object paths/checksums remain unresolved. Do not export unrelated profiles or claim a selected-data manifest exists yet.

Next: resolve inputs, finish schema/Auth/Storage/grant and external-integration review, choose baseline/history reconciliation, then provision an explicitly guarded staging target. No production schema, application data, credentials, deployment or compatibility row was changed. CLI metadata access initialized its temporary login role.

Documentation-only checkpoint: verify `git diff --check`. Application, e2e and local Docker contract checks are deferred until implementation; no test success is implied here. The previous handoff was yesterday, so the several-day audit/outdated maintenance gate did not apply. Platform/store/signing status remains unverified and no upgrade is included.
