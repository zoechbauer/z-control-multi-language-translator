import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FirebaseFirestoreService } from './firebase-firestore-service.js';
import { getErrorMsg } from './utils.js';

/**
 * Callable function to sync programmer device mappings in Firestore.
 * Validates the payload and delegates updates to `FirebaseFirestoreService`.
 */
export const updateProgrammerDeviceUIDs = onCall(async (request) => {
  const auth = request.auth;
  const programmerDeviceUIDs = request.data?.programmerDeviceUIDs;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
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
  try {
    const userId = auth.uid;
    const firestoreService = new FirebaseFirestoreService(userId);
    await firestoreService.updateProgrammerDeviceUIDs(programmerDeviceUIDs);
    return { success: true };
  } catch (error) {
    let errorMessage = 'Error updating programmer device UIDs.';
    console.error(errorMessage, error, {
      programmerDeviceUIDs,
    });
    throw new HttpsError('internal', getErrorMsg(error, errorMessage));
  }
});
