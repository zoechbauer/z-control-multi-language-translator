import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { of, EMPTY } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { TabSettingsPage } from './tab-settings.page';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { TextSpeechService } from '../services/text-to-speech.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { environment } from 'src/environments/environment';
import { GetStatisticsAccordionComponent } from '../ui/components/accordions/get-statistics-accordion.component';
import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';
import { TargetLanguagesAccordionComponent } from '../ui/components/accordions/target-languages-accordion.component';
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { GetMobileAppAccordionComponent } from '../ui/components/accordions/get-mobile-app-accordion.component';
import { ChangeLogAccordionComponent } from '../ui/components/accordions/change-log-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { TextToSpeechAccordionComponent } from '../ui/components/accordions/text-to-speech-accordion.component';
import { LanguageAccordionComponent } from '../ui/components/accordions/language-accordion.component';

@Component({
  selector: 'app-language-accordion',
  template: '',
  standalone: true,
})
class MockLanguageAccordionComponent {
  @Input() lang!: string;
  @Output() ionChange = new EventEmitter<any>();
}

@Component({
  selector: 'app-target-languages-accordion',
  template: '',
  standalone: true,
})
class MockTargetLanguagesAccordionComponent {
  @Input() lang!: string;
  @Output() ionChange = new EventEmitter<string[]>();
}

@Component({
  selector: 'app-text-to-speech-accordion',
  template: '',
  standalone: true,
})
class MockTextToSpeechAccordionComponent {
  @Input() lang!: string;
  @Input() isNative!: boolean;
  @Input() ngModel: any;
  @Output() ngModelChange = new EventEmitter<any>();
}

@Component({
  selector: 'app-feedback-accordion',
  template: '',
  standalone: true,
})
class MockFeedbackAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-get-statistics-accordion',
  template: '',
  standalone: true,
})
class MockGetStatisticsAccordionComponent {
  @Input() lang!: string;
  @Input() yearMonth!: string;
}

@Component({
  selector: 'app-privacy-policy-accordion',
  template: '',
  standalone: true,
})
class MockPrivacyPolicyAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-change-log-accordion',
  template: '',
  standalone: true,
})
class MockChangeLogAccordionComponent {
  @Input() lang!: string;
  @Input() versionInfo!: string;
  @Output() ionChange = new EventEmitter<void>();
}

@Component({
  selector: 'app-get-mobile-app-accordion',
  template: '',
  standalone: true,
})
class MockGetMobileAppAccordionComponent {
  @Input() lang!: string;
}

@Component({
  selector: 'app-get-source-accordion',
  template: '',
  standalone: true,
})
class MockGetSourceAccordionComponent {
  @Input() lang!: string;
}

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
        logoClicked$: EMPTY,
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

    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'create',
    ]);
    modalControllerSpy.create.and.resolveTo({
      present: jasmine.createSpy('present').and.resolveTo(),
      onDidDismiss: jasmine
        .createSpy('onDidDismiss')
        .and.resolveTo({ data: null }),
    });

    const googleTranslateServiceSpy = jasmine.createSpyObj(
      'TranslationGoogleTranslateService',
      ['getSupportedLanguagesWithLangCodeInName']
    );
    googleTranslateServiceSpy.getSupportedLanguagesWithLangCodeInName.and.returnValue(
      of([])
    );

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TabSettingsPage],
      providers: [
        {
          provide: TranslationGoogleTranslateService,
          useValue: googleTranslateServiceSpy,
        },
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
        {
          provide: ModalController,
          useValue: modalControllerSpy,
        },
      ],
    })
      .overrideComponent(TabSettingsPage, {
        remove: {
          imports: [
            LanguageAccordionComponent,
            TargetLanguagesAccordionComponent,
            TextToSpeechAccordionComponent,
            FeedbackAccordionComponent,
            GetStatisticsAccordionComponent,
            PrivacyPolicyAccordionComponent,
            ChangeLogAccordionComponent,
            GetMobileAppAccordionComponent,
            GetSourceAccordionComponent,
          ],
        },
        add: {
          imports: [
            MockLanguageAccordionComponent,
            MockTargetLanguagesAccordionComponent,
            MockTextToSpeechAccordionComponent,
            MockFeedbackAccordionComponent,
            MockGetStatisticsAccordionComponent,
            MockPrivacyPolicyAccordionComponent,
            MockChangeLogAccordionComponent,
            MockGetMobileAppAccordionComponent,
            MockGetSourceAccordionComponent,
          ],
        },
      })
      .compileComponents();

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
        const content = {} as any;

        component.onAccordionGroupChange(event, content);

        expect(component.openAccordion).toBe('language');
        expect(component.showAllAccordions).toBeFalse();
      });

      it('should ignore undefined values on accordion change', () => {
        const event = {
          detail: { value: undefined },
        } as CustomEvent;
        const content = {} as any;

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
        const content = {} as any;
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
        const logoClicked$ = new EventEmitter<void>();
        Object.defineProperty(utilsServiceSpy, 'logoClicked$', {
          get: () => logoClicked$.asObservable(),
        });

        const openFeedbackAccordionSpy = spyOn(
          component as any,
          'openFeedbackAccordion'
        );

        (component as any).setupSubscriptions();

        logoClicked$.emit();

        expect(openFeedbackAccordionSpy).toHaveBeenCalled();
      });
    });
  });

  describe('template rendering', () => {
    it('should render mocked child accordion hosts (shallow render smoke test)', () => {
      // Guard test: verifies overrideComponent uses mock accordions, avoiding deep child DI dependencies.
      component.isLoading = false;
      component.selectedLanguage = 'de';
      component.showAllAccordions = true;
      component.openAccordion = null;
      fixture.detectChanges();

      const language = fixture.nativeElement.querySelector(
        'app-language-accordion'
      ) as HTMLElement;
      const targetLanguages = fixture.nativeElement.querySelector(
        'app-target-languages-accordion'
      ) as HTMLElement;
      const feedback = fixture.nativeElement.querySelector(
        'app-feedback-accordion'
      ) as HTMLElement;
      const stats = fixture.nativeElement.querySelector(
        'app-get-statistics-accordion'
      ) as HTMLElement;

      expect(language).toBeTruthy();
      expect(targetLanguages).toBeTruthy();
      expect(feedback).toBeTruthy();
      expect(stats).toBeTruthy();

      // Mock components have empty templates.
      expect(language.innerHTML.trim()).toBe('');
      expect(targetLanguages.innerHTML.trim()).toBe('');
      expect(feedback.innerHTML.trim()).toBe('');
      expect(stats.innerHTML.trim()).toBe('');

      // Real child templates would render these markers.
      expect(fixture.nativeElement.querySelector('.notes')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('.user-statistics-overview')
      ).toBeNull();
    });

    describe('loading spinner', () => {
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

    describe('accordion visibility flow', () => {
      beforeEach(() => {
        component.isLoading = false;
        component.selectedLanguage = 'de';
        component.showAllAccordions = true;
        component.openAccordion = null;

        fixture.detectChanges();
      });

      it('should render all accordion components when no accordion is open', () => {
        const languageAccordion = fixture.nativeElement.querySelector(
          'app-language-accordion'
        );
        const targetLanguagesAccordion = fixture.nativeElement.querySelector(
          'app-target-languages-accordion'
        );
        const ttsAccordion = fixture.nativeElement.querySelector(
          'app-text-to-speech-accordion'
        );
        const feedbackAccordion = fixture.nativeElement.querySelector(
          'app-feedback-accordion'
        );
        const statisticsAccordion = fixture.nativeElement.querySelector(
          'app-get-statistics-accordion'
        );
        const privacyAccordion = fixture.nativeElement.querySelector(
          'app-privacy-policy-accordion'
        );
        const changeLogAccordion = fixture.nativeElement.querySelector(
          'app-change-log-accordion'
        );
        const sourceAccordion = fixture.nativeElement.querySelector(
          'app-get-source-accordion'
        );
        const closeButtonArea = fixture.nativeElement.querySelector(
          '.accordion-close-button'
        );

        expect(languageAccordion).toBeTruthy();
        expect(targetLanguagesAccordion).toBeTruthy();
        expect(ttsAccordion).toBeTruthy();
        expect(feedbackAccordion).toBeTruthy();
        expect(statisticsAccordion).toBeTruthy();
        expect(privacyAccordion).toBeTruthy();
        expect(changeLogAccordion).toBeTruthy();
        expect(sourceAccordion).toBeTruthy();
        expect(closeButtonArea).toBeNull();
      });

      it('should render only selected accordion and close button in single-accordion mode', () => {
        component.openAccordion = 'language';
        component.showAllAccordions = false;
        fixture.detectChanges();

        const languageAccordion = fixture.nativeElement.querySelector(
          'app-language-accordion'
        );
        const targetLanguagesAccordion = fixture.nativeElement.querySelector(
          'app-target-languages-accordion'
        );
        const feedbackAccordion = fixture.nativeElement.querySelector(
          'app-feedback-accordion'
        );
        const closeButtonArea = fixture.nativeElement.querySelector(
          '.accordion-close-button'
        );

        expect(languageAccordion).toBeTruthy();
        expect(targetLanguagesAccordion).toBeNull();
        expect(feedbackAccordion).toBeNull();
        expect(closeButtonArea).toBeTruthy();
      });

      it('should switch to single-accordion mode when ionValueChange emits selected accordion value', () => {
        const group = fixture.nativeElement.querySelector(
          'ion-accordion-group'
        ) as HTMLElement;
        expect(group).toBeTruthy();

        group.dispatchEvent(
          new CustomEvent('ionValueChange', {
            detail: { value: 'language' },
            bubbles: true,
          })
        );
        fixture.detectChanges();

        expect(component.openAccordion).toBe('language');
        expect(component.showAllAccordions).toBeFalse();

        const closeButtonArea = fixture.nativeElement.querySelector(
          '.accordion-close-button'
        );
        expect(closeButtonArea).toBeTruthy();
      });

      it('should show all accordions again when close button is clicked', () => {
        component.openAccordion = 'language';
        component.showAllAccordions = false;
        fixture.detectChanges();

        const closeButton = fixture.nativeElement.querySelector(
          '.accordion-close-button ion-button'
        ) as HTMLElement;
        expect(closeButton).toBeTruthy();

        closeButton.dispatchEvent(new Event('click'));
        fixture.detectChanges();

        expect(component.openAccordion).toBeNull();
        expect(component.showAllAccordions).toBeTrue();

        const feedbackAccordion = fixture.nativeElement.querySelector(
          'app-feedback-accordion'
        );
        const closeButtonArea = fixture.nativeElement.querySelector(
          '.accordion-close-button'
        );
        expect(feedbackAccordion).toBeTruthy();
        expect(closeButtonArea).toBeNull();
      });
    });
  });
});
