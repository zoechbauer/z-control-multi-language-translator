import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((_opts: any, handler: any) => handler),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn(() => ({
    value: vi.fn(() => 'fake-api-key'),
  })),
}));

vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(),
  },
}));

vi.mock('./firebase-firestore.service.js', () => ({
  FirebaseFirestoreService: vi.fn(),
}));

vi.mock('./firebase-firestore-utils.service.js', () => ({
  FirebaseFirestoreUtilsService: {
    validateContingentOrThrow: vi.fn(),
  },
}));

import { FirebaseFirestoreService } from './firebase-firestore.service.js';
import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils.service.js';
import { secureTranslate } from './secure-translate.js';
import { SecureTranslateData } from './shared/firebase-firestore.interfaces.js';

describe('secureTranslate', () => {
  const COLLECTION = 'MLT_translations_statistics';
  const USER_ID = 'user1';
  const appId = 'translator';
  const VALID_DATA: SecureTranslateData = {
    appId,
    text: 'Hallo',
    baseLang: 'de',
    selectedLanguages: ['en'],
  };

  const makeRequest = (data: SecureTranslateData, uid?: string) => ({
    auth: uid ? { uid } : undefined,
    data,
  });

  const invoke = (data: SecureTranslateData, uid?: string) =>
    (secureTranslate as any)(makeRequest(data, uid));

  const mockFirestoreInstance = (
    addTranslatedCharsImpl?: ReturnType<typeof vi.fn>
  ) => {
    const addTranslatedChars =
      addTranslatedCharsImpl ?? vi.fn().mockResolvedValue(undefined);

    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.addTranslatedChars = addTranslatedChars;
    } as any);

    return { addTranslatedChars };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('throws unauthenticated when auth is missing', async () => {
      await expect(invoke(VALID_DATA)).rejects.toMatchObject({
        code: 'unauthenticated',
        message: 'User must be authenticated.',
      });
    });

    it('throws invalid-argument when appId is missing', async () => {
      await expect(
        invoke({ ...VALID_DATA, appId: '' }, USER_ID)
      ).rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'appId must be provided.',
      });
    });

    it('throws internal when unsupported appId is provided', async () => {
      await expect(
        invoke({ ...VALID_DATA, appId: 'unsupportedAppId' }, USER_ID)
      ).rejects.toMatchObject({
        code: 'internal',
        message: 'Unsupported appId: unsupportedAppId',
      });
    });

    const invalidCases: Array<{ name: string; data: SecureTranslateData }> = [
      {
        name: 'empty text and base language and empty selected languages',
        data: { appId, text: '', baseLang: '', selectedLanguages: [] },
      },
      {
        name: 'missing base language',
        data: { appId, text: 'Hallo', baseLang: '', selectedLanguages: [] },
      },
      {
        name: 'empty selected languages',
        data: { appId, text: 'Hallo', baseLang: 'de', selectedLanguages: [] },
      },
      {
        name: 'missing base language with selected language present',
        data: { appId, text: 'Hallo', baseLang: '', selectedLanguages: ['en'] },
      },
      {
        name: 'missing text',
        data: { appId, text: '', baseLang: 'de', selectedLanguages: [] },
      },
      {
        name: 'selectedLanguages is not an array',
        data: { appId, text: 'Hallo', baseLang: 'de', selectedLanguages: 'en' as unknown as string[] },
      },
      {
        name: 'payload object is empty',
        data: { appId } as SecureTranslateData,
      },
      {
        name: 'selectedLanguages is missing',
        data: { appId, text: 'Hallo', baseLang: 'de' } as SecureTranslateData,
      },
      {
        name: 'baseLang and selectedLanguages are missing',
        data: { appId, text: 'Hallo' } as SecureTranslateData,
      },
    ];

    it.for(invalidCases)('throws invalid-argument: $name', async ({ data }) => {
      await expect(invoke(data, USER_ID)).rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'Missing required parameters.',
      });
    });
  });

  describe('service interactions', () => {
    it('validates contingent using auth uid', async () => {
      vi.mocked(
        FirebaseFirestoreUtilsService.validateContingentOrThrow
      ).mockRejectedValue(new Error('Translation contingent exceeded'));

      await expect(invoke(VALID_DATA, USER_ID)).rejects.toThrow();

      expect(
        vi.mocked(FirebaseFirestoreUtilsService.validateContingentOrThrow)
      ).toHaveBeenCalledWith(COLLECTION, USER_ID);
    });

    it('calls addTranslatedChars with computed count and selected languages', async () => {
      vi.mocked(
        FirebaseFirestoreUtilsService.validateContingentOrThrow
      ).mockResolvedValue(undefined);

      const text = 'Hallo';
      const selectedLanguages = ['en', 'fr', 'nl'];
      const expectedCharCount = text.length * selectedLanguages.length;
      const { addTranslatedChars } = mockFirestoreInstance(
        vi.fn().mockRejectedValue(new Error('Error adding translated chars'))
      );

      await expect(
        invoke({ appId, text, baseLang: 'de', selectedLanguages }, USER_ID)
      ).rejects.toThrow();

      expect(vi.mocked(FirebaseFirestoreService)).toHaveBeenCalledWith(COLLECTION, USER_ID);
      expect(addTranslatedChars).toHaveBeenCalledWith(
        expectedCharCount,
        selectedLanguages
      );
    });
  });

  describe('translation API interaction', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls translation API with text, base language and selected languages', async () => {
      vi.mocked(
        FirebaseFirestoreUtilsService.validateContingentOrThrow
      ).mockResolvedValue(undefined);

      const text = 'Hallo';
      const baseLang = 'de';
      const selectedLanguages = ['en', 'fr', 'nl'];
      const expectedCharCount = text.length * selectedLanguages.length;

      const { addTranslatedChars } = mockFirestoreInstance(
        vi.fn().mockResolvedValue(undefined)
      );

      const fetchMock = vi.fn().mockImplementation(async (url, options) => {
        const body = JSON.parse(options?.body as string);
        const source = body.source;
        const target = body.target;
        return {
          ok: true,
          statusText: 'OK',
          json: async () => ({
            data: {
              translations: [
                {
                  translatedText: `Translated ${text} from ${source} to ${target}`,
                },
              ],
            },
          }),
        };
      });

      vi.stubGlobal('fetch', fetchMock);

      await expect(
        invoke({ appId, text, baseLang, selectedLanguages }, USER_ID)
      ).resolves.toEqual({
        translations: {
          en: 'Translated Hallo from de to en',
          fr: 'Translated Hallo from de to fr',
          nl: 'Translated Hallo from de to nl',
        },
      });
      expect(vi.mocked(FirebaseFirestoreService)).toHaveBeenCalledWith(COLLECTION, USER_ID);
      expect(addTranslatedChars).toHaveBeenCalledWith(
        expectedCharCount,
        selectedLanguages
      );
      expect(fetchMock).toHaveBeenCalledTimes(selectedLanguages.length);
    });

    it('throws internal error if translation API key is not set', async () => {
      const originalEnvKey = process.env.GOOGLE_TRANSLATE_API_KEY;
      delete process.env.GOOGLE_TRANSLATE_API_KEY;

      vi.resetModules();

      // Prevent .env.local from repopulating the key during module import
      vi.doMock('dotenv', () => ({
        default: { config: vi.fn() },
      }));

      vi.doMock('firebase-functions/v2/https', () => ({
        onCall: vi.fn((_opts: any, handler: any) => handler),
        HttpsError: class HttpsError extends Error {
          code: string;
          constructor(code: string, message: string) {
            super(message);
            this.code = code;
            this.name = 'HttpsError';
          }
        },
      }));

      vi.doMock('firebase-functions/params', () => ({
        defineSecret: vi.fn(() => ({
          value: vi.fn(() => undefined), // no secret value
        })),
      }));

      vi.doMock('firebase-admin', () => ({
        default: { initializeApp: vi.fn() },
      }));

      vi.doMock('./firebase-firestore.service.js', () => ({
        FirebaseFirestoreService: vi
          .fn()
          .mockImplementation(function (this: any) {
            this.addTranslatedChars = vi.fn().mockResolvedValue(undefined);
          }),
      }));

      vi.doMock('./firebase-firestore-utils.service.js', () => ({
        FirebaseFirestoreUtilsService: {
          validateContingentOrThrow: vi.fn().mockResolvedValue(undefined),
        },
      }));

      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const { secureTranslate: secureTranslateNoKey } = await import(
        './secure-translate.js'
      );

      await expect(
        (secureTranslateNoKey as any)({
          auth: { uid: USER_ID },
          data: {
            appId,
            text: 'Hallo',
            baseLang: 'de',
            selectedLanguages: ['en', 'fr', 'nl'],
          },
        })
      ).rejects.toMatchObject({
        code: 'internal',
        message: 'Google Translate API key is not set.',
      });

      expect(fetchSpy).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
      if (originalEnvKey === undefined)
        delete process.env.GOOGLE_TRANSLATE_API_KEY;
      else process.env.GOOGLE_TRANSLATE_API_KEY = originalEnvKey;
    });

    it('throws internal error if fetch fails', async () => {
      vi.mocked(
        FirebaseFirestoreUtilsService.validateContingentOrThrow
      ).mockResolvedValue(undefined);
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      });

      vi.stubGlobal('fetch', fetchMock);

      await expect(
        invoke(
          {
            appId,
            text: 'Hallo',
            baseLang: 'de',
            selectedLanguages: ['en', 'fr', 'nl'],
          },
          USER_ID
        )
      ).rejects.toMatchObject({
        code: 'internal',
        message: 'Translation API error: Bad Request',
      });
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
