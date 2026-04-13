import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { LanguageAccordionComponent } from './language-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { LocalStorageService } from 'src/app/services/local-storage.service';

describe('LanguageAccordionComponent', () => {
  let component: LanguageAccordionComponent;
  let fixture: ComponentFixture<LanguageAccordionComponent>;
  let selectedLanguageName$: BehaviorSubject<string>;

  function getNormalizedText(): string {
    return (fixture.nativeElement.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  beforeEach(async () => {
    selectedLanguageName$ = new BehaviorSubject<string>('English');

    const localStorageMock: Partial<LocalStorageService> = {
      selectedLanguageName$,
    };

    await TestBed.configureTestingModule({
      imports: [LanguageAccordionComponent],
      providers: [
        { provide: LocalStorageService, useValue: localStorageMock },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('template rendering', () => {
    it('should render german template when lang is de', () => {
      component.lang = 'de';
      fixture.detectChanges();

      const text = getNormalizedText();

      expect(text).toContain('Hinweis');
      expect(text).toContain(
        'Die App-Sprache wird standardmäßig von den Spracheinstellungen Ihres Geräts bestimmt.'
      );
      expect(text).not.toContain('Note');
    });

    it('should render english template when lang is en', () => {
      component.lang = 'en';
      fixture.detectChanges();

      const text = getNormalizedText();

      expect(text).toContain('Note');
      expect(text).toContain(
        "The app language defaults to your device's language setting."
      );
      expect(text).not.toContain('Hinweis');
    });

    it('should fallback to english template when lang is not de', () => {
      component.lang = 'fr';
      fixture.detectChanges();

      const text = getNormalizedText();

      expect(text).toContain('Note');
      expect(text).not.toContain('Hinweis');
    });

    it('should render language select options for en and de', () => {
      fixture.detectChanges();

      const enOption = fixture.nativeElement.querySelector(
        'ion-select-option[value="en"]'
      );
      const deOption = fixture.nativeElement.querySelector(
        'ion-select-option[value="de"]'
      );

      expect(enOption).toBeTruthy();
      expect(deOption).toBeTruthy();
    });

    it('should show selected language name from LocalStorageService stream', () => {
      fixture.detectChanges();

      const headerSpan = fixture.nativeElement.querySelector('ion-label span');
      expect(headerSpan).toBeTruthy();
      expect((headerSpan.textContent || '').trim()).toBe('English');
    });

    it('should update header language name when stream emits new value', () => {
      selectedLanguageName$.next('Deutsch');
      fixture.detectChanges();

      const headerSpan = fixture.nativeElement.querySelector('ion-label span');
      expect(headerSpan).toBeTruthy();
      expect((headerSpan.textContent || '').trim()).toBe('Deutsch');
    });
  });
});
