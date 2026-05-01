# Unit Testing Quick Reference

This page is a short command reference for running unit tests in this repository.

Use it when you want the right command quickly without reading a longer testing guide.

## VTOC

- [Quick Matrix (Frontend vs Backend)](#quick-matrix-frontend-vs-backend)
- [List of Commands](#list-of-commands)
- [Detailed Explanations](#detailed-explanations)
- [npm test vs npm run test](#npm-test-vs-npm-run-test)
- [Why the extra -- is needed](#why-the-extra----is-needed)
- [Which Command Should I Use?](#which-command-should-i-use)
- [Functions Vitest Commands](#functions-vitest-commands)
- [Coverage Report Location](#coverage-report-location)
- [Beginner Tips](#beginner-tips)

## Quick Matrix (Frontend vs Backend)

Use this table when you only need the right command fast.

| Goal                            | Frontend (Angular + Karma)                                                   | Backend (Functions + Vitest)                              |
| ------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| Run once (final check)          | `npm test -- --watch=false`                                                  | `npm --prefix functions run test`                         |
| Watch mode                      | `npm test`                                                                   | `cd functions && npm run test:ui`                         |
| Coverage once (final report)    | `npm run test:coverage`                                                      | `npm --prefix functions run test:coverage`                |
| Interactive coverage in browser | N/A (Karma has its own browser runner)                                       | `cd functions && npm run test:ui:coverage`                |
| Single spec run once            | `npm test -- --watch=false --include src/app/services/utils.service.spec.ts` | `cd functions && npx vitest run src/path/to/file.spec.ts` |

## List of Commands

| Command                                                                                      | Short explanation                                                                  |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm test`                                                                                   | Runs all unit tests in watch mode. Karma stays open and reruns after file changes. |
| `npm test -- --watch=false`                                                                  | Runs all unit tests once and then exits.                                           |
| `npm test -- --watch=false --include src/app/services/utils.service.spec.ts`                 | Runs only one spec file once and then stops.                                       |
| `npm test -- --include src/app/services/utils.service.spec.ts`                               | Runs only one spec file in watch mode.                                             |
| `npm run test:coverage`                                                                      | Runs the full test suite once and creates a coverage report.                       |
| `npm test -- --watch=false --code-coverage --include src/app/services/utils.service.spec.ts` | Runs one spec file and also creates a coverage report.                             |
| `npm test -- --watch=false --browsers=ChromeHeadless`                                        | Runs all tests once in headless Chrome without opening a visible browser window.   |
| `npm run test`                                                                               | Same as `npm test` in this repository.                                             |

## Detailed Explanations

### Run all unit tests of the app

```bash
npm test
```

Runs the full unit test suite in watch mode.

Karma usually stays open and reruns tests when files change.

### Run all unit tests once and stop

```bash
npm test -- --watch=false
```

Runs the full unit test suite one time and exits.

Use this when you only want a quick pass/fail result.

### Run all tests of one spec file

Example for `utils.service.spec.ts`:

```bash
npm test -- --watch=false --include src/app/services/utils.service.spec.ts
```

Runs only that one spec file and then stops.

This is usually the best option when you are working on one service or component.

### Run one spec file in watch mode

```bash
npm test -- --include src/app/services/utils.service.spec.ts
```

Runs only that spec file, keeps the process open, and reruns after changes.

Use this while actively writing or fixing tests.

### Run coverage for the whole app

```bash
npm run test:coverage
```

Runs all unit tests once and creates a coverage report.

The HTML report is written to `coverage/app/index.html`.

### Run coverage for one spec file

```bash
npm test -- --watch=false --code-coverage --include src/app/services/utils.service.spec.ts
```

Runs one spec file and still creates a coverage report.

This is useful when you want to check whether your new tests cover the relevant methods.

### Run all tests once in headless Chrome

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

Runs the tests without opening a visible Chrome window.

Use this for CI or when you want a lighter one-time run.

## npm test vs npm run test

In this project, these commands are equivalent:

```bash
npm test
npm run test
```

Why they are the same:

- `npm test` is the shortcut form of `npm run test`
- this repository defines the `test` script as `ng test`

That means both commands end up running the same Angular test command.

## Why the extra -- is needed

Example:

```bash
npm test -- --watch=false --include src/app/services/utils.service.spec.ts
```

The first `--` tells npm to stop reading options for itself and pass the remaining arguments to `ng test`.

Without that separator, npm may try to interpret the flags instead of forwarding them to Angular.

## Which Command Should I Use?

If you want to check whether the whole app still passes:

```bash
npm test -- --watch=false
```

If you are working on one service or one component:

```bash
npm test -- --watch=false --include src/app/services/utils.service.spec.ts
```

If you are actively editing tests and want automatic reruns:

```bash
npm test -- --include src/app/services/utils.service.spec.ts
```

If you want a coverage report for the current state of the app:

```bash
npm run test:coverage
```

## Functions Vitest Commands

For backend tests in `functions`, these two styles are equivalent for package selection:

```bash
npm --prefix functions run test
cd functions
npm run test
```

Both run the `functions` package scripts. The difference is only where you run the command from.

### One-shot runs vs UI watch runs

Use one-shot commands when you want final verification and auto-exit:

```bash
npm --prefix functions run test
npm --prefix functions run test:coverage
```

Use UI commands when you want interactive browser-based feedback while developing:

```bash
cd functions
npm run test:ui
npm run test:ui:coverage
```

Behavior summary:

- `test` and `test:coverage` run once and exit.
- `test:ui` and `test:ui:coverage` keep running in watch mode and update live.
- `test:coverage` is best for final, deterministic coverage output.
- `test:ui:coverage` is best for interactive local debugging.

## Coverage Report Location

Frontend (Angular + Karma) writes HTML coverage to:

```text
coverage/app/index.html
```

Backend Functions (Vitest) writes HTML coverage to:

```text
functions/coverage/index.html
```

Open that file in a browser after the run if you want to inspect covered and uncovered lines.

## Beginner Tips

- Watch mode keeps running until you stop it with `Ctrl + C`.
- If you are debugging a failure, start with one spec file instead of the full suite.
- Use `--watch=false` when you want the terminal command to finish automatically.
- Use `ChromeHeadless` for CI or when you do not want a visible browser window.
- If a test command seems to hang, it is often just watch mode waiting for file changes.
