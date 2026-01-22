# Environment files / Firebase config

Purpose
- Keep real Firebase credentials out of source control while allowing builds to inject them.

```typescript
export const environment = {
  production: __PRODUCTION__,
  firebase: {
    apiKey: '__FIREBASE_API_KEY__',
    authDomain: '__FIREBASE_AUTH_DOMAIN__',
    projectId: '__FIREBASE_PROJECT_ID__',
    storageBucket: '__FIREBASE_STORAGE_BUCKET__',
    messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
    appId: '__FIREBASE_APP_ID__',
    measurementId: '__FIREBASE_MEASUREMENT_ID__',
  },
};
```

How it works
- scripts/generate-env.js reads values from process.env or from a local `.env.local` file and writes:
  - `src/environments/environment.ts`
  - `src/environments/environment.prod.ts`
- If `src/index.html` contains the placeholder `__FIREBASE_MEASUREMENT_ID__`, the script will replace it with the value from `FIREBASE_MEASUREMENT_ID`.

Local setup (example .env.local)
Create a `.env.local` in the project root (do NOT commit it, values from firebase projec/settings):

```typescript
FIREBASE_API_KEY="AIza..."
FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="1234567890"
FIREBASE_APP_ID="1:...:web:..."
FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
```

Usage
- Local:
  npm install
  npm run generate-env
  npm run start

- CI:
  Configure pipeline secrets as environment variables, run `node scripts/generate-env.js` before build.

Security notes
- Firebase web config values (apiKey, projectId, measurementId) are not secret by design but avoid exposing any service account keys or server credentials in the repo.
- Use Firebase security rules, App Check and restrict APIs as needed.