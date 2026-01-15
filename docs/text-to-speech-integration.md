# Text-to-Speech (TTS) Integration for Translated Text

This document explains how to add text-to-speech (TTS) functionality to the Multi Language Translator app, allowing users to listen to translated text directly in the app—on both web and mobile.

## Overview

- Users can click a button next to each translated text to have it read aloud.
- The implementation uses a hybrid approach:
  - On web: the browser's built-in Web Speech API (`speechSynthesis`).
  - On mobile (Capacitor/Cordova): the native plugin `@capacitor-community/text-to-speech`.
- The logic is encapsulated in a reusable Angular service (`TtsService`).

## Implementation Steps

### 1. Add a TTS Button in the Template

Add a button next to each translation in your template:

```html
<ion-row>
  <ion-col size="2"> {{ translation.language }} </ion-col>
  <ion-col size="8"> {{ translation.translatedText }} </ion-col>
  <ion-col size="2">
    <ion-button fill="clear" size="small" (click)="speak(translation.translatedText, translation.language)">
      <ion-icon name="volume-high-outline"></ion-icon>
    </ion-button>
  </ion-col>
</ion-row>
```

### 2. Use the TtsService in Your Component

Inject the service and call its `speak()` method:

```typescript
import { TtsService } from '../services/tts.service';

constructor(private readonly ttsService: TtsService) {}

async speak(text: string, lang: string) {
  try {
    await this.ttsService.speak(text, lang);
  } catch (err) {
    // Show a toast or alert if TTS is not supported
  }
}
```

### 3. TtsService Implementation

The service automatically chooses the best TTS method for the platform:

```typescript
import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";

@Injectable({ providedIn: "root" })
export class TtsService {
  constructor(private platform: Platform) {}

  async speak(text: string, lang: string): Promise<void> {
    if (this.platform.is("capacitor") || this.platform.is("cordova")) {
      // Use Capacitor TTS plugin
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      await TextToSpeech.speak({ text, lang });
    } else if ("speechSynthesis" in globalThis) {
      // Use browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      globalThis.speechSynthesis.speak(utterance);
    } else {
      throw new Error("Text-to-speech is not supported on this platform.");
    }
  }
}
```

### 4. Cost and API Considerations

- **No cost:** Both the browser API and Capacitor plugin are free to use.
- **No API keys or network requests** are required for this approach.
- **Quality and voices** depend on the user's device and browser/platform.
- For higher quality or more language options, paid APIs (e.g., Google Cloud Text-to-Speech, Amazon Polly) are available, but are not necessary for most use cases.

## Notes

- The TTS feature works offline on most devices.
- You may want to map language codes to supported voice codes for best results.
- Always provide a fallback or user message if TTS is not supported on the user's platform.
- On mobile, you must install and sync the Capacitor plugin:
  - `npm install @capacitor-community/text-to-speech`
  - `npx cap sync`

---

For more details, see the implementation in `tab-translation.page.html`, `tab-translation.page.ts`, and `services/tts.service.ts`.
