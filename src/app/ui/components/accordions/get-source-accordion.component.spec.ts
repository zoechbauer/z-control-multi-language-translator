import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { GetSourceAccordionComponent } from './get-source-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('GetSourceAccordionComponent', () => {
  let component: GetSourceAccordionComponent;
  let fixture: ComponentFixture<GetSourceAccordionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GetSourceAccordionComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GetSourceAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
