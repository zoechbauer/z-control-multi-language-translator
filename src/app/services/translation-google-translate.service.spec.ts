import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Functions } from '@angular/fire/functions';
import { firstValueFrom, of } from 'rxjs';

import {
  GoogleLanguage,
  TranslationGoogleTranslateService,
} from './translation-google-translate.service';

describe('TranslationGoogleTranslateService', () => {
  let service: TranslationGoogleTranslateService;
  let mockedLanguages: GoogleLanguage[];

  beforeEach(() => {
    mockedLanguages = [
      { language: 'en', name: 'English (en)' },
      { language: 'de', name: 'Deutsch (de)' },
      { language: 'fr', name: 'French (fr)' },
    ];

    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
      'get',
      'use',
      'setDefaultLang',
    ]);
    translateServiceSpy.instant.and.returnValue('SIMULATED_TRANSLATION');

    const functionsStub = {} as Functions;

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        TranslationGoogleTranslateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Functions, useValue: functionsStub },
      ],
    });
    service = TestBed.inject(TranslationGoogleTranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatLanguageNamesWithLineBreaks', () => {
    it('should format language names with <br/> for selected language codes', () => {
      const supportedLanguages: GoogleLanguage[] = [
        { language: 'en', name: 'English (en)' },
        { language: 'de', name: 'Deutsch (de)' },
        { language: 'fr', name: 'French (fr)' },
      ];

      const result = service.formatLanguageNamesWithLineBreaks(
        supportedLanguages,
        ['de', 'fr']
      );

      expect(result).toBe('Deutsch (de)<br/>French (fr)');
    });

    it('should throw if formatLanguageNamesWithLineBreaks inputs are invalid', () => {
      expect(() =>
        service.formatLanguageNamesWithLineBreaks(
          undefined as unknown as GoogleLanguage[],
          ['en']
        )
      ).toThrowError('supportedLanguages and targetLangCodes must be provided');

      expect(() =>
        service.formatLanguageNamesWithLineBreaks(
          [],
          undefined as unknown as string[]
        )
      ).toThrowError('supportedLanguages and targetLangCodes must be provided');
    });
  });

  describe('getFormattedTargetLanguageNamesForCodes', () => {
    it('should return formatted language names from cache for given codes', async () => {
      (service as any).supportedLanguagesCache = { en: [...mockedLanguages] };

      const getSupportedSpy = spyOn(
        service,
        'getSupportedLanguagesWithLangCodeInName'
      ).and.callFake((baseLang: string) => {
        (service as any).supportedLanguagesCache[baseLang] = mockedLanguages;
        return of(mockedLanguages);
      });

      const result = await service.getFormattedTargetLanguageNamesForCodes(
        'en',
        ['de', 'fr']
      );

      expect(getSupportedSpy).not.toHaveBeenCalledWith('en');
      expect(result).toBe('Deutsch (de)<br/>French (fr)');
    });

    it('should throw if base language is not provided in getFormattedTargetLanguageNamesForCodes', async () => {
      await expectAsync(
        service.getFormattedTargetLanguageNamesForCodes('', ['de'])
      ).toBeRejectedWithError('baseLang must be provided');
    });

    it('fetches languages when cache object has no baseLang entry', async () => {
      (service as any).supportedLanguagesCache = {};

      const getSupportedSpy = spyOn(
        service,
        'getSupportedLanguagesWithLangCodeInName'
      ).and.callFake((baseLang: string) => {
        (service as any).supportedLanguagesCache[baseLang] = mockedLanguages;
        return of(mockedLanguages);
      });

      const result = await service.getFormattedTargetLanguageNamesForCodes(
        'en',
        ['de', 'fr']
      );

      expect(getSupportedSpy).toHaveBeenCalledOnceWith('en');
      expect(result).toBe('Deutsch (de)<br/>French (fr)');
    });

    it('fetches languages when baseLang cache entry exists but is empty', async () => {
      (service as any).supportedLanguagesCache = { en: [] };

      const getSupportedSpy = spyOn(
        service,
        'getSupportedLanguagesWithLangCodeInName'
      ).and.callFake((baseLang: string) => {
        (service as any).supportedLanguagesCache[baseLang] = mockedLanguages;
        return of(mockedLanguages);
      });

      const result = await service.getFormattedTargetLanguageNamesForCodes(
        'en',
        ['de', 'fr']
      );

      expect(getSupportedSpy).toHaveBeenCalledOnceWith('en');
      expect(result).toBe('Deutsch (de)<br/>French (fr)');
    });
  });

  describe('simulateTranslateText', () => {
    it('should simulate translation using TranslateService.instant', async () => {
      const translateServiceSpy = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;
      translateServiceSpy.instant.and.returnValue('Hallo Welt');

      const result = await firstValueFrom(
        service.simulateTranslateText('Hello world', 'en', 'de')
      );

      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'TRANSLATE.CARD_RESULTS.SIMULATION.OUTPUT'
      );
      expect(result).toEqual({ de: 'Hallo Welt' });
    });

    it('should handle errors in simulateTranslateText', () => {
      const translateServiceSpy = TestBed.inject(
        TranslateService
      ) as jasmine.SpyObj<TranslateService>;
      translateServiceSpy.instant.and.throwError('Translation error');

      expect(() =>
        service.simulateTranslateText('Hello world', 'en', 'de')
      ).toThrowError('Translation error');
    });

    it('should throw error if language code is missing in simulateTranslateText', () => {
      expect(() =>
        service.simulateTranslateText('Hello world', 'en', '')
      ).toThrowError('Source and target languages must be provided');

      expect(() =>
        service.simulateTranslateText('Hello world', '', 'de')
      ).toThrowError('Source and target languages must be provided');

      expect(() =>
        service.simulateTranslateText('Hello world', '', '')
      ).toThrowError('Source and target languages must be provided');
    });
  });

  describe('getSupportedLanguagesWithLangCodeInName', () => {
    const requestMatcher = (targetLang: string) => (request: any) =>
      request.url.includes(
        'translation.googleapis.com/language/translate/v2/languages'
      ) && request.url.includes(`target=${targetLang}`);

    const mockResponse = {
      data: {
        languages: [
          { language: 'en', name: 'English' },
          { language: 'de', name: 'Deutsch' },
          { language: 'fr', name: 'French' },
        ],
      },
    };

    const expectedFormatted = [
      { language: 'de', name: 'Deutsch (de)' },
      { language: 'en', name: 'English (en)' },
      { language: 'fr', name: 'French (fr)' },
    ];

    it('should fetch once and then return cached supported languages', async () => {
      const httpTestingController = TestBed.inject(HttpTestingController);

      // First call -> HTTP request expected
      const firstPromise = firstValueFrom(
        service.getSupportedLanguagesWithLangCodeInName('en')
      );

      const req = httpTestingController.expectOne(requestMatcher('en'));
      req.flush(mockResponse);

      const firstResult = await firstPromise;
      expect(firstResult).toEqual(expectedFormatted);

      // Second call -> must come from cache, no new HTTP request
      const secondResult = await firstValueFrom(
        service.getSupportedLanguagesWithLangCodeInName('en')
      );

      expect(secondResult).toEqual(expectedFormatted);
      expect(httpTestingController.match(requestMatcher('en')).length).toBe(0);

      httpTestingController.verify();
    });

    it('should keep cache separated by target language', async () => {
      const httpTestingController = TestBed.inject(HttpTestingController);

      const enPromise = firstValueFrom(
        service.getSupportedLanguagesWithLangCodeInName('en')
      );
      httpTestingController.expectOne(requestMatcher('en')).flush(mockResponse);
      await enPromise;

      const dePromise = firstValueFrom(
        service.getSupportedLanguagesWithLangCodeInName('de')
      );
      httpTestingController.expectOne(requestMatcher('de')).flush(mockResponse);
      await dePromise;

      httpTestingController.verify();
    });

    it('should handle error when fetching supported languages', async () => {
      const httpTestingController = TestBed.inject(HttpTestingController);

      const result$ = service.getSupportedLanguagesWithLangCodeInName('en');
      const resultPromise = firstValueFrom(result$);

      const req = httpTestingController.expectOne(
        (request) =>
          request.url.includes(
            'translation.googleapis.com/language/translate/v2/languages'
          ) && request.url.includes('target=en')
      );

      req.flush('Error', { status: 500, statusText: 'Server Error' });
      await expectAsync(resultPromise).toBeRejected();

      httpTestingController.verify();
    });

    it('should throw error if target language is not provided in getSupportedLanguagesWithLangCodeInName', () => {
      expect(() =>
        service.getSupportedLanguagesWithLangCodeInName('')
      ).toThrowError('targetLang must be provided');
    });
  });

  describe('getBaseLanguageName', () => {
    it('should return the name of the base language', async () => {
      const getSupportedSpy = spyOn(
        service,
        'getSupportedLanguagesWithLangCodeInName'
      ).and.callFake((baseLang: string) => {
        (service as any).supportedLanguagesCache[baseLang] = mockedLanguages;
        return of(mockedLanguages);
      });

      const result = await firstValueFrom(service.getBaseLanguageName('de'));

      expect(getSupportedSpy).toHaveBeenCalledOnceWith('de');
      expect(result).toBe('Deutsch (de)');
    });

    it('should throw error if base language is not provided in getBaseLanguageName', () => {
      expect(() => service.getBaseLanguageName('')).toThrowError(
        'baseLang must be provided'
      );
    });
  });

  describe('secureTranslateCloudFunction', () => {
    it('should call secureTranslate cloud function and return translations', async () => {
      const callableSpy = jasmine.createSpy('callable').and.resolveTo({
        data: { translations: { de: 'Hallo', fr: 'Bonjour' } },
      });

      const createCallableSpy = spyOn<any>(
        service,
        'createSecureTranslateCallable'
      ).and.returnValue(callableSpy);

      const result = await service.secureTranslateCloudFunction('Hello', 'en', [
        'de',
        'fr',
      ]);

      expect(createCallableSpy).toHaveBeenCalled();
      expect(callableSpy).toHaveBeenCalledWith({
        text: 'Hello',
        baseLang: 'en',
        selectedLanguages: ['de', 'fr'],
      });
      expect(result).toEqual({ de: 'Hallo', fr: 'Bonjour' });
    });

    it('should return undefined when cloud function response has no translations', async () => {
      const callableSpy = jasmine
        .createSpy('callable')
        .and.resolveTo({ data: {} });

      spyOn<any>(service, 'createSecureTranslateCallable').and.returnValue(
        callableSpy
      );

      const result = await service.secureTranslateCloudFunction('Hello', 'en', [
        'de',
      ]);

      expect(result).toBeUndefined();
    });

    it('should log and rethrow when cloud function fails', async () => {
      const cloudError = new Error('Cloud Function failed');
      const callableSpy = jasmine
        .createSpy('callable')
        .and.rejectWith(cloudError);

      const consoleErrorSpy = spyOn(console, 'error');

      spyOn<any>(service, 'createSecureTranslateCallable').and.returnValue(
        callableSpy
      );

      await expectAsync(
        service.secureTranslateCloudFunction('Hello', 'en', ['de'])
      ).toBeRejectedWith(cloudError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error calling secureTranslate Cloud Function:',
        cloudError
      );
    });
  });

  describe('getTranslations', () => {
    describe('getTranslations', () => {
      it('should call translateFunction for each selected language and return sorted translations', async () => {
        const mockTranslateFunction = jasmine
          .createSpy('translateFunction')
          .and.callFake((text: string, _baseLang: string, targetLang: string) =>
            of({ [targetLang]: `${text}-${targetLang}` })
          );

        const result = await firstValueFrom(
          service.getTranslations(mockTranslateFunction, 'Hello', 'en', [
            'fr',
            'de',
          ])
        );

        expect(mockTranslateFunction).toHaveBeenCalledTimes(2);
        expect(mockTranslateFunction).toHaveBeenCalledWith('Hello', 'en', 'fr');
        expect(mockTranslateFunction).toHaveBeenCalledWith('Hello', 'en', 'de');

        expect(result).toEqual([
          { language: 'de', translatedText: 'Hello-de' },
          { language: 'fr', translatedText: 'Hello-fr' },
        ]);
      });
    });
  });

  describe('secureTranslateCloudFunction', () => {
    it('should call the secureTranslate cloud function and return translations', async () => {
      const callableSpy = jasmine.createSpy('callable').and.resolveTo({
        data: { translations: { de: 'Hallo', fr: 'Bonjour' } },
      });
      spyOn<any>(service, 'createSecureTranslateCallable').and.returnValue(
        callableSpy
      );
      const result = await service.secureTranslateCloudFunction('Hello', 'en', [
        'de',
        'fr',
      ]);
      expect(callableSpy).toHaveBeenCalledWith({
        text: 'Hello',
        baseLang: 'en',
        selectedLanguages: ['de', 'fr'],
      });
      expect(result).toEqual({ de: 'Hallo', fr: 'Bonjour' });
    });

    it('should return undefined if cloud function response has no translations', async () => {
      const callableSpy = jasmine.createSpy('callable').and.resolveTo({
        data: {},
      });
      spyOn<any>(service, 'createSecureTranslateCallable').and.returnValue(
        callableSpy
      );
      const result = await service.secureTranslateCloudFunction('Hello', 'en', [
        'de',
        'fr',
      ]);
      expect(result).toBeUndefined();
    });
  });

  describe('translateText', () => {
    it('should call the translation API and return translations', async () => {
      const httpTestingController = TestBed.inject(HttpTestingController);

      const resultPromise = firstValueFrom(
        service.translateText('Hello', 'en', 'de')
      );

      const req = httpTestingController.expectOne(
        (request) =>
          request.method === 'POST' &&
          request.url.includes(
            'https://translation.googleapis.com/language/translate/v2'
          ) &&
          request.url.includes('key=')
      );

      expect(req.request.body).toEqual({
        q: 'Hello',
        source: 'en',
        target: 'de',
        format: 'text',
      });

      req.flush({ data: { translations: [{ translatedText: 'Hallo' }] } });

      const result = await resultPromise;
      expect(result).toEqual({ de: 'Hallo' });

      httpTestingController.verify();
    });

    it('should throw when source or target is missing', () => {
      expect(() => service.translateText('Hello', '', 'de')).toThrowError(
        'Source and target languages must be provided'
      );
      expect(() => service.translateText('Hello', 'en', '')).toThrowError(
        'Source and target languages must be provided'
      );
    });
  });
});
