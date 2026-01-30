# Anonymous Login in Firebase: Pros, Cons, and UID Behavior

---

## What is Anonymous Login?

Anonymous login in Firebase allows users to authenticate with your app without providing any credentials (such as email or social login). Firebase generates a unique user ID (UID) for each anonymous session, which can be used to track user-specific data until the session is lost or upgraded to a permanent account.

---

## Web App: Local Storage UID Persistence

To improve UID persistence in the web app, the UID assigned by Firebase Anonymous Login is also stored in browser localStorage. On subsequent visits or page reloads, the app attempts to restore the UID from localStorage before requesting a new anonymous sign-in. This helps avoid generating a new UID on every refresh, providing a more consistent user experience and enabling more reliable per-user quota tracking.

**Limitations:**

- If the user clears browser data (cookies/localStorage), the UID is lost and a new one will be generated.
- This approach does not provide cross-device or cross-browser persistence; the UID is still unique per browser and device.
- In incognito/private mode, localStorage is temporary and the UID will be lost when the session ends.

**Summary:** Local storage of the UID is a practical workaround for web apps to maintain a stable anonymous identity across browser refreshes, but it is not a substitute for a permanent user account.

---

## Pros of Anonymous Login

- **Frictionless Onboarding:** Users can start using the app immediately, without registration.
- **User Tracking:** Enables per-user data storage and quota enforcement, even for unregistered users.
- **Easy Upgrade:** Users can later link their anonymous account to a permanent account (email, Google, etc.) without losing data.
- **No Personal Data Required:** No need to collect or store sensitive user information.

## Cons of Anonymous Login

- **UID Persistence is Limited:** The UID is not guaranteed to persist across all scenarios (see below).
- **Easy to Reset Quotas:** Users can reset their UID (and thus their quota) by uninstalling/reinstalling the app or clearing browser data.
- **No Cross-Device Sync:** Anonymous users cannot access their data from another device or browser.
- **Not Suitable for Sensitive Data:** Since the identity is not verified, it should not be used for critical or secure features.

---

## When Does the UID Change?

### Native Mobile Apps (Android/iOS)

- **App Update:** UID remains the same. Updating the app via the app store does not affect the UID.
- **App Uninstall & Reinstall:** UID changes. Uninstalling the app removes all local data, so a new anonymous user is created on reinstall.
- **App Data Clear:** UID changes. Clearing the app's data in system settings also resets the UID.

### Web Apps (Browsers)

- **Browser Update:** UID remains the same. Updating the browser does not affect the UID.
- **Browser Data Clear:** UID changes. Clearing cookies, local storage, or site data will reset the UID.
- **Incognito/Private Mode:** UID is temporary. Each incognito session gets a new UID, which is lost when the session ends.
- **Different Browsers:** UID is different for each browser (e.g., Chrome, Firefox, Edge) on the same device.
- **Different Devices:** UID is different for each device.

---

## Summary Table

| Scenario                      | Native App UID | Web App UID |
| ----------------------------- | :------------: | :---------: |
| App/Browser Update            |      Same      |    Same     |
| App Uninstall & Reinstall     |    Changes     |     N/A     |
| Clear App Data / Browser Data |    Changes     |   Changes   |
| Incognito/Private Mode        |      N/A       |   Changes   |
| Different Browser             |      N/A       |   Changes   |
| Different Device              |    Changes     |   Changes   |

---

## Firebase Anonymous UID Persistence: Web vs Mobile

### Web (Browser)

- **Session Restoration:** On browser refresh, the JavaScript context is reset. Firebase Auth may not immediately restore the user session, so `auth.currentUser` is often `null` on page load. Firebase will then sign in anonymously and assign a UID.
- **UID Storage:** The UID is stored in browser local storage/cookies. If these are cleared, a new UID is generated.
- **Incognito/Private Mode:** Each session gets a new UID, which is lost when the session ends.
- **Cross-Device/Browser:** UID is unique per browser and device; it does not sync across browsers or devices.
- **Typical Behavior:** On every browser refresh, if the session is not restored instantly, a new anonymous sign-in may occur, but usually the same UID is reused unless storage is cleared.

### Mobile (Native App)

- **Session Restoration:** In native mobile apps (Capacitor/Cordova), the Firebase Auth session is usually persisted more reliably. The UID is available on app restart unless the app data is cleared or the app is uninstalled.
- **UID Storage:** UID is stored in the app's local storage. Clearing app data or uninstalling the app will result in a new UID.
- **Cross-Device:** UID is unique per device; it does not sync across devices.
- **Typical Behavior:** On app restart, the same UID is reused unless the app data is cleared or the app is reinstalled.

---

---

## When to Use Anonymous Login

- For apps where frictionless access is more important than strict user identity.
- When you want to track usage or quotas per device/session, not per real user.
- For demos, trials, or apps where user data is not sensitive.

**Not recommended** for apps requiring strong identity, cross-device sync, or secure data.

---

## Best Practices

- Inform users that their data may be lost if they uninstall the app or clear browser data.
- Consider offering an upgrade path to a permanent account for users who want persistence.
- Use anonymous login for onboarding, but encourage registration for long-term or sensitive use cases.
