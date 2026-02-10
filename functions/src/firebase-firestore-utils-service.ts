import { FirebaseFirestoreService } from './firebase-firestore-service.js';
import { FirestoreContingentData } from './shared/firebase-firestore.interfaces.js';

export class FirebaseFirestoreUtilsService {
  private readonly firestoreService: FirebaseFirestoreService;

  constructor(firestoreService: FirebaseFirestoreService) {
    this.firestoreService = firestoreService;
  }

  /**
   * Checks whether translation contingent limits are exceeded for a user.
   */
  async isContingentExceeded(
    flags: FirestoreContingentData,
    userId: string,
  ): Promise<boolean> {
    // 1. If translation is globally stopped for all users
    if (flags.StopTranslationForAllUsers) {
      return true;
    }
    // 2. If the total contingent for all users is exceeded
    if (await this.isTotalContingentExceeded(flags)) {
      return true;
    }
    // 3. If the contingent for the current user is exceeded
    if (await this.isContingentForUserExceeded(flags, userId)) {
      return true;
    }
    return false;
  }

  private async isContingentForUserExceeded(
    flags: FirestoreContingentData,
    userId: string,
  ): Promise<boolean> {
    const limit = flags.maxFreeTranslateCharsPerMonthForUser;
    if (limit === undefined) {
      return true;
    }
    const charCount = await this.firestoreService.getCharCountForUser();
    return charCount >= limit;
  }

  private async isTotalContingentExceeded(
    flags: FirestoreContingentData,
  ): Promise<boolean> {
    const limit = flags.maxFreeTranslateCharsPerMonth;
    const buffer = flags.maxFreeTranslateCharsBufferPerMonth;
    if (limit === undefined || buffer === undefined) {
      return true;
    }
    const charCount = await this.firestoreService.getTotalCharCount();
    return charCount >= limit - buffer;
  }

  /**
   * Validates the contingent for the user and throws if exceeded or not found.
   */
  static async validateContingentOrThrow(userId: string): Promise<void> {
    const firestoreService = new FirebaseFirestoreService(userId);
    let flags = await firestoreService.readContingentData();
    if (!flags) {
      // could occur on change to next month
      console.log(`Contingent data not found for user${userId} -> created`);
      await firestoreService.createMissingContingentData();
      flags = await firestoreService.readContingentData();
    }
    const utilsService = new FirebaseFirestoreUtilsService(firestoreService);
    if (await utilsService.isContingentExceeded(flags, userId)) {
      console.error('Contingent exceeded for user:', userId);
      throw new (await import('firebase-functions/v2/https')).HttpsError(
        'resource-exhausted',
        'Translation contingent exceeded.',
      );
    }
  }
}
