# Firebase Functions Unit Test Setup (Vitest)

## Purpose

This document describes the current backend unit test setup for Firebase Functions in this repository.

It records:

- what was installed
- what was configured
- which files were created or changed
- how to run tests
- how to extend the setup safely

When the function test system changes later, update this document accordingly.

## Scope

This setup applies to:

- `functions/`

Frontend tests are separate and continue to use Jasmine and Karma.

## Installed packages

In `functions/package.json`, the following were added as development dependencies:

- `vitest` — test runner
- `@vitest/coverage-istanbul` — coverage provider with accurate TypeScript source mapping
- `@vitest/ui` — browser-based test dashboard

Install commands used:

```bash
cd functions
npm install
npm install -D @vitest/coverage-istanbul
npm install -D @vitest/ui
```

### Why istanbul over v8

V8 instruments at bytecode level and can misreport source positions after TypeScript transpilation.
Istanbul instruments at source level, giving accurate line and branch highlighting in HTML reports.

## Installation workflow used (and alternatives)

Two common npm workflows are valid:

1. CLI-first (most common in daily local work)

```bash
npm install -D vitest
```

This updates `package.json` and the lockfile automatically.

2. Manifest-first (used in this setup)

- Update `package.json` first (dependencies and scripts)
- Then run:

```bash
npm install
```

Why manifest-first was used here:

- It keeps config changes explicit in one patch (scripts + dependency together).
- It fits automation/agent workflows where multiple related changes are staged before a single install.
- The final result is the same after install: dependency is installed and lockfile is synced.

Important:

- Both workflows are correct.
- Always commit both manifest and lockfile changes together.

## Package scripts added

In `functions/package.json`, these scripts were added:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui",
"test:ui:coverage": "vitest --ui --coverage",
"test:learn": "vitest run --config vitest.learn.config.ts",
"test:learn:watch": "vitest --config vitest.learn.config.ts",
"test:coverage": "vitest run --coverage"
```

### Script reference

| Script             | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `test`             | Run all tests once, terminal output only           |
| `test:watch`       | Re-run tests on file save, terminal output         |
| `test:ui`          | Browser dashboard, re-runs on file save            |
| `test:ui:coverage` | Browser dashboard + coverage highlighting          |
| `test:learn`       | Run only `learning-vitest` specs once              |
| `test:learn:watch` | Re-run only `learning-vitest` specs on save        |
| `test:coverage`    | Run all tests once + generate HTML coverage report |

### Practical daily use

- **While developing:** `npm run test:ui` — browser watch mode with live results
- **Before committing:** `npm run test:coverage` — full coverage report at `functions/coverage/index.html`
- **Learning specs only:** `npm run test:learn`

## Config file added

A Vitest config was added:

- `functions/vitest.config.ts`
- `functions/vitest.learn.config.ts`

Current config:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    exclude: ["src/learning-vitest/**"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});
```

Notes:

- `environment: 'node'` is required for backend function tests.
- Tests are discovered under `functions/src/**/*.spec.ts`.
- Learning tests are excluded from the default test run.
- `provider: 'istanbul'` gives accurate TypeScript line/branch mapping in the HTML report.
- Coverage output goes to `functions/coverage/` (ignored by git via `coverage/` in `.gitignore`).

Learning config:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/learning-vitest/**/*.spec.ts"],
  },
});
```

Learning test folder:

- `functions/src/learning-vitest/`

Purpose:

- Keep tutorial experiments separate from app-focused backend tests.
- Prevent tutorial tests from affecting CI or normal test runs.

## First baseline test added

A first working unit test file was created:

- `functions/src/firebase-firestore-utils.service.spec.ts`

What it currently validates:

- `FirebaseFirestoreUtilsService.isDeepEqual` returns true for equal objects with different key order
- `FirebaseFirestoreUtilsService.isDeepEqual` returns false for nested value differences

This baseline confirms:

- Vitest setup works
- TypeScript + ESM import style works
- Test discovery works

## Verified execution

Test command executed successfully:

```bash
cd functions
npm test
```

Result at setup time:

- test files: 1 passed
- tests: 2 passed

## How to add new function tests

1. Create new spec files under `functions/src` with pattern `*.spec.ts`.
2. Use Vitest APIs:

```ts
import { describe, it, expect, vi } from "vitest";
```

3. Mock external dependencies (Firestore, fetch, secrets, Firebase SDK wrappers) to keep tests deterministic.
4. Run:

```bash
npm test
```

## Recommended test priority (backend)

1. `firebase-firestore-utils.service.ts`

- contingent limit branches
- `validateContingentOrThrow`
- deep equality helper

2. Callable validators and delegation

- `add-user.ts`
- `create-missing-contingent-data.ts`

3. Translation flow

- `secure-translate.ts`
- validation + contingent check + usage update + fetch behavior

## Troubleshooting

### No tests found

Check:

- file name ends with `.spec.ts`
- file is under `functions/src`
- `vitest.config.ts` include pattern

### ESM import errors

Check:

- `functions/package.json` has `"type": "module"`
- imports use project-compatible ESM paths

### Backend dependencies causing flaky tests

Prefer mocking instead of calling real services:

- Firestore reads/writes
- network fetch
- runtime secrets

## Maintenance rule

If backend test tooling or configuration changes (scripts, config, runner, discovery path, test style), update this file in the same change set.
