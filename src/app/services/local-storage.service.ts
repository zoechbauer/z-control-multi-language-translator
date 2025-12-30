
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

enum LocalStorage {
  SelectedLanguage = 'selectedLanguage',
  TargetLanguages = 'targetLanguages',
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {

  selectedLanguageSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage()
  );
  selectedLanguage$ = this.selectedLanguageSubject.asObservable();
  targetLanguagesSubject = new BehaviorSubject<string[]>([]);
  targetLanguages$ = this.targetLanguagesSubject.asObservable();

  constructor(
    private readonly storage: Storage
  ) {}

  async init() {
    await this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
    await this.loadSelectedOrDefaultLanguage();
  }

  getMobileDefaultLanguage(): string {
    const lang = navigator.language.split('-')[0]; // e.g. "de-DE" -> "de"
    return /(de|en)/gi.test(lang) ? lang : 'en';
  }

  async loadSelectedOrDefaultLanguage() {
    const selectedLanguage = await this.storage.get(
      LocalStorage.SelectedLanguage
    );

    if (selectedLanguage) {
      this.selectedLanguageSubject.next(selectedLanguage);
    } else {
      const lang = this.getMobileDefaultLanguage();
      await this.saveSelectedLanguage(lang);
      this.selectedLanguageSubject.next(lang);
    }
  }

  async saveSelectedLanguage(language: string) {
    try {
      await this.storage.set(
        LocalStorage.SelectedLanguage, language
      );
      this.selectedLanguageSubject.next(language);
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
    } else {
      await this.saveTargetLanguages([]);
      this.targetLanguagesSubject.next([]);
    }
  }

    /**
   * Initializes storage and loads selected language, with fallback to defaults on error.
   */
  async initializeServicesAsync(translate: import('@ngx-translate/core').TranslateService): Promise<void> {
    try {
      await this.init();
      await this.loadSelectedOrDefaultLanguage();
    } catch (error) {
      console.error('App initialization failed:', error);
      await this.initializeWithDefaults(translate);
    }
  }

  /**
   * Fallback: sets default language to 'en' in TranslateService
   */
  private async initializeWithDefaults(translate: import('@ngx-translate/core').TranslateService): Promise<void> {
    try {
      translate.setDefaultLang('en');
      translate.use('en');
    } catch (fallbackError) {
      console.error('Critical: Even defaults failed:', fallbackError);
    }
  }
}
