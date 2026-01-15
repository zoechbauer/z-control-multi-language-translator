import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

import { AppConstants } from '../shared/app.constants';
import { LocalStorageService } from './local-storage.service';

// Only import the plugin type, not the actual plugin, to avoid errors on web
declare const window: any;

@Injectable({ providedIn: 'root' })
export class TextSpeechService {
  set ttsRate(rate: number) {
    this._ttsRate = this.convertValueToPluginFormat(rate);
  }

  set ttsPitch(pitch: number) {
    this._ttsPitch = this.convertValueToPluginFormat(pitch);
  }

  private readonly isNative: boolean;
  private _ttsRate: number = 1.0;
  private _ttsPitch: number = 1.0;

  constructor(
    private readonly platform: Platform,
    private readonly localStorageService: LocalStorageService
  ) {
    this.isNative =
      this.platform.is('capacitor') || this.platform.is('cordova');
      this.localStorageService.textToSpeechValues$.subscribe((ttsValues) => {
        this.ttsRate = ttsValues.rate;
        this.ttsPitch = ttsValues.pitch;
      });
  }

  async speak(text: string, lang: string): Promise<void> {
    if (this.isNative && window?.Capacitor?.isNativePlatform) {
      // Use Capacitor TTS plugin if available
      try {
        const { TextToSpeech } = await import(
          '@capacitor-community/text-to-speech'
        );
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

  // Convert 0-100 range to plugin format (TTS_MIN to TTS_MAX), 50 is normal speed/pitch
  private convertValueToPluginFormat(value: number): number {
    const TTS_MIN = AppConstants.textToSpeechMinValue;
    const TTS_MAX = AppConstants.textToSpeechMaxValue;
    const clamped = Math.max(0, Math.min(100, value));
    const mid = 50;
    const range = TTS_MAX - TTS_MIN;

    if (clamped <= mid) {
      // Map 0-50 to TTS_MIN to 1.0
      return TTS_MIN + (clamped / mid) * (1.0 - TTS_MIN);
    } else {
      // Map 50-100 to 1.0 to TTS_MAX
      return 1.0 + ((clamped - mid) / mid) * (TTS_MAX - 1.0);
    }
  }
}
