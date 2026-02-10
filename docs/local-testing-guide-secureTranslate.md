## Connecting Android/iOS Devices to the Firestore Emulator

When running your app on a real Android or iOS device (e.g., with `ionic cap run android --external -l`), connecting to the Firestore emulator requires special handling. On a device, `localhost` refers to the device itself, not your computer where the emulator is running.

### Why This Matters

- Browsers on your computer can use `localhost` to access the emulator.
- Real devices need to use your computer's local network IP address to connect to the emulator.

### How to Find Your Computer's IP Address

On Windows, run `ipconfig` in a terminal. Look for your active network adapter (e.g., Ethernet or Wi-Fi) and find the `IPv4-Adresse` (or `IPv4 Address`). Example:

```
Ethernet-Adapter Ethernet:
   Verbindungsspezifisches DNS-Suffix: home
   Verbindungslokale IPv6-Adresse  . : fe80::1357:c14e:ccf5:8d16%11
   IPv4-Adresse  . . . . . . . . . . : 10.0.0.68
   Subnetzmaske  . . . . . . . . . . : 255.255.255.0
   Standardgateway . . . . . . . . . : 10.0.0.138
```

In this example, your computer's IP address is **10.0.0.68**.

### Update Your Emulator Connection Code

In your Firestore emulator connection code (e.g., in `app.config.ts`), use your computer's IP address instead of `localhost` when running on a device:

```typescript
const emulatorHost = window.location.hostname === "localhost" ? "localhost" : "10.0.0.68"; // Replace with your computer's IP address
connectFirestoreEmulator(firestore, emulatorHost, 8080);
```

You can make this dynamic by using an environment variable or a platform check.

### Important: Emulator Host Setting for Mobile Devices

**If you want to access the Firestore or Functions emulator from a real Android/iOS device (e.g., with `ionic cap run android --external -l`), you must set the emulator host to `0.0.0.0` in your `firebase.json`.**

By default, the emulator uses `127.0.0.1` (localhost), which is only accessible from your computer. Setting it to `0.0.0.0` makes it accessible from other devices on your network, such as your phone using your computer's IP (e.g., `10.0.0.68`).

Example `firebase.json`:

```json
{
  "emulators": {
    "functions": {
      "host": "0.0.0.0",
      "port": 5001
    },
    "firestore": {
      "host": "0.0.0.0",
      "port": 8080
    }
    // ...
  }
}
```

---

### Additional Tips

- Ensure your device and computer are on the same WiFi or LAN network.
- Make sure your firewall allows incoming connections to port 8080.
- Restart your app after making changes.

### Summary

- Browsers can use `localhost`, but real devices must use your computer's IP address to connect to the emulator.
- Update your emulator connection code for Android/iOS testing.

# Local Testing Guide: SecureTranslate with Firebase Emulator Suite

This guide describes how to test the SecureTranslate Cloud Function locally using the Firebase Emulator Suite, with environment variables loaded via dotenv for consistency with your landing-page app.

---

## Prerequisites

- Node.js (v20+ recommended)
- Java 11+ installed
- Firebase CLI installed (`npm install -g firebase-tools` or `volta install firebase-tools`)
- `.env.local` file in your project root with a valid Google Translate API key:

  ```text
  GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
  ```

- To enable Firestore emulator support in your app, add the following code to your Firebase config (e.g., in app.config.ts):

```typescript
provideFirestore(() => {
  const firestore = getFirestore();
  if (globalThis.location.hostname === 'localhost' && environment.app.useFirebaseEmulator) {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  }
  return firestore;
}),
```

- This will connect your app to the Firestore emulator when running locally and useFirebaseEmulator is true in your environment config.

---

## Emulator Setup: firebase.json and Rules

Before you can start the Firebase Emulator Suite, you must have a valid `firebase.json` (and optionally `firestore.rules`) in your project root. If these files are missing, follow these steps:

### 1. Initialize Emulator Config

From your project root (where your `src/` and `functions/` folders are):

```bash
firebase init emulators
```

- When prompted, select your existing Firebase project (e.g., `z-control-4070`). This ensures your emulator setup matches your landing-page app and uses the same project configuration for local testing.
- Select **Functions Emulator** (space to select)
- Select **Firestore Emulator** (optional, for DB)
- (You can select other emulators as needed)
- Accept default ports or set your own
- When prompted for language, choose **TypeScript**
- When prompted, **DO NOT overwrite your existing functions code** (choose 'No' if asked to overwrite)

This will create a `firebase.json` and (if selected) a `firestore.rules` file in your project root.

### 2. Verify Emulator Config

- Ensure `firebase.json` exists in your project root.
- If using Firestore, ensure `firestore.rules` exists as well.

### 3. Start the Emulator

From your project root:

```bash
firebase emulators:start --inspect-functions=9229
```

If you see `Error: Not in a Firebase app directory (could not locate firebase.json)`, make sure you are in the folder containing `firebase.json`.

---

## Steps

### 1. Install Dependencies

```bash
cd functions
npm install
npm install dotenv
```

### 2. Configure Environment Variables

- Ensure `.env.local` is in your project root (same level as functions/).
- Use LF line endings and no quotes or comments.

### 3. Update Function Code to Load `.env.local`

At the top of your function file (e.g., `secureTranslate.ts`):

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
```

### 4. Build Functions

```bash
cd functions
npm run build
```

### 5. Start the Emulator Suite

```bash
firebase emulators:start
```

### 6. Trigger the Function

- Use the callable endpoint for manual testing:

  ```bash
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/secureTranslate
  ```

- **Request Body Example (POST):**

  ```json
  {
    "data": {
      "text": "Hello",
      "baseLang": "en",
      "selectedLanguages": ["de", "fr"]
    },
    "auth": {
      "uid": "test-user-uid"
    }
  }
  ```

- **Example curl command:**

  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"data":{"text":"Hello","baseLang":"en","selectedLanguages":["de","fr"]},"auth":{"uid":"test-user-uid"}}' \
    http://localhost:5001/YOUR_PROJECT_ID/us-central1/secureTranslate
  ```

### 7. View Firestore Data (if used)

- Open [http://localhost:4000/firestore](http://localhost:4000/firestore)
- Check relevant collections for new documents.

**Summary:**

- The SecureTranslate function can be tested locally with the emulator and environment variables loaded via dotenv, matching your landing-page workflow.
- Logging and error handling work both locally and after deployment.

---

## Troubleshooting

- **Internal Server Error:** Check logs for missing environment variables or API errors.
- **No Data in Emulator UI:** Ensure Firestore writes use `new Date().toISOString()` for timestamps.
- **Port Conflicts:** Use `netstat -ano | findstr :8080` and `taskkill /PID <PID> /F` to free ports.
- **Environment Variables Not Loaded:** Check `.env.local` formatting and encoding (UTF-8, LF).

---

## Debugging Firebase Functions (VS Code + Emulator)

### 1. Running the App with Emulator or Production Firestore

You can control whether your app uses the Firestore emulator or the production database by setting the `useFirebaseEmulator` property in your environment files.

- **To use the emulator:**
  - Set `useFirebaseEmulator: true` in your environment `.env.local`.
  - Run `npm run generate-env` to update your environment files.
  - **Start your app locally first** (e.g., with `ionic serve` or your preferred method). The app must be running before starting the emulator, otherwise the emulator cannot start because it relies on environment values from the running app.
  - Once your app is running, start the Firebase Emulator Suite as described next.
  - The app will connect to the emulator, and all Firestore reads/writes will use the local database.

- **To use production Firestore:**
  - Set `useFirebaseEmulator: false` in your environment `.env.local`.
  - Run npm generate-env to update your environment files.
  - Run your app as usual.
  - The app will connect to the live Firestore database in the cloud.

This makes it easy to switch between local development/testing and production by changing a single environment variable.

### 2. Debugging in the Emulator

You can debug your Firebase Functions running in the emulator and set breakpoints in your TypeScript/JavaScript code using VS Code.

#### 1. Start the Emulator in Debug Mode

Stop any running emulator process. Then start the emulator with debugging enabled (use a free port, e.g., 9229):

```sh
firebase emulators:start --inspect-functions=9229
```

You should see a line like:

```
Debugger listening on ws://127.0.0.1:9229/...
```

#### 2. Add a VS Code Debug Configuration

Create or update `.vscode/launch.json` in your project root with:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Firebase Functions Emulator",
      "port": 9229,
      "restart": true
    }
  ]
}
```

Make sure the `port` matches the one you used above.

#### 3. Set Breakpoints

- Open your TypeScript file (e.g., `secureTranslate.ts`) in VS Code.
- Set breakpoints where you want to pause execution (e.g., inside your function handler).

#### 4. Start Debugging

- In VS Code, go to the Run & Debug panel.
- Select **Attach to Firebase Functions Emulator** and click the green play button.
- You should see "Connected" in the debug console.

#### 5. Trigger Your Function

- Use your browser or `curl` to call your function, e.g.:
  ```
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/secureTranslate
  ```
- The emulator will hit your breakpoints and VS Code will pause execution, allowing you to inspect variables, step through code, etc.

### 6. Notes

- If you use TypeScript, make sure `"sourceMap": true` is set in your `tsconfig.json` and your code is built (`npm run build` or `tsc --watch`).
- If you see "breakpoints ignored because generated code not found," check that your `outDir` and `sourceMap` settings are correct and that VS Code is opening the built files with source maps.

---

**Maintained by:** Hans Zöchbauer  
**Last Updated:** February 5, 2026
