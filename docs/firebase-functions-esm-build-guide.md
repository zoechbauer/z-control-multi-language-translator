

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

## Deploying Your Cloud Function to Firebase

To deploy your Cloud Function to Firebase, follow these steps:

1. **Ensure you are in the project root directory** (the folder containing `firebase.json`).

2. **Build your functions** (if using TypeScript or ESM):

```sh
cd functions
npm run build
cd ..
```

3. **Deploy your functions to Firebase:**

- From the project root, run:
  ```sh
  firebase deploy --only functions
  ```

4. **Verify deployment:**

- Go to the [Firebase Console > Functions](https://console.firebase.google.com/) and check that your new function(s) appear in the list.
- You will see the function name, region, and endpoint URL.

**Notes:**

- Only functions defined in your `functions/src` (and exported in `functions/src/index.ts`) will be deployed.
- Existing functions with the same name will be updated; new functions will be added.
- Make sure your `.env.local` and any required environment variables are set up before deploying if your function depends on them.

---

## Managing API Keys and Secrets with Firebase Secret Manager

### a) Enter or Manage Secrets

- Go to: https://console.cloud.google.com/security/secret-manager
- Click "Create Secret" to add a new secret (e.g., `GOOGLE_TRANSLATE_API_KEY`).
- You can update, rotate, or delete secrets from this interface.

### b) Access Secrets in Cloud Functions

1. **Import and define the secret in your function code:**

```typescript
import { defineSecret } from "firebase-functions/params";
const GOOGLE_TRANSLATE_API_KEY = defineSecret("GOOGLE_TRANSLATE_API_KEY");
```

2. **Declare the secret in your function definition:**

```typescript
export const secureTranslate = onCall({ secrets: [GOOGLE_TRANSLATE_API_KEY] }, async (request) => {
  /* ... */
});
```

3. **Access the secret value in your function handler:**

```typescript
const apiKey = GOOGLE_TRANSLATE_API_KEY.value() || process.env.GOOGLE_TRANSLATE_API_KEY;
if (!apiKey) {
  throw new HttpsError("internal", "Google Translate API key is not set.");
}
```

- When deployed, the secret is injected securely by Firebase.
- For local development/emulator, the code falls back to `process.env.GOOGLE_TRANSLATE_API_KEY` (from `.env.local`).

