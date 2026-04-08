import { TranslateService } from '@ngx-translate/core';
import { FeedbackAccordionComponent } from './feedback-accordion.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('FeedbackAccordionComponent', () => {
  let component: FeedbackAccordionComponent;
  let fixture: ComponentFixture<FeedbackAccordionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeedbackAccordionComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();
    
    fixture = TestBed.createComponent(FeedbackAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
