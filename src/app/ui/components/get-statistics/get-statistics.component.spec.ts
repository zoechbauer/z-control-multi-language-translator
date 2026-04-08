import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';

import { GetStatisticsComponent } from './get-statistics.component';
import { FirebaseFirestoreService } from 'src/app/services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { UtilsService } from 'src/app/services/utils.service';
import { DisplayMode } from 'src/app/shared/enums';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { environment } from 'src/environments/environment';
import { DisplayedUserStatistics } from 'src/app/shared/firebase-firestore.interfaces';

describe('GetStatisticsComponent', () => {
  let component: GetStatisticsComponent;
  let fixture: ComponentFixture<GetStatisticsComponent>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let firestoreUtilsServiceSpy: jasmine.SpyObj<FirebaseFirestoreUtilsService>;
  let firestoreServiceSpy: jasmine.SpyObj<FirebaseFirestoreService>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;

  beforeEach(waitForAsync(() => {
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['formatDateTimeISO', 'formatDateISO', 'openUserDetail'],
      {
        isPortrait: true,
        isNative: false,
      }
    );
    firestoreUtilsServiceSpy = jasmine.createSpyObj(
      'FirebaseFirestoreUtilsService',
      ['getDisplayedUserStatistics', 'getUserStatisticsSummary'],
      {
        statisticsRefresh$: of(void 0),
      }
    );
    firestoreServiceSpy = jasmine.createSpyObj(
      'FirebaseFirestoreService',
      ['readContingentData', 'getTotalCharCount'],
      {
        programmerDeviceRefresh$: of(void 0),
        isProgrammerDevice: false,
        StopTranslationForAllUsers: false,
      }
    );
    firestoreServiceSpy.readContingentData.and.returnValue(
      Promise.resolve({ StopTranslationForAllUsers: false })
    );
    localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      [
        'loadFirestoreUid',
        'getStatisticsDisplayMode',
        'saveStatisticsDisplayMode',
      ],
      {
        statisticsDisplayMode$: of(DisplayMode.User),
      }
    );

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), GetStatisticsComponent],
      providers: [
        {
          provide: FirebaseFirestoreService,
          useValue: firestoreServiceSpy,
        },
        {
          provide: FirebaseFirestoreUtilsService,
          useValue: firestoreUtilsServiceSpy,
        },
        {
          provide: LocalStorageService,
          useValue: localStorageServiceSpy,
        },
        {
          provide: UtilsService,
          useValue: utilsServiceSpy,
        },
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GetStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formatDateTimeISO()', () => {
    beforeEach(() => {
      utilsServiceSpy.formatDateTimeISO.calls.reset();
      component.displayMode = DisplayMode.Programmer;
    });

    it('should call UtilsService.formatDateTimeISO when dateTime is valid', () => {
      component.getFormatDateTime(new Date('2026-03-09T00:00:00Z'));
      expect(utilsServiceSpy.formatDateTimeISO).toHaveBeenCalledWith(
        new Date('2026-03-09T00:00:00Z')
      );
    });

    it('should call UtilsService.formatDateTimeISO when dateTime is invalid', () => {
      component.getFormatDateTime(new Date('invalid-date'));

      expect(utilsServiceSpy.formatDateTimeISO).toHaveBeenCalled();
      const callArg =
        utilsServiceSpy.formatDateTimeISO.calls.mostRecent().args[0];
      expect(callArg instanceof Date).toBeTrue();
      expect(Number.isNaN(callArg!.getTime())).toBeTrue(); // Invalid Date
    });

    it('should call UtilsService.formatDateTimeISO when dateTime is null', () => {
      component.getFormatDateTime(null);
      expect(utilsServiceSpy.formatDateTimeISO).toHaveBeenCalledWith(null);
    });
  });

  describe('formatDateISO()', () => {
    beforeEach(() => {
      utilsServiceSpy.formatDateISO.calls.reset();
      component.displayMode = DisplayMode.User;
    });

    it('should call UtilsService.formatDateISO when dateTime is valid', () => {
      component.getFormatDateTime(new Date('2026-03-09T00:00:00Z'));
      expect(utilsServiceSpy.formatDateISO).toHaveBeenCalledWith(
        new Date('2026-03-09T00:00:00Z')
      );
    });

    it('should call UtilsService.formatDateISO when dateTime is invalid', () => {
      component.getFormatDateTime(new Date('invalid-date'));

      expect(utilsServiceSpy.formatDateISO).toHaveBeenCalled();
      const callArg = utilsServiceSpy.formatDateISO.calls.mostRecent().args[0];
      expect(callArg instanceof Date).toBeTrue();
      expect(Number.isNaN(callArg!.getTime())).toBeTrue(); // Invalid Date
    });

    it('should call UtilsService.formatDateISO when dateTime is null', () => {
      component.getFormatDateTime(null);
      expect(utilsServiceSpy.formatDateISO).toHaveBeenCalledWith(null);
    });
  });

  describe('getter', () => {
    describe('hideColumn', () => {
      it('should hide column when device is portrait', () => {
        Object.defineProperty(utilsServiceSpy, 'isPortrait', { value: true });
        expect(component.hideColumn).toBeTrue();
      });
    });

    describe('hideColumnIfUserOrPortrait', () => {
      it('should hide column when device is portrait', () => {
        Object.defineProperty(utilsServiceSpy, 'isPortrait', { value: true });
        component.displayMode = DisplayMode.Programmer;
        expect(component.hideColumnIfUserOrPortrait).toBeTrue();
      });

      it('should hide column when display mode is User', () => {
        Object.defineProperty(utilsServiceSpy, 'isPortrait', { value: false });
        component.displayMode = DisplayMode.User;
        expect(component.hideColumnIfUserOrPortrait).toBeTrue();
      });
    });

    describe('isFirebaseEmulator', () => {
      it('should return true if environment.app.useFirebaseEmulator is true', () => {
        environment.app.useFirebaseEmulator = true;
        expect(component.isFirebaseEmulator).toBeTrue();
      });

      it('should return false if environment.app.useFirebaseEmulator is false', () => {
        environment.app.useFirebaseEmulator = false;
        expect(component.isFirebaseEmulator).toBeFalse();
      });
    });

    describe('filteredUserStats', () => {
      let statisticsData: DisplayedUserStatistics[] = [];

      function addStatisticsData(
        userId: string,
        device: string,
        displayedModel: string,
        isNative: boolean,
        platform: string,
        translatedCharCount: number,
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
          lastTranslationDate: translatedCharCount > 0 ? lastUpdated : null,
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
          ['en', 'nl']
        );
        addStatisticsData(
          'U-2',
          'Device 1',
          'Model 1',
          false,
          'web-mobile',
          2000,
          ['en', 'nl', 'fr']
        );
        addStatisticsData(
          'U-4',
          'Device 3',
          'Model 3',
          false,
          'web-mobile',
          0,
          []
        );
        addStatisticsData('P-1', 'Device 4', 'Model 4', true, 'native', 3000, [
          'en',
          'nl',
          'fr',
          'es',
          'it',
        ]);
        addStatisticsData(
          'P-2',
          'Device 4',
          'Model 4',
          true,
          'web-desktop',
          0,
          []
        );
        return statisticsData;
      }

      beforeEach(() => {
        statisticsData = createStatiticsData();
        component['statisticsData'] = {
          displayedUserStatistics: statisticsData,
          userTranslationStatistics: [],
          users: [],
          programmerDeviceUIDs: [],
        };
      });

      it('should show all records if no filters are applied', () => {
        component.searchTerm = '';
        const result = component.filteredUserStats;
        expect(result).toEqual(statisticsData);
      });

      it('should return all records if filter text is undefined', () => {
        component.searchTerm = undefined as unknown as string;
        let result = component.filteredUserStats;
        expect(result).toEqual(statisticsData);
      });

      it('should filter by user id', () => {
        component.searchTerm = 'U-1';
        const result = component.filteredUserStats;
        expect(result.length).toBe(1);
        expect(result[0].userId).toBe('U-1');
      });

      it('should filter by user name', () => {
        component.searchTerm = 'User Name for U-1';
        const result = component.filteredUserStats;
        expect(result.length).toBe(1);
        expect(result[0].userId).toBe('U-1');
      });

      it('should filter by user type user', () => {
        component.searchTerm = 'U-';
        const result = component.filteredUserStats;
        expect(result.length).toBe(3);
      });

      it('should filter by user type programmer', () => {
        component.searchTerm = 'P-';
        const result = component.filteredUserStats;
        expect(result.length).toBe(2);
      });

      it('should filter by platform', () => {
        component.searchTerm = 'web-desktop';
        const result = component.filteredUserStats;
        expect(result.length).toBe(2);
        expect(result[0].displayedPlatform).toBe('web-desktop');
        expect(result[1].displayedPlatform).toBe('web-desktop');
      });

      it('should filter by model', () => {
        component.searchTerm = 'Model 1';
        const result = component.filteredUserStats;
        expect(result.length).toBe(2);
        expect(result[0].displayedModel).toBe('Model 1');
        expect(result[1].displayedModel).toBe('Model 1');
      });

      it('should return empty array if statisticsData is null', () => {
        component['statisticsData'] = null;
        component.searchTerm = 'test';
        let result = component.filteredUserStats;
        expect(result).toEqual([]);
      });

      it('should return rows which have at least 3 target languages with >> operator', () => {
        component.searchTerm = '>>3';
        const result = component.filteredUserStats;
        result.sort((a, b) => a.userId.localeCompare(b.userId));

        expect(result.length).toBe(2);
        expect(result[0].userId).toBe('P-1');
        expect(result[1].userId).toBe('U-2');
      });

      it('should return rows which have less or equal to 3 target languages with << operator', () => {
        component.searchTerm = '<<3';
        const result = component.filteredUserStats;
        result.sort((a, b) => a.userId.localeCompare(b.userId));

        expect(result.length).toBe(4);
        expect(result[0].userId).toBe('P-2');
        expect(result[1].userId).toBe('U-1');
        expect(result[2].userId).toBe('U-2');
        expect(result[3].userId).toBe('U-4');
      });

      it('should return rows which have not target languages with << operator', () => {
        component.searchTerm = '<<0';
        const result = component.filteredUserStats;
        result.sort((a, b) => a.userId.localeCompare(b.userId));

        expect(result.length).toBe(2);
        expect(result[0].userId).toBe('P-2');
        expect(result[1].userId).toBe('U-4');
      });

      it('should return rows which have at least 2000 translated chars with > operator', () => {
        component.searchTerm = '>2000';
        const result = component.filteredUserStats;
        result.sort((a, b) => a.userId.localeCompare(b.userId));

        expect(result.length).toBe(2);
        expect(result[0].userId).toBe('P-1');
        expect(result[1].userId).toBe('U-2');
      });

      it('should return rows which have less or equal to 1000 translated chars with < operator', () => {
        component.searchTerm = '<1000';
        const result = component.filteredUserStats;
        result.sort((a, b) => a.userId.localeCompare(b.userId));

        expect(result.length).toBe(3);
        expect(result[0].userId).toBe('P-2');
        expect(result[1].userId).toBe('U-1');
        expect(result[2].userId).toBe('U-4');
      });

      it('should return rows which have no translated chars with < operator', () => {
        component.searchTerm = '<0';
        const result = component.filteredUserStats;
        result.sort((a, b) => a.userId.localeCompare(b.userId));

        expect(result.length).toBe(2);
        expect(result[0].userId).toBe('P-2');
        expect(result[1].userId).toBe('U-4');
      });
    });
  });

  describe('isCurrentUser', () => {
    it('should return true if current user is the same as the provided user', () => {
      const user = { id: '123' };
      component.currentUserUid = '123';
      expect(component.isCurrentUser(user.id)).toBeTrue();
    });

    it('should return false if current user is different from the provided user', () => {
      const user = { id: '123' };
      component.currentUserUid = '456';
      expect(component.isCurrentUser(user.id)).toBeFalse();
    });
  });

  describe('onDisplayModeChange', () => {
    it('should change display mode, clear search term, save to local storage and call init', () => {
      localStorageServiceSpy.saveStatisticsDisplayMode.and.returnValue(
        Promise.resolve()
      );
      component.displayMode = DisplayMode.User;
      component.searchTerm = 'test';
      const event = {
        detail: {
          value: DisplayMode.Programmer,
        },
      };
      const initSpy = spyOn(component, 'init');

      component.onDisplayModeChange(event);

      expect(component.displayMode).toBe(DisplayMode.Programmer);
      expect(component.searchTerm).toBe('');
      expect(
        localStorageServiceSpy.saveStatisticsDisplayMode
      ).toHaveBeenCalledWith(DisplayMode.Programmer);
      expect(initSpy).toHaveBeenCalled();
    });

    it('should handle error when saving display mode to local storage', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      localStorageServiceSpy.saveStatisticsDisplayMode.and.returnValue(
        Promise.reject(new Error('Storage error'))
      );
      component.displayMode = DisplayMode.User;
      const event = {
        detail: {
          value: DisplayMode.Programmer,
        },
      };
      const initSpy = spyOn(component, 'init');

      component.onDisplayModeChange(event);
      await Promise.resolve();

      expect(component.displayMode).toBe(DisplayMode.Programmer);
      expect(component.searchTerm).toBe('');
      expect(
        localStorageServiceSpy.saveStatisticsDisplayMode
      ).toHaveBeenCalledWith(DisplayMode.Programmer);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving display mode to local storage:',
        new Error('Storage error')
      );
      expect(initSpy).toHaveBeenCalled(); // will change display mode to localStorage value
    });

    it('should not change display mode and searchTerm if value is invalid', () => {
      component.displayMode = DisplayMode.User;
      component.searchTerm = 'test';
      const event = {
        detail: {
          value: 'invalid-value',
        },
      };
      const initSpy = spyOn(component, 'init');

      component.onDisplayModeChange(event);

      expect(component.displayMode).toBe(DisplayMode.User);
      expect(component.searchTerm).toBe('test');
      expect(
        localStorageServiceSpy.saveStatisticsDisplayMode
      ).not.toHaveBeenCalled();
      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('showDetailInfos', () => {
    it('should call utilsService.openUserDetail with correct parameters', async () => {
      const lang = 'en';
      const userStatistic = {
        id: 'user1',
      } as unknown as DisplayedUserStatistics;
      component.displayMode = DisplayMode.Programmer;
      const openUserDetailSpy = utilsServiceSpy.openUserDetail.and.returnValue(
        Promise.resolve()
      );
      await component.showDetailInfos(lang, userStatistic);

      expect(openUserDetailSpy).toHaveBeenCalledWith(
        lang,
        userStatistic,
        component.displayMode
      );
    });
  });

  describe('subscriptions and cleanup', () => {
    it('should unsubscribe from all subscriptions on destroy', () => {
      const subscription1 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      const subscription2 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      (component as any).subscriptions = [subscription1, subscription2];

      (component as any).ngOnDestroy();

      expect(subscription1.unsubscribe).toHaveBeenCalled();
      expect(subscription2.unsubscribe).toHaveBeenCalled();
    });

    it('should handle empty subscriptions array on destroy', () => {
      (component as any).subscriptions = [];
      (component as any).ngOnDestroy();
      // No errors should occur, and the test will pass if it reaches this point without throwing
    });

    it('should subscribe to localStorageService.statisticsDisplayMode$ and update displayMode', () => {
      Object.defineProperty(localStorageServiceSpy, 'statisticsDisplayMode$', {
        get: () => of(DisplayMode.User),
      });
      component.displayMode = DisplayMode.Programmer;

      (component as any).setupSubscriptions();

      expect(component.displayMode).toBe(DisplayMode.User);
    });

    it('should subscribe to firestoreUtilsService.statisticsRefresh$ and call init if not loading', () => {
      const initSpy = spyOn(component, 'init');
      component.isLoading = false;

      (component as any).setupSubscriptions();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should subscribe to firestoreUtilsService.statisticsRefresh$ and not call init if loading', () => {
      const initSpy = spyOn(component, 'init');
      component.isLoading = true;

      (component as any).setupSubscriptions();
      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should subscribe to firestoreService.programmerDeviceRefresh$ and update isProgrammerDevice if value changes', () => {
      const refresh$ = new Subject<void>();
      let isProgrammerDeviceValue = false;
      Object.defineProperty(firestoreServiceSpy, 'programmerDeviceRefresh$', {
        get: () => refresh$,
      });
      Object.defineProperty(firestoreServiceSpy, 'isProgrammerDevice', {
        get: () => isProgrammerDeviceValue,
      });
      component.isProgrammerDevice = false;

      (component as any).setupSubscriptions();

      // simulate value change
      isProgrammerDeviceValue = true;
      refresh$.next();

      expect(component.isProgrammerDevice).toBeTrue();
    });

    it('should subscribe to firestoreService.programmerDeviceRefresh$ and do not update isProgrammerDevice if value does not change', () => {
      Object.defineProperty(firestoreServiceSpy, 'programmerDeviceRefresh$', {
        get: () => of(void 0),
      });
      component.isProgrammerDevice = true;
      Object.defineProperty(firestoreServiceSpy, 'isProgrammerDevice', {
        value: true,
      });

      (component as any).setupSubscriptions();
      expect(component.isProgrammerDevice).toBeTrue();
    });
  });

  describe('ngOnInit', () => {
    it('should call init and setupSubscriptions', () => {
      const initSpy = spyOn(component, 'init');
      const setupSubscriptionsSpy = spyOn(
        component as any,
        'setupSubscriptions'
      );
      component.ngOnInit();

      expect(initSpy).toHaveBeenCalled();
      expect(setupSubscriptionsSpy).toHaveBeenCalled();
    });

    describe('init', () => {
      it('should load current user uid, display mode, isProgrammerDevice and contingent data', async () => {
        const isProgrammerDeviceSpy = Object.defineProperty(
          firestoreServiceSpy,
          'isProgrammerDevice',
          {
            get: () => true,
          }
        );
        const loadFirestoreUidSpy =
          localStorageServiceSpy.loadFirestoreUid.and.returnValue(
            Promise.resolve('test-uid')
          );
        const getStatisticsDisplayModeSpy =
          localStorageServiceSpy.getStatisticsDisplayMode.and.returnValue(
            Promise.resolve(DisplayMode.Programmer)
          );
        const readContingentDataSpy =
          firestoreServiceSpy.readContingentData.and.returnValue(
            Promise.resolve({ StopTranslationForAllUsers: false })
          );
        component.isProgrammerDevice = false;

        await component.init();

        expect(loadFirestoreUidSpy).toHaveBeenCalled();
        expect(getStatisticsDisplayModeSpy).toHaveBeenCalled();
        expect(readContingentDataSpy).toHaveBeenCalled();
        expect(isProgrammerDeviceSpy).toBeDefined();
        expect(component.currentUserUid).toBe('test-uid');
        expect(component.displayMode).toBe(DisplayMode.Programmer);
        expect(component.contingentData).toEqual({
          StopTranslationForAllUsers: false,
        });
        expect(component.isProgrammerDevice).toBeTrue();
      });

      it('should load statistics data', async () => {
        const displayedUserStatisticsExtract: any[] = [
          { userId: 'U-1', translatedCharCount: 100000 },
          { userId: 'U-2', translatedCharCount: 70000 },
          { userId: 'P-1', translatedCharCount: 30000 },
        ];
        const getDisplayedUserStatisticsSpy =
          firestoreUtilsServiceSpy.getDisplayedUserStatistics.and.returnValue(
            Promise.resolve({
              displayedUserStatistics: displayedUserStatisticsExtract,
              userTranslationStatistics: [],
              users: [],
              programmerDeviceUIDs: [],
            })
          );
        const getUserStatisticsSummarySpy =
          firestoreUtilsServiceSpy.getUserStatisticsSummary.and.returnValue([]);
        const readContingentDataSpy =
          firestoreServiceSpy.readContingentData.and.returnValue(
            Promise.resolve({
              StopTranslationForAllUsers: false,
              maxFreeTranslateCharsPerMonth: 500000,
              maxFreeTranslateCharsPerUserPerMonth: 10000,
              maxFreeTranslateCharsBuffer: 5000,
            })
          );
        const getTotalCharCountSpy =
          firestoreServiceSpy.getTotalCharCount.and.returnValue(
            Promise.resolve(200000)
          );

        await component.init();

        expect(getDisplayedUserStatisticsSpy).toHaveBeenCalled();
        expect(getUserStatisticsSummarySpy).toHaveBeenCalled();
        expect(readContingentDataSpy).toHaveBeenCalled();

        expect(component.isStopped).withContext('isStopped').toBeFalse();
        expect(component.totalLimit).withContext('totalLimit').toBe(500000);
        expect(component.userLimit).withContext('userLimit').toBe(10000);
        expect(component.totalBuffer).withContext('totalBuffer').toBe(5000);

        expect(getTotalCharCountSpy).toHaveBeenCalled();
        expect(component.totalCharCount)
          .withContext('totalCharCount')
          .toBe(200000);
        expect(component.totalRemaining)
          .withContext('totalRemaining')
          .toBe(295000);

        expect(component.allUsersCharCount)
          .withContext('allUsersCharCount')
          .toBe(200000);
      });

      it('should log error if loading statistics data fails', async () => {
        const consoleErrorSpy = spyOn(console, 'error');
        firestoreUtilsServiceSpy.getDisplayedUserStatistics.and.returnValue(
          Promise.reject(new Error('Failed to load statistics'))
        );

        await component.init();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'GetStatisticsComponent: Error loading statistics',
          new Error('Failed to load statistics')
        );
      });
    });
  });
});
