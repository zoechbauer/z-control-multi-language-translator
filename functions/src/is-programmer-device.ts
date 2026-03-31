import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FirebaseFirestoreService } from './firebase-firestore.service.js';
import { getErrorMsg } from './utils.js';

/**
 * Callable function returning whether the current device is a programmer device.
 * Validates the request and delegates the check to `FirebaseFirestoreService`.
 * Requires authentication and delegates creation to `FirebaseFirestoreService`.
 */
export const isProgrammerDevice = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  try {
    const userId = auth.uid;
    const firestoreService = new FirebaseFirestoreService(userId);
    const isProgrammerDevice = await firestoreService.isProgrammerDevice();
    return { isProgrammerDevice };
  } catch (error) {
    let errorMessage = 'Error checking if device is a programmer device.';
    console.error(errorMessage, error);
    throw new HttpsError('internal', getErrorMsg(error, errorMessage));
  }
});
