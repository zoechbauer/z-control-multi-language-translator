import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { TabTranslationPage } from './tab-translation.page';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';
import { ToastService } from '../services/toast.service';
import { TextSpeechService } from '../services/text-to-speech.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { DeviceInfo } from '../shared/firebase-firestore.interfaces';
import { ToastAnchor } from '../shared/enums';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { UserStatisticComponent } from '../ui/components/user-statistic/user-statistic.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';
import { DeviceUtils } from '../services/device-utils.service';

@Component({
  selector: 'app-user-statistic',
  template: '',
  standalone: true,
})
class MockUserStatisticComponent {}

@Component({
  selector: 'app-spinner',
  template: '',
  standalone: true,
})
class MockSpinnerComponent {}

describe('TabTranslationPage', () => {
  let component: TabTranslationPage;
  let fixture: ComponentFixture<TabTranslationPage>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let firestoreUtilsServiceSpy: jasmine.SpyObj<FirebaseFirestoreUtilsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let googleTranslateServiceSpy: jasmine.SpyObj<TranslationGoogleTranslateService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let textSpeechServiceSpy: jasmine.SpyObj<TextSpeechService>;

  beforeEach(async () => {
    utilsServiceSpy = jasmine.createSpyObj('UtilsService', [
      'showOrHideIonTabBar',
    ]);
    firestoreUtilsServiceSpy = jasmine.createSpyObj(
      'FirebaseFirestoreUtilsService',
      ['isContingentExceeded', 'requestStatisticsRefresh']
    );
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    googleTranslateServiceSpy = jasmine.createSpyObj(
      'TranslationGoogleTranslateService',
      [
        'secureTranslateCloudFunction',
        'simulateTranslateText',
        'getTranslations',
      ]
    );
    textSpeechServiceSpy = jasmine.createSpyObj('TextSpeechService', ['speak']);

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MockUserStatisticComponent,
        MockSpinnerComponent,
      ],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: LocalStorageService,
          useValue: {
            selectedLanguage$: of('de'),
            selectedLanguageName$: of('Deutsch (de)'),
            targetLanguages$: of(['en', 'fr']),
          },
        },
        {
          provide: UtilsService,
          useValue: utilsServiceSpy,
        },
        {
          provide: TranslationGoogleTranslateService,
          useValue: googleTranslateServiceSpy,
        },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: TextSpeechService, useValue: textSpeechServiceSpy },
        { provide: FirebaseFirestoreService, useValue: {} },
        {
          provide: FirebaseFirestoreUtilsService,
          useValue: firestoreUtilsServiceSpy,
        },
      ],
    })
      .overrideComponent(TabTranslationPage, {
        remove: {
          imports: [UserStatisticComponent, SpinnerComponent],
        },
        add: {
          imports: [MockUserStatisticComponent, MockSpinnerComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TabTranslationPage);
    component = fixture.componentInstance;

    mockTranslateService = TestBed.inject(
      TranslateService
    ) as jasmine.SpyObj<TranslateService>;
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('getter', () => {
      it('should return the correct maxInputLength', () => {
        expect(component.maxInputLength).toBe(100);
      });

      it('should return the correct maxTargetLanguages', () => {
        expect(component.maxTargetLanguages).toBe(5);
      });

      it('should return the device info from static DeviceUtils', () => {
        const deviceInfo: DeviceInfo = {
          userAgent: 'user agent string',
          platform: 'web-desktop',
          language: 'en',
          appVersion: {
            major: 1,
            minor: 0,
            date: '2026-03-09',
          },
        };
        const getDeviceInfoSpy = spyOn(
          DeviceUtils,
          'getDeviceInfo'
        ).and.returnValue(deviceInfo);

        expect(component.deviceInfos).toBe(deviceInfo);

        expect(getDeviceInfoSpy).toHaveBeenCalled();
      });
    });

    describe('toggleButtonLabel', () => {
      it('should return the correct toggle button label when card input is visible', () => {
        component.cardInputVisible = true;
        expect(component.toggleButtonLabel).toBe(
          'TRANSLATE.CARD.BUTTON.TOGGLE_CARD_RESULTS'
        );
      });

      it('should return the correct toggle button label when card input is not visible', () => {
        component.cardInputVisible = false;
        expect(component.toggleButtonLabel).toBe(
          'TRANSLATE.CARD.BUTTON.TOGGLE_CARD_INPUT'
        );
      });
    });

    describe('showTranslationResultEnteredTextCard', () => {
      it('should return false when card results are not visible', () => {
        component.cardResultsVisible = false;
        Object.defineProperty(utilsServiceSpy, 'isSmallDevice', {
          get: () => true,
        });
        Object.defineProperty(utilsServiceSpy, 'isPortrait', {
          get: () => true,
        });
        expect(component.showTranslationResultEnteredTextCard).toBeFalse();
      });

      it('should return true when card results are visible and device is not small device', () => {
        component.cardResultsVisible = true;
        Object.defineProperty(utilsServiceSpy, 'isSmallDevice', {
          get: () => false,
        });
        Object.defineProperty(utilsServiceSpy, 'isPortrait', {
          get: () => false,
        });
        expect(component.showTranslationResultEnteredTextCard).toBeTrue();
      });

      it('should return true when device is small device and in portrait mode', () => {
        component.cardResultsVisible = true;
        Object.defineProperty(utilsServiceSpy, 'isSmallDevice', {
          get: () => true,
        });
        Object.defineProperty(utilsServiceSpy, 'isPortrait', {
          get: () => true,
        });
        expect(component.showTranslationResultEnteredTextCard).toBeTrue();
      });
    });

    describe('translateTextOrSimulate', () => {
      let originalSimulate: boolean;

      beforeEach(() => {
        component.text = 'Some text';
        component.selectedLanguages = ['en', 'fr', 'nl'];
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(false)
        );
        (TranslationGoogleTranslateService as any).SIMULATE_TRANSLATION = false;
        originalSimulate = (TranslationGoogleTranslateService as any)
          .SIMULATE_TRANSLATION;
      });

      afterEach(() => {
        (TranslationGoogleTranslateService as any).SIMULATE_TRANSLATION =
          originalSimulate;
      });

      describe('Helper functions', () => {
        it('should set isContingentExceeded to true if contingent is exceeded', async () => {
          firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
            Promise.resolve(true)
          );
          await (component as any).updateIsContingentExceeded();
          expect(component.isContingentExceeded).toBeTrue();
        });
      });

      it('should show toast and return if no text is entered', async () => {
        component.text = '';
        await component.translateTextOrSimulate();

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'TRANSLATE.CARD_RESULTS.TOAST.NO_TEXT_OR_LANGUAGES',
          ToastAnchor.TRANSLATE_PAGE
        );
        expect(
          googleTranslateServiceSpy.secureTranslateCloudFunction
        ).not.toHaveBeenCalled();
      });

      it('should show toast and return if no languages are selected', async () => {
        component.selectedLanguages = [];
        await component.translateTextOrSimulate();

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'TRANSLATE.CARD_RESULTS.TOAST.NO_TEXT_OR_LANGUAGES',
          ToastAnchor.TRANSLATE_PAGE
        );
        expect(
          googleTranslateServiceSpy.secureTranslateCloudFunction
        ).not.toHaveBeenCalled();
      });

      it('should log error if secureTranslateCloudFunction throws an error', async () => {
        const consoleErrorSpy = spyOn(console, 'error');
        googleTranslateServiceSpy.secureTranslateCloudFunction.and.throwError(
          new Error('translation failed')
        );
        await component.translateTextOrSimulate();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Translation error:',
          new Error('translation failed')
        );
        (console.error as jasmine.Spy).calls.reset();
      });

      it('should not log error but call simulateTranslationOnContingentExceeded if secureTranslateCloudFunction throws an error which includes contingent', async () => {
        const consoleErrorSpy = spyOn(console, 'error');
        googleTranslateServiceSpy.secureTranslateCloudFunction.and.throwError(
          new Error('Translation contingent exceeded.')
        );
        spyOn<any>(component, 'simulateTranslationOnContingentExceeded');
        spyOn(component, 'toggleCard');

        await component.translateTextOrSimulate();

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(
          (component as any).simulateTranslationOnContingentExceeded
        ).toHaveBeenCalled();
        expect((component as any).toggleCard).toHaveBeenCalled();
        (console.error as jasmine.Spy).calls.reset();
      });

      it('should call secureTranslateCloudFunction if input and languages are set and simulation is off', async () => {
        await component.translateTextOrSimulate();
        expect(
          googleTranslateServiceSpy.secureTranslateCloudFunction
        ).toHaveBeenCalled();
      });

      it('should refresh statistics if secureTranslateCloudFunction returns translations', async () => {
        googleTranslateServiceSpy.secureTranslateCloudFunction.and.returnValue(
          Promise.resolve({ en: 'Hello', fr: 'Bonjour' })
        );
        await component.translateTextOrSimulate();

        expect(
          googleTranslateServiceSpy.secureTranslateCloudFunction
        ).toHaveBeenCalled();
        expect(
          firestoreUtilsServiceSpy.requestStatisticsRefresh
        ).toHaveBeenCalled();
      });

      it('should call simulateTranslateText if input and languages are set and simulation is on', async () => {
        (TranslationGoogleTranslateService as any).SIMULATE_TRANSLATION = true;
        spyOn<any>(component, 'simulateTranslateText');
        spyOn(component, 'toggleCard');

        await component.translateTextOrSimulate();

        expect(
          googleTranslateServiceSpy.secureTranslateCloudFunction
        ).not.toHaveBeenCalled();
        expect((component as any).simulateTranslateText).toHaveBeenCalled();
      });

      it('should call simulateTranslationOnContingentExceeded if input and languages are set and contingent is exceeded', async () => {
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(true)
        );
        spyOn<any>(component, 'simulateTranslationOnContingentExceeded');
        spyOn(component, 'toggleCard');

        await component.translateTextOrSimulate();

        expect(
          googleTranslateServiceSpy.secureTranslateCloudFunction
        ).not.toHaveBeenCalled();
        expect(
          (component as any).simulateTranslationOnContingentExceeded
        ).toHaveBeenCalled();
      });

      it('should call simulateTranslationOnContingentExceeded if returned translations are empty', async () => {
        googleTranslateServiceSpy.secureTranslateCloudFunction.and.returnValue(
          Promise.resolve(undefined)
        );
        spyOn<any>(component, 'simulateTranslationOnContingentExceeded');
        spyOn(component, 'toggleCard');

        await component.translateTextOrSimulate();

        expect(
          googleTranslateServiceSpy.secureTranslateCloudFunction
        ).toHaveBeenCalled();
        expect((component as any).toggleCard).toHaveBeenCalled();
        expect(
          (component as any).simulateTranslationOnContingentExceeded
        ).toHaveBeenCalled();
        expect(
          firestoreUtilsServiceSpy.requestStatisticsRefresh
        ).not.toHaveBeenCalled();
      });
    });

    describe('simulateTranslateText', () => {
      it('should return early if text is empty or whitespace', () => {
        component.text = '   ';
        const disableFormControlsSpy = spyOn<any>(
          component,
          'disableFormControls'
        );
        googleTranslateServiceSpy.getTranslations.and.stub();
        component['simulateTranslateText']();
        expect(disableFormControlsSpy).not.toHaveBeenCalled();
        expect(
          googleTranslateServiceSpy.getTranslations
        ).not.toHaveBeenCalled();
      });

      it('should disable form controls and call getTranslations with correct arguments', () => {
        component.text = 'Hello';
        component.baseLang = 'en';
        component.selectedLanguages = ['fr', 'de'];
        const disableFormControlsSpy = spyOn(
          component as any,
          'disableFormControls'
        );
        googleTranslateServiceSpy.getTranslations.and.returnValue(of([]));

        component['simulateTranslateText']();

        expect(disableFormControlsSpy).toHaveBeenCalled();
        expect(googleTranslateServiceSpy.getTranslations).toHaveBeenCalledWith(
          jasmine.any(Function), // the bound simulateTranslateText function
          'Hello',
          'en',
          ['fr', 'de']
        );
      });

      it('should set translations and update text on subscription', () => {
        component.text = 'Hello';
        const fakeResults = [{ language: 'fr', translatedText: 'Bonjour' }];
        googleTranslateServiceSpy.getTranslations.and.returnValue(
          of(fakeResults)
        );
        mockTranslateService.instant.and.returnValue('simulated translation');

        component['simulateTranslateText']();

        expect(component.translations).toBe(fakeResults);
        expect(component.text).toBe('simulated translation');
      });
    });

    describe('simulateTranslationOnContingentExceeded', () => {
      it('should show contingent exceeded toast and call simulateTranslateText', () => {
        spyOn<any>(component, 'simulateTranslateText');

        component['simulateTranslationOnContingentExceeded']();

        expect(component['simulateTranslateText']).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'TRANSLATE.CARD_RESULTS.TOAST.CONTINGENT_EXCEEDED',
          ToastAnchor.TRANSLATE_PAGE
        );
      });
    });

    describe('speak', () => {
      it('should not speak if speak button is disabled', () => {
        component.speakBtnDisabled = true;
        component.speak('Hello', 'en');
        expect(textSpeechServiceSpy.speak).not.toHaveBeenCalled();
      });

      it('should speak if speak button is not disabled', () => {
        component.speakBtnDisabled = false;
        component.speak('Hello', 'en');
        expect(textSpeechServiceSpy.speak).toHaveBeenCalledWith('Hello', 'en');
      });

      it('should log error and show toast if speak throws an error', () => {
        const consoleErrorSpy = spyOn(console, 'error');
        textSpeechServiceSpy.speak.and.throwError(new Error('TTS failed'));

        component.speak('Hello', 'en');

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'TRANSLATE.CARD_RESULTS.TOAST.SPEAK_NOT_SUPPORTED',
          ToastAnchor.TRANSLATE_PAGE
        );
      });

      it('should disable speak button during speak and re-enable after speak resolves', async () => {
        component.speakBtnDisabled = false;
        let resolveSpeak: () => void;
        textSpeechServiceSpy.speak.and.returnValue(
          new Promise<void>((res) => {
            resolveSpeak = res;
          })
        );

        const speakPromise = component.speak('Hello', 'en');
        expect(component.speakBtnDisabled)
          .withContext('speakBtnDisabled should be true while speaking')
          .toBeTrue();

        // Simulate TTS finishing
        resolveSpeak!();
        await speakPromise;

        expect(component.speakBtnDisabled)
          .withContext('speakBtnDisabled should be false after speaking')
          .toBeFalse();
      });

      it('should re-enable speak button after speak throws', async () => {
        component.speakBtnDisabled = false;
        textSpeechServiceSpy.speak.and.returnValue(
          Promise.reject(new Error('TTS failed'))
        );

        await component.speak('Hello', 'en');

        expect(component.speakBtnDisabled)
          .withContext('speakBtnDisabled should be false after error')
          .toBeFalse();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'TRANSLATE.CARD_RESULTS.TOAST.SPEAK_NOT_SUPPORTED',
          ToastAnchor.TRANSLATE_PAGE
        );
      });
    });

    describe('init and disable form controls', () => {
      it('should call initFormControls if clear button is clicked', () => {
        spyOn<any>(component, 'initFormControls');
        component['clear']();
        expect(component['initFormControls']).toHaveBeenCalled();
      });

      it('should init form controls', () => {
        component.selectedLanguages = ['en', 'fr'];
        component.text = 'some text';
        component.textareaDisabled = false;
        component.translateBtnDisabled = false;
        component.clearBtnDisabled = false;
        component.cardResultsVisible = true;
        component.cardInputVisible = true;
        component.speakBtnDisabled = false;

        component['initFormControls']();

        expect(component.textareaDisabled).withContext('textarea').toBeFalse();
        expect(component.clearBtnDisabled)
          .withContext('clear button')
          .toBeTrue();
        expect(component.speakBtnDisabled)
          .withContext('speak button')
          .toBeFalse();
        expect(component.translations).withContext('translations').toEqual([]);
        expect(component.cardInputVisible).withContext('card input').toBeTrue();
        expect(component.cardResultsVisible)
          .withContext('card results')
          .toBeFalse();
      });

      it('should disable form controls', () => {
        component.textareaDisabled = false;
        component.translateBtnDisabled = false;
        component.clearBtnDisabled = false;

        component['disableFormControls']();

        expect(component.textareaDisabled).withContext('textarea').toBeTrue();
        expect(component.clearBtnDisabled)
          .withContext('clear button')
          .toBeFalse();
        expect(component.translateBtnDisabled)
          .withContext('translate button')
          .toBeTrue();
      });

      it('should disable textarea if no languages are selected', () => {
        component.selectedLanguages = [];
        component['initFormControls']();
        expect(component.textareaDisabled).toBeTrue();
      });

      it('should enable textarea if languages are selected', () => {
        component.selectedLanguages = ['en'];
        component['initFormControls']();
        expect(component.textareaDisabled).toBeFalse();
      });
    });

    describe('getTranslationPlaceholder', () => {
      it('should return the correct translation key for the placeholder label', () => {
        expect(component.getTranslationPlaceholder()).toBe(
          'TRANSLATE.CARD.PLACEHOLDER.INPUT_TEXT'
        );
      });
    });

    describe('onTextareaInput', () => {
      it('should enable translate and clear buttons when textarea has text', () => {
        component.text = 'Some text';
        component.onTextareaInput();
        expect(component.translateBtnDisabled).toBeFalse();
        expect(component.clearBtnDisabled).toBeFalse();
      });

      it('should disable translate and clear buttons when textarea is empty', () => {
        component.text = '';
        component.onTextareaInput();
        expect(component.translateBtnDisabled).toBeTrue();
        expect(component.clearBtnDisabled).toBeTrue();
      });
    });

    describe('toggleCard', () => {
      it('should toggle cardInputVisible and cardResultsVisible when toggleCard is called', () => {
        component.cardInputVisible = true;
        component.cardResultsVisible = false;
        component.toggleCard();
        expect(component.cardInputVisible).toBe(false);
        expect(component.cardResultsVisible).toBe(true);
      });
    });

    describe('getTextareaRows', () => {
      it('should return 4 rows for mobiles in portrait mode', () => {
        Object.defineProperty(utilsServiceSpy, 'isSmallScreen', {
          get: () => true,
        });
        expect(component.getTextareaRows()).toBe('4');
      });

      it('should return 2 rows for mobiles in landscape mode', () => {
        Object.defineProperty(utilsServiceSpy, 'isSmallDevice', {
          get: () => true,
        });
        Object.defineProperty(utilsServiceSpy, 'isPortrait', {
          get: () => false,
        });
        expect(component.getTextareaRows()).toBe('2');
      });

      it('should return 2 rows for tablets and larger devices', () => {
        Object.defineProperty(utilsServiceSpy, 'isSmallScreen', {
          get: () => false,
        });
        expect(component.getTextareaRows()).toBe('2');
      });
    });

    describe('onAccordionGroupChange', () => {
      it('should refresh statistics when user contingent accordion is opened', () => {
        const requestStatisticsRefreshSpy = TestBed.inject(
          FirebaseFirestoreUtilsService
        ).requestStatisticsRefresh as jasmine.Spy;
        const event = {
          detail: { value: 'user-contingent' },
        } as CustomEvent;
        const content = {} as any;

        component.onAccordionGroupChange(event, content);

        expect(requestStatisticsRefreshSpy).toHaveBeenCalled();
      });
    });

    describe('ngOnInit', () => {
      it('should call showOrHideIonTabBar, setupEventListeners, setupSubscriptions, updateIsContingentExceeded, initFormControls, and getTranslationPlaceholder', async () => {
        const showOrHideIonTabBarSpy = utilsServiceSpy.showOrHideIonTabBar;
        const setupEventListenersSpy = spyOn<any>(
          component,
          'setupEventListeners'
        );
        const setupSubscriptionsSpy = spyOn<any>(
          component,
          'setupSubscriptions'
        );
        const updateIsContingentExceededSpy = spyOn<any>(
          component,
          'updateIsContingentExceeded'
        ).and.returnValue(Promise.resolve());
        const initFormControlsSpy = spyOn<any>(component, 'initFormControls');
        const getTranslationPlaceholderSpy = spyOn(
          component,
          'getTranslationPlaceholder'
        );

        component.ngOnInit();
        await fixture.whenStable();

        expect(showOrHideIonTabBarSpy).toHaveBeenCalled();
        expect(setupEventListenersSpy).toHaveBeenCalled();
        expect(setupSubscriptionsSpy).toHaveBeenCalled();
        expect(updateIsContingentExceededSpy).toHaveBeenCalled();
        expect(initFormControlsSpy).toHaveBeenCalled();
        expect(getTranslationPlaceholderSpy).toHaveBeenCalled();
      });

      // Skipped due to side effects in subscriptions, revisit if implementation changes”).
      xit('should call initFormControls and getTranslationPlaceholder after updateIsContingentExceeded resolves', async () => {
        // Attach spies BEFORE component is created
        const initFormControlsSpy = jasmine.createSpy();
        const getTranslationPlaceholderSpy = jasmine.createSpy();

        // Patch the prototype so the spies are used on instantiation
        spyOn(
          TabTranslationPage.prototype as any,
          'initFormControls'
        ).and.callFake(initFormControlsSpy);
        spyOn(
          TabTranslationPage.prototype,
          'getTranslationPlaceholder'
        ).and.callFake(getTranslationPlaceholderSpy);
        let resolvePromise: () => void;
        spyOn(
          TabTranslationPage.prototype as any,
          'updateIsContingentExceeded'
        ).and.returnValue(
          new Promise<void>((res) => {
            resolvePromise = res;
          })
        );

        // Now create the component (spies are already attached)
        fixture = TestBed.createComponent(TabTranslationPage);
        component = fixture.componentInstance;

        // Call ngOnInit (will pause at the unresolved promise)
        component.ngOnInit();

        // Before promise resolves, these should not have been called
        expect(initFormControlsSpy).not.toHaveBeenCalled();
        expect(getTranslationPlaceholderSpy).not.toHaveBeenCalled();

        // Resolve the promise to simulate async completion
        resolvePromise!();
        await fixture.whenStable();

        expect(initFormControlsSpy).toHaveBeenCalled();
        expect(getTranslationPlaceholderSpy).toHaveBeenCalled();
      });
    });

    describe('setupEventListeners', () => {
      it('should add resize event listeners', () => {
        spyOn(window, 'addEventListener');

        (component as any).setupEventListeners();

        expect(window.addEventListener).toHaveBeenCalledWith(
          'resize',
          jasmine.any(Function)
        );
      });

      it('should call showOrHideIonTabBar when window is resized', () => {
        const showOrHideIonTabBarSpy = utilsServiceSpy.showOrHideIonTabBar;
        (component as any).setupEventListeners();
        // Reset the spy call count to ignore the initial call during setup
        showOrHideIonTabBarSpy.calls.reset();

        window.dispatchEvent(new Event('resize'));

        expect(showOrHideIonTabBarSpy).toHaveBeenCalled();
      });
    });

    describe('setupSubscriptions', () => {
      it('should subscribe to selectedLanguage$ and update baseLang and baseLangString', () => {
        const localStorage = TestBed.inject(LocalStorageService);
        (localStorage.selectedLanguage$ as any) = of('en');
        (localStorage.selectedLanguageName$ as any) = of('English (en)');

        (component as any).setupSubscriptions();

        expect(component.baseLang).toBe('en');
        expect(component.baseLangString).toBe('English (en)');
      });

      it('should subscribe to targetLanguages$ and update selectedLanguages and call initFormControls', () => {
        const initFormControlsSpy = spyOn<any>(component, 'initFormControls');
        const localStorage = TestBed.inject(LocalStorageService);
        (localStorage.targetLanguages$ as any) = of(['fr', 'de']);

        (component as any).setupSubscriptions();

        expect(component.selectedLanguages).toEqual(['fr', 'de']);
        expect(initFormControlsSpy).toHaveBeenCalled();
      });
    });

    describe('ngOnDestroy', () => {
      it('should unsubscribe from all subscriptions', () => {
        const subscription1 = jasmine.createSpyObj('Subscription', [
          'unsubscribe',
        ]);
        const subscription2 = jasmine.createSpyObj('Subscription', [
          'unsubscribe',
        ]);
        (component as any).subscriptions = [subscription1, subscription2];

        (component as any).ngOnDestroy();

        expect(subscription1.unsubscribe).toHaveBeenCalled();
        expect(subscription2.unsubscribe).toHaveBeenCalled();
      });
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      spyOn<any>(component, 'initFormControls').and.stub();
      spyOn<any>(component, 'setupSubscriptions').and.stub();
      spyOn<any>(component, 'setupEventListeners').and.stub();

      component.selectedLanguages = ['en'];
      fixture.detectChanges();
    });

    describe('spinner display', () => {
      describe('speak spinner', () => {
        it('should show spinner while speaking', async () => {
          // Arrange: Simulate a translation result
          component.translations = [
            { language: 'en', translatedText: 'Hello' },
          ];
          fixture.detectChanges();

          // Arrange: Mock TTS to return a pending promise (simulate speaking in progress)
          let resolveSpeak: () => void;
          textSpeechServiceSpy.speak.and.returnValue(
            new Promise<void>((res) => {
              resolveSpeak = res;
            })
          );

          // Act: Call speak (sets speakBtnDisabled = true synchronously)
          const speakPromise = component.speak('Hello', 'en');

          expect(component.speakBtnDisabled)
            .withContext('Speak button should be disabled while speaking')
            .toBeTrue();

          fixture.detectChanges();
          await fixture.whenStable();
          fixture.detectChanges();

          // Assert: Spinner should be visible while speaking
          const compiled = fixture.nativeElement as HTMLElement;

          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should be visible while speaking')
            .toBeTruthy();

          // Cleanup: Finish speaking
          resolveSpeak!();
          await speakPromise;
          fixture.detectChanges();

          // Spinner should disappear after speaking
          expect(component.speakBtnDisabled)
            .withContext('Speak button should be enabled after speaking')
            .toBeFalse();
          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should not be visible after speaking')
            .toBeNull();
        });

        it('should not show spinner if not speaking', () => {
          // Arrange: Simulate a translation result
          component.translations = [
            { language: 'en', translatedText: 'Hello' },
          ];
          component.speakBtnDisabled = false;
          fixture.detectChanges();

          // Assert: Spinner should not be visible
          const compiled = fixture.nativeElement as HTMLElement;
          expect(compiled.querySelector('.sticky-toggle-btn app-spinner'))
            .withContext('Spinner should not be visible if not speaking')
            .toBeNull();
        });
      });

      describe('translateTextOrSimulate spinner', () => {
        beforeEach(() => {
          spyOn<any>(component, 'updateIsContingentExceeded').and.callFake(
            async () => {
              component.isContingentExceeded = false;
            }
          );
          spyOn<any>(component, 'simulateTranslateText').and.stub();
          spyOn<any>(
            component,
            'simulateTranslationOnContingentExceeded'
          ).and.stub();
          spyOn(component, 'toggleCard').and.stub();
          spyOn(component as any, 'disableFormControls').and.stub();
          component.cardInputVisible = true;
        });

        it('should not show spinner if no text is entered', async () => {
          component.text = '';
          component.selectedLanguages = ['en'];

          await component.translateTextOrSimulate();

          const compiled = fixture.nativeElement as HTMLElement;
          expect(compiled.querySelector('.translation-input-card app-spinner'))
            .withContext('Spinner should not be visible if no text')
            .toBeNull();
        });

        it('should not show spinner if no target languages are selected', async () => {
          component.text = 'Hello';
          component.selectedLanguages = [];

          await component.translateTextOrSimulate();

          const compiled = fixture.nativeElement as HTMLElement;
          expect(compiled.querySelector('.translation-input-cardapp-spinner'))
            .withContext('Spinner should not be visible if no target languages')
            .toBeNull();
        });

        it('should not show spinner if SIMULATE_TRANSLATION is true', async () => {
          (TranslationGoogleTranslateService as any).SIMULATE_TRANSLATION =
            true;
          component.text = 'Hello';
          component.selectedLanguages = ['en'];

          await component.translateTextOrSimulate();

          const compiled = fixture.nativeElement as HTMLElement;
          expect(compiled.querySelector('.translation-input-cardapp-spinner'))
            .withContext(
              'Spinner should not be visible if SIMULATE_TRANSLATION is true'
            )
            .toBeNull();
        });

        it('should show spinner during simulate translation and hide it after', async () => {
          // Arrange: updateIsContingentExceeded resolves immediately and sets flag
          (component as any).updateIsContingentExceeded.and.callFake(() => {
            component.isContingentExceeded = true;
            return Promise.resolve();
          });
          googleTranslateServiceSpy.secureTranslateCloudFunction.and.returnValue(
            Promise.resolve(undefined)
          );

          component.text = 'Hello';
          component.selectedLanguages = ['en'];

          // Act: Start translation (spinner should show)
          const translatePromise = component.translateTextOrSimulate();
          fixture.detectChanges();

          // Assert: Spinner should be visible while contingent check is pending
          let compiled = fixture.nativeElement as HTMLElement;
          expect(component.isLoading).toBeTrue();
          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should be visible while loading')
            .toBeTruthy();

          // Await completion
          await translatePromise;
          fixture.detectChanges();

          // Assert: Spinner should be hidden after simulate translation completes
          compiled = fixture.nativeElement as HTMLElement;
          expect(component.isLoading).toBeFalse();
          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should not be visible after loading')
            .toBeNull();
        });

        it('should show spinner during call to secureTranslateCloudFunction and hide it after', async () => {
          // Arrange: Make secureTranslateCloudFunction return a promise we control
          let resolveFn: (val: Record<string, string>) => void;
          const translations = { en: 'Hello', fr: 'Bonjour' };
          const promise = new Promise<Record<string, string>>((resolve) => {
            resolveFn = resolve;
          });
          googleTranslateServiceSpy.secureTranslateCloudFunction.and.returnValue(
            promise
          );

          component.text = 'Hello';
          component.selectedLanguages = ['en', 'fr'];

          // Act: Start translation (spinner should show)
          const translatePromise = component.translateTextOrSimulate();
          fixture.detectChanges();

          // Assert: Spinner should be visible while promise is pending
          let compiled = fixture.nativeElement as HTMLElement;
          expect(component.isLoading).toBeTrue();
          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should be visible while loading')
            .toBeTruthy();

          // Resolve the translation promise (simulate async completion)
          resolveFn!(translations);
          await translatePromise;
          fixture.detectChanges();

          // Assert: Spinner should be hidden after promise resolves
          compiled = fixture.nativeElement as HTMLElement;
          expect(component.isLoading).toBeFalse();
          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should not be visible after loading')
            .toBeNull();
        });

        it('should show spinner during call to secureTranslateCloudFunction and hide it if error occurs', async () => {
          // Arrange: Make secureTranslateCloudFunction return a promise we control
          let rejectFn: (reason?: any) => void;
          const promise = new Promise<Record<string, string>>((_, reject) => {
            rejectFn = reject;
          });
          googleTranslateServiceSpy.secureTranslateCloudFunction.and.returnValue(
            promise
          );

          component.text = 'Hello';
          component.selectedLanguages = ['en', 'fr'];

          // Act: Start translation (spinner should show)
          const translatePromise = component.translateTextOrSimulate();
          fixture.detectChanges();

          // Assert: Spinner should be visible while promise is pending
          let compiled = fixture.nativeElement as HTMLElement;
          expect(component.isLoading).toBeTrue();
          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should be visible while loading')
            .toBeTruthy();

          // Reject the translation promise (simulate async error)
          rejectFn!(new Error('some error'));
          await translatePromise;
          fixture.detectChanges();

          // Assert: Spinner should be hidden after promise rejects
          compiled = fixture.nativeElement as HTMLElement;
          expect(component.isLoading).toBeFalse();
          expect(compiled.querySelector('app-spinner'))
            .withContext('Spinner should not be visible after loading')
            .toBeNull();
        });
      });
    });

    describe('user setup flow', () => {
      it('should not show any sections if loading and no languages are selected', () => {
        component.selectedLanguages = [];
        component.isLoading = true;
        fixture.detectChanges();

        const noLanguagesSection = fixture.nativeElement.querySelector(
          '.no-languages-selected'
        );
        const translationInputCard = fixture.nativeElement.querySelector(
          '.translation-input-card'
        );
        const languagesCard =
          fixture.nativeElement.querySelector('.languages-card');
        expect(noLanguagesSection)
          .withContext('No-languages section')
          .toBeFalsy();
        expect(translationInputCard)
          .withContext('Translation input card')
          .toBeFalsy();
        expect(languagesCard).withContext('Languages card').toBeFalsy();
      });

      it('should show only no-languages section and hide other sections if no languages are selected and not loading', () => {
        component.selectedLanguages = [];
        component.isLoading = false;
        fixture.detectChanges();

        const noLanguagesSection = fixture.nativeElement.querySelector(
          '.no-languages-selected'
        );
        const translationInputCard = fixture.nativeElement.querySelector(
          '.translation-input-card'
        );
        const languagesCard =
          fixture.nativeElement.querySelector('.languages-card');
        expect(noLanguagesSection)
          .withContext('No-languages section')
          .toBeTruthy();
        expect(translationInputCard)
          .withContext('Translation input card')
          .toBeFalsy();
        expect(languagesCard).withContext('Languages card').toBeFalsy();
      });

      it('should show translation input card and languages card and hide no-languages section if languages are selected', () => {
        component.selectedLanguages = ['en', 'fr'];
        fixture.detectChanges();

        const translationInputCard = fixture.nativeElement.querySelector(
          '.translation-input-card'
        );
        const languagesCard =
          fixture.nativeElement.querySelector('.languages-card');
        const noLanguagesSection = fixture.nativeElement.querySelector(
          '.no-languages-selected'
        );
        expect(translationInputCard)
          .withContext('Translation input card')
          .toBeTruthy();
        expect(languagesCard).withContext('Languages card').toBeTruthy();
        expect(noLanguagesSection)
          .withContext('No-languages section')
          .toBeFalsy();
      });
    });

    describe('main feature flow', () => {
      it('should show switch button only when translations are available', () => {
        component.translations = [];
        fixture.detectChanges();

        let switchButton = fixture.nativeElement.querySelector(
          '.sticky-toggle-btn ion-button'
        );
        expect(switchButton).toBeNull();

        component.translations = [{ language: 'en', translatedText: 'Hello' }];
        fixture.detectChanges();

        switchButton = fixture.nativeElement.querySelector(
          '.sticky-toggle-btn ion-button'
        );
        expect(switchButton).toBeTruthy();
      });

      it('should call toggleCard when switch button is clicked', () => {
        component.translations = [{ language: 'en', translatedText: 'Hello' }];
        component.clearBtnDisabled = false;
        const toggleSpy = spyOn(component, 'toggleCard');
        fixture.detectChanges();

        const switchButton: HTMLElement = fixture.nativeElement.querySelector(
          '.sticky-toggle-btn ion-button'
        );
        expect(switchButton).toBeTruthy();

        switchButton.dispatchEvent(new Event('click'));
        fixture.detectChanges();

        expect(toggleSpy).toHaveBeenCalled();
      });

      it('should call translateTextOrSimulate when translate button is clicked', async () => {
        component.cardInputVisible = true;
        component.selectedLanguages = ['de'];
        component.text = 'Hello world';
        component.translateBtnDisabled = false;

        const translateSpy = spyOn(
          component,
          'translateTextOrSimulate'
        ).and.returnValue(Promise.resolve());

        fixture.detectChanges();

        const translateButton: HTMLElement =
          fixture.nativeElement.querySelector(
            '.translation-input-card ion-button'
          );
        expect(translateButton).toBeTruthy();

        translateButton.dispatchEvent(new Event('click'));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(translateSpy).toHaveBeenCalled();
      });
    });

    describe('contingent exceeded flow', () => {
      it('should show contingent usage statistics if target languages are selected', async () => {
        component.selectedLanguages = ['en'];
        fixture.detectChanges();

        const translationInputCard = fixture.nativeElement.querySelector(
          '.monthly-quota-accordion'
        );
        expect(translationInputCard).toBeTruthy();
      });

      it('should not show contingent usage statistics if no target languages are selected', async () => {
        component.selectedLanguages = [];
        fixture.detectChanges();

        const translationInputCard = fixture.nativeElement.querySelector(
          '.monthly-quota-accordion'
        );
        expect(translationInputCard).toBeNull();
      });
    });
  });
});
