import admin from 'firebase-admin';
import { FireStoreConstants, UserType } from './shared/app.constants.js';
import {
  CharCountResult,
  DeviceInfo,
  FirestoreContingentData,
  ProgrammerDeviceUID,
} from './shared/firebase-firestore.interfaces.js';
import { getDeviceName, getUserType, isValidDevice } from './utils.js';
import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils.service.js';

export class FirebaseFirestoreService {
  private readonly db: admin.firestore.Firestore;
  private readonly collection: string;
  private readonly userId: string;

  constructor(collection: string, userId: string) {
    this.db = admin.firestore();
    this.collection = collection;
    this.userId = userId;
  }

  /**
   * Reads the contingent data document containing global translation limits and control flags.
   *
   * @returns Promise resolving to the contingent data object with translation quotas and control flags.
   * @throws Error if the document read operation fails.
   */
  async readContingentData(): Promise<FirestoreContingentData> {
    const doc = await this.db
      .doc(`${FireStoreConstants.getMetaContingentDataDocumentPath(this.collection)}`)
      .get();
    return doc.data() as FirestoreContingentData;
  }

  /**
   * Retrieves the character count and target languages for the current user.
   *
   * Returns the user's cumulative translated character count and their selected target languages
   * for translations. If the user document doesn't exist or lacks character count data, returns 0.
   *
   * @returns Promise resolving to an object with charCount and targetLanguages array.
   * @throws Error if the document read operation fails.
   */
  async getCharCountForUser(): Promise<CharCountResult> {
    const doc = await this.db
      .doc(`${FireStoreConstants.getUsersCollectionPath(this.collection)}/${this.userId}`)
      .get();
    return doc.exists && doc.data()?.charCount
      ? {
          charCount: doc.data()!.charCount,
          targetLanguages: doc.data()?.targetLanguages || [],
        }
      : { charCount: 0, targetLanguages: [] };
  }

  /**
   * Retrieves the total translated character count across all users for the current month.
   *
   * Reads the meta document that tracks cumulative translation usage. Used for monitoring
   * global translation quotas and enforcing rate limits.
   *
   * @returns Promise resolving to the total character count as a number, or 0 if not found.
   * @throws Error if the document read operation fails.
   */
  async getTotalCharCount(): Promise<number> {
    try {
      const doc = await this.db
        .doc(`${FireStoreConstants.getMetaTotalCharsDocumentPath(this.collection)}`)
        .get();
      return doc.exists && doc.data()?.charCount ? doc.data()!.charCount : 0;
    } catch (error) {
      console.error('Error getting total char count:', error);
      throw error;
    }
  }

  /**
   * If the contingent data document is missing, it creates it with default values.
   * Existing values are never overwritten.
   */
  async createMissingContingentData(): Promise<void> {
    // Path: .../MLT_translations_statistics/{yyyy-mm}/meta/contingentData
    try {
      const docRef = this.db.doc(
        `${FireStoreConstants.getMetaContingentDataDocumentPath(this.collection)}`
      );
      const doc = await docRef.get();
      if (!doc.exists) {
        await docRef.set(
          {
            StopTranslationForAllUsers: false,
            maxFreeTranslateCharsPerMonthForUser: 10000,
            maxFreeTranslateCharsPerMonth: 500000,
            maxFreeTranslateCharsBufferPerMonth: 5000,
            lastUpdated: new Date(),
          },
          { merge: true }
        );
        console.log('Created control flags document with default values.');
      }
    } catch (error) {
      console.error('Error creating missing contingent data:', error);
      throw error;
    }
  }

  /**
   * Initializes or syncs programmer device UIDs from client configuration to Firestore.
   *
   * **Initial Setup Workflow:**
   * This function is called once from the client (via Cloud Function) to populate the
   * `programmerDevices` collection with UIDs from .env.local. After initial setup,
   * programmer UIDs should be maintained manually in Firestore, allowing UID changes
   * without code deployment.
   *
   * **Behavior:**
   * For each device in the provided array:
   *   - Creates a document in `programmerDevices` collection if it doesn't exist
   *   - Updates the `users` mapping: if a user mapping exists with type 'User', updates to 'Programmer'
   *   - If no user mapping exists, creates a new one as 'Programmer'
   *   - Skips devices with missing userId or name
   *
   * **Important:**
   * - Existing `programmerDevices` documents are NOT overwritten
   * - Manual changes in Firestore are preserved
   * - This function is idempotent - safe to call multiple times
   *
   * **Path Structure:**
   * - User mappings: `MLT_translations_statistics/userMapping/users/{userId}`
   * - Programmer devices: `MLT_translations_statistics/userMapping/programmerDevices/{userId}`
   *
   * @param programmerDeviceUIDs Array of programmer device objects from client (.env.local).
   * @returns Promise that resolves when all device updates are complete.
   * @throws TypeError if programmerDeviceUIDs is not an array.
   * @throws Error is caught and logged for individual device update failures.
   *
   * @example
   * // Initial setup - called once from client
   * await service.updateProgrammerDeviceUIDs([
   *   { userId: 'abc123', name: 'Hans-Laptop' }
   * ]);
   * // After this, update UIDs directly in Firestore programmerDevices collection
   */
  async updateProgrammerDeviceUIDs(
    programmerDeviceUIDs: ProgrammerDeviceUID[]
  ): Promise<void> {
    if (!Array.isArray(programmerDeviceUIDs)) {
      throw new TypeError('programmerDeviceUIDs must be an array');
    }

    for (const device of programmerDeviceUIDs) {
      if (!isValidDevice(device)) continue;
      try {
        await this.updateUserMappingUsers(device, programmerDeviceUIDs);
        await this.createUserMappingProgrammerDevices(device);
      } catch (error) {
        console.error(
          'Error updating user mapping for programmer device:',
          device,
          error
        );
      }
    }
  }

  /**
   * Updates or creates a user mapping document for a single programmer device.
   * Internal helper for updateProgrammerDeviceUIDs.
   */
  private async updateUserMappingUsers(
    device: ProgrammerDeviceUID,
    allDevices: ProgrammerDeviceUID[]
  ): Promise<void> {
    const docRef = this.db.doc(
      `${FireStoreConstants.getUserMappingUsersCollectionPath(this.collection)}/${
        device.userId
      }`
    );
    const doc = await docRef.get();

    if (doc.exists) {
      if (doc.data()?.type === UserType.User) {
        // Update existing document to type Programmer
        await docRef.set(
          {
            name: await this.getUserName(device.userId, allDevices),
            type: UserType.Programmer,
            device: device.name,
            lastUpdated: new Date(),
          },
          { merge: true }
        );
      }
    } else {
      // Create new document for programmer device
      this.logCreatingDevice(device);
      await docRef.set(
        {
          name: await this.getUserName(device.userId, allDevices),
          type: UserType.Programmer,
          userId: device.userId,
          device: device.name,
          createdAt: new Date(),
        },
        { merge: true }
      );
    }
  }

  /**
   * Creates or updates a programmer device mapping in Firestore.
   *
   * Stores the device UID and name in the programmerDevices collection,
   * using the userId as the document ID. This allows direct modification
   * of programmer device UIDs in Firestore without redeploying the app.
   *
   * Path: MLT_translations_statistics/userMapping/programmerDevices/{userId}
   *
   * @param device - Programmer device object containing userId and device name.
   * @returns Promise that resolves when the document is created or confirmed to exist.
   * @throws Error if the Firestore write operation fails.
   *
   * @example
   * await service.createUserMappingProgrammerDevices({
   *   userId: 'abc123',
   *   name: 'Chrome Browser'
   * });
   */
  private async createUserMappingProgrammerDevices(
    device: ProgrammerDeviceUID
  ): Promise<void> {
    const docRef = this.db.doc(
      `${FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(this.collection)}/${
        device.userId
      }`
    );
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set(
        {
          userId: device.userId,
          device: device.name,
          createdAt: new Date(),
        },
        { merge: true }
      );
      console.log(
        `Created programmer device mapping for userId: ${device.userId}`
      );
    }
  }

  /**
   * Retrieves all programmer device UIDs from Firestore.
   *
   * Reads all documents from the programmerDevices collection and returns them
   * as an array. This is the source of truth for determining which UIDs belong
   * to programmer devices, allowing you to update programmer UIDs directly in
   * Firestore without modifying .env.local or redeploying.
   *
   * Path: MLT_translations_statistics/userMapping/programmerDevices/*
   *
   * @returns Promise resolving to array of all programmer device UIDs stored in Firestore.
   *          Returns empty array if the collection is empty or doesn't exist.
   * @throws Error if the Firestore read operation fails.
   *
   * @example
   * const devices = await service.getProgrammerDeviceUIDs();
   * // Returns: [{ userId: 'abc123', name: 'Chrome Browser' }, ...]
   */
  async getProgrammerDeviceUIDs(): Promise<ProgrammerDeviceUID[]> {
    try {
      const collectionRef = this.db.collection(
        `${FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(this.collection)}`
      );
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map((doc) => doc.data() as ProgrammerDeviceUID);
    } catch (error) {
      console.error(
        'Error retrieving programmer devices from Firestore:',
        error
      );
      throw error;
    }
  }

  async isProgrammerDevice(): Promise<boolean> {
    try {
      const collectionRef = this.db.collection(
        `${FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(this.collection)}`
      );
      const snapshot = await collectionRef.get();

      if (snapshot.empty) {
        return false;
      }
      return snapshot.docs.some(
        (doc) => (doc.data() as ProgrammerDeviceUID).userId === this.userId
      );
    } catch (error) {
      console.error(
        'Error checking if device is a programmer device from Firestore:',
        error
      );
      throw error;
    }
  }

  /**
   * Logs the creation of a new device mapping document.
   * Internal helper for debugging device mapping lifecycle.
   */
  private logCreatingDevice(device: ProgrammerDeviceUID): void {
    console.log(
      `User mapping document for user ${device.userId} does not exist. Creating new document...`
    );
  }

  /**
   * Creates or updates a user mapping document with device information.
   *
   * Creates a new user mapping if the document doesn't exist, or updates the deviceInfo
   * and isNative flag if the document exists but has missing/different deviceInfo.
   * Property order differences in deviceInfo are properly handled to avoid unnecessary updates.
   * Uses deep equality comparison with locale-aware sorting to detect actual content changes.
   *
   * @param userId The unique identifier of the user (required).
   * @param programmerDeviceUIDs Array of programmer device UIDs to determine user type and device name.
   * @param deviceInfo Device information object (userAgent, platform, language, appVersion) to store.
   * @param isNative Optional flag indicating if user is on a native platform (default: false).
   * @returns Promise that resolves when the user document is created or updated.
   * @throws Error if userId is not provided, or if the write operation fails.
   */
  async addUser(
    userId: string,
    programmerDeviceUIDs: ProgrammerDeviceUID[],
    deviceInfo: DeviceInfo,
    isNative?: boolean
  ): Promise<void> {
    // Path: .../MLT_translations_statistics/userMapping/{uid}
    if (!userId) {
      throw new Error('userId must be provided');
    }
    try {
      const docRef = this.db.doc(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(this.collection)}/${userId}`
      );
      const doc = await docRef.get();
      if (!doc.exists) {
        // Create new document for user
        await docRef.set(
          {
            name: await this.getUserName(userId, programmerDeviceUIDs),
            type: getUserType(userId, programmerDeviceUIDs),
            device: getDeviceName(userId, programmerDeviceUIDs),
            deviceInfo: deviceInfo,
            isNative: isNative ?? false,
            userId: userId,
            createdAt: new Date(),
          },
          { merge: true }
        );
      } else if (
        !doc.data()?.deviceInfo ||
        !FirebaseFirestoreUtilsService.isDeepEqual(
          doc.data()?.deviceInfo,
          deviceInfo
        )
      ) {
        // If document exists but deviceInfo is missing or different, update it
        await docRef.set(
          {
            deviceInfo: deviceInfo,
            isNative: isNative ?? false,
            lastUpdated: new Date(),
          },
          { merge: true }
        );
        console.log(
          'Updated user mapping document with device info for user:',
          userId
        );
      }
    } catch (error) {
      console.error('Error upserting user:', userId, error);
    }
  }

  /**
   * Generates a unique user name based on type and count.
   * Format: '{userType}-{sequenceNumber}' (e.g., 'User-42', 'Programmer-5').
   * Internal helper for creating consistent user identifiers.
   */
  private async getUserName(
    userId: string,
    programmerDeviceUIDs: ProgrammerDeviceUID[]
  ): Promise<string> {
    const type = getUserType(userId, programmerDeviceUIDs);
    const userNumber = await this.countUser(type);
    return `${type}-${userNumber + 1}`;
  }

  /**
   * Counts the number of existing user mappings of a given type.
   * Used to determine the sequence number for new user names.
   */
  private async countUser(type: string): Promise<number> {
    try {
      const collectionRef = this.db.collection(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(this.collection)}`
      );
      return await collectionRef
        .where('type', '==', type)
        .get()
        .then((snapshot) => snapshot.size || 0);
    } catch (error) {
      console.error('Error getting user number for type:', type, error);
      throw new Error('Error counting users for type: ' + type);
    }
  }

  /**
   * Increments the translated character count for the current user.
   * Also updates the lastUpdated timestamp for both the user and the total statistics document and the selected languages.
   *
   * - Updates the user's document with the incremented character count and timestamp.
   * - Updates the total statistics document with the incremented character count and timestamp.
   * - Count = text length x number of target languages.
   *
   * @param count Number of characters to add to the user's and total translated character counts.
   * @param selectedLanguages Array of selected target languages for the translation.
   *
   * @param count Number of characters to add to both user and total character counts.
   * @param selectedLanguages Array of target language codes selected for the translation.
   * @returns Promise that resolves when both user and total counts are updated.
   * @throws Error is caught and logged for update operation failures.
   */
  async addTranslatedChars(
    count: number,
    selectedLanguages: string[]
  ): Promise<void> {
    if (!this.userId) return;

    try {
      await this.updateUserCharCount(count, selectedLanguages);
    } catch (error) {
      console.error('Error writing user char count document:', error);
    }

    try {
      await this.updateTotalCharCount(count);
    } catch (error) {
      console.error('Error writing total char count document:', error);
    }
  }

  /**
   * Updates the character count and target languages for the current user.
   * Internal helper for addTranslatedChars that updates the user's usage statistics.
   */
  private async updateUserCharCount(
    count: number,
    selectedLanguages: string[]
  ): Promise<void> {
    const docRef = this.db.doc(
      `${FireStoreConstants.getUsersCollectionPath(this.collection)}/${this.userId}`
    );
    await docRef.set(
      {
        charCount: admin.firestore.FieldValue.increment(count),
        targetLanguages: selectedLanguages,
        lastUpdated: new Date(),
      },
      { merge: true }
    );
  }

  /**
   * Updates the total translated character count across all users for the current month.
   * Internal helper for addTranslatedChars that updates global usage statistics.
   */
  private async updateTotalCharCount(count: number): Promise<void> {
    const totalRef = this.db.doc(
      `${FireStoreConstants.getMetaTotalCharsDocumentPath(this.collection)}`
    );
    await totalRef.set(
      {
        charCount: admin.firestore.FieldValue.increment(count),
        lastUpdated: new Date(),
      },
      { merge: true }
    );
  }
}
