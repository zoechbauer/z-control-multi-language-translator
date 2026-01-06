# Troubleshooting: Ionic Accordion "requestAccordionToggle is not a function"

## Problem Description

When running the Ionic app in **Production mode** (Android/iOS actual device or `--prod` build), clicking an `ion-accordion` results in a crash or a console error:

```
ERROR TypeError: i.requestAccordionToggle is not a function
    at yt.value.toggleExpanded (main.js:1:195718)
    at HTMLDivElement.onClick (main.js:1:196395)
```

**Symptoms:**
- Works perfectly in the Web Browser (`ionic serve`).
- Works on mobile only when using Live Reload (`-l`).
- Fails on mobile in standard builds or via Android Studio.

---

## Root Cause

This is usually caused by a race condition or aggressive minification. In production builds, the JavaScript is optimized. If the `ion-accordion-group` Web Component has not fully initialized its internal API by the time the `ion-accordion` child component tries to communicate with it, the function `requestAccordionToggle` is missing.

---

## Solutions

### 1. Ensure Correct Standalone Imports

Import Ionic components directly from `@ionic/angular/standalone` in your component files:

```typescript
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonList } from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonList],
  // ...
})
```

#### Do NOT Add `CUSTOM_ELEMENTS_SCHEMA` in Standalone Components

- Standalone components already support Angular and Ionic custom elements when you import them via the `imports` array.
- `CUSTOM_ELEMENTS_SCHEMA` is only needed in NgModules to allow unknown custom elements in templates. In standalone components, Angular’s compiler knows about all imported components, so this schema is unnecessary.
- Adding `schemas` in a standalone component has no effect and is ignored by Angular—it only works in NgModules.
- Using it unnecessarily can hide real template errors and is not recommended in modern Angular with standalone APIs.

**Summary:** With standalone components and proper imports, you do not need `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.

---

### 2. Check and Update Angular Build Optimization

- The `@angular-devkit/build-angular:application` builder (esbuild) does not support old flags.
- Remove deprecated flags like `buildOptimizer`, `aot`, and `progress` from `angular.json`. Use the `optimization` object instead.
- To disable script optimization, set `"scripts": false` in `angular.json` under `production > optimization`.

---

### 3. Update Ionic and Capacitor Packages

Ensure you are on the latest versions where lifecycle synchronization bugs have been patched:

```bash
npm install @ionic/angular@latest @ionic/angular-toolkit@latest @capacitor/core@latest @capacitor/android@latest @capacitor/cli@latest
```

Make sure all Capacitor plugins are on the same major version.

---

### 4. Compare Android Project Settings

Ensure your `android/` folder settings match a working skeleton:

| File                      | Key Setting                                 |
|---------------------------|---------------------------------------------|
| `android/build.gradle`    | `com.android.tools.build:gradle:8.10.1`     |
| `gradle-wrapper.properties`| `distributionUrl=.../gradle-8.11.1-all.zip`|
| `angular.json`            | Use the correct `optimization` settings     |


### 5. Check Angular Optimization (angular.json)

If the error persists, the Angular Build Optimizer might be stripping out necessary code. You can test this by temporarily disabling it in `angular.json`:

1. Open `angular.json`.
2. Navigate to `architect` -> `build` -> `configurations` -> `production`.

- #### Angular.json Property Warnings
   - The `@angular-devkit/build-angular:application` builder (esbuild) does not support old flags.
   - **Fix:** Remove `buildOptimizer`, `aot`, and `progress` from `angular.json`. Use the `optimization` object instead.

- #### Disable Script Optimization
   - Tell the builder not to optimize scripts:
   - In `angular.json` -> `production` -> `optimization`, set `"scripts": false`.
---

### 6. Clean Rebuild Procedure

To ensure no cached "broken" bundles remain, run this sequence after applying the fixes:

1. **Delete old build files:**
   ```bash
   rm -rf www/
   rm -rf android/app/src/main/assets/public
   ```
2. **Rebuild the app and sync to Android:**
   ```bash
   ionic build --prod
   npx cap sync android
   ```
3. **Open Android Studio and clean/rebuild:**
   ```bash
   npx cap open android
   ```
   In Android Studio: Use **Build > Clean Project**, then click **Run**.

4. **Uninstall the app from your device before reinstalling (optional but recommended).**

---

## Troubleshooting

- Double-check that all dependencies are up to date (`npm install`).
- Make sure your `@ionic/angular`, `@capacitor/core`, and all plugins are compatible and on the same major version.
- Check the device logs in Android Studio for additional error details.
- Try running with live reload (`ionic cap run android --external -l`) to see if the problem is only in production builds.

---

## Notes

- This document is for tracking and resolving Android build issues in this project. Add any new problems and solutions here as you encounter them.