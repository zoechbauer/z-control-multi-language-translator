// translation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

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

  constructor(private readonly http: HttpClient) {}

  /**
   * Translates a given word or phrase from the source language to the target language using Google Translate API.
   *
   * @param word The text to translate.
   * @param source The source language code (default: 'de').
   * @param target The target language code (default: 'en').
   * @returns An Observable emitting an object with the target language code as key and the translated text as value.
   */
  translateText(
    word: string,
    source: string = 'de',
    target: string = 'en'
  ): Observable<Record<string, string>> {
    return this.http
      .post<GoogleTranslateResponse>(`${this.GOOGLE_TRANSLATE_API_URL}`, {
        q: word,
        source,
        target,
        format: 'text',
      })
      .pipe(
        map((resp) => {
          const translatedText = resp.data.translations[0].translatedText;
          return { [target]: translatedText };
        })
      );
  }

  /**
   * Returns all supported languages with names formatted as "Name (code)", sorted alphabetically.
   * The returned name includes the language code in parentheses.
   */
  getSupportedLanguagesWithLangCodeInName(
    targetLang: string = 'en'
  ): Observable<GoogleLanguage[]> {
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
      )
    );
  }

  /**
   * Returns a string of language names (with codes) separated by <br/> tags, filtered by the provided language codes.
   *
   * @param supportedLanguages Array of supported GoogleLanguage objects.
   * @param targetLangCodes Array of language codes to include in the output.
   * @returns A string of language names separated by <br/> tags, or an empty string if input is invalid.
   */
  getLanguageNamesStringWithLineBreaks(
    supportedLanguages: GoogleLanguage[],
    targetLangCodes: string[]
  ): string {
    if (!supportedLanguages || !Array.isArray(targetLangCodes)) {
      return '';
    }
    return supportedLanguages
      .filter((lang) => targetLangCodes.includes(lang.language))
      .map((lang) => lang.name)
      .join('<br/>');
  }

  /**
   * Retrieves the display name (with language code) for the specified base language code.
   *
   * @param baseLang The language code to look up (default: 'en').
   * @returns An Observable emitting the language name with code in parentheses, or an empty string if not found.
   */
  getBaseLanguageName(baseLang: string = 'en'): Observable<string> {
    return this.getSupportedLanguagesWithLangCodeInName(baseLang).pipe(
      map((langs: GoogleLanguage[]) => {
        return langs.find((lang) => baseLang === lang.language)?.name || '';
      })
    );
  }
}
