# Firebase Functions Unit Test Setup (Vitest)

## Purpose

This document describes the backend unit test setup for Firebase Functions in this repository.

It records:

- Installed packages
- Current configuration
- How to create and run tests

## Scope

Applies to:

- `functions/`

Frontend tests remain separate and continue to use Jasmine + Karma.

## Installed Packages

In `functions/package.json`, the following dev dependencies are used:

- `vitest` for test execution
- `@vitest/coverage-istanbul` for accurate TypeScript coverage mapping
- `@vitest/ui` for the browser test dashboard

Install commands used:

```bash
cd functions
npm install
npm install -D @vitest/coverage-istanbul
npm install -D @vitest/ui
```

### Why Istanbul Instead Of V8

- V8 coverage works at bytecode level and can misalign lines after TypeScript transpilation.
- Istanbul works at source level and produces accurate line and branch highlighting in HTML reports.

## Vitest Installation

Two valid npm workflows:

1. CLI-first (common for day-to-day work)

```bash
npm install -D vitest
```

2. Manifest-first (used in this setup)

- Update `package.json` first (scripts and dependencies)
- Then run:

```bash
npm install
```

## Package Scripts

In `functions/package.json`, these scripts are available:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui",
"test:ui:coverage": "vitest --ui --coverage",
"test:learn": "vitest run --config vitest.learn.config.ts",
"test:learn:watch": "vitest --config vitest.learn.config.ts",
"test:coverage": "vitest run --coverage"
```

### Script Reference

| Script             | Purpose                                |
| ------------------ | -------------------------------------- |
| `test`             | Run all backend tests once in terminal |
| `test:watch`       | Watch mode in terminal                 |
| `test:ui`          | Browser dashboard with watch mode      |
| `test:ui:coverage` | Browser dashboard with live coverage   |
| `test:learn`       | Run only `learning-vitest` tests once  |
| `test:learn:watch` | Watch mode for `learning-vitest` tests |
| `test:coverage`    | Run once and generate coverage report  |

### Recommended Daily Usage

- During development: `npm run test:ui`
- Before commit: `npm run test:coverage`
- Learning-only workflow: `npm run test:learn`

Coverage report location:

- `functions/coverage/index.html`

## Config Files

Vitest uses:

- `functions/vitest.config.ts`
- `functions/vitest.learn.config.ts`
- `functions/src/vitest.setup.ts`

Current main config:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["src/vitest.setup.ts"],
    include: ["src/**/*.spec.ts"],
    exclude: ["src/learning-vitest/**"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/learning-vitest/**"],
    },
  },
});
```

Main config notes:

- `environment: 'node'` is required for backend tests.
- `setupFiles` loads shared test setup before specs run.
- `coverage.include` ensures untested source files appear as `0%`.
- `coverage.exclude` removes specs and learning files from metrics.

Shared setup file:

```ts
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

Shared setup purpose:

- Keep test output quiet by default
- Reset spies and mocks after each test
- Avoid repeating console setup in each spec file

- Important note: Use **console.info** for temporary test debugging. console.log, console.warn, and console.error are mocked by setup to reduce noise, but console.info is intentionally left unmocked.

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

Learning folder:

- `functions/src/learning-vitest/`

Purpose:

- Keep tutorial and exploration specs separate from production backend tests.
- Prevent learning tests from running during normal CI or `npm test` runs.

## Adding Function Tests

1. Create spec files in `functions/src` with `*.spec.ts` naming.
2. Use Vitest APIs:

```ts
import { describe, it, expect, vi } from "vitest";
```

3. Mock external dependencies (Firestore, network, runtime secrets, SDK wrappers).
4. Run `npm test`.

### Mocking Modules: vi.mock() Hoisting

Vitest automatically hoists `vi.mock()` calls to the top of the file before any imports run.
This means `vi.mock()` must always be placed before the imports it affects — even though it looks like it will run after them.

```ts
// ✅ Correct — vi.mock() is hoisted before the import
vi.mock("./firebase-firestore.service.js", () => ({
  FirebaseFirestoreService: vi.fn(),
}));

import { MyClass } from "./my-class.js";
```

Why this matters:

- If you use an arrow function in `mockImplementation()` for a class constructor, `this` will be wrong.
- Use a regular function with `this: any` instead so `new` binds correctly:

```ts
// ✅ Correct — regular function so 'new' binds 'this' to the fresh instance
vi.mocked(FirebaseFirestoreService).mockImplementation(function (this: any) {
  this.myMethod = vi.fn().mockResolvedValue(true);
} as any);

// ❌ Wrong — arrow function does not have its own 'this'
vi.mocked(FirebaseFirestoreService).mockImplementation(() => {
  this.myMethod = vi.fn(); // 'this' is not the new instance
});
```

## Troubleshooting

### No Tests Found

Check:

- File name ends with `.spec.ts`
- File is under `functions/src`
- `vitest.config.ts` include pattern

### ESM Import Errors

Check:

- `functions/package.json` contains `"type": "module"`
- Imports use ESM-compatible paths

### Flaky Backend Tests

Prefer mocks instead of calling real services:

- Firestore reads/writes
- Network fetch
- Runtime secrets
