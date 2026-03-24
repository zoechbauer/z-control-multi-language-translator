import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { TextSpeechService } from './text-to-speech.service';
import { LocalStorageService } from './local-storage.service';

describe('TextSpeechService', () => {
  let service: TextSpeechService;
  let textToSpeechValues$: BehaviorSubject<{ rate: number; pitch: number }>;
  let targetLanguages$: BehaviorSubject<string[]>;

  beforeEach(() => {
    textToSpeechValues$ = new BehaviorSubject({ rate: 50, pitch: 50 });
    targetLanguages$ = new BehaviorSubject<string[]>([]);

    const localStorageServiceMock = {
      textToSpeechValues$,
      targetLanguages$,
    };

    const platformMock = {
      is: (platformName: string) => {
        return platformName === 'capacitor' || platformName === 'cordova';
      },
    };

    TestBed.configureTestingModule({
      providers: [
        TextSpeechService,
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: Platform, useValue: platformMock },
      ],
    });

    service = TestBed.inject(TextSpeechService);
  });

  afterEach(() => {
    delete (globalThis as any).Capacitor;
  });

  it('should create an instance', () => {
    expect(service).toBeTruthy();
  });

  describe('speak', () => {
    it('should use native plugin when native TTS is available', async () => {
      const nativeSpeakSpy = spyOn<any>(
        service,
        'speakWithNativePlugin'
      ).and.returnValue(Promise.resolve());
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(true);

      await service.speak('Hello world', 'en-US');

      expect(nativeSpeakSpy).toHaveBeenCalledWith('Hello world', 'en-US');
    });

    it('should call native plugin with expected parameters', async () => {
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(true);

      const pluginSpeakSpy = jasmine
        .createSpy('speak')
        .and.returnValue(Promise.resolve());

      spyOn<any>(service, 'getNativeTtsPlugin').and.returnValue({
        speak: pluginSpeakSpy,
      });

      await service.speak('Hello world', 'en-US');

      expect(pluginSpeakSpy).toHaveBeenCalledWith({
        text: 'Hello world',
        lang: 'en-US',
        rate: 1,
        pitch: 1,
        volume: 1,
        category: 'ambient',
      });
    });

    it('should wrap native plugin errors', async () => {
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(true);
      spyOn<any>(service, 'speakWithNativePlugin').and.returnValue(
        Promise.reject(new Error('plugin error'))
      );

      await expectAsync(
        service.speak('Hello world', 'en-US')
      ).toBeRejectedWithError(
        'TTS plugin not available or failed: Error: plugin error'
      );
    });

    it('should speak text via browser speechSynthesis with correct parameters', async () => {
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(false);
      spyOn(globalThis.speechSynthesis, 'cancel');
      spyOn(globalThis.speechSynthesis, 'speak').and.callFake(
        (utterance: SpeechSynthesisUtterance) => {
          Promise.resolve().then(() => utterance.onend!(null as any));
        }
      );

      await service.speak('Hello world', 'en-US');

      expect(globalThis.speechSynthesis.speak).toHaveBeenCalled();
      const utterance: SpeechSynthesisUtterance = (
        globalThis.speechSynthesis.speak as jasmine.Spy
      ).calls.mostRecent().args[0];
      expect(utterance.text).toBe('Hello world');
      expect(utterance.lang).toBe('en-US');
    });

    it('should reject when speechSynthesis raises an error', async () => {
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(false);
      spyOn(globalThis.speechSynthesis, 'cancel');
      spyOn(globalThis.speechSynthesis, 'speak').and.callFake(
        (utterance: SpeechSynthesisUtterance) => {
          Promise.resolve().then(() =>
            utterance.onerror!(new Event('error') as any)
          );
        }
      );

      await expectAsync(
        service.speak('Hello world', 'en-US')
      ).toBeRejectedWithError('Browser text-to-speech failed.');
    });

    it('should throw error when TTS is not available on platform', async () => {
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(false);
      const originalSpeechSynthesis = globalThis.speechSynthesis;
      delete (globalThis as any).speechSynthesis;

      await expectAsync(
        service.speak('Hello world', 'en-US')
      ).toBeRejectedWithError(
        'Text-to-speech is not supported on this platform.'
      );

      // Restore
      (globalThis as any).speechSynthesis = originalSpeechSynthesis;
    });
  });

  describe('isMobileTtsLanguageSupported', () => {
    it('should return true for supported language', () => {
      service['ttsSupportedLanguagesforMobiles'] = ['en', 'es'];
      expect(service.isMobileTtsLanguageSupported('en')).toBeTrue();
    });

    it('should return false for unsupported language', () => {
      service['ttsSupportedLanguagesforMobiles'] = ['en', 'es'];
      expect(service.isMobileTtsLanguageSupported('fr')).toBeFalse();
    });
    it('should use cache for subsequent calls', () => {
      (service as any).ttsSupportedLanguagesforMobiles = ['en', 'es'];
      (service as any).ttsSupportedLanguagesforMobilesCache = {};

      // First call -> computes and stores in cache
      expect(service.isMobileTtsLanguageSupported('en')).toBeTrue();
      expect(
        (service as any).ttsSupportedLanguagesforMobilesCache['en']
      ).toBeTrue();

      // Change source list to prove second result comes from cache, not recomputation
      (service as any).ttsSupportedLanguagesforMobiles = [];

      // Second call -> should still be true because cache is used
      expect(service.isMobileTtsLanguageSupported('en')).toBeTrue();
    });
  });

  describe('updateTtsSupportedLanguagesMap', () => {
    it('should set supported languages map correctly for native platform', () => {
      service['ttsSupportedLanguagesforMobiles'] = ['en', 'es'];
      const selectedLanguages = ['en', 'fr'];
      service.updateTtsSupportedLanguagesMap(true, selectedLanguages);
      expect(service.ttsSupportedLanguagesMap).toEqual({
        en: true,
        fr: false,
      });
    });
    it('should set all languages as supported for web platform', () => {
      const selectedLanguages = ['en', 'fr'];
      service.updateTtsSupportedLanguagesMap(false, selectedLanguages);
      expect(service.ttsSupportedLanguagesMap).toEqual({
        en: true,
        fr: true,
      });
    });
  });

  describe('init', () => {
    it('should load supported languages on initialization', async () => {
      const loadSpy = spyOn<any>(
        service,
        'loadTtsSupportedLanguagesForMobiles'
      ).and.returnValue(Promise.resolve());
      await service.init();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should subscribe to target languages on initialization', async () => {
      const updateSpy = spyOn(service, 'updateTtsSupportedLanguagesMap');

      await service.init();

      expect(updateSpy).toHaveBeenCalledWith((service as any).isNative, []);
    });

    it('should update supported languages map when target languages change', async () => {
      const updateSpy = spyOn(service, 'updateTtsSupportedLanguagesMap');
      spyOn<any>(
        service,
        'loadTtsSupportedLanguagesForMobiles'
      ).and.returnValue(Promise.resolve());

      await service.init();
      updateSpy.calls.reset();

      targetLanguages$.next(['en', 'fr']);

      expect(updateSpy).toHaveBeenCalledWith((service as any).isNative, [
        'en',
        'fr',
      ]);
    });
  });

  describe('loadTtsSupportedLanguagesForMobiles', () => {
    it('should load, sort, and store supported languages when native TTS is available', async () => {
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(true);

      const getSupportedLanguagesSpy = jasmine
        .createSpy('getSupportedLanguages')
        .and.returnValue(Promise.resolve({ languages: ['fr', 'en', 'de'] }));

      spyOn<any>(service, 'getNativeTtsPlugin').and.returnValue({
        getSupportedLanguages: getSupportedLanguagesSpy,
      });

      await (service as any).loadTtsSupportedLanguagesForMobiles();

      expect(getSupportedLanguagesSpy).toHaveBeenCalled();
      expect((service as any).ttsSupportedLanguagesforMobiles).toEqual([
        'de',
        'en',
        'fr',
      ]);
    });

    it('should not load supported languages when native TTS is not available', async () => {
      spyOn<any>(service, 'isNativeTtsAvailable').and.returnValue(false);

      const getNativeTtsPluginSpy = spyOn<any>(service, 'getNativeTtsPlugin');

      await (service as any).loadTtsSupportedLanguagesForMobiles();

      expect(getNativeTtsPluginSpy).not.toHaveBeenCalled();
      expect((service as any).ttsSupportedLanguagesforMobiles).toEqual([]);
    });
  });
});
