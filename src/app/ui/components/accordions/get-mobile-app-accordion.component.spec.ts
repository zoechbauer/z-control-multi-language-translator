import { TranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetMobileAppAccordionComponent } from './get-mobile-app-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('GetMobileAppAccordionComponent', () => {
  let component: GetMobileAppAccordionComponent;
  let fixture: ComponentFixture<GetMobileAppAccordionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GetMobileAppAccordionComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GetMobileAppAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
