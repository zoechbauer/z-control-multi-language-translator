import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FirebaseFirestoreService } from './firebase-firestore-service.js';
import { getErrorMsg } from './utils.js';
import { DeviceInfo } from './shared/firebase-firestore.interfaces.js';

/**
 * Callable function to add a user mapping document for the authenticated user.
 * Validates input devices and delegates persistence to `FirebaseFirestoreService`.
 */
export const addUser = onCall(async (request) => {
  const auth = request.auth;
  const userId = auth?.uid;
  if (!userId || !auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const programmerDeviceUIDs = request.data?.programmerDeviceUIDs;
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
  const deviceInfo: DeviceInfo = request.data?.deviceInfo;
  if (!deviceInfo) {
    throw new HttpsError('invalid-argument', 'deviceInfo is empty.');
  }
  const isNative = request.data?.isNative;
  try {
    const userId = auth.uid;
    const firestoreService = new FirebaseFirestoreService(userId);
    await firestoreService.addUser(userId, programmerDeviceUIDs, deviceInfo, isNative);
    return { success: true };
  } catch (error) {
    let errorMessage = 'Error adding user.';
    console.error(errorMessage, error, {
      userId,
      programmerDeviceUIDs,
      deviceInfo,
    });
    throw new HttpsError('internal', getErrorMsg(error, errorMessage));
  }
});
