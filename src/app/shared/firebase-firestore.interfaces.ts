// keep in sync with functions/src/shared/firebase-firestore.interfaces.ts
export interface FirestoreContingentData {
  StopTranslationForAllUsers?: boolean;
  maxFreeTranslateCharsPerMonth?: number;
  maxFreeTranslateCharsBufferPerMonth?: number;
  maxFreeTranslateCharsPerMonthForUser?: number;
}

export interface DisplayedUserContingentData {
  userNameKey: string;
  freeTranslateCharsPerMonth: number;
  translatedCharCountCurrentMonth: number;
  availableCharCountCurrentMonth: number;
}
export interface DisplayedUserStatistics {
  userId: string;
  userName: string;
  userType: 'P' | 'U'; // Programmer or User
  userCreatedAt: Date;
  userLastUpdated: Date | null;
  device: string | null;
  isNative: boolean;
  deviceInfo: DeviceInfo;
  displayedPlatform: string;
  translatedCharCount: number;
  targetLanguages: string[];
  lastTranslationDate: Date | null;
}

export interface UserTranslationStatistics {
  userId: string;
  translatedCharCount: number;
  targetLanguages: string[];
  lastTranslationDate?: Date;
}

export interface UserType {
  userId: string;
  name: string;
  type: 'P' | 'U'; // Programmer or User
  isNative: boolean;
  createdAt: Date;
  device?: string;
  deviceInfo?: DeviceInfo;
  lastUpdated?: Date;
}

export interface StatisticsData {
  displayedUserStatistics: DisplayedUserStatistics[];
  userTranslationStatistics: UserTranslationStatistics[];
  users: UserType[];
}
export interface ProgrammerDeviceUID {
  userId: string;
  name: string;
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
export interface CharCountResult {
  charCount: number;
  targetLanguages: string[];
}
