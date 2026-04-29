import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { environment } from 'src/environments/environment';
import {
  DisplayedUserContingentData,
  DisplayedUserStatistics,
  FirestoreContingentData,
  StatisticsData,
  UserStatisticsSummary,
  UserTranslationStatistics,
} from '../shared/firebase-firestore.interfaces';
import { LocalStorageService } from './local-storage.service';
import {
  AllMonthsOption,
  DisplayMode,
  StatisticsSummaryCategory,
  StatisticsSummaryName,
} from '../shared/enums';
import { DeviceUtils } from './device-utils.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseFirestoreUtilsService {
  private readonly statisticsRefreshSubject = new Subject<void>();
  readonly statisticsRefresh$ = this.statisticsRefreshSubject.asObservable();
  private statisticsDisplayMode: DisplayMode = DisplayMode.User;
  private statisticsSelectedMonth: string = '';

  constructor(
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly localStorageService: LocalStorageService,
    private readonly utilsService: UtilsService
  ) {
    this.firestoreService.programmerDeviceRefresh$.subscribe(() => {
      this.localStorageService
        .getStatisticsDisplayMode()
        .then((mode: DisplayMode) => {
          this.statisticsDisplayMode = mode;
        });
      this.localStorageService
        .getStatisticsSelectedMonth()
        .then((month: string) => {
          this.statisticsSelectedMonth = month;
        });
    });
  }

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
   * Fetches all user translation statistics and user information for the selected month
   * (or all months), then aggregates and combines them into a StatisticsData result.
   *
   * When the same userId appears in multiple records (e.g. across months), the records
   * are aggregated: char counts are summed, target languages are unioned, and the latest
   * translation date is kept.
   *
   * Users with no translation activity (translatedCharCount === 0) are excluded unless
   * the display mode is Programmer. Results are sorted by last translation date descending,
   * with ties broken by user creation date descending.
   *
   * On a programmer device, programmer device UIDs are also fetched and included.
   *
   * @returns {Promise<StatisticsData>} A promise resolving to statistics data containing
   *          displayed user statistics, raw user translation statistics, all users,
   *          and programmer device UIDs (empty if not a programmer device).
   */
  async getDisplayedUserStatistics(): Promise<StatisticsData> {
    let statisticsData: StatisticsData = {
      displayedUserStatistics: [],
      userTranslationStatistics: [],
      users: [],
      programmerDeviceUIDs: [],
    };

    this.statisticsDisplayMode =
      await this.localStorageService.getStatisticsDisplayMode();

    this.statisticsSelectedMonth =
      await this.localStorageService.getStatisticsSelectedMonth(
        AllMonthsOption.localStorageValue
      );

    const userTranslationStatistics: UserTranslationStatistics[] =
      await this.firestoreService.getAllUserTranslationStatistics(
        this.statisticsSelectedMonth
      );

    statisticsData.userTranslationStatistics = userTranslationStatistics;

    statisticsData.users = await this.firestoreService.getUsers(
      this.statisticsSelectedMonth
    );

    if (this.firestoreService.isProgrammerDevice) {
      statisticsData.programmerDeviceUIDs =
        await this.firestoreService.getProgrammerDeviceUIDs();
    }

    statisticsData.users.forEach((userInfo) => {
      const userTranslationInfos = userTranslationStatistics.filter(
        (u) => u.userId === userInfo.userId
      );

      const aggregatedTranslationInfo: UserTranslationStatistics | undefined =
        userTranslationInfos.length > 0
          ? {
              userId: userInfo.userId,
              translatedCharCount: userTranslationInfos.reduce(
                (sum, info) => sum + (info.translatedCharCount || 0),
                0
              ),
              targetLanguages: Array.from(
                new Set(
                  userTranslationInfos.reduce<string[]>(
                    (allLanguages, info) =>
                      allLanguages.concat(info.targetLanguages || []),
                    []
                  )
                )
              ),
              lastTranslationDate: userTranslationInfos.reduce<
                Date | undefined
              >((latest, info) => {
                const current = info.lastTranslationDate;
                /* istanbul ignore next */
                if (!current) return latest;
                if (!latest || current.getTime() > latest.getTime()) {
                  return current;
                }
                /* istanbul ignore next */
                return latest;
              }, undefined),
            }
          : undefined;

      const stat: DisplayedUserStatistics = {
        userId: userInfo.userId,
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
        displayedPlatform: DeviceUtils.getWebPlatform(userInfo),
        displayedModel: DeviceUtils.getModel(userInfo),
        translatedCharCount:
          aggregatedTranslationInfo?.translatedCharCount ?? 0,
        targetLanguages: aggregatedTranslationInfo?.targetLanguages ?? [],
        lastTranslationDate:
          aggregatedTranslationInfo?.lastTranslationDate ?? null,
      };

      if (
        this.statisticsDisplayMode === DisplayMode.Programmer ||
        stat.translatedCharCount > 0
      ) {
        statisticsData.displayedUserStatistics.push(stat);
      }
    });

    statisticsData.displayedUserStatistics.sort(
      (a, b) =>
        (b.lastTranslationDate?.getTime() ?? 0) -
          (a.lastTranslationDate?.getTime() ?? 0) ||
        (b.userCreatedAt?.getTime() ?? 0) - (a.userCreatedAt?.getTime() ?? 0)
    ); // Sort by last translation date desc and userCreatedAt desc
    return statisticsData;
  }

  /**
   * Builds an aggregated statistics summary for display in the admin statistics view.
   *
   * Creates summary rows in this order:
   * 1. User type (Programmer/User)
   * 2. Platform (native/webmobile/webdesktop)
   * 3. Device model
   * 4. Target language count (1-5)
   *
   * Each row includes:
   * - countTranslations: users with translatedCharCount > 0
   * - countRegistrations: users with translatedCharCount === 0
   *
   * @param statisticsData The list of displayed user statistics used as input.
   * @returns A flattened array of summary rows grouped by category.
   */
  getUserStatisticsSummary(
    statisticsData: DisplayedUserStatistics[]
  ): UserStatisticsSummary[] {
    let statsSummary: UserStatisticsSummary[] = [];
    let rows: UserStatisticsSummary[];

    // user type summary rows
    rows = this.createStatisticsSummaryUserTypeRows(
      StatisticsSummaryCategory.UserType,
      statisticsData
    );
    statsSummary.push(...rows);

    // platform summary rows
    rows = this.createStatisticsSummaryPlatformRows(
      StatisticsSummaryCategory.Platform,
      statisticsData
    );
    statsSummary.push(...rows);

    // device model summary rows
    rows = this.createStatisticsSummaryModelRows(
      StatisticsSummaryCategory.Model,
      statisticsData
    );
    statsSummary.push(...rows);

    // target languages summary rows
    rows = this.createStatisticsSummaryLanguagesRows(
      StatisticsSummaryCategory.Languages,
      statisticsData
    );
    statsSummary.push(...rows);

    return statsSummary;
  }

  /**
   * Creates summary rows grouped by user type (Programmer/User).
   *
   * @param category Summary category label for the generated rows.
   * @param statisticsData Source user statistics.
   * @returns Summary rows for each user type.
   */
  private createStatisticsSummaryUserTypeRows(
    category: StatisticsSummaryCategory,
    statisticsData: DisplayedUserStatistics[]
  ): UserStatisticsSummary[] {
    const types = [
      StatisticsSummaryName.Programmer,
      StatisticsSummaryName.User,
    ];

    return this.buildStatisticsSummaryRows(category, types, statisticsData);
  }

  /**
   * Creates summary rows grouped by platform (native/webmobile/webdesktop).
   *
   * @param category Summary category label for the generated rows.
   * @param statisticsData Source user statistics.
   * @returns Summary rows for each platform.
   */
  private createStatisticsSummaryPlatformRows(
    category: StatisticsSummaryCategory,
    statisticsData: DisplayedUserStatistics[]
  ): UserStatisticsSummary[] {
    const types = [
      StatisticsSummaryName.Native,
      StatisticsSummaryName.WebMobile,
      StatisticsSummaryName.WebDesktop,
    ];

    return this.buildStatisticsSummaryRows(category, types, statisticsData);
  }

  /**
   * Creates summary rows grouped by normalized device model names.
   *
   * Uses a normalized model key to merge formatting variants while preserving
   * one display name per model for output.
   *
   * @param category Summary category label for the generated rows.
   * @param statisticsData Source user statistics.
   * @returns Alphabetically sorted model summary rows.
   */
  private createStatisticsSummaryModelRows(
    category: StatisticsSummaryCategory,
    statisticsData: DisplayedUserStatistics[]
  ): UserStatisticsSummary[] {
    const modelMap = this.getModelTypeMap(statisticsData);

    return Array.from(modelMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([normalizedModel, displayedModel]) => ({
        category,
        name: displayedModel,
        countTranslations: this.countTranslationsForType(
          statisticsData,
          normalizedModel
        ),
        countRegistrations: this.countRegistrationsForType(
          statisticsData,
          normalizedModel
        ),
      }));
  }

  /**
   * Creates summary rows grouped by target languages.
   *
   * @param category Summary category label for the generated rows.
   * @param statisticsData Source user statistics.
   * @returns Summary rows for each target language count.
   */
  private createStatisticsSummaryLanguagesRows(
    category: StatisticsSummaryCategory,
    statisticsData: DisplayedUserStatistics[]
  ): UserStatisticsSummary[] {
    const maxLanguageCount = Math.max(
      1,
      ...statisticsData.map((userStat) => userStat.targetLanguages.length)
    );

    const types = Array.from({ length: maxLanguageCount }, (_, index) =>
      String(index + 1)
    );

    return this.buildStatisticsSummaryRows(category, types, statisticsData);
  }

  /**
   * Builds summary rows for the specified types.
   *
   * @param category Summary category label for the generated rows.
   * @param types Array of types to generate summary rows for.
   * @param statisticsData Source user statistics.
   * @returns Summary rows for each specified type.
   */
  private buildStatisticsSummaryRows(
    category: StatisticsSummaryCategory,
    types: string[],
    statisticsData: DisplayedUserStatistics[]
  ): UserStatisticsSummary[] {
    let rows: UserStatisticsSummary[] = [];
    types.forEach((type) => {
      rows.push({
        category,
        name: type,
        countTranslations: this.countTranslationsForType(statisticsData, type),
        countRegistrations: this.countRegistrationsForType(
          statisticsData,
          type
        ),
      });
    });
    return rows;
  }

  /**
   * Counts users with at least one translation for the given type.
   *
   * Supports user type, platform, language-count buckets, and normalized model names.
   *
   * @param statisticsData Source user statistics.
   * @param type Type discriminator used for matching.
   * @returns Number of users with translatedCharCount > 0.
   */
  private countTranslationsForType(
    statisticsData: DisplayedUserStatistics[],
    type: StatisticsSummaryName | string
  ): number {
    return statisticsData.filter((userStat) => {
      if (this.isLanguageCountType(type)) {
        return (
          userStat.targetLanguages.length === Number(type) &&
          userStat.translatedCharCount > 0
        );
      }
      switch (type) {
        case StatisticsSummaryName.Programmer:
        case StatisticsSummaryName.User:
          return userStat.userType === type && userStat.translatedCharCount > 0;
        case StatisticsSummaryName.Native:
        case StatisticsSummaryName.WebMobile:
        case StatisticsSummaryName.WebDesktop:
          return (
            userStat.displayedPlatform === type &&
            userStat.translatedCharCount > 0
          );
        default:
          return (
            this.normalizeModelForCompare(userStat.displayedModel) ===
              this.normalizeModelForCompare(type) &&
            userStat.translatedCharCount > 0
          );
      }
    }).length;
  }

  private isLanguageCountType(type: string): boolean {
    return /^\d+$/.test(type);
  }

  /**
   * Counts users with no translations for the given type.
   *
   * Supports user type, platform, language-count buckets, and normalized model names.
   *
   * @param statisticsData Source user statistics.
   * @param type Type discriminator used for matching.
   * @returns Number of users with translatedCharCount === 0.
   */
  private countRegistrationsForType(
    statisticsData: DisplayedUserStatistics[],
    type: StatisticsSummaryName | string
  ): number {
    return statisticsData.filter((userStat) => {
      if (this.isLanguageCountType(type)) {
        return (
          userStat.targetLanguages.length === Number(type) &&
          userStat.translatedCharCount === 0
        );
      }
      switch (type) {
        case StatisticsSummaryName.Programmer:
        case StatisticsSummaryName.User:
          return (
            userStat.userType === type && userStat.translatedCharCount === 0
          );
        case StatisticsSummaryName.Native:
        case StatisticsSummaryName.WebMobile:
        case StatisticsSummaryName.WebDesktop:
          return (
            userStat.displayedPlatform === type &&
            userStat.translatedCharCount === 0
          );
        default:
          return (
            this.normalizeModelForCompare(userStat.displayedModel) ===
              this.normalizeModelForCompare(type) &&
            userStat.translatedCharCount === 0
          );
      }
    }).length;
  }

  /**
   * Normalizes a model name for comparison by removing whitespace and converting to uppercase.
   *
   * @param value Model name to normalize.
   * @returns Normalized model name.
   */
  private normalizeModelForCompare(value: string | null | undefined): string {
    return (value ?? '').split(/\s+/).join('').toUpperCase();
  }

  /**
   * Builds a map of normalized model keys to display model names.
   *
   * Empty model names are skipped. The first encountered display name is kept
   * for each normalized key.
   *
   * @param statisticsData Source user statistics.
   * @returns Map where key is normalized model and value is display model.
   */
  private getModelTypeMap(
    statisticsData: DisplayedUserStatistics[]
  ): Map<string, string> {
    const modelMap = new Map<string, string>();

    statisticsData.forEach((userStat) => {
      const displayedModel = (userStat.displayedModel ?? '').trim();
      if (!displayedModel) {
        return;
      }
      const normalizedModel = this.normalizeModelForCompare(displayedModel);
      if (!modelMap.has(normalizedModel)) {
        modelMap.set(normalizedModel, displayedModel);
      }
    });
    return modelMap;
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
    // Read all control flags from Firestore
    const contingentData: FirestoreContingentData =
      await this.firestoreService.readContingentData();
    const displayedContingentData: DisplayedUserContingentData[] = [];
    // calculate data for current user
    const { charCount: userCharCount } =
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
      totalLimit - totalBuffer - totalCharCount
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
   * This method verifies, in order:
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
    flags: FirestoreContingentData
  ): Promise<boolean> {
    const limit =
      flags.maxFreeTranslateCharsPerMonthForUser ??
      environment.app.maxFreeTranslateCharsPerMonthForUser;
    const { charCount } = await this.firestoreService.getCharCountForUser();
    return charCount >= limit;
  }

  private async isTotalContingentExceeded(
    flags: FirestoreContingentData
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
}
