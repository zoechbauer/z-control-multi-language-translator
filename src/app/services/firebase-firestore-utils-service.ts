import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { environment } from 'src/environments/environment';
import { FireStoreConstants } from '../shared/app.constants';
import {
  DisplayedUserContingentData,
  DisplayedUserStatistics,
  FirestoreContingentData,
  StatisticsData,
  UserTranslationStatistics,
} from '../shared/firebase-firestore.interfaces';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseFirestoreUtilsService {
  private readonly statisticsRefreshSubject = new Subject<void>();
  readonly statisticsRefresh$ = this.statisticsRefreshSubject.asObservable();

  constructor(
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly utilsService: UtilsService,
  ) {}

  /**
   * Requests a statistics refresh by emitting a notification to all subscribers.
   *
   * This method triggers the statisticsRefresh$ observable, notifying all components
   * listening to statistics changes that they should refresh their data.
   */
  requestStatisticsRefresh(): void {
    this.statisticsRefreshSubject.next();
  }

  /**
   * Retrieves displayed user statistics from Firestore.
   *
   * Fetches all user translation statistics and user information, then combines them
   * into a single DisplayedUserStatistics array. The results are sorted by last
   * translation date in descending order.
   *
   * @returns {Promise<StatisticsData>} A promise resolving to statistics data containing
   *          displayed user statistics, user translation statistics, and user information.
   */
  async getDisplayedUserStatistics(): Promise<StatisticsData> {
    let statisticsData: StatisticsData = {
      displayedUserStatistics: [],
      userTranslationStatistics: [],
      users: [],
    };

    const userTranslationStatistics: UserTranslationStatistics[] =
      await this.firestoreService.getAllUserTranslationStatistics();
    statisticsData.userTranslationStatistics = userTranslationStatistics;

    statisticsData.users = await this.firestoreService.getUsers();

    statisticsData.users.forEach((user) => {
      const userInfo = statisticsData.users.find(
        (u) => u.userId === user.userId,
      );
      if (!userInfo) {
        console.warn('No user info found for userId:', user.userId);
        return; // Skip if no user info
      }
      const userTranslationInfo = userTranslationStatistics.find(
        (u) => u.userId === user.userId,
      );

      const stat: DisplayedUserStatistics = {
        // user infos
        userId: user.userId,
        userName: userInfo.name,
        userType: userInfo.type,
        userCreatedAt: userInfo.createdAt,
        userLastUpdated: userInfo.lastUpdated || null,
        isNative: userInfo.isNative,
        device: userInfo.device || null,
        deviceInfo: userInfo.deviceInfo || {
          userAgent: '',
          platform: '',
          language: '',
          appVersion: {
            major: 0,
            minor: 0,
            date: '',
          },
        },
        displayedPlatform: this.utilsService.getPlatform(userInfo),
        // translation infos
        translatedCharCount: userTranslationInfo?.translatedCharCount ?? 0,
        targetLanguages: userTranslationInfo?.targetLanguages ?? [],
        lastTranslationDate: userTranslationInfo?.lastTranslationDate ?? null,
      };
      statisticsData.displayedUserStatistics.push(stat);
    });
    statisticsData.displayedUserStatistics.sort(
      (a, b) =>
        (b.lastTranslationDate?.getTime() ?? 0) -
        (a.lastTranslationDate?.getTime() ?? 0),
    ); // Sort by last translation date desc
    return statisticsData;
  }

  /**
   * Retrieves displayed user contingent data for translation limits.
   *
   * Fetches the current translation contingent information for both the current user
   * and all users combined. Automatically refreshes the month context if the month has changed.
   * Calculates available character counts based on configured limits and buffers.
   *
   * @returns {Promise<DisplayedUserContingentData[]>} A promise resolving to an array containing
   *          contingent data for the current user and all users combined.
   */
  async getDisplayedUserContingentData(): Promise<
    DisplayedUserContingentData[]
  > {
    // Auto-refresh month context if the month has changed
    await this.autrefreshMonthContextIfNeeded();
    // Read all control flags from Firestore
    const contingentData: FirestoreContingentData =
      await this.firestoreService.readContingentData();
    const displayedContingentData: DisplayedUserContingentData[] = [];
    // calculate data for current user
    const { charCount: userCharCount = 0 } =
      await this.firestoreService.getCharCountForUser();
    const limit =
      contingentData.maxFreeTranslateCharsPerMonthForUser ??
      environment.app.maxFreeTranslateCharsPerMonthForUser;
    let availableCharCountCurrentMonth = Math.max(0, limit - userCharCount);
    const currentUserContingentData: DisplayedUserContingentData = {
      userNameKey: 'TRANSLATE_STATISTICS.CARD.GRID.USER_NAME_YOU',
      translatedCharCountCurrentMonth: userCharCount,
      freeTranslateCharsPerMonth: limit,
      availableCharCountCurrentMonth: availableCharCountCurrentMonth,
    };
    displayedContingentData.push(currentUserContingentData);

    // calculate data for all users
    const totalCharCount = await this.firestoreService.getTotalCharCount();
    const totalLimit =
      contingentData.maxFreeTranslateCharsPerMonth ??
      environment.app.maxFreeTranslateCharsPerMonth;
    const totalBuffer =
      contingentData.maxFreeTranslateCharsBufferPerMonth ??
      environment.app.maxFreeTranslateCharsBufferPerMonth;
    availableCharCountCurrentMonth = Math.max(
      0,
      totalLimit - totalBuffer - totalCharCount,
    );
    const allUserContingentData: DisplayedUserContingentData = {
      userNameKey: 'TRANSLATE_STATISTICS.CARD.GRID.USER_NAME_ALL',
      translatedCharCountCurrentMonth: totalCharCount,
      freeTranslateCharsPerMonth: totalLimit - totalBuffer,
      availableCharCountCurrentMonth: availableCharCountCurrentMonth,
    };
    displayedContingentData.push(allUserContingentData);
    return displayedContingentData;
  }

  /**
   * Checks if the translation contingent has been exceeded.
   *
   * If translation simulation is enabled, it returns false to allow unlimited translations
   * for testing and development purposes without affecting real usage data.
   *
   * This method auto-refreshes the month context if the month has changed, then verifies, in order:
   * 1. If translation is globally stopped for all users.
   * 2. If the total contingent for all users is exceeded.
   * 3. If the contingent for the current user is exceeded.
   * Returns true if any of these conditions are met, otherwise false.
   *
   * Note: these checks are also implemented in the Firebase Functions backend for security.
   */
  async isContingentExceeded(): Promise<boolean> {
    // return false if translation simulation is enabled
    // (used for testing and development without affecting real usage data)
    if (environment.app.simulateTranslation) {
      return false;
    }

    // Auto-refresh month context if the month has changed
    await this.autrefreshMonthContextIfNeeded();

    // Read all control flags from Firestore
    const flags: FirestoreContingentData =
      await this.firestoreService.readContingentData();

    // 1. If translation is globally stopped for all users
    if (flags.StopTranslationForAllUsers) {
      return true;
    }
    // 2. If the total contingent for all users is exceeded
    if (await this.isTotalContingentExceeded(flags)) {
      return true;
    }
    // 3. If the contingent for the current user is exceeded
    if (await this.isContingentForUserExceeded(flags)) {
      return true;
    }
    return false;
  }

  private async isContingentForUserExceeded(
    flags: FirestoreContingentData,
  ): Promise<boolean> {
    const limit =
      flags.maxFreeTranslateCharsPerMonthForUser ??
      environment.app.maxFreeTranslateCharsPerMonthForUser;
    const { charCount = 0 } = await this.firestoreService.getCharCountForUser();
    return charCount >= limit;
  }

  private async isTotalContingentExceeded(
    flags: FirestoreContingentData,
  ): Promise<boolean> {
    const limit =
      flags.maxFreeTranslateCharsPerMonth ??
      environment.app.maxFreeTranslateCharsPerMonth;
    const buffer =
      flags.maxFreeTranslateCharsBufferPerMonth ??
      environment.app.maxFreeTranslateCharsBufferPerMonth;
    const charCount = await this.firestoreService.getTotalCharCount();
    return charCount >= limit - buffer;
  }

  // Auto-refresh month context if the month has changed
  private async autrefreshMonthContextIfNeeded(): Promise<void> {
    const currentMonth =
      this.firestoreService['monthlyTranslationsMonthDocPath'];
    const expectedMonth = `${
      FireStoreConstants.COLLECTION_TRANSLATIONS
    }/${FireStoreConstants.currentYearMonthPath()}`;
    if (currentMonth !== expectedMonth) {
      console.log(
        'Month has changed. Re-initializing FirestoreService for new month context.',
      );
      await this.firestoreService.init();
    }
  }
}
