# Shared dog ownership: schema and UX review package

Status: proposal for review, 2026-09-26. This document does not authorize migrations or production behavior changes. Confirmed product rules remain in [DOG_OWNERSHIP_PLAN.md](DOG_OWNERSHIP_PLAN.md).

Open the [clickable mobile proposal](dog-ownership-prototype.html) in a browser. It is a standalone, fake-data prototype: it makes no network requests and cannot mutate application or production data.

## Design boundary

The membership row is the authority for ownership. `dogs.owner` remains a compatibility mirror of the active primary owner during rollout; no client or policy may use it as an independent authority. Every ownership mutation happens through a narrow authenticated RPC that locks the dog, revalidates the caller and current state, changes all related rows atomically, increments `dogs.ownership_version`, synchronizes `dogs.owner`, and records an audit event.

Direct client insert/update/delete is removed from membership, ownership-action, deletion-consent, image-metadata and notification tables. Storage policies use membership capabilities and dog-scoped paths. RPCs are granted to `authenticated` only unless explicitly service-only; `PUBLIC` and `anon` execution are revoked.

For an active dog, a deferred constraint trigger enforces exactly one active `PRIMARY_OWNER` membership and equality between that member's user ID and `dogs.owner`. A partial unique index still enforces at most one primary immediately. This closes the current gap where an update can leave zero primaries or transfer only `dog_members`.

## Table inventory

“Existing live” includes undocumented production drift discovered read-only on 2026-09-26. All reconciliation must be in new additive migrations; do not rewrite an applied migration.

### `public.dogs` — existing, changed

| Column | Proposed type/rule | Purpose |
| --- | --- | --- |
| `id` | `uuid primary key` | Stable dog identity and storage namespace. |
| current profile columns | preserve current types | Name, birthday, breed, preferences and description. |
| `owner` | `uuid not null references public.users(id) on delete restrict` while active | Compatibility mirror only; maintained by lifecycle RPC/trigger. The current `ON DELETE CASCADE` must be replaced. |
| `ownership_version` | `bigint not null default 1` | Invalidates stale actions and capabilities whenever owner membership changes. |
| `primary_image_id` | nullable `uuid` | Main-photo reference. A constraint trigger verifies the image belongs to this dog. Replaces storage moves and eventually replaces `dog_images.is_primary`. |
| `lifecycle_state` | enum: `ACTIVE`, `DELETING`, `DELETED` | Makes immediate user-visible deletion distinct from retryable storage purge. |
| `deleted_at` | existing nullable `timestamptz` | Set with `DELETING`; active reads require null/`ACTIVE`. |

Indexes: primary key; `owner` for old-client pack queries; partial active-owner lookup; `primary_image_id`. `primary_image_id` is added after `dog_images` to avoid migration-order ambiguity.

RLS: retain public/authenticated visibility rules for active dog profiles, but remove the unconditional legacy select policy that exposes soft-deleted rows. No direct update or delete. Profile edits use `api_update_dog`, which permits any active owner. Creation uses `api_create_dog`, creating the dog and primary membership together.

### `public.dog_members` — existing live prototype, rebuilt in place

| Column | Proposed type/rule | Purpose |
| --- | --- | --- |
| `id` | `uuid primary key` | Stable tenure identity. |
| `dog_id` | `uuid not null references dogs(id) on delete cascade` | Membership scope. |
| `user_id` | nullable `uuid references public.users(id) on delete set null` | Null only after account erasure; never null for an active membership. |
| `role` | enum: `PRIMARY_OWNER`, `CO_OWNER` | `EDITOR` migrates to `CO_OWNER`; prototype `VIEWER` is not used by this feature. Old enum labels may remain in PostgreSQL but are rejected for new active rows. |
| `joined_at` | `timestamptz not null default now()` | Continuous tenure and deterministic succession input; immutable. Backfill from `created_at`. |
| `left_at` | nullable `timestamptz` | Closing rather than deleting a tenure preserves succession/audit facts. Rejoining creates a new row. |
| `departure_reason` | nullable enum | `LEFT`, `ACCOUNT_ERASED`, `DOG_DELETED`; service/RPC written. |

Constraints/indexes: active rows require non-null `user_id`; unique active `(dog_id, user_id)`; unique active primary per dog; `(user_id) where left_at is null`; `(dog_id, joined_at, id) where left_at is null` for deterministic succession. A deferred constraint trigger rejects a transaction that leaves more than 8 active memberships for one dog. Longest tenure sorts by `joined_at`, then `id` as the stable tie-breaker.

RLS: an active owner can select active fellow owners and the minimum profile fields needed by the owner-only Ownership tab. An outsider cannot enumerate memberships. No direct writes. The current public-select and primary-delete/update policies are removed.

### `public.dog_invites` — existing live prototype, narrowed to co-owner invitations

Columns: `id`; `dog_id on delete cascade`; nullable `inviter_member_id references dog_members(id) on delete set null`; nullable `invitee_user_id references users(id) on delete set null`; `primary_user_id_at_creation` nullable `on delete set null`; `ownership_version_at_creation bigint`; status enum `PENDING/ACCEPTED/DECLINED/CANCELED/EXPIRED`; `created_at`; `expires_at` fixed to `created_at + interval '30 days'`; `responded_at`; cancellation-reason enum.

Remove `role_offered` and `is_primary_transfer` from the active contract. Transfers get their own table. A partial unique index allows at most one pending join action across invite/request for the same dog and candidate; because PostgreSQL cannot enforce a cross-table unique index, the lifecycle RPC takes a dog-scoped advisory/row lock and checks both tables. Pending means `status = PENDING AND now() < expires_at`; at the exact boundary it is expired.

RLS: parties and the current primary may read the row; only RPCs mutate. Creation rechecks active dog, current primary, accepted friendship, no current membership, no crossed/pending action and limits. Acceptance repeats every check, including the 8-active-owner maximum, and records disclosure acceptance before adding membership. Pending actions do not bypass or increase the active-owner limit.

### `public.dog_ownership_requests` — new

Same lifecycle timestamps/version fields as invites, with `requester_user_id`, `primary_user_id_at_creation`, and `disclosure_accepted_at not null`. `dog_id on delete cascade`; user references use `on delete set null` after pending actions are canceled. The requester may create/cancel; current primary may approve/decline. Approval adds the requester immediately, as confirmed.

RLS: requester and current primary only. Creation and response are RPC-only and recheck accepted friendship with the current primary. A friendship ending cancels pending invites and requests in the same friendship mutation transaction.

### `public.dog_primary_transfers` — new

Columns: `id`; `dog_id on delete cascade`; nullable `from_member_id` and `to_member_id` referencing `dog_members(id) on delete set null`; `ownership_version_at_creation`; status; `created_at`; fixed 30-day `expires_at`; `responded_at`; cancellation reason.

Only the current primary creates/cancels. The target must be an active co-owner. Acceptance atomically demotes the old primary to co-owner, promotes the recipient, synchronizes `dogs.owner`, increments the version and cancels all other pending ownership actions and deletion proposals. The prior primary remains a co-owner. No transfer is reused for departure succession.

RLS: the two parties and active owners may read; RPC-only writes.

### `public.dog_deletion_proposals` — new

Columns: `id`; `dog_id on delete cascade`; nullable `created_by_member_id on delete set null`; `ownership_version_at_creation`; `required_owner_count`; status enum `PENDING/APPROVED/REJECTED/WITHDRAWN/CANCELED/EXPIRED`; `created_at`; fixed 30-day `expires_at`; `completed_at`; cancellation reason.

Only one pending proposal per dog. Starting it records the primary's consent in the consent table. Any owner-set change, primary change, rejection or approval withdrawal cancels it. Final consent transitions the dog to `DELETING` in the same transaction, making it immediately inaccessible and enqueueing storage cleanup.

RLS: current owners and proposal participants may read; RPC-only writes. Silence never creates consent.

### `public.dog_deletion_consents` — new

Columns: `proposal_id references dog_deletion_proposals(id) on delete cascade`; `member_id references dog_members(id) on delete restrict`; decision enum `APPROVED/REJECTED`; `decided_at`; primary key `(proposal_id, member_id)`.

Rows are immutable evidence for a proposal. A response RPC locks the proposal and dog, verifies the member is still active and belongs to the proposal's unchanged owner version, then inserts the decision. Withdrawal cancels the proposal; it does not delete the approval row. There is no RLS write path.

### `public.dog_images` — existing live prototype, changed

| Column | Proposed type/rule | Purpose |
| --- | --- | --- |
| `id` | `uuid primary key` | Referenced by `dogs.primary_image_id`. |
| `dog_id` | `uuid not null references dogs(id) on delete cascade` | Image owner is the dog, not a user. |
| `bucket_id` | constrained to `dogs` after migration | Legacy `users` values remain only until copy verification. |
| `storage_path` | unique, immutable | Canonical path: `<dog_id>/<image_id>.<ext>`. |
| `uploader_member_id` | nullable `uuid references dog_members(id) on delete set null` | Null means unknown legacy uploader; erased membership has null `user_id`, removing attribution. |
| `created_at` | `timestamptz not null` | Gallery ordering and fallback input. |
| `deleted_at` | nullable `timestamptz` | Hides immediately while object cleanup retries. |

All owners may insert metadata after successful dog-scoped upload and select the main photo. Delete RPC permits the primary for any image; a co-owner only when `uploader_member_id` is their active membership. Unknown legacy uploads therefore remain primary-delete-only. Direct metadata and storage mutations are denied.

Confirmed main-photo fallback: when the main image is deleted, choose the newest remaining non-deleted image by `created_at DESC, id DESC`; otherwise set `dogs.primary_image_id` to null.

### `public.dog_ownership_audit` — new, append-only

Columns: `id bigserial`; nullable `dog_id` (no cascading FK, so a purged dog can retain a minimal record); nullable `actor_member_id on delete set null`; event enum; `ownership_version`; `occurred_at`; tightly bounded `details jsonb` containing IDs/statuses only, never names, email, evidence files or free text.

No client RLS access and no client grants. Security-definer lifecycle functions append events; support/service access is separately authorized and logged. Account erasure nulls the actor relationship. Retention/redaction duration is intentionally unresolved pending the support-policy decision.

### `private.account_erasure_jobs` — new, service-only

Columns: opaque job ID; target user ID held only while required; state; attempt count; last error code; database-transition timestamp; Auth-deletion timestamp; storage cursors; created/updated/completed timestamps. No Data API exposure or client grants.

The authenticated Edge Function derives the target from the verified access token, never the request body. It creates/resumes one idempotent job, calls the atomic database departure/succession function first, then deletes Auth and paginates user-owned storage cleanup. Shared dog images are under dog paths and are not deleted. Job identifiers and target references are purged/redacted under the future support-retention rule.

### `private.storage_jobs` — new, service-only

Columns: job ID; operation enum (`COPY_LEGACY_DOG_IMAGE`, `DELETE_DOG_ASSETS`, `DELETE_USER_ASSETS`); dog/image/user references as needed; source/destination bucket/path; state; checksum/size; attempts; error code; timestamps. It provides resumability and proves copy-before-delete for migration. No secrets or public URLs are stored.

### Related existing tables

- `public.notifications`: change `sender_id` from `ON DELETE CASCADE` to `ON DELETE SET NULL`; keep `receiver_id ON DELETE CASCADE`. Remove authenticated direct insert. Ownership notifications point to a response route through typed `target_type/target_id`; a missing, canceled or expired target opens a terminal state rather than failing. Do not put owner lists or private names in push payloads.
- `public.notifications_preferences`: add explicit ownership categories only after final notification taxonomy is settled; `user_id ON DELETE CASCADE` remains correct.
- `public.friendships`: schema is unchanged. Approved-to-ended transitions call an internal function that cancels matching pending invitations/requests. Existing ownership is untouched.
- `public.users` / `auth.users`: current Auth → profile cascade remains, but `dogs.owner ON DELETE RESTRICT` ensures Auth cannot be deleted before succession/solo deletion. The Edge workflow must finish the database transition first.

## Per-reference deletion and lifecycle rules

| Parent/reference | Referencing data | Rule | Why |
| --- | --- | --- | --- |
| Auth user deleted | `public.users` | `CASCADE`, only after erasure transition | Preserve current identity lifecycle but block premature deletion through `dogs.owner RESTRICT`. |
| Public user deleted | active `dogs.owner` | `RESTRICT` | Forces atomic successor selection or solo-dog deletion first. |
| Public user deleted | `dog_members.user_id` | `SET NULL`; membership is closed first | Shared dogs and tenure history survive without identity. |
| Public user deleted | pending action user fields | cancel first, then `SET NULL` | No actionable orphan; minimal history may remain. |
| Public user deleted | notification sender/receiver | sender `SET NULL`; receiver `CASCADE` | Recipients retain a neutral history; deleted account retains none. |
| Membership leaves normally | `dog_images.uploader_member_id` | preserve link and attribution | Confirmed: ordinary departure retains attribution but loses permissions. |
| Membership account-erased | membership `user_id` | `SET NULL` | Image survives and attribution disappears, as confirmed. |
| Membership changes | pending deletion proposal | status → `CANCELED` | Confirmed; consent rows remain immutable evidence. |
| Primary changes | invites, requests, transfers, deletion proposal | status → `CANCELED` | Confirmed; no handoff of another primary's pending authority. |
| Friendship ends | matching pending invite/request | status → `CANCELED` | Confirmed; existing membership unaffected. |
| Dog enters deletion | all public reads/actions | dog hidden; pending actions canceled | User-visible deletion completes immediately after final consent. |
| Dog hard-purged after storage success | members/actions/proposals/images metadata | `CASCADE` except minimal audit | Prevents relational orphans after object cleanup is verified. |
| Proposal deleted/purged | consents | `CASCADE` | Consents have no meaning outside their proposal. |
| Image soft-deleted | `dogs.primary_image_id` | transactional fallback or null | Main image can never reference a hidden image. |
| Storage object missing | image metadata | do not silently delete metadata | Mark job/error; recover or reconcile explicitly. Database remains source of truth. |

## Lifecycle RPC and grant inventory

All names are proposed. Each function sets a fixed `search_path`, derives the caller with `auth.uid()`, rejects null callers, locks the dog/current action, checks `now() < expires_at`, and returns a typed result suitable for idempotent retries.

| RPC | Caller | Atomic responsibility |
| --- | --- | --- |
| `api_create_dog`, `api_update_dog` | authenticated owner | Create dog + primary membership; or edit profile using active membership. |
| `api_create/cancel/respond_dog_invite` | primary / invitee | Enforce friendship, disclosure, expiry, duplicates and current authority. |
| `api_create/cancel/respond_dog_ownership_request` | friend / primary | Same, with approval adding membership immediately. |
| `api_create/cancel/respond_primary_transfer` | primary / selected co-owner | Accept changes both roles, `dogs.owner`, version and pending actions together. |
| `api_leave_dog` | active member | Close co-owner tenure; primary path applies selected/default successor without acceptance. Never leaves an active dog ownerless. |
| `api_prepare_account_erasure` | target user only | Lock every affected dog, validate successor selections, apply all departures/solo deletions or apply none. |
| `api_propose/respond/withdraw/cancel_dog_deletion` | active owners by rule | Snapshot owner set; final approval hides dog and queues cleanup. |
| `api_register/set_primary/delete_dog_image` | active owner by rule | Enforce uploader/primary rights and main-image consistency. |
| `api_get_dog_page` | authenticated viewer | Return profile plus capability flags; include roster/pending actions only for owners. Supports direct URLs. |
| `support_recover_dog_ownership` | service/support role only | Exceptional reviewed recovery with case reference and audit record; never automatic on silence. Exact evidence policy remains open. |

Existing prototype ownership RPCs should be replaced or wrapped only after compatibility tests. Revoke `EXECUTE` from `PUBLIC` and `anon` on the entire ownership API. Remove table grants that allow the same mutation directly.

## Storage contract

- New objects use the private `dogs` bucket and `<dog_id>/<image_id>.<ext>` paths. Reading uses an authenticated, membership/profile-visibility-aware signed URL path rather than public bucket access.
- Storage insert requires an active owner and an image ID reserved by the upload RPC. Update is unnecessary. Delete is service/RPC coordinated; clients cannot delete arbitrary objects.
- Legacy migration inventories database rows and objects, copies to the dog path, verifies byte size/checksum and readable metadata, changes `dog_images`, verifies again, then retires the old object. Every step is idempotent and resumable.
- Switching the main photo only changes `dogs.primary_image_id`; it never moves an object.

## Rollout and old-client compatibility

1. Fix `delete-user` caller/target authorization before shared ownership rollout.
2. Add tests and the additive reconciliation migration with the feature disabled. Backfill primary memberships and image metadata; assert every active dog has exactly one matching primary.
3. Deploy dual-read services and dog-ID storage support. Keep `dogs.owner` synchronized for legacy pack reads.
4. Copy and verify legacy objects. Do not delete source files during the observation/rollback window.
5. Require a shared-ownership-capable app version before a user may join/share a dog. Old clients may continue solo-owner reads/edits through compatibility RPCs, but cannot participate in shared mutations.
6. Enable ownership UI gradually. Monitor invariant failures, job retries and authorization denials.
7. Only after supported clients no longer depend on it, remove the compatibility `dogs.owner` API contract and legacy storage paths in a later migration.

Rollback disables new mutation RPCs/UI, preserves the synchronized legacy owner and source objects, and leaves additive tables intact for diagnosis. It must not reverse-copy newer shared uploads into user folders.

## Authorization summary

| Capability | Visitor/friend | Co-owner | Primary | Service/support |
| --- | --- | --- | --- | --- |
| View active dog profile/gallery | current profile visibility | yes | yes | scoped |
| View owner roster/pending actions | no | yes | yes | scoped |
| Edit dog/upload/select main | no | yes | yes | no routine use |
| Delete photo | no | own upload only | any | evidence-based exception |
| Invite/approve request/offer transfer | request if eligible | no | yes | no routine use |
| Leave | n/a | self | self with succession | account-erasure orchestration |
| Propose deletion | no | no | yes | no automatic bypass |
| Consent/reject/withdraw approval | no | self | self | no automatic bypass |
| Recover unreachable-primary case | no | no | contact support | reviewed, audited only |

## Clickable screen proposal

The prototype uses the current Fredoka font, blue active tabs, pink section headers, rounded cards, shadows and green/blue/pink/red semantic colors. It is deliberately mobile-first and contains no modal-only critical journey.

- Dog page: Details and owner-only Ownership tabs; gallery stays at the bottom of Details. An eligible friend sees a discreet request action and disclosure page.
- Ownership: roster, role labels, pending cards and role-appropriate actions. Hidden-profile disclosure is visible in context.
- Notification response: dedicated URL with dog/actor context, disclosure and terminal expired/canceled/stale states.
- Departure: names the default successor and lets a primary select another eligible co-owner before confirmation.
- Account deletion: one review page for every dog, editable successor selections, solo-dog consequence and shared-photo retention.
- Shared deletion: consent roster, expiry, reject/withdraw/cancel behavior and prominent final-approval consequence.
- State menu: loading, empty, error, expired and stale-permission samples; direction toggle demonstrates Hebrew RTL layout. Native implementation must also wire Android/system back, iOS swipe/back expectations, focus order and keyboard-safe scrolling.

## Proposed operational defaults still requiring confirmation

- Confirmed: for a solo-owned dog, do not display Leave. Delete dog is the only ownership-removal action.
- Confirmed limit: 8 active owners per dog including the primary.
- Proposed remaining limits: 20 pending ownership actions per primary across dogs and 30 gallery images per dog; rejected/canceled invite resend cooldown 24 hours and submit debounce/idempotency key for retries.
- If a selected departure successor becomes ineligible before confirmation, stop with a refresh-required state; never silently substitute.
- Support evidence, unreachable-primary contact attempts/waiting period, exceptional authority, case retention and redaction remain intentionally unspecified and must be decided before support recovery ships.

## Review gates before implementation

- Confirm the remaining product defaults and operational support policy.
- Convert every confirmed rule and forbidden direct-write path into failing tests before behavior code.
- Validate the disposable database/storage harness, including real RLS, RPC grants and object policies with multiple sessions.
- Review the table inventory, prototype, old-client gate, migration/rollback and erasure boundary together.
