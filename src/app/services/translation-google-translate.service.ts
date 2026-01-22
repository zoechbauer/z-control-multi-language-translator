// translation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService, Translation } from '@ngx-translate/core';
import { Observable, firstValueFrom, forkJoin, map, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { FirebaseFirestoreService } from './firebase-firestore.service';

interface GoogleTranslateResponse {
  data: {
    translations: { translatedText: string }[];
  };
}

export interface GoogleLanguage {
  language: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationGoogleTranslateService {
  private readonly GOOGLE_TRANSLATE_API_KEY =
    environment.googleTranslate.apiKey;
  private readonly GOOGLE_TRANSLATE_API_URL = `https://translation.googleapis.com/language/translate/v2?key=${this.GOOGLE_TRANSLATE_API_KEY}`;
  private supportedLanguagesCache: { [lang: string]: GoogleLanguage[] } = {};

  constructor(
    private readonly http: HttpClient,
    private readonly translate: TranslateService,
    private readonly firestoreService: FirebaseFirestoreService
  ) {}

  // Set to true in environment.ts to simulate translations without making actual API calls
  // This helps to save the free quota during development and layout testing
  static readonly SIMULATE_TRANSLATION = environment.app.simulateTranslation;

  /**
   * Translates the given text from the base language to each of the selected target languages using the provided translation function.
   *
   * @param translateFunction - A function that translates text from the base language to a target language, returning an Observable of a record mapping language codes to translated text.
   * @param text - The text to be translated.
   * @param baseLang - The source language code.
   * @param selectedLanguages - An array of target language codes to translate the text into.
   * @returns An Observable emitting an array of Translation objects, each containing the language code and the translated text, sorted by language code.
   */
  getTranslations(
    translateFunction: (
      text: string,
      baseLang: string,
      translateToLang: string
    ) => Observable<Record<string, string>>,
    text: string,
    baseLang: string,
    selectedLanguages: string[]
  ): Observable<Translation[]> {
    const translations$ = selectedLanguages.map((translateToLang: string) =>
      translateFunction(text, baseLang, translateToLang).pipe(
        map((result) => ({
          language: translateToLang,
          translatedText: result?.[translateToLang] ?? '',
        }))
      )
    );

    return forkJoin(translations$).pipe(
      map((results: Translation[]) =>
        results.sort((a, b) => a.language.localeCompare(b.language))
      )
    );
  }

  /**
   * Translates a given word or phrase from the source language to the target language using Google Translate API.
   *
   * @param word The text to translate.
   * @param source The source language code.
   * @param target The target language code.
   * @returns An Observable emitting an object with the target language code as key and the translated text as value.
   */
  translateText(
    word: string,
    source: string,
    target: string
  ): Observable<Record<string, string>> {
    if (!source || !target) {
      throw new Error('Source and target languages must be provided');
    }
    return this.http
      .post<GoogleTranslateResponse>(`${this.GOOGLE_TRANSLATE_API_URL}`, {
        q: word,
        source,
        target,
        format: 'text',
      })
      .pipe(
        tap(() => {
          console.log(
            `Translated "${word}" from ${source} to ${target} using Google Translate API.`
          );
        }),
        map((resp) => {
          const translatedText = resp.data.translations[0].translatedText;
          return { [target]: translatedText };
        })
      );
  }

  /**
   * Simulates the Translation of a given word or phrase from the source language to the target language.
   * This function is for testing layout improvement to avoid network calls which reduces the free language API quota.
   * @param word The text to translate.
   * @param source The source language code.
   * @param target The target language code.
   * @returns An Observable emitting an object with the target language code as key and the translated text as value.
   */
  simulateTranslateText(
    word: string,
    source: string,
    target: string
  ): Observable<Record<string, string>> {
    if (!source || !target) {
      throw new Error('Source and target languages must be provided');
    }
    console.log(
      `Simulating translation of "${word}" from ${source} to ${target}`
    );
    return of({
      [target]: this.translate.instant('TRANSLATE.CARD_RESULTS.SIMULATION.OUTPUT'),
    });
  }

  /**
   * Fetches all supported languages from Google Translate API, formats each as "Name (code)",
   * sorts them alphabetically, and caches the result.
   *
   * @param targetLang The language code for the display names.
   * @returns Observable emitting an array of GoogleLanguage objects with formatted names.
   */
  getSupportedLanguagesWithLangCodeInName(
    targetLang: string
  ): Observable<GoogleLanguage[]> {
    if (!targetLang) {
      throw new Error('targetLang must be provided');
    }
    if (this.supportedLanguagesCache[targetLang]?.length > 0) {
      return of(this.supportedLanguagesCache[targetLang]);
    }
    const url = `https://translation.googleapis.com/language/translate/v2/languages?key=${this.GOOGLE_TRANSLATE_API_KEY}&target=${targetLang}`;
    return this.http.get<any>(url).pipe(
      map((resp) => resp.data.languages as GoogleLanguage[]),
      map((langs) =>
        langs
          .map((lang) => ({
            language: lang.language,
            name: `${lang.name} (${lang.language})`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      ),
      tap((langs) => {
        this.supportedLanguagesCache[targetLang] = langs;
        console.log('Cached supported languages for', targetLang, langs);
      })
    );
  }

  /**
   * Formats an array of GoogleLanguage objects as a string, with each language name (with code)
   * separated by <br/> tags, filtered by the provided language codes.
   *
   * @param supportedLanguages Array of supported GoogleLanguage objects.
   * @param targetLangCodes Array of language codes to include in the output.
   * @returns A string of language names separated by <br/> tags, or an empty string if input is invalid.
   */
  formatLanguageNamesWithLineBreaks(
    supportedLanguages: GoogleLanguage[],
    targetLangCodes: string[]
  ): string {
    if (!supportedLanguages || !Array.isArray(targetLangCodes)) {
      throw new Error(
        'supportedLanguages and targetLangCodes must be provided'
      );
    }
    return supportedLanguages
      .filter((lang) => targetLangCodes.includes(lang.language))
      .map((lang) => lang.name)
      .join('<br/>');
  }

  /**
   * Returns a formatted string of language names (with codes) separated by <br/> tags,
   * for the given language codes in the base language. If the supported languages are not yet cached,
   * fetches them first before formatting.
   *
   * @param baseLang The base language code for the display names.
   * @param targetLangCodes Array of language codes to include in the output.
   * @returns Promise resolving to a string of language names separated by <br/>, or an empty string if input is invalid.
   */
  async getFormattedTargetLanguageNamesForCodes(
    baseLang: string,
    targetLangCodes: string[]
  ): Promise<string> {
    if (!baseLang) {
      throw new Error('baseLang must be provided');
    }
    if (
      !this.supportedLanguagesCache[baseLang] ||
      this.supportedLanguagesCache[baseLang].length === 0
    ) {
      // Fetch supported languages if not already cached
      await firstValueFrom(
        this.getSupportedLanguagesWithLangCodeInName(baseLang)
      );
    }
    // Use cached or newly fetched supported languages
    return this.formatLanguageNamesWithLineBreaks(
      this.supportedLanguagesCache[baseLang],
      targetLangCodes
    );
  }

  /**
   * Retrieves the display name (with language code) for the specified base language code.
   *
   * @param baseLang The language code to look up.
   * @returns An Observable emitting the language name with code in parentheses, or an empty string if not found.
   */
  getBaseLanguageName(baseLang: string): Observable<string> {
    if (!baseLang) {
      throw new Error('baseLang must be provided');
    }
    return this.getSupportedLanguagesWithLangCodeInName(baseLang).pipe(
      map((langs: GoogleLanguage[]) => {
        return langs.find((lang) => baseLang === lang.language)?.name || '';
      })
    );
  }
}
