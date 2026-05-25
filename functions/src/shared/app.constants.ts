import { HttpsError } from 'firebase-functions/v2/https';

// IMPORTANT: Do not change the path of FireStoreConstants as it is used in both the functions and the Angular app.
// functions/src/shared/app.constants.ts
// src/app/shared/app.constants.ts

export class FireStoreConstants {
  static readonly COLLECTION_NAME = 'MLT_translations_statistics';

  private static readonly APP_TO_COLLECTION: Record<string, string> = {
    translator: FireStoreConstants.COLLECTION_NAME,
  };

  static readonly getCollectionByAppId = (appId: string): string => {
    const collection = FireStoreConstants.APP_TO_COLLECTION[appId];
    if (!collection) {
      throw new HttpsError('invalid-argument', `Unsupported appId: ${appId}`);
    }
    return collection;
  };

  static readonly getUserMappingUsersCollectionPath = (collection: string) => {
    return `${collection}/userMapping/users`;
  };

  static readonly getUserMappingProgrammerDevicesCollectionPath = (
    collection: string
  ) => {
    return `${collection}/userMapping/programmerDevices`;
  };

  static readonly getUsersCollectionPath = (collection: string) => {
    return `${collection}/${this.currentYearMonthPath()}/users`;
  };

  static readonly getMetaTotalCharsDocumentPath = (collection: string) => {
    return `${collection}/${this.currentYearMonthPath()}/meta/totalChars`;
  };

  static readonly getMetaContingentDataDocumentPath = (collection: string) => {
    return `${collection}/${this.currentYearMonthPath()}/meta/contingentData`;
  };

  /**
   * Returns the current year and month as a string in the format 'YYYY-MM'.
   */
  private static readonly currentYearMonthPath = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };
}

/**
 * User types in user mapping collection. 'P' for programmers, 'U' for regular users.
 */
export enum UserType {
  Programmer = 'P',
  User = 'U',
}
