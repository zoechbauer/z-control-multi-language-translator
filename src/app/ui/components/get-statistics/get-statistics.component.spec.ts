import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

import { GetStatisticsComponent } from './get-statistics.component';
import { FirebaseFirestoreService } from 'src/app/services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AllMonthsOption, DisplayMode } from 'src/app/shared/enums';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { environment } from 'src/environments/environment';
import {
  DisplayedUserStatistics,
  DisplayedUserStatisticsRow,
  StatisticsData,
} from 'src/app/shared/firebase-firestore.interfaces';

function createUserStat(
  userId = 'U-1',
  translatedCharCount = 500,
  lastTranslationDate: Date | null = new Date('2026-03-15T00:00:00Z'),
  targetLanguages: string[] = ['en']
): DisplayedUserStatisticsRow {
  return {
    userId,
    userName: `User ${userId}`,
    userType: userId.startsWith('P') ? 'P' : 'U',
    userCreatedAt: new Date('2026-03-10T00:00:00Z'),
    userLastUpdated: new Date('2026-03-15T00:00:00Z'),
    device: 'Device',
    isNative: false,
    deviceInfo: {
      userAgent: 'User Agent',
      platform: 'web',
      language: 'en',
      appVersion: {
        major: 1,
        minor: 0,
        date: '2026-03-01',
      },
    },
    displayedPlatform: 'web-desktop',
    displayedModel: 'Model X',
    translatedCharCount,
    targetLanguages,
    lastTranslationDate,
    formattedLastActivityDate: '2026-03-15',
    isCurrentUser: false,
  };
}

describe('GetStatisticsComponent', () => {
  let component: GetStatisticsComponent;
  let fixture: ComponentFixture<GetStatisticsComponent>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let firestoreUtilsServiceSpy: jasmine.SpyObj<FirebaseFirestoreUtilsService>;
  let firestoreServiceSpy: jasmine.SpyObj<FirebaseFirestoreService>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;

  beforeAll(() => {
    registerLocaleData(localeDe);
  });

  beforeEach(waitForAsync(() => {
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      [
        'formatDateTimeISO',
        'formatDateISO',
        'formatDateTimeFirestoreSearchString',
        'getAllFirestoreSearchStringsForMonth',
        'openUserDetail',
      ],
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
        'getStatisticsSelectedMonth',
        'saveStatisticsSelectedMonth',
      ],
      {
        statisticsDisplayMode$: of(DisplayMode.User),
        statisticsSelectedMonth$: of('2026-04'),
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

  describe('class logic', () => {
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

      it('should format date using utilsService.formatDateTimeISO if user type is programmer', () => {
        component.displayMode = DisplayMode.Programmer;
        component.getFormatDateTime(new Date('2026-03-09T00:00:00Z'));
        expect(utilsServiceSpy.formatDateTimeISO).toHaveBeenCalledWith(
          new Date('2026-03-09T00:00:00Z')
        );
      });

      it('should format date using utilsService.formatDateISO if user type is user', () => {
        component.displayMode = DisplayMode.User;
        component.getFormatDateTime(new Date('2026-03-09T00:00:00Z'));
        expect(utilsServiceSpy.formatDateISO).toHaveBeenCalledWith(
          new Date('2026-03-09T00:00:00Z')
        );
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
        const callArg =
          utilsServiceSpy.formatDateISO.calls.mostRecent().args[0];
        expect(callArg instanceof Date).toBeTrue();
        expect(Number.isNaN(callArg!.getTime())).toBeTrue(); // Invalid Date
      });

      it('should call UtilsService.formatDateISO when dateTime is null', () => {
        component.getFormatDateTime(null);
        expect(utilsServiceSpy.formatDateISO).toHaveBeenCalledWith(null);
      });
    });

    describe('getSectionHeader', () => {
      it('should return header with selected month when a specific month is selected', () => {
        component.filterSelectedMonth = '2026-03';
        component.selectedMonthForStatisticsSections = '2026-03';

        const result = component.getSectionHeader('SECTION.HEADER_KEY');

        expect(result).toBe('SECTION.HEADER_KEY: 2026-03');
      });

      it('should return header with AllMonthsOption label when all months is selected', () => {
        component.filterSelectedMonth = AllMonthsOption.SelectOptionValue;
        component.selectedMonthForStatisticsSections =
          AllMonthsOption.SelectOptionValue;

        const result = component.getSectionHeader('SECTION.HEADER_KEY');

        expect(result).toBe(
          `SECTION.HEADER_KEY: ${AllMonthsOption.SelectOptionValue}`
        );
      });

      it('should use selectedMonthForStatisticsSections, not filterSelectedMonth, for the month label', () => {
        component.filterSelectedMonth = '2026-04';
        component.selectedMonthForStatisticsSections = '2026-03';

        const result = component.getSectionHeader('SECTION.HEADER_KEY');

        expect(result).toBe('SECTION.HEADER_KEY: 2026-03');
      });
    });

    describe('getter', () => {
      describe('hideColumn', () => {
        it('should use cached orientation value', () => {
          (component as any).isPortrait = true;
          expect(component.hideColumn).toBeTrue();

          (component as any).isPortrait = false;
          expect(component.hideColumn).toBeFalse();
        });

        it('should not change when only service property changes (cache not synced yet)', () => {
          (component as any).isPortrait = false;

          Object.defineProperty(utilsServiceSpy, 'isPortrait', {
            get: () => true,
            configurable: true,
          });

          expect(component.hideColumn).toBeFalse();
        });

        it('should sync cached orientation on resize event', () => {
          let portraitValue = false;
          Object.defineProperty(utilsServiceSpy, 'isPortrait', {
            get: () => portraitValue,
            configurable: true,
          });

          (component as any).isPortrait = false;
          expect(component.hideColumn).toBeFalse();

          portraitValue = true;
          window.dispatchEvent(new Event('resize'));

          expect(component.hideColumn).toBeTrue();
        });
      });

      describe('hideColumnIfUserOrPortrait', () => {
        it('should be true when display mode is User even in landscape', () => {
          (component as any).isPortrait = false;
          component.displayMode = DisplayMode.User;

          expect(component.hideColumnIfUserOrPortrait).toBeTrue();
        });

        it('should be true when portrait in Programmer mode', () => {
          (component as any).isPortrait = true;
          component.displayMode = DisplayMode.Programmer;

          expect(component.hideColumnIfUserOrPortrait).toBeTrue();
        });

        it('should be false when landscape in Programmer mode', () => {
          (component as any).isPortrait = false;
          component.displayMode = DisplayMode.Programmer;

          expect(component.hideColumnIfUserOrPortrait).toBeFalse();
        });

        it('should update after orientationchange sync', () => {
          let portraitValue = false;
          Object.defineProperty(utilsServiceSpy, 'isPortrait', {
            get: () => portraitValue,
            configurable: true,
          });

          (component as any).isPortrait = false;
          component.displayMode = DisplayMode.Programmer;
          expect(component.hideColumnIfUserOrPortrait).toBeFalse();

          portraitValue = true;
          window.dispatchEvent(new Event('orientationchange'));

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
    });

    describe('onSearchTermChange', () => {
      let statisticsData: DisplayedUserStatisticsRow[] = [];

      function addStatisticsData(
        userId: string,
        device: string,
        displayedModel: string,
        isNative: boolean,
        platform: string,
        translatedCharCount: number,
        targetLanguages: string[],
        formattedLastActivityDate: string,
        isCurrentUser = false
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
          formattedLastActivityDate,
          isCurrentUser,
        });
      }

      function createStatiticsData(): DisplayedUserStatisticsRow[] {
        statisticsData = [];
        addStatisticsData(
          'U-1',
          'Device 1',
          'Model 1',
          false,
          'web-desktop',
          1000,
          ['en', 'nl'],
          '2026-03-15'
        );
        addStatisticsData(
          'U-2',
          'Device 1',
          'Model 1',
          false,
          'web-mobile',
          2000,
          ['en', 'nl', 'fr'],
          '2026-03-15'
        );
        addStatisticsData(
          'U-4',
          'Device 3',
          'Model 3',
          false,
          'web-mobile',
          0,
          [],
          '2026-03-10'
        );
        addStatisticsData(
          'P-1',
          'Device 4',
          'Model 4',
          true,
          'native',
          3000,
          ['en', 'nl', 'fr', 'es', 'it'],
          '2026-03-15'
        );
        addStatisticsData(
          'P-2',
          'Device 4',
          'Model 4',
          true,
          'web-desktop',
          0,
          [],
          '2026-03-10'
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

      it('should call applyUserStatsFilter when onSearchTermChange is used', () => {
        const spy = spyOn<any>(
          component,
          'applyUserStatsFilter'
        ).and.callThrough();

        component.onSearchTermChange('U-1');

        expect(spy).toHaveBeenCalled();
        expect(component.searchTerm).toBe('U-1');
      });

      it('should show all records if no filters are applied', () => {
        const expectedIds = statisticsData.map((r) => r.userId);

        component.onSearchTermChange('');
        expect(component.filteredUserStatsRows.length).toBe(5);
        expect(component.filteredUserStatsRows.map((r) => r.userId)).toEqual(
          expectedIds
        );

        component.onSearchTermChange(undefined);
        expect(component.filteredUserStatsRows.length).toBe(5);
        expect(component.filteredUserStatsRows.map((r) => r.userId)).toEqual(
          expectedIds
        );

        component.onSearchTermChange(null);
        expect(component.filteredUserStatsRows.length).toBe(5);
        expect(component.filteredUserStatsRows.map((r) => r.userId)).toEqual(
          expectedIds
        );
      });

      it('should filter by user id', () => {
        component.onSearchTermChange('U-1');
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['U-1']
        );
      });

      it('should filter by user name', () => {
        component.onSearchTermChange('User Name for U-1');
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['U-1']
        );
      });

      it('should filter by user type user', () => {
        component.onSearchTermChange('U-');
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['U-1', 'U-2', 'U-4']
        );
      });

      it('should filter by user type programmer', () => {
        component.onSearchTermChange('P-');
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['P-1', 'P-2']
        );
      });

      it('should filter by platform', () => {
        component.onSearchTermChange('web-desktop');
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['U-1', 'P-2']
        );
      });

      it('should filter by model', () => {
        component.onSearchTermChange('Model 1');
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['U-1', 'U-2']
        );
      });

      it('should clear filtered rows when statisticsData is null', () => {
        component.statisticsData = null;
        expect(component.filteredUserStatsRows).toEqual([]);

        component.onSearchTermChange('test');
        expect(component.filteredUserStatsRows).toEqual([]);
      });

      it('should clear filtered rows when statisticsData is undefined', () => {
        component.statisticsData = undefined as unknown as StatisticsData;
        expect(component.filteredUserStatsRows).toEqual([]);

        component.onSearchTermChange('test');
        expect(component.filteredUserStatsRows).toEqual([]);
      });

      it('should filter rows which have at least 3 target languages with >> operator', () => {
        component.onSearchTermChange('>>2');
        component['filteredUserStatsRows'].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        );
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['P-1', 'U-2']
        );
      });

      it('should filter rows which have less or equal to 3 target languages with << operator', () => {
        component.onSearchTermChange('<<4');
        component['filteredUserStatsRows'].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        );
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['P-2', 'U-1', 'U-2', 'U-4']
        );
      });

      it('should filter rows which have not target languages with << operator', () => {
        component.onSearchTermChange('<<1');
        component['filteredUserStatsRows'].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        );
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['P-2', 'U-4']
        );
      });

      it('should filter rows which have at least 2000 translated chars with > operator', () => {
        component.onSearchTermChange('>1999');
        component['filteredUserStatsRows'].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        );
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['P-1', 'U-2']
        );
      });

      it('should filter rows which have less or equal to 1000 translated chars with < operator', () => {
        component.onSearchTermChange('<1001');
        component['filteredUserStatsRows'].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        );
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['P-2', 'U-1', 'U-4']
        );
      });

      it('should filter rows which have no translated chars with < operator', () => {
        component.onSearchTermChange('<1');
        component['filteredUserStatsRows'].sort((a, b) =>
          a.userId.localeCompare(b.userId)
        );
        expect(component['filteredUserStatsRows'].map((r) => r.userId)).toEqual(
          ['P-2', 'U-4']
        );
      });
    });

    describe('onFilterData', () => {
      beforeEach(() => {
        localStorageServiceSpy.saveStatisticsDisplayMode.and.returnValue(
          Promise.resolve()
        );
        localStorageServiceSpy.saveStatisticsSelectedMonth.and.returnValue(
          Promise.resolve()
        );

        component.filterSelectedMonth = '2026-04';
        component.selectedMonthForStatisticsSections = '2026-04';
        component.displayMode = DisplayMode.User;
        component.selectedDisplayMode = DisplayMode.User;
      });

      it('should persist selected display mode', async () => {
        spyOn(component, 'init').and.resolveTo();
        component.selectedDisplayMode = DisplayMode.Programmer;

        await component.onFilterData();

        expect(component.displayMode).toBe(DisplayMode.Programmer);
        expect(
          localStorageServiceSpy.saveStatisticsDisplayMode
        ).toHaveBeenCalledWith(DisplayMode.Programmer);
      });

      it('should save filter selected month to local storage', async () => {
        spyOn(component, 'init').and.resolveTo();
        component.filterSelectedMonth = '2026-03';
        component.selectedMonthForStatisticsSections = '2026-02';

        await component.onFilterData();

        expect(component.filterSelectedMonth).toBe('2026-03');
        expect(component.selectedMonthForStatisticsSections).toBe('2026-03');
        expect(
          localStorageServiceSpy.saveStatisticsSelectedMonth
        ).toHaveBeenCalledWith('2026-03');
      });

      it('should handle error when saving selected month to local storage', async () => {
        const consoleErrorSpy = spyOn(console, 'error');
        localStorageServiceSpy.saveStatisticsSelectedMonth.and.returnValue(
          Promise.reject(new Error('Storage error'))
        );
        spyOn(component, 'init').and.resolveTo();
        component.filterSelectedMonth = '2026-03';

        await component.onFilterData();

        expect(component.filterSelectedMonth).toBe('2026-03');
        expect(component.selectedMonthForStatisticsSections).toBe('2026-03');
        expect(component.searchTerm).toBe('');
        expect(
          localStorageServiceSpy.saveStatisticsSelectedMonth
        ).toHaveBeenCalledWith('2026-03');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error saving selected month to local storage:',
          new Error('Storage error')
        );
      });

      it('should save display mode to local storage', async () => {
        spyOn(component, 'init').and.resolveTo();
        component.displayMode = DisplayMode.Programmer;
        component.selectedDisplayMode = DisplayMode.User;
        component.filterSelectedMonth = '2026-04';

        await component.onFilterData();

        expect(component.displayMode).toBe(DisplayMode.User);
        expect(
          localStorageServiceSpy.saveStatisticsDisplayMode
        ).toHaveBeenCalledWith(DisplayMode.User);
      });

      it('should handle error when saving display mode to local storage', async () => {
        const consoleErrorSpy = spyOn(console, 'error');
        localStorageServiceSpy.saveStatisticsDisplayMode.and.returnValue(
          Promise.reject(new Error('Storage error'))
        );
        component.displayMode = DisplayMode.Programmer;
        spyOn(component, 'init').and.resolveTo();

        await component.onFilterData();

        expect(component.displayMode).toBe(DisplayMode.User);
        expect(
          localStorageServiceSpy.saveStatisticsDisplayMode
        ).toHaveBeenCalledWith(DisplayMode.User);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error saving display mode to local storage:',
          new Error('Storage error')
        );
      });

      it('should call init to refresh data', async () => {
        spyOn(component, 'init').and.resolveTo();
        await component.onFilterData();
        expect(component.init).toHaveBeenCalled();
      });

      it('should clear search term when filter data', async () => {
        component.searchTerm = 'test';
        await component.onFilterData();

        expect(component.searchTerm).toBe('');
      });

      it('should not change filter fields when filter data', async () => {
        spyOn(component, 'init').and.resolveTo();
        const originalFilterSelectedMonth = component.filterSelectedMonth;
        const originalDisplayMode = component.selectedDisplayMode;

        await component.onFilterData();

        expect(component.filterSelectedMonth).toBe(originalFilterSelectedMonth);
        expect(component.selectedDisplayMode).toBe(originalDisplayMode);
      });
    });

    describe('showDetailInfos', () => {
      it('should call utilsService.openUserDetail with correct parameters', async () => {
        const lang = 'en';
        const userStatistic = {
          id: 'user1',
        } as unknown as DisplayedUserStatistics;
        component.displayMode = DisplayMode.Programmer;
        const openUserDetailSpy =
          utilsServiceSpy.openUserDetail.and.returnValue(Promise.resolve());
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
        it('should clear search term, load current user uid, display mode, isProgrammerDevice and contingent data', async () => {
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
          component.searchTerm = 'test';

          await component.init();

          expect(component.searchTerm).toBe('');
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
            firestoreUtilsServiceSpy.getUserStatisticsSummary.and.returnValue(
              []
            );
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

        it('should call setFilterValues', async () => {
          const setFilterValuesSpy = spyOn(
            component as any,
            'setFilterValues'
          ).and.callThrough();

          await component.init();
          expect(setFilterValuesSpy).toHaveBeenCalled();
        });
      });

      describe('setFilterValues', () => {
        it('should set displayMode, filterSelectedMonth based on local storage values, and load allFilterMonthValues', async () => {
          localStorageServiceSpy.getStatisticsDisplayMode.and.returnValue(
            Promise.resolve(DisplayMode.Programmer)
          );
          localStorageServiceSpy.getStatisticsSelectedMonth.and.returnValue(
            Promise.resolve('2026-04')
          );
          const getAllFirestoreSearchStringsForMonthSpy =
            utilsServiceSpy.getAllFirestoreSearchStringsForMonth.and.returnValue(
              ['2026-02', '2026-03', '2026-04']
            );
          component.displayMode = DisplayMode.User;
          component.selectedDisplayMode = DisplayMode.User;
          component.filterSelectedMonth = '2026-03';
          component.selectedMonthForStatisticsSections = '2026-03';

          await (component as any).setFilterValues();
          await fixture.whenStable();

          expect(
            localStorageServiceSpy.getStatisticsDisplayMode
          ).toHaveBeenCalled();
          expect(
            localStorageServiceSpy.getStatisticsSelectedMonth
          ).toHaveBeenCalled();
          expect(getAllFirestoreSearchStringsForMonthSpy).toHaveBeenCalled();

          expect(component.displayMode)
            .withContext('displayMode')
            .toBe(DisplayMode.Programmer);
          expect(component.selectedDisplayMode)
            .withContext('selectedDisplayMode')
            .toBe(DisplayMode.Programmer);
          expect(component.filterSelectedMonth)
            .withContext('filterSelectedMonth')
            .toBe('2026-04');
          expect(component.selectedMonthForStatisticsSections)
            .withContext('selectedMonthForStatisticsSections')
            .toBe('2026-04');
          expect(component.allFilterMonthValues)
            .withContext('allFilterMonthValues')
            .toEqual(['2026-02', '2026-03', '2026-04']);
        });
      });
    });
  });

  describe('template rendering', () => {
    describe('spinner', () => {
      it('should show spinner when isLoading is true', () => {
        component.isLoading = true;
        fixture.detectChanges();
        const spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(spinner).toBeTruthy();
      });

      it('should hide spinner when isLoading is false', () => {
        component.isLoading = false;
        fixture.detectChanges();
        const spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(spinner).toBeNull();
      });

      it('should show spinner during init', async () => {
        const initPromise = component.init();
        fixture.detectChanges();
        let spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(component.isLoading).toBeTrue();
        expect(spinner).toBeTruthy();

        await initPromise;
        fixture.detectChanges();
        spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(component.isLoading).toBeFalse();
        expect(spinner).toBeNull();
      });

      it('should render only one spinner if isNative = false (desktop/web)', () => {
        spyOnProperty(component, 'isNative', 'get').and.returnValue(false);
        component.isLoading = true;
        fixture.detectChanges();

        const spinners = fixture.nativeElement.querySelectorAll('app-spinner');
        expect(spinners.length).toBe(1);
      });

      it('should render two spinner elements if isNative = true (one at the top and one at the bottom, so a spinner is always visible regardless of scroll position)', () => {
        // On native devices, the template intentionally renders two <app-spinner> elements:
        // one at the top and one at the bottom of the page. This ensures that a loading spinner
        // is always visible to the user, even if they have scrolled to the top or bottom.
        // In the DOM, both spinners are present, but typically only one is visible in the viewport at a time.
        spyOnProperty(component, 'isNative', 'get').and.returnValue(true);
        component.isLoading = true;
        fixture.detectChanges();

        const spinners = fixture.nativeElement.querySelectorAll('app-spinner');
        expect(spinners.length).toBe(2);
      });
    });

    describe('display statistics', () => {
      it('should show statistics content when not loading', () => {
        component.isLoading = false;
        fixture.detectChanges();
        const statisticsContent =
          fixture.nativeElement.querySelector('.stat-section');
        expect(statisticsContent).toBeTruthy();
      });

      it('should not show statistics content when loading', () => {
        component.isLoading = true;
        fixture.detectChanges();
        const statisticsContent =
          fixture.nativeElement.querySelector('.stat-section');
        expect(statisticsContent).toBeNull();
      });
    });

    describe('display flter section', () => {
      it('should show flter section when programmerDevice is true', () => {
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const statisticsContent =
          fixture.nativeElement.querySelector('.filter-section');
        const displayModeSegment = fixture.nativeElement.querySelector(
          '.filter-section .display-mode'
        );
        const filterByMonthSegment = fixture.nativeElement.querySelector(
          '.filter-section .filter-month'
        );
        const filterDataButton = fixture.nativeElement.querySelector(
          '.filter-section .filter-data-btn'
        );
        expect(statisticsContent).withContext('statisticsContent').toBeTruthy();
        expect(displayModeSegment)
          .withContext('displayModeSegment')
          .toBeTruthy();
        expect(filterByMonthSegment)
          .withContext('filterByMonthSegment')
          .toBeTruthy();
        expect(filterDataButton).withContext('filterDataButton').toBeTruthy();
      });

      it('should not show flter section when programmerDevice is false', () => {
        component.isProgrammerDevice = false;
        fixture.detectChanges();

        const statisticsContent =
          fixture.nativeElement.querySelector('.filter-section');
        const displayModeSegment = fixture.nativeElement.querySelector(
          '.filter-section .display-mode'
        );
        const filterByMonthSegment = fixture.nativeElement.querySelector(
          '.filter-section .filter-month'
        );
        const filterDataButton = fixture.nativeElement.querySelector(
          '.filter-section .filter-data-btn'
        );
        expect(statisticsContent).withContext('statisticsContent').toBeNull();
        expect(displayModeSegment).withContext('displayModeSegment').toBeNull();
        expect(filterByMonthSegment)
          .withContext('filterByMonthSegment')
          .toBeNull();
        expect(filterDataButton).withContext('filterDataButton').toBeNull();
      });
    });

    describe('display stop translation for all users message', () => {
      it('should not show section if isAllMonthsSelected is true', () => {
        component.filterSelectedMonth = AllMonthsOption.SelectOptionValue;
        fixture.detectChanges();
        const stopTranslationSection = fixture.nativeElement.querySelector(
          '.global-stop-section'
        );
        expect(stopTranslationSection).toBeNull();
      });

      it('should show stop translation message when isStopped is true', () => {
        component.isStopped = true;
        fixture.detectChanges();
        const stopTranslationMessage = fixture.nativeElement.querySelector(
          '.stopped.global-stop-flag'
        );
        expect(stopTranslationMessage).toBeTruthy();
      });

      it('should not show stop translation message when isStopped is false', () => {
        component.isStopped = false;
        fixture.detectChanges();
        const stopTranslationMessage = fixture.nativeElement.querySelector(
          '.stopped.global-stop-flag'
        );
        expect(stopTranslationMessage).toBeNull();
      });
    });

    describe('display total contingent', () => {
      it('should show monthly section if isAllMonthsSelected is false', () => {
        component.filterSelectedMonth = '2026-03';
        fixture.detectChanges();
        const monthlySection = fixture.nativeElement.querySelector(
          '.total-contingent-monthly'
        );
        const allMonthsSection = fixture.nativeElement.querySelector(
          '.total-contingent-all-months'
        );
        expect(monthlySection).toBeTruthy();
        expect(allMonthsSection).toBeNull();
      });

      it('should show all months section if isAllMonthsSelected is true', () => {
        component.filterSelectedMonth = AllMonthsOption.SelectOptionValue;
        fixture.detectChanges();
        const monthlySection = fixture.nativeElement.querySelector(
          '.total-contingent-monthly'
        );
        const allMonthsSection = fixture.nativeElement.querySelector(
          '.total-contingent-all-months'
        );
        expect(monthlySection).toBeNull();
        expect(allMonthsSection).toBeTruthy();
      });

      it('should show total difference info when allUsersCharCount is not equal to totalCharCount', () => {
        component.allUsersCharCount = 100000;
        component.totalCharCount = 100001;
        fixture.detectChanges();
        const totalDifferenceInfo = fixture.nativeElement.querySelector(
          '.total-all-users-difference'
        );
        expect(totalDifferenceInfo).toBeTruthy();
      });

      it('should not show total difference info when allUsersCharCount is equal to totalCharCount', () => {
        component.allUsersCharCount = 100000;
        component.totalCharCount = 100000;
        fixture.detectChanges();
        const totalDifferenceInfo = fixture.nativeElement.querySelector(
          '.total-all-users-difference'
        );
        expect(totalDifferenceInfo).toBeNull();
      });
    });

    describe('statistics overview', () => {
      it('should show statistics overview section when displaymode is programmer and is programmer device', () => {
        component.displayMode = DisplayMode.Programmer;
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const statisticsContent = fixture.nativeElement.querySelector(
          '.user-statistics-overview'
        );
        expect(statisticsContent).toBeTruthy();
      });

      it('should not show statistics overview section when displaymode is user', () => {
        component.displayMode = DisplayMode.User;
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const statisticsContent = fixture.nativeElement.querySelector(
          '.user-statistics-overview'
        );
        expect(statisticsContent).toBeNull();
      });

      it('should not show statistics overview section when not programmer device', () => {
        component.displayMode = DisplayMode.Programmer;
        component.isProgrammerDevice = false;
        fixture.detectChanges();

        const statisticsContent = fixture.nativeElement.querySelector(
          '.user-statistics-overview'
        );
        expect(statisticsContent).toBeNull();
      });
    });

    describe('Search bar in user statistics details section', () => {
      it('should show search bar when displaymode is programmer and is programmer device', () => {
        component.displayMode = DisplayMode.Programmer;
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const searchBar = fixture.nativeElement.querySelector(
          '.user-stat-details ion-searchbar'
        );
        expect(searchBar).toBeTruthy();
      });

      it('should not show search bar when displaymode is user', () => {
        component.displayMode = DisplayMode.User;
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const searchBar = fixture.nativeElement.querySelector(
          '.user-stat-details ion-searchbar'
        );
        expect(searchBar).toBeNull();
      });

      it('should not show search bar when not programmer device', () => {
        component.displayMode = DisplayMode.Programmer;
        component.isProgrammerDevice = false;
        fixture.detectChanges();

        const searchBar = fixture.nativeElement.querySelector(
          '.user-stat-details ion-searchbar'
        );
        expect(searchBar).toBeNull();
      });
    });

    describe('JSON raw data section', () => {
      it('should show raw data section when displaymode is programmer and is programmer device', () => {
        component.displayMode = DisplayMode.Programmer;
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const statisticsContent =
          fixture.nativeElement.querySelector('.debug-section');
        expect(statisticsContent).toBeTruthy();
      });

      it('should not show raw data section when displaymode is user', () => {
        component.displayMode = DisplayMode.User;
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const statisticsContent =
          fixture.nativeElement.querySelector('.debug-section');
        expect(statisticsContent).toBeNull();
      });

      it('should not show raw data section when not programmer device', () => {
        component.displayMode = DisplayMode.Programmer;
        component.isProgrammerDevice = false;
        fixture.detectChanges();

        const statisticsContent =
          fixture.nativeElement.querySelector('.debug-section');
        expect(statisticsContent).toBeNull();
      });
    });

    describe('JSON raw data section - details toggles', () => {
      let rawDebugRoot: HTMLDetailsElement;
      let displayedValuesDetail: HTMLDetailsElement;
      let translationStatsDetail: HTMLDetailsElement;
      let userMappingDetail: HTMLDetailsElement;
      let programmerDevicesDetail: HTMLDetailsElement;

      function toggle(el: HTMLDetailsElement, open: boolean): void {
        el.open = open;
        el.dispatchEvent(new Event('toggle'));
        fixture.detectChanges();
      }

      beforeEach(() => {
        component.isLoading = false;
        component.isProgrammerDevice = true;
        component.displayMode = DisplayMode.Programmer;
        component.statisticsData = {
          displayedUserStatistics: [],
          userTranslationStatistics: [],
          users: [],
          programmerDeviceUIDs: [],
        };

        component.showRawDebugDetails = false;
        component.showDisplayedValuesDetail = false;
        component.showTranslationStatisticsDetail = false;
        component.showUserMappingDetail = false;
        component.showProgrammerDevicesDetail = false;

        fixture.detectChanges();

        const details = fixture.nativeElement.querySelectorAll(
          '.debug-section details'
        ) as NodeListOf<HTMLDetailsElement>;

        rawDebugRoot = details[0];
        displayedValuesDetail = details[1];
        translationStatsDetail = details[2];
        userMappingDetail = details[3];
        programmerDevicesDetail = details[4];
      });

      it('should flip only displayed values boolean when its details is toggled', () => {
        toggle(displayedValuesDetail, true);

        expect(component.showDisplayedValuesDetail).toBeTrue();
        expect(component.showTranslationStatisticsDetail).toBeFalse();
        expect(component.showUserMappingDetail).toBeFalse();
        expect(component.showProgrammerDevicesDetail).toBeFalse();
      });

      it('should flip only translation statistics boolean when its details is toggled', () => {
        toggle(translationStatsDetail, true);

        expect(component.showDisplayedValuesDetail).toBeFalse();
        expect(component.showTranslationStatisticsDetail).toBeTrue();
        expect(component.showUserMappingDetail).toBeFalse();
        expect(component.showProgrammerDevicesDetail).toBeFalse();
      });

      it('should flip only user mapping boolean when its details is toggled', () => {
        toggle(userMappingDetail, true);

        expect(component.showDisplayedValuesDetail).toBeFalse();
        expect(component.showTranslationStatisticsDetail).toBeFalse();
        expect(component.showUserMappingDetail).toBeTrue();
        expect(component.showProgrammerDevicesDetail).toBeFalse();
      });

      it('should flip only programmer devices boolean when its details is toggled', () => {
        toggle(programmerDevicesDetail, true);

        expect(component.showDisplayedValuesDetail).toBeFalse();
        expect(component.showTranslationStatisticsDetail).toBeFalse();
        expect(component.showUserMappingDetail).toBeFalse();
        expect(component.showProgrammerDevicesDetail).toBeTrue();
      });

      it('collapsing parent should not force nested booleans to true', () => {
        toggle(rawDebugRoot, true);
        expect(component.showRawDebugDetails).toBeTrue();
        expect(component.showDisplayedValuesDetail).toBeFalse();
        expect(component.showTranslationStatisticsDetail).toBeFalse();
        expect(component.showUserMappingDetail).toBeFalse();
        expect(component.showProgrammerDevicesDetail).toBeFalse();

        toggle(rawDebugRoot, false);
        expect(component.showRawDebugDetails).toBeFalse();
        expect(component.showDisplayedValuesDetail).toBeFalse();
        expect(component.showTranslationStatisticsDetail).toBeFalse();
        expect(component.showUserMappingDetail).toBeFalse();
        expect(component.showProgrammerDevicesDetail).toBeFalse();
      });
    });

    describe('current user selection', () => {
      beforeEach(() => {
        component.isLoading = false;
        component.displayMode = DisplayMode.User;
        component.isProgrammerDevice = false;
        component.userLimit = 10000;
        component.currentUserUid = 'U-2';

        Object.defineProperty(utilsServiceSpy, 'isPortrait', {
          value: false,
          configurable: true,
        });

        component.statisticsData = {
          displayedUserStatistics: [
            createUserStat('U-1', 10000, new Date('2026-03-15T00:00:00Z')),
            createUserStat('U-2', 9000, null),
          ],
          userTranslationStatistics: [],
          users: [],
          programmerDeviceUIDs: [],
        };
      });

      it('should add user-contingent-exceeded class when translated chars reach user limit', () => {
        fixture.detectChanges();

        const rows = fixture.nativeElement.querySelectorAll(
          '.user-stat-details ion-row.detail-row'
        );

        expect(rows.length).toBe(2);
        expect(
          rows[0].classList.contains('user-contingent-exceeded')
        ).toBeTrue();
        expect(
          rows[1].classList.contains('user-contingent-exceeded')
        ).toBeFalse();
      });

      it('should add my-device class only for current user row', () => {
        fixture.detectChanges();

        const rows = fixture.nativeElement.querySelectorAll(
          '.user-stat-details ion-row.detail-row'
        );

        expect(rows.length).toBe(2);
        expect(rows[0].classList.contains('my-device')).toBeFalse();
        expect(rows[1].classList.contains('my-device')).toBeTrue();
      });

      it('should use creationDate when lastTranslationDate is null', () => {
        fixture.detectChanges();

        const formattedDates = utilsServiceSpy.formatDateISO.calls
          .allArgs()
          .map((args) => args[0] as Date | null);

        expect(formattedDates).toContain(new Date('2026-03-15T00:00:00Z'));
        expect(formattedDates).toContain(new Date('2026-03-10T00:00:00Z'));
      });

      it('should show platform and device model when display mode is Programmer', () => {
        component.displayMode = DisplayMode.Programmer;
        component.isProgrammerDevice = true;
        fixture.detectChanges();

        const platformColumn = fixture.nativeElement.querySelector(
          '.user-stat-details ion-col.platform-info'
        );
        const platformColumnWithModelInfo = fixture.nativeElement.querySelector(
          '.user-stat-details ion-col.platform-info .model-info'
        );

        expect(platformColumn).toBeTruthy();
        expect(platformColumnWithModelInfo).toBeTruthy();
      });

      it('should show platform but not device model when display mode is User', () => {
        component.displayMode = DisplayMode.User;
        fixture.detectChanges();

        const platformColumn = fixture.nativeElement.querySelector(
          '.user-stat-details ion-col.platform-info'
        );
        const platformColumnWithModelInfo = fixture.nativeElement.querySelector(
          '.user-stat-details ion-col.platform-info .model-info'
        );

        expect(platformColumn).toBeTruthy();
        expect(platformColumnWithModelInfo).toBeNull();
      });
    });

    describe('status and contingent indicators', () => {
      beforeEach(() => {
        component.isLoading = false;
      });

      it('should apply stopped class when translations are globally stopped', () => {
        component.isStopped = true;
        fixture.detectChanges();

        const statusText =
          fixture.nativeElement.querySelector('p.global-stop-flag');

        expect(statusText).toBeTruthy();
        expect(statusText.classList.contains('stopped')).toBeTrue();
      });

      it('should apply contingent warning classes when checksum differs and no quota remains', () => {
        component.allUsersCharCount = 1200;
        component.totalCharCount = 1000;
        component.totalRemaining = 0;
        fixture.detectChanges();

        const checksumText = fixture.nativeElement.querySelector(
          'p.total-all-users-difference'
        );
        const remainingValue =
          fixture.nativeElement.querySelector('span.exceeded');

        expect(checksumText).toBeTruthy();
        expect(remainingValue).toBeTruthy();
      });
    });

    describe('optional grid columns', () => {
      beforeEach(() => {
        component.isLoading = false;
        component.statisticsData = {
          displayedUserStatistics: [
            createUserStat('U-1', 1000, new Date('2026-03-15T00:00:00Z'), [
              'en',
              'de',
            ]),
          ],
          userTranslationStatistics: [],
          users: [],
          programmerDeviceUIDs: [],
        };
      });

      it('should hide the language-count column when display mode is User', () => {
        component.displayMode = DisplayMode.User;
        (component as any).isPortrait = false;

        fixture.detectChanges();

        const languageHeaderIcon = fixture.nativeElement.querySelector(
          '.user-stat-details ion-row.header-row ion-icon[name="language-outline"]'
        );
        const detailCols = fixture.nativeElement.querySelectorAll(
          '.user-stat-details ion-row.detail-row ion-col'
        );

        expect(languageHeaderIcon).toBeNull();
        expect(detailCols.length).toBe(5);
      });

      it('should hide the translation-date column in portrait mode', () => {
        component.displayMode = DisplayMode.Programmer;
        Object.defineProperty(utilsServiceSpy, 'isPortrait', {
          value: true,
          configurable: true,
        });

        fixture.detectChanges();

        const translationDateCell = fixture.nativeElement.querySelector(
          '.user-stat-details .translation-date'
        );

        expect(translationDateCell).toBeNull();
      });
    });

    describe('translation date', () => {
      let translationDate: Date;
      let createdDate: Date;
      let statisticData: StatisticsData;

      beforeEach(() => {
        translationDate = new Date('2026-03-15T12:34:56Z');
        createdDate = new Date('2026-03-10T08:00:00Z');

        statisticData = {
          displayedUserStatistics: [
            {
              ...createUserStat('U-1', 1000, translationDate, ['en', 'de']),
              userCreatedAt: createdDate,
            },
          ],
          userTranslationStatistics: [],
          users: [],
          programmerDeviceUIDs: [],
        };

        (component as any).isPortrait = false;
      });

      it('should display lastTranslationDate when available', () => {
        spyOn(component, 'getFormatDateTime').and.callFake((date: Date) => {
          return date ? date.toISOString().split('T')[0] : '';
        });

        component.statisticsData = statisticData;
        component.displayMode = DisplayMode.User;
        fixture.detectChanges();

        const translationDateCell = fixture.nativeElement.querySelector(
          '.user-stat-details .detail-row .translation-date'
        );

        expect(translationDateCell).toBeTruthy();
        expect(translationDateCell.textContent.trim()).toBe('2026-03-15');
      });

      it('should use creationDate when lastTranslationDate is null', () => {
        spyOn(component, 'getFormatDateTime').and.callFake((date: Date) => {
          return date ? date.toISOString().split('T')[0] : '';
        });

        statisticData.displayedUserStatistics[0].lastTranslationDate = null;
        component.statisticsData = statisticData;
        component.displayMode = DisplayMode.User;
        fixture.detectChanges();

        const translationDateCell = fixture.nativeElement.querySelector(
          '.user-stat-details .detail-row .translation-date'
        );

        expect(translationDateCell).toBeTruthy();
        expect(translationDateCell.textContent.trim()).toBe('2026-03-10');
      });

      it('should hide translation-date column when portrait mode', () => {
        spyOn(component, 'getFormatDateTime').and.returnValue('2026-03-15');

        component.statisticsData = statisticData;
        component.displayMode = DisplayMode.User;
        (component as any).isPortrait = true;

        fixture.detectChanges();

        const translationDateCell = fixture.nativeElement.querySelector(
          '.user-stat-details .detail-row .translation-date'
        );

        expect(translationDateCell).toBeNull();
      });

      it('should call getFormatDateTime with correct date parameter', () => {
        const getFormatDateTimeSpy = spyOn(
          component,
          'getFormatDateTime'
        ).and.returnValue('2026-03-15');

        component.statisticsData = statisticData;
        component.displayMode = DisplayMode.User;
        fixture.detectChanges();

        expect(getFormatDateTimeSpy).toHaveBeenCalledWith(translationDate);
      });

      it('should verify conditional logic: uses lastTranslationDate when present, falls back to userCreatedAt when null', () => {
        spyOn(component, 'getFormatDateTime').and.callFake((date: Date) => {
          return date ? date.toISOString().split('T')[0] : '';
        });

        // Test case 1: lastTranslationDate present
        component.statisticsData = statisticData;
        component.displayMode = DisplayMode.User;
        fixture.detectChanges();

        let translationDateCell = fixture.nativeElement.querySelector(
          '.user-stat-details .detail-row .translation-date'
        );
        const dateWithLastTranslation = translationDateCell.textContent.trim();

        // Test case 2: lastTranslationDate null
        statisticData.displayedUserStatistics[0].lastTranslationDate = null;
        component.statisticsData = {
          ...statisticData,
          displayedUserStatistics: [...statisticData.displayedUserStatistics],
        };
        fixture.detectChanges();

        translationDateCell = fixture.nativeElement.querySelector(
          '.user-stat-details .detail-row .translation-date'
        );
        const dateWithCreation = translationDateCell.textContent.trim();

        // Verify they use different dates
        expect(dateWithLastTranslation).toBe('2026-03-15');
        expect(dateWithCreation).toBe('2026-03-10');
        expect(dateWithLastTranslation).not.toEqual(dateWithCreation);
      });
    });

    describe('info button interactions', () => {
      beforeEach(() => {
        component.lang = 'en';
        component.isLoading = false;
        component.displayMode = DisplayMode.User;
        Object.defineProperty(utilsServiceSpy, 'isPortrait', {
          value: false,
          configurable: true,
        });

        component.statisticsData = {
          displayedUserStatistics: [createUserStat()],
          userTranslationStatistics: [],
          users: [],
          programmerDeviceUIDs: [],
        };
      });

      it('should call showDetailInfos when the info button is clicked', () => {
        const showDetailInfosSpy = spyOn(component, 'showDetailInfos');
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector(
          '.user-stat-details .info-btn'
        );

        button.dispatchEvent(new Event('click'));
        fixture.detectChanges();

        expect(showDetailInfosSpy).toHaveBeenCalledWith(
          'en',
          jasmine.objectContaining({ userId: 'U-1' })
        );
      });
    });

    describe('language templates', () => {
      beforeEach(() => {
        component.isLoading = false;
      });

      it('should render german template when lang is de', () => {
        component.lang = 'de';
        fixture.detectChanges();

        const text = (fixture.nativeElement.textContent || '').replace(
          /\s+/g,
          ' '
        );

        expect(text).toContain(
          'Google Firebase/Firestore speichert folgende Daten:'
        );
        expect(text).not.toContain(
          'Google Firebase/Firestore stores the following data:'
        );
      });

      it('should render english template when lang is en', () => {
        component.lang = 'en';
        fixture.detectChanges();

        const text = (fixture.nativeElement.textContent || '').replace(
          /\s+/g,
          ' '
        );

        expect(text).toContain(
          'Google Firebase/Firestore stores the following data:'
        );
        expect(text).not.toContain(
          'Google Firebase/Firestore speichert folgende Daten:'
        );
      });

      it('should fallback to english template when lang is not de', () => {
        component.lang = 'fr';
        fixture.detectChanges();

        const text = (fixture.nativeElement.textContent || '').replace(
          /\s+/g,
          ' '
        );

        expect(text).toContain(
          'Google Firebase/Firestore stores the following data:'
        );
        expect(text).not.toContain(
          'Google Firebase/Firestore speichert folgende Daten:'
        );
      });
    });
  });
});
