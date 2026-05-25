import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { FirebaseFirestoreService } from './firebase-firestore.service.js';
import { getErrorMsg } from './utils.js';
import { FireStoreConstants } from './shared/app.constants.js';

/**
 * Callable function to ensure the contingent data document exists for the current month.
 * Requires authentication and delegates creation to `FirebaseFirestoreService`.
 */
export const createMissingContingentData = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const appId = request.data?.appId;
  if (typeof appId !== 'string' || appId.trim() === '') {
    throw new HttpsError('invalid-argument', 'appId must be provided.');
  }

  try {
    const collection = FireStoreConstants.getCollectionByAppId(appId);
    const userId = auth.uid;

    const firestoreService = new FirebaseFirestoreService(collection, userId);
    await firestoreService.createMissingContingentData();
    return { success: true };
  } catch (error) {
    let errorMessage = 'Error creating missing contingent data.';
    console.error(errorMessage, error);
    throw new HttpsError('internal', getErrorMsg(error, errorMessage));
  }
});
