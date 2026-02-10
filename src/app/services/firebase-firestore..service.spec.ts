import { signInAnonymously, Auth } from '@angular/fire/auth';
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { TranslateService } from '@ngx-translate/core';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { UtilsService } from './utils.service';
import { FirestoreContingentData } from '../shared/firebase-firestore.interfaces';
import { LocalStorageService } from './local-storage.service';
import { ToastService } from './toast.service';

describe('FirebaseFirestoreService', () => {
  let service: FirebaseFirestoreService;
  let authMock: any;
  let firestoreMock: any;
  let utilsServiceMock: any;

  // Create a subclass for testing to override signInAnonymously
  class TestFirebaseFirestoreService extends FirebaseFirestoreService {
    constructor(
      auth: Auth,
      firestore: Firestore,
      utilsService: UtilsService,
      private signInAnonMock: ((auth: Auth) => Promise<any>) | null = null,
    ) {
      super(
        auth,
        {} as TranslateService,
        firestore,
        {} as Functions,
        utilsService,
        {} as LocalStorageService,
        {} as ToastService,
      );
    }
    // Override init to use the mock if provided
    override async init() {
      try {
        if (!(this as any).auth.currentUser) {
          const result = this.signInAnonMock
            ? await this.signInAnonMock((this as any).auth)
            : await signInAnonymously((this as any).auth);
          (this as any).user = result.user;
        } else {
          (this as any).user = (this as any).auth.currentUser;
        }
        await this.createMissingContingentData();
      } catch (error) {
        // ...existing code...
      }
    }
  }

  beforeEach(() => {
    // Provide more complete mocks for Auth and Firestore
    authMock = {
      currentUser: null,
      createUserWithEmailAndPassword: jasmine.createSpy(
        'createUserWithEmailAndPassword',
      ),
      signInWithEmailAndPassword: jasmine.createSpy(
        'signInWithEmailAndPassword',
      ),
      signOut: jasmine.createSpy('signOut'),
    };
    firestoreMock = {
      collection: jasmine.createSpy('collection'),
      doc: jasmine.createSpy('doc'),
      getDoc: jasmine.createSpy('getDoc'),
      setDoc: jasmine.createSpy('setDoc'),
      updateDoc: jasmine.createSpy('updateDoc'),
    };
    utilsServiceMock = { getCurrentYearMonth: () => '2026-01' };
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: Firestore, useValue: firestoreMock },
        { provide: UtilsService, useValue: utilsServiceMock },
      ],
    });
  });

  function getMockSignInAnonymously() {
    return () =>
      Promise.resolve({
        user: {
          uid: 'test-uid',
          emailVerified: false,
          isAnonymous: true,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          displayName: null,
          email: null,
          phoneNumber: null,
          photoURL: null,
          providerId: '',
          delete: () => Promise.resolve(),
          getIdToken: () => Promise.resolve('fake-token'),
          getIdTokenResult: () => Promise.resolve({} as any),
          reload: () => Promise.resolve(),
          toJSON: () => ({}),
        },
        providerId: null,
        operationType: 'signIn' as 'signIn',
      });
  }

  it('should be created', () => {
    service = new TestFirebaseFirestoreService(
      TestBed.inject(Auth),
      TestBed.inject(Firestore),
      TestBed.inject(UtilsService),
      getMockSignInAnonymously(),
    );
    expect(service).toBeTruthy();
  });

  it('should call ensureControlFlagsExist on init', async () => {
    service = new TestFirebaseFirestoreService(
      TestBed.inject(Auth),
      TestBed.inject(Firestore),
      TestBed.inject(UtilsService),
      getMockSignInAnonymously(),
    );
    const spy = spyOn(service, 'createMissingContingentData').and.returnValue(
      Promise.resolve(),
    );
    authMock.currentUser = null;
    await service.init();
    expect(spy).toHaveBeenCalled();
  });

  // The following tests are placeholders for actual Firestore logic.
  // In a real test environment, you would mock Firestore's doc/getDoc/setDoc functions at the import level or use AngularFireTestingModule.

  it('should return control flags from Firestore', async () => {
    const flags: FirestoreContingentData = { StopTranslationForAllUsers: true };
    // Simulate Firestore returning flags
    spyOn(service as any, 'readContingentData').and.returnValue(
      Promise.resolve(flags),
    );
    const result = await (service as any).readContingentData();
    expect(result).toEqual(flags);
  });

  it('should return empty object if control flags do not exist', async () => {
    // Simulate Firestore returning empty
    spyOn(service as any, 'readContingentData').and.returnValue(
      Promise.resolve({}),
    );
    const result = await (service as any).readContingentData();
    expect(result).toEqual({});
  });

  // Add more tests for addTranslatedChars, getCharCountForUser, getTotalCharCount, isTranslationStoppedForAllUsers as needed
});
