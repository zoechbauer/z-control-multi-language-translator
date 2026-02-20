import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils-service.js';
import {
  SecureTranslateData,
  TranslationResult,
} from './shared/firebase-firestore.interfaces.js';
import { FirebaseFirestoreService } from './firebase-firestore-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

admin.initializeApp();

const GOOGLE_TRANSLATE_API_KEY = defineSecret('GOOGLE_TRANSLATE_API_KEY');

/**
 * Callable function that validates input, enforces contingent limits, updates usage,
 * and returns translations from the Google Translate API.
 */
export const secureTranslate = onCall(
  { secrets: [GOOGLE_TRANSLATE_API_KEY] },
  async (request) => {
    const { data, auth } = request;
    const { text, baseLang, selectedLanguages } =
      data as SecureTranslateData;

    await validateSecureTranslateRequest(
      auth,
      text,
      baseLang,
      selectedLanguages,
    );

    await FirebaseFirestoreUtilsService.validateContingentOrThrow(auth!.uid);

    const firestoreService = new FirebaseFirestoreService(auth!.uid);
    await firestoreService.addTranslatedChars(
      text.length * selectedLanguages.length,
      selectedLanguages
    );

    const translationResult = await translateTextOrThrow(
      text,
      baseLang,
      selectedLanguages,
    );
    return translationResult;
  },
);

/**
 * Validates the request for secureTranslate Cloud Function.
 * Throws HttpsError if validation fails.
 */
async function validateSecureTranslateRequest(
  auth: any,
  text: string,
  baseLang: string,
  selectedLanguages: string[],
): Promise<void> {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  if (
    !text ||
    !baseLang ||
    !Array.isArray(selectedLanguages) ||
    selectedLanguages.length === 0
  ) {
    throw new HttpsError('invalid-argument', 'Missing required parameters.');
  }
}

/**
 * Calls Google Translate API and returns translations or throws on error.
 */
async function translateTextOrThrow(
  text: string,
  baseLang: string,
  selectedLanguages: string[],
): Promise<TranslationResult> {
  const apiKey =
    GOOGLE_TRANSLATE_API_KEY.value() || process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new HttpsError('internal', 'Google Translate API key is not set.');
  }
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  const translations: Record<string, string> = {};
  for (const target of selectedLanguages) {
    const body = {
      q: text,
      source: baseLang,
      target,
      format: 'text',
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new HttpsError(
        'internal',
        `Translation API error: ${response.statusText}`,
      );
    }
    const respData: any = await response.json();
    translations[target] = String(respData.data.translations[0].translatedText);
  }
  return { translations };
}
