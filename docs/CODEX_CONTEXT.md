# KlavHub current context

Short bootstrap and handoff; Notion is the task source of truth. Permanent coding instructions live in `AGENTS.md`. Release and prior-work status below reflect the user-provided handoff.

## Current state

- Backlog review completed on 2026-09-21; ownership discovery awaits the user's eligibility decision.
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

Immediate next step: resolve ownership eligibility with the user (community volunteers, verified operators/municipal staff, or separate roles for both), then review a concrete permissions and approval model. Suggested technical priority is write reliability and duplicate-report triage before expanding permissions. This order is a recommendation, not an approved implementation plan.

## Reconciled handoff tasks

- [Central write timeout and offline behavior](https://app.notion.com/p/3e24e04c2ff181128aa3f233846c8e3d): acceptance criteria include late success, safe retry, duplicate prevention, and Web/iOS/Android coverage. No runtime tests performed during review.
- [Gradual Supabase type adoption](https://app.notion.com/p/3e24e04c2ff1817b8cc0fcf6b870dfdb): retain UI domain types and map actual database results. Prior 66-error/22-file count is handoff information, not a fresh result.
- [New park suggestion save test](https://app.notion.com/p/3e24e04c2ff181558180d47cfcd658dc): deferred and nonblocking; separate from the completed confirmation-modal ticket.
- Existing [duplicate review reports](https://app.notion.com/p/1b44e04c2ff18061a7bdf7f1807541e8) and [upside-down mobile photos](https://app.notion.com/p/2344e04c2ff180cf933ec82667918ec9) remain open. Live database uniqueness and current photo reproduction were not verified. The old completed Security ticket concerns Firebase and does not establish current Supabase authorization safety.
- Store publication status remains unverified. Redesign and React Native migration are separate open backlog items, not authorized scope expansions.

## Next major feature: park ownership

Discovery is recorded in [the ownership planning ticket](https://app.notion.com/p/3e24e04c2ff1810592a3cb0f61d736d4). Eligibility is still awaiting a user answer. Before implementation, define:

- What ownership means and owner permissions.
- Who may request, approve, transfer, or remove ownership, and how ownership is verified.
- Required database and RLS changes, and permissions retained by regular users.
- Dispute, reporting, and abuse handling.
- Privacy and app-store implications.
- Whether an administrative approval interface is required.

Do not implement ownership until its conceptual model and authorization rules have been reviewed with the user.

## Continuity rule

At the end of each completed project task:

1. Update the relevant Notion ticket once connected.
2. Keep this file concise, recording only current state, unresolved decisions, and the immediate next step.
3. Remove obsolete details rather than accumulating a chronological log.
