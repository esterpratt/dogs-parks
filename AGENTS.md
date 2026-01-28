# AGENTS.md

This file provides guidance to Codex agents (and any other agentic coding assistants) when working in this repository.

If there is a conflict between instructions, follow this priority:

1. System / tool policies
2. This AGENTS.md
3. Existing repo conventions (if not contradicting #2)
4. Your own defaults

---

## How you must work (required workflow)

1. **Understand first**
   - Read the task request carefully.
   - Search the codebase for relevant existing code before proposing changes.
   - Open and read the **entire** relevant files (not just a snippet).

2. **Write a plan (required)**
   - Create a plan file at: `.agents/todos/[task-name].md`  
     (Use a descriptive filename, kebab-case. Example: `fix-notifications-badge.md`.)
   - The plan must be a checklist of small, safe steps.

3. **Stop and ask for plan approval**
   - Do **not** implement anything until the user approves the plan.

4. **Implement in small steps**
   - Make the smallest possible change that solves the problem.
   - Check off todo items as you complete them.

5. **Communicate at a high level**
   - After each step, explain briefly what changed and why (high-level only).

6. **Finish with a review**
   - Append a **Review** section to the same todo file including:
     - summary of changes
     - files touched
     - any follow-ups / risks / trade-offs

---

## Non-negotiable engineering principles

- **Do not be lazy.** If there’s a bug, find the root cause and fix it properly. No “temporary” patches.
- **Simplicity over cleverness.** Changes should touch as little code as possible and introduce as little new surface area as possible.
- **Avoid big refactors** unless explicitly asked. Prefer targeted edits.
- **Prefer existing patterns.** Do not introduce a new pattern if one already exists.
- **If unsure, stop.** Ask for clarification rather than guessing in a way that can break behavior.

---

## “Search first” rule (must follow)

Before adding any new:

- utility
- hook
- helper
- component
- pattern

You must search the repo for an existing solution and reuse/adapt it.

At minimum, check:

- `src/hooks/`
- `src/utils/`
- `src/components/`
- `src/services/`

Use grep/glob searches and look for similar implementations.

---

## “Read full context” rule (must follow)

Before editing any file:

- Read the **entire file**.
- Understand existing wrappers/containers/component hierarchy.
- Never add a wrapper/container until you confirm there isn’t already one you can reuse.

---

## Tech stack (quick orientation)

- **Frontend:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** SCSS + CSS Modules
- **Mobile:** Capacitor
- **Backend:** Supabase (Postgres + realtime)
- **Server state:** React Query (TanStack Query)
- **Client state:** Zustand + some React Context
- **Routing:** React Router v7
- **Maps:** Leaflet + react-leaflet
- **Testing:** Vitest (jsdom)

---

## Commands you can use (reference)

### Essential

- `npm run dev` – start dev server
- `npm run build` – production build (TS compile + Vite build)
- `npm run lint` – ESLint
- `npm run test` – Vitest
- `npm run preview` – preview build

### Mobile (Capacitor)

- `npx cap sync`
- `npx cap sync android && npx cap open android`
- `npx cap run android`
- `npx cap run ios`
- `npx cap open ios`
- `npx cap build android`
- `npx cap build ios`

---

## Code conventions (must follow)

### General TypeScript / React

- Use clear, descriptive variable names (including in array callbacks).
- Extract props **inside** the component/function body (not in the signature).
- **Exports go at the end** of the file (no inline exports).
- No single-line `if` statements: always use `{}`.
- Prefer `interface` for object shapes; use `type` for unions/primitives.
- **Never use `any`.** Use `unknown` + type guards if needed.
- Shared types used in more than one file go in `src/types/`.
- For combining CSS classes use `classnames` imported as `classnames` (not `classNames`).

### Styling (SCSS + CSS Modules)

- Use **px only** (no rem).
- SCSS class names are **kebab-case**.
- In TSX, reference styles via **camelCase** (no `styles['kebab-case']`).
- **Do not use `font-weight`**.

### Services layer

- Service files live in `src/services/`.
- Prefer `fetch/create/update/delete` prefixes for CRUD.
- Wrap Supabase calls with consistent error handling (reuse `throwError` / existing patterns).
- Avoid adding new orchestration unless necessary—prefer simple, direct flows.

---

## Problem-solving philosophy (how to choose solutions)

1. **Question the architecture first**  
   If you need lots of defensive code, pause and ask if a simpler design removes the problem.

2. **Separation of concerns**  
   Don’t mix: identity/flags (primitives) with cached objects.

3. **Think in primitives**  
   Prefer storing IDs/booleans/enums instead of full objects in local state.

4. **Root cause, not bandaids**  
   If you’re tempted to “prevent refetch” or “skip updates,” check whether the real issue is state duplication or wrong ownership of truth.

5. **Discuss trade-offs**  
   When proposing a solution, include:
   - what it fixes
   - simplest alternative
   - risks and follow-ups

---

## Repo structure pointers (high level)

- `src/pages/` – route screens
- `src/components/` – reusable components by domain
- `src/hooks/` – custom hooks (including API hooks)
- `src/services/` – Supabase + other integrations
- `src/types/` – shared types
- `src/utils/` – helpers

---

## What you must NOT do

- Do not implement before plan approval.
- Do not introduce new libraries unless explicitly requested.
- Do not refactor broadly “for cleanliness.”
- Do not create duplicate hooks/utilities when one exists.
- Do not change CSS naming conventions.
- Do not change database schema / RLS / migrations unless explicitly asked.

---

## Notes for multi-agent execution (if supported by the tool)

If you can run multiple agents:

- **Planner agent:** writes the plan file only.
- **Implementer agent:** makes code changes following the approved plan.
- **Reviewer agent:** double-checks correctness, minimal diff, and conventions.
- **Tester agent:** runs targeted checks (`lint/test/build`) relevant to the change.

All agents must follow the workflow and conventions above.
