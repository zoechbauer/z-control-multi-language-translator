# TODO List for Environment and Programmer Device Management

This document lists important activities to execute when working with environment variables and programmer device UIDs in the Multi Language Translator project.

---

## a) Adding New Environment Variables

- **Action:**
  - Add or update environment variables in `.env.local`.
  - **Run:**
    - `npm run generate-env`
  - **Details:**
    - See `docs/firebase-config-enviroment-files.md` for more information on environment file management and the generate-env script.

## b) Registering a Programmer Device's Firebase UID in the Environment and in Firestore userMapping Collection

- **Action Steps:**
  1. Launch the app on the new programmer device. The app will automatically register its UID in Firestore user mapping with username prefix U and type User.
  2. Set `PROGRAMMER_DEVICES_UPDATE_USERMAP=true` in `.env.local` to enable device registration.
  3. Add the device's UID to the `myDevices` array in `.env.local`.
  4. Update `generate-env.js` to include an environment variable for the new programmer device UID.
  5. Run `npm run generate-env` to regenerate the environment files.
  6. Relaunch the app.
  7. Verify the device is now recognized in Firestore user mapping with username prefix P and type Programmer.
  8. Test translations on the new device to confirm full functionality and proper registration.
  9. Set `PROGRAMMER_DEVICES_UPDATE_USERMAP=false` in `.env.local` to disable device registration.
  10. Run `npm run generate-env` to regenerate the environment files.

---

**⚠️ Important:** Do not delete programmer device UIDs from environment files or Firestore user mapping. Removing UIDs causes duplicate user numbers because the system counts existing users to generate the next user number. Always add new UIDs instead of replacing old ones. 

Before performing translations or other operations, verify that the new device's UID has been added to the environment files and Firestore user mapping.
