// @ts-nocheck
export const environment = {
  production: __PRODUCTION__,
  version: {
    major: __MAJOR__,
    minor: __MINOR__,
    date: '__DATE__',
  },
  app: {
    name: '__APP_NAME__',
    maxTargetLanguages: __MAX_TARGET_LANGUAGES__,
    maxFreeTranslateCharsPerMonth: __MAX_FREE_TRANSLATE_CHARS_PER_MONTH__,
    maxFreeTranslateCharsBufferPerMonth:
      __MAX_FREE_TRANSLATE_CHARS_BUFFER_PER_MONTH__,
    maxInputLength: __MAX_INPUT_LENGTH__,
    textToSpeechMinValue: __TEXT_TO_SPEECH_MIN_VALUE__,
    textToSpeechMaxValue: __TEXT_TO_SPEECH_MAX_VALUE__,
    showTabsBar: __SHOW_TABS_BAR__,
    simulateTranslation: __SIMULATE_TRANSLATION__,
    useFirebaseEmulator: __USE_FIREBASE_EMULATOR__,
    programmerDevices: {
      updateUsermap: __PROGRAMMER_DEVICES_UPDATE_USERMAP__,
      devices: [
        {
          GalaxyA33LUid: __PROGRAMMER_GALAXY_A33_L_UID__,
        },
        {
          GalaxyA33Uid: __PROGRAMMER_GALAXY_A33_UID__,
        },
        {
          WebChromeUid: __PROGRAMMER_WEB_CHROME_UID__,
        },
      ],
    },
  },
  googleTranslate: {
    apiKey: '__GOOGLE_TRANSLATE_API_KEY__',
  },
  firebase: {
    apiKey: __FIREBASE_API_KEY__,
    authDomain: __FIREBASE_AUTH_DOMAIN__,
    projectId: __FIREBASE_PROJECT_ID__,
    storageBucket: __FIREBASE_STORAGE_BUCKET__,
    messagingSenderId: __FIREBASE_MESSAGING_SENDER_ID__,
    appId: __FIREBASE_APP_ID__,
    measurementId: __FIREBASE_MEASUREMENT_ID__,
  },
};
