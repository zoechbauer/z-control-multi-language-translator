# Karma Test Runner – Scrolling Fix with `test-runner.scss`

## Problem

When running `npm test`, the Jasmine HTML test results are displayed inside an **iframe** embedded in Karma's runner page. The app's global Ionic styles (`global.scss`) are loaded during tests, which constrain `body` height and overflow, causing the Jasmine report to be cut off — tests are not fully visible without scrolling.

---

## Solution: `src/test-runner.scss`

A dedicated stylesheet overrides the Ionic layout constraints **only for the test runner context**.

### File: `src/test-runner.scss`

```scss
/* Only for Karma/Jasmine browser runner - remove Ionic's height constraints */
html,
body {
  height: 100% !important;
  overflow-y: visible !important;
}

body {
  position: static !important;
  min-height: auto !important;
}

/* Let Jasmine report expand freely */
.jasmine-results {
  height: auto !important;
  overflow: visible !important;
  max-height: none !important;
}
```

### Why this file exists separately

Placing these overrides in `global.scss` would affect the running app in the browser and on mobile. A dedicated file keeps the test-runner fix isolated and avoids side effects.

---

## Registration in `angular.json`

The stylesheet is registered in the `test` architect target only, under `projects.app.architect.test.options.styles`:

```json
"styles": [
  "src/global.scss",
  "src/theme/variables.scss",
  "src/test-runner.scss"
]
```

It is listed **last** so its rules take priority over Ionic's structure CSS.

---

## How Tests Are Displayed

### Normal Karma runner (2 vertical scrollbars)

1. Run `npm test` in the terminal.
2. Chrome opens automatically at `http://localhost:9876`.
3. The test results appear inside an **iframe** (the inner test context).
4. **Two vertical scrollbars** are visible:
   - The **outer** scrollbar belongs to the Karma runner shell (cannot be controlled by `test-runner.scss`).
   - The **inner** scrollbar belongs to the Jasmine report inside the iframe (controlled by `test-runner.scss`).
5. This is the expected behavior and is acceptable for day-to-day use.

### Debug mode (1 vertical scrollbar — recommended for inspecting results)

1. After `npm test`, click the **DEBUG** button in the Karma runner header.
2. A new browser tab opens at `http://localhost:9876/debug.html`.
3. The test suite **runs again** in this new tab. This is normal Karma behavior.
4. The Karma outer shell is absent on this page, so only **one vertical scrollbar** is visible.
5. All specs are listed and fully scrollable.
6. You can click on any describe block or individual test to re-run just that subset.

---

## Summary

| Mode          | URL                                | Scrollbars | Test reruns on open |
| ------------- | ---------------------------------- | ---------- | ------------------- |
| Normal runner | `http://localhost:9876`            | 2          | No                  |
| Debug page    | `http://localhost:9876/debug.html` | 1          | Yes (once)          |
