# Shared dog ownership release readiness

2026-10-27. Release preparation only. Ester has not authorized a production deployment or enablement. The [rollout plan](SUPABASE_PRODUCTION_ROLLOUT_PLAN.md) remains the execution framework; this sheet records evidence and open release gates without credentials or personal data.

## Verified source and environment inventory

| Item | Read-only finding | Release implication |
| --- | --- | --- |
| Source | `main` at `d7bca43` before this readiness update | Record the final release SHA again after any subsequent code change. |
| Web hosting | Vercel project `dogs-parks` has a ready production deployment of `d7bca43` from GitHub `main`, assigned to `klavhub.com` and related domains | A push to `main` publishes the web client. Production still lacks the new dog-page RPCs used by that web build, so signed-in dog-page behavior is at risk and has not been verified live. This branch must stay unpushed while deployment is excluded. |
| Production | Project `kbsjdfzpeianxhidguam`, healthy, PostgreSQL 15.8.1.040 | Recheck the target and live schema immediately before any migration. |
| Staging | Project `uhdzwzuyiztktxthwdfp`, healthy, PostgreSQL 17.11.0.002 | Rehearse against the production PostgreSQL major version as well; the staging major version differs. |
| Migration ledger | Six pre-feature migrations applied in production at the read-only check; all eleven then-existing feature migration files absent from its ledger | A twelfth, additive cutover reconciliation migration is now prepared locally. Recheck the ledger and live baseline before choosing commands. Do not use an unreviewed `db push` or replay the fixture baseline. |
| Production functions | `delete-user` v9, `send-new-park-mail` v9, `send-report-park-mail` v4, `check-review-reports` v5, `send-push-notification` v42 active; `process-dog-storage-jobs` absent | Deploying the required Edge code and arranging worker invocation is a later, separately authorized operation. Verify actual source/config, not version numbers alone. |
| Staging preservation | 1,494 selected records, 46 retained legacy objects, seven migrated dog objects and three logins checked | The verifier still fails on one copied `dogs.description` with an extra trailing `!`. Ester could not confirm intent and instructed leaving both copies unchanged. Preserve the discrepancy and do not claim an exact-copy pass. |
| Automated checks | The local SQL/RLS/Storage/Edge suite passed on 2026-10-28, including the new legacy-photo cutover contract; 104 Vitest tests in 17 files and three staging browser ownership journeys passed earlier; lint/build/diff check passed | These cover implemented flows, not released native binaries or a production upgrade. One intervening local rerun failed with a Storage 503 and expired reservation before the new migration; a subsequent clean rerun passed. |
| Staging cutover preparation | Both pending migrations, `20261011110000` and `20261027100000`, applied to staging on 2026-10-28 | Read-back confirmed the legacy photo-write switch remains enabled, zero pending legacy-copy jobs, and the new migration ledger row. No reconciliation or cutover switch was run on staging user data. |

## Release gates still open

1. **Mixed-client photo behavior.** The pre-feature client uses direct `users/{owner}/dogs/{dog}/primary|other` Storage operations. The new client uses `dog_images` metadata and private `dogs` objects. The new service-only switch keeps old solo-dog writes enabled during the overlap, then pauses them at cutover. Reconciliation detects late uploads, moves and deletions, adjusts main-photo selection and queues missing copies. The switch serializes with in-flight Storage writes; the worker must also be stopped before reconciliation, followed by a verified drain. Old clients can still read retained source files afterward, but photo writes require the new app. The local old-client Storage contract passes; released artifact and full staging upgrade compatibility remain open.
2. **Full production preservation.** Collect a current, private manifest of every record category and Storage object, reconcile live schema/ledger drift, and investigate the preserved staging description discrepancy without changing either copy unless separately directed. Rehearse database **and** Storage backup/restore on a disposable destination.
3. **Deployment intervals.** Rehearse the exact twelve-migration sequence, `delete-user` compatibility around the owner FK change, worker deployment/invocation, failed Storage copy, and post-Auth cleanup failure. The local runner applies one notification refinement earlier than timestamp order; verify the production order on a disposable production-version database.
4. **Credentials and hosting.** Audit the four historical webhook trigger credentials and all consumers, then rehearse narrow authentication and credential rotation. Vercel production hosting is linked to GitHub `main`; the earlier `d7bca43` push produced a ready production web deployment. Checked-in workflows contain no Supabase deployment, but any external backend integration must still be checked. No credential rotation was performed here.
5. **Release artifacts.** Identify the actual available iOS, Android and Web builds and verify native `App.getInfo().build` plus server minimum values. Store listing history and local version files do not establish an installed build. Manual iOS/Android device checks remain excluded by Ester's instruction; record that limitation rather than calling it passed.
6. **Dependency security.** `npm audit` on 2026-10-27 reported 14 findings (two critical, nine high, two moderate, one low); `npm outdated` was reviewed. No packages were changed. Review affected runtime and build packages, including the Capacitor Android/iOS advisory, under the repository's separate upgrade approval rule.

## Execution sheet fields to fill before production approval

| Field | Required release-time value |
| --- | --- |
| Operator, approver, window and write control | Names, start/end, tested mechanism that also covers installed clients |
| Source and backend target | Final Git SHA, production project ref, live schema fingerprint, current migration ledger |
| Migrations | Exact ordered list and checksums of pending files, transaction boundaries, checkpoint SQL, measured duration |
| Functions and jobs | Source SHAs, deployed versions, gateway verification, secret names (never values), worker schedule/invocation and queue thresholds |
| Preservation and recovery | Private database and Storage backup locations, record/object counts and checksums, restored destination, rollback/forward-repair commands |
| Client compatibility | Released artifact IDs, old-client matrix results, new-client build values, platform minimums and phased publication sequence |
| Observation | Test accounts, smoke checklist, telemetry/log queries, stop conditions, on-call owner and observation period |

Do not fill unknowns with assumptions. Keep all production compatibility rows disabled until the release gates pass and deployment is explicitly authorized.
