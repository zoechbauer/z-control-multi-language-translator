import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { TranslationGoogleTranslateService } from './translation-google-translate.service';
import { TextToSpeechValues } from '../shared/app.interfaces';
import { AllMonthsOption, DisplayMode } from '../shared/enums';
import { UtilsService } from './utils.service';

enum LocalStorage {
  SelectedLanguage = 'selectedLanguage',
  TargetLanguages = 'targetLanguages',
  TextToSpeechValues = 'textToSpeechValues',
  CurrentUser = 'mlt_currentUser',
  StatisticsDisplayMode = 'statisticsDisplayMode',
  StatisticsSelectedMonth = 'statisticsSelectedMonth',
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly storage = inject(Storage);
  private readonly googleTranslateService = inject(TranslationGoogleTranslateService);
  private readonly utilsService = inject(UtilsService);

  /**
   * Emits the firestore UID of the user (e.g. anonymous user).
   */
  firestoreUidSubject = new BehaviorSubject<string | null>(null);
  /**
   * Observable for the firestore UID.
   */
  firestoreUid$ = this.firestoreUidSubject.asObservable();
  /**
  /**
   * Emits the currently selected base language code (e.g. 'en', 'de').
   */
  selectedLanguageSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage()
  );
  /**
   * Observable for the currently selected base language code.
   */
  selectedLanguage$ = this.selectedLanguageSubject.asObservable();
  /**
   * Emits the name of the currently selected base language (e.g. 'English', 'Deutsch').
   */
  selectedLanguageNameSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage()
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
    this.getDefaultTextToSpeechValues()
  );
  /**
   * Observable for the current text-to-speech values.
   */
  textToSpeechValues$ = this.textToSpeechValuesSubject.asObservable();

  /**
   * Emits the current display mode for statistics (User or Programmer).
   */
  statisticsDisplayModeSubject = new BehaviorSubject<DisplayMode>(
    DisplayMode.User
  );
  /**
   * Observable for the current display mode for statistics.
   */
  statisticsDisplayMode$ = this.statisticsDisplayModeSubject.asObservable();

  /**
   * Emits the currently selected month for statistics filtering.
   */
  statisticsSelectedMonthSubject = new BehaviorSubject<string>('');
  /**
   * Observable for the currently selected month for statistics filtering.
   */
  statisticsSelectedMonth$ = this.statisticsSelectedMonthSubject.asObservable();

  private async initStorage() {
    await this.storage.create();
  }

  /**
   * Initializes the storage and loads selected language, target languages, and text-to-speech values.
   * @param translate The TranslateService instance
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
      await this.loadFirestoreUid();
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

  /**
   * Loads the selected language from storage, or sets and returns the default language if not found.
   * Updates the selectedLanguageSubject accordingly.
   * @returns The selected or default language code
   */
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

  /**
   * Sets the display name for the selected or default language.
   * @param langCode The language code
   */
  async setSelectedOrDefaultLanguageName(langCode: string): Promise<void> {
    if (!langCode) {
      throw new Error('Language code must be provided');
    }
    const name = await firstValueFrom(
      this.googleTranslateService.getBaseLanguageName(langCode)
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
        JSON.stringify(languages)
      );
      this.targetLanguagesSubject.next(languages);
      this.setTargetLanguageNames(
        this.selectedLanguageSubject.value,
        languages
      );
    } catch (error) {
      console.error('Error saving target languages:', error);
    }
  }

  /**
   * Loads the array of target languages from storage, or sets to empty if not found.
   */
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
        JSON.stringify(values)
      );
      this.textToSpeechValuesSubject.next(values);
    } catch (error) {
      console.error('Error saving text to speech values:', error);
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

  /**
   * Loads the firestore UID from storage and updates the observable.
   * @returns The stored firestore UID or null if not found
   */
  async loadFirestoreUid(): Promise<string | null> {
    const firestoreUid = await this.storage.get(LocalStorage.CurrentUser);
    if (firestoreUid) {
      this.firestoreUidSubject.next(firestoreUid);
      return firestoreUid;
    }
    return null;
  }

  /**
   * Saves the firestore UID to storage.
   * @param uid The firestore UID to save
   */
  async saveFirestoreUid(uid: string): Promise<void> {
    try {
      await this.storage.set(LocalStorage.CurrentUser, uid);
    } catch (error) {
      console.error('Error saving current user UID:', error);
    }
  }

  async getStatisticsDisplayMode(): Promise<DisplayMode> {
    let displayMode: DisplayMode;
    const rawValue = await this.storage.get(LocalStorage.StatisticsDisplayMode);

    if (rawValue && Object.values(DisplayMode).includes(rawValue)) {
      displayMode = rawValue as DisplayMode;
    } else {
      displayMode = DisplayMode.User;
    }

    this.statisticsDisplayModeSubject.next(displayMode);
    return displayMode;
  }

  /**
   * Saves the selected display mode for statistics in local storage.
   * @param displayMode User or Programmer display mode to save in local storage
   */
  async saveStatisticsDisplayMode(displayMode: DisplayMode): Promise<void> {
    try {
      await this.storage.set(LocalStorage.StatisticsDisplayMode, displayMode);
      this.statisticsDisplayModeSubject.next(displayMode);
    } catch (error) {
      console.error('Error saving statistics display mode:', error);
    }
  }

  /**
   * Resolves the effective month filter used by the statistics view.
   *
   * Behavior:
   * - If no value exists in storage, the current month is used and persisted.
   * - If a valid month string (YYYY-MM) exists:
   *   - On non-programmer devices, past months are automatically replaced with the current month and persisted.
   *   - On programmer devices, the stored month is kept (including past months).
   * - If the stored value is not in YYYY-MM format, the method falls back to the provided
   *   all-months format and persists it via saveStatisticsSelectedMonth.
   *
   * Notes:
   * - Month comparison is done lexicographically on YYYY-MM values.
   * - Persistence is normalized through saveStatisticsSelectedMonth.
   *
   * @param allMonthsOptionFormat Value to return when the stored month is invalid
   * (for example, select-label value or storage value for all months).
   * @param isProgrammerDevice Whether past month selections are allowed without auto-reset.
   * @returns Resolved month filter value for statistics.
   */
  async getStatisticsSelectedMonth(
    allMonthsOptionFormat: AllMonthsOption,
    isProgrammerDevice = false
  ): Promise<string> {
    let selectedMonth: string;
    const rawValue: string = await this.storage.get(
      LocalStorage.StatisticsSelectedMonth
    );
    const currentMonth = this.utilsService.getCurrentMonth();

    if (rawValue === currentMonth) {
      this.statisticsSelectedMonthSubject.next(currentMonth);
      return currentMonth;
    }

    // no value in storage → set current month
    if (!rawValue) {
      selectedMonth = currentMonth;
      await this.saveStatisticsSelectedMonth(selectedMonth);
      return selectedMonth;
    }

    // value in storage has correct format → check if it is the previous month and update if necessary
    if (rawValue.length === 7) {
      if (rawValue < currentMonth && !isProgrammerDevice) {
        selectedMonth = currentMonth;
        await this.saveStatisticsSelectedMonth(selectedMonth);
      } else {
        selectedMonth = rawValue;
        await this.saveStatisticsSelectedMonth(selectedMonth);
      }

      return selectedMonth;
    }

    // value in storage has wrong format → set to all
    selectedMonth = allMonthsOptionFormat;
    await this.saveStatisticsSelectedMonth(selectedMonth);
    return selectedMonth;
  }

  /**
   * Saves the selected month for statistics in local storage.
   * If selectedMonth has not YYYY-MM format then it is converted into Local storage value for all.
   * @param selectedMonth The month object to save in local storage
   */
  async saveStatisticsSelectedMonth(selectedMonth: string): Promise<void> {
    try {
      const convertedSelectedMonth =
        selectedMonth.length === 7
          ? selectedMonth
          : AllMonthsOption.localStorageValue;
      await this.storage.set(
        LocalStorage.StatisticsSelectedMonth,
        convertedSelectedMonth
      );
      this.statisticsSelectedMonthSubject.next(convertedSelectedMonth);
    } catch (error) {
      console.error('Error saving statistics selected month:', error);
    }
  }
}
