# Native security release packet

## Current store status and Play blocker: 2026-11-14

Source `e91160c` fixes old park-event notifications that open the generic error page. iOS build `1.2.5 (13)` was uploaded to internal TestFlight testing and installed, but **must not be submitted for App Review**. Its push delivery and tap-to-Notifications route passed; old links to deleted events failed. Ester then approved uploading replacement build `14`, reported it installed from TestFlight, and confirmed both previously failing deleted-event cards show the unavailable page; the link back to Notifications also works. No App Review submission or public release occurred.

| Platform | Replacement file | SHA-256 | State |
| --- | --- | --- | --- |
| iOS | `.private/native-hotfix/klavhub-ios-1.2.5-14-e91160c-export/App.ipa` | `242be1e0efc38764a9d944c923e9ad6b267225272c8d63e43e21bcb89e99a111` | Distribution signed and verified; `com.klavhub`, `1.2.5 (14)`; Ester reports TestFlight installation and focused retest passed |
| Android | `.private/native-hotfix/klavhub-android-1.0.10-12-e91160c-signed.aab` | `a6c897d46682e23a5901f7191f893b8db58e18f6391f7bc9d198ae2d932d10a2` | Signed in Android Studio and locally verified; `com.klavhub`, `1.0.10 (12)`, target API 36, minimum API 23; **Play rejected the Production draft upload** |

The replacement IPA passed strict code-signature verification with an Apple Distribution identity, production push entitlement, `get-task-allow=false`, and a store provisioning profile valid through 2027-08-15. Both new artifacts contain the production backend and 188 web files matching the new production build byte for byte. Android Studio signed the replacement bundle on 2026-11-14: `jarsigner -verify` passed, the certificate SHA-256 matches the previously signed bundle (`4B:3D:17:44:8B:8C:D9:67:3E:A4:CA:76:76:59:DA:37:11:35:FB:AF:52:30:66:E5:E2:4F:68:82:FE:96:D5:BF`), and all 1,185 non-signature entries match the verified unsigned replacement bundle byte for byte. The usual self-signed certificate, timestamp, and JAR reader warnings remain. `npm run lint`, `npm run build`, all 121 tests, `git diff --check`, Capacitor sync, iOS archive/export, and Android release builds passed. No dependencies were upgraded.

**Apple next:** Build `1.2.5 (14)` is in TestFlight by Ester's report. The two previously failing deleted-event cards and return link passed there. The direct push test, live event, and friend card passed on build `13`; the changed build `14` code is limited to event lookup and the unavailable page. Confirm build `14` is selected for the `1.2.5` App Store version, review metadata and private review credentials, and seek separate approval before App Review submission. No App Review submission or public release has occurred. Do not select superseded build `13`.

**Google blocker and next:** Ester attempted to upload the signed `1.0.10 (12)` AAB to a Play Production draft. Play rejected it before acceptance: “Play automatic protection requires a minimum SDK version of 24 or higher. The uploaded App Bundle has a minimum SDK version of 23.” The source setting is `android/variables.gradle` (`minSdkVersion = 23`); `android/app/build.gradle` reads it. No Android bundle has been accepted for this release, and no rollout occurred. Decide whether to raise the minimum to API 24 (which drops API 23 device support) or turn off automatic protection for this release in Play Console if available. Google [requires API 24 for automatic protection](https://support.google.com/googleplay/android-developer/answer/10183279) and [documents a per-release off switch](https://support.google.com/googleplay/android-developer/answer/10183279), but advises against promoting unprotected builds to production. Check Play's affected-device/user information and the current highest accepted versionCode before choosing. If raising the minimum, change only the Android minimum, build and sign a new bundle with a valid higher versionCode if Play consumed `12`, verify its manifest, certificate, contents and hash, then retry the Production draft upload. Do not retry the unchanged rejected AAB. Ester chose to skip Android internal testing; Android store-delivered behavior will remain untested unless that decision changes. Stop before starting any Production rollout.

Production read-only counts found 10 of 11 event notification targets deleted; four of five event cards for the TestFlight test account point to deleted events. Live event and friend-card navigation passed on build `13`; all friend notification sender profiles exist. The production event RPC raises `42501`/`insufficient_privilege` for deleted events before its not-found branch. The source fix maps that known error and `P0002` to the unavailable page while preserving unexpected errors and live/canceled events.

## Superseded build 13 preparation record

Prepared 2026-11-14 from clean `main` at `2559bc9`. This packet covers the security and maintenance release from source `c1f9188`; it does not authorize an upload, submission, publication, or production database change. The three commits after `c1f9188` on `main` change documentation only.

## Exact release files

| Platform | File | SHA-256 | App identity |
| --- | --- | --- | --- |
| iOS | `.private/native-hotfix/klavhub-ios-1.2.5-13-c1f9188-export/App.ipa` | `4550dd6277844d20c9a0882f0eeb0c3d701927ba97f29ff208b8715eb0769c1d` | `com.klavhub`, `1.2.5 (13)` |
| Android | `.private/native-hotfix/klavhub-android-1.0.10-12-c1f9188-signed.aab` | `6b4a64e98786bf76ae3c7b2afda5ffc7adc6edfe0e84c917821136faca393926` | `com.klavhub`, `1.0.10 (12)`, target API 36 |

Recheck the hashes immediately before selecting files for upload. Do not use the older SPM IPA, staging IPA, unsigned AAB, or `android/app/release/app-release.aab` by path alone. The signed AAB above is the specifically verified copy.

### Local evidence checked on 2026-11-14

- The iOS IPA's bundle metadata reports `com.klavhub`, `1.2.5 (13)`. `codesign --verify --deep --strict` passed with the Mac signing trust store. Its application identifier is `99MX7U73CT.com.klavhub`; the production push entitlement is present and `get-task-allow` is false. Its embedded store provisioning profile expires 2027-08-15. The iOS project resolves Capacitor Swift `7.6.10` and Firebase Apple SDK `11.15.0` through Swift Package Manager.
- `jarsigner -verify` passed for the Android AAB. `jarsigner -verify -strict` exits with warnings because the upload certificate is self-signed and the JAR has timestamp/reader warnings; it did not report changed signed content. Its signer SHA-256 is `4B:3D:17:44:8B:8C:D9:67:3E:A4:CA:76:76:59:DA:37:11:35:FB:AF:52:30:66:E5:E2:4F:68:82:FE:96:D5:BF`. All 1,185 non-signature ZIP entries match the fresh unsigned AAB. The signer matches older locally signed bundles; Ester confirmed the previous Play release used the same signing process and elected to rely on Play's upload-key validation instead of a separate fingerprint lookup.
- Both artifacts contain the production Supabase reference and no staging reference. The 188 comparable bundled web files in each match the local production `dist` byte for byte; the other two are native Cordova shim files. The Android bundle manifest contains the package and notification, camera, and fine/coarse-location permission names. Its matching release APK and source declare versionCode 12 and target API 36. Play Console must still validate the uploaded AAB's displayed metadata.
- Ester reported that iOS `1.2.4 (12)` and Android versionCode 11 were the highest previously uploaded builds. This has not been independently read from either store account. The local `npm audit` still reports 15 findings (0 critical, 6 high, 8 moderate, 1 low); no packages were upgraded for this release.

## Store testing sequence, after separate upload approval

1. **Before uploading:** confirm the current highest uploaded build in each console is still below `13` and `12`, respectively. If another upload has appeared, stop and rebuild with higher identifiers. Recheck both file hashes. Confirm that the store accounts have no blocking agreements, policy tasks, or outstanding releases. Neither local signing nor the previous console report proves current account state.
2. **iOS:** upload the exact IPA to App Store Connect using Xcode or Transporter; wait until build `1.2.5 (13)` finishes processing. Add it to an internal TestFlight group and install that store-delivered build on the iPhone. Do not mark this upload as a public release. TestFlight installation may replace the same-bundle-ID staging app, so finish any staging-only checks first. [Apple upload guidance](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/) · [Internal TestFlight groups](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers)
3. **Android:** upload the exact signed AAB to an internal testing release, confirm Play accepts its upload key and displays package `com.klavhub`, versionCode `12`, and target API 36. Add the intended tester account, make the internal release available, and install it from Google Play on an Android device. An internal track is visible only to eligible testers, not the public. [Google release guide](https://support.google.com/googleplay/android-developer/answer/9859348) · [Internal testing](https://support.google.com/googleplay/android-developer/answer/9845334)
4. **Store-delivered smoke checks on each platform:** confirm the installed version/build in the app or device settings; sign in and out with a designated account; open profile, a solo dog, and parks; view and change a dog photo with a test dog; check camera, notification permission, a delivered push, and notification opening on the iPhone. Check the unavailable ownership link and a canceled-event link on the iPhone; the latter has only an automated route result so far. Record pass/fail and the installed build. Avoid account deletion and changes to a personal dog. The direct FCM tests already passed on the staging iPhone build, but they do not prove a store-installed production build or the app's outbound notification pipeline.
5. **Only after store-delivered testing passes:** prepare iOS version `1.2.5`, select build `13`, enter the localized notes below, review export compliance, App Privacy, screenshots/metadata, and private review credentials. Give App Review a working review account and note that shared ownership is not enabled. Choose manual release if the go-live moment needs control; submit for review after approval for that action. [Create version](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version) · [Choose build](https://developer.apple.com/help/app-store-connect/manage-builds/choose-a-build-to-submit) · [Submit](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/) · [Manual release](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option/)
6. **Android production:** prepare the production release from the accepted build, review its App content and location declarations, enter localized notes, choose the rollout setting, and submit/start rollout only after approval for that action. Confirm review status, public availability, rollout percentage, and the first installed production build separately. Google currently requires target API 36 for mobile app updates. [Google release guide](https://support.google.com/googleplay/android-developer/answer/9859348) · [Target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878)

## Copy for store fields

| Language | What's New / release notes |
| --- | --- |
| English | Security and stability improvements. |
| Hebrew | שיפורי אבטחה ויציבות. |
| Arabic | تحسينات في الأمان والاستقرار. |

**TestFlight “What to Test”:** Check sign-in, parks, solo-dog photos and camera, notification delivery and opening, and unavailable-link handling. Report the installed build and any failure. This build connects to production.

**App Review note:** KlavHub currently offers parks, profile, and solo-dog management. Shared dog ownership is server-gated and is not enabled in this release. Use the private review credentials supplied in App Store Connect to inspect the available flows. Do not put credentials in this repository.

## Release record to fill after account/device actions

| Gate | iOS | Android |
| --- | --- | --- |
| Console highest uploaded build rechecked | Pending | Pending |
| Upload approved and accepted | Pending | Pending |
| Test track and store-delivered installation | Pending | Pending |
| Installed build and smoke result | Pending | Pending |
| Review submission / approval | Pending | Pending |
| Public release and first installed public build | Pending | Pending |

Record timestamps, exact release notes, track, rollout percentage, console status, and any rejection or warning when each gate changes. Continue the old-client overlap described in [the release sequence](MULTI_OWNER_NEXT_STEPS.md); this hotfix does not authorize ownership migrations or enablement.
