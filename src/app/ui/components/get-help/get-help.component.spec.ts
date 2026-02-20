import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { HelpModalComponent } from './help-modal.component';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';

describe('HelpModalComponent', () => {
  let component: HelpModalComponent;
  let fixture: ComponentFixture<HelpModalComponent>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockLocalStorageService: jasmine.SpyObj<LocalStorageService>;
  let mockUtilsService: jasmine.SpyObj<UtilsService>;

  beforeEach(async () => {
    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'dismiss',
      'create',
    ]);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
    ]);
    const localStorageServiceSpy = jasmine.createSpyObj(
      'LocalStorageService',
      [],
      {
        selectedLanguage$: of('de'),
      }
    );
    const utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['scrollToElement'],
      {
        isPortrait: true,
        isNative: true,
      }
    );

    await TestBed.configureTestingModule({
      declarations: [HelpModalComponent],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: UtilsService, useValue: utilsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpModalComponent);
    component = fixture.componentInstance;

    mockModalController = TestBed.inject(
      ModalController
    ) as jasmine.SpyObj<ModalController>;
    mockTranslateService = TestBed.inject(
      TranslateService
    ) as jasmine.SpyObj<TranslateService>;
    mockLocalStorageService = TestBed.inject(
      LocalStorageService
    ) as jasmine.SpyObj<LocalStorageService>;
    mockUtilsService = TestBed.inject(
      UtilsService
    ) as jasmine.SpyObj<UtilsService>;

    mockTranslateService.instant.and.returnValue('Translated Text');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to selectedLanguage$ and set up event listeners', () => {
      spyOn(window, 'addEventListener');
      spyOn(component as any, 'orientationListener');

      component.ngOnInit();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'resize',
        jasmine.any(Function)
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'orientationchange',
        jasmine.any(Function)
      );
      expect((component as any).orientationListener).toHaveBeenCalled();
    });

    it('should call setScrollToTopObj when language changes', () => {
      spyOn(component as any, 'setScrollToTopObj');
      mockLocalStorageService.selectedLanguage$ = of('en');

      component.ngOnInit();

      expect((component as any).setScrollToTopObj).toHaveBeenCalled();
    });

    it('should scroll to section if exists', fakeAsync(() => {
      component.scrollToSection = 'toc-section';

      component.ngOnInit();
      tick(600);

      expect(mockUtilsService.scrollToElement).toHaveBeenCalledWith(
        'toc-section'
      );
    }));
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe and remove event listeners', () => {
      spyOn(window, 'removeEventListener');
      component.ngOnInit(); // Set up subscription first

      component.ngOnDestroy();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'resize',
        jasmine.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'orientationchange',
        jasmine.any(Function)
      );
    });
  });

  describe('setScrollToTopObj', () => {
    it('should set German scroll object when language is de', () => {
      component.selectedLanguage = 'de';
      mockTranslateService.instant.and.returnValue('Nach oben scrollen');

      (component as any).setScrollToTopObj();

      expect(component.scrollToTopObj.id).toBe('toc-DE');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'SCROLL_TO_TOP_DE'
      );
    });

    it('should set English scroll object when language is en', () => {
      component.selectedLanguage = 'en';
      mockTranslateService.instant.and.returnValue('Scroll to top');

      (component as any).setScrollToTopObj();

      expect(component.scrollToTopObj.id).toBe('toc');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'SCROLL_TO_TOP_EN'
      );
    });
  });

  describe('dismissModal', () => {
    it('should call modalController.dismiss', () => {
      component.dismissModal();

      expect(mockModalController.dismiss).toHaveBeenCalled();
    });
  });

  describe('scrollToTop', () => {
    it('should scroll to top element', () => {
      component.scrollToTopObj.id = 'toc-DE';
      component.scrollToTop();

      expect(mockUtilsService.scrollToElement).toHaveBeenCalledWith('toc-DE');
    });

    it('should handle when top element does not exist', () => {
      component.scrollToTopObj.id = 'non-existent-id';
      component.scrollToTop();

      expect(() => mockUtilsService.scrollToElement).not.toThrow();
    });
  });

  describe('orientationListener', () => {
    it('should update isPortrait based on utilsServiceSpy', () => {
      (component as any).orientationListener();

      expect(component.isPortrait).toBe(true);
    });
  });

  describe('initialization', () => {
    it('should initialize isPortrait based on current orientation', () => {
      const newComponent = new HelpModalComponent(
        mockUtilsService,
        mockModalController,
        mockTranslateService,
        mockLocalStorageService
      );

      expect(newComponent.isPortrait).toBe(true);
    });
  });

  describe('getters', () => {
    it('should return isNative from utilsService', () => {
      expect(component.isNative).toBe(true);
    });

    it('should return email subject help text for native app', () => {
      spyOnProperty(component, 'isNative', 'get').and.returnValue(true);

      expect(component.isNative).toBe(true);
      expect(component.emailSubjectHelpText).toBe('Translated Text');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'HELP_EMAIL_SUBJECT'
      );
    });

    it('should return email subject help text for web app', () => {
      spyOnProperty(component, 'isNative', 'get').and.returnValue(false);

      expect(component.isNative).toBe(false);
      expect(component.emailSubjectHelpText).toBe('Translated Text');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'HELP_EMAIL_SUBJECT_WEB'
      );
    });

    it('should return device text for native app', () => {
      spyOnProperty(component, 'isNative', 'get').and.returnValue(true);

      expect(component.isNative).toBe(true);
      expect(component.deviceText).toBe('Translated Text');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'HELP_DEVICE_TEXT'
      );
    });

    it('should return device text for web app', () => {
      spyOnProperty(component, 'isNative', 'get').and.returnValue(false);

      expect(component.isNative).toBe(false);
      expect(component.deviceText).toBe('Translated Text');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'HELP_DEVICE_TEXT_WEB'
      );
    });

    it('should return language change button help text for native app', () => {
      spyOnProperty(component, 'isNative', 'get').and.returnValue(true);

      expect(component.isNative).toBe(true);
      expect(component.languageChangeButtonHelpText).toBe('Translated Text');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'HELP_LANGUAGE_CHANGE_BUTTON'
      );
    });

    it('should return language change button help text for web app', () => {
      spyOnProperty(component, 'isNative', 'get').and.returnValue(false);

      expect(component.isNative).toBe(false);
      expect(component.languageChangeButtonHelpText).toBe('Translated Text');
      expect(mockTranslateService.instant).toHaveBeenCalledWith(
        'HELP_LANGUAGE_CHANGE_WEB_BUTTON'
      );
    });
  });
});
