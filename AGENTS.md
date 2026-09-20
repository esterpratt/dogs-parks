# KlavHub repository instructions

## Project

- KlavHub uses React, TypeScript, Vite, SCSS Modules, Supabase, and Capacitor for iOS and Android.
- Inspect `package.json` and existing code before assuming package versions, APIs, scripts, or patterns. Never assume an API or version.
- Prefer patterns already present in the repository unless the user approves a change.

## Code conventions

- Use clear variable names, including callback parameters.
- Destructure component and function props inside the function body.
- Place exports at the end of the file; do not export individual functions or components inline.
- Always use curly braces for `if` statements.
- Use interfaces for function and component props. Do not create an empty props interface when there are no props.
- Put types shared by multiple files in `src/types`; keep types used by only one file in that file.
- Do not use async IIFEs inside `useEffect`; define a named async function and call it instead.
- Avoid `setTimeout` unless it is specifically required.
- Add comments explaining code introduced or materially changed by Codex.
- Preserve the existing architecture unless a cleaner conceptual model is needed. Explain significant architectural recommendations before implementing them.

## Verification

- Use the existing package scripts.
- After relevant code changes, run `npm run lint`, `npm run build`, and `git diff --check`.
- Run focused tests when they exist, using the appropriate existing test script.
- Do not claim verification succeeded unless the command actually ran successfully. Report skipped or failed checks accurately.

## Dependencies and platform maintenance

- Do not update packages automatically or use `--force`.
- Before any major-version upgrade, review compatibility and receive user approval.
- When resuming work after several days, first inspect Git status and run `npm audit` and `npm outdated`.
- Also review whether development tools, platform requirements, store requirements, target SDKs, signing assets, or store releases require attention. Report findings before making changes that expand the task.

## Supabase

- Treat the database as the source of truth for park data. JSON files contain general information and translations only.
- Make database changes through new migration files. Never edit or rerun an already-applied migration.
- For database changes, review authentication, authorization, row-level security (RLS), `SECURITY DEFINER`, and function execution grants.
- Do not solve Supabase type mismatches with broad casts or by making everything nullable. Align types with the actual schema and query results.

## Git workflow

- Create a branch for each task.
- After verification and commit, merge directly into `main` without a pull request. Push `main` and delete the local task branch.
- Honor explicit user instructions to stop before committing, merging, or pushing.
- Do not discard unrelated user changes.
- Use `git diff --stat` by default; inspect the full diff only when necessary.

## Working style

- Keep plans concise and copyable.
- When manual code replacement is required, provide the complete file.
- Ask before destructive actions or changes that materially expand the task.
