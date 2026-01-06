# Step-by-Step Instructions to Ensure a Clean Build for Android

This guide helps you perform a clean build and deployment of your Ionic + Angular + Capacitor app for Android, ensuring that no stale or misbuilt files cause runtime issues.

## 1. Stop All Running Processes

- Stop any running Ionic dev servers.
- Close Android Studio if open.

## 2. Clean Old Build Artifacts

- Delete the following folders to remove old build files:

  - `android/app/build`
  - `android/build`
  - `www`

  On Windows, use:

  ```cmd
  rmdir /s /q android\app\build android\build
  rmdir /s /q www
  ```

  Or delete them manually in File Explorer.

## 3. Build Web Assets

- In your project root, run:
  ```sh
  ionic build
  ```
  This will generate a fresh `www` folder with your latest web assets.

## 4. Sync Web Assets to Android

- Run:
  ```sh
  npx cap sync android
  ```
  This copies the new `www` assets into the native Android project.

## 5. Open Android Studio

- Run:
  ```sh
  npx cap open android
  ```
  This opens the native project in Android Studio.

## 6. Clean and Rebuild in Android Studio

- In Android Studio, select:
  - `Build > Clean Project`
  - Then `Build > Rebuild Project`

## 7. Uninstall Old App from Device (Optional but Recommended)

- On your Android device, uninstall the app if it is already installed. This ensures no old data or cache interferes.

## 8. Run the App

- In Android Studio, click the Run button to install and launch the app on your device or emulator.

---

## Troubleshooting

- If you still encounter issues:
  - Double-check that all dependencies are up to date (`npm install`).
  - Make sure your `@ionic/angular`, `@capacitor/core`, and all plugins are compatible and on the same major version.
  - Check the device logs in Android Studio for additional error details.
  - Try running with live reload (`ionic cap run android --external -l`) to see if the problem is only in production builds.

## Notes

- This document is for tracking and resolving Android build issues in this project. Add any new problems and solutions here as you encounter them.
