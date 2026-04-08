import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { ChangeLogAccordionComponent } from './change-log-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('ChangeLogAccordionComponent', () => {
  let component: ChangeLogAccordionComponent;
  let fixture: ComponentFixture<ChangeLogAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeLogAccordionComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeLogAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit ionChange event when openChangelog is called', () => {
    spyOn(component.ionChange, 'emit');
    component.openChangelog();
    expect(component.ionChange.emit).toHaveBeenCalled();
  });
});
