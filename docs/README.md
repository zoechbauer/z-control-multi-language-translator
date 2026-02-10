# Documentation Overview: Multi Language Translator App

This folder contains categorized guides, troubleshooting steps, and best practices for developing, building, and deploying the Multi Language Translator app using Ionic, Angular, and Capacitor.

## A. Programming

- **todo-list.md**  
  Checklist for updating environment variables and programmer device UIDs, including required steps for Firestore user mapping updates.

- **coding-guidelines.md**  
  Clean code principles and best practices for naming, functions, error handling, formatting, and testing.

   **why-use-runInInjectionContext.md**  
  Explanation of the importance of using `runInInjectionContext` in Angular for proper dependency injection and change detection in asynchronous or external code.

- **standalone-config.md**  
  Guide to using Angular's standalone components and ApplicationConfig for centralized provider management without NgModules.

- **capacitor-8-upgrade-checklist.md**  
  Step-by-step instructions for upgrading from Capacitor 7 to 8, including dependency updates, Gradle configuration, and Kotlin fixes.

- **ionic-capacitor-splash-screens-guide.md**  
  Guide to creating and implementing icons and splash screens using @capacitor/assets, with image requirements and troubleshooting tips.

## B. Installation

- **mobile-installation-guide.md.md**  
  Instructions for installing the app locally on Android devices, including prerequisites, APK building, and troubleshooting installation problems.

## C. Troubleshooting

- **fix-invalid-source-release-21-problem.md**  
  Solution for the "invalid source release: 21" error during Android builds, with steps to force Java 17 compatibility in Gradle.

- **mobile-problem-fixed.md**  
  Documents resolved issues, such as the accordion toggle error and Gradle/Kotlin compatibility fixes for stable mobile deployment.

- **solving-installation-problems-android.md**  
  Troubleshooting guide for the "requestAccordionToggle is not a function" error in production builds, with solutions for build optimization and dependency updates.

- **clean-android-build-step-by-step.md**  
  Detailed guide for performing a clean Android build, including cleaning artifacts, syncing assets, and rebuilding in Android Studio.

## D. Google Translation API

- **google-cloud-translation-api-pricing.md**  
  Overview of Google Cloud Translation API pricing, including the free tier, paid usage, and links to official documentation.

## E. Text to Speech API

- **text-to-speech-integration.md**  
  Guide to adding text-to-speech (TTS) functionality for translated text, using the browser's free Web Speech API. Includes implementation steps, cost considerations, and usage notes.

## F. Google Firebase API

- **firebase-config-enviroment-files.md**  
  Instructions for managing Firebase configuration using environment files to keep credentials out of source control. Includes local setup, usage, and security notes.

- **firebase-functions-esm-build-guide.md**  
  Step-by-step guide for building Firebase Functions with ESM, native fetch, and strict type isolation in a monorepo. Includes troubleshooting for TypeScript and module issues.

- **local-testing-guide-secureTranslate.md**  
  How to test the SecureTranslate Cloud Function locally using the Firebase Emulator Suite and dotenv for environment variables. Includes curl examples, debugging, and troubleshooting steps.

---

### How to Use This Folder

- **Programming:** Start here for code quality, upgrade, and UI asset generation guides.
- **Installation:** Use the installation guide for setting up the app on Android devices.
- **Troubleshooting:** Refer to these documents for resolving build, runtime, and deployment issues.
- **Google Translation API:** Review API pricing before enabling cloud translation features.
- **Text to Speech API:** Follow the TTS integration guide to add speech capabilities.
- **Google Firebase API:** Use the Firebase config guide to manage environment-specific settings securely.

Each document is self-contained and addresses a specific aspect of the app's development or deployment. For further details, open the relevant markdown file in this folder.

---

# Firebase Functions ESM Build Guide

## Problem Context

When building Firebase Functions in an **Ionic/Angular** monorepo structure (where `functions/` sits alongside `src/` and `node_modules/`), TypeScript compilation (`npm run build`) fails due to:

1. **Parent `node_modules/@types`** interference (e.g., `@types/d3-dispatch` syntax errors from root project)
2. **Module system conflicts** with ESM-only packages like `node-fetch` v3 under `NodeNext` module resolution

## Solution: Clean ESM Firebase Functions Setup

### 1. `package.json` - Enable ESM

```json
{
  "name": "functions",
  "type": "module", // ← ADD THIS: Enable ESM
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch"
  },
  "engines": {
    "node": "20" // Native fetch available
  },
  "main": "lib/index.js",
  "dependencies": {
    "@google-cloud/storage": "^7.12.0",
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^7.0.0"
    // NO node-fetch needed (use native fetch)
  }
}
```

### 2. `tsconfig.json` - Strict Local Types + ESM

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "esModuleInterop": true,
    "moduleResolution": "nodenext",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "target": "ES2022", // Native fetch + modern Node
    "skipLibCheck": true, // Skip broken 3rd-party .d.ts
    "typeRoots": [
      // ← CRITICAL: Block parent @types
      "./node_modules/@types"
    ]
  },
  "compileOnSave": true,
  "include": ["src"],
  "exclude": ["lib"]
}
```

### 3. Clean Install & Build

```json
cd functions
rm -rf node_modules package-lock.json
npm install
npm run build  # ✅ Should succeed

```

### 4. Example Function (ESM + Native Fetch)

```typescript
// src/secureTranslate.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

interface SecureTranslateData {
  text: string;
  baseLang: string;
  selectedLanguages: string[];
}

export const secureTranslate = onCall(async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { text, baseLang, selectedLanguages } = data as SecureTranslateData;

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  const results: Record<string, string> = {};
  for (const target of selectedLanguages) {
    const body = { q: text, source: baseLang, target, format: "text" };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new HttpsError("internal", `Translation API error: ${response.statusText}`);
    }

    const respData: any = await response.json();
    results[target] = String(respData.data.translations.translatedText);
  }

  return { translations: results };
});
```

### 5. Key Principles

| Issue                   | Fix                                       | Why                                       |
| ----------------------- | ----------------------------------------- | ----------------------------------------- |
| Parent @types pollution | "typeRoots": ["./node_modules/@types"]    | Blocks ../node_modules/@types/d3-dispatch |
| node-fetch ESM error    | Native fetch() + "type": "module"         | Node 20+ has built-in fetch               |
| Mixed module systems    | "module": "NodeNext" + "target": "ES2022" | Consistent ESM throughout                 |

### 6. Troubleshooting

```text
❌ Still seeing "../node_modules/@types/d3-dispatch"?
→ Verify "typeRoots" is **exactly** `["./node_modules/@types"]`

❌ "fetch is not defined"?
→ Ensure `"type": "module"` in package.json + Node 20 engine

❌ Still using node-fetch?
→ `npm uninstall node-fetch` + use native fetch

```

### 2. Result

```text
Result: ✅ Clean npm run build with zero parent project interference, modern ESM, native Node APIs.

```
