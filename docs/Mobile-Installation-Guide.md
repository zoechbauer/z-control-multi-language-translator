# How to Install the z-control Multi Language Translator App Locally on Your Mobile

If you have already installed the z-control QR Code Generator App, your device is ready for local app installation. Follow these steps to install the Multi Language Translator app:

---

## 0. Prerequisites

- Ensure you have Node.js, npm, and the latest Ionic CLI installed.
- Install Capacitor CLI if not already present:
  ```sh
  npm install --save @capacitor/cli
  ```
- Install the required Capacitor core packages (already present in your project):
  ```sh
  npm install --save @capacitor/core
  ```
- Install Capacitor Android v7 (compatible with your current setup):
  ```sh
  npm install --save @capacitor/android@7
  ```
- **Set your appId and appName in capacitor.config.ts before building for mobile:**
  ```typescript
  const config: CapacitorConfig = {
    appId: 'at.zcontrol.zoe.translator',
    appName: 'z-control Multi Language Translator',
    webDir: 'www'
  };
  export default config;
  ```
- **TODO:** Upgrade to Capacitor Android version 8 later if needed.

---

## 1. Add the Android Platform

If you see `[error] android platform has not been added yet.`, you need to add the Android platform to your project:

```sh
npx cap add android
```

---

## 2. Build the Android APK

1. Open a terminal in your project root folder.
2. Run the following command to build the web assets:
   ```sh
   ionic build
   ```
3. After the build completes, sync the assets to the Android project:
   ```sh
   npx cap sync android
   ```
4. Open the Android project in Android Studio:
   ```sh
   npx cap open android
   ```

---

## 3. Build and Install the APK via Android Studio

1. In Android Studio, let Gradle finish syncing.
2. Connect your Android device via USB and ensure USB debugging is enabled.
3. Select your device in the device dropdown (top toolbar).
4. Click the green "Run" (▶) button or select **Run > Run 'app'** from the menu.
5. The app will be built and installed on your device.

---

## 4. (Alternative) Build APK and Install Manually

1. In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. After the build, click "locate" in the notification to find the APK file.
3. Transfer the APK to your device (via USB, email, or cloud).
4. On your device, open the APK file and follow the prompts to install.

---

## 5. Open and Use the App

- Find the **z-control Multi Language Translator** app icon on your device and tap to open.
- The app is now ready to use!

---

## Troubleshooting

- If you see a warning about installing apps from unknown sources, allow installation for this source in your device settings.
- If the app does not appear, ensure your device is selected in Android Studio and USB debugging is enabled.
- If you see `[error] android platform has not been added yet.`, run `npm install --save @capacitor/android@7` and then `npx cap add android` as shown above.

---

## Uninstalling

- To uninstall, long-press the app icon and select "Uninstall," or go to **Settings > Apps** and remove it from there.
