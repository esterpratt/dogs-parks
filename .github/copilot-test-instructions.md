# GitHub Copilot E2E Test Generation Guide (Playwright + MCP)

Purpose: Provide precise, deterministic instructions for GitHub Copilot when asked to author or refine Playwright end-to-end tests using the Playwright MCP tools against this repository.

This file is written FOR Copilot-assisted workflows. It complements `test_authoring.md` (human developer guide). Keep this concise, procedural, and machine-friendly.

---

## 1. Assumptions & Environment

- Local dev server command: `npm run dev` (Vite, port 5173 default)
- Base URL: `http://localhost:5173`
- Tests live in: `tests/e2e/`
- Selector convention: `data-test` (kebab-case). If not present, add it before writing a test.
- If `testIdAttribute` is configured to `data-test`, use `page.getByTestId('<value>')`.
- Repository goals: small, stable specs; parallel safe; no brittle selectors.
- Local execution visibility: ALWAYS run tests in headed mode locally (`--headed`) so humans can observe behavior. Omit `--headed` only in CI environments.

---

## 2. Copilot Action Principles

When generating or editing tests:

1. NEVER invent selectors: inspect via MCP first.
2. Prefer `getByTestId` locators; add missing `data-test` attributes (suggest diff only, do not assume they exist if not in code).
3. Avoid manual waits or timeouts; rely on Playwright auto-wait + locator assertions.
4. Keep each test ≤ ~15 logical steps.
5. Ensure independence (no reliance on prior test state).
6. Use clear test titles describing intent ("user can open park detail").
7. Include at least one assertion verifying navigation or critical UI state.

### 2.1 Auth Intent Parsing

Interpret prompt phrases deterministically; never guess.

| Prompt phrase examples                          | Required state | Action sequence                                                                                                                                                                     |
| ----------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "as a visitor" / "as guest" / "unauthenticated" | Logged OUT     | Ensure clean context. If logged-in indicator (`data-test=navbar-logout-button`) visible: call `logoutIfLoggedIn`. Else clear cookies + local/session storage. Do NOT perform login. |
| "as a user" / "as an authenticated user"        | Logged IN      | Perform login (helper `loginWithEmail`). Use env credentials: `process.env.TEST_EMAIL`, `process.env.TEST_PASSWORD`.                                                                |
| `user <email>` (e.g. `user test@test.com`)      | Logged IN      | Same as above; ignore provided literal password unless explicitly supplied; always use `process.env.TEST_PASSWORD`.                                                                 |

Decision order:

1. If visitor phrase present → enforce logged-out.
2. Else if user/auth phrase or explicit `user <email>` present → enforce logged-in.
3. Else if route clearly protected (e.g. `/favorites`, `/profile`, `/settings`) → assume login (state assumption in comments).
4. Else default to visitor.

Canonical logged-in indicator: `data-test=navbar-notifications-link`.

Rules:

1. Never hardcode secrets or emails; use ONLY: `process.env.TEST_EMAIL`, `process.env.TEST_PASSWORD`.
2. If any of `login-email`, `login-password`, `login-submit` selectors missing: STOP and output a patch suggestion instead of test code.
3. Each test ensures its own auth state (no reliance on previous spec side-effects).
4. For visitor tests, if logged-in indicator appears unexpectedly, log out then proceed and note potential leakage.
5. Do not add query params to the login URL unless required by confirmed selector patterns.

Auth helper usage (MANDATORY):
Always use helpers; do NOT inline raw login or logout steps.

Login (ALWAYS use TEST_EMAIL / TEST_PASSWORD):

```ts
await loginWithEmail(page, {
  email: process.env.TEST_EMAIL!,
  password: process.env.TEST_PASSWORD!,
});
await expect(page.getByTestId('navbar-notifications-link')).toBeVisible();
```

Logout:

```ts
await logoutIfLoggedIn(page);
```

Never implement alternative inline flows unless explicitly instructed.

Patch suggestion format when selectors missing:

```
File: src/components/auth/LoginForm.tsx
Add data-test attributes:
  <input data-test="login-email" ... />
  <input data-test="login-password" ... />
  <button data-test="login-submit" ... />
```

Comment to insert at top of generated spec (when assumption made):

```ts
// Auth assumption: route requires authenticated user; logging in via helper because prompt omitted explicit auth intent.
```

---

### 2.2 Mandatory Startup Steps (Always at Test Start)

At the very beginning of each test (after `page` is available and BEFORE first navigation-dependent assertion) perform all three of these steps to ensure consistent mobile + permission context:

1. Geolocation permission grant (simulate user approving location prompt)
2. Open devtools (headed run; aids debugging)
3. Switch to mobile viewport (emulate typical mobile dimensions)

Canonical snippet (include near top of test body, before main flow logic):

```ts
// Standard startup: permissions + devtools + mobile viewport
await context.grantPermissions(['geolocation']);
// Optionally set a deterministic geolocation used by the app
await context.setGeolocation({ latitude: 32.0853, longitude: 34.7818 });

// Open devtools (Chromium only); safe no-op in other browsers
if (
  page.context().browser() &&
  (await page.context().browser()!.version()).includes('Chromium')
) {
  // Playwright launches with devtools if configured; fallback: open a temporary target
  // (Leave as comment: configure via launchOptions in playwright.config if persistent devtools needed.)
}

// Enforce mobile viewport (tune height if sticky headers overlap content)
await page.setViewportSize({ width: 390, height: 844 });
```

Rules:

- Always include this block (or a project helper if one is introduced) unless explicitly told to skip.
- Keep coordinates stable unless the scenario requires a different location.
- Do not duplicate if a test helper already injected it (future optimization allowed).

If context-level utilities evolve (e.g., a `setupTestEnvironment(page)` helper), replace the inline block with that helper and reference this section.

---

## 3. Standard File Pattern

```
// tests/e2e/<feature>/<name>.spec.ts
import { test, expect } from '@playwright/test';

test.describe('<feature group>', () => {
  test('<behavior statement>', async ({ page }) => {
    await page.goto('/<path>');
    // interactions
    // assertions
  });
});
```

---

## 4. Using Playwright MCP Tools (Exploration → Spec)

Copilot should follow this phased approach when asked to create a test:

Phase A: Verify server reachable

- Navigate to base URL `/`.
- Confirm a known stable element exists (`data-test=header-title`).

Phase B: Gather selectors for the requested flow

- Navigate to the target route (e.g., `/parks`).
- List all elements with `data-test` attributes relevant to the described flow (cards, buttons, links).
- If required elements absent, propose adding attributes (do not fabricate tests without stable selectors).

Phase C: Dry-run interactions

- Perform the sequence: clicks, navigation, form fills.
- After each major step, confirm expected element appears.

Phase D: Generate spec

- Output a complete spec file path + code.
- Use helper imports only if they already exist; otherwise inline the steps.
- Add comments only where intent clarifies non-obvious logic.

Phase E: (Optional) Refactor utilities

- If a repeated sequence appears ≥3 times (e.g., login), propose a helper file under `tests/e2e/helpers/`.

---

## 5. MCP Prompt Templates

Use these templates (fill placeholders) before generating a test file.

Exploration (list selectors):

```
Navigate to <route> and return an array of all elements that have a data-test attribute. Include their tag, data-test value, and inner text (trimmed, first 60 chars max).
```

Validate element existence:

```
Check that the element with data-test=<value> exists and return its textContent.
```

Flow rehearsal:

```
1. Go to <route>
2. Confirm data-test=<list-element> elements exist and count them
3. Click data-test=<interactive-element>
4. Wait for data-test=<post-click-element>
5. Return the final URL and presence of data-test=<final-assertion>
```

Generate spec:

```
Produce a Playwright spec at tests/e2e/<feature>/<name>.spec.ts implementing the rehearsed flow. Use getByTestId for each data-test selector. Add an expect() on URL or key element. Keep under 80 columns per line where practical.
```

Refactor helper:

```
Generate helper tests/e2e/helpers/<helper>.ts exporting an async function <fnName>(page: Page, params?: {...}) that performs: <steps>. Update the existing spec to import and reuse it.
```

---

## 6. Assertions Guidance

Preferred assertions (in order):

- `await expect(locator).toBeVisible();`
- `await expect(locator).toHaveText('<Exact Text>');`
- `await expect(collection).toHaveCount(n);` (or `>= 1` pattern with conditional when needed)
- URL: `expect(new URL(page.url()).pathname).toContain('/park/');`

Avoid:

- Raw `waitForTimeout`
- Assertions on styling / color
- Over-broad snapshot assertions

---

## 7. Handling Missing Selectors

If a required UI element lacks a `data-test` attribute:

- Output a minimal patch suggestion:

```
File: src/components/<Component>.tsx
Add data-test="<selector-name>" to the root actionable element used in the flow.
```

- Pause spec generation until selector is confirmed or explicitly allowed to proceed with a fallback (text-based) – fallback only if explicitly authorized.

---

## 8. Error / Flake Mitigation

If a step fails:

1. Re-run the locator query alone to confirm absence.
2. If intermittent, suggest adding an assertion before interaction.
3. If navigation race, ensure `await page.goto()` precedes queries.

Do NOT immediately raise retries; fix root cause first.

---

## 9. Output Format Requirements (When Copilot Responds with a Test)

- Provide path + full file content.
- No extraneous commentary outside code block unless clarifying assumptions.
- Mention any new `data-test` attributes required.

Example output structure:

```
Path: tests/e2e/parks/list.spec.ts
---
<code>
```

---

## 10. Sample Generated Test (Pattern Reference)

```ts
import { test, expect } from '@playwright/test';

test.describe('parks', () => {
  test('user can open first park detail', async ({ page }) => {
    await page.goto('/parks');
    const cards = page.getByTestId('park-card');
    await expect(cards).toHaveCountGreaterThan(0); // custom matcher alternative: use toHaveCount and check value
    await cards.first().click();
    await expect(page.getByTestId('park-name')).toBeVisible();
    expect(new URL(page.url()).pathname).toContain('/park/');
  });
});
```

(If `toHaveCountGreaterThan` not defined, use: `expect(await cards.count()).toBeGreaterThan(0);`)

---

## 11. Security & Data

- Never embed secrets or real credentials.
- For auth flows: require existing test user from env (e.g., TEST_EMAIL). If not available, instruct human to supply.

---

## 12. Change Management

When conventions evolve, update this file. Keep sections stable; append new capabilities rather than rewriting core workflow.

---

## 13. Checklist Before Returning a Spec

```
[ ] All selectors exist or clearly requested
[ ] No manual timeouts
[ ] At least one navigation or state assertion
[ ] Test independent
[ ] File path provided
[ ] Helper usage valid (exists) or omitted
```

---

End of Copilot instructions.
