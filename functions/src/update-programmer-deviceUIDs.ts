import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { FirebaseFirestoreService } from './firebase-firestore.service.js';
import { FireStoreConstants } from './shared/app.constants.js';
import { getErrorMsg } from './utils.js';
import { UpdateProgrammerDeviceUIDsData } from './shared/firebase-firestore.interfaces.js';

/**
 * Callable function to sync programmer device mappings in Firestore.
 * Validates the payload and delegates updates to `FirebaseFirestoreService`.
 */
export const updateProgrammerDeviceUIDs = onCall(async (request) => {
  // assignment and validation of input parameters
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const data = request.data as Partial<UpdateProgrammerDeviceUIDsData>;

  const appId = data.appId;
  if (typeof appId !== 'string' || appId.trim() === '') {
    throw new HttpsError('invalid-argument', 'appId must be provided.');
  }

  const programmerDeviceUIDs = data.programmerDeviceUIDs;
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

  // process valid data and update programmer device UIDs
  try {
    const collection = FireStoreConstants.getCollectionByAppId(appId);
    const userId = auth.uid;
    
    const firestoreService = new FirebaseFirestoreService(collection, userId);
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
