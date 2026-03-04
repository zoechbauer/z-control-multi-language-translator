# App Update Notifications Guide

This guide explains how to monitor app updates during testing and closed testing, and how users get notified about new versions in production.

---

## 📱 Closed Testing Updates (Internal Testing)

**Important:** Google Play does **NOT** send automatic notifications for closed test updates. You must actively check for updates.

### How to Check for Updates on Test Device

**Option 1: Manually Check Play Store App (Recommended)**

1. Open Google Play Store app on your tablet/device
2. Search for "z-control Translator"
3. If an update is available, you'll see an **"Update"** button (instead of "Open")
4. Tap "Update" to install the new version

**Option 2: Manage My Apps & Games**

1. Open Google Play Store app
2. Tap your profile icon (top right)
3. Tap "Manage my apps & games"
4. Look for "z-control Translator" in the list
5. If an update is available, tap "Update"

**Option 3: Check Play Console (Desktop)**

1. Go to https://play.google.com/console
2. Select your app
3. Go to Testing → Closed testing
4. Check the release status
5. When you see "Released" status, the version is live for testers
6. Note: Play Console sends you a notification, but testers don't receive one

### Timeline for Updates

- **Upload to Play Console:** 1-5 minutes
- **Processing:** 15-60 minutes
- **Available to testers:** 5-30 minutes after processing completes
- **Appears in Play Store on device:** 10-15 minutes (may require refreshing the app or clearing Play Store cache)

### Manual Notification to Testers

Since Google Play doesn't notify testers automatically, you should:

1. **Email testers directly** when a new test version is available
2. Include:
   - What changed in this version
   - What you need them to test
   - Any bug fixes or new features
   - Link to opt-in list (if new testers)
3. **Ask for specific feedback**
   - "Please test the new translation feature"
   - "Check if crashes are fixed"
   - "Verify performance on older devices"

---

## 🌍 Production Updates (Live on Google Play Store)

**Good news:** In production, Google Play handles most notifications automatically.

### Automatic Update Notifications

Users receive automatic update notifications when:

1. **Auto-update is enabled** (most users have this ON)

   - Updates install automatically in background
   - Device may restart to install update

2. **Auto-update is disabled** (manual check)
   - Users see "Update available" prompt in Play Store app
   - Users can manually tap "Update"

### Update Flow for Users

```
Your app update approved by Google
           ↓
Google Play distributes update
           ↓
User's device detects new version
           ↓
If auto-update ON → Silent background install
If auto-update OFF → Manual "Update" button appears
           ↓
Update installed
           ↓
App restarts with new version
```

### Statistics

- **70-80%** of users have auto-update enabled
- **5-15%** manually update within 1-7 days
- **5-10%** never update (use old versions)

### Forcing Critical Updates (Optional)

For **security or critical bugs**, you can use Play Console's "In-app updates" API:

1. Implement in-app update code using Google Play Core Library
2. Show dialog: "Critical update required"
3. User must update before using app
4. Configure in Play Console → Release → Production

---

## 💬 Optional: In-App Update Notifications

You can add custom in-app notifications to inform users about new features or important updates.

### Simple In-App Banner Example

```typescript
// Check if new version is available
checkForUpdates() {
  this.http.get('/api/app-version.json').subscribe((data: any) => {
    const currentVersion = '1.0.0'; // Your app version
    if (data.latestVersion > currentVersion) {
      showUpdateBanner(
        'New version available! New features: ...',
        'Update Now'
      );
    }
  });
}
```

### Advanced: Required vs Optional Updates

- **Required update:** User cannot proceed without updating
- **Optional update:** User can dismiss and continue (will ask again in 3 days)

Use this when you have:

- Security fixes
- Critical bug fixes
- API changes that break old versions

---

## 📊 Monitoring Update Adoption

In Play Console, track:

1. **Active users by version**

   - Play Console → Acquisition → User statistics → By version
   - See how many users still use old versions

2. **Installation trends**

   - Play Console → Acquisition → Install events
   - See when users adopt new versions

3. **Crash rates**
   - Play Console → Vitals → Crashes & ANRs
   - Compare crash rates between versions

---

## 🔄 Release Notes for Users

When you release a new version, write clear release notes to encourage updates:

### English Example

```
Version 1.0.1 - Bug fixes and improvements
• Fixed crash when translating very long text
• Improved translation speed by 30%
• Better dark mode compatibility
• Updated translations for 5 new languages
```

### German Example

```
Version 1.0.1 - Fehlerbehebungen und Verbesserungen
• Fehler beim Übersetzen sehr langer Texte behoben
• Übersetzungsgeschwindigkeit um 30% verbessert
• Bessere Dark-Mode-Kompatibilität
• Übersetzungen für 5 neue Sprachen aktualisiert
```

---

## 📋 Checklist for Release

**When releasing a new version:**

- [ ] Increment version code in `android/app/build.gradle`
- [ ] Update `versionName` if applicable
- [ ] Write release notes in English and German
- [ ] Build signed AAB: `./gradlew bundleRelease`
- [ ] Upload to Play Console (Closed testing first for validation)
- [ ] **For closed testing:** Email testers with update info
- [ ] **For production:** Monitor adoption in Play Console
- [ ] **For critical fixes:** Consider in-app notification

---

## ❓ FAQ

**Q: Can I see which testers have updated?**
A: No, Play Console doesn't show per-tester update status. Ask testers to report feedback.

**Q: How long until users see my update?**
A:

- Closed testing: 10-30 minutes
- Production (approved): 5-48 hours (most within 24 hours)

**Q: Can I force users to update?**
A: Only with In-app updates API and "required" setting. Use sparingly.

**Q: What if users don't update?**
A: You can still support old versions. Consider feature flagging or API versioning.

**Q: Does Google Play notify me when someone updates?**
A: No, but you can track via Firebase Analytics or Play Console statistics.

---

## Resources

- [Google Play In-app Updates](https://developer.android.com/guide/playcore/in-app-updates)
- [Play Console Statistics](https://support.google.com/googleplay/android-developer/answer/139631)
- [Release Notes Best Practices](https://support.google.com/googleplay/android-developer/answer/113475)

---

**Summary:** Testers need manual checking for closed test updates (email them). Production users get automatic notifications if auto-update is enabled. Use release notes and optional in-app updates to encourage adoption of important new versions.
