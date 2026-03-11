import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';

import { LanguageMultiSelectComponent } from './language-multi-select.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

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
});
