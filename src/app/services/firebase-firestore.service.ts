export interface FirestoreControlFlags {
  StopTranslationForAllUsers?: boolean;
  maxFreeTranslateCharsPerMonthForUser?: number;
  maxFreeTranslateCharsPerMonth?: number;
  maxFreeTranslateCharsBufferPerMonth?: number;
}

import { Injectable } from '@angular/core';
import { Auth, signInAnonymously, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { increment } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { FireStoreConstants } from '../shared/app.constants';
import { UtilsService } from './utils.service';

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
  ) {}

  /**
   * Initializes the Firebase authentication for the user.
   * Signs in anonymously if not already signed in and sets the user property.
   */
  async init() {
    try {
      // Sign in anonymously if not already signed in
      if (!this.auth.currentUser) {
        const result = await signInAnonymously(this.auth);
        this.user = result.user;
        console.log('Signed in anonymously with UID:', this.user.uid);
      } else {
        this.user = this.auth.currentUser;
        console.log('Already signed in with UID:', this.user.uid);
      }
      await this.ensureControlFlagsExist();
    } catch (error) {
      console.error('Error during Firebase init:', error);
    }
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
}
