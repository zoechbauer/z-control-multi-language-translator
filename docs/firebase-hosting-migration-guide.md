# Firebase Hosting Migration Guide

## Overview

This guide describes how to migrate your z-control Translator app from the old Firebase hosting URL to the new branding-aligned URL.

**Old URL:** `https://z-control-multi-language-translator.web.app/`  
**New URL:** `https://z-control-translator.web.app/`

This migration ensures the Firebase hosting URL matches your new, shorter app name for consistent branding across all platforms.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Update firebase.json](#step-1-update-firebasejson)
- [Step 2: Build for Production](#step-2-build-for-production)
- [Step 2.5: Configure Hosting Target and Site](#step-25-configure-hosting-target-and-site)
- [Step 3: Deploy to New Hosting Target](#step-3-deploy-to-new-hosting-target)
- [Step 4: Verify Deployment](#step-4-verify-deployment)
- [Step 5: Update Documentation](#step-5-update-documentation)
- [Optional: Remove Old Hosting Site](#optional-remove-old-hosting-site)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticated with Firebase: `firebase login`
- Access to your Firebase Console for the project
- All app changes built and ready to deploy

---

## Step 1: Update firebase.json

Update your `firebase.json` configuration file to add the new hosting target. Add the `hosting` section if it doesn't exist:

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
    },
    "ui": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 4000
    },
    "singleProjectMode": true
  },
  "functions": {
    "source": "functions"
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "target": "z-control-translator",
    "public": "www",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Key settings:**

- `"target"`: `"z-control-translator"` - New hosting target name
- `"public"`: `"www"` - Directory containing production build
- `"rewrites"`: Redirects all routes to `index.html` for Ionic SPA routing to work correctly

---

## Step 2: Build for Production

Build your Ionic app for production to generate the `www` folder:

```bash
ionic build --prod
```

---

## Step 2.5: Configure Hosting Target and Site

Before deploying to a new hosting target, run these one-time setup steps.

1. Map the deploy target to the hosting site ID:

```bash
firebase target:apply hosting z-control-translator z-control-translator
```

2. Ensure the hosting site exists in Firebase:

- Firebase Console -> Hosting -> Add site
- Site ID: `z-control-translator`

If the site does not exist yet, deploy returns a 404 error for the site endpoint.

---

## Step 3: Deploy to New Hosting Target

Deploy your app to the new Firebase hosting target:

```bash
firebase deploy --only hosting:z-control-translator
```

This command:

- Uploads your `www/` folder contents to Firebase Hosting
- Creates the new hosting site with URL: `https://z-control-translator.web.app/`
- Initializes the hosting target in your Firebase project

**Expected output:**

```
✓ Deploy complete!

Project Console: https://console.firebase.google.com/project/z-control-4070/overview
Hosting URL: https://z-control-translator.web.app
```

---

## Step 4: Verify Deployment

1. **Open the new URL in your browser:**

   ```
   https://z-control-translator.web.app/
   ```

2. **Test key functionality:**
   - App loads without errors
   - Translation feature works
   - Settings page loads
   - Language switching works (English/German)
   - Help page displays correctly

3. **Check browser console:**
   - Press `F12` to open Developer Tools
   - Check the **Console** tab for any JavaScript errors
   - Check the **Network** tab to ensure all assets load successfully

---

## Step 5: Update Documentation

Update all references to the old Firebase URL throughout your project:

### Files to update:

1. **README.md** - Landing page link

   ```markdown
   - **Web App:**  
     [Run the app online (Firebase Hosting)](https://z-control-translator.web.app/)
   ```

2. **Google-Play-Store-Content.md** - Play Store listing content

   ```markdown
   • Use the web version on any device: z-control-translator.web.app
   • Nutzen Sie die Webversion auf jedem Gerät: z-control-translator.web.app
   ```

3. **get-help.component.html** - In-app help page

   ```html
   <a href="https://z-control-translator.web.app" target="_blank" rel="noopener noreferrer"> https://z-control-translator.web.app </a>
   ```

4. **Other references** - Search your codebase:
   ```bash
   grep -r "z-control-multi-language-translator.web.app" src/ docs/
   ```
   Replace all occurrences with `z-control-translator.web.app`

---

## Optional: Remove Old Hosting Site

If you want to completely remove the old hosting site and avoid confusion:

### Via Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`z-control-4070`)
3. Navigate to **Hosting** in the left sidebar
4. Find the old site: `z-control-multi-language-translator`
5. Click the **⋮** (three-dot menu) on that site
6. Select **Delete**
7. Confirm the deletion

### Via Firebase CLI:

```bash
firebase hosting:sites:delete z-control-multi-language-translator
```

Confirm the deletion when prompted.

**Result:** The old URL will no longer be accessible, and all traffic will go to the new URL.

---

## Update Your Deploy Script

From now on, use the new deploy command for all future hosting deployments:

**Old command:**

```bash
firebase deploy --only hosting:z-control-multi-language-translator
```

**New command:**

```bash
firebase deploy --only hosting:z-control-translator
```

Consider updating any CI/CD pipelines, deployment scripts, or team documentation with the new command.

---

## Troubleshooting

### Issue: Deploy fails with "Hosting site not found"

**Solution:**

- This usually means the hosting site ID does not exist yet.
- Create the site in Firebase Console -> Hosting -> Add site.
- Site ID must match the configured target resource: `z-control-translator`.

### Issue: `Deploy target z-control-translator not configured for project z-control-4070`

**Solution:**

- Apply the target mapping once:

```bash
firebase target:apply hosting z-control-translator z-control-translator
```

- Retry deploy:

```bash
firebase deploy --only hosting:z-control-translator
```

### Issue: HTTP 404 on `.../sites/z-control-translator/versions`

**Solution:**

- The target mapping exists, but the hosting site does not exist yet.
- Create site `z-control-translator` in Firebase Console -> Hosting -> Add site.
- Retry deploy after site creation.

### Issue: App shows blank page after deployment

**Solution:**

- Check that `www/` folder exists and contains `index.html`
- Verify the build completed successfully: `ionic build --prod`
- Check the rewrite rule in `firebase.json` points to `/index.html`
- Check browser console (F12) for errors
- Clear browser cache (Ctrl+Shift+Delete) and reload

### Issue: Old URL still resolves to old site

**Solution:**

- Old hosting sites may remain active for backward compatibility
- This is normal; both URLs can coexist
- If you want to fully decommission the old URL, delete it (see above)
- DNS/caching may take up to 24 hours to fully propagate changes

### Issue: Firebase CLI not found

**Solution:**

```bash
npm install -g firebase-tools
firebase --version
```

### Issue: Authentication failed

**Solution:**

```bash
firebase logout
firebase login
firebase projects:list
firebase deploy --only hosting:z-control-translator
```

---

## Rollback (If Needed)

If you need to revert to the old hosting site:

1. **Redeploy to old target:**

   ```bash
   firebase deploy --only hosting:z-control-multi-language-translator
   ```

2. **Update firebase.json** back to the old target name

3. **Update documentation** back to the old URL

---

## Summary

✅ Updated `firebase.json` with new hosting target  
✅ Built app for production  
✅ Deployed to new Firebase hosting URL  
✅ Verified deployment works correctly  
✅ Updated all documentation references  
✅ Optionally removed old hosting site

Your app is now hosted at the new branded URL that aligns with your app name "z-control Translator"!

---

## Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Ionic Build Guide](https://ionicframework.com/docs/cli/commands/build)
- [App naming documentation](../text-to-speech-integration.md)
