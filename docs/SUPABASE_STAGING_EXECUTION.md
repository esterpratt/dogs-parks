# Staging execution manifest

Inventory date: 2026-10-04. S1 is partially complete; S2–S5 have not begun.

## Verified target and source

- Source commit: `7b8e00179749ec1490b3022628128316c6a61600`.
- Installed Supabase CLI: `2.109.1`; project-list, create, dump, query and migration-list help inspected.
- Authenticated production metadata: `klavhub`, ref `kbsjdfzpeianxhidguam`, organization `gbrjjdkznfgppptizsue`, Frankfurt `eu-central-1`, PostgreSQL `15.8.1.040` / engine 15, `ACTIVE_HEALTHY`.
- The repository remains linked to production. No linking change was made.
- Accessible project listing contains production and an unrelated inactive project; no `klavhub-staging` exists in that listing. Destination ref is unresolved.
- Working tree was clean on entry; task branch: `chore/supabase-staging-inventory`.

## Live schema and deployment inventory

- All 23 public application tables have RLS enabled. Policy semantics and execution grants still need detailed review; enabled RLS alone does not prove authorization.
- Auth triggers: `add_user_trigger` → `add_user`; `on_user_deleted` → `delete_user_folder`. Trigger enabled state and full behavior remain to review.
- Storage buckets `users`, `parks`, `dogs` are public, each with a 256000-byte limit and no configured MIME allowlist. Storage policies and selected objects remain to inventory.
- Realtime publication includes `public.notifications`.
- Extensions: plpgsql 1.0, pg_stat_statements 1.10, uuid-ossp 1.1, pgcrypto 1.3, pgjwt 0.2.0, pgsodium 3.1.8, supabase_vault 0.2.8, http 1.6, pg_net 0.14.0, moddatetime 1.0. Verify availability on the new project's actual PostgreSQL version before bootstrap.
- `cron.job` is absent. This does not rule out external schedulers.
- Deployed Edge Functions: `delete-user` v9, `send-new-park-mail` v9, `send-report-park-mail` v4, `check-review-reports` v5, `send-push-notification` v42. All report gateway `verify_jwt=true`; deployed source/internal authentication remains to review. `process-dog-storage-jobs` is absent.
- Four webhook triggers still contain inline JWTs and production destinations: `newParkHook`, `reportParkHook`, `reviewReportCountHook`, `sendPushNotification`. Credential-presence flags were queried without printing credentials. Production remediation is outstanding and remains outside this staging operation.

## Migration ledger

Read with `supabase migration list --linked`. Applied versions:

```text
20260906155031
20260913142712
20260913150025
20260913152814
20260918174629
20260918180306
```

All nine feature migrations in the [ordered production inventory](SUPABASE_PRODUCTION_ROLLOUT_PLAN.md#ordered-feature-migration-inventory) are absent from the live ledger. No migration was applied or repaired. The undocumented baseline still prevents bootstrapping an empty project by replaying the repository ledger alone.

## Protected local schema artifacts

Schema-only export completed with `supabase db dump --linked --file .private/staging/production-schema.sql`. No selected application records, Auth users or photos were exported.

- Directory permissions: 0700; SQL files: 0600; `.private/` is ignored by git.
- Raw schema: 113858 bytes; SHA-256 `9ce4902ef7d3c070009729c865b791efb801a196dbbec72b8eed3a8950897d5b`.
- Bootstrap candidate: `.private/staging/bootstrap-candidate.sql`; SHA-256 `c291ade8f5eda53821288af20735710be29a85b53e0679fad13380ce1e6dcd56`.
- The candidate removes exactly the four webhook trigger statements. Checks found no remaining production ref or literal `Bearer eyJ` string. This is limited screening, not complete sanitization approval.
- The raw export contains sensitive webhook arguments. Keep it private. The candidate must undergo full definition/grant/external-destination review and comparison with the local baseline before any import. Auth triggers, Storage policies/settings and baseline-history reconciliation still need explicit handling.

These are machine-local artifacts, not committed backups or an executed bootstrap. Original migration files remain unchanged.

## Automation and client findings

Checked-in workflows perform PR checks/reviews, CodeQL and manual PR creation. None contains database or function deployment. The PR e2e workflow uses secrets whose backend target is not verified. External hosting/GitHub integration settings remain unverified; this inventory does not clear a future client-code push for automatic hosting deployment.

The client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Browser OAuth returns to `/auth-callback` on the current origin. Staging mode must explicitly supply both backend variables because `.env.local` also participates in Vite mode loading. No environment file or client behavior was changed.

## Pending inputs and next action

Requested from Ester:

1. Organization/region choice and acceptable billing. Matching production means organization `gbrjjdkznfgppptizsue`, region `eu-central-1`; do not infer paid-resource authorization.
2. Exact own and test-profile IDs or emails, whether to include all their dogs/photos, and park scope.
3. Independent staging account setup through a secure local mechanism once the destination exists; do not put passwords in chat or git.

Selection, user-ID mappings, per-table destination counts and object paths/checksums remain unresolved. Do not export unrelated profiles or claim a selected-data manifest exists yet.

Next: resolve inputs, finish schema/Auth/Storage/grant and external-integration review, choose baseline/history reconciliation, then provision an explicitly guarded staging target. No production schema, application data, credentials, deployment or compatibility row was changed. CLI metadata access initialized its temporary login role.

Documentation-only checkpoint: verify `git diff --check`. Application, e2e and local Docker contract checks are deferred until implementation; no test success is implied here. The previous handoff was yesterday, so the several-day audit/outdated maintenance gate did not apply. Platform/store/signing status remains unverified and no upgrade is included.
