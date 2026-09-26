# Shared dog ownership plan

Planning checkpoint: 2026-09-26. Source: user decisions in the planning conversation and the [existing Notion ticket](https://app.notion.com/p/3e24e04c2ff1810592a3cb0f61d736d4).

## Resume here

Product decisions below are confirmed; do not ask the user to choose them again. Implementation has not started. The table/deletion-rule inventory and standalone clickable proposal are now drafted in [DOG_OWNERSHIP_SCHEMA_AND_UX.md](DOG_OWNERSHIP_SCHEMA_AND_UX.md) for review. Review the schema, authorization rules and screens with the user before implementing behavior.

For any remaining product questions, ask one focused question at a time with numbered options directly in chat. The user did not see the tool-based question UI. Distinguish confirmed decisions from proposed defaults.

Read [CODEX_CONTEXT.md](CODEX_CONTEXT.md) for the live audit, access, security findings and other project context. Notion remains the task source of truth.

## Confirmed ownership and privacy rules

- Several users share one dog profile; each user can have multiple dogs.
- Exactly one primary owner per active dog, plus optional co-owners.
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
- Ending the relevant friendship cancels pending invitations and requests. Existing ownership is unaffected.
- Changing the primary cancels all pending invitations and requests, rather than handing them to the new primary.
- Responses are reached through the existing Notifications area, opening a dedicated response page. Owners also see pending items in Ownership.

## Confirmed ordinary transfer and departure

- Ordinary primary-role transfer can target an existing co-owner only.
- It requires recipient acceptance and expires after 30 days. Until acceptance, the current primary retains their role.
- On acceptance, the old primary remains a co-owner.
- Leaving/account deletion uses different succession semantics: no successor acceptance is required.
- The departure screen preselects the longest-standing eligible co-owner, clearly names them and lets the departing primary choose another co-owner before confirming.
- Account deletion uses one review page for all affected dogs, each shared dog showing its changeable preselected successor.
- When the primary is the dog's only owner, do not show a Leave action. The only ownership-removal action is Delete dog.
- Shared dogs remain with the remaining owners. When no co-owner exists, preserve current deletion behavior after verifying actual cascades and the delete RPC.

## Confirmed shared-dog deletion

- Only primary can start a proposal; all current owners must explicitly consent.
- Proposals expire after 30 days. Inactivity/silence never counts as consent.
- Delete immediately after the final approval, clearly explaining before approval that it may complete deletion.
- Any rejection cancels the proposal immediately.
- An owner may withdraw approval while pending; withdrawal cancels the entire proposal.
- Any owner joining or leaving cancels the proposal.
- Any change of primary cancels the proposal, even if both people remain owners.
- A fresh proposal requires fresh consent from everyone. Withdrawal is unavailable after deletion has completed.

## Confirmed photos and support policy

- Legacy photos have unknown uploaders; do not invent attribution to the current primary. All owners can select them as main photo, but only primary can delete them.
- When the main photo is deleted, automatically select the newest remaining non-deleted photo. If no photos remain, the dog has no main photo.
- Shared photos survive uploader account deletion; remove uploader attribution.
- Support-reviewed recovery is included in the first release, using the existing support contact path.
- For an unreachable primary, support requires evidence and attempts to contact them. Silence alone does not authorize transfer or count as deletion consent.
- For photo-removal requests after account deletion, support asks the requester to identify the photos and provide evidence. A claim alone does not cause removal; current-primary approval is not required.
- Detailed operational evidence/contact/recordkeeping rules remain to be specified. These choices do not authorize an automatic or hidden deletion-consent bypass.

## Screen review package

Use existing React/Vite/SCSS patterns and visual language; prefer tabs/pages over additional modals.

1. Dog Details retains the photo gallery at the bottom; no Photos tab. Eligible visitors get a discreet Request ownership action.
2. Owner-only Ownership tab shows owners/roles, pending actions and permitted invite/request/transfer/leave/deletion controls.
3. Dedicated notification response page shows dog, privacy-permitted actor details, disclosures and appropriate acceptance/approval/rejection actions.
4. Departure page explains loss of access and succession, with the named default successor where relevant.
5. Account-deletion review lists every affected dog, successor selections, solo-owned-dog consequences and photo retention.
6. Shared deletion page shows pending consent, expiry, approval/rejection/withdrawal and the final-approval consequence.

Include loading, empty, error, expired, declined, cancelled and stale-permission states; direct URLs without navigation state; Hebrew RTL/accessibility; native back/keyboard behavior. Prototype is still to be built and reviewed.

## Proposed defaults and unresolved design details

These are recommendations from the draft, not separately confirmed choices:

- Senders can cancel pending actions; recipients can decline. Prevent duplicate/crossed invitations and requests and make retries safe.
- Starting a deletion proposal records primary consent; primary can cancel it while pending.
- Eligible successor means an active current co-owner whose account is not being deleted; hide mode alone does not disqualify them.
- Use continuous membership tenure with deterministic tie-breaking; rejoining starts new tenure. If a selected successor becomes ineligible, stop and refresh rather than silently substituting someone.
- Ordinary departure retains uploader attribution but removes member permissions; account erasure removes identifying references. Review rejoin implications.
- Cancel stale ordinary transfer offers on relevant departure/primary change; define concurrency explicitly.
- Membership/photo limits and resend cooldowns still need concrete defaults in the design.
- Define support evidence, contact/waiting periods, permissible exceptional actions, decision records and retention/redaction.
- Resolve exact schema/API contracts, legacy owner synchronization, old-client compatibility, erasure records and storage migration/rollback before implementation.

Do not restart the entire product questionnaire. Include routine technical choices as explicit proposals in the review package; ask only where a material product choice remains.

## Technical plan for review

1. Produce the complete table inventory: existing/new/changed tables, columns/types, keys, constraints, indexes, RLS, RPC execution grants and every reference's deletion behavior (delete, null, reassign, preserve). Reconcile the undocumented live prototype through new additive migrations.
2. Specify membership authority and exactly-one-primary enforcement; resolve legacy dogs.owner consistency during migration. Existing transfer RPCs currently split those authorities.
3. Specify narrow authenticated lifecycle operations for invitations/requests, transfers, departures and unanimous deletion. Revalidate roles, friendship, expiry, dog state, owner set and consent atomically; prevent generic updates/direct writes bypassing rules.
4. Treat the recorded delete-user caller/target authorization flaw as an urgent early fix. Authenticate the caller and derive the target from the verified session. No remediation has yet been performed.
5. Propose dog-ID-based storage and image metadata with nullable uploader identity; main-photo reference rather than moving files to switch main photo. Enforce rights in both database and storage.
6. Inventory/copy/verify legacy files and metadata before retiring old objects. Test transition, retries and rollback. Do not discard files before verified replacement.
7. Design retryable account erasure across Auth, database and storage. Make succession/departure atomic in the database; account for pagination, partial failures, storage ownership metadata and identifying references in notifications/history/files. Do not claim these systems form one transaction.
8. Replace single-owner queries/grouping/caches and navigation-state edit permissions with authenticated membership capabilities. Cover pack, friend/search, dog, image and notification refreshes.
9. Define notification delivery after commit with safe retries; failure must not duplicate or undo an ownership mutation.
10. Sequence deployment for old installed mobile clients: choose compatibility or minimum-version enforcement before enabling shared ownership. Review recovery/rollback before production changes.

The detailed schema/migration design is not yet implemented or approved. General reliability backlog, package upgrades, redesign, React Native migration, duplicate-profile merging and dog-attendance redesign are not implicit scope additions.

## Tests before behavior changes

Historical baseline on 2026-09-26: 67 tests in 9 files passed. These utility-heavy tests do not prove shared ownership or real database authorization. No ownership tests have been added. Existing tools are Vitest/happy-dom and Playwright; the disposable database/storage harness still needs validation/setup.

1. Establish green baseline regressions for solo ownership, several dogs per user, gallery, friend search/hide mode and independent user check-ins. Record actual current defects as failures, not expected behavior.
2. Add meaningful new-feature tests, demonstrate failure before implementation, then build one vertical slice at a time.
3. Test each confirmed rule above, including exact 30-day boundaries, friendship cancellation, primary-change invalidation, withdrawal and immediate final approval.
4. Test races/retries: duplicate or crossed joins, simultaneous approvals, membership changes during deletion, transfer versus departure, concurrent account deletion and stale successor selection.
5. Test real RLS/RPC/storage authorization with primary, co-owner, former owner, outsider and anonymous sessions. Include direct table/object bypass attempts, hidden-owner disclosure and caller/target account deletion.
6. Test retained photos, null/legacy attribution, migration file integrity, main-photo consistency and resumable account erasure after partial failure.
7. Run multi-session Playwright journeys and targeted Web/iOS/Android checks for notifications, photos, RTL, direct links, keyboard/back and connectivity.
8. Run npm test, relevant existing e2e scripts, npm run lint, npm run build and git diff --check after implementation. Do not use production accounts for destructive tests.

## Delivery gates

- Product choices above remain recorded as confirmed; proposals remain marked as proposals.
- Table/deletion-rule inventory, authorization matrix, migration/compatibility plan and clickable prototype reviewed before behavior changes.
- Tests map to every agreed rule and demonstrate both permitted and forbidden actions.
- Existing solo-owner flows and data survive the transition; all shared-owner journeys and concurrency invariants pass.
- Real authorization tests, migration/recovery checks, native smoke checks and required repository checks pass.
- Update Notion and the concise handoff to reflect actual delivery; do not mark the feature complete based on documentation alone.

## Copyable next-chat prompt

Read docs/CODEX_CONTEXT.md and docs/DOG_OWNERSHIP_PLAN.md, then the linked Notion ownership ticket. Continue with the complete new/changed table inventory and per-reference deletion rules, plus a clickable screen proposal using existing styles. Preserve confirmed decisions; ask any remaining product questions with numbered options directly in chat. Review schema, authorization and screens before implementing behavior. Tests must precede behavior changes. The live audit is already recorded; recheck only what is needed to make the design accurate.
