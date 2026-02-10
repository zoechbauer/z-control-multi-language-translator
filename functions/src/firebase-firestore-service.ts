import admin from 'firebase-admin';
import { FireStoreConstants, UserType } from './shared/app.constants.js';
import {
  DeviceInfo,
  FirestoreContingentData,
  ProgrammerDeviceUID,
} from './shared/firebase-firestore.interfaces.js';
import { getDeviceName, getUserType, isValidDevice } from './utils.js';

export class FirebaseFirestoreService {
  private readonly db: admin.firestore.Firestore;
  private readonly userId: string;

  constructor(userId: string) {
    this.db = admin.firestore();
    this.userId = userId;
  }

  async readContingentData(): Promise<FirestoreContingentData> {
    const doc = await this.db
      .doc(`${FireStoreConstants.getMetaContingentDataDocumentPath()}`)
      .get();
    console.log('Contingent Data:', doc.data());
    return doc.data() as FirestoreContingentData;
  }

  async getCharCountForUser(): Promise<number> {
    const doc = await this.db
      .doc(`${FireStoreConstants.getUsersCollectionPath()}/${this.userId}`)
      .get();
    console.log(`Char Count for User ${this.userId}:`, doc.data()?.charCount);
    return doc.exists && doc.data()?.charCount ? doc.data()!.charCount : 0;
  }

  async getTotalCharCount(): Promise<number> {
    try {
      const doc = await this.db
        .doc(`${FireStoreConstants.getMetaTotalCharsDocumentPath()}`)
        .get();
      console.log('Total Char Count:', doc.data()?.charCount);
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
        `${FireStoreConstants.getMetaContingentDataDocumentPath()}`,
      );
      const doc = await docRef.get();
      console.log('contingent data:', doc.data());
      if (!doc.exists) {
        await docRef.set(
          {
            StopTranslationForAllUsers: false,
            maxFreeTranslateCharsPerMonthForUser: 10000,
            maxFreeTranslateCharsPerMonth: 500000,
            maxFreeTranslateCharsBufferPerMonth: 5000,
            lastUpdated: new Date(),
          },
          { merge: true },
        );
        console.log('Created control flags document with default values.');
      } else {
        console.log('Control flags document already exists. No changes made.');
      }
    } catch (error) {
      console.error('Error creating missing contingent data:', error);
      throw error;
    }
  }

  /**
   * Updates or creates user mapping documents for a list of programmer devices.
   *
   * For each device:
   *   - If a user mapping exists and type is 'User', update to 'Programmer'.
   *   - If no mapping exists, create as 'Programmer'.
   *   - Devices missing userId or name are skipped.
   */
  async updateProgrammerDeviceUIDs(
    programmerDeviceUIDs: ProgrammerDeviceUID[],
  ): Promise<void> {
    if (!Array.isArray(programmerDeviceUIDs)) {
      throw new TypeError('programmerDeviceUIDs must be an array');
    }

    for (const device of programmerDeviceUIDs) {
      if (!isValidDevice(device)) continue;
      try {
        await this.updateUserMappingUsers(device, programmerDeviceUIDs);
      } catch (error) {
        console.error(
          'Error updating user mapping for programmer device:',
          device,
          error,
        );
      }
    }
  }

  private async updateUserMappingUsers(
    device: ProgrammerDeviceUID,
    allDevices: ProgrammerDeviceUID[],
  ): Promise<void> {
    const docRef = this.db.doc(
      `${FireStoreConstants.getUserMappingUsersCollectionPath()}/${device.userId}`,
    );
    const doc = await docRef.get();

    if (doc.exists) {
      this.logExistingDevice(device, doc.data());
      if (doc.data()?.type === UserType.User) {
        // Update existing document to type Programmer
        await docRef.set(
          {
            name: await this.getUserName(device.userId, allDevices),
            type: UserType.Programmer,
            device: device.name,
            lastUpdated: new Date(),
          },
          { merge: true },
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
        { merge: true },
      );
    }
  }

  private logExistingDevice(device: ProgrammerDeviceUID, data: any): void {
    console.log(
      `User mapping document for user ${device.userId} already exists. Checking if update is needed...`,
      data,
    );
  }

  private logCreatingDevice(device: ProgrammerDeviceUID): void {
    console.log(
      `User mapping document for user ${device.userId} does not exist. Creating new document...`,
    );
  }

  /**
   * Adds a new user mapping document to Firestore.
   *
   * Creates a user mapping document with the user's name, type, and device information.
   * Only creates/updates the document if it does not already exist or if it exists 
   * without deviceInfo or with different deviceInfo.
   *
   * @param userId The unique identifier of the user.
   * @param programmerDeviceUIDs Array of programmer device UIDs to determine user type and device name.
   * @param deviceInfo Device information to be stored in the user document.
   * @throws Error if userId is not provided.
   */
  async addUser(
    userId: string,
    programmerDeviceUIDs: ProgrammerDeviceUID[],
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    // Path: .../MLT_translations_statistics/userMapping/{uid}
    if (!userId) {
      throw new Error('userId must be provided');
    }
    try {
      const docRef = this.db.doc(
        `${FireStoreConstants.getUserMappingUsersCollectionPath()}/${userId}`,
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
            userId: userId,
            createdAt: new Date(),
          },
          { merge: true },
        );
        console.log('Inserted user mapping document for user:', userId);
      } else if (!doc.data()?.deviceInfo || doc.data()?.deviceInfo !== deviceInfo) {
        // If document exists but deviceInfo is missing or different, update it
        await docRef.set(
          {
            deviceInfo: deviceInfo,
            lastUpdated: new Date(),
          },
          { merge: true },
        );
        console.log('Updated user mapping document with device info for user:', userId);
      }
    } catch (error) {
      console.error('Error upserting user:', userId, error);
    }
  }

  private async getUserName(
    userId: string,
    programmerDeviceUIDs: ProgrammerDeviceUID[],
  ): Promise<string> {
    const type = getUserType(userId, programmerDeviceUIDs);
    const userNumber = await this.countUser(type);
    console.log(
      `Assigning user name for user ${userId}: type=${type}, userNumber=${userNumber + 1}`,
    );
    return `${type}-${userNumber + 1}`;
  }

  private async countUser(type: string): Promise<number> {
    try {
      const collectionRef = this.db.collection(
        `${FireStoreConstants.getUserMappingUsersCollectionPath()}`,
      );
      return collectionRef
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
   * Also updates the lastUpdated timestamp for both the user and the total statistics document.
   *
   * - Updates the user's document with the incremented character count and timestamp.
   * - Updates the total statistics document with the incremented character count and timestamp.
   * - Count = text length x number of target languages.
   *
   * @param count Number of characters to add to the user's and total translated character counts.
   */
  async addTranslatedChars(
    count: number,
  ) {
    console.log(
      `addTranslatedChars called with count: ${count} for user ${this.userId}`,
    );
    if (!this.userId) return;

    try {
      await this.updateUserCharCount(count);
    } catch (error) {
      console.error('Error writing user char count document:', error);
    }

    try {
      await this.updateTotalCharCount(count);
    } catch (error) {
      console.error('Error writing total char count document:', error);
    }
  }

  private async updateUserCharCount(
    count: number,
  ): Promise<void> {
    const docRef = this.db.doc(
      `${FireStoreConstants.getUsersCollectionPath()}/${this.userId}`,
    );
    const userDoc = await docRef.get();
    let newCharCount = count;
    if (userDoc.exists && typeof userDoc.data()?.charCount === 'number') {
      newCharCount += userDoc.data()!.charCount;
    }
    await docRef.set(
      { charCount: newCharCount, lastUpdated: new Date() },
      { merge: true },
    );
    console.log('Set charCount for user', this.userId, 'to', newCharCount);
  }

  private async updateTotalCharCount(count: number): Promise<void> {
    const totalRef = this.db.doc(
      `${FireStoreConstants.getMetaTotalCharsDocumentPath()}`,
    );
    const totalDoc = await totalRef.get();
    let newTotalCharCount = count;
    if (totalDoc.exists && typeof totalDoc.data()?.charCount === 'number') {
      newTotalCharCount += totalDoc.data()!.charCount;
    }
    await totalRef.set(
      { charCount: newTotalCharCount, lastUpdated: new Date() },
      { merge: true },
    );
    console.log('Set total charCount to', newTotalCharCount);
  }
}
