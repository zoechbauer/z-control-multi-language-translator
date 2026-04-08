import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { LanguageAccordionComponent } from './language-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { LocalStorageService } from 'src/app/services/local-storage.service';

describe('LanguageAccordionComponent', () => {
  let component: LanguageAccordionComponent;
  let fixture: ComponentFixture<LanguageAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageAccordionComponent],
      providers: [
        { provide: LocalStorageService, useValue: {} },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
