import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { UserStatisticComponent } from './user-statistic.component';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils-service';
import { UtilsService } from 'src/app/services/utils.service';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('UserStatisticComponent', () => {
  let component: UserStatisticComponent;
  let fixture: ComponentFixture<UserStatisticComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), UserStatisticComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: FirebaseFirestoreUtilsService,
          useValue: {
            statisticsRefresh$: of(void 0),
            isContingentExceeded: jasmine
              .createSpy('isContingentExceeded')
              .and.resolveTo(false),
            getDisplayedUserContingentData: jasmine
              .createSpy('getDisplayedUserContingentData')
              .and.resolveTo([]),
          },
        },
        {
          provide: UtilsService,
          useValue: {
            isPortrait: true,
            isNative: false,
            formatDateTimeISO: jasmine
              .createSpy('formatDateTimeISO')
              .and.returnValue('2026-03-09 00:00'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserStatisticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
