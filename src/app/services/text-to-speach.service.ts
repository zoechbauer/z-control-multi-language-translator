import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

import { AppConstants } from '../shared/app.constants';
import { LocalStorageService } from './local-storage.service';

// Only import the plugin type, not the actual plugin, to avoid errors on web
declare const window: any;

@Injectable({ providedIn: 'root' })
export class TextSpeechService {
  /**
   * Map of supported TTS languages for the current platform and selected languages.
   * Key: language code, Value: true if supported, false otherwise.
   */
  get ttsSupportedLanguagesMap(): { [lang: string]: boolean } {
    console.log('Getting TTS supported languages map:', this._ttsSupportedLanguagesMap);
    return this._ttsSupportedLanguagesMap;
  }

  /**
   * Sets the supported TTS languages map for the current platform and selected languages.
   * @param map Object mapping language codes to support status
   */
  set ttsSupportedLanguagesMap(map: { [lang: string]: boolean }) {
    console.log('Setting TTS supported languages map:', map);
    this._ttsSupportedLanguagesMap = map;
  }

  /**
   * Sets the TTS rate (speed) for speech synthesis.
   * Accepts a value in the range 0-100, which is converted to plugin format.
   */
  set ttsRate(rate: number) {
    this._ttsRate = this.convertValueToPluginFormat(rate);
  }

  /**
   * Sets the TTS pitch for speech synthesis.
   * Accepts a value in the range 0-100, which is converted to plugin format.
   */
  set ttsPitch(pitch: number) {
    this._ttsPitch = this.convertValueToPluginFormat(pitch);
  }

  private readonly isNative: boolean;
  private _ttsRate: number = 1.0;
  private _ttsPitch: number = 1.0;
  private _ttsSupportedLanguagesMap: { [lang: string]: boolean } = {};
  private ttsSupportedLanguagesforMobiles: string[] = [];
  private ttsSupportedLanguagesforMobilesCache: { [lang: string]: boolean } =
    {};

  constructor(
    private readonly platform: Platform,
    private readonly localStorageService: LocalStorageService,
  ) {
    this.isNative =
      this.platform.is('capacitor') || this.platform.is('cordova');
    this.localStorageService.textToSpeechValues$.subscribe((ttsValues) => {
      this.ttsRate = ttsValues.rate;
      this.ttsPitch = ttsValues.pitch;
    });
  }

  /**
   * Initializes the TTS service by loading supported languages and subscribing to language changes.
   */
  async init(): Promise<void> {
    await this.loadTtsSupportedLanguagesForMobiles();
    this.localStorageService.targetLanguages$.subscribe((langs) => {
      this.updateTtsSupportedLanguagesMap(this.isNative, langs || []);
    });
  }

  private async loadTtsSupportedLanguagesForMobiles(): Promise<void> {
    if (this.isNative && window?.Capacitor?.isNativePlatform) {
      const result = await TextToSpeech.getSupportedLanguages();
      const languages = result.languages.sort((a, b) => a.localeCompare(b));
      this.ttsSupportedLanguagesforMobiles = languages;
    }
  }

  /**
   * Speaks the given text in the specified language using either native or browser TTS.
   * @param text The text to speak
   * @param lang The language code
   * @throws Error if TTS is not available or fails
   */
  async speak(text: string, lang: string): Promise<void> {
    if (this.isNative && window?.Capacitor?.isNativePlatform) {
      // Use Capacitor TTS plugin if available
      try {
        await TextToSpeech.speak({
          text,
          lang,
          rate: this._ttsRate,
          pitch: this._ttsPitch,
          volume: 1.0,
          category: 'ambient',
        });
      } catch (err) {
        throw new Error('TTS plugin not available or failed: ' + err);
      }
    } else if ('speechSynthesis' in globalThis) {
      // Use browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      globalThis.speechSynthesis.speak(utterance);
    } else {
      throw new Error('Text-to-speech is not supported on this platform.');
    }
  }

  /**
   * Checks if the given language is supported for mobile TTS (native plugin).
   * Uses a cache for performance.
   * @param lang The language code
   * @returns True if supported, false otherwise
   */
  isMobileTtsLanguageSupported(lang: string): boolean {
    // Check cache first
    if (this.ttsSupportedLanguagesforMobilesCache[lang] !== undefined) {
      return this.ttsSupportedLanguagesforMobilesCache[lang];
    }
    // Perform check and store in cache
    const isSupported =
      this.ttsSupportedLanguagesforMobiles.includes(lang) ||
      this.ttsSupportedLanguagesforMobiles.some((l) =>
        l.startsWith(lang + '-'),
      );
    this.ttsSupportedLanguagesforMobilesCache[lang] = isSupported;
    return isSupported;
  }

  /**
   * Updates the supported TTS languages map for the current platform and selected languages.
   * @param isNative True if running on native platform
   * @param selectedLanguages Array of selected language codes
   */
  updateTtsSupportedLanguagesMap(
    isNative: boolean,
    selectedLanguages: string[],
  ) {
    console.log('Updating TTS supported languages map for native and selected languages:', isNative, selectedLanguages);
    const map: { [lang: string]: boolean } = {};
    if (isNative) {
      for (const lang of selectedLanguages) {
        map[lang] = this.isMobileTtsLanguageSupported(lang);
      }
    } else {
      // On web, all languages are supported
      for (const lang of selectedLanguages) {
        map[lang] = true;
      }
    }
    this.ttsSupportedLanguagesMap = map;
    console.log('Updated TTS supported languages map:', this.ttsSupportedLanguagesMap);
  }

  /**
   * Converts a value in the range 0-100 to the plugin format for TTS rate/pitch.
   * - 0-50 maps to TTS_MIN to 1.0 (normal speed/pitch)
   * - 51-100 maps to 1.0 to TTS_MAX
   *
   * The input value is clamped to [0, 100] to prevent out-of-range values from producing unexpected results.
   * This ensures the returned value is always valid for the plugin, even if the caller passes a value outside the expected range.
   *
   * @param value The input value (expected 0-100, but will be clamped if outside)
   * @returns The converted value for the TTS plugin
   */
  private convertValueToPluginFormat(value: number): number {
    const TTS_MIN = AppConstants.textToSpeechMinValue;
    const TTS_MAX = AppConstants.textToSpeechMaxValue;
    const clamped = Math.max(0, Math.min(100, value)); // Clamp to [0, 100] for safety
    const mid = 50;
    const range = TTS_MAX - TTS_MIN;

    if (clamped <= mid) {
      // Map 0-50 to TTS_MIN to 1.0
      return TTS_MIN + (clamped / mid) * (1.0 - TTS_MIN);
    } else {
      // Map 51-100 to 1.0 to TTS_MAX
      return 1.0 + ((clamped - mid) / mid) * (TTS_MAX - 1.0);
    }
  }

  // note default values are managed in LocalStorageService, otherwise risk of dependency cycle
  // localStorageService.getDefaultTextToSpeechValues();
}
