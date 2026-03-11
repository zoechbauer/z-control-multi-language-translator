# Unit Test Fixing Status

Date: 2026-03-11

## Current state

All previously failing tests are now passing. The focused set of 11 failing tests has been resolved.

## What was fixed in this session

- **tsconfig project references**: Added `"references"` to `tsconfig.json` and `"composite": true` to
  `tsconfig.app.json` and `tsconfig.spec.json` so VS Code correctly routes spec files to the
  Jasmine-typed project. Also widened `tsconfig.spec.json` `include` to `src/**/*.ts` so imported
  app files are within the spec project boundary.

- **TranslateService mock** (all component specs): Extended the mock to include all members required
  by TranslatePipe in ngx-translate v17+:
  - `stream`, `getParsedResult`, `getCurrentLang`, `getDefaultLang`
  - Observable streams with correct event shapes: `onLangChange`, `onTranslationChange`,
    `onDefaultLangChange`, `onFallbackLangChange`
  - Extracted to shared helper `src/app/testing/translate-service.mock.ts` and all specs updated
    to import `createTranslateServiceMock` from there.

- **TabsPage spec**: Added `provideRouter([])` — required because `IonTabs`/`IonTabButton` depend
  on Angular router internals including `ActivatedRoute`.

- **FirebaseFirestoreService spec**: Updated `should call ensureControlFlagsExist on init` test to
  reflect the refactored `init()` which now calls `getIsProgrammerDevice()` instead of
  `getProgrammerDeviceUIDs()`.

- **FirebaseFirestoreUtilsService spec**:
  - Replaced method-spy `isProgrammerDevice` with property mock `isProgrammerDevice: false` using
    the third argument of `jasmine.createSpyObj`.
  - Added `LocalStorageService` mock with `getStatisticsDisplayMode` and `statisticsDisplayMode$`.
  - Removed unneeded `Auth`, `Firestore` providers (were masking the real missing dependency).

- **GetStatisticsComponent spec**:
  - Fixed `isProgrammerDevice` from spy-function to plain boolean property.
  - Added `statisticsDisplayMode$` and `getStatisticsDisplayMode` to `LocalStorageService` mock.

## Definition of done

- ✅ All previously failing tests (11) now pass.
- ✅ No TypeScript compile errors during `ng test` startup.
- ✅ `createTranslateServiceMock()` extracted to shared helper; all specs use the import.
- ⬜ Full unit test suite run to confirm no regressions.
- ⬜ Additional tests to be written for new features (programmer display mode toggle, statistics
  grid target-language count, `getIsProgrammerDevice` callable).

## Next steps

1. Run the full test suite: `npm test -- --watch=false --browsers=ChromeHeadless`
2. Fix any regressions found.
3. Write additional tests for new v1.5 features when ready.