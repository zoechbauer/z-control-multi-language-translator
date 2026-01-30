export interface UserStatistics {
  uid: string;
  charCount: number;
  lastUpdated?: Date;
  userAgent?: string;
  platform?: string;
  language?: string;
  appVersion?: string;
}

export interface FirestoreControlFlags {
  StopTranslationForAllUsers?: boolean;
  maxFreeTranslateCharsPerMonthForUser?: number;
  maxFreeTranslateCharsPerMonth?: number;
  maxFreeTranslateCharsBufferPerMonth?: number;
}

export interface UserType {
  userId: string;
  name: string;
  type: 'P' | 'U'; // Programmer or User
  createdAt: Date;
  changedFromName?: string;
  changedAt?: Date;
}

import { Injectable } from '@angular/core';
import { Auth, signInAnonymously, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { increment } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { FireStoreConstants } from '../shared/app.constants';
import { UtilsService } from './utils.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({ providedIn: 'root' })
export class FirebaseFirestoreService {
  private user: User | null = null;
  private readonly monthlyTranslationsMonthDocPath = `${
    FireStoreConstants.COLLECTION_TRANSLATIONS
  }/${this.utilsService.getCurrentYearMonth()}`;

  constructor(
    private readonly auth: Auth,
    private readonly firestore: Firestore,
    private readonly utilsService: UtilsService,
    private readonly localStorageService: LocalStorageService,
  ) {}

  /**
   * Initializes the Firestore service.
   * Currently, it authenticates the user and sets up user mapping and control flags.
   */
  async init() {
    await this.authenticateUser();
  }

  /**
   * Authenticates the user and sets up user mapping and control flags for both web and native platforms.
   *
   * - On web: Attempts to restore the user UID from localStorage (if available) to avoid generating a new UID on refresh.
   *   If no UID is found, signs in anonymously and saves the new UID to localStorage.
   * - On native: Always uses Firebase Auth for persistence and signs in anonymously if not already signed in.
   *
   * In both cases, ensures Firestore control flags exist and updates programmer/user mapping as needed.
   */
  private async authenticateUser() {
    try {
      if (!this.utilsService.isNative) {
        // Web: Try to restore user from localStorage first
        this.localStorageService.firestoreUid$.subscribe(async (storedUid) => {
          if (storedUid) {
            this.user = { uid: storedUid } as User;
            console.log('Restored user from localStorage: User', this.user);
            await this.addUser(this.user.uid);
          } else {
            // Sign in anonymously if not already signed in
            await this.signInAnonymously();
          }
          await this.ensureControlFlagsExist();
          await this.updateNameOfProgrammerUsers();
        });
      } else {
        // Native: Always use Firebase Auth
        await this.signInAnonymously();
        await this.ensureControlFlagsExist();
        await this.updateNameOfProgrammerUsers();
      }
    } catch (error) {
      console.error('Error during Firebase authentication:', error);
    }
  }

  /**
   * Signs in the user anonymously using Firebase Auth if not already signed in.
   * Sets the user property to the authenticated user and adds the user to the user mapping if needed.
   * Logs the UID and whether the user was newly signed in or already authenticated.
   *
   * Used for both web and native platforms, but on web, localStorage UID logic is handled separately in init().
   */
  private async signInAnonymously(): Promise<void> {
    if (!this.auth.currentUser) {
      const result = await signInAnonymously(this.auth);
      this.user = result.user;
      await this.addUser(this.user.uid);
      console.log('Signed in anonymously with UID (native):', this.user.uid);
    } else {
      this.user = this.auth.currentUser;
      await this.addUser(this.user.uid);
      console.log('Already signed in with UID (native):', this.user.uid);
    }
  }

  /**
   * Retrieves all user mappings from Firestore.
   * User mappings are stored in the collection: .../MLT_translations_statistics/userMapping/users
   * Each document contains: userId, name, type ('P' or 'U'), createdAt
   */
  public async getUsers(): Promise<UserType[]> {
    // Path: .../MLT_translations_statistics/userMapping/users
    const users: UserType[] = [];
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const usersRef = collection(
        this.firestore,
        `${FireStoreConstants.COLLECTION_TRANSLATIONS}/userMapping/users`,
      );
      const snapshot = await getDocs(usersRef);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.push({
          userId: docSnap.id,
          name: data['name'],
          type: data['type'],
          createdAt: this.getFirestoreDate(data['createdAt']) || new Date(0),
          changedFromName: data['changedFromName'],
          changedAt: this.getFirestoreDate(data['changedAt']),
        });
      });
    } catch (error) {
      console.error('Error loading users from user mapping:', error);
    }
    console.log('Loaded users:', users);
    return users;
  }

  /**
   * Adds a user to the user mapping collection if not already present.
   * Assigns a name in the form "U-<n>" for users or "P-<n>" for programmers.
   * Uses this.utilsService.isProgrammerDevice(userId) to determine type.
   *
   * @param userId The UID of the user to add.
   */
  public async addUser(userId: string) {
    // Path: .../MLT_translations_statistics/userMapping/users
    try {
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      // TODO store path in FireStoreConstants - check all paths
      const userDocRef = doc(
        this.firestore,
        `${FireStoreConstants.COLLECTION_TRANSLATIONS}/userMapping/users/${userId}`,
      );
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        // User already exists in mapping
        return;
      }

      const type: 'P' | 'U' = this.getUserType(userId);
      const name = await this.getNextUserName(type);
      const createdAt = new Date();

      await setDoc(userDocRef, { userId, name, type, createdAt });
      console.log('Added user to user mapping:', userId, name, type, createdAt);
    } catch (error) {
      console.error('Error adding user to user mapping:', error);
    }
  }

  /**
   * Updates the names and types of users based on their device status.
   * Scans all users in the user mapping and reassigns their type ('P' for programmer, 'U' for user)
   * if their device status has changed. Users changing from 'U' to 'P' or vice versa receive updated names
   * with an asterisk suffix (e.g., 'P-5*', 'U-3*') to indicate the change.
   * Only executes if environment.app.myDevicesUpdateUsermap is enabled.
   *
   * @returns Promise<void> Resolves when the update process completes.
   */
  public async updateNameOfProgrammerUsers(): Promise<void> {
    if (!environment.app.myDevicesUpdateUsermap) {
      console.log(
        'Updating programmer device names is disabled in environment.',
      );
      return;
    }
    // Path: .../MLT_translations_statistics/userMapping/users
    const users: UserType[] = [];
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const usersRef = collection(
        this.firestore,
        `${FireStoreConstants.COLLECTION_TRANSLATIONS}/userMapping/users`,
      );
      let { maxNumP, maxNumU } = await this.getMaxUserNameNumber();
      console.log(`maxNumP: ${maxNumP}, maxNumU: ${maxNumU}`);

      const snapshot = await getDocs(usersRef);
      console.log(
        'snapshot data:',
        snapshot.docs.map((doc) => doc.data()),
      );
      snapshot.forEach((docSnap) => {
        const data: UserType = docSnap.data() as UserType;
        const isProgrammerDevice = this.utilsService.isProgrammerDevice(
          data.userId,
        );
        if (isProgrammerDevice && data.type === 'U') {
          // Change from User to Programmer
          const newName = `P-${++maxNumP}*`;
          this.changeUserType(data.userId, 'P', `${newName}`, data.name);
        } else if (!isProgrammerDevice && data.type === 'P') {
          // Change from Programmer to User
          const newName = `U-${++maxNumU}*`;
          this.changeUserType(data.userId, 'U', `${newName}`, data.name);
        }
      });
    } catch (error) {
      console.error('Error loading users from user mapping:', error);
    }
  }

  /**
   * Changes a user's type and name in Firestore, recording the previous name and timestamp.
   * Updates the user document with the new type, name, and metadata about the change.
   *
   * @param userId The UID of the user to update.
   * @param newType The new type for the user ('P' for programmer, 'U' for user).
   * @param newName The new name to assign to the user.
   * @param oldName The previous name of the user, stored for audit purposes.
   * @returns Promise<void> Resolves when the update is complete.
   */
  private async changeUserType(
    userId: string,
    newType: 'P' | 'U',
    newName: string,
    oldName: string,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const userDocRef = doc(
          this.firestore,
          `${FireStoreConstants.COLLECTION_TRANSLATIONS}/userMapping/users/${userId}`,
        );
        await setDoc(
          userDocRef,
          {
            name: newName,
            type: newType,
            changedFromName: oldName,
            changedAt: new Date(),
          },
          { merge: true },
        );
        console.log(
          `Changed user ${userId} to type '${newType}' with name '${newName}' from '${oldName}'`,
        );
        resolve();
      } catch (error) {
        console.error('Error changing user type:', error);
        reject(error);
      }
    });
  }

  /**
   * Determines the user type ('P' for programmer, 'U' for user) based on the userId.
   * @param userId The UID of the user.
   * @returns 'P' if programmer device, otherwise 'U'.
   */
  private getUserType(userId: string): 'P' | 'U' {
    return this.utilsService.isProgrammerDevice(userId) ? 'P' : 'U';
  }

  /**
   * Finds the next available user name for a given type ('P' or 'U'), e.g., 'U-3'.
   * @param type 'P' for programmer, 'U' for user
   * @returns Promise<string> next available name
   */
  private async getNextUserName(type: 'P' | 'U'): Promise<string> {
    const { collection, getDocs, query, where } =
      await import('firebase/firestore');
    const usersRef = collection(
      this.firestore,
      `${FireStoreConstants.COLLECTION_TRANSLATIONS}/userMapping/users`,
    );
    const q = query(usersRef, where('type', '==', type));
    const snapshot = await getDocs(q);
    let maxNum = 0;
    snapshot.forEach((docSnap) => {
      const name = docSnap.data()['name'];
      const match = name?.match(/^([PU])-(\d+)\*?$/);
      if (match?.[1] === type) {
        const num = Number.parseInt(match[2], 10);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `${type}-${nextNum}`;
  }

  /**
   * Retrieves the maximum user name numbers for both programmer ('P') and user ('U') types.
   * Scans all users in the user mapping collection and extracts the numeric portion from their names.
   * Names follow the pattern 'P-<n>' or 'U-<n>', optionally with an asterisk suffix (e.g., 'P-5*').
   *
   * @returns Promise<{ maxNumP: number; maxNumU: number }> An object containing:
   *   - maxNumP: The highest number assigned to a programmer user name (e.g., 5 from 'P-5')
   *   - maxNumU: The highest number assigned to a regular user name (e.g., 3 from 'U-3')
   *   Returns 0 for either if no users of that type exist.
   */
  private async getMaxUserNameNumber(): Promise<{
    maxNumP: number;
    maxNumU: number;
  }> {
    const { collection, getDocs } = await import('firebase/firestore');
    const usersRef = collection(
      this.firestore,
      `${FireStoreConstants.COLLECTION_TRANSLATIONS}/userMapping/users`,
    );

    const snapshot = await getDocs(usersRef);
    let maxNumP = 0;
    let maxNumU = 0;
    snapshot.forEach((docSnap) => {
      const name = docSnap.data()['name'];
      const match = name?.match(/^([PU])-(\d+)\*?$/);
      if (match?.[1] === 'P') {
        const num = Number.parseInt(match[2], 10);
        if (!Number.isNaN(num) && num > maxNumP) {
          maxNumP = num;
        }
      } else if (match?.[1] === 'U') {
        const num = Number.parseInt(match[2], 10);
        if (!Number.isNaN(num) && num > maxNumU) {
          maxNumU = num;
        }
      }
    });
    return { maxNumP, maxNumU };
  }

  /**
   * Ensures the control flags document exists for the current month.
   * If the document is missing, it creates it with default values.
   * Existing values are never overwritten.
   */
  async ensureControlFlagsExist(): Promise<void> {
    try {
      // Path: .../MLT_translations_statistics/{yyyy-mm}/control/control
      const controlDocPath = `${this.monthlyTranslationsMonthDocPath}/control/control`;
      const controlRef = doc(this.firestore, controlDocPath);
      const controlSnap = await getDoc(controlRef);
      if (!controlSnap.exists()) {
        await setDoc(
          controlRef,
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
      console.error('Error ensuring control flags exist:', error);
    }
  }

  async readControlFlags(): Promise<FirestoreControlFlags> {
    try {
      // Path: .../MLT_translations_statistics/{yyyy-mm}/control/control
      const controlDocPath = `${this.monthlyTranslationsMonthDocPath}/control/control`;
      const controlRef = doc(this.firestore, controlDocPath);
      const controlSnap = await getDoc(controlRef);
      if (controlSnap.exists()) {
        const data = controlSnap.data() as FirestoreControlFlags;
        return data || {};
      } else {
        console.error(
          'Control flags do not exist, environment values are used instead.',
        );
        return {};
      }
    } catch (error) {
      console.error('Error reading control flags:', error);
      return {};
    }
  }

  /**
   * Increments the translated character count for the current user and updates device info in Firestore.
   * Also updates the lastUpdated timestamp for both the user and the total statistics document.
   *
   * - Updates the user's document with the incremented character count, device information, and timestamp.
   * - Updates the total statistics document with the incremented character count and timestamp.
   *
   * @param count Number of characters to add to the user's and total translated character counts.
   */
  async addTranslatedChars(count: number) {
    console.log(
      `addTranslatedChars called with count: ${count} for user ${this.user?.uid}`,
    );
    if (!this.user) return;

    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      appVersion: environment.version,
    };

    // update the char count of the user
    // Per-user stats: .../MLT_translations_statistics/{yyyy-mm}/users/{userId}
    try {
      const usageRef = doc(
        this.firestore,
        `${this.monthlyTranslationsMonthDocPath}/users/${this.user.uid}`,
      );
      console.log('Adding', count, 'chars to user', this.user.uid);
      console.log(
        'Adding deviceInfo',
        deviceInfo,
        'to user',
        `${this.monthlyTranslationsMonthDocPath}/users/${this.user.uid}`,
      );
      await setDoc(
        usageRef,
        { charCount: increment(count), lastUpdated: new Date(), ...deviceInfo },
        { merge: true },
      );
    } catch (error) {
      console.error('Error writing user char count document:', error);
    }

    // update the total char count across all users (in a subcollection for even segments)
    try {
      const totalRef = doc(
        this.firestore,
        `${this.monthlyTranslationsMonthDocPath}/total/total`,
      );
      console.log('Adding', count, 'chars to total char count');
      await setDoc(
        totalRef,
        { charCount: increment(count), lastUpdated: new Date() },
        { merge: true },
      );
    } catch (error) {
      console.error('Error writing total char count document:', error);
    }
  }

  /**
   * Retrieves the current translated character count for the user from Firestore.
   * @returns Promise resolving to the user's character count (number).
   */
  async getCharCountForUser(): Promise<number> {
    // Read from .../{yyyy-mm}/users/{userId}
    try {
      if (!this.user) return 0;
      const usageRef = doc(
        this.firestore,
        `${this.monthlyTranslationsMonthDocPath}/users/${this.user.uid}`,
      );
      const usageSnap = await getDoc(usageRef);
      console.log(
        'Fetched char count for user',
        this.user.uid,
        ':',
        usageSnap.data(),
      );
      return usageSnap.exists() ? usageSnap.data()['charCount'] || 0 : 0;
    } catch (error) {
      console.error('Error fetching char count for user:', error);
      return 0;
    }
  }

  /**
   * Retrieves the total number of translated characters across all users for the current month from Firestore.
   * If the total document does not exist (e.g., at the start of a new month), the function returns 0.
   *
   * @returns Promise<number> Resolves to the total translated character count for all users for the current month.
   */
  async getTotalCharCount(): Promise<number> {
    // Read from .../{yyyy-mm}/total/total
    try {
      if (!this.user) return 0;
      const usageRef = doc(
        this.firestore,
        `${this.monthlyTranslationsMonthDocPath}/total/total`,
      );
      const usageSnap = await getDoc(usageRef);
      console.log('Fetched total char count', ':', usageSnap.data());
      return usageSnap.exists() ? usageSnap.data()['charCount'] || 0 : 0;
    } catch (error) {
      console.error('Error fetching total char count:', error);
      return 0;
    }
  }

  /**
   * Checks if translation is stopped for all users by reading the control document at the yyyy-mm level.
   * If the document or property does not exist, defaults to false (not stopped).
   *
   * @returns Promise<boolean> Resolves to true if translation is stopped for all users, false otherwise.
   */
  async isTranslationStoppedForAllUsers(): Promise<boolean> {
    // Read from .../{yyyy-mm}/control/control
    try {
      const controlRef = doc(
        this.firestore,
        `${this.monthlyTranslationsMonthDocPath}/control/control`,
      );
      const controlSnap = await getDoc(controlRef);
      const data = controlSnap.data();
      const stopTranslationForAllUsers = data
        ? data['StopTranslationForAllUsers']
        : undefined;
      return controlSnap.exists()
        ? (stopTranslationForAllUsers ?? false)
        : false;
    } catch (error) {
      console.error('Error checking StopTranslationForAllUsers:', error);
      // Default to not stopped if any error occurs
      return false;
    }
  }

  /**
   * Returns the current authenticated user's UID if available.
   *
   * @returns {string | null} The UID of the current user, or null if not authenticated.
   */
  getCurrentUserId(): string | null {
    return this.user ? this.user.uid : null;
  }

  /**
   * Retrieves statistics for all users for the current month from Firestore.
   * Returns an array of UserStatistics objects.
   */
  async getAllUserStatistics(): Promise<UserStatistics[]> {
    const usersCollectionPath = `${this.monthlyTranslationsMonthDocPath}/users`;
    try {
      // Firestore web SDK: get all docs in collection
      const { collection, getDocs } = await import('firebase/firestore');
      const usersRef = collection(this.firestore, usersCollectionPath);
      const snapshot = await getDocs(usersRef);
      const result: UserStatistics[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        result.push({
          uid: docSnap.id,
          charCount: data['charCount'] || 0,
          lastUpdated: this.getFirestoreDate(data['lastUpdated']),
          userAgent: data['userAgent'],
          platform: data['platform'],
          language: data['language'],
          appVersion: data['appVersion'],
        });
      });
      return result;
    } catch (error) {
      console.error('Error fetching all user statistics:', error);
      return [];
    }
  }

  /**
   * Converts a Firestore Timestamp or compatible value to a JavaScript Date object.
   *
   * Firestore Timestamps may be:
   * - An object with a .toDate() method (standard Firestore Timestamp)
   * - An object with seconds/nanoseconds properties
   * - An ISO string or JS Date-compatible value
   *
   * This function checks the type and converts accordingly, returning a valid JS Date or undefined.
   *
   * @param date Firestore Timestamp, object, or string
   * @returns JavaScript Date object or undefined
   */
  private getFirestoreDate(date: any): Date | undefined {
    let lastUpdated: Date | undefined;
    if (date) {
      if (typeof date.toDate === 'function') {
        lastUpdated = date.toDate();
        console.log('Converting lastUpdated using toDate() to ', lastUpdated);
      } else if (typeof date.seconds === 'number') {
        lastUpdated = new Date(date.seconds * 1000);
        console.log('Converting lastUpdated using seconds to ', lastUpdated);
      } else {
        lastUpdated = new Date(date);
        console.log(
          'Converting lastUpdated using Date constructor to ',
          lastUpdated,
        );
      }
    } else {
      console.log('lastUpdated is null or undefined');
      lastUpdated = undefined;
    }
    return lastUpdated;
  }
}
