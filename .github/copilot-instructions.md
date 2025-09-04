# Copilot Instructions for KlavHub Dog Parks App

This guide helps AI coding agents work productively in this codebase. It summarizes architecture, workflows, and conventions specific to this project.

## Architecture Overview

- **Frontend:** React 18 + TypeScript, Vite
- **Mobile:** Capacitor (iOS/Android), mobile-first design
- **Backend:** Supabase (PostgreSQL, Auth, real-time)
- **State:** Zustand (client), React Query
- **Routing:** React Router v7
- **Maps:** Leaflet/react-leaflet
- **Styling:** SCSS + CSS Modules (camelCase for TSX, kebab-case for SCSS)

## Project Structure

- `src/pages/` – Route components (lazy loaded)
- `src/components/` – Modular, domain-driven UI components
- `src/services/` – API/business logic
- `src/context/` – Global state providers
- `src/hooks/` – Custom hooks
- `src/hooks/api` - Custom hooks to handle API requests
- `src/types/` – Shared TypeScript types
- `src/utils/` – Utility functions

## Key Patterns & Conventions

- **Mobile-first:** Only mobile + tablet designs. Safe area, keyboard/orientation handling, bottom nav
- **State:**
  - Global: Context (auth, location), React Query
  - Local: useState/useReducer
  - URL: React Router
- **Auth:** Supabase Auth (Google/Apple), user context, PrivateRoute
- **Data:** Services layer abstracts API, type-safe schema, real-time updates
- **Components:** Modular, feature-grouped, each with `.module.scss`
- **Styling:** CSS Modules, SCSS, pixels only, no font-weight, only mobile + tablet design
- **Exports:** Always at end of file
- **Types:** Shared types in `types/`, local types inline
- **Code:** No single-line ifs, always use `{}`
- **Naming:** Clear variable names, especially in array functions

## Developer Workflows

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Format:** `npm run format`
- **Test:** `npm run test` (Vitest)
- **Preview:** `npm run preview`
- **Mobile:**
  - Sync: `npx cap sync`
  - Android: `npx cap run android`, open: `npx cap open android`
  - iOS: `npx cap run ios`, open: `npx cap open ios`

## Integration Points

- **Capacitor plugins:** Camera, geolocation, etc. (see `utils/platform.ts`)
- **Supabase:** Auth, DB, real-time (see `services/`)
- **Maps:** Leaflet integration in `components/map/`

## Example Patterns

- API calls via service functions, wrapped in React Query hooks
- Modular SCSS per component
- Platform detection for mobile features

## General Instructions

- Show me a plan of changes before implementing them
- Run Prettier formatting after every code change
- If there are eslint or ts errors after your change, try to fix the file

## General Code Standards

- Use clear variables names, also inside array functions
- Extract props inside a function
- Export in the end of a file
- Always use curly braces for if statements (no single-line)
- Use interface for functions/components props type
- Prefer object for props/params with more than 1 prop/param
- Use interfaces for types. .ts files interfaces should be named [FunctionName]Params. .tsx files interfaces should be names [FunctionName]Props
- react-query queries should use a different stale time if they need a smaller cache than the global 1 day

## Styling conventions

- Use camelCase for className combinations in TSX files
- Use kebab-case for SCSS class selectors (file names can follow component/module naming)
- Use pixels, not rem
- Do not use font-weight
- Do not use inline style unless asked to
- Use `classnames` from `classnames` to concatenate multiple and conditional class names; avoid template string concatenation for classes
- Theme variables are set in theme.scss. Variables for colors and typography are set in variables.scss.

## Folder-Specific Code Standards

- `src/pages/`
  - Each page is a route-level React component, lazy loaded if needed.
  - Export default at end of file for lazy loaded pages, export named at the end of the file for the rest.

- `src/components/`
  - Modular, domain-driven components grouped by feature (e.g., dog/, park/).
  - Each component has a matching `.module.scss` file. Class selectors inside should be kebab-case.
  - Use clear prop interfaces, extract props at top of function.
  - No single-line ifs; always use curly braces.
  - Name exports at end of file.

- `src/services/`
  - Contains API calls, business logic, and setups.
  - Abstract all Supabase/database logic away from UI.
  - Functions should be pure and type-safe.
  - Use named exports only at end of file.
  - Wrap functions in try...catch
  - Receive an error from supabase request, and if exists throw it to the catch
  - Catch should throw an error or only console the error based on the need
  - Catch that do not throw an error should console.error the error and return the appropriate type (e.g null or [])
  - Catch that throws an error should use the custom throwError from error.ts

- `src/context/`
  - React context providers for global state (auth, location, notifications).
  - Context value must be typed with interfaces.
  - Provide hooks for context access (e.g., `useUserContext`).

- `src/hooks/` & `src/hooks/api/`
  - Custom hooks for reusable logic and API requests.
  - Use `use` prefix for all hook names.
  - One hook for a file.
  - API hooks wrap service functions and use React Query.
  - Always return typed values.

- `src/types/`
  - Shared TypeScript types/interfaces used across files.
  - Enums shuold be named PascalCase and use UPPERCASE keys.
  - Types should be exported as types.
  - Types used only in one file should be defined inline in that file.

- `src/utils/`
  - Utility functions, helpers, and platform detection.
  - Functions must be pure and reusable.
  - Test files use `.test.ts` suffix and colocate with the utility.

Follow these standards for consistency and maintainability

## References

- See `README.md` for app overview

## Assistant Working Memory (user-memory.json)

A lightweight, explicit reminder system for future queries.

Location: `.github/user-memory.json`

Schema (array of entries):

```
{
  id: string,
  triggers: string[],        // lowercase phrases; ALL words in a phrase must appear in the user query to match (case-insensitive, order flexible but phrase words must all be present)
  reminder: string,          // < 200 chars; actionable fact / guideline
  contextLinks: string[],    // optional repo-relative paths
  lastUpdated: ISO date
  // optional: expires?: ISO date
}
```

Matching rules for the assistant:

1. Normalize incoming user query to lowercase.
2. For each entry, treat each trigger phrase as a set of words; if every word in the phrase appears somewhere in the query, that trigger matches.
3. If any trigger matches, surface the `reminder` BEFORE performing the requested action (once per conversation turn per entry).
4. If multiple entries match, list them in the order they appear in the file.
5. Ignore entries where `expires` is in the past.

Guidelines for adding entries:

- Use specific multi-word triggers (avoid single generic words like "button").
- Prefer 1–3 trigger phrases per entry.
- Keep reminders stable; update (do not duplicate) when guidance changes.
- Remove or add `expires` to phase out temporary notes.
- Keep file small (< ~50 entries) to avoid noise.

Example (already added):

```
{
  "id": "newmap-weather-button",
  "triggers": ["newmap button", "new map button", "newmap component button"],
  "reminder": "The weather button is shown when there is rain.",
  "contextLinks": ["src/components/map/NewMap.tsx"],
  "lastUpdated": "2025-09-04"
}
```

Maintenance workflow:

1. Edit `.github/user-memory.json`.
2. Commit with message prefix `chore(memory):`.
3. During PR review ensure triggers aren't overly broad.

Assistant behavior note:

- The assistant does NOT learn automatically outside this file.
- If you want something remembered, add it here explicitly.
- If a reminder becomes obsolete, delete the entry to prevent stale guidance.

---
