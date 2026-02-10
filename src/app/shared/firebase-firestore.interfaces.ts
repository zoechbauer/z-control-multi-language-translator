// keep in sync with functions/src/shared/firebase-firestore.interfaces.ts
export interface FirestoreContingentData {
  StopTranslationForAllUsers?: boolean;
  maxFreeTranslateCharsPerMonth?: number;
  maxFreeTranslateCharsBufferPerMonth?: number;
  maxFreeTranslateCharsPerMonthForUser?: number;
}

export interface UserStatistics {
  uid: string;
  charCount: number;
  lastUpdated?: Date;
  userAgent?: string;
  platform?: string;
  language?: string;
  appVersion?: string;
}

export interface UserType {
  userId: string;
  name: string;
  type: 'P' | 'U'; // Programmer or User
  createdAt: Date;
  device?: string;
  deviceInfo?: DeviceInfo;
  lastUpdated?: Date;
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
