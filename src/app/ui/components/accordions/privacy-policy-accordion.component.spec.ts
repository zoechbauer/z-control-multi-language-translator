import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { PrivacyPolicyAccordionComponent } from './privacy-policy-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('PrivacyPolicyAccordionComponent', () => {
  let component: PrivacyPolicyAccordionComponent;
  let fixture: ComponentFixture<PrivacyPolicyAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyAccordionComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
