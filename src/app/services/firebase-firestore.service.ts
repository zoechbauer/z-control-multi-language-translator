import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Auth, onAuthStateChanged, signInAnonymously, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { collection, getDocs } from 'firebase/firestore';
import { firstValueFrom, Subject } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class FirebaseFirestoreService {
  private readonly programmerDeviceRefreshSubject = new Subject<void>();
  readonly programmerDeviceRefresh$ =
    this.programmerDeviceRefreshSubject.asObservable();

  private readonly injector: Injector;
  private user!: User;
  private readonly monthlyTranslationsMonthDocPath = `${
    FireStoreConstants.COLLECTION_TRANSLATIONS
  }/${FireStoreConstants.currentYearMonthPath()}`;
  private cachedIsProgrammerDevice: boolean = false;

  constructor(
    private readonly auth: Auth,
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
      const unsub = onAuthStateChanged(this.auth, () => {
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
        signInAnonymously(this.auth)
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
    const users: UserType[] = [];
    try {
      const usersRef = collection(
        this.firestore,
        `${FireStoreConstants.getUserMappingUsersCollectionPath()}`
      );
      const snapshot = await runInInjectionContext(this.injector, () =>
        getDocs(usersRef)
      );
      (snapshot as any).forEach((docSnap: any) => {
        const data = docSnap.data();
        users.push({
          userId: docSnap.id,
          name: data['name'],
          type: data['type'],
          isNative: data['isNative'] || false,
          createdAt: this.getFirestoreDate(data['createdAt'])!,
          lastUpdated: this.getFirestoreDate(data['lastUpdated']) || undefined,
          device: data['device'],
          deviceInfo: data['deviceInfo'],
        });
      });
    } catch (error) {
      console.error('Error loading users from user mapping:', error);
    }
    return users;
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
        httpsCallable(this.functions, 'addUser')
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
    return this.utilsService.getDeviceInfo();
  }

  /**
   * Fetches all programmer device UIDs from Firestore via Cloud Function.
   * Result is cached during initialization for synchronous access.
   */
  public async getProgrammerDeviceUIDs(): Promise<ProgrammerDeviceUID[]> {
    try {
      const callable = runInInjectionContext(this.injector, () =>
        httpsCallable(this.functions, 'getProgrammerDeviceUIDs')
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
        httpsCallable(this.functions, 'isProgrammerDevice')
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
        httpsCallable(this.functions, 'updateProgrammerDeviceUIDs')
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
        httpsCallable(this.functions, 'createMissingContingentData')
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
        const dataRef = doc(this.firestore, dataDocPath);
        return getDoc(dataRef);
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
        const usageRef = doc(
          this.firestore,
          `${FireStoreConstants.getUsersCollectionPath()}/${this.user.uid}`
        );
        return getDoc(usageRef);
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
        const usageRef = doc(
          this.firestore,
          `${FireStoreConstants.getMetaTotalCharsDocumentPath()}`
        );
        return getDoc(usageRef);
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
      // Firestore web SDK: get all docs in collection
      const usersRef = collection(this.firestore, usersCollectionPath);
      const snapshot = await runInInjectionContext(this.injector, () =>
        getDocs(usersRef)
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
      } else if (typeof date.seconds === 'number') {
        lastUpdated = new Date(date.seconds * 1000);
      } else {
        lastUpdated = new Date(date);
      }
    } else {
      lastUpdated = undefined;
    }
    return lastUpdated;
  }
}
