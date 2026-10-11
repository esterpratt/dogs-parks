# Dog ownership test plan and audit

Prepared 2026-10-11 against `DOG_OWNERSHIP_PLAN.md`, `DOG_OWNERSHIP_SCHEMA_AND_UX.md`, the implementation on `main`, and the staging/production runbooks. Run destructive contract tests only against the isolated Docker stack; browser journeys use guarded disposable staging fixtures. Never run them against production.

## Completion criteria

The feature is complete only when the server invariants and permissions, client journeys, old-client compatibility, manual support recovery, native behavior, data preservation, and production rollout gates pass. A successful local or staging suite proves only the scenarios it executes.

## Test matrix

| Area | Cases, including boundaries and failures | Evidence to run |
| --- | --- | --- |
| Membership and privacy | Exactly one active primary and synchronized `dogs.owner`; multiple dogs per user; historical tenure/rejoin ordering; 8-owner boundary; hidden owner names only to fellow owners; anonymous, outsider and former-owner reads/writes denied; direct table/RPC grant bypass denied. | `npm run test:supabase`; staging browser owner/outsider flows. |
| Invitations and requests | Existing-friend eligibility; disclosure; one pending/crossed action; same-key retry; immediate retry after decline/cancel; 30-day exact expiry; capacity at creation and response; pending invites limited to open slots; request throttle 10 per rolling 24 hours and `retry_after`; friendship termination; notification link, read state and terminal page after refresh. | Local action contract; staging ownership and edge journeys. Add browser coverage for request links and all terminal variants. |
| Transfer and leave | Only primary offers to active co-owner; one pending offer; acceptance changes primary, mirror and version; previous primary remains; target/source departure and primary change cancel offer; accept/leave race; co-owner leaves self only; solo primary cannot leave; default longest-standing successor, manual choice, stale choice fallback and notification; hidden owner remains eligible. | Local transfer contract; staging journey. Native and full stale-choice UI checks remain. |
| Dog deletion | Solo deletion; shared proposal by primary only; primary approval recorded; every current owner must consent; reject/withdraw/cancel/expiry; owner join/leave or primary change cancels; duplicate final response and final-consent/departure race; dog immediately hidden as `DELETING`; retrying worker and verified asset purge; no consent inferred from silence. | Local deletion and worker contracts; staging journey. Inject remote worker/storage failures and verify recovery. |
| Photos | Private dog-ID object paths and signed URL permissions/expiry; immutable reservation/finalization; 6 active/reserved image limit; co-owner deletes only own upload; primary deletes legacy unknown uploader; newest remaining image becomes main; uploader erasure removes attribution without deleting shared photo; missing object/copy retry; legacy source retained and checksummed. | Local image contract; staging edge and account-erasure journeys; staging import verification. Test signed URL expiry and remote partial-copy failure separately. |
| Account erasure | Session-derived target prevents deleting another account; all dogs transition atomically; chosen/default successors; solo dog hidden; shared photos survive and attribution clears; 105+ nested legacy objects paginate; Auth deletion and session loss; failures before/after Auth deletion return a recoverable support reference. | Local Edge contract; staging account-erasure journey. Inject an actual remote post-Auth cleanup failure. |
| Client and notifications | Direct URLs and refresh without router state; role-specific controls; disabled/minimum-build outcomes; loading/error/access-lost/stale state; Realtime missed-event reconnect; in-app notification regardless of push mute; request/deletion action links and all terminal/expired views; Hebrew RTL and small screen focus/scroll; Android system back and iOS back. | Vitest; staging Playwright; native devices for platform back and keyboard behavior. |
| Migration and release | Production schema/ledger inventory; exact old-client solo flows before and between upgrades; data/file preservation and restored backup; webhook secret remediation and rotation; support recovery policy/RPC with authorization, concurrency and audit; real build numbers; platform flags; monitoring/rollback. | Staging rehearsal using released artifacts, then separately authorized production runbook. Never infer a pass from local tests. |

## Execution commands

1. `npm run test:supabase` — rebuilds the dedicated Docker fixture and tests migrations, SQL/RLS/RPC/Auth/Storage/Edge behavior.
2. `npm test -- --run` — client unit tests.
3. `npm run test:e2e:staging -- tests/e2e/ownership` — guarded staging browser ownership journeys. Inspect disposable cleanup and drain staging storage jobs afterward.
4. `node supabase/staging/verify-import.mjs` — recheck selected imported records and files after browser tests.
5. `npm run lint`, `npm run build`, `git diff --check` — repository gates.

## Execution record — 2026-10-11

| Check | Result |
| --- | --- |
| `npm run test:supabase` | Passed: 72 local contract checks across baseline, hardening, membership, images, actions, transfer/departure, deletion, capabilities and account erasure. The dedicated local stack stopped afterward. |
| `npm test -- --run` | Passed: 100 tests in 16 files. |
| `npm run test:e2e:staging -- tests/e2e/ownership` | Passed: all 3 browser journeys, covering multi-session actions, notification/photo edges and account erasure. Console output still contained fetch, conflict, 403 and Edge Function errors; some arise during deliberate failure/disconnect checks, and their full causes were not audited here. |
| Guarded staging cleanup and storage drain | Passed: 3 inventoried disposable browser dogs entered cleanup; 6 jobs completed with 0 failed in this drain, and the queue reported 109 completed total with no other state. |
| `node supabase/staging/verify-import.mjs` | **Failed:** `Imported dogs.description differs`. A read-only comparison found 1 of 4 imported dogs differs from its private fixture by one character (fixture index 2, length 19 vs. 20). The browser ownership tests use marked disposable dogs, but this audit cannot date or attribute the imported-row edit. No imported data was changed to hide the failure. The verifier stopped at this field, so later file checks did not run in this audit. |
| `npm run lint`; `npm run build` | Passed. Build emitted the existing >500 kB chunk warning. |
| `git diff --check` | Passed. |

## Remaining work and unpassed cases

1. Investigate the imported description drift using private staging evidence; decide whether the edit is intentional, then rerun the full import/file preservation verifier. Keep the original import fixture immutable.
2. Exercise request and deletion notification links, every terminal/expired action page, and signed URL expiry in browser tests. The current staging suite covers invitation/transfer links and invite expiry, not the full matrix.
3. Inject actual staging Storage/copy and post-Auth cleanup failures, verify retry/manual recovery, and test native iOS/Android back, keyboard and released-client compatibility. Unit simulations and local Edge checks do not replace these runs.
4. Resolve the approved manual support policy details, implement and test the service-only recovery procedure, then rehearse old-client upgrade, backups/restore, webhook credential remediation, build gates and the production rollout described in `SUPABASE_PRODUCTION_ROLLOUT_PLAN.md`. Shared ownership remains unreleased in production.

The full test plan has **not** passed. The green local and browser suites establish the listed implemented paths; the failed preservation check and unrun release/platform cases remain open.
