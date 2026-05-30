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
  CharCountAndTargetLangsResult,
} from '../shared/firebase-firestore.interfaces';
import { ToastService } from './toast.service';
import { AllMonthsOption, ToastAnchor } from '../shared/enums';
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
  private cachedIsProgrammerDevice: boolean = false;
  private readonly cachedTranslations = new Map<
    string,
    UserTranslationStatistics[]
  >();

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
    this.programmerDeviceRefreshSubject.next();
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
   * Retrieves all user mappings from Firestore for a given month.
   * User mappings are stored in {collection}/userMapping/users
   * Each document contains: userId, name, type ('P' or 'U'), createdAt
   *
   * @param selectedMonth The month for which to retrieve user translation statistics.
   * @returns An array of UserType objects representing users in the user mapping collection for the specified month.
   */
  public async getUsers(selectedMonth: string): Promise<UserType[]> {
    const usersCollectionPath = `${FireStoreConstants.getUserMappingUsersCollectionPath()}`;
    try {
      const usersRef = this.getCollection(usersCollectionPath);
      const snapshot = await runInInjectionContext(this.injector, () =>
        this.getDocs(usersRef)
      );
      const users: UserType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const userCreated = this.getFirestoreDate(data['createdAt']) || null;
        const userCreatedYYYYMM =
          this.utilsService.formatDateTimeFirestoreSearchString(userCreated);
        if (
          selectedMonth === AllMonthsOption.localStorageValue ||            // all months
          userCreatedYYYYMM === selectedMonth ||                            // created in selected month
          this.userHasTranslationsInMonth(data['userId'], selectedMonth)    // has translations in selected month
        ) {
          users.push({
            userId: data['userId'],
            name: data['name'],
            type: data['type'],
            isNative: data['isNative'] || false,
            createdAt: this.getFirestoreDate(data['createdAt'])!,
            lastUpdated:
              this.getFirestoreDate(data['lastUpdated']) || undefined,
            device: data['device'],
            deviceInfo: data['deviceInfo'],
          });
        }
      });
      return users;
    } catch (error) {
      console.error('Error loading users from user mapping:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_LOADING_USERS'
        ),
        ToastAnchor.SettingsPage
      );
      return [];
    }
  }

  private userHasTranslationsInMonth(userId: string, month: string): boolean {
    const translationsForMonth = this.cachedTranslations.get(month);
    if (translationsForMonth) {
      const hasTranslations = translationsForMonth.some(
        (stat) => stat.userId === userId && stat.translatedCharCount > 0
      );
      return hasTranslations;
    }
    return false;
  }

  /**
   * Adds a user to the user mapping collection if not already present.
   * Assigns a name in the form "U-<n>" for users or "P-<n>" for programmers.
   *
   * @param userId The UID of the user to add.
   */
  public async addUser(userId: string) {
    try {
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('addUser')
      );
      await runInInjectionContext(this.injector, () =>
        (callable as any)({
          appId: FireStoreConstants.APP_ID,
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
        ToastAnchor.TranslatePage
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
        (callable as any)({
          appId: FireStoreConstants.APP_ID,
        })
      );
      return result.data.programmerDevices as ProgrammerDeviceUID[];
    } catch (error) {
      console.error('Error getting all programmer devices:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_GETTING_PROGRAMMER_DEVICES'
        ),
        ToastAnchor.TranslatePage
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
        (callable as any)({
          appId: FireStoreConstants.APP_ID,
        })
      );
      return result.data.isProgrammerDevice as boolean;
    } catch (error) {
      console.error('Error getting programmer device status:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_GETTING_PROGRAMMER_DEVICE_STATUS'
        ),
        ToastAnchor.TranslatePage
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
          appId: FireStoreConstants.APP_ID,
          programmerDeviceUIDs: this.getEnvironmentProgrammerDeviceUIDs(),
        })
      );
    } catch (error) {
      console.error('Error updating programmer devices:', error);
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.ERROR_UPDATING_PROGRAMMER_DEVICES'
        ),
        ToastAnchor.TranslatePage
      );
    }
  }

  /**
   * Retrieves a list of programmer device UIDs from the environment configuration.
   * The environment variable should be an array of objects with a single key-value pair,
   * where the key is the device name and the value is the user ID.
   * If updating programmer devices is disabled, returns an empty array.
   */
  private getEnvironmentProgrammerDeviceUIDs(): ProgrammerDeviceUID[] {
    if (!environment.app.programmerDevices.updateUsermap) {
      return [];
    }

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
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('createMissingContingentData')
      );
      await runInInjectionContext(this.injector, () => (callable as any)({
        appId: FireStoreConstants.APP_ID,
      }));
    } catch (error) {
      console.error('Error creating missing contingent data:', error);
      this.toastService.showToast(
        'Error creating missing contingent data.',
        ToastAnchor.TranslatePage
      );
    }
  }

  private getHttpsCallable(functionName: string) {
    return httpsCallable(this.functions, functionName);
  }

  /**
   * Reads the contingent data document for the selected month from Firestore.
   * Retrieves the meta contingent data containing configuration and limits.
   * If the document does not exist, returns an empty object and logs an error.
   *
   * @param selectedMonth The month for which to read the contingent data.
   * @returns Promise<FirestoreContingentData> The contingent data object,
   * or an empty object if not found or on error.
   */
  async readContingentData(
    selectedMonth: string
  ): Promise<FirestoreContingentData> {
    try {
      if (selectedMonth === AllMonthsOption.SelectOptionValue) {
        return {};  // contingent data is not displayed for 'all months' option
      }
      const dataDocPath = `${FireStoreConstants.getMetaContingentDataDocumentPath(
        selectedMonth
      )}`;
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
        ToastAnchor.TranslatePage
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
  async getCharCountAndTargetLangsForUser(): Promise<CharCountAndTargetLangsResult> {
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
      const charCountResult: CharCountAndTargetLangsResult = usageSnap.exists()
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
   * Retrieves the total number of translated characters across all users for the selected month from Firestore.
   * If the total document does not exist (e.g., at the start of a new month), the function returns 0.
   *
   * @param selectedMonth The month for which to retrieve the total character count.
   * @returns Promise<number> Resolves to the total translated character count for all users for the specified month.
   */
  async getTotalCharCount(
    selectedMonth: string | undefined = undefined
  ): Promise<number> {
    try {
      if (!this.user) return 0;
      const usageSnap = await runInInjectionContext(this.injector, () => {
        const usageRef = this.getFirestoreDoc(
          `${FireStoreConstants.getMetaTotalCharsDocumentPath(selectedMonth)}`
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
   * Retrieves translation statistics for all users for the selected month or all months from Firestore.
   *  @param selectedMonth The month for which to retrieve user translation statistics or all for all user translation statistics.
   *  @returns An array of UserTranslationStatistics objects.
   */
  async getAllUserTranslationStatistics(
    selectedMonth: string
  ): Promise<UserTranslationStatistics[]> {
    try {
      let result: UserTranslationStatistics[] = [];

      if (selectedMonth === AllMonthsOption.localStorageValue) {
        const allMonths =
          this.utilsService.getAllFirestoreSearchStringsForMonth();

        for (const month of allMonths) {
          if (month !== AllMonthsOption.localStorageValue) {
            const statsForMonth =
              await this.getAllUserTranslationStatisticsForMonth(month);
            result = result.concat(statsForMonth);
          }
        }
      } else {
        result = await this.getAllUserTranslationStatisticsForMonth(
          selectedMonth
        );
      }
      return result;
    } catch (error) {
      console.error(
        `Error fetching all user statistics for month ${selectedMonth}:`,
        error
      );
      return [];
    }
  }

  /**
   * Retrieves translation statistics for all users for the selected month.
   *  @param selectedMonth The month for which to retrieve user translation statistics.
   *  @returns An array of UserTranslationStatistics objects.
   */
  private async getAllUserTranslationStatisticsForMonth(
    selectedMonth: string
  ): Promise<UserTranslationStatistics[]> {
    try {
      const cachedStatistics =
        this.getCachedTranslationsForPreviousMonth(selectedMonth);
      if (cachedStatistics) {
        return cachedStatistics;
      }
      // get statistics from firestore
      const usersCollectionPath = `${FireStoreConstants.getUsersCollectionPath(
        selectedMonth
      )}`;
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

      this.saveCachedTranslationsForMonth(selectedMonth, result);
      return result;
    } catch (error) {
      console.error(
        `Error fetching all user statistics for month ${selectedMonth}:`,
        error
      );
      return [];
    }
  }

  /**
   * Returns cached translation statistics for a non-current month.
   *
   * The current month is intentionally excluded so fresh data is always
   * loaded from Firestore for ongoing translations.
   *
   * @param month Month key in YYYY-MM format.
   * @returns Cached statistics for the month, or undefined if not cached
   *          or when the requested month is the current month.
   */
  private getCachedTranslationsForPreviousMonth(
    month: string
  ): UserTranslationStatistics[] | undefined {
    const currentMonth = this.utilsService.getCurrentMonth();
    if (currentMonth !== month) {
      const cached = this.cachedTranslations.get(month);
      if (cached) {
        return cached;
      }
    }
    return undefined;
  }

  /**
   * Stores translation statistics in the month cache.
   *
   * Existing entries for the same month are replaced.
   *
   * @param month Month key in YYYY-MM format.
   * @param data Translation statistics to cache for the given month.
   */
  private saveCachedTranslationsForMonth(
    month: string,
    data: UserTranslationStatistics[]
  ): void {
    this.cachedTranslations.set(month, data);
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
