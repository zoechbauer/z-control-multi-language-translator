import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { LanguageMultiSelectComponent } from './language-multi-select.component';
import { createTranslateServiceMock } from '@testing/translate-service.mock';
import { AppConstants } from 'src/app/shared/app.constants';
import { GoogleLanguage } from 'src/app/services/translation-google-translate.service';

describe('LanguageMultiSelectComponent', () => {
  let component: LanguageMultiSelectComponent;
  let fixture: ComponentFixture<LanguageMultiSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), LanguageMultiSelectComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: ModalController,
          useValue: jasmine.createSpyObj('ModalController', ['dismiss']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getter', () => {
    it('should return correct maxTargetLanguages', () => {
      expect(component.maxTargetLanguages).toBe(
        AppConstants.maxTargetLanguages
      );
    });

    it('should return correct selectedLanguagesCount', () => {
      component.selection.add('en');
      component.selection.add('de');
      expect(component.selectedLanguagesCount).toBe(2);
    });

    it('should return correct selectedLanguages', () => {
      component.baseLang = 'de';
      component.selection.add('en');
      component.selection.add('nl');
      const sortedSelection = Array.from(component.selection).sort((a, b) =>
        a.localeCompare(b)
      );

      const expected = component.baseLang + ' -> ' + sortedSelection.join(',');
      expect(component.selectedLanguages).toBe(expected);
    });
  });

  describe('getCheckboxTooltip', () => {
    it('should return correct tooltip for unchecked language', () => {
      spyOn(component, 'isChecked').and.returnValue(false);
      const tooltip = component.getCheckboxTooltip('en');
      expect(tooltip).toBe(
        'SETTINGS.TARGET_LANGUAGES.MODAL.SEARCH.TOOLTIPS.SELECT_TARGET_LANG'
      );
    });

    it('should return correct tooltip for checked language', () => {
      spyOn(component, 'isChecked').and.returnValue(true);
      const tooltip = component.getCheckboxTooltip('en');
      expect(tooltip).toBe(
        'SETTINGS.TARGET_LANGUAGES.MODAL.SEARCH.TOOLTIPS.DESELECT_TARGET_LANG'
      );
    });
  });

  describe('isChecked', () => {
    it('should return true if language is in selection', () => {
      component.selection.add('en');
      expect(component.isChecked('en')).toBeTrue();
    });

    it('should return false if language is not in selection', () => {
      expect(component.isChecked('en')).toBeFalse();
    });
  });

  describe('toggle', () => {
    it('should add language to selection if not already selected and under limit', () => {
      component.toggle({ language: 'en', name: 'English' });
      expect(component.selection.has('en')).toBeTrue();
    });

    it('should remove language from selection if already selected', () => {
      component.selection.add('en');
      component.toggle({ language: 'en', name: 'English' });
      expect(component.selection.has('en')).toBeFalse();
    });

    it('should not add language if selection is at max limit', () => {
      for (let i = 0; i < component.maxTargetLanguages; i++) {
        component.selection.add(`lang${i}`);
      }
      component.toggle({ language: 'en', name: 'English' });
      expect(component.selection.has('en')).toBeFalse();
    });
  });

  describe('closeModal', () => {
    it('should call modalController.dismiss with selected languages', () => {
      component.selection.add('en');
      component.selection.add('de');

      component.closeModal();

      expect(
        (TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>)
          .dismiss
      ).toHaveBeenCalledWith(['en', 'de']);
    });
  });

  describe('filter', () => {
    let allLanguages: GoogleLanguage[];

    beforeEach(() => {
      allLanguages = [
        { language: 'en', name: 'English' },
        { language: 'de', name: 'German' },
        { language: 'nl', name: 'Dutch' },
      ];
    });

    it('should filter languages based on search term', () => {
      component.allLanguages = allLanguages;
      const ev = { target: { value: 'en' } };

      component.filter(ev);

      expect(component.filteredLanguages).toEqual([
        { language: 'en', name: 'English' },
      ]);
      expect(component.searchTerm).toBe('en');
    });

    it('should reset filteredLanguages when search term is cleared', () => {
      component.allLanguages = allLanguages;
      const ev = { target: { value: '' } };

      component.filter(ev);

      expect(component.filteredLanguages).toEqual(allLanguages);
      expect(component.searchTerm).toBe('');
    });

    it('should be case insensitive when filtering languages', () => {
      component.allLanguages = allLanguages;
      const ev = { target: { value: 'EN' } };

      component.filter(ev);

      expect(component.filteredLanguages).toEqual([
        { language: 'en', name: 'English' },
      ]);
      expect(component.searchTerm).toBe('en');
    });

    it('should return empty array if no languages match search term', () => {
      component.allLanguages = allLanguages;
      const ev = { target: { value: 'xyz' } };

      component.filter(ev);

      expect(component.filteredLanguages).toEqual([]);
      expect(component.searchTerm).toBe('xyz');
    });

    it('should add all selected languages to filteredLanguages when filtered lang button is clicked', () => {
      component.allLanguages = allLanguages;
      component.selection.add('en');
      component.selection.add('de');
      component.searchTerm = 'fr';
      component.filterSelectedLanguages();

      expect(component.filteredLanguages).toEqual([
        { language: 'en', name: 'English' },
        { language: 'de', name: 'German' },
      ]);
      expect(component.searchTerm).toBe('fr');
    });

    it('should clear search and reset filteredLanguages when clearSearch is called', () => {
      component.allLanguages = allLanguages;
      const ev = { target: { value: 'en' } };
      component.filter(ev);
      expect(component.filteredLanguages).toEqual([
        { language: 'en', name: 'English' },
      ]);
      expect(component.searchTerm).toBe('en');

      component.clearSearch(ev);

      expect(component.filteredLanguages).toEqual(allLanguages);
      expect(component.searchTerm).toBe('');
    });
  });

  describe('ngOnInit', () => {
    it('should initialize filteredLanguages and selection based on inputs', () => {
      component.baseLang = 'de';
      component.allLanguages = [
        { language: 'en', name: 'English' },
        { language: 'de', name: 'German' },
        { language: 'nl', name: 'Dutch' },
      ];
      component.selectedCodes = ['de'];

      component.ngOnInit();

      expect(component.filteredLanguages).toEqual(component.allLanguages);
      expect(component.selection.has('de')).toBeTrue();
    });
  });
});
