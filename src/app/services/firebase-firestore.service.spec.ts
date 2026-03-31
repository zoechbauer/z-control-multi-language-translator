import { TestBed } from '@angular/core/testing';
import * as angularFireAuth from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { UtilsService } from './utils.service';
import {
  FirestoreContingentData,
  ProgrammerDeviceUID,
  UserType,
} from '../shared/firebase-firestore.interfaces';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from './toast.service';
import { ToastAnchor } from '../shared/enums';
import { environment } from 'src/environments/environment';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { FirebaseFirestoreAuthWrapperService } from './firebase-firestore-auth-wrapper.service';

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
        authStateCallback = callback;
        return () => {};
      }),
  };

  const firestoreMock = {} as Firestore;
  const functionsMock = {} as Functions;

  const utilsServiceMock = {
    isNative: false,
    getDeviceInfo: jasmine.createSpy('getDeviceInfo').and.returnValue({
      deviceModel: 'Test Device',
      platform: 'Test Platform',
    }),
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
    utilsServiceMock.getDeviceInfo.calls.reset();
    _currentUser = userStub;
    authWrapperMock.signInAnonymously.calls.reset();
    authWrapperMock.onAuthStateChanged.calls.reset();
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

      const result = await service.readContingentData();

      expect((service as any).getFirestoreDoc).toHaveBeenCalled();
      expect((service as any).getFirestoreDocSnapshot).toHaveBeenCalledWith(
        fakeRef
      );
      expect(result).toEqual(flags);
    });

    it('should return empty object when document does not exist', async () => {
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => false,
        data: () => undefined,
      } as any);

      const result = await service.readContingentData();

      expect(result).toEqual({});
    });

    it('should return empty object when document exists but data is undefined', async () => {
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.resolveTo({
        exists: () => true,
        data: () => undefined,
      } as any);

      const result = await service.readContingentData();

      expect(result).toEqual({});
    });

    it('should return empty object and show toast when snapshot read fails', async () => {
      spyOn(console, 'error');
      const fakeRef = { id: 'fake-ref' } as any;
      spyOn<any>(service, 'getFirestoreDoc').and.returnValue(fakeRef);
      spyOn<any>(service, 'getFirestoreDocSnapshot').and.rejectWith(
        new Error('firestore read failed')
      );

      const result = await service.readContingentData();

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

  describe('getAllUserTranslationStatistics', () => {
    it('should return mapped user translation statistics when snapshot has docs', async () => {
      const snapshotMock = {
        forEach: (cb: (doc: any) => void) => {
          cb({
            id: 'user1',
            data: () => ({
              charCount: 100,
              targetLanguages: ['en'],
              lastUpdated: {
                toDate: () => new Date('2026-03-01T00:00:00.000Z'),
              },
            }),
          });
          cb({
            id: 'user2',
            data: () => ({
              charCount: 200,
              targetLanguages: ['fr'],
              lastUpdated: null,
            }),
          });
        },
      } as any;

      const collectionRefMock = {} as any;
      spyOn<any>(service, 'getCollection').and.returnValue(collectionRefMock);
      spyOn<any>(service, 'getDocs').and.resolveTo(snapshotMock);

      const result = await service.getAllUserTranslationStatistics();

      expect(result).toEqual([
        {
          userId: 'user1',
          translatedCharCount: 100,
          targetLanguages: ['en'],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          userId: 'user2',
          translatedCharCount: 200,
          targetLanguages: ['fr'],
          lastTranslationDate: undefined,
        },
      ]);
    });

    it('should return default values when snapshot has missing fields', async () => {
      const snapshotMock = {
        forEach: (cb: (doc: any) => void) => {
          cb({
            id: 'user1',
            data: () => ({
              charCount: 100,
              lastUpdated: {
                toDate: () => new Date('2026-03-01T00:00:00.000Z'),
              },
            }),
          });
          cb({
            id: 'user2',
            data: () => ({}), // missing charCount and targetLanguages
          });
        },
      } as any;

      const collectionRefMock = {} as any;
      spyOn<any>(service, 'getCollection').and.returnValue(collectionRefMock);
      spyOn<any>(service, 'getDocs').and.resolveTo(snapshotMock);

      const result = await service.getAllUserTranslationStatistics();

      expect(result).toEqual([
        {
          userId: 'user1',
          translatedCharCount: 100,
          targetLanguages: [],
          lastTranslationDate: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          userId: 'user2',
          translatedCharCount: 0,
          targetLanguages: [],
          lastTranslationDate: undefined,
        },
      ]);
    });

    it('should log error and return empty array when getDocs throws', async () => {
      spyOn(console, 'error');
      spyOn<any>(service, 'getCollection').and.returnValue({} as any);
      spyOn<any>(service, 'getDocs').and.rejectWith(
        new Error('getDocs failed')
      );

      const result = await service.getAllUserTranslationStatistics();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching all user statistics:',
        new Error('getDocs failed')
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
      expect(utilsServiceMock.getDeviceInfo).toHaveBeenCalled();
      expect(callableSpy).toHaveBeenCalledWith({
        userId,
        programmerDeviceUIDs: getEnvironmentProgrammerDeviceUIDsSpy(),
        deviceInfo: utilsServiceMock.getDeviceInfo(),
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
      expect(utilsServiceMock.getDeviceInfo).toHaveBeenCalled();
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
    it('should return users from Firestore', async () => {
      const users: UserType[] = [
        {
          userId: 'uid1',
          name: 'Device 1',
          type: 'P',
          isNative: true,
          createdAt: new Date(),
          lastUpdated: new Date(),
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
          createdAt: new Date(),
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

      const collectionRefMock = {} as any;
      spyOn<any>(service, 'getCollection').and.returnValue(collectionRefMock);

      const snapshotMock = {
        forEach: (callback: (docSnap: any) => void) => {
          users.forEach((user) => {
            callback({
              data: () => user,
            });
          });
        },
      };

      const getDocsSpy = spyOn<any>(service, 'getDocs').and.resolveTo(
        snapshotMock
      );

      const result = await service.getUsers();

      expect(getDocsSpy).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('should log error, show toast and return empty array when getDocs fails', async () => {
      spyOn(console, 'error');
      const collectionRefMock = {} as any;
      spyOn<any>(service, 'getCollection').and.returnValue(collectionRefMock);
      const getDocsSpy = spyOn<any>(service, 'getDocs').and.rejectWith(
        new Error('getDocs failed')
      );

      const result = await service.getUsers();

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
    it('should authenticate user and save UID to localStorage if not native mode', async () => {
      authMock.currentUser = userStub;
      const testUid = 'anonymous-uid';
      const addUserSpy = spyOn(service, 'addUser').and.resolveTo();

      await (service as any).authenticateUser();

      expect(addUserSpy).toHaveBeenCalledWith(testUid);
      expect(localStorageServiceMock.saveFirestoreUid).toHaveBeenCalledWith(
        testUid
      );
    });

    it('should call signInAnonymously if no user is authenticated and not native mode', async () => {
      authMock.currentUser = null;
      const signInAnonymouslySpy = spyOn(
        service as any,
        'signInAnonymously'
      ).and.resolveTo();

      await (service as any).authenticateUser();

      expect(signInAnonymouslySpy).toHaveBeenCalled();
    });

    it('should call signInAnonymously if native mode', async () => {
      authMock.currentUser = null;
      (service as any).utilsService.isNative = true;
      const signInAnonymouslySpy = spyOn(
        service as any,
        'signInAnonymously'
      ).and.resolveTo();

      await (service as any).authenticateUser();

      expect(signInAnonymouslySpy).toHaveBeenCalled();
    });

    it('should log error if authentication fails', async () => {
      spyOn(console, 'error');
      authMock.currentUser = null;
      const signInAnonymouslySpy = spyOn(
        service as any,
        'signInAnonymously'
      ).and.rejectWith(new Error('signInAnonymously failed'));

      await (service as any).authenticateUser();

      expect(signInAnonymouslySpy).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error during Firebase authentication:',
        jasmine.any(Error)
      );
    });
  });

  describe('waitForAuthReady', () => {
    it('should resolve immediately if auth is already ready', async () => {
      (service as any).authReady = true;
      await expectAsync((service as any).waitForAuthReady()).toBeResolved();
    });

    it('should wait for auth to be ready if not already ready', async () => {
      (service as any).authReady = false;
      const resolveSpy = jasmine.createSpy('resolveSpy');
      setTimeout(() => {
        (service as any).authReady = true;
      }, 100);

      await (service as any).waitForAuthReady().then(resolveSpy);

      expect(resolveSpy).toHaveBeenCalled();
    });

    it('should wait for auth if authStateReady is a function that resolves', async () => {
      const authStateReadySpy = jasmine
        .createSpy('authStateReady')
        .and.resolveTo();
      (service as any).authReady = false;
      (service as any).auth.authStateReady = authStateReadySpy;

      await (service as any).waitForAuthReady();

      expect(authStateReadySpy).toHaveBeenCalled();
    });
  });
});
