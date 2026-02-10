// IMPORTANT: Do not change the path of FireStoreConstants as it is used in both the functions and the Angular app.
// functions/src/shared/app.constants.ts
// src/app/shared/app.constants.ts

export class FireStoreConstants {
  static readonly COLLECTION_TRANSLATIONS = 'MLT_translations_statistics';

  static readonly getUserMappingUsersCollectionPath = () => {
    return `${FireStoreConstants.COLLECTION_TRANSLATIONS}/userMapping/users`;
  };

  static readonly getUsersCollectionPath = () => {
    return `${FireStoreConstants.COLLECTION_TRANSLATIONS}/${this.currentYearMonthPath()}/users`;
  };

  static readonly getMetaTotalCharsDocumentPath = () => {
    return `${FireStoreConstants.COLLECTION_TRANSLATIONS}/${this.currentYearMonthPath()}/meta/totalChars`;
  };

  static readonly getMetaContingentDataDocumentPath = () => {
    return `${FireStoreConstants.COLLECTION_TRANSLATIONS}/${this.currentYearMonthPath()}/meta/contingentData`;
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
