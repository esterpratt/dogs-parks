# KlavHub current context

Short bootstrap and handoff; Notion is the task source of truth. Permanent coding instructions live in `AGENTS.md`. Release and prior-work status below reflect the user-provided handoff.

## Current state

- Backlog review completed on 2026-09-21. The next feature is shared **dog ownership**; the prior park-ownership interpretation was incorrect.
- Recent park-details and modal-submit fixes were completed, verified, merged into `main`, and pushed.
- iOS 1.2.4 (build 12) was uploaded and submitted to Apple.
- Android 1.0.9 (versionCode 11) was uploaded to Google Play checks.
- Store review and publication status may need follow-up.
- The database is the source of truth for park data; park sizes are `small`, `medium`, `large`, and `huge`.
- Device-token registration was fixed using `api_upsert_device_token`.
- Missing park details use the secured `api_update_missing_park_details` RPC.
- Existing Supabase migrations must not be edited or rerun; see `AGENTS.md` for database change rules.

## Notion connection and task workflow

Connected to **ester prat's Notion** through the existing Notion tools; read access verified. The user identified [Dogs Parks](https://app.notion.com/p/0a4024c603da464487a7a0823ab8b3cc) as the KlavHub task database. Data source: `collection://0fe99187-19a5-4c1c-bf6c-1497977a1074`.

- Ticket title: `TODO`; progress: `Status` (`Not started`, `In progress`, `Done`); category: `Subject`; scheduling: `When`.
- Existing categories: `Next Steps`, `Tech Debt for App`, `For Next Version`, `To Learn in Next Version Tasks`, `Tech Debt for Learning`, `JIRA`, `Bug`.
- No dedicated priority field or project relation exists. Keep priority rationale in ticket content; database membership identifies the project.
- Read the unfiltered table view (`view://7a266ef8-da36-4b5a-a259-f71b224d4b0f`) with pagination, then fetch candidate ticket bodies before selecting or changing tickets. On 2026-09-21, reviewed all 136 existing non-archived row summaries, all 20 open ticket bodies, and three relevant completed ticket bodies; created four missing handoff tickets afterward.
- Before creating a ticket, check existing titles and relevant bodies for overlap. Create missing tickets in this data source using existing categories and `Not started`.
- Set `In progress` when implementation starts; record implementation notes, verification, and decisions in the ticket body while preserving existing content. Set `Done` only when the agreed work is complete. Record architectural proposals and user decisions in the relevant feature ticket.
- Notion read and write access verified. Four handoff tickets were created as `Not started`; existing ticket content, statuses, and database schema were preserved. Do not duplicate the database or change its schema without explanation and approval.

Immediate next step: continue implementation sequence slice 1 in [DOG_OWNERSHIP_PLAN.md](DOG_OWNERSHIP_PLAN.md) from the paused local-Supabase checkpoint below. Product, design, schema, authorization, API, caching, compatibility and rollout decisions are final; do not restart discovery. Operational support policy remains intentionally separate and does not block starting implementation, but the confirmed first release cannot enable fully until its recovery RPC is approved and complete. General reliability and duplicate-report work remain separate backlog tasks.

## Reconciled handoff tasks

- [Central write timeout and offline behavior](https://app.notion.com/p/3e24e04c2ff181128aa3f233846c8e3d): acceptance criteria include late success, safe retry, duplicate prevention, and Web/iOS/Android coverage. No runtime tests performed during review.
- [Gradual Supabase type adoption](https://app.notion.com/p/3e24e04c2ff1817b8cc0fcf6b870dfdb): retain UI domain types and map actual database results. Prior 66-error/22-file count is handoff information, not a fresh result.
- [New park suggestion save test](https://app.notion.com/p/3e24e04c2ff181558180d47cfcd658dc): deferred and nonblocking; separate from the completed confirmation-modal ticket.
- Existing [duplicate review reports](https://app.notion.com/p/1b44e04c2ff18061a7bdf7f1807541e8) and [upside-down mobile photos](https://app.notion.com/p/2344e04c2ff180cf933ec82667918ec9) remain open. Live database uniqueness and current photo reproduction were not verified. The old completed Security ticket concerns Firebase and does not establish current Supabase authorization safety.
- Store publication status remains unverified. Redesign and React Native migration are separate open backlog items, not authorized scope expansions.

## Next major feature: shared dog ownership

Discovery is recorded in [the corrected ownership planning ticket](https://app.notion.com/p/3e24e04c2ff1810592a3cb0f61d736d4). Several users should share one dog profile; a user may still have multiple dogs. Confirmed by the user:

The final 2026-09-26 product/design/technical contract and implementation sequence are in [DOG_OWNERSHIP_PLAN.md](DOG_OWNERSHIP_PLAN.md) and [DOG_OWNERSHIP_SCHEMA_AND_UX.md](DOG_OWNERSHIP_SCHEMA_AND_UX.md). The standalone prototype now covers owner/friend, role, modal, response, departure, account deletion, shared deletion, empty and terminal states. No production feature behavior or deployable feature migration has changed; only documentation, the prototype and the isolated local-test baseline described below have changed.

- One primary owner plus co-owners, with shared day-to-day editing as the working model.
- Confirmed 2026-09-26: each dog can have at most 8 active owners total, including the primary.
- Confirmed 2026-09-26: declined or canceled ownership invitations/requests may be recreated immediately; pending duplicates/crossed actions remain blocked and retries remain idempotent.
- Confirmed 2026-09-26: pending outgoing invitations for a dog cannot exceed its remaining slots under the 8-owner maximum; creation and acceptance recheck capacity.
- Support both invitations (recipient accepts) and ownership requests.
- All owners upload and select the main photo; co-owners delete their own uploads; primary can delete any photo.
- Ordinary primary-role transfer requires acceptance; the previous primary remains a co-owner.
- Shared dog deletion requires all current owners' consent. Preserve current behavior when no co-owner exists, after verifying live cascades and the delete RPC.
- Final UI boundary: URL-backed pages for durable/deep-linked ownership journeys; existing modal patterns for short selection/edit/final-confirmation actions. Keep the header pencil for all owners, move all photo management to the gallery, and remove dog deletion from the edit modal.
- Photos stay in the gallery at the bottom of Details; use Details and owner-only Ownership tabs, not a separate Photos tab.
- Support-reviewed recovery is approved for the first release; exceptional-case handling still needs definition.
- Confirmed 2026-09-26: hidden owners’ names and avatars are visible to fellow owners in the owner-only Ownership tab, disclosed before joining; hide mode remains outside that group.
- Confirmed 2026-09-26: shared photos survive uploader account deletion, with uploader attribution removed and support handling content-removal requests; detailed support procedure remains open.
- Confirmed 2026-09-26 after repository verification: preserve the current photo capacity of 5 secondary gallery photos plus 1 main photo, represented as at most 6 active image records in the unified model.
- Confirmed 2026-09-26: deleting the main photo promotes the newest remaining non-deleted photo; if none remain, the dog has no main photo.

Latest user preferences: preserve user-card friend search and hide mode; put a discreet Request ownership action on the dog page and ownership management in an owner-only tab. Primary owners should not remove co-owners. Leaving/account deletion should offer successor selection with automatic promotion of the longest-standing eligible co-owner when none is selected, without recipient acceptance. These departure semantics differ from ordinary voluntary transfers. When a dog has only one owner, do not display Leave; Delete dog is the only ownership-removal action.

Repository findings: dog queries use a single `dogs.owner`; image paths and their cached owner ID depend on that owner; dog edit controls depend on navigation state. The deployed `delete-user` source matches the checked-in function and removes the user's storage folder after deleting Auth.

Confirmed design direction: separate typed ownership-action tables; historical memberships closed with `left_at`; `dog_members` authority with synchronized legacy `dogs.owner`; RPC plus deferred-trigger invariants; lazy server-side expiry; dog-ID paths in a private bucket with signed URLs; and `DELETING` followed by retryable dog-asset purge. Preserve today's notification and single-Edge-Function account-deletion mechanics, hardened for verified caller identity, atomic ownership transitions and paginated cleanup. No application or database behavior has been implemented.

Live audit completed read-only on 2026-09-26. The production database already has undocumented `dog_members`, `dog_invites`, and `dog_images` tables plus invitation/transfer RPCs, but the migration ledger and repository contain none of that schema. This is an unused prototype: all 15 active dogs have one primary membership, while no dog has an editor/viewer; all 15 tracked dog images still live in the `users` bucket and the `dogs` bucket is empty. Existing rows have no missing storage objects.

Critical live findings: `delete-user` accepts a request-body user ID and uses the service role without proving the caller owns that ID, so any authenticated caller can target another account. It deletes Auth first; `auth.users -> public.users -> dogs.owner` cascades hard-delete the dog and then memberships/images. The Auth deletion storage trigger is disabled, and post-Auth storage cleanup is unpaginated and non-resumable. The `dogs` bucket lets any authenticated user insert/update/delete every object. Dog/storage RLS remains permissive and conflicting: legacy owner policies coexist with membership policies, membership rows are publicly readable, primary can directly delete other memberships, and no unanimous deletion path exists. `dog_images` has no uploader field, so agreed photo deletion rights cannot be enforced. The transfer RPC changes `dog_members` but not legacy `dogs.owner`, so a transfer would immediately split authority between the two models. At-most-one-primary indexes exist, but no invariant guarantees at least one primary. Invitation RPCs exist, but requests, expiry, departure succession, account erasure, and deletion consent do not. Public/anon retain EXECUTE on ownership RPCs even where `auth.uid()` checks usually stop anonymous mutation. The 2026-09-26 schema-only export also revealed a long-lived production service-role JWT embedded literally in four webhook trigger definitions; the local fixture was sanitized immediately. Before deployment, inventory consumers, rotate that key, replace trigger authentication with a narrowly scoped webhook secret/Vault-backed mechanism, and verify all functions. No live remediation has been performed.

Data integrity snapshot: 18 total dog rows, 15 active and 3 soft-deleted; every active dog has exactly one primary and its legacy owner matches. Two deleted dogs have no primary. There are 16 membership rows, 0 invites, and 15 image rows; all image rows point to existing objects in the legacy `users` bucket. No production data or schema was changed. Treat the live prototype as drift to reconcile through a new additive migration, not as an implementation to build upon blindly.

Remaining design work is limited to operational support evidence/contact/waiting/recordkeeping/retention policy. Support recovery must not be implemented or granted until it is decided. Request throttling, transfer concurrency, typed RPC results/idempotency, migration/rollback, 15-minute signed URLs, route shapes and minimum-version enforcement are final. Check-in remains user-based; accompanying-dog selection is separate.

Supabase access (2026-09-26): OAuth login and live read-only MCP calls succeeded against project `kbsjdfzpeianxhidguam`. The direct server `supabase-audit` is restricted with `read_only=true` and database/functions/storage/docs feature groups. No local database or Docker is needed for MCP.

Tests precede every behavior slice. Slice 1 creates the local Supabase Docker bootstrap, schema-only current-state fixture (outside deployable migrations), deterministic local Auth/Storage setup and a real RLS/RPC/Storage runner. Generate database types from the migrated local schema while preserving UI domain types. Existing tooling is Vitest/happy-dom and Playwright. On 2026-09-26, the existing suite passed all 67 tests across 9 files; no ownership tests exist yet. npm audit reported zero vulnerabilities; npm outdated found available updates, with no packages changed. Store publication/signing status remains unverified.

### Local-Supabase foundation checkpoint (2026-09-27)

- Work remains on branch `feat/shared-dog-ownership-local-tests`. The isolated fixture is unchanged and separate from deployable migrations. Supabase CLI `2.109.1` is recorded and enforced by the runner; do not update it in this task.
- Exact migrated columns were verified directly against local PostgreSQL. `users` has `id`, `name`, `private`. `dog_members` has `dog_id`, `user_id`, `role`, `created_at`, `id`. `dogs` has `id`, `birthday`, `breed`, `dislikes`, `likes`, `name`, `gender`, `energy`, `size`, `temperament`, `owner`, `description`, `possessive`, `deleted_at`.
- `npm run test:supabase` now removes stale isolated containers, starts and resets `supabase/tests/local`, obtains only local development credentials, runs Node integration tests, and stops the stack unless `KEEP_LOCAL_SUPABASE=1` is set. The tests create three actual local Auth sessions and deterministically clean Auth, relational and Storage fixtures.
- The 2026-09-27 characterization run passed 8 tests. It proves anonymous membership enumeration, authenticated creation of a dog assigned to another account, anonymous execution reaching an ownership RPC's business check, anonymous reads from the private `dogs` bucket, and unrelated authenticated overwrite/deletion of dog objects.
- Runtime characterization found two additional defects: direct `dog_members` writes fail with `42P17` because the policies recurse into `dog_members`; primary-transfer creation fails with `42804` because its notification trigger supplies text to the `notification_type` enum. The transfer implementation source still changes `dog_members` without synchronizing `dogs.owner`, but the current notification failure prevents the tested RPC path from reaching that split.
- No deployable migration, application behavior, linked-project state or live data changed. The main `supabase/config.toml`, missing main seed, incomplete six-migration history, and separately reviewed live credential-rotation/webhook work remain untouched.
- Next: add the first failing ownership/security contract tests, then implement a new additive hardening migration against the isolated fixture. Keep support recovery unimplemented until the operational policy is approved.

## Continuity rule

At the end of each completed project task:

1. Update the relevant Notion ticket once connected.
2. Keep this file concise, recording only current state, unresolved decisions, and the immediate next step.
3. Remove obsolete details rather than accumulating a chronological log.
