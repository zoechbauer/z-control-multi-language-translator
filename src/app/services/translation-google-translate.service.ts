// translation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, tap } from 'rxjs';

interface GoogleTranslateResponse {
  data: {
    translations: { translatedText: string }[];
  };
}

@Injectable({ providedIn: 'root' })
export class TranslationGoogleTranslateService {
  private readonly GOOGLE_TRANSLATE_API_KEY = 'secret key do not commit' // copy key from .env.local
  private readonly GOOGLE_TRANSLATE_API_URL = `https://translation.googleapis.com/language/translate/v2?key=${this.GOOGLE_TRANSLATE_API_KEY}`;

  constructor(private http: HttpClient) {}

  translateWord(
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
        tap((resp) => console.log('Response in pipe', resp)),
        map((resp) => {
          const translatedText = resp.data.translations[0].translatedText;
          return { [target]: translatedText };
        })
      );
  }
}
