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
  /**
   * Emits the currently selected base language code (e.g. 'en', 'de').
   */
  selectedLanguageSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage(),
  );
  /**
   * Observable for the currently selected base language code.
   */
  selectedLanguage$ = this.selectedLanguageSubject.asObservable();
  /**
   * Emits the name of the currently selected base language (e.g. 'English', 'Deutsch').
   */
  selectedLanguageNameSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage(),
  );
  /**
   * Observable for the name of the currently selected base language.
   */
  selectedLanguageName$ = this.selectedLanguageNameSubject.asObservable();

  /**
   * Emits the array of selected target language codes.
   */
  targetLanguagesSubject = new BehaviorSubject<string[]>([]);
  /**
   * Observable for the array of selected target language codes.
   */
  targetLanguages$ = this.targetLanguagesSubject.asObservable();
  /**
   * Emits a formatted string of target language names with line breaks for display.
   */
  targetLanguagesNameWithLineBreaksSubject = new BehaviorSubject<string>('');
  /**
   * Observable for the formatted string of target language names with line breaks.
   */
  targetLanguagesNameWithLineBreaks$ =
    this.targetLanguagesNameWithLineBreaksSubject.asObservable();

  /**
   * Emits the current text-to-speech values with default settings if not set (rate, pitch).
   */
  textToSpeechValuesSubject = new BehaviorSubject<TextToSpeechValues>(
    this.getDefaultTextToSpeechValues(),
  );
  /**
   * Observable for the current text-to-speech values.
   */
  textToSpeechValues$ = this.textToSpeechValuesSubject.asObservable();

  constructor(
    private readonly storage: Storage,
    private readonly googleTranslateService: TranslationGoogleTranslateService,
  ) {}

  private async initStorage() {
    await this.storage.create();
  }

  /**
   * Initializes the storage and loads selected language, target languages, and text-to-speech values.
   * @param translate The TranslateService instance
   */
  async initializeServicesAsync(
    translate: import('@ngx-translate/core').TranslateService,
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
    translate: import('@ngx-translate/core').TranslateService,
  ): Promise<void> {
    try {
      translate.setDefaultLang('en');
      translate.use('en');
    } catch (fallbackError) {
      console.error('Critical: Even defaults failed:', fallbackError);
    }
  }

  /**
   * Loads the selected language from storage, or sets and returns the default language if not found.
   * Updates the selectedLanguageSubject accordingly.
   * @returns The selected or default language code
   */
  async loadSelectedOrDefaultLanguage(): Promise<string> {
    const selectedLanguage = await this.storage.get(
      LocalStorage.SelectedLanguage,
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

  /**
   * Sets the display name for the selected or default language.
   * @param langCode The language code
   */
  async setSelectedOrDefaultLanguageName(langCode: string): Promise<void> {
    if (!langCode) {
      throw new Error('Language code must be provided');
    }
    const name = await firstValueFrom(
      this.googleTranslateService.getBaseLanguageName(langCode),
    );
    this.selectedLanguageNameSubject.next(name);
  }

  /**
   * Saves the selected language to storage and updates the observable.
   * @param language The language code to save
   */
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

  /**
   * Saves the array of target languages to storage and updates the observable.
   * @param languages Array of language codes
   */
  async saveTargetLanguages(languages: string[]) {
    try {
      await this.storage.set(
        LocalStorage.TargetLanguages,
        JSON.stringify(languages),
      );
      this.targetLanguagesSubject.next(languages);
      this.setTargetLanguageNames(
        this.selectedLanguageSubject.value,
        languages,
      );
    } catch (error) {
      console.error('Error saving selected language:', error);
    }
  }

  /**
   * Loads the array of target languages from storage, or sets to empty if not found.
   */
  async loadTargetLanguages() {
    const targetLanguages = await this.storage.get(
      LocalStorage.TargetLanguages,
    );

    if (targetLanguages) {
      this.targetLanguagesSubject.next(JSON.parse(targetLanguages));
      this.setTargetLanguageNames(
        this.selectedLanguageSubject.value,
        JSON.parse(targetLanguages),
      );
    } else {
      await this.saveTargetLanguages([]);
      this.targetLanguagesSubject.next([]);
    }
  }

  /**
   * Loads the text-to-speech values from storage, or sets to defaults if not found.
   * @returns The loaded or default text-to-speech values
   */
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

  /**
   * Saves the text-to-speech values to storage and updates the observable.
   * @param values The text-to-speech values to save
   */
  async saveTextToSpeechValues(values: TextToSpeechValues) {
    try {
      await this.storage.set(
        LocalStorage.TextToSpeechValues,
        JSON.stringify(values),
      );
      this.textToSpeechValuesSubject.next(values);
    } catch (error) {
      console.error('Error saving text-to-speech values:', error);
    }
  }

  private async setTargetLanguageNames(baseLang: string, langs: string[]) {
    const targetLanguagesName: string =
      await this.googleTranslateService.getFormattedTargetLanguageNamesForCodes(
        baseLang,
        langs,
      );
    this.targetLanguagesNameWithLineBreaksSubject.next(targetLanguagesName);
  }

  private getMobileDefaultLanguage(): string {
    const lang = navigator.language.split('-')[0]; // e.g. "de-DE" -> "de"
    return /(de|en)/gi.test(lang) ? lang : 'en';
  }

  /**
   * Returns the default text-to-speech values for rate and pitch.
   * @returns {TextToSpeechValues} Default rate (25) and pitch (50).
   */
  public getDefaultTextToSpeechValues(): TextToSpeechValues {
    return {
      rate: 25, // 50 would be to fast, values: 0 (slow) to 100 (fast)
      pitch: 50, // 50 is normal pitch, values: 0 (low) to 100 (high)
    };
  }
}
