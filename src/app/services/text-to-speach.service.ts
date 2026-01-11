import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

// Only import the plugin type, not the actual plugin, to avoid errors on web
declare const window: any;

@Injectable({ providedIn: 'root' })
export class TextSpeechService {
  private readonly isNative: boolean;

  constructor(private readonly platform: Platform) {
    this.isNative =
      this.platform.is('capacitor') || this.platform.is('cordova');
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
          rate: 1.0,
          pitch: 1.0,
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
}
