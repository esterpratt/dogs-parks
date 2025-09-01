# AI Runnable Commands (No Prior Confirmation Needed)

This file lists shell commands the AI agent may execute automatically in this repository **without asking first**. All other commands (especially destructive, network-altering, credential, or data-loss risk) require explicit user confirmation.

## Core NPM Scripts

Safe: read-only or local build/test effects.

```
npm run dev            # Start Vite dev server
npm run build          # Production build
npm run preview        # Preview built app
npm run lint           # ESLint
npm run test           # Run Vitest test suite
npm run test -- -u     # Update snapshots (only if tests already failing due to snapshot mismatch)
```

## Git (Safe Operations)

```
git status             # Show working tree state
git diff               # Show unstaged changes
git diff --staged      # Show staged changes
git log --oneline -n 20
```

### Git Operations Requiring Confirmation (NOT auto-run)

For clarity (these will NOT be run automatically): `git push`, `git reset`, `git rebase`, `git clean`, `git pull --rebase`, `git checkout -b`, force pushes, tag creation/deletion.

## Read / Inspect

```
ls -1                  # List files
ls -1 src              # List src directory
find . -maxdepth 3 -type f | wc -l
grep -R "TODO" -n src
```

## Build & Type Safety

```
ts-node --version      # (if needed) verify ts-node
npx tsc --noEmit       # Type check only
```

## Testing (Selective)

```
npm run test -- src/utils/*.test.ts
npx vitest related <file>
```

## Mobile Assets / Info (Read-Only)

```
cat capacitor.config.ts
cat android/app/build.gradle
```

## Search & Analysis Helpers

```
grep -R "useAuth" -n src
grep -R "create" -n src/services
```

## Environment Safety Rules

The AI will NOT without confirmation:

- Remove or rewrite large directories
- Force install global packages
- Run OS-level package managers (brew, apt)
- Expose or modify secrets
- Perform network calls outside standard build tooling

## Adding New Allowed Commands

Add them under the appropriate section with a brief comment. Keep the list minimal and low-risk.

## Change Log

- 2025-09-01: Initial list created.

---

If a needed command is missing, just request it explicitly.
