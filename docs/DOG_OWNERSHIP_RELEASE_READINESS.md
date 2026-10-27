# Shared dog ownership release readiness

2026-10-27. Release preparation only. Ester has not authorized a production deployment or enablement. The [rollout plan](SUPABASE_PRODUCTION_ROLLOUT_PLAN.md) remains the execution framework; this sheet records evidence and open release gates without credentials or personal data.

## Verified source and environment inventory

| Item | Read-only finding | Release implication |
| --- | --- | --- |
| Source | `main` at `d7bca43` before this readiness update | Record the final release SHA again after any subsequent code change. |
| Web hosting | Vercel project `dogs-parks` has a ready production deployment of `d7bca43` from GitHub `main`, assigned to `klavhub.com` and related domains | A push to `main` publishes the web client. The earlier source push already published its client changes; this readiness branch must stay unpushed while deployment is excluded. |
| Production | Project `kbsjdfzpeianxhidguam`, healthy, PostgreSQL 15.8.1.040 | Recheck the target and live schema immediately before any migration. |
| Staging | Project `uhdzwzuyiztktxthwdfp`, healthy, PostgreSQL 17.11.0.002 | Rehearse against the production PostgreSQL major version as well; the staging major version differs. |
| Migration ledger | Six pre-feature migrations applied in production; all eleven feature migration files absent from its ledger | Reconcile the live baseline before choosing commands. Do not use an unreviewed `db push` or replay the fixture baseline. |
| Production functions | `delete-user` v9, `send-new-park-mail` v9, `send-report-park-mail` v4, `check-review-reports` v5, `send-push-notification` v42 active; `process-dog-storage-jobs` absent | Deploying the required Edge code and arranging worker invocation is a later, separately authorized operation. Verify actual source/config, not version numbers alone. |
| Staging preservation | 1,494 selected records, 46 retained legacy objects, seven migrated dog objects and three logins checked | The verifier still fails on one copied `dogs.description` with an extra trailing `!`. Ester could not confirm intent and instructed leaving both copies unchanged. Preserve the discrepancy and do not claim an exact-copy pass. |
| Automated checks | Local SQL/RLS/Storage/Edge suite passed; 104 Vitest tests in 17 files passed; three staging browser ownership journeys passed; lint/build/diff check passed | These cover implemented flows, not released native binaries, older clients, or a production upgrade. |

## Release gates still open

1. **Mixed-client photo behavior.** The pre-feature client uses direct `users/{owner}/dogs/{dog}/primary|other` Storage operations. The new client uses `dog_images` metadata and private `dogs` objects. A late old-client upload or move will not update the new metadata. Test the exact released old-client calls against the upgraded backend and implement a reviewed transition or enforce an effective upgrade boundary before enabling shared ownership. Simply retaining source files does not resolve this.
2. **Full production preservation.** Collect a current, private manifest of every record category and Storage object, reconcile live schema/ledger drift, and investigate the preserved staging description discrepancy without changing either copy unless separately directed. Rehearse database **and** Storage backup/restore on a disposable destination.
3. **Deployment intervals.** Rehearse the exact eleven-migration sequence, `delete-user` compatibility around the owner FK change, worker deployment/invocation, failed Storage copy, and post-Auth cleanup failure. The local runner applies one notification refinement earlier than timestamp order; verify the production order on a disposable production-version database.
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
