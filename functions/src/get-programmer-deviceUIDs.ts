import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FirebaseFirestoreService } from './firebase-firestore-service.js';
import { getErrorMsg } from './utils.js';

/**
 * Callable function to ensure the contingent data document exists for the current month.
 * Requires authentication and delegates creation to `FirebaseFirestoreService`.
 */
export const getProgrammerDeviceUIDs = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  try {
    const userId = auth.uid;
    const firestoreService = new FirebaseFirestoreService(userId);
    const programmerDevices = await firestoreService.getProgrammerDeviceUIDs();
    return { programmerDevices };
  } catch (error) {
    let errorMessage = 'Error retrieving programmer device UIDs.';
    console.error(errorMessage, error);
    throw new HttpsError('internal', getErrorMsg(error, errorMessage));
  }
});
