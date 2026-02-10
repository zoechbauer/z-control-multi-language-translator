import { Injectable } from '@angular/core';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { environment } from 'src/environments/environment';
import { FireStoreConstants } from '../shared/app.constants';
import { FirestoreContingentData } from '../shared/firebase-firestore.interfaces';

@Injectable({
  providedIn: 'root',
})
export class FirebaseFirestoreUtilsService {
  constructor(private readonly firestoreService: FirebaseFirestoreService) {}

  /**
   * Checks if the translation contingent has been exceeded.
   * This method auto-refreshes the month context if the month has changed, then verifies, in order:
   * 1. If translation is globally stopped for all users.
   * 2. If the total contingent for all users is exceeded.
   * 3. If the contingent for the current user is exceeded.
   * Returns true if any of these conditions are met, otherwise false.
   * 
   * Note: these checks are also implemented in the Firebase Functions backend for security.
   */
  async isContingentExceeded(): Promise<boolean> {
    // Auto-refresh month context if the month has changed
    await this.autrefreshMonthContextIfNeeded();

    // Read all control flags from Firestore
    const flags: FirestoreContingentData =
      await this.firestoreService.readContingentData();
    console.log('Firestore contingent data:', flags);

    // 1. If translation is globally stopped for all users
    if (flags.StopTranslationForAllUsers) {
      console.log('Translation is stopped for all users.');
      return true;
    }
    // 2. If the total contingent for all users is exceeded
    if (await this.isTotalContingentExceeded(flags)) {
      console.log('All users have exceeded their translation contingent.');
      return true;
    }
    // 3. If the contingent for the current user is exceeded
    if (await this.isContingentForUserExceeded(flags)) {
      console.log('User has exceeded their translation contingent.');
      return true;
    }
    return false;
  }

  private async isContingentForUserExceeded(
    flags: FirestoreContingentData,
  ): Promise<boolean> {
    const limit =
      flags.maxFreeTranslateCharsPerMonthForUser ??
      environment.app.maxFreeTranslateCharsPerMonthForUser;
    const charCount = await this.firestoreService.getCharCountForUser();
    return charCount >= limit;
  }

  private async isTotalContingentExceeded(
    flags: FirestoreContingentData,
  ): Promise<boolean> {
    const limit =
      flags.maxFreeTranslateCharsPerMonth ??
      environment.app.maxFreeTranslateCharsPerMonth;
    const buffer =
      flags.maxFreeTranslateCharsBufferPerMonth ??
      environment.app.maxFreeTranslateCharsBufferPerMonth;
    const charCount = await this.firestoreService.getTotalCharCount();
    return charCount >= limit - buffer;
  }

  // Auto-refresh month context if the month has changed
  private async autrefreshMonthContextIfNeeded(): Promise<void> {
    const currentMonth =
      this.firestoreService['monthlyTranslationsMonthDocPath'];
    const expectedMonth = `${
      FireStoreConstants.COLLECTION_TRANSLATIONS
    }/${this.firestoreService['utilsService']?.getCurrentYearMonth()}`;
    if (currentMonth !== expectedMonth) {
      console.log(
        'Month has changed. Re-initializing FirestoreService for new month context.',
      );
      await this.firestoreService.init();
    }
  }
}
