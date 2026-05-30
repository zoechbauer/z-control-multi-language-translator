import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import {
  DisplayedUserContingentData,
  DisplayedUserStatistics,
  FirestoreContingentData,
  ProgrammerDeviceUID,
  StatisticsData,
  UserTranslationStatistics,
  UserType,
} from '../shared/firebase-firestore.interfaces';
import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils.service';
import { LocalStorageService } from './local-storage.service';
import {
  AllMonthsOption,
  DisplayMode,
  StatisticsSummaryCategory,
  StatisticsSummaryName,
} from '../shared/enums';
import { FireStoreConstants } from '../shared/app.constants';

describe('FirebaseFirestoreUtilsService', () => {
  let service: FirebaseFirestoreUtilsService;
  let firestoreServiceMock: jasmine.SpyObj<FirebaseFirestoreService>;
  let utilsServiceMock: jasmine.SpyObj<UtilsService>;
  let localStorageServiceMock: jasmine.SpyObj<LocalStorageService>;
  let originalCollectionTranslations: any;

  beforeAll(() => {
    originalCollectionTranslations = (FireStoreConstants as any)
      .COLLECTION_TRANSLATIONS;
  });

  beforeEach(() => {
    (FireStoreConstants as any).COLLECTION_TRANSLATIONS =
      originalCollectionTranslations;

    utilsServiceMock = jasmine.createSpyObj('UtilsService', [
      'getPlatform',
      'getModel',
      'getCurrentMonth',
      'formatDateTimeISO'
    ]);

    firestoreServiceMock = jasmine.createSpyObj(
      'FirebaseFirestoreService',
      [
        'readContingentData',
        'getCharCountAndTargetLangsForUser',
        'getTotalCharCount',
        'getAllUserTranslationStatistics',
        'getUsers',
        'getProgrammerDeviceUIDs',
        'init',
        'getCurrentUserId'
      ],
      {
        programmerDeviceRefresh$: of(void 0),
        isProgrammerDevice: true,
      }
    );
    localStorageServiceMock = jasmine.createSpyObj(
      'LocalStorageService',
      ['getStatisticsDisplayMode', 'getStatisticsSelectedMonth'],
      {
        statisticsDisplayMode$: of(DisplayMode.User),
        statisticsSelectedMonth$: of('2026-04'),
      }
    );
    localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
      DisplayMode.User
    );
    localStorageServiceMock.getStatisticsSelectedMonth.and.resolveTo('2026-04');

    TestBed.configureTestingModule({
      providers: [
        FirebaseFirestoreUtilsService,
        { provide: FirebaseFirestoreService, useValue: firestoreServiceMock },
        { provide: UtilsService, useValue: utilsServiceMock },
        {
          provide: LocalStorageService,
          useValue: localStorageServiceMock,
        },
      ],
    });
    service = TestBed.inject(FirebaseFirestoreUtilsService);
  });

  describe('requestStatisticsRefresh', () => {
    it('should call statisticsRefreshSubject.next to refresh statistics', async () => {
      spyOn(service['statisticsRefreshSubject'], 'next');
      service.requestStatisticsRefresh();
      expect(service['statisticsRefreshSubject'].next).toHaveBeenCalled();
    });
  });

  describe('isContingentExceeded', () => {
    it('should return true if StopTranslationForAllUsers is true', async () => {
      firestoreServiceMock.readContingentData.and.resolveTo({
        StopTranslationForAllUsers: true,
      });
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
    });

    it('should return true if total contingent is exceeded', async () => {
      firestoreServiceMock.readContingentData.and.resolveTo({});
      firestoreServiceMock.getTotalCharCount.and.resolveTo(
        environment.app.maxFreeTranslateCharsPerMonth -
          environment.app.maxFreeTranslateCharsBufferPerMonth +
          1
      );
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: 0,
        targetLanguages: [],
      });
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
    });

    it('should return true if user contingent is exceeded', async () => {
      firestoreServiceMock.readContingentData.and.resolveTo({});
      firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: environment.app.maxFreeTranslateCharsPerMonthForUser + 1,
        targetLanguages: [],
      });
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
    });

    it('should return false if no contingent is exceeded and translation is not stopped', async () => {
      firestoreServiceMock.readContingentData.and.resolveTo({});
      firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: 0,
        targetLanguages: [],
      });
      const result = await service.isContingentExceeded();
      expect(result).toBeFalse();
    });

    it('should use Firestore flag values if present', async () => {
      const flags: FirestoreContingentData = {
        StopTranslationForAllUsers: false,
        maxFreeTranslateCharsPerMonth: 100,
        maxFreeTranslateCharsBufferPerMonth: 0,
        maxFreeTranslateCharsPerMonthForUser: 10,
      };
      firestoreServiceMock.readContingentData.and.resolveTo(flags);
      firestoreServiceMock.getTotalCharCount.and.resolveTo(101);
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: 11,
        targetLanguages: [],
      });
      // Should return true for total contingent exceeded first
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
      // Now test user contingent exceeded
      firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: 11,
        targetLanguages: [],
      });
      const result2 = await service.isContingentExceeded();
      expect(result2).toBeTrue();
    });

    it('should return false if simulation is enabled, even if contingent is exceeded', async () => {
      const origEnvSimulateTranslation = environment.app.simulateTranslation;
      try {
        environment.app.simulateTranslation = true;

        const result = await service.isContingentExceeded();

        expect(result).toBeFalse();
        expect(firestoreServiceMock.readContingentData).not.toHaveBeenCalled();
      } finally {
        environment.app.simulateTranslation = origEnvSimulateTranslation;
      }
    });
  });

  describe('getDisplayedUserContingentData', () => {
    let user;
    let contingentData: FirestoreContingentData;

    beforeEach(() => {
      user = {
        userId: 'U-1',
        name: 'User 1',
        type: 'U' as const,
        isNative: false,
        createdAt: new Date(),
      };

      contingentData = {
        StopTranslationForAllUsers: false,
        maxFreeTranslateCharsPerMonth: 500000,
        maxFreeTranslateCharsBufferPerMonth: 5000,
        maxFreeTranslateCharsPerMonthForUser: 10000,
      };
    });

    it('should return contingent data with user char count', async () => {
      firestoreServiceMock.readContingentData.and.resolveTo(contingentData);
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: 1000,
        targetLanguages: ['en', 'nl'],
      });

      const result = await service.getDisplayedUserContingentData();
      const userContingentData = result[0];

      const expectedUserResult: DisplayedUserContingentData = {
        userNameKey: 'TRANSLATE_STATISTICS.CARD.GRID.USER_NAME_YOU',
        freeTranslateCharsPerMonth:
          contingentData.maxFreeTranslateCharsPerMonthForUser || 0,
        translatedCharCountCurrentMonth: 1000,
        availableCharCountCurrentMonth:
          (contingentData.maxFreeTranslateCharsPerMonthForUser || 0) - 1000,
      };

      expect(userContingentData).toEqual(expectedUserResult);
    });

    it('should return contingent data with char count of all users', async () => {
      firestoreServiceMock.readContingentData.and.resolveTo(contingentData);
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: 1000,
        targetLanguages: ['en', 'nl'],
      });
      firestoreServiceMock.getTotalCharCount.and.resolveTo(20000);

      const result = await service.getDisplayedUserContingentData();
      const totalContingentData = result[1];

      const maxTotalFreeChars =
        (contingentData.maxFreeTranslateCharsPerMonth || 0) -
        (contingentData.maxFreeTranslateCharsBufferPerMonth || 0);

      const expectedTotalResult: DisplayedUserContingentData = {
        userNameKey: 'TRANSLATE_STATISTICS.CARD.GRID.USER_NAME_ALL',
        freeTranslateCharsPerMonth: maxTotalFreeChars,
        translatedCharCountCurrentMonth: 20000,
        availableCharCountCurrentMonth: maxTotalFreeChars - 20000,
      };

      expect(totalContingentData).toEqual(expectedTotalResult);
    });

    it('should use environment data if contingent data fields are missing', async () => {
      firestoreServiceMock.readContingentData.and.resolveTo({});
      firestoreServiceMock.getCharCountAndTargetLangsForUser.and.resolveTo({
        charCount: 500,
        targetLanguages: ['en'],
      });
      firestoreServiceMock.getTotalCharCount.and.resolveTo(5000);

      const result = await service.getDisplayedUserContingentData();

      const userContingentData = result[0];
      const totalContingentData = result[1];

      const maxTotalFreeChars =
        (environment.app.maxFreeTranslateCharsPerMonth || 0) -
        (environment.app.maxFreeTranslateCharsBufferPerMonth || 0);
      const expectedUserResult: DisplayedUserContingentData = {
        userNameKey: 'TRANSLATE_STATISTICS.CARD.GRID.USER_NAME_YOU',
        freeTranslateCharsPerMonth:
          environment.app.maxFreeTranslateCharsPerMonthForUser || 0,
        translatedCharCountCurrentMonth: 500,
        availableCharCountCurrentMonth:
          (environment.app.maxFreeTranslateCharsPerMonthForUser || 0) - 500,
      };
      const expectedTotalResult: DisplayedUserContingentData = {
        userNameKey: 'TRANSLATE_STATISTICS.CARD.GRID.USER_NAME_ALL',
        freeTranslateCharsPerMonth: maxTotalFreeChars,
        translatedCharCountCurrentMonth: 5000,
        availableCharCountCurrentMonth: maxTotalFreeChars - 5000,
      };
      expect(userContingentData).toEqual(expectedUserResult);
      expect(totalContingentData).toEqual(expectedTotalResult);
    });
  });

  describe('getDisplayedUserStatistics', () => {
    let usersAll: UserType[];
    let userStatsAllMonthsRaw: UserTranslationStatistics[];
    let programmerDeviceUIDs: ProgrammerDeviceUID[];

    function createAllMonthUsers(): UserType[] {
      // 10 total users: 4 translated (40%), 6 not translated (60%)
      return [
        {
          userId: 'U-1',
          name: 'User 1',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-02-10'),
        },
        {
          userId: 'U-2',
          name: 'User 2',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-02-11'),
        },
        {
          userId: 'U-3',
          name: 'User 3',
          type: 'U',
          isNative: true,
          createdAt: new Date('2026-03-11'),
        },
        {
          userId: 'P-1',
          name: 'Programmer 1',
          type: 'P',
          isNative: true,
          createdAt: new Date('2026-04-09'),
        },

        {
          userId: 'U-4',
          name: 'User 4',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-02-12'),
        },
        {
          userId: 'U-5',
          name: 'User 5',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-03-05'),
        },
        {
          userId: 'U-6',
          name: 'User 6',
          type: 'U',
          isNative: true,
          createdAt: new Date('2026-03-06'),
        },
        {
          userId: 'U-7',
          name: 'User 7',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-04-01'),
        },
        {
          userId: 'P-2',
          name: 'Programmer 2',
          type: 'P',
          isNative: true,
          createdAt: new Date('2026-04-02'),
        },
        {
          userId: 'P-3',
          name: 'Programmer 3',
          type: 'P',
          isNative: true,
          createdAt: new Date('2026-04-03'),
        },
      ];
    }

    function createAllMonthTranslationStatsRaw(): UserTranslationStatistics[] {
      // Same userIds across 3 months
      // U-1 total = 1500 + 1500 + 1500 = 4500
      // U-2 total = 1000 + 1200 + 1300 = 3500
      // Separate userIds in single months
      // U-3 total = 2500 (March only)
      // P-1 total = 3000 (April only)
      // Grand total expected after aggregation = 13500
      return [
        {
          userId: 'U-1',
          translatedCharCount: 1500,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-02-20'),
        },
        {
          userId: 'U-2',
          translatedCharCount: 1000,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-02-18'),
        },

        {
          userId: 'U-1',
          translatedCharCount: 1500,
          targetLanguages: ['en', 'nl'],
          lastTranslationDate: new Date('2026-03-20'),
        },
        {
          userId: 'U-2',
          translatedCharCount: 1200,
          targetLanguages: ['en', 'fr'],
          lastTranslationDate: new Date('2026-03-18'),
        },
        {
          userId: 'U-3',
          translatedCharCount: 2500,
          targetLanguages: ['en', 'de'],
          lastTranslationDate: new Date('2026-03-25'),
        },

        {
          userId: 'U-1',
          translatedCharCount: 1500,
          targetLanguages: ['en', 'nl', 'fr'],
          lastTranslationDate: new Date('2026-04-20'),
        },
        {
          userId: 'U-2',
          translatedCharCount: 1300,
          targetLanguages: ['en', 'fr', 'es'],
          lastTranslationDate: new Date('2026-04-18'),
        },
        {
          userId: 'P-1',
          translatedCharCount: 3000,
          targetLanguages: ['en', 'nl', 'fr', 'es', 'it'],
          lastTranslationDate: new Date('2026-04-22'),
        },
      ];
    }

    beforeEach(() => {
      usersAll = createAllMonthUsers();
      userStatsAllMonthsRaw = createAllMonthTranslationStatsRaw();
      programmerDeviceUIDs = [
        { userId: 'P-1', name: 'Programmer 1' },
        { userId: 'P-2', name: 'Programmer 2' },
        { userId: 'P-3', name: 'Programmer 3' },
      ];

      localStorageServiceMock.getStatisticsSelectedMonth.and.resolveTo(
        AllMonthsOption.localStorageValue
      );
      localStorageServiceMock.statisticsSelectedMonth$ = of(
        AllMonthsOption.localStorageValue
      );
      localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
        DisplayMode.Programmer
      );
      localStorageServiceMock.statisticsDisplayMode$ = of(
        DisplayMode.Programmer
      );

      firestoreServiceMock.getAllUserTranslationStatistics.and.resolveTo(
        userStatsAllMonthsRaw
      );
      firestoreServiceMock.getUsers.and.resolveTo(usersAll);
      firestoreServiceMock.getProgrammerDeviceUIDs.and.resolveTo(
        programmerDeviceUIDs
      );
      Object.defineProperty(firestoreServiceMock, 'isProgrammerDevice', {
        get: () => true,
      });
    });

    it('should load statistics and users with selected month all', async () => {
      const isProgrammerDevice = true;
      await service.getDisplayedUserStatistics(isProgrammerDevice);

      expect(
        localStorageServiceMock.getStatisticsSelectedMonth
      ).toHaveBeenCalledWith(AllMonthsOption.localStorageValue, isProgrammerDevice);
      expect(
        firestoreServiceMock.getAllUserTranslationStatistics
      ).toHaveBeenCalledWith(AllMonthsOption.localStorageValue);
      expect(firestoreServiceMock.getUsers).toHaveBeenCalledWith(
        AllMonthsOption.localStorageValue
      );
    });

    it('should include all users in programmer mode, including 60% users without translations', async () => {
      const isProgrammerDevice = true;
      const result = await service.getDisplayedUserStatistics(isProgrammerDevice);

      expect(result.users.length).withContext('users length').toBe(10);
      expect(result.displayedUserStatistics.length)
        .withContext('displayedUserStatistics length')
        .toBe(10);

      const translatedCount = result.displayedUserStatistics.filter(
        (u) => u.translatedCharCount > 0
      ).length;
      const noTranslationCount = result.displayedUserStatistics.filter(
        (u) => u.translatedCharCount === 0
      ).length;
      expect(translatedCount).withContext('translated count').toBe(4);
      expect(noTranslationCount).withContext('no translation count').toBe(6);
    });

    it('should aggregate same userId translations across all months (target behavior)', async () => {
      const isProgrammerDevice = true;
      const result = await service.getDisplayedUserStatistics(isProgrammerDevice);

      const u1 = result.displayedUserStatistics.find((u) => u.userId === 'U-1');
      const u2 = result.displayedUserStatistics.find((u) => u.userId === 'U-2');
      const u3 = result.displayedUserStatistics.find((u) => u.userId === 'U-3');
      const p1 = result.displayedUserStatistics.find((u) => u.userId === 'P-1');

      expect(u1?.translatedCharCount).toBe(4500);
      expect(u2?.translatedCharCount).toBe(3500);
      expect(u3?.translatedCharCount).toBe(2500);
      expect(p1?.translatedCharCount).toBe(3000);

      const total = result.displayedUserStatistics.reduce(
        (sum, u) => sum + (u.translatedCharCount || 0),
        0
      );
      expect(total).toBe(13500);
    });

    it('should keep users not present in translations with zero char count', async () => {
      const isProgrammerDevice = true;
      const result = await service.getDisplayedUserStatistics(isProgrammerDevice);

      ['U-4', 'U-5', 'U-6', 'U-7', 'P-2', 'P-3'].forEach((id) => {
        const user = result.displayedUserStatistics.find(
          (u) => u.userId === id
        );
        expect(user).toBeDefined();
        expect(user?.translatedCharCount).toBe(0);
        expect(user?.targetLanguages).toEqual([]);
        expect(user?.lastTranslationDate).toBeNull();
      });
    });

    describe('single-month behavior parity', () => {
      let userStats: UserTranslationStatistics[];
      let users: UserType[];
      let programmerDeviceUIDs: ProgrammerDeviceUID[];

      beforeEach(() => {
        localStorageServiceMock.getStatisticsSelectedMonth.and.resolveTo(
          '2026-03'
        );
        localStorageServiceMock.statisticsSelectedMonth$ = of('2026-03');
        localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
          DisplayMode.User
        );
        localStorageServiceMock.statisticsDisplayMode$ = of(DisplayMode.User);

        users = [
          {
            userId: 'U-1',
            name: 'User 1',
            type: 'U' as const,
            isNative: false,
            createdAt: new Date('2026-03-10'),
          },
          {
            userId: 'U-2',
            name: 'User 2',
            type: 'U' as const,
            isNative: true,
            createdAt: new Date('2026-03-11'),
          },
          {
            userId: 'U-3',
            name: 'User 3',
            type: 'U' as const,
            isNative: false,
            createdAt: new Date('2026-03-22'),
          },
          {
            userId: 'P-1',
            name: 'Programmer Device 1',
            type: 'P' as const,
            isNative: true,
            createdAt: new Date('2026-03-12'),
          },
          {
            userId: 'P-2',
            name: 'Programmer Device 2',
            type: 'P' as const,
            isNative: true,
            createdAt: new Date('2026-03-13'),
          },
        ];

        userStats = [
          {
            userId: 'U-1',
            translatedCharCount: 1000,
            targetLanguages: ['en', 'nl'],
            lastTranslationDate: new Date('2026-03-10'),
          },
          {
            userId: 'U-2',
            translatedCharCount: 2000,
            targetLanguages: ['en'],
            lastTranslationDate: new Date('2026-03-11'),
          },
          {
            userId: 'P-1',
            translatedCharCount: 3000,
            targetLanguages: ['en', 'nl', 'fr', 'es', 'it'],
            lastTranslationDate: new Date('2026-03-12'),
          },
        ];

        programmerDeviceUIDs = [
          { userId: 'P-1', name: 'Programmer Device 1' },
          { userId: 'P-2', name: 'Programmer Device 2' },
        ];

        firestoreServiceMock.getAllUserTranslationStatistics.and.resolveTo(
          userStats
        );
        firestoreServiceMock.getUsers.and.resolveTo(users);
        firestoreServiceMock.getProgrammerDeviceUIDs.and.resolveTo(
          programmerDeviceUIDs
        );
        Object.defineProperty(firestoreServiceMock, 'isProgrammerDevice', {
          get: () => true,
        });
      });

      it('should return user translations', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const userTranslResult = result.userTranslationStatistics;

        expect(userTranslResult.length).toBe(3);

        const user1Trans = userTranslResult.find((s) => s.userId === 'U-1');
        const user2Trans = userTranslResult.find((s) => s.userId === 'U-2');
        const progDev1Trans = userTranslResult.find((s) => s.userId === 'P-1');
        expect(user1Trans).toEqual(
          jasmine.objectContaining({
            userId: 'U-1',
            translatedCharCount: 1000,
            targetLanguages: ['en', 'nl'],
            lastTranslationDate: new Date('2026-03-10'),
          })
        );
        expect(user2Trans).toEqual(
          jasmine.objectContaining({
            userId: 'U-2',
            translatedCharCount: 2000,
            targetLanguages: ['en'],
            lastTranslationDate: new Date('2026-03-11'),
          })
        );
        expect(progDev1Trans).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            translatedCharCount: 3000,
            targetLanguages: ['en', 'nl', 'fr', 'es', 'it'],
            lastTranslationDate: new Date('2026-03-12'),
          })
        );
      });

      it('should return user statistics', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const userStatsResult = result.displayedUserStatistics;

        expect(userStatsResult.length).toBe(3);

        const user1Stats = userStatsResult.find((s) => s.userId === 'U-1');
        const user2Stats = userStatsResult.find((s) => s.userId === 'U-2');
        const progDev1Stats = userStatsResult.find((s) => s.userId === 'P-1');

        expect(user1Stats).toEqual(
          jasmine.objectContaining({
            userId: 'U-1',
            userName: 'User 1',
            userType: 'U',
            isNative: false,
            targetLanguages: ['en', 'nl'],
          })
        );
        expect(user2Stats).toEqual(
          jasmine.objectContaining({
            userId: 'U-2',
            userName: 'User 2',
            userType: 'U',
            isNative: true,
            targetLanguages: ['en'],
          })
        );
        expect(progDev1Stats).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            userName: 'Programmer Device 1',
            userType: 'P',
            isNative: true,
            targetLanguages: ['en', 'nl', 'fr', 'es', 'it'],
          })
        );
      });

      it('should return users', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const usersResult = result.users;

        expect(usersResult.length).toBe(5);

        const user1Users = usersResult.find((s) => s.userId === 'U-1');
        const user2Users = usersResult.find((s) => s.userId === 'U-2');
        const user3Users = usersResult.find((s) => s.userId === 'U-3');
        const progDev1Users = usersResult.find((s) => s.userId === 'P-1');
        const progDev2Users = usersResult.find((s) => s.userId === 'P-2');

        expect(user1Users).toEqual(
          jasmine.objectContaining({
            userId: 'U-1',
            name: 'User 1',
            type: 'U',
            isNative: false,
            createdAt: new Date('2026-03-10'),
          })
        );
        expect(user2Users).toEqual(
          jasmine.objectContaining({
            userId: 'U-2',
            name: 'User 2',
            type: 'U',
            isNative: true,
            createdAt: new Date('2026-03-11'),
          })
        );
        expect(user3Users).toEqual(
          jasmine.objectContaining({
            userId: 'U-3',
            name: 'User 3',
            type: 'U',
            isNative: false,
            createdAt: new Date('2026-03-22'),
          })
        );
        expect(progDev1Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            name: 'Programmer Device 1',
            type: 'P',
            isNative: true,
            createdAt: new Date('2026-03-12'),
          })
        );
        expect(progDev2Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-2',
            name: 'Programmer Device 2',
            type: 'P',
            isNative: true,
            createdAt: new Date('2026-03-13'),
          })
        );
      });

      it('should return programmer devices if called from a programmer device', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const programmerDevicesResult = result.programmerDeviceUIDs;

        expect(programmerDevicesResult.length).toBe(2);

        const progDev1Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-1'
        );
        const progDev2Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-2'
        );

        expect(progDev1Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            name: 'Programmer Device 1',
          })
        );
        expect(progDev2Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-2',
            name: 'Programmer Device 2',
          })
        );
      });

      it('should return empty array if not called from a programmer device', async () => {
        Object.defineProperty(firestoreServiceMock, 'isProgrammerDevice', {
          get: () => false,
        });

        const isProgrammerDevice = false;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const programmerDevicesResult = result.programmerDeviceUIDs;

        expect(programmerDevicesResult.length).toBe(0);

        const progDev1Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-1'
        );
        const progDev2Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-2'
        );

        expect(progDev1Users).toBeUndefined();
        expect(progDev2Users).toBeUndefined();
      });

      it('should add user with 0 char count to statistics if displaymode is programmer view', async () => {
        // Arrange: Set display mode to Programmer
        localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
          DisplayMode.Programmer
        );
        localStorageServiceMock.statisticsDisplayMode$ = of(
          DisplayMode.Programmer
        );

        // Act
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);

        // Assert: All users (including those with 0 char count) should be included in displayedUserStatistics
        expect(result.displayedUserStatistics.length).toBe(
          5,
          'All 4 users should be included in programmer view'
        );
        // Specifically check that the user with 0 char count is present
        const userWithNoTranslations = result.displayedUserStatistics.find(
          (u) => u.userId === 'P-2'
        );
        expect(userWithNoTranslations).toBeDefined(
          'User with 0 char count should be included in programmer view'
        );
      });

      it('should not add user with 0 char count to statistics if displaymode is user view', async () => {
        // Act
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);

        // Assert: Only users with translations should be included in displayedUserStatistics
        expect(result.displayedUserStatistics.length).toBe(
          3,
          'Only users with translations should be included in user view'
        );
        // Specifically check that the user with 0 char count is NOT present
        const userWithNoTranslations = result.displayedUserStatistics.find(
          (u) => u.userId === 'P-2'
        );
        expect(userWithNoTranslations).toBeUndefined(
          'User with 0 char count should NOT be included in user view'
        );
      });

      it('should sort displayedUserStatistics by translation date descending or creation date descending if translation date is not available', async () => {
        localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
          DisplayMode.Programmer
        );
        localStorageServiceMock.statisticsDisplayMode$ = of(
          DisplayMode.Programmer
        );

        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const userStatsResult = result.displayedUserStatistics;

        expect(userStatsResult.length).toBe(5);
        const expectedOrder = ['P-1', 'U-2', 'U-1', 'U-3', 'P-2'];
        const actualOrder = userStatsResult.map((u) => u.userId);
        expect(actualOrder).toEqual(
          expectedOrder,
          'Users should be sorted by last translation date desc, or creation date desc if translation date is not available'
        );
      });

      it('should not include users in displayedUserStatistics if they are absent from the users list', async () => {
        // Arrange: Create a user translation statistic for a user that is not in the users list
        const extraUserStat: UserTranslationStatistics = {
          userId: 'U-999',
          translatedCharCount: 500,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-03-15'),
        };
        const userStatsWithExtra = [...userStats, extraUserStat];
        firestoreServiceMock.getAllUserTranslationStatistics.and.resolveTo(
          userStatsWithExtra
        );

        // Act
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);

        // Assert: Users not in the users list should be excluded from displayedUserStatistics
        const excludedUser = result.displayedUserStatistics.find(
          (u) => u.userId === 'U-999'
        );
        expect(excludedUser).toBeUndefined(
          'Users not in the users list should be excluded from displayedUserStatistics'
        );
      });
    });
  });

  describe('getUserStatisticsSummary', () => {
    let statisticsData: DisplayedUserStatistics[] = [];

    function addStatisticsData(
      userId: string,
      device: string,
      displayedModel: string,
      isNative: boolean,
      platform: string,
      translatedCharCount: number,
      lastTranslationDate: Date | null,
      targetLanguages: string[]
    ) {
      const createdAt = new Date('2026-03-10');
      const lastUpdated = new Date('2026-03-15');

      statisticsData.push({
        userId,
        userName: 'User Name for ' + userId,
        userType: userId.startsWith('P') ? 'P' : 'U',
        userCreatedAt: createdAt,
        userLastUpdated: lastUpdated,
        device,
        isNative,
        deviceInfo: {
          userAgent: 'User Agent',
          platform: platform,
          language: 'de',
          appVersion: {
            major: 1,
            minor: 0,
            date: '2026-03-01',
          },
        },
        displayedPlatform: platform,
        displayedModel,
        translatedCharCount,
        targetLanguages,
        lastTranslationDate: translatedCharCount > 0 ? lastTranslationDate : null,
      });
    }

    function createStatiticsData(): DisplayedUserStatistics[] {
      statisticsData = [];
      addStatisticsData(
        'U-1',
        'Device 1',
        'Model 1',
        false,
        'web-desktop',
        1000,
        new Date('2026-03-15'),
        ['en', 'nl']
      );
      addStatisticsData(
        'U-2',
        'Device 1',
        'Model 1',
        false,
        'web-mobile',
        2000,
        new Date('2026-03-13'),
        ['en', 'nl', 'fr']
      );
      addStatisticsData(
        'U-4',
        'Device 3',
        'Model 3',
        false,
        'web-mobile',
        0,
        null,
        []
      );
      addStatisticsData('P-1', 'Device 4', 'Model 4', true, 'native', 3000, new Date('2026-03-17'), [
        'en',
        'nl',
        'fr',
        'es',
        'it',
      ]);
      addStatisticsData('P-1', 'Device 4', '', true, 'native', 1000, new Date('2026-03-15'),[
        'en',
        'nl',
        'fr',
        'es',
        'it',
        'uk',
      ]);
      addStatisticsData(
        'P-2',
        'Device 4',
        'Model 4',
        true,
        'web-desktop',
        0,
        null,
        []
      );
      return statisticsData;
    }

    beforeEach(() => {
      statisticsData = createStatiticsData();
    });

    it('should return summary records for user type', () => {
      // Act
      const result = service.getUserStatisticsSummary(statisticsData);

      // Filter for userType summary rows
      const userTypeRows = result.filter(
        (s) => s.category === StatisticsSummaryCategory.UserType
      );
      expect(userTypeRows.length).toBe(2);
      const userRow = userTypeRows.find(
        (r) => r.name === StatisticsSummaryName.User
      );
      const programmerRow = userTypeRows.find(
        (r) => r.name === StatisticsSummaryName.Programmer
      );
      // Assert
      expect(userRow)
        .withContext('user type User')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.User,
            countTranslations: 2,
            countRegistrations: 1,
          })
        );
      expect(programmerRow)
        .withContext('user type Programmer')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.Programmer,
            countTranslations: 2,
            countRegistrations: 1,
          })
        );
    });

    it('should return summary records for platform', () => {
      // Act
      const result = service.getUserStatisticsSummary(statisticsData);

      // Filter for platform summary rows
      const platformRows = result.filter(
        (s) => s.category === StatisticsSummaryCategory.Platform
      );
      expect(platformRows.length)
        .withContext('platform summary length')
        .toBe(3);
      const nativeRow = platformRows.find(
        (r) => r.name === StatisticsSummaryName.Native
      );
      const webMobileRow = platformRows.find(
        (r) => r.name === StatisticsSummaryName.WebMobile
      );
      const webDesktopRow = platformRows.find(
        (r) => r.name === StatisticsSummaryName.WebDesktop
      );
      // Assert
      expect(nativeRow)
        .withContext('platform Native')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.Native,
            countTranslations: 2,
            countRegistrations: 0,
          })
        );
      expect(webMobileRow)
        .withContext('platform WebMobile')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.WebMobile,
            countTranslations: 1,
            countRegistrations: 1,
          })
        );
      expect(webDesktopRow)
        .withContext('platform WebDesktop')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.WebDesktop,
            countTranslations: 1,
            countRegistrations: 1,
          })
        );
    });

    it('should return summary records for model', () => {
      // Act
      const result = service.getUserStatisticsSummary(statisticsData);

      // Filter for model summary rows
      const modelRows = result.filter(
        (s) => s.category === StatisticsSummaryCategory.Model
      );
      expect(modelRows.length).toBe(3);

      // Assert
      const model1Row = modelRows.find((r) => r.name === 'Model 1');
      const model3Row = modelRows.find((r) => r.name === 'Model 3');
      const model4Row = modelRows.find((r) => r.name === 'Model 4');

      expect(model1Row)
        .withContext('model Model 1')
        .toEqual(
          jasmine.objectContaining({
            name: 'Model 1',
            countTranslations: 2,
            countRegistrations: 0,
          }),
          'model Model 1'
        );
      expect(model3Row)
        .withContext('model Model 3')
        .toEqual(
          jasmine.objectContaining({
            name: 'Model 3',
            countTranslations: 0,
            countRegistrations: 1,
          })
        );
      expect(model4Row)
        .withContext('model Model 4')
        .toEqual(
          jasmine.objectContaining({
            name: 'Model 4',
            countTranslations: 1,
            countRegistrations: 1,
          })
        );
    });

    it('should return summary records for languages', () => {
      // Act
      const result = service.getUserStatisticsSummary(statisticsData);

      // Filter for languages summary rows
      const targetLangRows = result.filter(
        (s) => s.category === StatisticsSummaryCategory.Languages
      );
      expect(targetLangRows.length).toBe(6, 'targetLangRows.length');

      // Assert
      const targetLang1Row = targetLangRows.find((r) => r.name === '1');
      const targetLang2Row = targetLangRows.find((r) => r.name === '2');
      const targetLang3Row = targetLangRows.find((r) => r.name === '3');
      const targetLang4Row = targetLangRows.find((r) => r.name === '4');
      const targetLang5Row = targetLangRows.find((r) => r.name === '5');
      const targetLang6Row = targetLangRows.find((r) => r.name === '6');

      expect(targetLang1Row)
        .withContext('target language 1')
        .toEqual(
          jasmine.objectContaining({
            name: '1',
            countTranslations: 0,
            countRegistrations: 0,
          })
        );
      expect(targetLang2Row)
        .withContext('target language 2')
        .toEqual(
          jasmine.objectContaining({
            name: '2',
            countTranslations: 1,
            countRegistrations: 0,
          })
        );
      expect(targetLang3Row)
        .withContext('target language 3')
        .toEqual(
          jasmine.objectContaining({
            name: '3',
            countTranslations: 1,
            countRegistrations: 0,
          })
        );
      expect(targetLang4Row)
        .withContext('target language 4')
        .toEqual(
          jasmine.objectContaining({
            name: '4',
            countTranslations: 0,
            countRegistrations: 0,
          })
        );
      expect(targetLang5Row)
        .withContext('target language 5')
        .toEqual(
          jasmine.objectContaining({
            name: '5',
            countTranslations: 1,
            countRegistrations: 0,
          })
        );
      expect(targetLang6Row)
        .withContext('target language 6')
        .toEqual(
          jasmine.objectContaining({
            name: '6',
            countTranslations: 1,
            countRegistrations: 0,
          })
        );
    });

    it('should order the summary records correctly', () => {
      const result = service.getUserStatisticsSummary(statisticsData);

      const expectedOrder = [
        // UserType
        StatisticsSummaryName.Programmer,
        StatisticsSummaryName.User,
        // Platform
        StatisticsSummaryName.Native,
        StatisticsSummaryName.WebMobile,
        StatisticsSummaryName.WebDesktop,
        // Model
        'Model 1',
        'Model 3',
        'Model 4',
        // Languages
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ];

      const actualOrder = result.map((s) => s.name);

      expect(actualOrder)
        .withContext('Summary records order')
        .toEqual(expectedOrder);
    });
  });
});
