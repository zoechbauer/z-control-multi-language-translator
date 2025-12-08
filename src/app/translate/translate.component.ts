import { Component, OnInit } from '@angular/core';

import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';

interface TranslationResult {
  [lang: string]: string;
}

interface Translation {
  language: string;
  translatedText: string;
}

@Component({
  selector: 'app-translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.scss'],
  standalone: false,
})
export class TranslateComponent implements OnInit {
  word: string = '';
  defaultSourceLang: string = 'de';
  translations: Translation[] = [];
  languages: string[] = [];

  constructor(private translationService: TranslationGoogleTranslateService) {}

  ngOnInit() {
    this.word = '';
    this.setLanguages();
    this.getDefaultSourceLang();
  }

  translate(): void {
    if (!this.word.trim()) {
      return;
    }
    this.translations = [];

    this.languages.forEach((translateToLang) => {
      this.translationService
        .translateWord(this.word, this.defaultSourceLang, translateToLang)
        .subscribe((result) => {
          console.log('Translation Result:', result);

          this.translations.push({
            language: translateToLang,
            translatedText: result[translateToLang],
          });
        });
    });
  }

  clear(): void {
    this.word = '';
    this.translations = [];
  }

  private setLanguages(): void {
    this.languages = ['en', 'fr', 'es'];
  }

  private getDefaultSourceLang(): void {
    // Use browser's default language, fallback to 'de' if not available
    const browserLang = navigator.language || 'de';
    // use only the language code (e.g., 'de' from 'de-DE')
    this.defaultSourceLang = browserLang.split('-')[0];
  }
}
