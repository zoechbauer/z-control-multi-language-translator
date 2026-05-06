# Function Tests Plan

## Goal

Add focused automated tests for Firebase Functions to protect authentication, validation, contingent logic, and translation flow.

## Test framework and setup

Planned framework:

- Vitest for backend unit tests

Planned structure:

- Place test files next to source files under functions/src
- Use file naming pattern: \*.spec.ts

Planned test scripts in functions/package.json:

- test
- test:watch

## Scope and priorities

### Priority 1: Utility and service logic

Target file:

- functions/src/firebase-firestore-utils.service.ts

What we test:

- StopTranslationForAllUsers short-circuit
- Total contingent exceeded branch
- User contingent exceeded branch
- Missing contingent limits or buffer behavior
- validateContingentOrThrow when contingent data exists
- validateContingentOrThrow when contingent data is missing and must be created
- validateContingentOrThrow throws resource-exhausted when exceeded
- isDeepEqual behavior with different property order and nested structures

How we test:

- Mock FirebaseFirestoreService methods:
  - readContingentData
  - createMissingContingentData
  - getCharCountForUser
  - getTotalCharCount
- Assert boolean outcomes and thrown HttpsError codes

### Priority 2: Callable function validation and delegation

Target files:

- functions/src/add-user.ts
- functions/src/create-missing-contingent-data.ts

What we test (both callables):

- Unauthenticated request returns unauthenticated
- Invalid argument payload returns invalid-argument
- Success path calls FirebaseFirestoreService with correct arguments
- Internal service failure returns internal error

How we test:

- Mock FirebaseFirestoreService constructor and instance methods
- Build minimal mock request objects with auth and data
- Assert returned success payload and thrown HttpsError details

### Priority 3: secure-translate flow

Target file:

- functions/src/secure-translate.ts

What we test:

- Missing required request fields returns invalid-argument
- Missing auth returns unauthenticated
- contingent validation failure is propagated
- addTranslatedChars is called with calculated char count and selected languages
- Translation API non-ok response maps to internal error
- Success path returns translation map for all selected target languages

How we test:

- Mock FirebaseFirestoreUtilsService.validateContingentOrThrow
- Mock FirebaseFirestoreService.addTranslatedChars
- Mock global fetch for translation calls
- Provide deterministic input for text, base language, and target languages

## Optional integration layer

Goal:

- Keep integration tests minimal and high-value

Planned integration checks:

- One emulator smoke test for callable invocation and basic Firestore write shape
- No full branch duplication at integration level

## Expected outcome

- Strong regression protection for auth, validation, contingent checks, and translation flow
- Fast and deterministic backend test suite
- Clear separation between unit tests and minimal integration coverage

## Implementation order

1. Add Vitest configuration and test scripts
2. Implement utility/service tests
3. Implement callable validation tests
4. Implement secure-translate tests
5. Add optional emulator smoke test
6. Run and stabilize suite in CI
