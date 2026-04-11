import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonContent, IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { TabSettingsPage } from './tab-settings.page';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { TextSpeechService } from '../services/text-to-speech.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { environment } from 'src/environments/environment';

describe('TabSettingsPage', () => {
  let component: TabSettingsPage;
  let fixture: ComponentFixture<TabSettingsPage>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;
  let textSpeechServiceSpy: jasmine.SpyObj<TextSpeechService>;

  beforeEach(async () => {
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['getDeviceInfo', 'showOrHideIonTabBar', 'openChangelog'],
      {
        isNative: false,
        logoClicked$: of(void 0),
      }
    );
    localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      [
        'loadTargetLanguages',
        'saveSelectedLanguage',
        'saveTargetLanguages',
        'saveTextToSpeechValues',
      ],
      {
        selectedLanguage$: of('de'),
        targetLanguagesSubject: { getValue: () => ['en', 'de', 'fr'] },
        targetLanguages$: of(['en', 'de', 'fr']),
        textToSpeechValuesSubject: { getValue: () => ({ rate: 1, pitch: 1 }) },
        textToSpeechValues$: of({ rate: 1, pitch: 1 }),
      }
    );
    textSpeechServiceSpy = jasmine.createSpyObj('TextSpeechService', [
      'updateTtsSupportedLanguagesMap',
    ]);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TabSettingsPage],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: LocalStorageService,
          useValue: localStorageServiceSpy,
        },
        {
          provide: UtilsService,
          useValue: utilsServiceSpy,
        },
        {
          provide: TextSpeechService,
          useValue: textSpeechServiceSpy,
        },
        {
          provide: FirebaseFirestoreService,
          useValue: jasmine.createSpyObj('FirebaseFirestoreService', ['init']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabSettingsPage);
    component = fixture.componentInstance;
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show version info', () => {
      (environment as any).version = {
        major: 1,
        minor: 0,
        date: '2026-04-01',
      };

      const versionInfo = component.versionInfo;

      expect(versionInfo).toBeDefined();
      expect(typeof versionInfo).toBe('string');
      expect(versionInfo).toContain('1.0 (2026-04-01)');
    });

    it('should open changelog', () => {
      const openChangelogSpy = utilsServiceSpy.openChangelog;
      component.openChangelog();
      expect(openChangelogSpy).toHaveBeenCalled();
    });

    describe('get isNative', () => {
      it('should return false when utilsService.isNative is false', () => {
        expect(component.isNative).toBeFalse();
      });

      it('should return true when utilsService.isNative is true', () => {
        Object.defineProperty(utilsServiceSpy, 'isNative', {
          get: () => true,
        });
        expect(component.isNative).toBeTrue();
      });
    });

    describe('accordion behavior', () => {
      it('should set openAccordion to null and showAllAccordions to true when showAll is called', () => {
        component.openAccordion = 'language';
        component.showAllAccordions = false;

        component.showAll();

        expect(component.openAccordion).toBeNull();
        expect(component.showAllAccordions).toBeTrue();
      });

      it('should set openAccordion to the selected value and showAllAccordions to false on accordion change', () => {
        const event = {
          detail: { value: 'language' },
        } as CustomEvent;
        const content = {} as IonContent;

        component.onAccordionGroupChange(event, content);

        expect(component.openAccordion).toBe('language');
        expect(component.showAllAccordions).toBeFalse();
      });

      it('should ignore undefined values on accordion change', () => {
        const event = {
          detail: { value: undefined },
        } as CustomEvent;
        const content = {} as IonContent;

        component.onAccordionGroupChange(event, content);

        expect(component.openAccordion).toBeNull();
        expect(component.showAllAccordions).toBeTrue();
      });

      it('should not change values on accordion change when normalized value is undefined', () => {
        component.openAccordion = 'language';
        component.showAllAccordions = false;
        const event = {
          detail: { value: undefined },
        } as CustomEvent;
        const content = {} as IonContent;
        spyOn(component as any, 'normalizeAccordionValue').and.returnValue(
          undefined
        );

        component.onAccordionGroupChange(event, content);

        expect(component.openAccordion).toBe('language');
        expect(component.showAllAccordions).toBeFalse();
      });

      it('should normalize accordion values correctly', () => {
        expect((component as any).normalizeAccordionValue('language')).toBe(
          'language'
        );
        expect((component as any).normalizeAccordionValue('z-control')).toBe(
          'z-control'
        );
        expect(
          (component as any).normalizeAccordionValue(undefined)
        ).toBeNull();
        expect(
          (component as any).normalizeAccordionValue('invalid')
        ).toBeUndefined();
      });

      it('should open feedback accordion when logo is clicked', () => {
        (component as any).openFeedbackAccordion();
        expect(component.openAccordion).toBe('z-control');
      });
    });

    describe('saveTargetLanguages', () => {
      it('should save target languages', () => {
        const saveTargetLanguagesSpy =
          localStorageServiceSpy.saveTargetLanguages as jasmine.Spy;
        const languages = ['en', 'fr'];

        component.onTargetLanguagesChange(languages);

        expect(saveTargetLanguagesSpy).toHaveBeenCalledWith(languages);
      });

      it('should update TTS supported languages map', () => {
        const updateTtsSupportedLanguagesMapSpy =
          textSpeechServiceSpy.updateTtsSupportedLanguagesMap as jasmine.Spy;
        const languages = ['en', 'fr'];
        const isNative = utilsServiceSpy.isNative;

        component.onTargetLanguagesChange(languages);

        expect(updateTtsSupportedLanguagesMapSpy).toHaveBeenCalledWith(
          isNative,
          languages
        );
      });
    });

    describe('onLanguageChange', () => {
      it('should save selected language and call removeBaseLangFromTargetLanguages', () => {
        const saveSelectedLanguageSpy =
          localStorageServiceSpy.saveSelectedLanguage as jasmine.Spy;
        const event = {
          detail: { value: 'en' },
        } as CustomEvent;
        const removeBaseLangFromTargetLanguagesSpy = spyOn(
          component as any,
          'removeBaseLangFromTargetLanguages'
        );

        component.onLanguageChange(event);

        expect(saveSelectedLanguageSpy).toHaveBeenCalledWith('en');
        expect(removeBaseLangFromTargetLanguagesSpy).toHaveBeenCalled();
      });

      it('should do nothing if no language is selected', () => {
        const saveSelectedLanguageSpy =
          localStorageServiceSpy.saveSelectedLanguage as jasmine.Spy;
        const event = {
          detail: { value: null },
        } as CustomEvent;

        component.onLanguageChange(event);

        expect(saveSelectedLanguageSpy).not.toHaveBeenCalled();
      });

      it('should remove base language from target languages and save target languages', () => {
        const saveTargetLanguagesSpy =
          localStorageServiceSpy.saveTargetLanguages as jasmine.Spy;
        localStorageServiceSpy.targetLanguagesSubject.getValue = () => [
          'en',
          'de',
          'fr',
        ];

        (component as any).removeBaseLangFromTargetLanguages('de');

        expect(saveTargetLanguagesSpy).toHaveBeenCalledWith(['en', 'fr']);
      });
    });

    describe('onChangeTtsValue', () => {
      it('should save text-to-speech values', () => {
        const saveTextToSpeechValuesSpy =
          localStorageServiceSpy.saveTextToSpeechValues as jasmine.Spy;
        const ttsValues = { rate: 1.5, pitch: 0.8 };

        component.onChangeTtsValue(ttsValues);

        expect(saveTextToSpeechValuesSpy).toHaveBeenCalledWith(ttsValues);
      });
    });

    describe('ngOnInit', () => {
      it('should call setupSubscriptions, showOrHideIonTabBar, and setupEventListeners', () => {
        const setupSubscriptionsSpy = spyOn(
          component as any,
          'setupSubscriptions'
        ).and.callThrough();
        const showOrHideIonTabBarSpy = utilsServiceSpy.showOrHideIonTabBar;
        const setupEventListenersSpy = spyOn(
          component as any,
          'setupEventListeners'
        ).and.callThrough();
        (component as any).showAllAccordions = false;

        component.ngOnInit();

        expect(setupSubscriptionsSpy).toHaveBeenCalled();
        expect(showOrHideIonTabBarSpy).toHaveBeenCalled();
        expect(setupEventListenersSpy).toHaveBeenCalled();
        (component as any).showAllAccordions = true;
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

    describe('subscriptions and cleanup', () => {
      it('should unsubscribe from all subscriptions on destroy', () => {
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

      it('should handle empty subscriptions array on destroy', () => {
        (component as any).subscriptions = [];
        (component as any).ngOnDestroy();
        // No errors should occur, and the test will pass if it reaches this point without throwing
      });

      it('should subscribe to selectedLanguage$ and update selectedLanguage and call loadTargetLanguages', () => {
        Object.defineProperty(localStorageServiceSpy, 'selectedLanguage$', {
          get: () => of('en'),
        });
        const loadTargetLanguagesSpy =
          localStorageServiceSpy.loadTargetLanguages as jasmine.Spy;

        (component as any).setupSubscriptions();

        expect(component.selectedLanguage).toBe('en');
        expect(loadTargetLanguagesSpy).toHaveBeenCalled();
      });

      it('should subscribe to textToSpeechValues$ and update textToSpeechValues', () => {
        const ttsValues = { rate: 1.2, pitch: 0.9 };
        Object.defineProperty(localStorageServiceSpy, 'textToSpeechValues$', {
          get: () => of(ttsValues),
        });

        (component as any).setupSubscriptions();

        expect(component.textToSpeechValues).toEqual(ttsValues);
      });

      it('should subscribe to logoClicked$ and open feedback accordion', () => {
        const openFeedbackAccordionSpy = spyOn(
          component as any,
          'openFeedbackAccordion'
        );
        (component as any).setupSubscriptions();

        expect(openFeedbackAccordionSpy).toHaveBeenCalled();
      });
    });
  });

  describe('template', () => {
    it('should display the spinner when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('app-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should hide the spinner when isLoading is false', async () => {
      component.isLoading = true;
      fixture.detectChanges();
      component.isLoading = false;
      fixture.detectChanges();
      await fixture.whenStable();

      const spinner = fixture.nativeElement.querySelector('app-spinner');
      expect(spinner).toBeNull();
    });

    it('should show spinner during loadTargetLanguages in ngOnInit', async () => {
      const loadTargetLanguagesSpy =
        localStorageServiceSpy.loadTargetLanguages as jasmine.Spy;
      let resolveLoad: (() => void) | undefined;
      const loadPromise = new Promise<void>((resolve) => {
        resolveLoad = resolve;
      });
      loadTargetLanguagesSpy.and.returnValue(loadPromise);

      component.ngOnInit();
      fixture.detectChanges();

      // Spinner should be visible while loading
      let spinner = fixture.nativeElement.querySelector('app-spinner');
      expect(spinner)
        .withContext('Spinner should be visible while loading')
        .toBeTruthy();
      expect(component.isLoading).toBeTrue();
      expect(loadTargetLanguagesSpy)
        .withContext('loadTargetLanguages should be called')
        .toHaveBeenCalled();

      // Finish loading
      resolveLoad?.();
      await loadPromise;
      fixture.detectChanges();
      await fixture.whenStable();

      // Spinner should be hidden after loading
      expect(component.isLoading).toBeFalse();
      spinner = fixture.nativeElement.querySelector('app-spinner');
      expect(spinner)
        .withContext('Spinner should be hidden after loading')
        .toBeNull();
    });
  });
});
