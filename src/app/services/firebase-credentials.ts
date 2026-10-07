import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseCredentials {
  /**
   * This function checks the environment configuration to determine 
   * whether to use the staging Firebase functions or the production ones.
   * @returns The Firebase configuration object based on whether staging functions are used.
   */
  static getFirebaseCredentials() {
    return environment.useStagingFunctions
      ? environment.firebaseStaging
      : environment.firebase;
  }
}
