import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { UserStatisticComponent } from './user-statistic.component';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils.service';
import { UtilsService } from 'src/app/services/utils.service';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('UserStatisticComponent', () => {
  let component: UserStatisticComponent;
  let fixture: ComponentFixture<UserStatisticComponent>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;

  beforeEach(waitForAsync(() => {
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['formatDateTimeISO'],
      {
        isPortrait: true,
        isNative: false,
      }
    );

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
          useValue: utilsServiceSpy,
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

  it('should unsubscribe from all subscriptions on destroy', () => {
    const subscription1 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    const subscription2 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    Object.defineProperty(component, 'subscriptions', {
      value: [subscription1, subscription2],
    });

    component.ngOnDestroy();

    expect(subscription1.unsubscribe).toHaveBeenCalled();
    expect(subscription2.unsubscribe).toHaveBeenCalled();
  });

  describe('hideColumn', () => {
    it('should hide column when device is portrait and native', () => {
      Object.defineProperty(utilsServiceSpy, 'isPortrait', { value: true });
      Object.defineProperty(utilsServiceSpy, 'isNative', { value: true });
      expect(component.hideColumn).toBeTrue();
    });

    it('should not hide column when device is not portrait', () => {
      Object.defineProperty(utilsServiceSpy, 'isPortrait', { value: false });
      Object.defineProperty(utilsServiceSpy, 'isNative', { value: true });
      expect(component.hideColumn).toBeFalse();
    });

    it('should not hide column when device is not native', () => {
      Object.defineProperty(utilsServiceSpy, 'isPortrait', { value: true });
      Object.defineProperty(utilsServiceSpy, 'isNative', { value: false });
      expect(component.hideColumn).toBeFalse();
    });
  });
});
