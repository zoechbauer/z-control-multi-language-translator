import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';

import { TargetLanguagesAccordionComponent } from './target-languages-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { TranslationGoogleTranslateService } from 'src/app/services/translation-google-translate.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { of, Subject } from 'rxjs';
import { AppConstants } from 'src/app/shared/app.constants';

describe('TargetLanguagesAccordionComponent', () => {
  let component: TargetLanguagesAccordionComponent;
  let fixture: ComponentFixture<TargetLanguagesAccordionComponent>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;
  let googleTranslateServiceSpy: jasmine.SpyObj<TranslationGoogleTranslateService>;
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'dismiss',
    'create',
  ]);

  beforeEach(async () => {
    localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      ['getItem', 'setItem'],
      {
        targetLanguages$: of(['en', 'de', 'fr']),
      }
    );

    googleTranslateServiceSpy = jasmine.createSpyObj(
      'TranslationGoogleTranslateService',
      ['getSupportedLanguagesWithLangCodeInName']
    );
    googleTranslateServiceSpy.getSupportedLanguagesWithLangCodeInName.and.returnValue(
      of([
        { language: 'en', name: 'English' },
        { language: 'de', name: 'German' },
        { language: 'fr', name: 'French' },
      ])
    );

    await TestBed.configureTestingModule({
      imports: [TargetLanguagesAccordionComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        {
          provide: TranslationGoogleTranslateService,
          useValue: googleTranslateServiceSpy,
        },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ModalController, useValue: modalControllerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TargetLanguagesAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should get maxTargetLanguages from AppConstants', () => {
      expect(component.maxTargetLanguages).toBe(
        AppConstants.maxTargetLanguages
      );
    });

    describe('openLanguageSelect', () => {
      beforeEach(() => {
        component.lang = 'en';
        component.targetLanguages = [
          { language: 'de', name: 'German' },
          { language: 'fr', name: 'French' },
        ];
        component.selectedTargetLanguageCodes = ['de', 'fr'];
        Object.defineProperty(component, 'maxTargetLanguages', { value: 5 });
      });

      it('should open modal with LanguageMultiSelectComponent and pass correct componentProps', async () => {
        modalControllerSpy.create.and.returnValue(
          Promise.resolve({
            present: () => Promise.resolve(),
            onDidDismiss: () => Promise.resolve({ data: ['de', 'fr'] }),
          } as any)
        );

        component.lang = 'en';
        await component.openLanguageSelect();

        expect(modalControllerSpy.create).toHaveBeenCalledWith({
          component: jasmine.any(Function),
          componentProps: {
            baseLang: component.lang,
            allLanguages: component.targetLanguages,
            selectedCodes: component.selectedTargetLanguageCodes,
            maxSelection: component.maxTargetLanguages,
          },
        });
      });

      it('should emit ionChange event with selected target language codes when modal is dismissed with data', async () => {
        const ionChangeSpy = spyOn(component.ionChange, 'emit');
        modalControllerSpy.create.and.returnValue(
          Promise.resolve({
            present: () => Promise.resolve(),
            onDidDismiss: () => Promise.resolve({ data: ['de', 'fr'] }),
          } as any)
        );

        await component.openLanguageSelect();

        expect(ionChangeSpy).toHaveBeenCalledWith(['de', 'fr']);
        expect(component.selectedTargetLanguageCodes).toEqual(['de', 'fr']);
      });

      it('should not emit ionChange event when modal is dismissed without data', async () => {
        const ionChangeSpy = spyOn(component.ionChange, 'emit');
        modalControllerSpy.create.and.returnValue(
          Promise.resolve({
            present: () => Promise.resolve(),
            onDidDismiss: () => Promise.resolve({ data: null }),
          } as any)
        );
        component.selectedTargetLanguageCodes = ['it', 'es'];

        await component.openLanguageSelect();

        expect(ionChangeSpy).not.toHaveBeenCalled();
        expect(component.selectedTargetLanguageCodes).toEqual(['it', 'es']);
      });
    });

    describe('ngOnInit', () => {
      it('should call loadSelectedTargetLanguages and loadSupportedLanguagesWithoutBaseLanguage', () => {
        spyOn<any>(component, 'loadSelectedTargetLanguages').and.callThrough();
        spyOn<any>(
          component,
          'loadSupportedLanguagesWithoutBaseLanguage'
        ).and.callThrough();

        component.ngOnInit();

        expect(
          (component as any).loadSelectedTargetLanguages
        ).toHaveBeenCalled();
        expect(
          (component as any).loadSupportedLanguagesWithoutBaseLanguage
        ).toHaveBeenCalled();
      });

      it('should load supported languages without base language and set targetLanguages', () => {
        component.lang = 'en';

        (component as any).loadSupportedLanguagesWithoutBaseLanguage();

        expect(
          googleTranslateServiceSpy.getSupportedLanguagesWithLangCodeInName
        ).toHaveBeenCalledWith(component.lang);

        expect(component.targetLanguages).toEqual([
          { language: 'de', name: 'German' },
          { language: 'fr', name: 'French' },
        ]);
      });

      it('should subscribe to targetLanguages$ and update selectedTargetLanguageCodes', () => {
        (component as any).loadSelectedTargetLanguages();

        expect(component.selectedTargetLanguageCodes).toEqual([
          'en',
          'de',
          'fr',
        ]);
      });
    });
  });

  describe('template', () => {
    describe('spinner', () => {
      it('should show spinner during openLanguageSelect is loading', async () => {
        // Arrange: set up the modal to delay closing
        let resolveDismiss: (value: any) => void;
        const dismissPromise = new Promise((resolve) => {
          resolveDismiss = resolve;
        });
        modalControllerSpy.create.and.returnValue(
          Promise.resolve({
            present: () => Promise.resolve(),
            onDidDismiss: () => dismissPromise,
          } as any)
        );
        component.lang = 'en';
        component.targetLanguages = [
          { language: 'de', name: 'German' },
          { language: 'fr', name: 'French' },
        ];
        component.selectedTargetLanguageCodes = ['de', 'fr'];
        Object.defineProperty(component, 'maxTargetLanguages', { value: 5 });

        // Act: call openLanguageSelect and trigger change detection
        const openPromise = component.openLanguageSelect();
        fixture.detectChanges();

        // Assert: spinner should be visible while loading
        let spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(component.isLoading).withContext('isLoading during loading').toBeTrue();
        expect(spinner).withContext('spinner during loading').toBeTruthy();

        // Finish loading
        resolveDismiss!({ data: ['de', 'fr'] });
        await openPromise;
        fixture.detectChanges();

        // Spinner should be hidden after loading
        expect(component.isLoading).withContext('isLoading after loading').toBeFalse();
        spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(spinner).withContext('spinner after loading').toBeNull();
      });
    });
  });
});
