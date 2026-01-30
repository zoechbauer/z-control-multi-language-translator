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

    ***

## b) Registering a Programmer Device's Firebase UID in the Environment

- **Action Steps:**
  1. Launch the app on the new programmer device. This will automatically add its UID to the Firestore user mapping.
  2. Before performing any translations or other actions, ensure the new device's UID is added to the environment files.
  3. In Firestore user mapping, update the Name and type fields for the new device's UID to accurately reflect its identity. Change its type from User Device to Programmer Device.
  4. Add the new device's UID to the `myDevices` array in `.env.local`.
  5. Run `npm run generate-env` to regenerate the environment files.
  6. Relaunch the app on the new programmer device and verify that the statistics accordion appears in the settings page.
  7. Confirm that the new programmer device UID is correctly listed in the Firestore user mapping.

- **Details:**
  - Always add the new programmer device UID to both Firestore user mapping and the environment files before using the device for translations or other changes. This ensures correct device recognition and access to programmer features.

---

## c) Updating Programmer Device UIDs in the Environment

- **Action Steps:**
  1. Update the list of programmer device UIDs in the `myDevices` array within `.env.local`.
  2. Set `MY_DEVICES_UPDATE_USERMAP=true` in `.env.local` to enable automatic user mapping updates.
  3. Run `npm run generate-env` to regenerate the environment files with the new configuration.
  4. Start the app. This will trigger the `updateNameOfProgrammerUsers()` method (see `src/app/services/firebase-firestore.service.ts`), which will update the type and name of affected users in Firestore user mapping.
  5. Once the update is complete, set `MY_DEVICES_UPDATE_USERMAP=false` in `.env.local` to prevent further automatic updates.
  6. Run `npm run generate-env` again to finalize the environment files.

- **Details:**
  - This update process ensures that Firestore user mapping accurately reflects the current set of programmer device UIDs, updating any devices whose status has changed.
  - The `updateNameOfProgrammerUsers` method will automatically change the type and name of users in Firestore based on the new `myDevices` list, appending an asterisk to indicate a change.
  - Only use this process if translations or other actions were performed before the new programmer device UID was added to the environment files (see section b). Otherwise, simply add the UID as described above.
  - For more information, refer to the `updateNameOfProgrammerUsers` method in `src/app/services/firebase-firestore.service.ts`.

---

**Always keep your environment files and Firestore user mapping in sync when making changes to programmer device UIDs or environment variables.**
