// keep in sync with src/app/shared/interfaces.ts

export interface FirestoreContingentData {
  StopTranslationForAllUsers?: boolean;
  maxFreeTranslateCharsPerMonth?: number;
  maxFreeTranslateCharsBufferPerMonth?: number;
  maxFreeTranslateCharsPerMonthForUser?: number;
}

export interface SecureTranslateData {
  appId: string;
  text: string;
  baseLang: string;
  selectedLanguages: string[];
}
export interface TranslationResult {
  translations: Record<string, string>;
}
export interface CharCountResult {
  charCount: number;
  targetLanguages: string[];
}
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  appVersion: {
    major: number;
    minor: number;
    date: string;
  };
}
export interface ProgrammerDeviceUID {
  userId: string;
  name: string;
}

export interface AddUserData {
  appId: string;
  userId?: string;
  programmerDeviceUIDs: ProgrammerDeviceUID[];
  deviceInfo: DeviceInfo;
  isNative?: boolean;
};

export interface UpdateProgrammerDeviceUIDsData {
  appId: string;
  userId?: string;
  programmerDeviceUIDs: ProgrammerDeviceUID[];
};