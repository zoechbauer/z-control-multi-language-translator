import { environment } from 'src/environments/environment';

export class AppConstants {
  private static readonly _maxInputLength = 100;
  private static readonly _maxTargetLanguages = 5;
  private static readonly _maxFreeTranslateCharsPerMonth = 500000;
  private static readonly _ttsDefault = 50;  // range 0-100
  private static readonly _ttsMin = 0.5;
  private static readonly _ttsMax = 2.0;

  static get maxInputLength(): number {
    return environment.app.maxInputLength ?? this._maxInputLength;
  }

  static get maxTargetLanguages(): number {
    return environment.app.maxTargetLanguages ?? this._maxTargetLanguages;
  }

  static get maxFreeTranslateCharsPerMonth(): number {
    return (
      environment.app.maxFreeTranslateCharsPerMonth ??
      this._maxFreeTranslateCharsPerMonth
    );
  }

  static get textToSpeechMinValue(): number {
    return environment.app.textToSpeechMinValue ?? this._ttsMin;
  }
  static get textToSpeechMaxValue(): number {
    return environment.app.textToSpeechMaxValue ?? this._ttsMax;
  }
  static get textToSpeechDefaultValue(): number {
    return  this._ttsDefault;
  }
}

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
  static readonly currentYearMonthPath = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };
}

