# Shared dog ownership: schema and UX implementation contract

Status: design and technical contract approved for implementation, 2026-09-26. Implementation must follow the test-first sequence in [DOG_OWNERSHIP_PLAN.md](DOG_OWNERSHIP_PLAN.md); this approval does not authorize writes to the live project outside the repository's later reviewed deployment workflow.

Open the [clickable mobile contract](dog-ownership-prototype.html) in a browser. It is a standalone, fake-data prototype: it makes no network requests and cannot mutate application or production data.

## Design boundary

The membership row is the authority for ownership. `dogs.owner` remains a compatibility mirror of the active primary owner during rollout; no client or policy may use it as an independent authority. Every ownership mutation happens through a narrow authenticated RPC that locks the dog, revalidates the caller and current state, changes all related rows atomically, increments `dogs.ownership_version`, synchronizes `dogs.owner`, and records an audit event.

Direct client insert/update/delete is removed from membership, ownership-action, deletion-consent, image-metadata and notification tables. Storage policies use membership capabilities and dog-scoped paths. RPCs are granted to `authenticated` only unless explicitly service-only; `PUBLIC` and `anon` execution are revoked.

For an active dog, a deferred constraint trigger enforces exactly one active `PRIMARY_OWNER` membership and equality between that member's user ID and `dogs.owner`. A partial unique index still enforces at most one primary immediately. This closes the current gap where an update can leave zero primaries or transfer only `dog_members`.

## Table inventory

“Existing live” includes undocumented production drift discovered read-only on 2026-09-26. All reconciliation must be in new additive migrations; do not rewrite an applied migration.

### `public.dogs` — existing, changed

| Column | Contract | Purpose |
| --- | --- | --- |
| `id` | `uuid primary key` | Stable dog identity and storage namespace. |
| current profile columns | preserve current types | Name, birthday, breed, preferences and description. |
| `owner` | nullable `uuid references public.users(id) on delete restrict`; required while `ACTIVE` | Compatibility mirror only; maintained by lifecycle RPC/trigger. It may become null only after a solo dog enters `DELETING` during account erasure, allowing Auth deletion while object cleanup continues. The current `ON DELETE CASCADE` must be replaced. |
| `ownership_version` | `bigint not null default 1` | Invalidates stale actions and capabilities whenever owner membership changes. |
| `primary_image_id` | nullable `uuid` | Main-photo reference. A constraint trigger verifies the image belongs to this dog. Replaces storage moves and eventually replaces `dog_images.is_primary`. |
| `lifecycle_state` | enum: `ACTIVE`, `DELETING`, `DELETED` | Makes immediate user-visible deletion distinct from retryable storage purge. |
| `deleted_at` | existing nullable `timestamptz` | Set with `DELETING`; active reads require null/`ACTIVE`. |

Indexes: primary key; `owner` for old-client pack queries; partial active-owner lookup; `primary_image_id`. `primary_image_id` is added after `dog_images` to avoid migration-order ambiguity.

RLS: retain public/authenticated visibility rules for active dog profiles, but remove the unconditional legacy select policy that exposes soft-deleted rows. No direct update or delete through the new contract. Profile edits use `api_update_dog`, which permits any active owner. Creation uses `api_create_dog`, creating the dog and primary membership together. During the compatibility window, legacy direct policies may permit solo-dog writes only when exactly one active membership exists; they deny shared dogs.

### `public.dog_members` — existing live prototype, rebuilt in place

| Column | Contract | Purpose |
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

Columns: `id`; `dog_id on delete cascade`; nullable `inviter_member_id references dog_members(id) on delete set null`; nullable `invitee_user_id references users(id) on delete set null`; `primary_user_id_at_creation` nullable `on delete set null`; `ownership_version_at_creation bigint`; `idempotency_key uuid not null`; status enum `PENDING/ACCEPTED/DECLINED/CANCELED/EXPIRED`; `created_at`; `expires_at` fixed to `created_at + interval '30 days'`; `responded_at`; cancellation-reason enum. Enforce actor-scoped uniqueness for the idempotency key.

Remove `role_offered` and `is_primary_transfer` from the active contract. Transfers get their own table. A partial unique index allows at most one pending join action across invite/request for the same dog and candidate; because PostgreSQL cannot enforce a cross-table unique index, the lifecycle RPC takes a dog-scoped advisory/row lock and checks both tables. Pending means `status = PENDING AND now() < expires_at`; at the exact boundary it is expired. Once an action is declined or canceled, the same pair may create a replacement immediately; there is no resend cooldown. Idempotency keys prevent a retried submission from creating duplicates.

RLS: parties and the current primary may read the row; only RPCs mutate. Creation locks the dog and requires `pending outgoing invitation count < 8 - active owner count`, then rechecks the active dog, current primary, accepted friendship, current membership and crossed/pending actions. Acceptance repeats every check, including the 8-active-owner maximum, and records disclosure acceptance before adding membership. Pending invitations do not reserve membership, but the primary cannot send more invitations than the currently available slots; concurrent acceptance is serialized and can never increase the active-owner count above 8.

### `public.dog_ownership_requests` — new

Same lifecycle timestamps/version/idempotency fields as invites, with `requester_user_id`, `primary_user_id_at_creation`, and `disclosure_accepted_at not null`. `dog_id on delete cascade`; user references use `on delete set null` after pending actions are canceled. The requester may create/cancel; current primary may approve/decline. Approval adds the requester immediately, as confirmed.

RLS: requester and current primary only. Creation and response are RPC-only and recheck accepted friendship with the current primary. A friendship ending cancels pending invites and requests in the same friendship mutation transaction.

At 8 active owners, the dog-page capability response disables Request ownership. Existing pending requests remain pending and keep their original expiry, but approval returns a capacity error until a slot opens. Capacity is locked and rechecked at approval.

Creation also enforces at most 10 successfully created requests per requester in a rolling 24-hour window. An idempotent replay is not counted twice. The typed result includes `RATE_LIMITED` and `retry_after` when applicable.

### `public.dog_primary_transfers` — new

Columns: `id`; `dog_id on delete cascade`; nullable `from_member_id` and `to_member_id` referencing `dog_members(id) on delete set null`; `ownership_version_at_creation`; `idempotency_key uuid not null`; status; `created_at`; fixed 30-day `expires_at`; `responded_at`; cancellation reason. Only one non-expired pending transfer may exist per dog.

Only the current primary creates/cancels. The target must be an active co-owner. Acceptance atomically demotes the old primary to co-owner, promotes the recipient, synchronizes `dogs.owner`, increments the version and cancels all other pending ownership actions and deletion proposals. The prior primary remains a co-owner. No transfer is reused for departure succession.

Creating another offer while one is pending returns `ACTION_ALREADY_PENDING`; the primary must cancel the first. Target departure, source departure/loss of primary, completed primary change, dog deletion or account erasure cancels the offer. Transfer acceptance and competing departure operations lock the dog and action; the first commit wins and the other returns `STALE_VERSION`.

RLS: the two parties and active owners may read; RPC-only writes.

### `public.dog_deletion_proposals` — new

Columns: `id`; `dog_id on delete cascade`; nullable `created_by_member_id on delete set null`; `ownership_version_at_creation`; `idempotency_key uuid not null`; `required_owner_count`; status enum `PENDING/APPROVED/REJECTED/WITHDRAWN/CANCELED/EXPIRED`; `created_at`; fixed 30-day `expires_at`; `completed_at`; cancellation reason.

Only one pending proposal per dog. Starting it records the primary's consent in the consent table. Any owner-set change, primary change, rejection or approval withdrawal cancels it. Final consent transitions the dog to `DELETING` in the same transaction, making it immediately inaccessible and enqueueing storage cleanup.

RLS: current owners and proposal participants may read; RPC-only writes. Silence never creates consent.

### `public.dog_deletion_consents` — new

Columns: `proposal_id references dog_deletion_proposals(id) on delete cascade`; `member_id references dog_members(id) on delete restrict`; decision enum `APPROVED/REJECTED`; `decided_at`; primary key `(proposal_id, member_id)`.

Rows are immutable evidence for a proposal. A response RPC locks the proposal and dog, verifies the member is still active and belongs to the proposal's unchanged owner version, then inserts the decision. Withdrawal cancels the proposal; it does not delete the approval row. There is no RLS write path.

### `public.dog_images` — existing live prototype, changed

| Column | Contract | Purpose |
| --- | --- | --- |
| `id` | `uuid primary key` | Referenced by `dogs.primary_image_id`. |
| `dog_id` | `uuid not null references dogs(id) on delete cascade` | Image owner is the dog, not a user. |
| `bucket_id` | constrained to `dogs` after migration | Legacy `users` values remain only until copy verification. |
| `storage_path` | unique, immutable | Canonical path: `<dog_id>/<image_id>.<ext>`. |
| `uploader_member_id` | nullable `uuid references dog_members(id) on delete set null` | Null means unknown legacy uploader; erased membership has null `user_id`, removing attribution. |
| `created_at` | `timestamptz not null` | Gallery ordering and fallback input. |
| `upload_state` | enum `RESERVED/ACTIVE/DELETING` | Makes the storage/metadata two-phase flow explicit. Only `ACTIVE` images render or count toward the six-photo limit. |
| `reservation_expires_at` | nullable `timestamptz` | A reservation expires after 15 minutes and is eligible for orphan cleanup. Cleared on activation. |
| `deleted_at` | nullable `timestamptz` | Hides immediately while object cleanup retries. |

All owners may reserve an image ID/path, upload only that reserved path, then finalize it after Storage confirms the object. The reserve RPC creates a 15-minute `RESERVED` row; finalize verifies the object metadata and atomically changes it to `ACTIVE`. Expired reservations and orphan objects are removed by the storage worker. Delete RPC permits the primary for any image; a co-owner only when `uploader_member_id` is their active membership. Unknown legacy uploads therefore remain primary-delete-only. Direct metadata and arbitrary storage mutations are denied.

Confirmed photo limit: preserve the current `MAX_IMAGES = 5` secondary-gallery capacity plus the separately stored main photo. In the unified metadata model, enforce at most 6 `ACTIVE` non-deleted `dog_images` rows per dog. A reservation temporarily consumes a slot so concurrent uploads cannot exceed six; expired reservations release it. The reserve/finalize RPCs lock the dog and recheck the count; the UI hides upload controls at the limit.

Confirmed main-photo fallback: when the main image is deleted, choose the newest remaining non-deleted image by `created_at DESC, id DESC`; otherwise set `dogs.primary_image_id` to null.

### `public.dog_ownership_audit` — new, append-only

Columns: `id bigserial`; nullable `dog_id` (no cascading FK, so a purged dog can retain a minimal record); nullable `actor_member_id on delete set null`; event enum; `ownership_version`; `occurred_at`; tightly bounded `details jsonb` containing IDs/statuses only, never names, email, evidence files or free text.

No client RLS access and no client grants. Security-definer lifecycle functions append events; support/service access is separately authorized and logged. Account erasure nulls the actor relationship. Retention/redaction duration is intentionally unresolved pending the support-policy decision.

### `private.storage_jobs` — new, service-only

Columns: job ID; operation enum (`COPY_LEGACY_DOG_IMAGE`, `DELETE_DOG_ASSETS`, `DELETE_ORPHAN_UPLOAD`); dog/image references as needed; source/destination bucket/path; state; checksum/size; attempts; `available_at`; locked/finished timestamps; error code; timestamps. It provides resumability for dog deletion, cleans expired upload reservations and proves copy-before-delete for migration. No secrets or signed URLs are stored. This mechanism is not used to orchestrate account erasure.

A service-only `process-dog-storage-jobs` Edge Function claims bounded batches with `FOR UPDATE SKIP LOCKED`, performs idempotent Storage operations, verifies absence/copy integrity, and applies exponential retry backoff. It is invoked best-effort immediately after a job is queued and by a five-minute Supabase Cron safety net. Jobs are never discarded automatically; after 10 failed attempts they remain retryable and raise an operational alert. Dog relational rows are hard-purged only after `DELETE_DOG_ASSETS` verifies that no dog objects remain. Local tests invoke the worker directly and test the SQL claim/retry schedule without contacting production.

### Existing `delete-user` Edge Function — hardened, no new erasure job

Keep the current single-function account-deletion mechanism. The function verifies the authenticated session and derives the target user from it, calls one atomic database transition for every affected dog, then deletes the Auth user and paginates the existing user-scoped storage cleanup. Shared dogs receive successors; solo dogs enter `DELETING`, their active membership closes, `dogs.owner` becomes null, and their dog-storage cleanup job proceeds independently. Shared dog files are not user-scoped cleanup targets and remain untouched. Because Auth, Postgres and Storage do not share one transaction, any failure after Auth deletion requires explicit support/manual recovery; this design does not introduce a durable erasure-job table.

### Related existing tables

- `public.notifications`: preserve today's notification-row, Realtime and push-delivery architecture. Ownership lifecycle RPCs insert notification rows in their database transaction; push failure cannot roll back the ownership change. Change `sender_id` from `ON DELETE CASCADE` to `ON DELETE SET NULL`; keep `receiver_id ON DELETE CASCADE`. Remove authenticated direct insert. Ownership notifications point to a response route through typed `target_type/target_id`; a missing, canceled or expired target opens a terminal state rather than failing. Do not put owner lists or private names in push payloads.
- `public.notifications_preferences`: in-app ownership notifications always remain visible; current preferences may mute push delivery. Add explicit ownership push categories only if the existing preference model requires them; `user_id ON DELETE CASCADE` remains correct.
- `public.friendships`: schema is unchanged. Approved-to-ended transitions call an internal function that cancels matching pending invitations/requests. Existing ownership is untouched.
- `public.users` / `auth.users`: current Auth → profile cascade remains, but `dogs.owner ON DELETE RESTRICT` ensures Auth cannot be deleted before succession/solo deletion. The Edge workflow must finish the database transition first.

Ownership notification types are explicit: invite received/accepted/declined/canceled; request received/approved/declined/canceled; transfer offered/accepted/declined/canceled; owner joined/left; primary changed; deletion consent requested; deletion proposal rejected/canceled/expired; and dog deletion completed. Response-required rows use `target_type = DOG_OWNERSHIP_ACTION` with the action/proposal UUID; informational dog changes use `target_type = DOG`. The existing client mapper owns localized copy. New-successor and remaining-owner notifications are inserted transactionally; an ordinary departing owner sees the actual fallback successor in the RPC result and in-app notification. During account deletion the same result is shown synchronously before the local session is cleared, because a deleted receiver cannot retain a notification.

### `public.app_feature_compatibility` — new, service-managed

Columns: feature enum (initially `SHARED_DOG_OWNERSHIP`); platform enum `IOS/ANDROID/WEB`; `minimum_build integer not null`; `enabled boolean not null default false`; `updated_at`; primary key `(feature, platform)`. Integer builds use iOS `CFBundleVersion`, Android `versionCode`, and a monotonically increasing Web build constant.

Authenticated clients may read this non-secret configuration; only service/deployment automation may write it. Every ownership capability/lifecycle RPC receives `p_client_platform` and `p_client_build`, checks the row, and returns `UPGRADE_REQUIRED` when disabled or below the minimum. Concrete build numbers are filled as deployment data after the prerequisite clients exist.

## Per-reference deletion and lifecycle rules

| Parent/reference | Referencing data | Rule | Why |
| --- | --- | --- | --- |
| Auth user deleted | `public.users` | `CASCADE`, only after erasure transition | Preserve current identity lifecycle but block premature deletion through `dogs.owner RESTRICT`. |
| Public user deleted | `dogs.owner` | `RESTRICT` | Account preparation must first select a shared-dog successor or put a solo dog in `DELETING` and null the compatibility owner. |
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

The names below are the implementation contract; mechanical SQL-safe refinements are allowed only if generated types and callers use the same name. Each function sets a fixed `search_path`, derives the caller with `auth.uid()`, rejects null callers, locks the dog/current action, checks `now() < expires_at`, and returns a typed result suitable for idempotent retries. Reads and responses treat `now() >= expires_at` as expired and lazily persist `EXPIRED`; no scheduler or client clock decides validity.

All ownership capability/lifecycle operations accept `p_client_platform` and `p_client_build`; create operations also accept `p_idempotency_key uuid`. Expected business conflicts return `outcome`, `entity_id`, `status`, `ownership_version`, `expires_at`, `cancellation_reason`, and optional `retry_after`. Stable outcomes are `APPLIED`, `NO_CHANGE`, `ACTION_ALREADY_PENDING`, `CAPACITY_REACHED`, `EXPIRED`, `NOT_ELIGIBLE`, `RATE_LIMITED`, `STALE_VERSION`, and `UPGRADE_REQUIRED`. Authentication, forbidden access and invariant violations remain database errors and must not reveal a private dog/action exists.

| RPC | Caller | Atomic responsibility |
| --- | --- | --- |
| `api_create_dog`, `api_update_dog` | authenticated owner | Create dog + primary membership; or edit profile using active membership. |
| `api_create/cancel/respond_dog_invite` | primary / invitee | Enforce friendship, disclosure, expiry, duplicates and current authority. |
| `api_create/cancel/respond_dog_ownership_request` | friend / primary | Same, with approval adding membership immediately. |
| `api_create/cancel/respond_primary_transfer` | primary / selected co-owner | Accept changes both roles, `dogs.owner`, version and pending actions together. |
| `api_leave_dog` | active member | Close co-owner tenure; primary path applies selected/default successor without acceptance. Never leaves an active dog ownerless. |
| `api_prepare_account_erasure` | target user only | Lock every affected dog, validate successor selections, apply all departures/solo deletions or apply none. |
| `api_propose/respond/withdraw/cancel_dog_deletion` | active owners by rule | Snapshot owner set; final approval hides dog and queues cleanup. |
| `api_reserve/finalize/set_primary/delete_dog_image` | active owner by rule | Reserve an immutable dog path, verify/activate the upload, and enforce uploader/primary rights plus main-image consistency. |
| `api_get_dog_page` | authenticated viewer | Return profile plus capability flags; include roster/pending actions only for owners. Supports direct URLs. |
| `support_recover_dog_ownership` | not granted or deployed yet | Reserved name only. Implement after the operational support policy is approved; never automatic on silence. |

Existing prototype ownership RPCs should be replaced or wrapped only after compatibility tests. Revoke `EXECUTE` from `PUBLIC` and `anon` on the entire ownership API. Remove table grants that allow the same mutation directly.

## Storage contract

- New objects use the private `dogs` bucket and `<dog_id>/<image_id>.<ext>` paths. Reading uses an authenticated, membership/profile-visibility-aware signed URL path rather than public bucket access.
- Use the Supabase Storage SDK for 15-minute signed URLs. Cache URL results in memory by image ID/path and refresh when two minutes or less remain; never persist signed URLs. Clear private image queries on logout/account deletion. No image-proxy Edge Function or external service is introduced.
- Storage insert requires an active owner and an unexpired image ID/path reserved by the upload RPC. Update is unnecessary. Finalize verifies the object before exposing it. Delete is service/RPC coordinated; clients cannot delete arbitrary objects.
- Legacy migration inventories database rows and objects, copies to the dog path, verifies byte size/checksum and readable metadata, changes `dog_images`, verifies again, then retires the old object. Every step is idempotent and resumable.
- Switching the main photo only changes `dogs.primary_image_id`; it never moves an object.

## Rollout and old-client compatibility

1. Establish the local Docker baseline/test runner described below; no behavior migration precedes it.
2. Fix `delete-user` caller/target authorization before shared ownership rollout.
3. Add tests and the additive reconciliation migration with the feature disabled. Backfill primary memberships and image metadata; assert every active dog has exactly one matching primary.
4. Ship a prerequisite client that uses capability RPCs for solo dog/profile/photo writes. Legacy direct policies may operate only on dogs with exactly one active member and must deny shared dogs.
5. Deploy dual-read services and dog-ID storage support. Keep `dogs.owner` synchronized for legacy pack reads.
6. Copy and verify legacy objects. Do not delete source files during the observation/rollback window.
7. Record platform-specific minimum supported versions in deployment configuration once release numbers exist. Unsupported clients receive `UPGRADE_REQUIRED` for shared-ownership capabilities.
8. Approve the operational support policy and implement/test the service-only recovery RPC required for the confirmed first release.
9. Enable ownership UI gradually. Monitor invariant failures, job retries and authorization denials.
10. Only after supported clients no longer depend on it, remove the compatibility `dogs.owner` API contract and legacy storage paths in a later migration.

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

## Final UI surface inventory

The prototype uses the current Fredoka font, blue route-backed tabs, pink section headers, rounded cards, shadows and semantic colors. Production implementation reuses existing components rather than copying prototype CSS.

- **Dog Details:** owner variant with header pencil and gallery-only photo management; eligible-friend variant with Request ownership and no Ownership tab; visitor/ineligible/capacity/request-pending variants derived from server capabilities.
- **Ownership:** primary, co-owner and solo-primary variants; roster, pending actions, active transfer/deletion proposal, and contextual no-pending state. Primary-only controls never render for a co-owner.
- **Short modals/sheets:** edit dog, photo capture/select, eligible-friend invite picker (including no eligible friends), transfer-recipient picker, solo delete confirmation, final account deletion, final deletion approval, rejection and approval withdrawal.
- **Durable pages:** request disclosure, request pending/cancel, notification responses for invite/request/transfer, primary departure with successor, co-owner departure, account-deletion review (including no dogs), and shared deletion consent.
- **Terminal/system states:** loading, error, expired, declined, canceled with reason, already responded, capacity, stale permission, access unavailable and dog deleting. No generic whole-page “empty ownership” state is used because an active dog always has an owner.
- **Photo states:** no photos, limit of six, main image, selectable-main affordance, own-upload deletion for co-owners, primary delete-any, and unknown legacy uploader as primary-delete-only.

Confirmed routes: `/dogs/:dogId`, `/dogs/:dogId/ownership`, `/dogs/:dogId/ownership/request`, `/ownership-actions/:actionType/:actionId`, `/dogs/:dogId/ownership/leave`, `/dogs/:dogId/ownership/deletion/:proposalId`, and `/profile/:id/settings/delete-account/review`. The public `/delete-account` information page is unchanged.

The current header pencil remains the only general edit entry point. Remove dog deletion from the edit modal. Remove the separate header primary-photo uploader; the header image becomes display/enlarge only. Settings keeps one Delete profile button, which navigates to the review route instead of directly calling account deletion.

## Confirmed operational decisions and open support policy

- Confirmed: for a solo-owned dog, do not display Leave. Delete dog is the only ownership-removal action.
- Confirmed limit: 8 active owners per dog including the primary.
- Confirmed pending-invitation limit: for each dog, pending outgoing invitations cannot exceed `8 - active owner count`. Ownership requests are limited to 10 successfully created requests per requester per rolling 24 hours; idempotent retries do not count twice. Confirmed retry behavior: no cooldown after decline/cancellation, while idempotency keys make submission retries safe.
- If a selected departure successor becomes ineligible before commit, automatically choose the next longest-standing eligible co-owner and notify the departing owner which successor was used.
- Support policy remains open by explicit product decision; do not treat the discarded 14-day discussion as confirmed.
- Support evidence, unreachable-primary contact attempts/waiting period, exceptional authority, case retention and redaction remain intentionally unspecified. They do not block starting implementation, but they and the recovery RPC must be complete before the full first release is enabled.

## Local Supabase implementation entry gate

- Docker-backed local Supabase is mandatory slice 1. Pin/record the CLI version and expose one repeatable local/CI command for stack start, reset/bootstrap, seed and integration tests.
- The repository's checked-in migrations are not a complete historical baseline. Obtain a read-only, schema-only dump of the current project, sanitize it, and store it outside `supabase/migrations` as the local checkpoint fixture. It must contain no production rows, secrets or signed URLs. The runner applies that fixture and then feature migrations newer than the checkpoint, preventing accidental attempts to deploy a baseline migration to the live project.
- Sanitization must replace production function URLs and all inline authorization values. The initial export exposed a long-lived service-role JWT in four webhook trigger definitions; the checked-in fixture uses local placeholders only. Treat key rotation and secure webhook authentication as an urgent independent security rollout before feature deployment.
- Resolve the currently configured but missing `supabase/seed.sql`: add a deterministic local-only seed if SQL seed data is useful, otherwise disable that config and seed through the test harness. Create multiple users through local Auth/admin APIs so JWT/RLS behavior is real rather than mocked.
- Tests use primary, co-owner, former-owner, friend, outsider, anonymous and service-only sessions. Cover migrations, direct-table bypass, RPC grants/results/idempotency, exact expiry boundaries, concurrency, private Storage object policies, signed URLs, Auth deletion and retained files.
- Generate Supabase database types from the locally migrated schema and map them to existing UI domain types. Never solve mismatches with broad casts or blanket nullability.
- The plan, table inventory, prototype, old-client gate, migration/rollback and erasure boundary are approved. Convert each rule and forbidden path into a failing test before its behavior implementation.
