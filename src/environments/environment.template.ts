// @ts-nocheck
export const environment = {
  production: __PRODUCTION__,
  version: { 
    major: __MAJOR__, 
    minor: __MINOR__, 
    date: '__DATE__'
  },
    app: {
    name: '__APP_NAME__',
    maxTargetLanguages: __MAX_TARGET_LANGUAGES__,
  },
  googleTranslate: {
    apiKey: '__GOOGLE_TRANSLATE_API_KEY__',
  }
};