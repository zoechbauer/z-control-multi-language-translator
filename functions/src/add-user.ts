import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { FirebaseFirestoreService } from './firebase-firestore.service.js';
import { FireStoreConstants } from './shared/app.constants.js';
import { getErrorMsg } from './utils.js';
import { AddUserData } from './shared/firebase-firestore.interfaces.js';

/**
 * Callable function to add a user mapping document for the authenticated user.
 * Validates input devices and delegates persistence to `FirebaseFirestoreService`.
 */
export const addUser = onCall(async (request) => {
  // assignment and validation of input parameters
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const data = request.data as Partial<AddUserData>;

  const appId = data.appId;
  const programmerDeviceUIDs = data.programmerDeviceUIDs;
  const deviceInfo = data.deviceInfo;
  const isNative = data.isNative;

  if (typeof appId !== 'string' || appId.trim() === '') {
    throw new HttpsError('invalid-argument', 'appId must be provided.');
  }

  if (!Array.isArray(programmerDeviceUIDs)) {
    throw new HttpsError(
      'invalid-argument',
      'programmerDeviceUIDs must be an array.',
    );
  }

  if (
    programmerDeviceUIDs.some(
      (d) => typeof d !== 'object' || !d.userId || !d.name,
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Each device must have userId and name.',
    );
  }

  if (!deviceInfo) {
    throw new HttpsError('invalid-argument', 'deviceInfo is empty.');
  }

  // process valid data and add user mapping
  try {
    const collection = FireStoreConstants.getCollectionByAppId(appId);
    const userId = auth.uid;

    const firestoreService = new FirebaseFirestoreService(collection, userId);
    await firestoreService.addUser(
      userId,
      programmerDeviceUIDs,
      deviceInfo,
      isNative ?? false,
    );

    return { success: true };
  } catch (error) {
    const errorMessage = 'Error adding user.';
    console.error(errorMessage, error);
    throw new HttpsError('internal', getErrorMsg(error, errorMessage));
  }
});
