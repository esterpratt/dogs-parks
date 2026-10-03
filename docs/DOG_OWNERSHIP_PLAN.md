# Shared dog ownership plan

Planning checkpoint: 2026-09-26. Final implementation plan: 2026-09-26. Source: user decisions in the planning conversation and the [existing Notion ticket](https://app.notion.com/p/3e24e04c2ff1810592a3cb0f61d736d4).

## Resume here

Product, design and technical decisions below are confirmed; do not ask the user to choose them again. Production behavior implementation has not started; the isolated local-Supabase test foundation is in progress at the checkpoint recorded in [CODEX_CONTEXT.md](CODEX_CONTEXT.md). The table/deletion-rule inventory and complete clickable proposal in [DOG_OWNERSHIP_SCHEMA_AND_UX.md](DOG_OWNERSHIP_SCHEMA_AND_UX.md) are approved as the implementation contract. The only intentionally open area is the operational support policy; the support-recovery RPC must not ship until that separate policy is decided.

If implementation exposes a genuinely new material product choice, ask one focused question directly in chat. Routine schema, testing and UI implementation choices are resolved below and should not restart design discovery.

Read [CODEX_CONTEXT.md](CODEX_CONTEXT.md) for the live audit, access, security findings and other project context. Notion remains the task source of truth.

## Confirmed ownership and privacy rules

- Several users share one dog profile; each user can have multiple dogs.
- Exactly one primary owner per active dog, plus optional co-owners.
- A dog can have at most 8 active owners total, including the primary owner.
- All owners edit dog details, upload photos and select the main photo.
- Primary can delete any photo; co-owners can delete their own uploads.
- Only primary sends invitations, approves ownership requests, initiates ordinary primary transfer and proposes shared-dog deletion.
- Owners cannot remove another owner through normal product actions. Leaving is distinct from deleting the dog.
- Hidden owners' names and avatars are visible to fellow owners in the owner-only Ownership tab. Disclose this before joining; hide mode remains outside that group.
- Preserve friend search returning user cards and existing privacy/discoverability rules. Do not expose ownership lists to non-owners.
- Check-in stays user-based. Accompanying-dog selection and deduplicated dog attendance are separate scope.

## Confirmed invitations and ownership requests

- Primary can invite existing friends only; recipient must accept.
- Only friends of the primary can request ownership from the dog page; primary must approve.
- Requester accepts the privacy/shared-editing disclosure before submitting. Primary approval adds them immediately; no second requester confirmation.
- Unanswered invitations and requests expire after 30 days.
- After an invitation or request is declined or canceled, the same pair may create a new action immediately. Duplicate pending/crossed actions remain blocked and submission retries remain idempotent.
- Pending outgoing invitations cannot exceed the dog's remaining owner slots: `8 - active owner count`. Invitation creation and acceptance both recheck capacity.
- At 8 active owners, hide or disable Request ownership. Existing pending requests remain pending, cannot be approved until a slot opens, and retain their original 30-day expiry.
- Primary owners may cancel pending invitations; requesters may cancel their own pending requests. Invitees/request recipients may decline.
- Ending the relevant friendship cancels pending invitations and requests. Existing ownership is unaffected.
- Changing the primary cancels all pending invitations and requests, rather than handing them to the new primary.
- Responses are reached through the existing Notifications area, opening a dedicated response page. Owners also see pending items in Ownership.

## Confirmed ordinary transfer and departure

- Ordinary primary-role transfer can target an existing co-owner only.
- It requires recipient acceptance and expires after 30 days. Until acceptance, the current primary retains their role.
- On acceptance, the old primary remains a co-owner.
- Leaving/account deletion uses different succession semantics: no successor acceptance is required.
- The departure screen preselects the longest-standing eligible co-owner, clearly names them and lets the departing primary choose another co-owner before confirming.
- Any active co-owner whose account is not being deleted is eligible for automatic succession; hide/private mode does not disqualify them.
- Rejoining starts a new continuous tenure for succession ordering.
- If the selected successor becomes ineligible before commit, automatically use the next longest-standing eligible co-owner and notify the departing owner which successor was used.
- Account deletion uses one review page for all affected dogs, each shared dog showing its changeable preselected successor.
- When the primary is the dog's only owner, do not show a Leave action. The only ownership-removal action is Delete dog.
- Shared dogs remain with the remaining owners. When no co-owner exists, preserve current deletion behavior after verifying actual cascades and the delete RPC.

## Confirmed shared-dog deletion

- Only primary can start a proposal; all current owners must explicitly consent.
- Starting a proposal records the primary owner's approval.
- Proposals expire after 30 days. Inactivity/silence never counts as consent.
- Delete immediately after the final approval, clearly explaining before approval that it may complete deletion.
- Any rejection cancels the proposal immediately.
- An owner may withdraw approval while pending; withdrawal cancels the entire proposal.
- Any owner joining or leaving cancels the proposal.
- Any change of primary cancels the proposal, even if both people remain owners.
- A fresh proposal requires fresh consent from everyone. Withdrawal is unavailable after deletion has completed.

## Confirmed photos and support policy

- Legacy photos have unknown uploaders; do not invent attribution to the current primary. All owners can select them as main photo, but only primary can delete them.
- Preserve the current photo capacity: at most 5 secondary gallery photos plus 1 main photo, represented in the new model as at most 6 active dog-image records total.
- When the main photo is deleted, automatically select the newest remaining non-deleted photo. If no photos remain, the dog has no main photo.
- Shared photos survive uploader account deletion; remove uploader attribution.
- Support-reviewed recovery is included in the first release, using the existing support contact path.
- For an unreachable primary, support requires evidence and attempts to contact them. Silence alone does not authorize transfer or count as deletion consent.
- For photo-removal requests after account deletion, support asks the requester to identify the photos and provide evidence. A claim alone does not cause removal; current-primary approval is not required.
- Detailed operational evidence/contact/recordkeeping rules remain to be specified. These choices do not authorize an automatic or hidden deletion-consent bypass.

## Final design contract

Use the existing React/Vite/SCSS visual language and the established `Header`, `PrevLinks`, `TabsList`, `Section`, `Button`, loader and confirmation-modal patterns. Do not copy the prototype's standalone CSS into the app.

1. Dog Details and owner-only Ownership are nested, URL-backed tabs. The gallery remains at the bottom of Details; there is no Photos tab. Eligible friends see a discreet Request ownership action but never see the Ownership tab.
2. Keep the existing dog-header pencil as the single general edit entry point and authorize it for every active owner. Remove Delete dog from the edit modal.
3. Photo upload, deletion and main-photo selection live only in the gallery. The header photo is display/enlarge only; remove the separate primary-photo upload control.
4. Ownership shows the roster, contextual pending/empty state and role-permitted actions. Primary-only controls never render for co-owners. A solo primary has Delete dog but no Leave action.
5. Durable, refresh-safe pages are used for ownership requests, notification responses, departure/succession, account-deletion review and shared deletion.
6. Existing modal language is retained for short local interactions: edit details, capture/select a photo, choose an invitee, choose a transfer recipient, and final destructive confirmations. Cancellation that is immediately recoverable does not require an extra modal; rejection, approval withdrawal, final deletion approval, solo deletion and final account deletion do.
7. Settings keeps one Delete profile entry point, which navigates to the private review route. The current direct-deletion modal is removed. The existing public `/delete-account` information page remains separate.
8. Response pages cover invitation, ownership request and primary-transfer variants. They remain readable in expired, declined, canceled and already-responded states, with no active controls.
9. Include contextual no-pending-actions, no-eligible-invitees, no-dogs and no-photos states plus loading, request pending, capacity, error, stale permission, access lost and dog-deleting states.
10. Direct URLs must work without router state. Support Hebrew RTL, accessible names/focus order, Android system back, iOS back expectations and keyboard-safe scrolling.

Confirmed route shapes: `/dogs/:dogId` (Details), `/dogs/:dogId/ownership`, `/dogs/:dogId/ownership/request`, `/ownership-actions/:actionType/:actionId`, `/dogs/:dogId/ownership/leave`, `/dogs/:dogId/ownership/deletion/:proposalId`, and `/profile/:id/settings/delete-account/review`.

## Final technical design

Confirmed:

- Use separate typed tables for invitations, requests, transfers and deletion proposals.
- Keep departed membership rows with `left_at`; account erasure nulls identifying references. Rejoining creates a new tenure.
- `dog_members` is authoritative. Keep `dogs.owner` synchronized as a compatibility mirror and remove it later.
- Enforce exactly one primary with lifecycle RPC checks plus a deferred database constraint trigger.
- Expiry is enforced server-side in read/response RPCs and marked lazily; no scheduler or client authority.
- Move all dog photos to dog-ID paths in a private `dogs` bucket. Use authenticated short-lived signed URLs with client caching; copy and verify legacy objects before retiring them.
- Dog deletion immediately hides the dog as `DELETING`, retries storage cleanup asynchronously, then hard-deletes relational data after verification.
- Preserve today's notification architecture: ownership RPCs write existing notification rows, Realtime updates the app, and existing push delivery runs independently. In-app ownership notifications always appear; push may be muted through current preferences.
- Preserve today's single `delete-user` Edge Function pattern rather than adding an erasure-job system. Verify the session-derived target, apply atomic ownership transitions, paginate cleanup and keep shared dog photos. A post-Auth cleanup failure requires support/manual recovery.
- Require the minimum shared-ownership-capable app version before accessing shared-ownership features.
- Use local Supabase with Docker for real migration/RLS/RPC/Auth/Storage tests.
- Generate database types from the locally migrated schema while retaining and mapping UI domain types.
- Ownership-request creation is limited to 10 successfully created requests per requester in a rolling 24-hour window. Idempotent retries do not consume another slot. Return a typed `RATE_LIMITED` outcome with `retry_after`; do not silently drop requests. Invitation capacity remains the stricter per-dog limit already confirmed.
- Only one pending primary-transfer offer may exist per dog. Creation while one is pending returns `ACTION_ALREADY_PENDING`; the primary must cancel it first. Target departure, source departure/loss of primary, any completed primary change, dog deletion or account erasure cancels it. Transfer acceptance and any competing departure lock the dog and action; the first commit wins and the loser receives `STALE_VERSION`.
- Creation RPCs accept a client-generated UUID idempotency key stored on the action row with an actor-scoped unique constraint. Retrying the same key returns the original action. Response/cancel RPCs are naturally idempotent and return the persisted terminal state.
- Expected business conflicts return a typed result with `outcome`, `entity_id`, `status`, `ownership_version`, `expires_at`, `cancellation_reason`, and optional `retry_after`. Stable outcomes are `APPLIED`, `NO_CHANGE`, `ACTION_ALREADY_PENDING`, `CAPACITY_REACHED`, `EXPIRED`, `NOT_ELIGIBLE`, `RATE_LIMITED`, `STALE_VERSION`, and `UPGRADE_REQUIRED`. Authentication failures, forbidden access and invariant failures remain database errors and do not reveal private rows.
- Signed dog-image URLs live for 15 minutes. Cache URL results in memory by image ID/path and refresh when two minutes or less remain; do not persist signed URLs. Clear private image queries on logout/account deletion. Immutable paths allow normal decoded-image caching while access decisions are rechecked whenever a URL is minted.
- Minimum-version enforcement is capability-based and platform-specific. Before shared ownership is enabled, ship a prerequisite client that moves solo dog/profile/photo writes to the new RPC layer. Legacy direct policies may operate only on dogs with exactly one active member; they deny shared dogs. A service-managed compatibility table stores an enabled flag and minimum integer build for iOS, Android and Web. Every capability/lifecycle RPC receives platform/build, checks the table, and returns `UPGRADE_REQUIRED`; concrete minimum build values are deployment data set after the prerequisite store builds exist, not an unresolved design choice.
- The migration is additive and feature-disabled first. It reconciles the live prototype, asserts invariants, keeps `dogs.owner` synchronized, copies and verifies legacy objects without deleting sources, and enables UI only after monitoring. Rollback disables new capabilities/RPC entry points, preserves additive evidence and legacy source objects, and never reverse-copies shared uploads.
- Exact table/RLS/grant/storage contracts are defined in [DOG_OWNERSHIP_SCHEMA_AND_UX.md](DOG_OWNERSHIP_SCHEMA_AND_UX.md). Function and enum names may receive mechanical SQL-safe refinements without changing behavior.

Intentionally open and nonblocking for starting core implementation: support evidence, contact/waiting periods, exceptional authority, decision-record retention and redaction. Do not implement or grant `support_recover_dog_ownership` until those operational decisions are approved. Because support-reviewed recovery is confirmed for the first release, the full shared-ownership release may not be enabled until that policy and RPC are completed; security hardening may ship independently.

## Implementation sequence

Each behavior slice starts with failing local integration tests and ends with focused tests plus repository verification. Do not connect destructive tests to the live project.

1. **Local Supabase foundation.** Start Docker, pin/record the Supabase CLI version, and create a reproducible test bootstrap from a read-only, schema-only snapshot of the current project. The repository's six migrations are not a complete database history, so store the sanitized current-schema fixture outside `supabase/migrations`; a local test script applies that checkpoint, then only newer feature migrations. Add the currently configured but missing local seed or remove that configuration deliberately. Seed multiple real local Auth sessions and Storage fixtures. Add one command that starts/resets the stack and runs SQL/SDK integration tests in CI and locally.
2. **Baseline and security characterization.** Prove current solo-owner, multi-dog, gallery, friend privacy, notifications and user check-in behavior. Add failing tests for the known `delete-user` caller/target flaw, permissive dog/storage policies, direct membership writes and split transfer authority. The sanitized schema export revealed a production service-role JWT embedded in four webhook trigger definitions; never commit it or reuse it locally.
3. **Urgent independent security fixes.** Verify the delete-user Edge Function caller, derive the target from the session, and retain the current single-function mechanism. Inventory service-role-key consumers, replace database webhook trigger authentication with a narrowly scoped webhook secret/Vault-backed mechanism, rotate the exposed service-role key, and verify every dependent function. These changes require a separately reviewed live rollout but may ship independently after local tests because they fix existing vulnerabilities.
4. **Membership foundation migration.** Reconcile live prototype tables through a new additive migration; backfill active primary memberships, add version/lifecycle invariants, synchronize `dogs.owner`, revoke unsafe grants, and generate local database types. Keep the feature disabled.
5. **Private image foundation.** Add dog-scoped metadata/reservations, private `dogs` bucket policies and 15-minute signed URLs. Copy and verify legacy objects with resumable jobs; keep source objects through the rollback window. Replace header-photo upload with gallery-only management.
6. **Invitation/request vertical slice.** Add failing lifecycle/RLS/rate-limit/idempotency tests, then RPCs, capabilities, notifications and the request/invite UI.
7. **Transfer and departure slice.** Add concurrency and succession tests, then transfer, co-owner leave, primary leave and account-erasure preparation.
8. **Unanimous deletion slice.** Add owner-set/version/expiry/race tests, then proposal/consent RPCs, immediate `DELETING` visibility and retryable storage cleanup.
9. **Client capability migration.** Replace single-owner queries, grouping, caches and router-state authorization; add the approved routes, states and role-specific controls. Preserve notification Realtime/push mechanics.
10. **Account-deletion review and hardening.** Route Settings through the review page, apply all dog transitions atomically before Auth deletion, paginate user-scoped cleanup, preserve shared dog images and surface manual recovery for partial post-Auth failure.
11. **Compatibility and release rollout.** After the operational support policy and recovery RPC are approved, ship the prerequisite client, set platform minimum versions, enable shared ownership gradually, monitor invariant/storage/auth denials and only later retire legacy paths. Security fixes may deploy earlier; the full first release cannot omit confirmed support-reviewed recovery.

Detailed handoffs added 2026-10-03: [permanent staging and selected-data import](SUPABASE_STAGING_PLAN.md) and [production upgrade, data preservation and release runbook](SUPABASE_PRODUCTION_ROLLOUT_PLAN.md). The user wants email support to Ester with manual administrative action, and persistent staging using selected copies of their production data. These plans are not executed deployments; they specify remaining policy decisions, bootstrap/history reconciliation, old-client verification, safe sequencing and recovery gates.

General reliability backlog, package upgrades, redesign, React Native migration, duplicate-profile merging and dog-attendance redesign are not implicit scope additions.

## Tests before behavior changes

Historical baseline on 2026-09-26: 67 tests in 9 files passed. These utility-heavy tests do not prove shared ownership or real database authorization. No ownership tests have been added. Existing tools are Vitest/happy-dom and Playwright. The confirmed integration-test target is a local Supabase stack using Docker and is mandatory implementation slice 1, not optional infrastructure.

Repository prerequisite audit on 2026-09-26: Docker CLI and Supabase CLI are installed, but the Docker daemon is not running; `supabase/seed.sql` is configured and missing; the checked-in migrations are not a self-contained historical baseline; and no local Auth/RLS/RPC/Storage runner exists. Resolve these before adding production-facing feature behavior. The schema-only bootstrap may read the live schema but must not write to the live project or contain production rows/secrets.

1. Establish green baseline regressions for solo ownership, several dogs per user, gallery, friend search/hide mode and independent user check-ins. Record actual current defects as failures, not expected behavior.
2. Add meaningful new-feature tests, demonstrate failure before implementation, then build one vertical slice at a time.
3. Test each confirmed rule above, including exact 30-day boundaries, friendship cancellation, primary-change invalidation, withdrawal and immediate final approval.
4. Test races/retries: duplicate or crossed joins, simultaneous approvals, membership changes during deletion, transfer versus departure, concurrent account deletion and stale successor selection.
5. Test real RLS/RPC/storage authorization with primary, co-owner, former owner, outsider and anonymous sessions. Include direct table/object bypass attempts, hidden-owner disclosure and caller/target account deletion.
6. Test retained photos, null/legacy attribution, migration file integrity, main-photo consistency and explicit manual-recovery behavior after a partial account-deletion failure.
7. Run multi-session Playwright journeys and targeted Web/iOS/Android checks for notifications, photos, RTL, direct links, keyboard/back and connectivity.
8. Run npm test, relevant existing e2e scripts, npm run lint, npm run build and git diff --check after implementation. Do not use production accounts for destructive tests.

## Plan-finalization and delivery gates

- This document and the schema/UX package are the final implementation contract. Product, design, authorization, API, migration, caching, compatibility and test-infrastructure decisions are complete.
- The operational support policy is outside the implementation-start gate but remains inside the first-release gate; the support-recovery RPC is gated off until that separate decision is complete.
- The table/deletion-rule inventory, authorization matrix, migration/compatibility plan and complete clickable prototype are approved before behavior changes.
- Local Docker Supabase bootstrap and real Auth/RLS/RPC/Storage tests pass before any production-facing ownership behavior is enabled.
- Tests map to every agreed rule and demonstrate both permitted and forbidden actions.
- Existing solo-owner flows and data survive the transition; all shared-owner journeys and concurrency invariants pass.
- Real authorization tests, migration/recovery checks, native smoke checks and required repository checks pass.
- Update Notion and the concise handoff to reflect actual delivery; do not mark the feature complete based on documentation alone.

## Copyable implementation prompt

Read `AGENTS.md`, `docs/CODEX_CONTEXT.md`, `docs/DOG_OWNERSHIP_PLAN.md`, and `docs/DOG_OWNERSHIP_SCHEMA_AND_UX.md`. Treat the product, design and technical contracts as final. Start with implementation sequence slice 1: establish the reproducible local Supabase Docker bootstrap and real Auth/RLS/RPC/Storage test runner without writing to the live project. Account for the incomplete checked-in migration history and missing seed. Do not implement the support-recovery RPC; its operational policy remains intentionally open. Demonstrate failing tests before each behavior slice and follow the repository branch, verification, commit, merge and push workflow.
