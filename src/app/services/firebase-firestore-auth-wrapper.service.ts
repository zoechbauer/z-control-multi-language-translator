import { Injectable } from '@angular/core';
import * as angularFireAuth from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class FirebaseFirestoreAuthWrapperService {
  signInAnonymously(auth: angularFireAuth.Auth) {
    return angularFireAuth.signInAnonymously(auth);
  }

  onAuthStateChanged(
    auth: angularFireAuth.Auth,
    callback: (user: angularFireAuth.User | null) => void
  ) {
    return angularFireAuth.onAuthStateChanged(auth, callback);
  }

  // For unit testing only: create a mockable instance
  static createForTesting(
    signInAnonymouslyImpl: typeof angularFireAuth.signInAnonymously,
    onAuthStateChangedImpl: typeof angularFireAuth.onAuthStateChanged
  ) {
    const inst = new FirebaseFirestoreAuthWrapperService();
    (inst.signInAnonymously as any) = signInAnonymouslyImpl;
    (inst.onAuthStateChanged as any) = onAuthStateChangedImpl;
    return inst;
  }
}
