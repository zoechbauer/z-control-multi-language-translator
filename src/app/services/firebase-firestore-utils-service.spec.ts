import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
import { FirestoreContingentData } from '../shared/firebase-firestore.interfaces';
import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils-service';
import { LocalStorageService } from './local-storage.service';
import { DisplayMode } from '../shared/enums';

describe('FirebaseFirestoreUtilsService', () => {
  let service: FirebaseFirestoreUtilsService;
  let firestoreServiceMock: jasmine.SpyObj<FirebaseFirestoreService>;

  beforeEach(() => {
    firestoreServiceMock = jasmine.createSpyObj(
      'FirebaseFirestoreService',
      [
        'readContingentData',
        'getCharCountForUser',
        'getTotalCharCount',
        'getAllUserTranslationStatistics',
        'getUsers',
        'getProgrammerDeviceUIDs',
        'init',
      ],
      {
        programmerDeviceRefresh$: of(void 0),
        isProgrammerDevice: false,
      }
    );
    TestBed.configureTestingModule({
      providers: [
        FirebaseFirestoreUtilsService,
        { provide: FirebaseFirestoreService, useValue: firestoreServiceMock },
        { provide: UtilsService, useValue: {} },
        {
          provide: LocalStorageService,
          useValue: {
            getStatisticsDisplayMode: jasmine
              .createSpy('getStatisticsDisplayMode')
              .and.resolveTo(DisplayMode.User),
            statisticsDisplayMode$: of(DisplayMode.User),
          },
        },
      ],
    });
    service = TestBed.inject(FirebaseFirestoreUtilsService);
    spyOn<any>(service, 'autrefreshMonthContextIfNeeded').and.returnValue(
      Promise.resolve()
    );
  });

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
    firestoreServiceMock.getCharCountForUser.and.resolveTo({
      charCount: 0,
      targetLanguages: [],
    });
    const result = await service.isContingentExceeded();
    expect(result).toBeTrue();
  });

  it('should return true if user contingent is exceeded', async () => {
    firestoreServiceMock.readContingentData.and.resolveTo({});
    firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
    firestoreServiceMock.getCharCountForUser.and.resolveTo({
      charCount: environment.app.maxFreeTranslateCharsPerMonthForUser + 1,
      targetLanguages: [],
    });
    const result = await service.isContingentExceeded();
    expect(result).toBeTrue();
  });

  it('should return false if no contingent is exceeded and translation is not stopped', async () => {
    firestoreServiceMock.readContingentData.and.resolveTo({});
    firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
    firestoreServiceMock.getCharCountForUser.and.resolveTo({
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
    firestoreServiceMock.getCharCountForUser.and.resolveTo({
      charCount: 11,
      targetLanguages: [],
    });
    // Should return true for total contingent exceeded first
    const result = await service.isContingentExceeded();
    expect(result).toBeTrue();
    // Now test user contingent exceeded
    firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
    firestoreServiceMock.getCharCountForUser.and.resolveTo({
      charCount: 11,
      targetLanguages: [],
    });
    const result2 = await service.isContingentExceeded();
    expect(result2).toBeTrue();
  });
});
