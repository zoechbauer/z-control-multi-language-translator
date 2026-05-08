import { TestBed } from '@angular/core/testing';
import * as angularFireAuth from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as firestoreFns from '@angular/fire/firestore';
import * as functionsFns from '@angular/fire/functions';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { UtilsService } from './utils.service';
import {
  FirestoreContingentData,
  ProgrammerDeviceUID,
  UserTranslationStatistics,
  UserType,
} from '../shared/firebase-firestore.interfaces';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from './toast.service';
import { ToastAnchor, AllMonthsOption } from '../shared/enums';
import { environment } from 'src/environments/environment';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { FirebaseFirestoreAuthWrapperService } from './firebase-firestore-auth-wrapper.service';
import { DeviceUtils } from './device-utils.service';

describe('FirebaseFirestoreService', () => {
  let service: FirebaseFirestoreService;

  const userStub: angularFireAuth.User = {
    uid: 'anonymous-uid',
    emailVerified: false,
    isAnonymous: true,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: () => Promise.resolve(),
    getIdToken: () => Promise.resolve('token'),
    getIdTokenResult: () => Promise.resolve({} as any),
    reload: () => Promise.resolve(),
    toJSON: () => ({}),
    displayName: null,
    email: null,
    phoneNumber: null,
    photoURL: null,
    providerId: '',
  };

  let _currentUser: angularFireAuth.User | null = userStub;
  const authMock: any = {};
  Object.defineProperty(authMock, 'currentUser', {
    get: () => _currentUser,
    set: (val) => {
      _currentUser = val;
    },
    configurable: true,
  });

  let authStateCallback: Function | null = null;
  const authWrapperMock = {
    signInAnonymously: jasmine.createSpy('signInAnonymously').and.resolveTo({
      user: userStub,
      providerId: null,
      operationType: 'signIn',
    }),
    onAuthStateChanged: jasmine
      .createSpy('onAuthStateChanged')
      .and.callFake((auth: any, callback: Function) => {
        return () => {};
      }),
  };

  const firestoreMock = {} as Firestore;
  const functionsMock = {} as Functions;

  const utilsServiceMock = {
    isNative: false,
    getCurrentMonth: () => '2026-04',
    formatDateTimeFirestoreSearchString: (date: Date | null) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return year + '-' + month;
    },
    getAllFirestoreSearchStringsForMonth: () => [] as string[],
  };

  const localStorageServiceMock = {
    firestoreUid$: of('anonymous-uid'),
    saveFirestoreUid: jasmine
      .createSpy('saveFirestoreUid')
      .and.resolveTo(undefined),
  };

  const toastServiceMock = {
    showToast: jasmine.createSpy('showToast'),
  };

  let getDeviceInfoSpy: jasmine.Spy;
  const mockDeviceInfo = {
    userAgent: 'test ua',
    platform: 'Test Platform',
    language: 'en',
    appVersion: { major: 1, minor: 0, date: '2026-03-09' },
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FirebaseFirestoreService,
        {
          provide: FirebaseFirestoreAuthWrapperService,
          useValue: authWrapperMock,
        },
        { provide: angularFireAuth.Auth, useValue: authMock },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: Firestore, useValue: firestoreMock },
        { provide: Functions, useValue: functionsMock },
        { provide: UtilsService, useValue: utilsServiceMock },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    });

    service = TestBed.inject(FirebaseFirestoreService);

    localStorageServiceMock.saveFirestoreUid.calls.reset();
    toastServiceMock.showToast.calls.reset();
    _currentUser = userStub;
    authWrapperMock.signInAnonymously.calls.reset();
    authWrapperMock.onAuthStateChanged.calls.reset();
    getDeviceInfoSpy = spyOn(DeviceUtils, 'getDeviceInfo').and.returnValue(
      mockDeviceInfo
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should call authenticateUser and getIsProgrammerDevice', async () => {
      spyOn<any>(service, 'authenticateUser').and.resolveTo();
      spyOn(service, 'getIsProgrammerDevice').and.resolveTo(false);

      await service.init();

      expect((service as any).authenticateUser).toHaveBeenCalled();
      expect(service.getIsProgrammerDevice).toHaveBeenCalled();
    });

    it('should set isProgrammerDevice to false when getIsProgrammerDevice resolves false', async () => {
      spyOn<any>(service, 'authenticateUser').and.resolveTo();
      spyOn(service, 'getIsProgrammerDevice').and.resolveTo(false);

      await service.init();

      expect(service.isProgrammerDevice).toBeFalse();
    });

    it('should set isProgrammerDevice to true when getIsProgrammerDevice resolves true', async () => {
      spyOn<any>(service, 'authenticateUser').and.resolveTo();
      spyOn(service, 'getIsProgrammerDevice').and.resolveTo(true);

      await service.init();

      expect(service.isProgrammerDevice).toBeTrue();
    });

    it('should call authenticateUser before getIsProgrammerDevice', async () => {
      const callOrder: string[] = [];
      spyOn<any>(service, 'authenticateUser').and.callFake(async () => {
        callOrder.push('authenticateUser');
      });
      spyOn(service, 'getIsProgrammerDevice').and.callFake(async () => {
        callOrder.push('getIsProgrammerDevice');
        return false;
      });

      await service.init();

      expect(callOrder).toEqual(['authenticateUser', 'getIsProgrammerDevice']);
    });
  });

  describe('readContingentData', () => {
    beforeEach(() => {
        spyOn(utilsServiceMock, 'getCurrentMonth').and.returnValue('2026-04');
      });
      
    it('should return contingent data when document exists', async () => {
      const flags: FirestoreContingentData = {
        StopTranslationForAllUsers: true,
      };

      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => true,
        data: () => flags,
      } as any);

      const result = await service.readContingentData('2026-04');

      expect((service as any).getFirestoreDoc).toHaveBeenCalled();
      expect((service as any).getFirestoreDocSnapshot).toHaveBeenCalledWith(
        fakeRef
      );
      expect(result).toEqual(flags);
    });

    it('should return empty object when selected month is "all"', async () => {
      const result = await service.readContingentData(
        AllMonthsOption.SelectOptionValue
      );
      expect(result).toEqual({});
    });

    it('should return empty object when document does not exist', async () => {
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => false,
        data: () => undefined,
      } as any);

      const result = await service.readContingentData('2026-04');

      expect(result).toEqual({});
    });

    it('should return empty object when document exists but data is undefined', async () => {
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => true,
        data: () => undefined,
      } as any);

      const result = await service.readContingentData('2026-04');

      expect(result).toEqual({});
    });

    it('should return empty object and show toast when snapshot read fails', async () => {
      spyOn(console, 'error');
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.rejectWith(
        new Error('firestore read failed')
      );

      const result = await service.readContingentData('2026-04');

      expect(result).toEqual({});
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'Error reading contingent data.',
        ToastAnchor.TRANSLATE_PAGE
      );
    });
  });

  describe('createMissingContingentData', () => {
    it('should call cloud function createMissingContingentData with empty payload', async () => {
      const callableSpy = jasmine
        .createSpy('createMissingContingentDataCallable')
        .and.resolveTo(undefined);

      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      await service.createMissingContingentData();

      expect(httpsCallableSpy).toHaveBeenCalledWith(
        'createMissingContingentData'
      );
      expect(callableSpy).toHaveBeenCalledWith({});
      expect(toastServiceMock.showToast).not.toHaveBeenCalled();
    });

    it('should show toast when cloud function fails', async () => {
      spyOn(console, 'error');
      const callableSpy = jasmine
        .createSpy('createMissingContingentDataCallable')
        .and.rejectWith(new Error('call failed'));

      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      await service.createMissingContingentData();

      expect(httpsCallableSpy).toHaveBeenCalledWith(
        'createMissingContingentData'
      );
      expect(callableSpy).toHaveBeenCalledWith({});
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'Error creating missing contingent data.',
        ToastAnchor.TRANSLATE_PAGE
      );
    });
  });

  describe('getCharCountForUser', () => {
    it('should return character count and target languages for user when document exist', async () => {
      (service as any).user = { uid: 'test-uid' } as any;
      const expectedResult = {
        charCount: 123,
        targetLanguages: ['en', 'fr'],
      } as any;

      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => true,
        data: () => expectedResult,
      } as any);

      const result = await service.getCharCountForUser();

      expect((service as any).getFirestoreDoc).toHaveBeenCalled();
      expect((service as any).getFirestoreDocSnapshot).toHaveBeenCalledWith(
        fakeRef
      );
      expect(result).toEqual(expectedResult);
    });

    it('should return zero character count and empty target languages when user does not exist', async () => {
      (service as any).user = null;
      const result = await service.getCharCountForUser();
      expect(result).toEqual({ charCount: 0, targetLanguages: [] });
    });

    it('should return zero character count and empty target languages when fields are missing', async () => {
      (service as any).user = { uid: 'test-uid' } as any;
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => true,
        data: () => ({}),
      } as any);

      const result = await service.getCharCountForUser();

      expect(result).toEqual({ charCount: 0, targetLanguages: [] });
    });

    it('should return zero character count and empty target languages when document does not exist', async () => {
      (service as any).user = { uid: 'test-uid' } as any;
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => false,
        data: () => undefined,
      } as any);

      const result = await service.getCharCountForUser();

      expect((service as any).getFirestoreDoc).toHaveBeenCalled();
      expect((service as any).getFirestoreDocSnapshot).toHaveBeenCalledWith(
        fakeRef
      );
      expect(result).toEqual({ charCount: 0, targetLanguages: [] });
    });

    it('should log error and return zero character count and empty target languages when snapshot read fails', async () => {
      spyOn(console, 'error');
      (service as any).user = { uid: 'test-uid' } as any;
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.rejectWith(
        new Error('firestore read failed')
      );

      const result = await service.getCharCountForUser();

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching char count for user:',
        new Error('firestore read failed')
      );
      expect(result).toEqual({ charCount: 0, targetLanguages: [] });
    });
  });

  describe('getTotalCharCount', () => {
    it('should return total character count when document exists', async () => {
      (service as any).user = { uid: 'test-uid' } as any;
      const expectedTotal = 456;
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => true,
        data: () => ({ charCount: expectedTotal }),
      } as any);

      const result = await service.getTotalCharCount();
      expect((service as any).getFirestoreDoc).toHaveBeenCalled();
      expect((service as any).getFirestoreDocSnapshot).toHaveBeenCalledWith(
        fakeRef
      );
      expect(result).toEqual(expectedTotal);
    });

    it('should return zero when document does not exist', async () => {
      (service as any).user = { uid: 'test-uid' } as any;
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => false,
        data: () => undefined,
      } as any);

      const result = await service.getTotalCharCount();
      expect((service as any).getFirestoreDoc).toHaveBeenCalled();
      expect((service as any).getFirestoreDocSnapshot).toHaveBeenCalledWith(
        fakeRef
      );
      expect(result).toEqual(0);
    });

    it('should return zero when user does not exist', async () => {
      (service as any).user = null;
      const result = await service.getTotalCharCount();
      expect(result).toEqual(0);
    });

    it('should log error and return zero when snapshot read fails', async () => {
      spyOn(console, 'error');
      (service as any).user = { uid: 'test-uid' } as any;
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.rejectWith(
        new Error('firestore read failed')
      );

      const result = await service.getTotalCharCount();

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching total char count:',
        new Error('firestore read failed')
      );
      expect(result).toEqual(0);
    });
  });

  describe('getCurrentUserId', () => {
    it('should return current user ID when user is authenticated', () => {
      (service as any).user = { uid: 'test-uid' } as any;
      const result = service.getCurrentUserId();
      expect(result).toBe('test-uid');
    });

    it('should return null when no user is authenticated', () => {
      (service as any).user = null;
      const result = service.getCurrentUserId();
      expect(result).toBeNull();
    });
  });

  describe('getAllUserTranslationStatisticsForMonth', () => {
    it('should return mapped user translation statistics when snapshot has docs', async () => {
      const snapshotMock = {
        forEach: (cb: (doc: any) => void) => {
          cb({
            id: 'U-1',
            data: () => ({
              charCount: 100,
              targetLanguages: ['en'],
              lastUpdated: {
                toDate: () => new Date('2026-03-01T00:00:00.000Z'),
              },
            }),
          });
          cb({
            id: 'U-2',
            data: () => ({
              charCount: 200,
              targetLanguages: ['fr'],
              lastUpdated: {
                toDate: () => new Date('2026-03-01T00:00:00.000Z'),
              },
            }),
          });
        },
      } as any;

      const collectionRefMock = {} as any;
      spyOn<any>(service, 'getCollection').and.returnValue(collectionRefMock);
      spyOn<any>(service, 'getDocs').and.resolveTo(snapshotMock);

      const result = await (
        service as any
      ).getAllUserTranslationStatisticsForMonth('2026-03');

      expect(result).toEqual([
        {
          userId: 'U-1',
          translatedCharCount: 100,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          userId: 'U-2',
          translatedCharCount: 200,
          targetLanguages: ['fr'],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
      ]);
    });

    it('should return default values when snapshot has missing fields', async () => {
      const snapshotMock = {
        forEach: (cb: (doc: any) => void) => {
          cb({
            id: 'U-1',
            data: () => ({
              charCount: 100,
              lastUpdated: {
                toDate: () => new Date('2026-03-01T00:00:00.000Z'),
              },
            }),
          });
          cb({
            id: 'U-2',
            data: () => ({}), // missing charCount and targetLanguages
          });
        },
      } as any;

      const collectionRefMock = {} as any;
      spyOn<any>(service, 'getCollection').and.returnValue(collectionRefMock);
      spyOn<any>(service, 'getDocs').and.resolveTo(snapshotMock);

      const result = await (
        service as any
      ).getAllUserTranslationStatisticsForMonth('2026-03');

      expect(result).toEqual([
        {
          userId: 'U-1',
          translatedCharCount: 100,
          targetLanguages: [],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          userId: 'U-2',
          translatedCharCount: 0,
          targetLanguages: [],
          lastTranslationDate: undefined,
        },
      ]);
    });

    it('should return cached data on subsequent calls for same month', async () => {
      const userTranslationStatistics: UserTranslationStatistics[] = [
        {
          userId: 'U-1',
          translatedCharCount: 100,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
      ];
      spyOn<any>(
        service,
        'getCachedTranslationsForPreviousMonth'
      ).and.returnValue(userTranslationStatistics);
      spyOn<any>(service, 'getDocs').and.resolveTo({} as any); // should not be called

      const result = await (
        service as any
      ).getAllUserTranslationStatisticsForMonth('2026-03');

      expect(result).toEqual(userTranslationStatistics);
      expect(service['getDocs']).not.toHaveBeenCalled();
    });

    it('should log error and return empty array when getDocs throws', async () => {
      spyOn(console, 'error');
      spyOn<any>(service, 'getCollection').and.returnValue({} as any);
      spyOn<any>(service, 'getDocs').and.rejectWith(
        new Error('getDocs failed')
      );

      const result = await (
        service as any
      ).getAllUserTranslationStatisticsForMonth('2026-03');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching all user statistics for month 2026-03:',
        new Error('getDocs failed')
      );
    });

    describe('getCachedTranslationsForPreviousMonth', () => {
      const previousMonth = '2026-03';
      const cachedData: UserTranslationStatistics[] = [
        {
          userId: 'U-1',
          translatedCharCount: 100,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
      ];

      beforeEach(() => {
        spyOn(utilsServiceMock, 'getCurrentMonth').and.returnValue('2026-04');
      });

      it('should return cached data for previous month', () => {
        (service as any).cachedTranslations.set(previousMonth, cachedData);

        const result = (service as any).getCachedTranslationsForPreviousMonth(
          previousMonth
        );

        expect(result).toEqual(cachedData);
      });

      it('should return undefined for current month even if data is cached', () => {
        const currentMonth = utilsServiceMock.getCurrentMonth();
        (service as any).cachedTranslations.set(currentMonth, cachedData);

        const result = (service as any).getCachedTranslationsForPreviousMonth(
          currentMonth
        );

        expect(result).toBeUndefined();
      });

      it('should return undefined when no cached data exists for previous month', () => {
        // do not populate the cache
        const result = (service as any).getCachedTranslationsForPreviousMonth(
          previousMonth
        );

        expect(result).toBeUndefined();
      });

      it('should return undefined when cache is empty', () => {
        (service as any).cachedTranslations.clear();

        const result = (service as any).getCachedTranslationsForPreviousMonth(
          previousMonth
        );

        expect(result).toBeUndefined();
      });
    });
  });

  describe('getAllUserTranslationStatistics', () => {
    it('should delegate to getAllUserTranslationStatisticsForMonth for a specific month', async () => {
      const stats: UserTranslationStatistics[] = [
        {
          userId: 'U-1',
          translatedCharCount: 100,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
      ];
      spyOn<any>(
        service,
        'getAllUserTranslationStatisticsForMonth'
      ).and.resolveTo(stats);

      const result = await service.getAllUserTranslationStatistics('2026-03');

      expect(
        (service as any).getAllUserTranslationStatisticsForMonth
      ).toHaveBeenCalledOnceWith('2026-03');
      expect(result).toEqual(stats);
    });

    it('should concatenate results for all months when selectedMonth is "all"', async () => {
      const allMonths = [
        AllMonthsOption.localStorageValue,
        '2026-03',
        '2026-02',
      ];
      spyOn(
        utilsServiceMock,
        'getAllFirestoreSearchStringsForMonth'
      ).and.returnValue(allMonths);

      const statsForMarch: UserTranslationStatistics[] = [
        {
          userId: 'U-1',
          translatedCharCount: 100,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
      ];
      const statsForFeb: UserTranslationStatistics[] = [
        {
          userId: 'U-2',
          translatedCharCount: 200,
          targetLanguages: ['fr'],
          lastTranslationDate: new Date('2026-02-01T00:00:00.000Z'),
        },
      ];
      spyOn<any>(
        service,
        'getAllUserTranslationStatisticsForMonth'
      ).and.callFake(async (month: string) =>
        month === '2026-03' ? statsForMarch : statsForFeb
      );

      const result = await service.getAllUserTranslationStatistics(
        AllMonthsOption.localStorageValue
      );

      expect(
        utilsServiceMock.getAllFirestoreSearchStringsForMonth
      ).toHaveBeenCalled();
      expect(
        (service as any).getAllUserTranslationStatisticsForMonth
      ).toHaveBeenCalledWith('2026-03');
      expect(
        (service as any).getAllUserTranslationStatisticsForMonth
      ).toHaveBeenCalledWith('2026-02');
      expect(
        (service as any).getAllUserTranslationStatisticsForMonth
      ).not.toHaveBeenCalledWith(AllMonthsOption.localStorageValue);
      expect(result).toEqual([...statsForMarch, ...statsForFeb]);
    });

    it('should skip "all" entry when iterating months', async () => {
      const allMonths = [AllMonthsOption.localStorageValue, '2026-03'];
      spyOn(
        utilsServiceMock,
        'getAllFirestoreSearchStringsForMonth'
      ).and.returnValue(allMonths);
      spyOn<any>(
        service,
        'getAllUserTranslationStatisticsForMonth'
      ).and.resolveTo([]);

      await service.getAllUserTranslationStatistics(
        AllMonthsOption.localStorageValue
      );

      expect(
        (service as any).getAllUserTranslationStatisticsForMonth
      ).toHaveBeenCalledTimes(1);
      expect(
        (service as any).getAllUserTranslationStatisticsForMonth
      ).not.toHaveBeenCalledWith(AllMonthsOption.localStorageValue);
    });

    it('should log error and return empty array when getAllFirestoreSearchStringsForMonth throws', async () => {
      spyOn(console, 'error');
      spyOn(
        utilsServiceMock,
        'getAllFirestoreSearchStringsForMonth'
      ).and.throwError('unexpected failure');

      const result = await service.getAllUserTranslationStatistics(
        AllMonthsOption.localStorageValue
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        `Error fetching all user statistics for month ${AllMonthsOption.localStorageValue}:`,
        jasmine.any(Error)
      );
    });
  });

  describe('getFirestoreDate', () => {
    it('should convert Firestore Timestamp to Date', () => {
      const timestampMock = {
        toDate: () => new Date('2026-03-01T00:00:00.000Z'),
      } as any;
      const result = (service as any).getFirestoreDate(timestampMock);
      expect(result?.getTime()).toBe(Date.parse('2026-03-01T00:00:00.000Z'));
    });

    it('should return undefined for null Date', () => {
      const result = (service as any).getFirestoreDate(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined Date', () => {
      const result = (service as any).getFirestoreDate(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid Date', () => {
      const result = (service as any).getFirestoreDate('invalid date');
      expect(result).toBeUndefined();
    });

    it('should return date for object with toDate function', () => {
      const timestampLike = {
        toDate: () => new Date('2026-03-01T00:00:00.000Z'),
      };
      const result = (service as any).getFirestoreDate(timestampLike);
      expect(result?.getTime()).toBe(Date.parse('2026-03-01T00:00:00.000Z'));
    });

    it('should return undefined for object with invalid toDate function', () => {
      const timestampLike = {
        toDate: () => 'invalid date',
      };
      const result = (service as any).getFirestoreDate(timestampLike);
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid object', () => {
      const invalidObject = {
        invalid: () => new Date('2026-03-01T00:00:00.000Z'),
      };
      const result = (service as any).getFirestoreDate(invalidObject);
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid date in object', () => {
      const timestampLike = {
        toDate: () => new Date('invalid'),
      };
      const result = (service as any).getFirestoreDate(timestampLike);
      expect(result).toBeUndefined();
    });

    it('should return date for object with seconds', () => {
      const timestampLike = {
        seconds: 1772323200, // 2026-03-01T00:00:00.000Z
      };
      const result = (service as any).getFirestoreDate(timestampLike);
      expect(result?.getTime()).toBe(Date.parse('2026-03-01T00:00:00.000Z'));
    });

    it('should return undefined for object with invalid seconds', () => {
      const timestampLike = {
        seconds: -1772323200000000,
      };
      const result = (service as any).getFirestoreDate(timestampLike);
      expect(result).toBeUndefined();
    });

    it('should return date for timestampString', () => {
      const timestampString = '2026-03-01T00:00:00.000Z';
      const result = (service as any).getFirestoreDate(timestampString);
      expect(result?.getTime()).toBe(Date.parse(timestampString));
    });

    it('should return date for dateString', () => {
      const dateString = '2026-03-01';
      const result = (service as any).getFirestoreDate(dateString);
      expect(result?.getTime()).toBe(Date.parse('2026-03-01T00:00:00.000Z'));
    });
  });

  describe('getIsProgrammerDevice', () => {
    it('should return true if device is programmer device', async () => {
      const callableSpy = jasmine
        .createSpy('getIsProgrammerDeviceCallable')
        .and.resolveTo({ data: { isProgrammerDevice: true } });
      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      const result = await service.getIsProgrammerDevice();

      expect(httpsCallableSpy).toHaveBeenCalledWith('isProgrammerDevice');
      expect(callableSpy).toHaveBeenCalledWith({});
      expect(result).toBeTrue();
    });

    it('should return false if device is not programmer device', async () => {
      const callableSpy = jasmine
        .createSpy('getIsProgrammerDeviceCallable')
        .and.resolveTo({ data: { isProgrammerDevice: false } });
      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      const result = await service.getIsProgrammerDevice();

      expect(httpsCallableSpy).toHaveBeenCalledWith('isProgrammerDevice');
      expect(callableSpy).toHaveBeenCalledWith({});
      expect(result).toBeFalse();
    });

    it('should log error, show toast and return false when cloud function call fails', async () => {
      spyOn(console, 'error');
      const callableSpy = jasmine
        .createSpy('getIsProgrammerDeviceCallable')
        .and.rejectWith(new Error('call failed'));
      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      const result = await service.getIsProgrammerDevice();

      expect(httpsCallableSpy).toHaveBeenCalledWith('isProgrammerDevice');
      expect(callableSpy).toHaveBeenCalledWith({});
      expect(console.error).toHaveBeenCalledWith(
        'Error getting programmer device status:',
        new Error('call failed')
      );
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'TRANSLATE.CARD_RESULTS.TOAST.ERROR_GETTING_PROGRAMMER_DEVICE_STATUS',
        ToastAnchor.TRANSLATE_PAGE
      );
      expect(result).toBeFalse();
    });
  });

  describe('getProgrammerDeviceUIDs', () => {
    it('should return programmer device UIDs', async () => {
      const programmerDevices: ProgrammerDeviceUID[] = [
        { userId: 'uid1', name: 'Device 1' },
        { userId: 'uid2', name: 'Device 2' },
      ];
      const callableSpy = jasmine
        .createSpy('getProgrammerDeviceUIDsCallable')
        .and.resolveTo({ data: { programmerDevices } });
      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      const result = await service.getProgrammerDeviceUIDs();

      expect(httpsCallableSpy).toHaveBeenCalledWith('getProgrammerDeviceUIDs');
      expect(callableSpy).toHaveBeenCalledWith({});
      expect(result).toEqual(programmerDevices);
    });

    it('should log error, show toast and return empty array when cloud function call fails', async () => {
      spyOn(console, 'error');
      const callableSpy = jasmine
        .createSpy('getProgrammerDeviceUIDsCallable')
        .and.rejectWith(new Error('call failed'));
      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      const result = await service.getProgrammerDeviceUIDs();

      expect(httpsCallableSpy).toHaveBeenCalledWith('getProgrammerDeviceUIDs');
      expect(callableSpy).toHaveBeenCalledWith({});
      expect(console.error).toHaveBeenCalledWith(
        'Error getting all programmer devices:',
        new Error('call failed')
      );
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'TRANSLATE.CARD_RESULTS.TOAST.ERROR_GETTING_PROGRAMMER_DEVICES',
        ToastAnchor.TRANSLATE_PAGE
      );
      expect(result).toEqual([]);
    });
  });

  describe('updateProgrammerDeviceUIDs', () => {
    const originalUpdateUsermap =
      environment.app.programmerDevices.updateUsermap;

    beforeEach(() => {
      (environment as any).app.programmerDevices.updateUsermap = true;
    });

    afterEach(() => {
      (environment as any).app.programmerDevices.updateUsermap =
        originalUpdateUsermap;
    });

    it('should update programmer device UIDs', async () => {
      const programmerDevices: ProgrammerDeviceUID[] = [
        { userId: 'uid1', name: 'Device 1' },
        { userId: 'uid2', name: 'Device 2' },
      ];
      spyOn<any>(service, 'getEnvironmentProgrammerDeviceUIDs').and.returnValue(
        programmerDevices
      );
      const callableSpy = jasmine
        .createSpy('updateProgrammerDeviceUIDsCallable')
        .and.resolveTo(undefined);
      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      await service.updateProgrammerDeviceUIDs();

      expect(httpsCallableSpy).toHaveBeenCalledWith(
        'updateProgrammerDeviceUIDs'
      );
      expect(callableSpy).toHaveBeenCalledWith({
        programmerDeviceUIDs: programmerDevices,
      });
    });

    it('should log error and show toast when cloud function call fails', async () => {
      spyOn(console, 'error');
      const programmerDevices: ProgrammerDeviceUID[] = [
        { userId: 'uid1', name: 'Device 1' },
        { userId: 'uid2', name: 'Device 2' },
      ];
      spyOn<any>(service, 'getEnvironmentProgrammerDeviceUIDs').and.returnValue(
        programmerDevices
      );
      const callableSpy = jasmine
        .createSpy('updateProgrammerDeviceUIDsCallable')
        .and.rejectWith(new Error('call failed'));
      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      await service.updateProgrammerDeviceUIDs();

      expect(httpsCallableSpy).toHaveBeenCalledWith(
        'updateProgrammerDeviceUIDs'
      );
      expect(callableSpy).toHaveBeenCalledWith({
        programmerDeviceUIDs: programmerDevices,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error updating programmer devices:',
        new Error('call failed')
      );
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'TRANSLATE.CARD_RESULTS.TOAST.ERROR_UPDATING_PROGRAMMER_DEVICES',
        ToastAnchor.TRANSLATE_PAGE
      );
    });

    it('should not call cloud function when updateUsermap is false', async () => {
      (environment as any).app.programmerDevices.updateUsermap = false;
      const getEnvironmentProgrammerDeviceUIDsSpy = spyOn<any>(
        service,
        'getEnvironmentProgrammerDeviceUIDs'
      );
      const getHttpsCallableSpy = spyOn<any>(service, 'getHttpsCallable');

      await service.updateProgrammerDeviceUIDs();

      expect(getEnvironmentProgrammerDeviceUIDsSpy).not.toHaveBeenCalled();
      expect(getHttpsCallableSpy).not.toHaveBeenCalled();
    });
  });

  describe('getEnvironmentProgrammerDeviceUIDs', () => {
    const originalDevices = environment.app.programmerDevices.devices;

    afterEach(() => {
      (environment as any).app.programmerDevices.devices = originalDevices;
    });

    it('should return programmer device UIDs from environment', () => {
      (environment as any).app.programmerDevices.devices = [
        { 'Device 1': 'uid1' },
        { 'Device 2': 'uid2' },
      ];

      const result = (service as any).getEnvironmentProgrammerDeviceUIDs();

      expect(result).toEqual([
        { userId: 'uid1', name: 'Device 1' },
        { userId: 'uid2', name: 'Device 2' },
      ]);
    });

    it('should return empty array when no programmer devices are defined in environment', () => {
      (environment as any).app.programmerDevices.devices = [];

      const result = (service as any).getEnvironmentProgrammerDeviceUIDs();

      expect(result).toEqual([]);
    });
  });

  describe('addUser', () => {
    it('should add user to Firestore with correct data', async () => {
      const userId = 'test-uid';
      const programmerDevices: ProgrammerDeviceUID[] = [
        { userId: 'uid1', name: 'Device 1' },
        { userId: 'uid2', name: 'Device 2' },
      ];

      const getEnvironmentProgrammerDeviceUIDsSpy = spyOn<any>(
        service,
        'getEnvironmentProgrammerDeviceUIDs'
      ).and.returnValue(programmerDevices);

      const callableSpy = jasmine
        .createSpy('addUserCallable')
        .and.resolveTo(undefined);

      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      await service.addUser(userId);

      expect(httpsCallableSpy).toHaveBeenCalledWith('addUser');
      expect(getEnvironmentProgrammerDeviceUIDsSpy).toHaveBeenCalled();
      expect(getDeviceInfoSpy).toHaveBeenCalled();
      expect(callableSpy).toHaveBeenCalledWith({
        userId,
        programmerDeviceUIDs: getEnvironmentProgrammerDeviceUIDsSpy(),
        deviceInfo: mockDeviceInfo,
        isNative: utilsServiceMock.isNative,
      });
    });

    it('should log error and show toast when cloud function call fails', async () => {
      spyOn(console, 'error');
      const userId = 'test-uid';
      const programmerDevices: ProgrammerDeviceUID[] = [
        { userId: 'uid1', name: 'Device 1' },
        { userId: 'uid2', name: 'Device 2' },
      ];

      const getEnvironmentProgrammerDeviceUIDsSpy = spyOn<any>(
        service,
        'getEnvironmentProgrammerDeviceUIDs'
      ).and.returnValue(programmerDevices);

      const callableSpy = jasmine
        .createSpy('addUserCallable')
        .and.rejectWith(new Error('call failed'));

      const httpsCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy as any);

      await service.addUser(userId);

      expect(httpsCallableSpy).toHaveBeenCalledWith('addUser');
      expect(getEnvironmentProgrammerDeviceUIDsSpy).toHaveBeenCalled();
      expect(getDeviceInfoSpy).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error adding user:',
        new Error('call failed')
      );
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'TRANSLATE.CARD_RESULTS.TOAST.ERROR_ADDING_USER',
        ToastAnchor.TRANSLATE_PAGE
      );
    });
  });

  describe('getUsers', () => {
    const users: UserType[] = [
      {
        userId: 'uid1',
        name: 'Device 1',
        type: 'P',
        isNative: true,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        lastUpdated: new Date('2026-04-01T00:00:00.000Z'),
        device: 'Test Device',
        deviceInfo: {
          language: 'en-GB',
          platform: 'Win32',
          userAgent: 'Test User Agent',
          appVersion: { date: '2026-01-01', major: 1, minor: 0 },
        },
      },
      {
        userId: 'uid2',
        name: 'Device 2',
        type: 'U',
        isNative: false,
        createdAt: new Date('2026-04-20T00:00:00.000Z'),
        lastUpdated: undefined,
        device: 'unknown',
        deviceInfo: {
          language: 'de-AT',
          platform: 'Linux',
          userAgent: 'Some User Agent',
          appVersion: { date: '2026-01-01', major: 1, minor: 0 },
        },
      },
    ];

    function createSnapshotMock(data: UserType[]) {
      return {
        forEach: (callback: (docSnap: any) => void) => {
          data.forEach((user) => {
            callback({
              data: () => user,
            });
          });
        },
      };
    }

    beforeEach(() => {
      const collectionRefMock = {} as any;
      spyOn<any>(service, 'getCollection').and.returnValue(collectionRefMock);
    });

    it('should return users created in selected month', async () => {
      const getDocsSpy = spyOn<any>(service, 'getDocs').and.resolveTo(
        createSnapshotMock(users) as any
      );

      const result = await service.getUsers('2026-03');

      expect(getDocsSpy).toHaveBeenCalled();
      expect(result).toEqual([users[0]]);
    });

    it('should return users for another selected month', async () => {
      const getDocsSpy = spyOn<any>(service, 'getDocs').and.resolveTo(
        createSnapshotMock(users) as any
      );

      const result = await service.getUsers('2026-04');

      expect(getDocsSpy).toHaveBeenCalled();
      expect(result).toEqual([users[1]]);
    });

    it('should include user from another creation month when cached translations exist for selected month', async () => {
      spyOn<any>(service, 'getDocs').and.resolveTo(
        createSnapshotMock(users) as any
      );

      (service as any).cachedTranslations.set('2026-03', [
        {
          userId: 'uid2',
          translatedCharCount: 10,
          targetLanguages: ['de'],
          lastTranslationDate: new Date('2026-03-10T00:00:00.000Z'),
        },
      ]);

      const result = await service.getUsers('2026-03');

      expect(result).toEqual([users[0], users[1]]);
    });

    it('should not include user from another month when cached translatedCharCount is zero', async () => {
      spyOn<any>(service, 'getDocs').and.resolveTo(
        createSnapshotMock(users) as any
      );

      (service as any).cachedTranslations.set('2026-03', [
        {
          userId: 'uid2',
          translatedCharCount: 0,
          targetLanguages: ['de'],
          lastTranslationDate: new Date('2026-03-10T00:00:00.000Z'),
        },
      ]);

      const result = await service.getUsers('2026-03');

      expect(result).toEqual([users[0]]);
    });

    it('should log error, show toast and return empty array when getDocs fails', async () => {
      spyOn(console, 'error');
      const getDocsSpy = spyOn<any>(service, 'getDocs').and.rejectWith(
        new Error('getDocs failed')
      );

      const result = await service.getUsers('2026-03');

      expect(getDocsSpy).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error loading users from user mapping:',
        new Error('getDocs failed')
      );
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'TRANSLATE.CARD_RESULTS.TOAST.ERROR_LOADING_USERS',
        ToastAnchor.SETTINGS_PAGE
      );
      expect(result).toEqual([]);
    });
  });

  describe('signInAnonymously', () => {
    it('should sign in anonymously if user is not signed in', async () => {
      authMock.currentUser = null;
      const addUserSpy = spyOn(service, 'addUser').and.resolveTo();

      await (service as any).signInAnonymously();

      expect(authWrapperMock.signInAnonymously).toHaveBeenCalledWith(authMock);
      expect(addUserSpy).toHaveBeenCalledWith('anonymous-uid');
      expect(localStorageServiceMock.saveFirestoreUid).toHaveBeenCalledWith(
        'anonymous-uid'
      );
    });

    it('should not call signInAnonymously if user is already signed in', async () => {
      authMock.currentUser = userStub;
      const addUserSpy = spyOn(service, 'addUser').and.resolveTo();

      await (service as any).signInAnonymously();

      expect(authWrapperMock.signInAnonymously).not.toHaveBeenCalled();
      expect(addUserSpy).toHaveBeenCalledWith('anonymous-uid');
      expect(localStorageServiceMock.saveFirestoreUid).toHaveBeenCalledWith(
        'anonymous-uid'
      );
    });
  });

  describe('saveUserIdToLocalStorage', () => {
    it('should save the user UID to localStorage', async () => {
      const testUid = 'test-uid';

      await (service as any).saveUserIdToLocalStorage(testUid);

      expect(localStorageServiceMock.saveFirestoreUid).toHaveBeenCalledWith(
        testUid
      );
    });

    it('should log error if saving to localStorage fails', async () => {
      spyOn(console, 'error');
      const testUid = 'test-uid';
      localStorageServiceMock.saveFirestoreUid.and.throwError(
        'localStorage save failed'
      );

      await (service as any).saveUserIdToLocalStorage(testUid);

      expect(console.error).toHaveBeenCalledWith(
        'Error saving user UID to localStorage:',
        jasmine.any(Error)
      );
    });
  });

  describe('authenticateUser', () => {
    beforeEach(() => {
      (service as any).utilsService.isNative = false;
    });

    it('should reuse existing web user, add user, save uid and run setup calls', async () => {
      const getIdTokenSpy = jasmine
        .createSpy('getIdToken')
        .and.resolveTo('token');
      authMock.currentUser = {
        ...userStub,
        uid: 'anonymous-uid',
        getIdToken: getIdTokenSpy,
      } as any;

      const waitForAuthReadySpy = spyOn<any>(
        service,
        'waitForAuthReady'
      ).and.resolveTo();
      const addUserSpy = spyOn(service, 'addUser').and.resolveTo();
      const createMissingContingentDataSpy = spyOn(
        service,
        'createMissingContingentData'
      ).and.resolveTo();
      const updateProgrammerDeviceUIDsSpy = spyOn(
        service,
        'updateProgrammerDeviceUIDs'
      ).and.resolveTo();
      const signInAnonymouslySpy = spyOn<any>(
        service,
        'signInAnonymously'
      ).and.resolveTo();

      await (service as any).authenticateUser();

      expect(waitForAuthReadySpy).toHaveBeenCalled();
      expect(addUserSpy).toHaveBeenCalledWith('anonymous-uid');
      expect(localStorageServiceMock.saveFirestoreUid).toHaveBeenCalledWith(
        'anonymous-uid'
      );
      expect(getIdTokenSpy).toHaveBeenCalledWith(true);
      expect(createMissingContingentDataSpy).toHaveBeenCalled();
      expect(updateProgrammerDeviceUIDsSpy).toHaveBeenCalled();
      expect(signInAnonymouslySpy).not.toHaveBeenCalled();
    });

    it('should not add or save uid when current user has no uid, but still run setup calls', async () => {
      const getIdTokenSpy = jasmine
        .createSpy('getIdToken')
        .and.resolveTo('token');
      authMock.currentUser = {
        ...userStub,
        uid: undefined,
        getIdToken: getIdTokenSpy,
      } as any;

      spyOn<any>(service, 'waitForAuthReady').and.resolveTo();
      const addUserSpy = spyOn(service, 'addUser').and.resolveTo();
      const createMissingContingentDataSpy = spyOn(
        service,
        'createMissingContingentData'
      ).and.resolveTo();
      const updateProgrammerDeviceUIDsSpy = spyOn(
        service,
        'updateProgrammerDeviceUIDs'
      ).and.resolveTo();

      await (service as any).authenticateUser();

      expect(addUserSpy).not.toHaveBeenCalled();
      expect(localStorageServiceMock.saveFirestoreUid).not.toHaveBeenCalled();
      expect(getIdTokenSpy).toHaveBeenCalledWith(true);
      expect(createMissingContingentDataSpy).toHaveBeenCalled();
      expect(updateProgrammerDeviceUIDsSpy).toHaveBeenCalled();
    });

    it('should call signInAnonymously when no web user exists', async () => {
      authMock.currentUser = null;

      spyOn<any>(service, 'waitForAuthReady').and.resolveTo();
      const signInAnonymouslySpy = spyOn<any>(
        service,
        'signInAnonymously'
      ).and.resolveTo();
      const createMissingContingentDataSpy = spyOn(
        service,
        'createMissingContingentData'
      ).and.resolveTo();
      const updateProgrammerDeviceUIDsSpy = spyOn(
        service,
        'updateProgrammerDeviceUIDs'
      ).and.resolveTo();

      await (service as any).authenticateUser();

      expect(signInAnonymouslySpy).toHaveBeenCalled();
      expect(createMissingContingentDataSpy).toHaveBeenCalled();
      expect(updateProgrammerDeviceUIDsSpy).toHaveBeenCalled();
    });

    it('should use native path and always call signInAnonymously plus setup calls', async () => {
      (service as any).utilsService.isNative = true;
      authMock.currentUser = null;

      spyOn<any>(service, 'waitForAuthReady').and.resolveTo();
      const signInAnonymouslySpy = spyOn<any>(
        service,
        'signInAnonymously'
      ).and.resolveTo();
      const createMissingContingentDataSpy = spyOn(
        service,
        'createMissingContingentData'
      ).and.resolveTo();
      const updateProgrammerDeviceUIDsSpy = spyOn(
        service,
        'updateProgrammerDeviceUIDs'
      ).and.resolveTo();

      await (service as any).authenticateUser();

      expect(signInAnonymouslySpy).toHaveBeenCalled();
      expect(createMissingContingentDataSpy).toHaveBeenCalled();
      expect(updateProgrammerDeviceUIDsSpy).toHaveBeenCalled();
    });

    it('should log error if signInAnonymously fails', async () => {
      spyOn(console, 'error');
      authMock.currentUser = null;

      spyOn<any>(service, 'waitForAuthReady').and.resolveTo();
      spyOn<any>(service, 'signInAnonymously').and.rejectWith(
        new Error('signInAnonymously failed')
      );
      spyOn(service, 'createMissingContingentData').and.resolveTo();
      spyOn(service, 'updateProgrammerDeviceUIDs').and.resolveTo();

      await (service as any).authenticateUser();

      expect(console.error).toHaveBeenCalledWith(
        'Error during Firebase authentication:',
        jasmine.any(Error)
      );
    });
  });

  describe('waitForAuthReady', () => {
    afterEach(() => {
      delete (service as any).auth.authStateReady;
    });

    it('should use authStateReady when available', async () => {
      const authStateReadySpy = jasmine
        .createSpy('authStateReady')
        .and.resolveTo();
      (service as any).auth.authStateReady = authStateReadySpy;

      await (service as any).waitForAuthReady();

      expect(authStateReadySpy).toHaveBeenCalled();
      expect(authWrapperMock.onAuthStateChanged).not.toHaveBeenCalled();
    });

    it('should fall back to onAuthStateChanged and unsubscribe after callback', async () => {
      const unsubSpy = jasmine.createSpy('unsub');

      authWrapperMock.onAuthStateChanged.and.callFake(
        (_auth: any, cb: Function) => {
          Promise.resolve().then(() => cb());
          return unsubSpy;
        }
      );

      await (service as any).waitForAuthReady();

      expect(authWrapperMock.onAuthStateChanged).toHaveBeenCalled();
      expect(unsubSpy).toHaveBeenCalled();
    });
  });

  describe('wrapper coverage via public methods', () => {
    describe('getHttpsCallable', () => {
      it('should execute getHttpsCallable path in createMissingContingentData and handle failure', async () => {
        spyOn(console, 'error');

        // Do not spy on service.getHttpsCallable here.
        await service.createMissingContingentData();

        expect(console.error).toHaveBeenCalledWith(
          'Error creating missing contingent data:',
          jasmine.anything()
        );
        expect(toastServiceMock.showToast).toHaveBeenCalledWith(
          'Error creating missing contingent data.',
          ToastAnchor.TRANSLATE_PAGE
        );
      });
    });

    describe('getFirestoreDocSnapshot and getFirestoreDoc', () => {
      it('should execute getFirestoreDocSnapshot path directly in readContingentData and handle failure', async () => {
        spyOn(console, 'error');
        spyOn<any>(service, 'getFirestoreDoc').and.returnValue({
          id: 'mock-ref',
        } as any);

        const result = await service.readContingentData('2026-03');

        expect(result).toEqual({});
        expect(console.error).toHaveBeenCalledWith(
          'Error reading contingent data:',
          jasmine.anything()
        );
      });

      it('should execute getFirestoreDoc path directly in readContingentData and handle failure', async () => {
        spyOn(console, 'error');
        // Do NOT spy on getFirestoreDoc — let lines 479-481 execute (doc() will throw with empty firestoreMock)

        const result = await service.readContingentData('2026-03');

        expect(result).toEqual({});
        expect(console.error).toHaveBeenCalledWith(
          'Error reading contingent data:',
          jasmine.anything()
        );
      });
    });

    describe('getCollection and getDocs', () => {
      it('should execute getCollection path directly in getAllUserTranslationStatisticsForMonth and handle failure', async () => {
        spyOn(console, 'error');
        spyOn(utilsServiceMock, 'getCurrentMonth').and.returnValue('2026-03');

        // month !== currentMonth to avoid cache shortcut
        const result = await (
          service as any
        ).getAllUserTranslationStatisticsForMonth('2026-02');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching all user statistics for month 2026-02:',
          jasmine.anything()
        );
      });

      it('should execute getDocs path directly in getAllUserTranslationStatisticsForMonth and handle failure', async () => {
        spyOn(console, 'error');
        spyOn(utilsServiceMock, 'getCurrentMonth').and.returnValue('2026-03');
        spyOn<any>(service, 'getCollection').and.returnValue({} as any);

        // month !== currentMonth to avoid cache shortcut
        const result = await (
          service as any
        ).getAllUserTranslationStatisticsForMonth('2026-02');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching all user statistics for month 2026-02:',
          jasmine.anything()
        );
      });
    });
  });
});
