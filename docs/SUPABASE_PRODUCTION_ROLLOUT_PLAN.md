# Supabase production upgrade and ownership release

Prepared 2026-10-03. Status: planning only; no live upgrade performed. This is the detailed execution framework for slice 11, with gates that must be filled by staging evidence before it becomes an executable release runbook.

## Objective and user constraints

Preserve all existing users, dog profiles, parks, relationships and photos while deploying the ownership migrations, required server functions and compatible clients. The user reports very few users and no meaningful current activity; use that to arrange a short maintenance window, not to skip data validation. Verify current activity immediately before release.

Support remains an email to Ester through the existing app contact path. Ester reviews each case and performs an administrative action manually. No support dashboard or automatic recovery service is required.

Companion documents: [staging/data-import plan](SUPABASE_STAGING_PLAN.md), [ownership contract](DOG_OWNERSHIP_PLAN.md), [schema/UX contract](DOG_OWNERSHIP_SCHEMA_AND_UX.md), [handoff](CODEX_CONTEXT.md). Existing Notion ticket: <https://app.notion.com/p/3e24e04c2ff1810592a3cb0f61d736d4>.

This documentation request is not authorization to execute production mutations. A future agent should complete read-only assessment, staging rehearsal and the concrete command/recovery manifest before seeking any missing production authority. Do not invent guarantees from the feature-disabled defaults.

## Current implementation facts and known blockers

- Production reference last audited: `kbsjdfzpeianxhidguam`; reverify identity, schema and migration ledger.
- Slices 1–10 have passed local tests; feature migrations, current Edge Functions and compatibility changes have not been deployed by this work. Local success does not prove released-client compatibility.
- Repository migration history does not describe the full live baseline. Blind `db push`, baseline replay or broad ledger repair is not a release procedure.
- Feature-disabled migrations still change RLS/grants, metadata writes, Storage permissions, function contracts and `dogs.owner` deletion behavior.
- `dogs.owner` becomes `ON DELETE RESTRICT`; the new `delete-user` requires the account-erasure preparation RPC. Database/Edge/Auth/Storage changes cannot be deployed in one atomic transaction.
- Legacy object copies retain sources, but switching metadata/URLs to private dog paths can affect older clients. Retaining a file alone does not prove they can display or edit it.
- Four webhook trigger definitions historically embedded a long-lived service-role credential. Verify remediation, inventory consumers and plan rotation before feature release.
- `support_recover_dog_ownership` does not exist. Policy decisions and its tested implementation are required before full shared-ownership enablement.
- Current browser/native compatibility helper uses build `1`; concrete store/web release identities and minimum-build semantics need verification. An older client which never calls capability RPCs cannot be made compatible just by setting minimum builds.

Historical 2026-09-26 counts (not current assertions): 18 dogs, 15 active, 3 soft-deleted; 16 memberships, no invites, 15 image metadata rows in `users`, empty `dogs` bucket. All active dogs had one matching primary; two deleted dogs lacked a primary. Re-inventory everything; preserve soft-deleted rows without treating them as active invariant failures.

## Gate P1 — Support policy and manual recovery

Confirmed: email support, human decision, identity/evidence checks, contact attempts for an unreachable primary, no recovery based on silence alone, no fabricated deletion consent, and evidence-based photo removal without requiring primary approval.

Still needs explicit product approval:

| Decision | Record before implementation/enablement |
| --- | --- |
| Identity and evidence | How requester identity/relationship is established; acceptable evidence and how uncertain/disputed cases are handled |
| Contact | Who is contacted, channel, number/timing of attempts, waiting period and notice of a decision |
| Exceptional authority | Exact permitted ownership-recovery actions, eligible target and treatment of previous primary/membership; no implied co-owner eviction or deletion bypass |
| Case records | Case reference, decision/operator/time, evidence storage and access; retention/redaction durations |
| Photo removal | How photo identity/claim is verified and how removal/metadata/main-image fallback is executed |
| Partial account cleanup | How a recovery reference identifies residual cleanup and how to verify completion without trying to delete Auth twice |

Do not adopt arbitrary contact/retention numbers from another service or treat these proposed details as already approved. Capture the user's decision once, then implement it.

The manual recovery RPC contract should include:

1. Administrative execution only; no `PUBLIC`, `anon` or ordinary `authenticated` execution grants. Review `SECURITY DEFINER`, fixed `search_path` and role/grant boundaries. Supabase SQL editor operates with administrative database privileges; record the human operator/case because `auth.uid()` may not identify that operator.
2. Explicit dog, approved target, expected ownership version, case reference and retry/idempotency identity. Final parameter names follow the approved policy and schema.
3. Dog lock, active-state/target/policy validation and first-commit-wins behavior; stale state requires review again.
4. One database transaction maintaining exactly one primary, synchronized `dogs.owner`, membership history, version, cancellation of conflicting actions and minimal audit evidence. Notifications must respect privacy and transactional behavior.
5. No implicit shared deletion consent, generic direct membership editing, restoration of purged dogs or an unapproved removal bypass. The fate of the old primary must follow the approved policy rather than an agent's assumption.
6. Narrow administrative SQL examples and real local Auth/RLS/concurrency/idempotency tests, plus a staging manual rehearsal. Keep evidence text/files out of the minimal ownership audit; use an approved protected case record instead.

Photo removal and residual user-folder cleanup require separate narrow procedures. Never use ownership recovery as a generic destructive tool. Enablement gate: policy approved, functions/procedures tested, Ester has the manual instructions.

## Gate P2 — Fresh inventory, preservation manifest and migration ledger

1. Read repository instructions/current code/scripts and identify the exact commit to release. Inspect CI/hosting integration for automatic deployments from `main`; include them in the timeline rather than assuming a push is only source control.
2. Read production metadata with scoped read-only access. Record PostgreSQL/CLI versions, schema fingerprint, ledger, extensions, RLS/grants, buckets/policies, triggers, Auth settings, functions and external jobs.
3. Build a per-table preservation manifest for all existing application data, not only the staging-selected users: Auth/profile links, dogs including soft-deleted rows, memberships, actions, friendships, parks/reviews/check-ins, photo metadata and user media. Store personal data/exports privately, not in git.
4. Inventory every relevant Storage object: bucket/path, record references, size/checksum, role as avatar/main/gallery/unreferenced media. Missing files, conflicting main photos, >6 live photos, >8 owners, mismatched primaries or unexpected roles need explicit reconciliation. Do not silently discard or rewrite user data to pass constraints.
5. Reconcile live schema drift and migration history with reviewed evidence. Preserve applied migration files. Additional fixes belong in new migrations. Distinguish an imported baseline from migrations that actually still need execution.
6. Capture installed/released web/iOS/Android client versions and source/artifacts. Last historical store submissions in context are not proof of what users currently have.

Exit: every existing record category has a preservation rule; every migration has a known applied/missing state; every exceptional row has a reviewed handling decision.

## Ordered feature migration inventory

Inspect actual files and history at execution time. These are the nine feature migrations used by the current local contract runner, in order:

| Order | File | Main deployment concern |
| --- | --- | --- |
| 1 | `20260927193000_harden_existing_dog_ownership.sql` | RLS/grants/direct-write changes; legacy client operations |
| 2 | `20260928120000_add_dog_membership_foundation.sql` | Reconcile prototype, membership history/invariants, disabled compatibility rows |
| 3 | `20261002120000_add_private_dog_image_foundation.sql` | Reservations/private Storage, legacy copy jobs and image rights |
| 4 | `20261002150000_add_dog_ownership_actions.sql` | Retired prototype APIs, typed invite/request flows and notification write restrictions |
| 5 | `20261003100000_extend_dog_departure_enums.sql` | Enum commit boundary before dependent SQL |
| 6 | `20261003110000_add_dog_transfer_departure.sql` | Transfers/departure/account preparation and owner FK RESTRICT |
| 7 | `20261003130000_extend_dog_deletion_enums.sql` | Enum commit boundary before dependent SQL |
| 8 | `20261003140000_add_unanimous_dog_deletion.sql` | Consent lifecycle, deleting visibility and asset-job completion/purge |
| 9 | `20261003150000_add_dog_client_capabilities.sql` | RPC dog create/edit/read/pack contract |

Additional compatibility/security/recovery migrations may be required before rollout. This inventory is not a command to replay applied files. The fixture schema must never be applied to production as a migration.

## Gate P3 — Rehearse data upgrade and old-client compatibility

Use permanent staging for preview and isolated/disposable staging fixtures for destructive tests. Run the existing security contract suite only on its local Docker target.

1. Import representative legacy data before the feature upgrade as described in the staging plan. Include synthetic edge cases that the small live dataset may lack. Account for any live exceptions separately; selected staging import alone does not prove all production rows pass.
2. Rehearse the exact deployment commands, migration transaction boundaries, function configuration, storage-job drain, client release and compatibility enablement. Record outcomes and timing after every step.
3. Test actual released clients against the upgraded staging backend, including between deployment steps. If artifacts/dev builds are unavailable, reconstruct their exact service calls as integration tests and report the remaining real-device gap.
4. Test the new client with compatibility disabled and enabled. Older clients must retain their supported solo-user flows and data; unsafe shared writes must remain denied.

Required compatibility matrix:

| Existing operation | Required evidence |
| --- | --- |
| Login/signup/profile/pack/friend search/privacy | Existing Auth/profile links and visibility preserved; no roster leakage |
| Dog creation/details/edit | Actual legacy table/RPC calls work for solo owners; authority fields remain protected |
| Photos: view/upload/main-switch/delete | Legacy bucket/path/metadata calls verified, including after copy/metadata switch; six-slot rules do not erase old data |
| Solo dog deletion | Existing released client's real route/RPC succeeds without shared consent bypass |
| Account deletion | Legacy request bodies remain accepted, identity comes from token, preparation precedes Auth, retained shared media and residual cleanup verified |
| Parks/reviews/check-in/friends/notifications | Policy/grant changes do not break unrelated workflows; push/webhook security still works |
| Shared dog on unsupported client | Document read behavior and denied writes; cannot rely on a capability gate the old client never calls |

5. Add new migrations/transitional APIs where evidence reveals gaps. Preserve security requirements; do not restore broad writes merely for compatibility. If supporting an old write is incompatible with required authorization, present the concrete limitation and agree an upgrade requirement before release.
6. Verify before/after rows and file checksums, legacy unknown-uploader attribution, primary-photo fallback, soft-deleted rows, ownership invariants and unaffected data. Document each intentional transformation.
7. Rehearse retries and recovery: partial copy, missing object, unavailable worker, failure before/after Auth deletion and failure between migrations/function deployments. Prove the actual restoration procedure on a disposable destination.
8. Run relevant local/unit/e2e/repository checks and web/native smoke coverage; record unsupported or untested versions explicitly. Do not describe the current code as release-ready while compatibility gaps remain.

Exit: exact commands and client/record preservation evidence exist, with no unresolved release-critical compatibility exceptions.

## Gate P4 — Credential remediation, backups and final execution sheet

1. Inventory consumers of the historically exposed service-role credential: trigger/webhook auth, deployed functions, schedulers, server deployments and local/CI secrets. Do not log the credential.
2. Implement/rehearse narrow webhook authentication and credential rotation. Supabase signing-key changes can affect sessions, legacy keys and gateway verification; verify the project's actual key model and scope before changing anything. Rotation is a reviewed live operation, not an incidental migration command.
3. Verify all consumers after the rehearsed change, especially push, park-report/new-park mail and deletion/storage worker. Do not rotate first and discover dependencies afterward.
4. Produce a database backup and independent Storage backup/inventory immediately before production changes. Database backup alone is not photo backup. Record secure locations and prove recovery can restore into a separate destination.
5. Fill a release execution sheet: operator/approver, source SHA, production ref, exact pending migration list/checksums, commands with explicit target, function versions/config, secrets handled securely, worker invocation, old/new client release identities, maintenance method/duration, expected counts, checkpoint queries and recovery commands. Verify each CLI command against the installed version/help.
6. Choose a real maintenance/write-control mechanism if required. A browser banner does not stop installed mobile clients or direct requests. Rehearse how writes are prevented/allowed during schema transitions and how access returns. Do not assume inactivity is a lock.

Exit: user can review a concrete release sheet; backup/rollback and secret changes are executable, and production authorization is explicit for that release.

## Phase P5 — Production execution with compatibility disabled

The final ordering is determined by P3 rehearsal. This is a framework, not a claim the current files support an uninterrupted rollout:

1. Confirm target, approval, backups, write-control state and live counts. Recheck no unexpected shared memberships/pending actions appeared since inventory.
2. Apply the approved security and feature migration sequence only once, with checkpoint verification and required enum transaction boundaries. Stop on the first unexpected mismatch; never blindly rerun the chain.
3. Coordinate the updated `delete-user` deployment with account-erasure preparation availability and the FK change. Its current source assumes the RPC exists, while the old handler cannot correctly operate after the FK transition. Resolve that interval with a tested transitional handler/new migration or a real maintenance control. Do not deploy either incompatible intermediate state while allowing deletion requests.
4. Deploy/configure `process-dog-storage-jobs` and its service-only invocation. Verify authenticated caller checks in `delete-user` and administrative checks in the worker under the actual gateway configuration.
5. Keep all production compatibility rows disabled until the remaining gates pass. Read back the rows; defaults alone are insufficient evidence.
6. Drain legacy photo-copy jobs, verify destination bytes/metadata/client access and preserve source objects. Pause metadata switching if staging showed released-client incompatibility; follow the reviewed transition rather than improvised manual updates.
7. Publish compatible web/native clients in the rehearsed order. Record actual available builds, not submission numbers. Translate platform release identity into the server build value correctly; the current constant requires review before real minimum-version enforcement.
8. Reconcile the preservation manifest against production: users/profiles, all dog lifecycle categories, ownership mirrors, images/main selections, parks/relationships and object verification. Exercise only explicitly designated non-destructive smoke checks or dedicated approved production test accounts; never run destructive contract suites there.
9. Restore normal writes/access only once the backend/client combination is verified. Keep feature enablement separate from schema deployment.

## Phase P6 — Enablement and observation

1. Confirm support policy/recovery RPC and manual procedures are deployed and rehearsed, old data is accounted for, released clients pass and background processing is healthy.
2. Set actual minimum builds and enable only ready platforms. The current `(feature, platform)` table is platform-wide, not per-account: enabling production `WEB` also affects qualifying production web clients, including localhost connected to that backend. If a user cohort rollout is desired, implement/review a separate mechanism first.
3. Observe representative solo and shared journeys with dedicated test accounts. Monitor invariant/RLS denials, Auth/deletion failures, function logs, Storage job states/age/retries, missing-file/checksum exceptions, notifications and client errors. Record cadence/operator/observation period in the execution sheet.
4. Do not retire legacy source files or compatibility APIs until the reviewed observation/rollback period ends and old clients no longer depend on them. Retirement requires a separate explicit operation and verification.

## Stop conditions and recovery

Stop rollout/enablement on unexplained missing records/files, identity/owner mismatch, unauthorized access, broken released-client flows, incomplete backup, unhealthy jobs, unexpected production drift or exposed secrets. Record which step committed and the current data state.

- Disable shared compatibility to prevent new supported-client ownership actions. This does not undo schema changes, revoke every old direct operation or return already-shared dogs to a solo-owner model.
- Keep additive schema/audit evidence and retained legacy sources. Prefer a rehearsed forward corrective migration; do not reverse-copy shared uploads or edit applied migration files.
- Client rollback is safe only if the older client was tested against the current schema/data. It may be incompatible once shared dogs exist or photo metadata switched.
- Pause storage processing only with a documented backlog/recovery plan; otherwise `DELETING` dogs and pending copies can remain incomplete.
- Database restore can lose post-backup writes and does not restore Storage/Auth/external services as one transaction. Use the rehearsed scoped recovery or full recovery procedure, reconcile files and Auth state, and account for writes since backup.
- Auth-deleted cleanup failures require the support reference and administrative file reconciliation, not a client retry of account deletion. Recovery cannot promise restoration of an erased account or purged dog.

## Required artifacts and final handoff

The implementing agent must leave:

- Verified baseline/ledger reconciliation and any new compatibility/security/recovery migrations.
- Before/after preservation manifest and Storage verification evidence stored privately; a secret-free outcome summary in the repository.
- Approved email/manual support policy and prepared administrative recovery/photo-removal/cleanup instructions.
- Staging rehearsal results for the exact production sequence and legacy-client matrix.
- Completed release execution sheet, backup recovery verification and tested stop/rollback procedures.
- Exact git SHA, migration/function versions, platform compatibility/build values, remaining legacy dependencies, worker operation and monitoring owner.
- Updated `CODEX_CONTEXT.md` and the existing Notion ticket; mark the feature complete only after required rollout/support acceptance, not merely after documenting or deploying SQL.

## Resume prompt

> Prepare and execute the next authorized stage of `docs/SUPABASE_PRODUCTION_ROLLOUT_PLAN.md`. Read `AGENTS.md`, `docs/CODEX_CONTEXT.md` and the staging plan first. Verify production read-only, preserve all existing data, test actual released-client calls, resolve support policy/recovery and credential dependencies, and rehearse the complete ordered rollout in staging. Produce the exact release/backup/recovery execution sheet before requesting missing production deployment approval. Do not assume feature-disabled SQL preserves older-client behavior, and do not run destructive tests on production.

## Official references

Reviewed during planning on 2026-10-03; reverify current platform behavior before implementation:

- [Migration deployment](https://supabase.com/docs/guides/deployment/database-migrations).
- [Separate environments](https://supabase.com/docs/guides/deployment/managing-environments).
- [Restore to a new project and limitations](https://supabase.com/docs/guides/platform/clone-project).
