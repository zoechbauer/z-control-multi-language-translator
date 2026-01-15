import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { TranslationGoogleTranslateService } from './translation-google-translate.service';
import { TextToSpeechValues } from '../shared/interfaces';

enum LocalStorage {
  SelectedLanguage = 'selectedLanguage',
  TargetLanguages = 'targetLanguages',
  TextToSpeechValues = 'textToSpeechValues',
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  selectedLanguageSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage()
  );
  selectedLanguage$ = this.selectedLanguageSubject.asObservable();
  selectedLanguageNameSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage()
  );
  selectedLanguageName$ = this.selectedLanguageNameSubject.asObservable();

  targetLanguagesSubject = new BehaviorSubject<string[]>([]);
  targetLanguages$ = this.targetLanguagesSubject.asObservable();
  targetLanguagesNameWithLineBreaksSubject = new BehaviorSubject<string>('');
  targetLanguagesNameWithLineBreaks$ =
    this.targetLanguagesNameWithLineBreaksSubject.asObservable();

    textToSpeechValuesSubject = new BehaviorSubject<TextToSpeechValues>(
      this.getDefaultTextToSpeechValues()
    );
    textToSpeechValues$ = this.textToSpeechValuesSubject.asObservable();
  constructor(
    private readonly storage: Storage,
    private readonly googleTranslateService: TranslationGoogleTranslateService
  ) {}

  private async initStorage() {
    await this.storage.create();
  }

  /**
   * Initializes storage and loads selected language, target languages, and text-to-speech values.
   */
  async initializeServicesAsync(
    translate: import('@ngx-translate/core').TranslateService
  ): Promise<void> {
    try {
      await this.initStorage();
      const lang = await this.loadSelectedOrDefaultLanguage();
      await this.setSelectedOrDefaultLanguageName(lang);
      await this.loadTargetLanguages();
      await this.loadTextToSpeechValues();
    } catch (error) {
      console.error('App initialization failed:', error);
      await this.initializeWithDefaults(translate);
    }
  }

  /**
   * Fallback: sets default language to 'en' in TranslateService
   */
  private async initializeWithDefaults(
    translate: import('@ngx-translate/core').TranslateService
  ): Promise<void> {
    try {
      translate.setDefaultLang('en');
      translate.use('en');
    } catch (fallbackError) {
      console.error('Critical: Even defaults failed:', fallbackError);
    }
  }

  async loadSelectedOrDefaultLanguage(): Promise<string> {
    const selectedLanguage = await this.storage.get(
      LocalStorage.SelectedLanguage
    );

    if (selectedLanguage) {
      this.selectedLanguageSubject.next(selectedLanguage);
      return selectedLanguage;
    } else {
      const lang = this.getMobileDefaultLanguage();
      await this.saveSelectedLanguage(lang);
      this.selectedLanguageSubject.next(lang);
      return lang;
    }
  }

  async setSelectedOrDefaultLanguageName(langCode: string): Promise<void> {
    if (!langCode) {
      throw new Error('Language code must be provided');
    }
    const name = await firstValueFrom(
      this.googleTranslateService.getBaseLanguageName(langCode)
    );
    this.selectedLanguageNameSubject.next(name);
  }

  async saveSelectedLanguage(language: string) {
    if (!language) {
      throw new Error('Language must be provided');
    }
    try {
      await this.storage.set(LocalStorage.SelectedLanguage, language);
      this.selectedLanguageSubject.next(language);
      await this.setSelectedOrDefaultLanguageName(language);
    } catch (error) {
      console.error('Error saving selected language:', error);
    }
  }

  async saveTargetLanguages(languages: string[]) {
    try {
      await this.storage.set(
        LocalStorage.TargetLanguages,
        JSON.stringify(languages)
      );
      this.targetLanguagesSubject.next(languages);
      this.setTargetLanguageNames(
        this.selectedLanguageSubject.value,
        languages
      );
    } catch (error) {
      console.error('Error saving selected language:', error);
    }
  }

  async loadTargetLanguages() {
    const targetLanguages = await this.storage.get(
      LocalStorage.TargetLanguages
    );

    if (targetLanguages) {
      this.targetLanguagesSubject.next(JSON.parse(targetLanguages));
      this.setTargetLanguageNames(
        this.selectedLanguageSubject.value,
        JSON.parse(targetLanguages)
      );
    } else {
      await this.saveTargetLanguages([]);
      this.targetLanguagesSubject.next([]);
    }
  }

  async loadTextToSpeechValues(): Promise<TextToSpeechValues> {
    const ttsValues = await this.storage.get(LocalStorage.TextToSpeechValues);
    if (ttsValues) {
      this.textToSpeechValuesSubject.next(JSON.parse(ttsValues));
      return JSON.parse(ttsValues);
    } else {
      const defaultValues = this.getDefaultTextToSpeechValues();
      await this.saveTextToSpeechValues(defaultValues);
      return defaultValues;
    }
  }

  async saveTextToSpeechValues(values: TextToSpeechValues) {
    try {
      await this.storage.set(LocalStorage.TextToSpeechValues, JSON.stringify(values));
      this.textToSpeechValuesSubject.next(values);
    } catch (error) {
      console.error('Error saving text-to-speech values:', error);
    }
  }

  private async setTargetLanguageNames(baseLang: string, langs: string[]) {
    const targetLanguagesName: string =
      await this.googleTranslateService.getFormattedTargetLanguageNamesForCodes(
        baseLang,
        langs
      );
    this.targetLanguagesNameWithLineBreaksSubject.next(targetLanguagesName);
  }

  private getMobileDefaultLanguage(): string {
    const lang = navigator.language.split('-')[0]; // e.g. "de-DE" -> "de"
    return /(de|en)/gi.test(lang) ? lang : 'en';
  }

  private getDefaultTextToSpeechValues(): TextToSpeechValues {
    return {
      rate: 50,
      pitch: 50,
    };
  }
}
