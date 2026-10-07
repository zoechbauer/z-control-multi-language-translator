import { TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';
import { FirebaseCredentials } from './firebase-credentials';

describe('FirebaseCredentials', () => {
  let service: FirebaseCredentials;
  let environmentBackup: typeof environment;

  beforeEach(() => {
    environmentBackup = { ...environment };

    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebaseCredentials);
  });

  afterEach(() => {
    Object.assign(environment, environmentBackup);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFirebaseCredentials', () => {
    it('should return the staging Firebase credentials when useStagingFunctions is true', () => {
      environment.useStagingFunctions = true;
      expect(FirebaseCredentials.getFirebaseCredentials()).toBe(environment.firebaseStaging);
    });

    it('should return the production Firebase credentials when useStagingFunctions is false', () => {
      environment.useStagingFunctions = false;
      expect(FirebaseCredentials.getFirebaseCredentials()).toBe(environment.firebase);
    });
  });
});
