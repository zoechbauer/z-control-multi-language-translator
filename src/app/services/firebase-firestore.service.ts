import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import * as angularFireAuth from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  getDocs,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Subject } from 'rxjs';

import { environment } from 'src/environments/environment';
import { FireStoreConstants } from '../shared/app.constants';
import { UtilsService } from './utils.service';
import { LocalStorageService } from './local-storage.service';
import {
  FirestoreContingentData,
  UserTranslationStatistics,
  UserType,
  ProgrammerDeviceUID,
  DeviceInfo,
  CharCountResult,
} from '../shared/firebase-firestore.interfaces';
import { ToastService } from './toast.service';
import { ToastAnchor } from '../shared/enums';
import { TranslateService } from '@ngx-translate/core';
import { FirebaseFirestoreAuthWrapperService } from './firebase-firestore-auth-wrapper.service';
import { DeviceUtils } from './device-utils.service';

@Injectable({ providedIn: 'root' })
export class FirebaseFirestoreService {
  private readonly programmerDeviceRefreshSubject = new Subject<void>();
  readonly programmerDeviceRefresh$ =
    this.programmerDeviceRefreshSubject.asObservable();

  private readonly injector: Injector;
  private user!: angularFireAuth.User;
  private readonly monthlyTranslationsMonthDocPath = `${
    FireStoreConstants.COLLECTION_TRANSLATIONS
  }/${FireStoreConstants.currentYearMonthPath()}`;
  private cachedIsProgrammerDevice: boolean = false;

  constructor(
    private readonly auth: angularFireAuth.Auth,
    private readonly authWrapper: FirebaseFirestoreAuthWrapperService,
    private readonly translate: TranslateService,
    private readonly firestore: Firestore,
    private readonly functions: Functions,
    private readonly utilsService: UtilsService,
    private readonly localStorageService: LocalStorageService,
    private readonly toastService: ToastService
  ) {
    this.injector = inject(Injector);
  }

  get isProgrammerDevice(): boolean {
    return this.cachedIsProgrammerDevice;
  }

  /**
   * Initializes the Firestore service.
   * Currently, it authenticates the user and sets up user mapping and control flags.
   */
  async init() {
    await this.authenticateUser();
    this.cachedIsProgrammerDevice = await this.getIsProgrammerDevice();
  }

  /**
   * Authenticates the user and sets up user mapping and control flags for web and native platforms.
   *
   * - First waits until Firebase Auth state restoration is complete, so browser refresh does not
   *   accidentally create a new anonymous UID.
   * - On web: Uses Firebase Auth as the source of truth. If a persisted user exists, it reuses that
   *   user and updates local storage with the same UID. If no user exists, it signs in anonymously.
   * - On native: Uses Firebase Auth persistence and signs in anonymously only when needed.
   *
   * After authentication, it ensures backend control data is initialized and programmer-device
   * mapping is updated.
   */
  private async authenticateUser() {
    // Wait until Firebase Auth persistence restore finishes.
    // Otherwise, currentUser can be temporarily null right after browser refresh,
    // which can create a new anonymous UID unnecessarily.
    await this.waitForAuthReady();
    try {
      if (!this.utilsService.isNative) {
        // Web: Use Firebase Auth as source of truth (not localStorage UID).
        if (this.auth.currentUser) {
          this.user = this.auth.currentUser;
          if (this.user?.uid) {
            await runInInjectionContext(this.injector, () =>
              this.addUser(this.user.uid)
            );
            await this.saveUserIdToLocalStorage(this.user.uid);
          }
        } else {
          // No restored session available -> sign in anonymously once.
          await runInInjectionContext(this.injector, () =>
            this.signInAnonymously()
          );
        }

        // Optional: force token refresh once before callable functions
        // to reduce "unauthenticated" races for very early calls.
        if (this.auth.currentUser) {
          await this.auth.currentUser.getIdToken(true);
        }

        await runInInjectionContext(this.injector, () =>
          this.createMissingContingentData()
        );
        await runInInjectionContext(this.injector, () =>
          this.updateProgrammerDeviceUIDs()
        );
      } else {
        // Native: Always use Firebase Auth
        await runInInjectionContext(this.injector, () =>
          this.signInAnonymously()
        );
        await runInInjectionContext(this.injector, () =>
          this.createMissingContingentData()
        );
        await runInInjectionContext(this.injector, () =>
          this.updateProgrammerDeviceUIDs()
        );
      }
    } catch (error) {
      console.error('Error during Firebase authentication:', error);
    }
  }

  /**
   * Waits for Firebase Auth state restoration to complete.
   * Uses authStateReady() when available, falls back to one-shot onAuthStateChanged.
   */
  private async waitForAuthReady(): Promise<void> {
    const authAny = this.auth as any;
    if (typeof authAny.authStateReady === 'function') {
      await authAny.authStateReady();
      return;
    }

    await new Promise<void>((resolve) => {
      const unsub = this.authWrapper.onAuthStateChanged(this.auth, () => {
        unsub();
        resolve();
      });
      // Safety fallback to avoid hanging if callback never fires
      setTimeout(() => {
        unsub();
        resolve();
      }, 3000);
    });
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
      const result = await runInInjectionContext(this.injector, () =>
        this.authWrapper.signInAnonymously(this.auth)
      );
      this.user = (result as any).user;
      if (this.user?.uid) {
        await runInInjectionContext(this.injector, () =>
          this.addUser(this.user.uid)
        );
      }
    } else {
      this.user = this.auth.currentUser;
      if (this.user?.uid) {
        await runInInjectionContext(this.injector, () =>
          this.addUser(this.user.uid)
        );
      }
    }
    this.saveUserIdToLocalStorage(this.user.uid);
  }

  /**
   * Saves the authenticated user's UID to localStorage using the LocalStorageService.
   * This allows the web version to restore the same user on page refresh instead of creating a new anonymous user.
   * On native platforms, Firebase Auth handles persistence, so this is primarily for web usage.
   * This enables marking the current user in the statistics grid.
   *
   * @param uid The UID of the authenticated user to save to localStorage
   */
  private async saveUserIdToLocalStorage(uid: string): Promise<void> {
    try {
      await runInInjectionContext(this.injector, () =>
        this.localStorageService.saveFirestoreUid(uid)
      );
    } catch (error) {
      console.error('Error saving user UID to localStorage:', error);
    }
  }

  /**
   * Retrieves all user mappings from Firestore.
   * User mappings are stored in the collection: .../MLT_translations_statistics/userMapping/users
   * Each document contains: userId, name, type ('P' or 'U'), createdAt
   */
  public async getUsers(): Promise<UserType[]> {
    // Path: .../MLT_translations_statistics/userMapping/users
    const usersCollectionPath = `${FireStoreConstants.getUserMappingUsersCollectionPath()}`;
    try {
      const usersRef = this.getCollection(usersCollectionPath);
      const snapshot = await runInInjectionContext(this.injector, () =>
        this.getDocs(usersRef)
      );
      const users: UserType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.push({
          userId: data['userId'],
          name: data['name'],
          type: data['type'],
          isNative: data['isNative'] || false,
          createdAt: this.getFirestoreDate(data['createdAt'])!,
          lastUpdated: this.getFirestoreDate(data['lastUpdated']) || undefined,
          device: data['device'],
          deviceInfo: data['deviceInfo'],
        });
      });
      return users;
    } catch (error) {
      console.error('Error loading users from user mapping:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_LOADING_USERS'
        ),
        ToastAnchor.SETTINGS_PAGE
      );
      return [];
    }
  }

  /**
   * Adds a user to the user mapping collection if not already present.
   * Assigns a name in the form "U-<n>" for users or "P-<n>" for programmers.
   *
   * @param userId The UID of the user to add.
   */
  public async addUser(userId: string) {
    // Path: .../MLT_translations_statistics/userMapping/users
    try {
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('addUser')
      );
      await runInInjectionContext(this.injector, () =>
        (callable as any)({
          userId,
          programmerDeviceUIDs: this.getEnvironmentProgrammerDeviceUIDs(),
          deviceInfo: this.deviceInfo,
          isNative: this.utilsService.isNative,
        })
      );
    } catch (error) {
      console.error('Error adding user:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_ADDING_USER'
        ),
        ToastAnchor.TRANSLATE_PAGE
      );
    }
  }

  private get deviceInfo(): DeviceInfo {
    return DeviceUtils.getDeviceInfo();
  }

  /**
   * Fetches all programmer device UIDs from Firestore via Cloud Function.
   * Result is cached during initialization for synchronous access.
   */
  public async getProgrammerDeviceUIDs(): Promise<ProgrammerDeviceUID[]> {
    try {
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('getProgrammerDeviceUIDs')
      );
      const result = await runInInjectionContext(this.injector, () =>
        (callable as any)({})
      );
      return result.data.programmerDevices as ProgrammerDeviceUID[];
    } catch (error) {
      console.error('Error getting all programmer devices:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_GETTING_PROGRAMMER_DEVICES'
        ),
        ToastAnchor.TRANSLATE_PAGE
      );
      return [];
    }
  }

  public async getIsProgrammerDevice(): Promise<boolean> {
    try {
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('isProgrammerDevice')
      );
      const result = await runInInjectionContext(this.injector, () =>
        (callable as any)({})
      );
      this.programmerDeviceRefreshSubject.next();
      return result.data.isProgrammerDevice as boolean;
    } catch (error) {
      console.error('Error getting programmer device status:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_GETTING_PROGRAMMER_DEVICE_STATUS'
        ),
        ToastAnchor.TRANSLATE_PAGE
      );
      return false;
    }
  }

  /**
   * Updates the programmer device UIDs in Firestore by calling a backend Cloud Function.
   * Retrieves the list of programmer devices from environment configuration and sends it to the
   * 'updateProgrammerDeviceUIDs' Cloud Function for processing.
   *
   * If updating programmer devices is disabled in the environment configuration,
   * the function logs a message and returns early without making any updates.
   *
   * On error, logs the error and displays a toast notification to the user.
   *
   * @returns Promise<void> Resolves when the update completes or is skipped.
   */
  public async updateProgrammerDeviceUIDs(): Promise<void> {
    if (!environment.app.programmerDevices.updateUsermap) {
      return;
    }

    try {
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('updateProgrammerDeviceUIDs')
      );
      await runInInjectionContext(this.injector, () =>
        (callable as any)({
          programmerDeviceUIDs: this.getEnvironmentProgrammerDeviceUIDs(),
        })
      );
    } catch (error) {
      console.error('Error updating programmer devices:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_UPDATING_PROGRAMMER_DEVICES'
        ),
        ToastAnchor.TRANSLATE_PAGE
      );
    }
  }

  private getEnvironmentProgrammerDeviceUIDs(): ProgrammerDeviceUID[] {
    const programmerDeviceUIDs: ProgrammerDeviceUID[] = [];
    const devices = environment.app.programmerDevices.devices;

    devices.forEach((deviceObj) => {
      const userId = Object.values(deviceObj)[0];
      const name = Object.keys(deviceObj)[0];
      const devObject: ProgrammerDeviceUID = { userId, name };
      programmerDeviceUIDs.push(devObject);
    });
    return programmerDeviceUIDs;
  }

  /**
   * Ensures the contingent data document exists for the current month.
   * If the document is missing, it creates it with default values.
   * Existing values are never overwritten.
   *
   * Note: This method is also invoked by the Firebase Functions backend
   * when validating contingent limits for additional safety.
   */
  async createMissingContingentData(): Promise<void> {
    try {
      // Path: .../MLT_translations_statistics/{yyyy-mm}/meta/contingentData
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('createMissingContingentData')
      );
      await runInInjectionContext(this.injector, () => (callable as any)({}));
    } catch (error) {
      console.error('Error creating missing contingent data:', error);
      this.toastService.showToast(
        'Error creating missing contingent data.',
        ToastAnchor.TRANSLATE_PAGE
      );
    }
  }

  private getHttpsCallable(functionName: string) {
    return httpsCallable(this.functions, functionName);
  }

  /**
   * Reads the contingent data document for the current month from Firestore.
   * Retrieves the meta contingent data containing configuration and limits.
   * If the document does not exist, returns an empty object and logs an error.
   *
   * @returns Promise<FirestoreContingentData> The contingent data object,
   * or an empty object if not found or on error.
   */
  async readContingentData(): Promise<FirestoreContingentData> {
    try {
      // Path: .../MLT_translations_statistics/{yyyy-mm}/control/control
      const dataDocPath = `${FireStoreConstants.getMetaContingentDataDocumentPath()}`;
      const dataSnap = await runInInjectionContext(this.injector, () => {
        const dataRef = this.getFirestoreDoc(dataDocPath);
        return this.getFirestoreDocSnapshot(dataRef);
      });
      if ((dataSnap as any).exists()) {
        const data = (dataSnap as any).data() as FirestoreContingentData;
        return data || {};
      } else {
        return {};
      }
    } catch (error) {
      console.error('Error reading contingent data:', error);
      this.toastService.showToast(
        'Error reading contingent data.',
        ToastAnchor.TRANSLATE_PAGE
      );
      return {};
    }
  }

  private getFirestoreDoc(path: string): DocumentReference<DocumentData> {
    return doc(this.firestore, path);
  }

  private getFirestoreDocSnapshot(
    docRef: DocumentReference<DocumentData>
  ): Promise<DocumentSnapshot<DocumentData>> {
    return getDoc(docRef);
  }

  /**
   * Retrieves the current character count and last selected target languages for the authenticated user from Firestore.
   * @returns Promise resolving to the user's current character count and target languages.
   */
  async getCharCountForUser(): Promise<CharCountResult> {
    try {
      if (!this.user) {
        return { charCount: 0, targetLanguages: [] };
      }
      const usageSnap = await runInInjectionContext(this.injector, () => {
        const usageRef = this.getFirestoreDoc(
          `${FireStoreConstants.getUsersCollectionPath()}/${this.user.uid}`
        );
        return this.getFirestoreDocSnapshot(usageRef);
      });
      const charCountResult: CharCountResult = usageSnap.exists()
        ? {
            charCount: (usageSnap.data() as any)['charCount'] || 0,
            targetLanguages: (usageSnap.data() as any)['targetLanguages'] || [],
          }
        : { charCount: 0, targetLanguages: [] };
      return charCountResult;
    } catch (error) {
      console.error('Error fetching char count for user:', error);
      return { charCount: 0, targetLanguages: [] };
    }
  }

  /**
   * Retrieves the total number of translated characters across all users for the current month from Firestore.
   * If the total document does not exist (e.g., at the start of a new month), the function returns 0.
   *
   * @returns Promise<number> Resolves to the total translated character count for all users for the current month.
   */
  async getTotalCharCount(): Promise<number> {
    try {
      if (!this.user) return 0;
      const usageSnap = await runInInjectionContext(this.injector, () => {
        const usageRef = this.getFirestoreDoc(
          `${FireStoreConstants.getMetaTotalCharsDocumentPath()}`
        );
        return this.getFirestoreDocSnapshot(usageRef);
      });
      return usageSnap.exists() ? usageSnap.data()['charCount'] || 0 : 0;
    } catch (error) {
      console.error('Error fetching total char count:', error);
      return 0;
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
   * Retrieves translation statistics for all users for the current month from Firestore.
   * Returns an array of UserTranslationStatistics objects.
   */
  async getAllUserTranslationStatistics(): Promise<
    UserTranslationStatistics[]
  > {
    const usersCollectionPath = `${this.monthlyTranslationsMonthDocPath}/users`;
    try {
      const usersRef = this.getCollection(usersCollectionPath);
      const snapshot = await runInInjectionContext(this.injector, () =>
        this.getDocs(usersRef)
      );
      const result: UserTranslationStatistics[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        result.push({
          userId: docSnap.id,
          translatedCharCount: data['charCount'] || 0,
          targetLanguages: data['targetLanguages'] || [],
          lastTranslationDate: this.getFirestoreDate(data['lastUpdated']),
        });
      });
      return result;
    } catch (error) {
      console.error('Error fetching all user statistics:', error);
      return [];
    }
  }

  private getCollection(path: string) {
    return runInInjectionContext(this.injector, () =>
      collection(this.firestore, path)
    );
  }

  private getDocs(
    collectionRef: ReturnType<FirebaseFirestoreService['getCollection']>
  ): Promise<QuerySnapshot<DocumentData>> {
    return runInInjectionContext(this.injector, () => getDocs(collectionRef));
  }

  /**
   * Converts Firestore-like timestamp values into a valid JavaScript Date.
   *
   * Supported input shapes:
   * - null/undefined -> undefined
   * - object with toDate(): Date (Firestore Timestamp-like)
   * - object with seconds: number (Unix timestamp in seconds)
   * - Date, string, or number parseable by new Date(...)
   *
   * Returns undefined for unsupported or invalid date values
   * (for example, invalid date strings or invalid Date objects).
   *
   * @param date Value to convert (Firestore timestamp-like value or Date input)
   * @returns Valid JavaScript Date or undefined if conversion is not possible
   */
  private getFirestoreDate(date: unknown): Date | undefined {
    if (date == null) {
      return undefined;
    }

    // Firestore Timestamp-like object: { toDate(): Date }
    if (
      typeof date === 'object' &&
      date !== null &&
      'toDate' in date &&
      typeof (date as { toDate: unknown }).toDate === 'function'
    ) {
      const converted = (date as { toDate: () => unknown }).toDate();
      if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
        return converted;
      } else {
        return undefined;
      }
    }

    // Firestore Timestamp-like object: { seconds: number }
    if (
      typeof date === 'object' &&
      date !== null &&
      'seconds' in date &&
      typeof (date as { seconds: unknown }).seconds === 'number'
    ) {
      const fromSeconds = new Date(
        (date as { seconds: number }).seconds * 1000
      );
      return Number.isNaN(fromSeconds.getTime()) ? undefined : fromSeconds;
    }

    // Fallback for ISO/date strings, numbers, Date, etc.
    const parsed = new Date(date as string | number | Date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
