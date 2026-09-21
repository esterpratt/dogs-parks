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

Immediate next step: finish shared dog ownership product decisions and screen flows with the user, then audit the live dog schema, RLS, RPCs, storage policies and account-deletion behavior before implementation. The Notion ticket distinguishes confirmed choices from proposals. General reliability and duplicate-report work are separate backlog tasks, not established blockers for this feature.

## Reconciled handoff tasks

- [Central write timeout and offline behavior](https://app.notion.com/p/3e24e04c2ff181128aa3f233846c8e3d): acceptance criteria include late success, safe retry, duplicate prevention, and Web/iOS/Android coverage. No runtime tests performed during review.
- [Gradual Supabase type adoption](https://app.notion.com/p/3e24e04c2ff1817b8cc0fcf6b870dfdb): retain UI domain types and map actual database results. Prior 66-error/22-file count is handoff information, not a fresh result.
- [New park suggestion save test](https://app.notion.com/p/3e24e04c2ff181558180d47cfcd658dc): deferred and nonblocking; separate from the completed confirmation-modal ticket.
- Existing [duplicate review reports](https://app.notion.com/p/1b44e04c2ff18061a7bdf7f1807541e8) and [upside-down mobile photos](https://app.notion.com/p/2344e04c2ff180cf933ec82667918ec9) remain open. Live database uniqueness and current photo reproduction were not verified. The old completed Security ticket concerns Firebase and does not establish current Supabase authorization safety.
- Store publication status remains unverified. Redesign and React Native migration are separate open backlog items, not authorized scope expansions.

## Next major feature: shared dog ownership

Discovery is recorded in [the corrected ownership planning ticket](https://app.notion.com/p/3e24e04c2ff1810592a3cb0f61d736d4). Several users should share one dog profile; a user may still have multiple dogs. Confirmed by the user:

- One primary owner plus co-owners, with shared day-to-day editing as the working model.
- Support both invitations (recipient accepts) and ownership requests.
- All owners upload and select the main photo; co-owners delete their own uploads; primary can delete any photo.
- Ordinary primary-role transfer requires acceptance; the previous primary remains a co-owner.
- Shared dog deletion requires all current owners' consent. Preserve current behavior when no co-owner exists, after verifying live cascades and the delete RPC.
- Prefer tabs/pages over additional modals; detailed schema and visual screen proposals must be reviewed before implementation.
- Photos stay in the gallery at the bottom of Details; use Details and owner-only Ownership tabs, not a separate Photos tab.
- Support-reviewed recovery is approved for the first release; exceptional-case handling still needs definition.

Latest user preferences: preserve user-card friend search and hide mode; put a discreet Request ownership action on the dog page and ownership management in an owner-only tab. Primary owners should not remove co-owners. Leaving/account deletion should offer successor selection with automatic promotion of the longest-standing eligible co-owner when none is selected, without recipient acceptance. These departure semantics differ from ordinary voluntary transfers.

Repository findings: dog queries use a single `dogs.owner`; image paths and their cached owner ID depend on that owner; dog edit controls depend on navigation state. Account deletion removes the user's storage folder, including dog photos. The live schema, policies, RPC definitions and deployed account-deletion authorization remain unverified.

Proposed design: dog-owner memberships, atomic database succession/departure, a retryable account-erasure workflow across Auth/DB/Storage, and images stored by dog ID with nullable uploader metadata. Leaving a dog removes access; account erasure removes identifying references while shared-image retention needs an explicit policy. No application or database changes have been made.

Deletion audit: the checked-in Edge Function deletes Auth first, then the user's storage folder; application-row effects depend on live cascades/triggers. A linked read-only schema dump was attempted but failed because Docker is not running. Live table deletion behavior and deployed function parity remain unverified. Audit storage ownership (which can block Auth deletion), caller authorization, cleanup pagination and retry behavior. Notion explicitly distinguishes preserved existing behavior from shared-data exceptions: retain shared dogs/images, remove memberships, and clear uploader references on account deletion.

Open decisions: detailed support recovery procedure, retained shared images and attribution, hidden co-owner identity within ownership management, invitation eligibility/expiry, and legacy photo attribution. Recovery uses the existing support contact path; inactivity is never automatic deletion consent. Check-in remains user-based; accompanying-dog selection is separate. Next deliverable after product agreement: complete new/changed table inventory with deletion rules plus a clickable design proposal using existing styles and tabs/pages.

Supabase access: discovered an available Supabase plugin and suggested installation; it is not yet connected. Recommended audit connection is official hosted MCP scoped to the linked project with `read_only=true` and database/functions/storage/docs feature groups, authenticated through browser OAuth. No local database is needed; Docker was only the linked CLI dump's export runtime. Await authentication and verify tools/project scope before the live audit. Notion records setup references and Dashboard SQL Editor/remote schema-export alternatives.

The user wants tests before behavior changes. Notion now specifies green baseline regressions, new-feature tests demonstrated failing before implementation, real database/storage authorization tests, and multi-session browser journeys. Existing tooling is Vitest/happy-dom and Playwright; a disposable database test harness still needs validation/setup. No tests were added or run during planning. Do not implement until remaining product and authorization rules are reviewed.

## Continuity rule

At the end of each completed project task:

1. Update the relevant Notion ticket once connected.
2. Keep this file concise, recording only current state, unresolved decisions, and the immediate next step.
3. Remove obsolete details rather than accumulating a chronological log.
