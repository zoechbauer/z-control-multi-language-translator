import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GetMobileAppComponent } from './get-mobile-app.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('GetMobileAppComponent', () => {
  let component: GetMobileAppComponent;
  let fixture: ComponentFixture<GetMobileAppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        GetMobileAppComponent,
      ],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GetMobileAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
