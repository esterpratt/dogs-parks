# Permanent Supabase staging and selected-data import

Prepared 2026-10-03. Status: documented, not executed. This document is an implementation handoff, not evidence that a staging project exists.

## Objective and agreed scope

Create a permanent, independent `klavhub-staging` Supabase project. Run the local React/Vite client against it to preview ownership features with selected copies of Ester's production profile, test profile, dogs, photos and parks. Keep useful test data between sessions and make future migrations and fixture refreshes repeatable.

The user requested documentation so another agent can execute later. This documentation task does not authorize creating paid resources, exporting private production records or deploying to production now. On resumption, use the user's current authorization; request only missing access, data selection or material choices. Do not re-open confirmed ownership product decisions.

Related plans:

- [Production upgrade and release](SUPABASE_PRODUCTION_ROLLOUT_PLAN.md).
- [Ownership product/implementation contract](DOG_OWNERSHIP_PLAN.md).
- [Ownership schema and UX contract](DOG_OWNERSHIP_SCHEMA_AND_UX.md).
- [Current handoff](CODEX_CONTEXT.md).
- Existing Notion ticket: <https://app.notion.com/p/3e24e04c2ff1810592a3cb0f61d736d4>.

## Starting facts to verify again

- Production reference recorded by the 2026-09-26 audit: `kbsjdfzpeianxhidguam`. Verify identity before every operation; it is never a staging target.
- Ownership slices 1–10 are implemented locally. The feature migrations and updated Edge Functions have not been deployed by this work.
- Repository migration history is incomplete: the live ownership prototype and other baseline schema were absent from its original migration ledger. An empty project cannot be bootstrapped by blindly applying `supabase/migrations`.
- Sanitized local baseline: `supabase/tests/local/supabase/migrations/20260926000000_current_schema.sql`. It is a test fixture, not a production migration. Compare with a fresh schema export before using it to design staging bootstrap.
- Local contract runner: `supabase/tests/local/run.sh`; pinned CLI `2.109.1`. The runner starts/resets/stops a disposable Docker stack and cleans test users/data. Do not point it at permanent staging or production.
- `KEEP_LOCAL_SUPABASE=1` keeps the containers, but the runner still removes temporary Edge Function source on exit. This is not the permanent staging workflow.
- Main `supabase/config.toml` has a configured missing `seed.sql`; do not assume the main local project can reset successfully.
- `.env.local` exists. Do not print its contents or overwrite its current production setup to add staging.
- Four production webhook definitions historically embedded a service-role credential. Do not carry those credentials or production destinations into staging; remediation status must be checked.
- Shared ownership compatibility defaults off; browser client currently sends `WEB`, build `1` in `src/services/dog-ownership.ts`. Support recovery is absent; evidence/contact/authority/retention decisions are open.

## Required inputs and responsibility

| Input or task | Ester | Implementing agent |
| --- | --- | --- |
| Organization, region, project name and acceptable billing | Choose/approve; complete account interaction if needed | Inspect available options and provision when authorized |
| Production/staging access | Complete OAuth or provide access through a secure mechanism | Verify project identities and effective permissions |
| Data selection | Identify own profile, test profile, desired dogs/photos and park scope | Resolve IDs read-only; produce a dependency/import manifest |
| Staging login | Choose email/password initially or request provider login | Create independent test accounts and map imported references |
| Google/Apple providers if requested | Handle provider-console permissions/consent screens | Configure callback URLs and verify login |
| Test review | Try the resulting feature and review unresolved support decisions | Implement import/deployment tooling and automated verification |

Keep passwords, privileged keys and raw exports out of chat, git and client-visible `VITE_*` variables. A staging URL and public anon/publishable key may be client configuration; service credentials remain server-side.

## Phase S1 — Read-only inventory and execution manifest

1. Read `AGENTS.md`, the related documents, `package.json`, the actual CLI help/version, and current git status. Create a task branch. If resuming after several days, run the repository-required audit/outdated checks and report findings without upgrading packages automatically.
2. Verify the production project reference and organization through authenticated metadata access. Inspect schema, migration ledger, PostgreSQL version/extensions, Auth/profile triggers, RLS, function grants, bucket settings, Realtime publications, Edge Functions, cron jobs, webhooks and external integrations.
3. Inspect existing deployments and CI for automatic database/function deployment. Record what a merge/push triggers before implementing staging automation.
4. Produce a secret-free manifest with source/staging refs, git SHA, baseline schema fingerprint, migration ledger, requested source record IDs, dependency rules, buckets/paths, planned user-ID mappings and destination counts. Stage new data in a protected local location, not the repository.
5. Determine the schema bootstrap approach. Recommended: a logical export with a reviewed sanitization step before import. Strip/replace inline credentials, production URLs, external jobs and webhook authentication; preserve application tables, functions, types, RLS, grants, Auth-related triggers and Storage policies.
6. Preserve original migration files. Design a reviewed baseline/history reconciliation mechanism. Mark a baseline applied only when its schema is present and verified. Do not blanket-mark unapplied feature migrations or use migration repair merely to suppress errors.

Exit: target identity, costs/access, schema strategy and selected-data manifest are resolved. No production mutation is needed for this phase.

## Phase S2 — Provision and isolate staging

1. Create a separate project with compatible database version/extensions and suitable region/compute. Record the staging ref in non-secret configuration. Do not reuse production signing secrets or privileged API keys.
2. Use explicit destination project refs/connection URLs in tooling. Add a target guard that verifies expected project identity and rejects production for seed/reset/import operations. Use separate workdirs/configuration where CLI linking is necessary; do not silently replace the repository's linked project.
3. Bootstrap the sanitized schema and reviewed baseline migration history. Include bucket creation/settings and Realtime configuration explicitly; do not mistake database metadata for uploaded files.
4. Configure Auth URL allowlists for the actual Vite origin and callback paths used by `src/services/authentication.ts`. Confirm signup/login and profile trigger behavior. Use controlled test addresses and restricted signup; decide email confirmation handling explicitly. Start with password login to avoid provider-console work unless OAuth is required.
5. Disable or redirect production push, park-report emails, new-park emails and other outgoing integrations before importing data. Never import device tokens. Review cron jobs and trigger/function bodies for production destinations, including dormant ones.
6. Deploy only needed functions initially. Any SMTP/provider/webhook secret must belong to staging or a deliberate test endpoint. In-app notifications/Realtime can remain enabled without real push delivery.

Exit: staging is isolated, reachable and has the correct pre-feature schema. No staging action reaches production services.

## Phase S3 — Import selected legacy data before the upgrade

Import representative data in its legacy form first. This is necessary to test the upgrade rather than only seed the final schema.

1. Resolve Ester's two selected production users by exact IDs; do not export all Auth users by default. Recommended login design: create fresh staging Auth accounts with independent credentials, then map source user IDs to their new staging IDs. Verify profile triggers first to avoid duplicate profile inserts.
2. Build the relationship closure from real foreign keys and function behavior. Include requested dog records, memberships, selected image metadata, selected friendships and park rows/dependencies needed by the UI. For references to unselected users, either omit optional records or create explicitly synthetic counterparts; never silently copy unrelated private profiles.
3. Include all parks if Ester chooses that scope and they are appropriate to copy. Park database rows remain authoritative; translation/general-information JSON is not a park-data backup. Omit live visits, device tokens and unnecessary messages/notification history unless specifically selected for a test scenario.
4. Enumerate selected photo files from metadata and relevant legacy paths, including profile avatars/main images that may not appear in `dog_images`. Download exact selected objects read-only, then upload to staging using the Storage API. Preserve MIME type, verify byte length and checksum, and rewrite user-folder paths and project-specific URLs consistently.
5. Do not insert `storage.objects` rows as a substitute for uploading files. Do not preserve production signed URLs or use production photo URLs as staging's permanent source.
6. Import relational records in FK order. Preserve business timestamps/legacy fields where meaningful, but remap all selected user references consistently. Account for trigger-created memberships, generated identifiers and sequence values. Confirm that membership authority and compatibility owner agree after import.
7. Use scoped transactions for relational import and a manifest for file retries, since Auth/DB/Storage do not share one transaction. Re-running must recognize previously imported fixture records/files and must not duplicate or overwrite unrelated staging changes.
8. Capture pre-upgrade evidence: exact selected ID mappings, per-table counts, profile/dog fields, friendships/privacy flags, photo paths/checksums, primary image choices and any missing-file exceptions. Store private evidence outside git.

Exit: legacy data is usable on staging and matches the approved selection. A retry changes neither production nor unrelated staging data.

## Phase S4 — Apply the feature and operate background cleanup

1. Use the ordered migration inventory in [the production plan](SUPABASE_PRODUCTION_ROLLOUT_PLAN.md#ordered-feature-migration-inventory). Compare it with current files and staging history; apply only missing reviewed migrations. Enum additions and dependent migrations must use the transaction boundaries proven by the local runner.
2. Inspect migration failures as data/schema evidence. Resolve exceptions through new migration files or an approved explicit reconciliation; do not edit applied migrations or delete source records to make constraints pass.
3. Deploy `delete-user` and `process-dog-storage-jobs` with their dependencies. Verify gateway JWT configuration and each function's internal authentication against actual staging keys. The local `verify_jwt=false` setting is not a production/staging security decision to copy blindly.
4. Establish a service-authenticated invocation mechanism for storage jobs. Inspect the worker's claim/batch/retry behavior; provide a repeatable manual drain command first, then a documented scheduler if needed. Scheduling/credentials are not provided merely by deploying the function.
5. Run legacy photo-copy jobs. Verify destination checksum/size, metadata switch, main-photo reference and client readability. Retain original legacy files through the rehearsal and rollback window. Exercise orphan/deletion jobs on disposable staging fixtures only.
6. Enable `SHARED_DOG_OWNERSHIP` for staging `WEB` with minimum build matching the tested client. Enable native platforms only when testing those builds. Read back exact compatibility rows to verify the target.
7. Support recovery may be developed/tested in staging after policy approval; its absence blocks full production enablement, not creation of a development preview. Record that limitation explicitly.

Exit: imported legacy data survives the feature migration; ownership routes and background processing work against staging.

## Phase S5 — Client workflow and permanent fixtures

1. Add separate ignored staging environment configuration plus a secret-free example and a named package script (proposed `dev:staging`, final naming follows repository conventions). Inspect Vite env precedence: `.env.local` is also loaded in other modes, so explicitly supply every backend credential used by staging and verify the resolved target without printing keys.
2. Add a discreet development-only environment indication if useful. Never expose privileged secrets or project diagnostics to normal production users. Preserve current production run/build behavior.
3. Use browser verification on dev-server start and verify network requests target staging. Record URL, test-login instructions through a secure channel, and exact routes: `/dogs/:dogId/ownership` and `/profile/:id/settings/delete-account`.
4. Add synthetic durable fixtures for solo owner, shared primary/co-owner, private co-owner, friend/outsider, legacy unknown-uploader photo and multi-dog account review. Use separate disposable copies for destructive journeys so Ester's imported baseline remains available.
5. Implement opt-in, scoped fixture refresh tooling with a manifest, dry-run/count preview and project guard. Future migrations apply incrementally; normal app startup must never reset staging. Refresh is not an automatic sync of production.
6. Record how to re-create fixtures after account/dog deletion. Test reruns/import retries against fixture identifiers, not broad table truncation.

## Verification and completion criteria

- Compare selected before/after records, allowing only documented migrations/remappings. No unexplained missing rows/files; legacy soft-deleted data and unknown uploader attribution remain correctly represented.
- Password signup/login/logout, user packs, several dogs, parks, friendships/privacy, dog details/editing and photo viewing/upload/main-selection/delete behave correctly.
- Two browser sessions complete invite/request, ordinary transfer, departure/succession and shared deletion. Direct URLs, refresh, notifications and Hebrew RTL work.
- On disposable fixtures, final account deletion preserves shared dogs/files, queues solo cleanup and shows support recovery reference on the verified partial-failure boundary.
- Anonymous/outsider writes fail; roster/photo rights follow the contract; privileged function endpoints reject unauthorized callers.
- Imported personal baseline is preserved while destructive fixtures can be recreated. No real push/email or production call escaped staging.
- Run `npm test`, relevant existing e2e scripts, `npm run lint`, `npm run build`, `git diff --check` for implementation changes; the full Supabase contract suite remains local Docker only. Report manual/native coverage and skipped checks accurately.
- Update the execution manifest, Notion ticket and `CODEX_CONTEXT.md` with actual project ref, commits, verification, remaining choices and next action. Follow repository commit/merge/push workflow; do not imply staging deployment authorizes production deployment.

## Resume prompt

> Implement `docs/SUPABASE_STAGING_PLAN.md`. Read `AGENTS.md` and `docs/CODEX_CONTEXT.md` first. Verify the existing production identity and migration history read-only, resolve the staging project/access and selected-data manifest, and create an independent persistent staging environment. Import my selected profiles/dogs/photos/parks with independent staging logins, rehearse the legacy upgrade, and provide a named local staging run command. Keep the disposable Docker tests separate. Report any missing account/billing/data-selection input and continue independent preparation. Do not deploy to production as part of staging setup.

## Sources and platform caveats

Official documentation reviewed during planning on 2026-10-03; verify current commands/availability before execution:

- [Managing environments](https://supabase.com/docs/guides/deployment/managing-environments).
- [Auth migration](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects): full Auth migration is possible, but independent staging accounts are the proposed selected-import approach.
- [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project): a physical clone does not copy Storage files/settings or deploy Edge Functions; copied external jobs can begin running immediately. Prefer a sanitized logical import here.
- [Branching](https://supabase.com/docs/guides/deployment/branching): a persistent branch is an alternative, but its availability/billing and data-copy behavior must be verified. This plan recommends a separate project and does not assume the user's subscription tier.
