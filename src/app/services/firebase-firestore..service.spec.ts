import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { UtilsService } from './utils.service';
import { FirestoreContingentData } from '../shared/firebase-firestore.interfaces';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from './toast.service';
import { createTranslateServiceMock } from '../testing/translate-service.mock';

describe('FirebaseFirestoreService', () => {
  let service: FirebaseFirestoreService;

  const authMock = {
    currentUser: { uid: 'test-uid' },
  } as unknown as Auth;

  const firestoreMock = {} as Firestore;
  const functionsMock = {} as Functions;

  const utilsServiceMock = {
    isNative: false,
  };

  const localStorageServiceMock = {
    firestoreUid$: of('test-uid'),
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
        { provide: Auth, useValue: authMock },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: Firestore, useValue: firestoreMock },
        { provide: Functions, useValue: functionsMock },
        { provide: UtilsService, useValue: utilsServiceMock },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    });

    service = TestBed.inject(FirebaseFirestoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call ensureControlFlagsExist on init', async () => {
    spyOn(service, 'createMissingContingentData').and.resolveTo();
    spyOn(service, 'getIsProgrammerDevice').and.resolveTo(false);
    spyOn<any>(service, 'authenticateUser').and.callFake(async () => {
      await service.createMissingContingentData();
    });

    await service.init();

    expect((service as any).authenticateUser).toHaveBeenCalled();
    expect(service.createMissingContingentData).toHaveBeenCalled();
    expect(service.getIsProgrammerDevice).toHaveBeenCalled();
  });

  it('should return control flags from Firestore', async () => {
    const flags: FirestoreContingentData = { StopTranslationForAllUsers: true };
    spyOn(service, 'readContingentData').and.resolveTo(flags);

    const result = await service.readContingentData();

    expect(result).toEqual(flags);
  });

  it('should return empty object if control flags do not exist', async () => {
    spyOn(service, 'readContingentData').and.resolveTo({});

    const result = await service.readContingentData();

    expect(result).toEqual({});
  });
});
