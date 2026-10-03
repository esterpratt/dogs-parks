# Repository secret audit — 2026-10-03

Scope: the tracked checkout, every available Git object reachable through local refs, and pushed history reachable from `origin/main`. This was a repository audit; it did not inspect GitHub Actions logs/artifacts, PR attachments, inaccessible remote refs, or live cloud secret/configuration stores.

## Findings

- Gitleaks `8.30.1`, downloaded from its official release and checksum-verified, reported 11 matches in pushed history (834 commits scanned). All matched local-demo Supabase tokens or historical Firebase client API keys; no production privileged credential was identified by the scan.
- An additional pattern/exact-local-value audit inspected 5,524 unique text/binary blob versions, scanning text content and comparing configured local credential values without printing them. Apparent private-key matches were code that removes PEM headers, not embedded key material. Binary file content was not decoded by this supplementary audit.
- The staging/production plans and ownership test baseline contain project identifiers, documented aggregate audit counts and sanitized placeholders, not production credentials or copied user records. The four fixture webhook headers use `LOCAL_TEST_SERVICE_ROLE_KEY` and local destinations.
- `.env.local`, Android Firebase configuration and iOS Firebase configuration are untracked and ignored. Firebase client configuration appeared in older commits and was removed previously; its historical presence remains.
- No private key, signing credential, real account password, service-role credential or production personal-data export was identified. This is a scan result, not a guarantee that every possible secret format or external artifact was examined.

## Cleanup and remaining checks

- Replace literal local-demo JWTs in three Edge Function invocation examples with an environment-variable reference. Runtime function behavior is unchanged.
- Add ignore rules for signing material, credential files, protected private data, backup/export/import directories, staging/production data, runtime function copies and private manifests/audit outputs. Ignored files already tracked in the future would still need explicit untracking.
- Keep private scanner reports and tooling outside git. No application configuration was deleted; existing local environment/Firebase files remain local.
- No Git history rewrite or key rotation was performed: the audit identified no privileged credential requiring it. Historical Firebase client key restrictions remain unverified. Check Firebase/Google Cloud API restrictions and security rules before deciding whether any historical client key needs replacement; do not rotate indiscriminately and break released clients.
- The separately documented service-role credential embedded in live database webhook definitions was a live-schema finding, not a credential found in committed Git content. Its remediation still belongs to the production rollout plan.

Firebase distinguishes client API keys from privileged credentials and requires appropriate API restrictions/security controls: [official Firebase API-key guidance](https://firebase.google.com/docs/projects/api-keys). Project references/URLs identify projects and are not service-role secrets: [Supabase API-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

## Verification

- Gitleaks scan of current tracked text files plus this audit document after cleanup: zero findings (approximately 2.48 MB scanned). Historical matches remain in earlier commits as described above.
- Confirmed ignore behavior for the existing environment/Firebase files and representative private manifests, SQL exports/backups, signing keys and service-account files. No matching signing/private-manifest files are tracked.
- `npm run lint`, `npm run build` and `git diff --check` passed. Build retains the existing chunk-size warning. No runtime behavior changed; destructive Supabase tests were not needed for comment/ignore/documentation changes.

If a privileged credential is discovered later: revoke/rotate it, preserve any needed local copy outside tracking, remove the literal from the checkout, add the exact ignore rule and assess a coordinated history purge. A normal revert or `.gitignore` does not remove earlier commits from GitHub.
