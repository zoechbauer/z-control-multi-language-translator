// translation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

interface LibreTranslateResponse {
  translatedText: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationLibreTranslateService {
  private baseUrl = 'https://de.libretranslate.com'; // ggf. eigene Instanz

  constructor(private http: HttpClient) {}

  translateWordFromGerman(
    word: string,
    targets: string[] = ['en', 'fr', 'es']
  ): Observable<Record<string, string>> {
    const requests = targets.map(lang =>
      this.http.post<LibreTranslateResponse>(`${this.baseUrl}/translate`, {
        q: word,
        source: 'de',
        target: lang,
        format: 'text'
      })
    );

    return forkJoin(requests).pipe(
      // Map Responses in ein { lang: text } Objekt
      // z.B. { en: 'house', fr: 'maison', es: 'casa' }
      // (ggf. in eigener Pipe/Operator sauberer aufteilen)
      map((responses: LibreTranslateResponse[]) => {
        const result: Record<string, string> = {};
        responses.forEach((res, index) => {
          result[targets[index]] = res.translatedText;
        });
        return result;
      })
    );
  }
}

