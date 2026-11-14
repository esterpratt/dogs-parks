# Native security hotfix checkpoint

Prepared 2026-11-06 on `fix/capacitor-7-security-hotfix`. This is a source and local-build checkpoint, not evidence that a patched app is available in either store. The [release sequence](MULTI_OWNER_NEXT_STEPS.md) still governs publication and the later ownership rollout.

## Prepared source

- The repo previously had `@capacitor/core`, `@capacitor/android`, and `@capacitor/ios` at `7.4.3`, with CLI `7.6.8`. The [Capacitor advisory](https://github.com/ionic-team/capacitor/security/advisories/GHSA-rvm3-566m-v7fv) affects native 7.x versions before `7.6.9` and requires rebuilt, redistributed apps.
- All four are now pinned to `7.6.10`. `npx cap sync` updated the CocoaPods lockfile to Capacitor `7.6.10`; Android resolves its Capacitor project from the matching installed package. Vite `6.4.5`, Vitest `4.1.12`, and compatible transitive `source-map-js` and `brace-expansion` patches also reduced audit findings.
- Candidate identifiers are Android `1.0.10` / versionCode `12` and iOS `1.2.5` / build `13`. Confirm that both exceed the highest builds already uploaded in their consoles before distributing either artifact. The previous repo identifiers were Android `1.0.9` / `11` and iOS `1.2.4` / `12`; these do not establish the published versions.

## Local verification

- Passed: `npm run lint`, `npm run build`, `npm run test` (111 tests), `npm run test:supabase`, `git diff --check`, Android `assembleDebug`, and an unsigned iOS Simulator `xcodebuild` after Capacitor sync.
- Installed and launched the debug apps on an iOS 26.5 iPhone 17 Pro Simulator and the Android `Medium_Phone` emulator (Android 37.1 image). Both reached the parks map. This proves startup and map rendering only. The sign-in/out, dog and photo, account deletion, deep-link, and notification flows in step 1 remain to be exercised with designated test accounts. Push delivery, camera behavior, release signing, and store installation need device or release-artifact checks where simulator/emulator behavior is insufficient.

## Audit and release gates

- Baseline `npm audit` on 2026-11-06: 22 findings (2 critical, 9 high, 10 moderate, 1 low). After the focused updates: 15 findings (0 critical, 6 high, 8 moderate, 1 low). Production-dependency audit: 6 findings (5 high, 1 low). The five high production entries are the Firebase/Firestore/gRPC dependency chain; the low entry is `i18next-http-backend`. npm's suggested fixes require a breaking Firebase downgrade and an `i18next-http-backend` major update. Neither was applied. Remaining development findings include `happy-dom` and glob/minimatch tooling; review these separately from the urgent native redistribution.
- Confirm the actual available store binaries, source/build identifiers, and Google Play published target API in the consoles. The public store listings do not expose enough evidence for this gate. If the published binaries contain affected Capacitor versions, treat them as vulnerable until the patched builds are installed.
- Verify release signing and run the complete step 1 native regression checklist against the intended backend. Then prepare reviewable iOS and Android release artifacts. Store submission and publication require separate authorization under the release sequence. Record submission, approval, availability, and first patched installed build separately.

## 2026-11-14 current-source candidate preparation

- Ester reported iOS `1.2.4` (build `12`) as the latest uploaded version and Android `1.0.9` (versionCode `11`, target SDK `36`) as the latest release; she checked that `11` is the highest Android versionCode across all tracks. The proposed next identifiers, iOS `1.2.5` (build `13`) and Android `1.0.10` (versionCode `12`), therefore exceed those reported uploads. No store upload has occurred.
- Source `c1f9188` was built in production mode and synced into both native projects. A fresh iOS Release archive exported to `.private/native-hotfix/klavhub-ios-1.2.5-13-c1f9188-export/App.ipa` (SHA-256 `4550dd6277844d20c9a0882f0eeb0c3d701927ba97f29ff208b8715eb0769c1d`). Strict code-signature verification passed. The IPA has bundle ID `com.klavhub`, version `1.2.5` / build `13`, Apple Distribution identity for team `99MX7U73CT`, production push entitlement, `get-task-allow=false`, and the production web backend rather than staging.
- A fresh Android release bundle was copied to `.private/native-hotfix/klavhub-android-1.0.10-12-c1f9188-unsigned.aab` (SHA-256 `1447f2000e1117e9d3e3426f1b6f4c7c62a8161a6a2977e5d8b81502a8e9798b`). `jarsigner` confirms it is unsigned. A matching freshly built release APK declares `com.klavhub`, version `1.0.10` / code `12`, and target SDK `36`; the bundle contains the production web backend rather than staging. The existing keystore file was located locally, but its password is not known. An ignored local helper at `.private/native-hotfix/sign-android-1.0.10-12.sh` prompts for the password and alias without storing either. Compare the resulting upload certificate SHA-256 with Play Console before upload.
- `npm audit` reported 15 findings (0 critical, 6 high, 8 moderate, 1 low); `npm outdated` listed 62 packages. No dependency upgrades were made for these candidates. Android upload signing and verification, final installed-release checks, and both store submission/publication remain open.
