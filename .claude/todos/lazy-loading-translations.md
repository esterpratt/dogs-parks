# Implement Lazy Loading for Translations

## Problem
Currently, all translation files (en.json: 44KB, he.json: 52KB, ar.json: 52KB = ~148KB total) are loaded upfront in the main bundle, even though users typically only need one language.

## Solution
Implement lazy loading for translations using i18next-http-backend, which is already installed. This will:
- Load only the selected language on app startup
- Dynamically load other languages when users switch languages
- Reduce initial bundle size by ~100KB (2/3 of translation data)

## Todo Items

- [x] Move translation JSON files to public/locales directory structure
- [x] Update i18n configuration to use i18next-http-backend
- [x] Update i18n to support dynamic language loading
- [x] Test language loading and switching functionality
- [x] Verify bundle size reduction

## Review

### Summary
Successfully implemented lazy loading for translations using i18next-http-backend. Translations are now loaded dynamically on-demand instead of being bundled with the application.

### Changes Made

1. **Moved translation files to public directory** ([public/locales/](public/locales/))
   - Created [public/locales/en/translation.json](public/locales/en/translation.json)
   - Created [public/locales/he/translation.json](public/locales/he/translation.json)
   - Created [public/locales/ar/translation.json](public/locales/ar/translation.json)
   - Removed old [src/i18n/locales/](src/i18n/locales/) directory (no longer needed)

2. **Updated i18n configuration** ([src/i18n/index.ts:1-46](src/i18n/index.ts#L1-L46))
   - Removed static imports of translation JSON files
   - Added `HttpBackend` from `i18next-http-backend` package
   - Configured backend with loadPath: `/locales/{{lng}}/{{ns}}.json`
   - Removed `resources` export (no longer needed)

### Benefits

1. **Reduced Initial Bundle Size**: ~148KB of translation data no longer bundled
2. **On-Demand Loading**: Only the selected language is loaded on app startup
3. **Dynamic Language Switching**: Other languages load automatically when user switches
4. **Better Caching**: Translation files can be cached separately by the browser
5. **Cleaner Code**: No need to import/bundle JSON files in source code

### Technical Details

- Uses existing `i18next-http-backend` package (already installed)
- Translations served from `/locales/{language}/translation.json` endpoint
- No changes required to components using translations
- Build verified successfully with no TypeScript errors
- Dev server tested - all languages load correctly

### Impact

- **Bundle size**: Translation data excluded from main bundle (~148KB raw / ~50KB gzipped removed)
- **Network**: Users now load 1 translation file (~42-52KB) instead of all 3 bundled
- **Performance**: Faster initial load, translations cached separately
