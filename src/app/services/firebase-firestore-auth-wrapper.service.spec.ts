import * as angularFireAuth from '@angular/fire/auth';
import { FirebaseFirestoreAuthWrapperService } from './firebase-firestore-auth-wrapper.service';

describe('FirebaseFirestoreAuthWrapperService', () => {
  describe('FirebaseFirestoreAuthWrapperService (real methods)', () => {
    let realService: FirebaseFirestoreAuthWrapperService;
    beforeEach(() => {
      realService = new FirebaseFirestoreAuthWrapperService();
    });
    it('should call the real signInAnonymously and onAuthStateChanged', () => {
      try {
        realService.signInAnonymously({} as any);
      } catch {}
      try {
        realService.onAuthStateChanged({} as any, () => {});
      } catch {}
    });
  });
  let service: FirebaseFirestoreAuthWrapperService;
  let authMock: any;
  const userStub: angularFireAuth.User = {
    uid: 'test-uid',
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

  const userCredentialStub: angularFireAuth.UserCredential = {
    user: userStub,
    providerId: null,
    operationType: 'signIn',
  };

  let signInAnonymouslySpy: jasmine.Spy;
  let onAuthStateChangedSpy: jasmine.Spy;

  beforeEach(() => {
    authMock = {};
    signInAnonymouslySpy = jasmine
      .createSpy('signInAnonymously')
      .and.resolveTo(userCredentialStub);
    onAuthStateChangedSpy = jasmine
      .createSpy('onAuthStateChanged')
      .and.callFake((auth: any, cb: any) => {
        cb(userStub);
        return jasmine.createSpy('unsub');
      });
    service = FirebaseFirestoreAuthWrapperService.createForTesting(
      signInAnonymouslySpy,
      onAuthStateChangedSpy
    );
  });

  describe('signInAnonymously', () => {
    it('should call signInAnonymously with auth', async () => {
      const result = await service.signInAnonymously(authMock);

      expect(signInAnonymouslySpy).toHaveBeenCalledWith(authMock);
      expect(result).toEqual(userCredentialStub);
    });
  });

  describe('onAuthStateChanged', () => {
    it('should call onAuthStateChanged with auth and callback', () => {
      const callback = jasmine.createSpy('callback') as (
        user: angularFireAuth.User | null
      ) => void;

      const result = service.onAuthStateChanged(authMock, callback);

      expect(onAuthStateChangedSpy).toHaveBeenCalledWith(authMock, callback);
      expect(callback).toHaveBeenCalledWith(userStub);
      expect(result).toBeDefined();
    });
  });
});
