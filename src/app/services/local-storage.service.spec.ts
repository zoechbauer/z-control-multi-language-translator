import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { of } from 'rxjs';

import { LocalStorageService } from './local-storage.service';
import { TranslationGoogleTranslateService } from './translation-google-translate.service';
import { DisplayMode } from '../shared/enums';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let storageSpy: jasmine.SpyObj<Storage>;
  let translateSpy: jasmine.SpyObj<TranslationGoogleTranslateService>;

  const createTranslateServiceSpy = () =>
    jasmine.createSpyObj('TranslateService', ['get', 'setDefaultLang', 'use']);

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('Storage', [
      'create',
      'get',
      'set',
      'remove',
      'clear',
      'length',
      'keys',
    ]);
    storageSpy.create.and.returnValue(Promise.resolve(storageSpy));
    storageSpy.get.and.returnValue(Promise.resolve(null));
    storageSpy.set.and.returnValue(Promise.resolve());
    storageSpy.remove.and.returnValue(Promise.resolve());
    storageSpy.clear.and.returnValue(Promise.resolve());
    storageSpy.length.and.returnValue(Promise.resolve(0));
    storageSpy.keys.and.returnValue(Promise.resolve([]));

    translateSpy = jasmine.createSpyObj('TranslationGoogleTranslateService', [
      'getBaseLanguageName',
      'getFormattedTargetLanguageNamesForCodes',
    ]);
    translateSpy.getBaseLanguageName.and.returnValue(of('English (en)'));
    translateSpy.getFormattedTargetLanguageNamesForCodes.and.returnValue(
      Promise.resolve('')
    );

    TestBed.configureTestingModule({
      providers: [
        LocalStorageService,
        { provide: Storage, useValue: storageSpy },
        { provide: TranslationGoogleTranslateService, useValue: translateSpy },
      ],
    });
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get selected or default language', () => {
    it('should return default language if no language is saved', async () => {
      const defaultLanguage = service['getMobileDefaultLanguage']();
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe(defaultLanguage);
    });

    it('should save default language if no language is saved', async () => {
      const defaultLanguage = service['getMobileDefaultLanguage']();
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe(defaultLanguage);
      expect(storageSpy.set).toHaveBeenCalledWith('selectedLanguage', language);
    });

    it('should return saved language if it exists', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('fr'));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe('fr');
    });

    it('should set selected language name based on loaded language', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('en'));
      translateSpy.getBaseLanguageName.and.returnValue(of('English (en)'));
      await service.setSelectedOrDefaultLanguageName('en');
      expect(translateSpy.getBaseLanguageName).toHaveBeenCalledWith('en');
      expect(service.selectedLanguageNameSubject.value).toBe('English (en)');
    });

    it('should throw an error if no language is provided', async () => {
      await expectAsync(
        service.setSelectedOrDefaultLanguageName('')
      ).toBeRejectedWithError(Error, 'Language code must be provided');
    });
  });

  describe('save selected language', () => {
    it('should save the selected language', async () => {
      await service.saveSelectedLanguage('nl');
      expect(storageSpy.set).toHaveBeenCalledWith('selectedLanguage', 'nl');
    });

    it('should update the selected language subject', async () => {
      await service.saveSelectedLanguage('nl');
      expect(service.selectedLanguageSubject.value).toBe('nl');
    });

    it('logs an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveSelectedLanguage('nl');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving selected language:',
        error
      );
    });

    it('throws an error if language is not provided', async () => {
      await expectAsync(service.saveSelectedLanguage('')).toBeRejectedWithError(
        Error,
        'Language must be provided'
      );
    });
  });

  describe('save target languages', () => {
    it('should save the target languages', async () => {
      const languages = ['fr', 'nl'];
      await service.saveTargetLanguages(languages);
      expect(storageSpy.set).toHaveBeenCalledWith(
        'targetLanguages',
        JSON.stringify(languages)
      );
    });

    it('should update the target languages subject', async () => {
      const languages = ['fr', 'nl'];
      await service.saveTargetLanguages(languages);
      expect(service.targetLanguagesSubject.value).toEqual(languages);
    });

    it('should update the target languages name with line breaks subject', async () => {
      service.selectedLanguageSubject.next('en');
      translateSpy.getFormattedTargetLanguageNamesForCodes.and.returnValue(
        Promise.resolve('French (fr)<br/>English (en)')
      );

      const languages = ['fr', 'en'];

      await service.saveTargetLanguages(languages);
      await Promise.resolve();

      expect(
        translateSpy.getFormattedTargetLanguageNamesForCodes
      ).toHaveBeenCalledWith('en', languages);

      expect(service.targetLanguagesNameWithLineBreaksSubject.value).toBe(
        'French (fr)<br/>English (en)'
      );
    });

    it('logs an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveTargetLanguages(['fr', 'nl']);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving target languages:',
        error
      );
    });
  });

  describe('load target languages', () => {
    it('should load the target languages', async () => {
      const languages = ['fr', 'nl'];
      storageSpy.get.and.returnValue(
        Promise.resolve(JSON.stringify(languages))
      );
      await service.loadTargetLanguages();
      expect(service.targetLanguagesSubject.value).toEqual(languages);
    });

    it('should save empty array if no target languages are found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(null));
      await service.loadTargetLanguages();
      expect(storageSpy.set).toHaveBeenCalledWith(
        'targetLanguages',
        JSON.stringify([])
      );
    });
  });

  describe('load text to speech values', () => {
    it('should load the text to speech values', async () => {
      const values = { rate: 30, pitch: 60 };
      storageSpy.get.and.returnValue(Promise.resolve(JSON.stringify(values)));
      const loadedValues = await service.loadTextToSpeechValues();
      expect(loadedValues).toEqual(values);
    });

    it('should update the text to speech values subject', async () => {
      const values = { rate: 30, pitch: 60 };
      storageSpy.get.and.returnValue(Promise.resolve(JSON.stringify(values)));
      await service.loadTextToSpeechValues();
      expect(service.textToSpeechValuesSubject.value).toEqual(values);
    });

    it('should return built-in default text to speech values', () => {
      const defaultValues = service.getDefaultTextToSpeechValues();
      expect(defaultValues).toEqual({
        rate: 25,
        pitch: 50,
      });
    });

    it('should load default text to speech values if no values are found', async () => {
      const defaultValues = service.getDefaultTextToSpeechValues();
      const values = await service.loadTextToSpeechValues();
      expect(values).toEqual(defaultValues);
    });

    it('should save text to speech values if no values are found', async () => {
      const defaultValues = service.getDefaultTextToSpeechValues();
      await service.loadTextToSpeechValues();
      expect(service.textToSpeechValuesSubject.value).toEqual(defaultValues);
    });
  });

  describe('save text to speech values', () => {
    it('should save the text to speech values', async () => {
      const values = { rate: 30, pitch: 60 };
      await service.saveTextToSpeechValues(values);
      expect(storageSpy.set).toHaveBeenCalledWith(
        'textToSpeechValues',
        JSON.stringify(values)
      );
    });

    it('should update the text to speech values subject', async () => {
      const values = { rate: 30, pitch: 60 };
      await service.saveTextToSpeechValues(values);
      expect(service.textToSpeechValuesSubject.value).toEqual(values);
    });

    it('logs an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));
      await service.saveTextToSpeechValues({ rate: 30, pitch: 60 });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving text to speech values:',
        error
      );
    });
  });

  describe('load firestore uid', () => {
    it('should load the firestore uid', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('some-uid'));
      const uid = await service.loadFirestoreUid();
      expect(uid).toBe('some-uid');
    });

    it('should set firestore uid subject if uid is found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('some-uid'));
      await service.loadFirestoreUid();
      expect(service.firestoreUidSubject.value).toBe('some-uid');
    });

    it('should return null if no firestore uid is found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const uid = await service.loadFirestoreUid();
      expect(uid).toBeNull();
    });
  });

  describe('save firestore uid', () => {
    it('should save the firestore uid', async () => {
      await service.saveFirestoreUid('some-uid');
      expect(storageSpy.set).toHaveBeenCalledWith(
        'mlt_currentUser',
        'some-uid'
      );
    });

    it('should log an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));
      await service.saveFirestoreUid('some-uid');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving current user UID:',
        error
      );
    });
  });

  describe('get statistics display mode', () => {
    it('should get the statistics display mode', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(DisplayMode.Programmer));
      const displayMode = await service.getStatisticsDisplayMode();
      expect(displayMode).toBe(DisplayMode.Programmer);
    });

    it('should return default display mode if no display mode is found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const displayMode = await service.getStatisticsDisplayMode();
      expect(displayMode).toBe(DisplayMode.User);
    });

    it('should set statistics display mode subject based on loaded display mode', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(DisplayMode.User));
      await service.getStatisticsDisplayMode();
      expect(service.statisticsDisplayModeSubject.value).toBe(DisplayMode.User);
    });
  });

  describe('save statistics display mode', () => {
    it('should save the statistics display mode', async () => {
      await service.saveStatisticsDisplayMode(DisplayMode.Programmer);
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsDisplayMode',
        DisplayMode.Programmer
      );
    });

    it('should log an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveStatisticsDisplayMode(DisplayMode.User);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving statistics display mode:',
        error
      );
    });
  });

  describe('get statistics selected month', () => {
    it('should get the statistics selected month', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-03'));
      const selectedMonth = await service.getStatisticsSelectedMonth();
      expect(selectedMonth).toBe('2026-03');
    });

    it('should return empty string if no selected month is found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const selectedMonth = await service.getStatisticsSelectedMonth();
      expect(selectedMonth).toBe('');
    });

    it('should set statistics selected month subject based on loaded selected month', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-03'));
      await service.getStatisticsSelectedMonth();
      expect(service.statisticsSelectedMonthSubject.value).toBe('2026-03');
    });
  });

  describe('save statistics selected month', () => {
    it('should save the statistics selected month', async () => {
      await service.saveStatisticsSelectedMonth('2026-03');
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsSelectedMonth',
        '2026-03'
      );
    });

    it('should log an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveStatisticsSelectedMonth('2026-03');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving statistics selected month:',
        error
      );
    });
  });

  describe('initialize services', () => {
    it('should initialize the storage', async () => {
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);
      expect(storageSpy.create).toHaveBeenCalled();
    });

    it('should load selected or default language', async () => {
      const loadSelectedOrDefaultLanguageSpy = spyOn(
        service,
        'loadSelectedOrDefaultLanguage'
      ).and.returnValue(Promise.resolve('en'));
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);
      expect(loadSelectedOrDefaultLanguageSpy).toHaveBeenCalled();
    });

    it('should set default language in translate service when initialization fails', async () => {
      storageSpy.create.and.returnValue(
        Promise.reject(new Error('init failed'))
      );

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(translateServiceSpy.setDefaultLang).toHaveBeenCalledWith('en');
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en');
    });

    it('should pass loaded language to setSelectedOrDefaultLanguageName', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('fr')
      );
      const setSelectedOrDefaultLanguageNameSpy = spyOn(
        service,
        'setSelectedOrDefaultLanguageName'
      ).and.returnValue(Promise.resolve());

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(setSelectedOrDefaultLanguageNameSpy).toHaveBeenCalledWith('fr');
    });

    it('should run remaining initialization steps on success', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en')
      );
      spyOn(service, 'setSelectedOrDefaultLanguageName').and.returnValue(
        Promise.resolve()
      );
      const loadTargetLanguagesSpy = spyOn(
        service,
        'loadTargetLanguages'
      ).and.returnValue(Promise.resolve());
      const loadTextToSpeechValuesSpy = spyOn(
        service,
        'loadTextToSpeechValues'
      ).and.returnValue(Promise.resolve({ rate: 25, pitch: 50 }));
      const loadFirestoreUidSpy = spyOn(
        service,
        'loadFirestoreUid'
      ).and.returnValue(Promise.resolve(null));

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(loadTargetLanguagesSpy).toHaveBeenCalled();
      expect(loadTextToSpeechValuesSpy).toHaveBeenCalled();
      expect(loadFirestoreUidSpy).toHaveBeenCalled();
    });

    it('should not call fallback translate methods when initialization succeeds', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en')
      );
      spyOn(service, 'setSelectedOrDefaultLanguageName').and.returnValue(
        Promise.resolve()
      );
      spyOn(service, 'loadTargetLanguages').and.returnValue(Promise.resolve());
      spyOn(service, 'loadTextToSpeechValues').and.returnValue(
        Promise.resolve({ rate: 25, pitch: 50 })
      );
      spyOn(service, 'loadFirestoreUid').and.returnValue(Promise.resolve(null));

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(translateServiceSpy.setDefaultLang).not.toHaveBeenCalled();
      expect(translateServiceSpy.use).not.toHaveBeenCalled();
    });

    it('should log and fallback if a later initialization step fails', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en')
      );
      spyOn(service, 'setSelectedOrDefaultLanguageName').and.returnValue(
        Promise.resolve()
      );
      spyOn(service, 'loadTargetLanguages').and.returnValue(
        Promise.reject(new Error('target load failed'))
      );
      const consoleErrorSpy = spyOn(console, 'error');

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'App initialization failed:',
        new Error('target load failed')
      );
      expect(translateServiceSpy.setDefaultLang).toHaveBeenCalledWith('en');
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en');
    });
  });
});
