import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserStatisticComponent } from './user-statistic.component';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils.service';
import { UtilsService } from 'src/app/services/utils.service';
import { createTranslateServiceMock } from '@testing/translate-service.mock';

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

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should unsubscribe from all subscriptions on destroy', () => {
      const subscription1 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      const subscription2 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
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

  describe('template rendering', () => {
    describe('title and subtitle', () => {
      it('should display title with year and month', waitForAsync(async () => {
        TestBed.resetTestingModule();

        const localUtilsSpy = jasmine.createSpyObj(
          'UtilsService',
          ['formatDateTimeISO'],
          {
            isPortrait: true,
            isNative: false,
          }
        );

        await TestBed.configureTestingModule({
          imports: [
            IonicModule.forRoot(),
            UserStatisticComponent,
            TranslateModule.forRoot(),
          ],
          providers: [
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
              useValue: localUtilsSpy,
            },
          ],
        }).compileComponents();

        const realFixture = TestBed.createComponent(UserStatisticComponent);
        const realComponent = realFixture.componentInstance;
        const translate = TestBed.inject(TranslateService);

        translate.setTranslation(
          'en',
          {
            TRANSLATE_STATISTICS: {
              CARD: {
                TITLE: 'Monthly contingent {{yearMonth}}',
              },
            },
          },
          true
        );
        translate.use('en');

        realComponent.yearMonth = '2024-06';
        realFixture.detectChanges();
        await realFixture.whenStable();
        realFixture.detectChanges();

        const compiled = realFixture.nativeElement as HTMLElement;
        const title = compiled.querySelector('ion-card-title');

        expect(title?.textContent).toContain('Monthly contingent 2024-06');
      }));

      it('should display subtitle', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const subtitle = compiled.querySelector('ion-card-subtitle');
        expect(subtitle?.textContent).toContain(
          `TRANSLATE_STATISTICS.CARD.SUBTITLE`
        );
      });
    });

    describe('contingent exceeded info', () => {
      it('should display contingent statistic when contingent is not exceeded', waitForAsync(async () => {
        const firestoreUtilsService = TestBed.inject(
          FirebaseFirestoreUtilsService
        ) as jasmine.SpyObj<FirebaseFirestoreUtilsService>;

        firestoreUtilsService.isContingentExceeded.and.resolveTo(false);

        await (component as any).updateIsContingentExceeded();
        fixture.detectChanges();

        const statisticsInfo =
          fixture.nativeElement.querySelector('.statistics-info');
        const contingentExceededInfo = fixture.nativeElement.querySelector(
          '.contingent-exceeded'
        );

        expect(statisticsInfo).toBeTruthy();
        expect(contingentExceededInfo).toBeFalsy();
      }));

      it('should display contingent exceeded info when contingent is exceeded', waitForAsync(async () => {
        const firestoreUtilsService = TestBed.inject(
          FirebaseFirestoreUtilsService
        ) as jasmine.SpyObj<FirebaseFirestoreUtilsService>;

        firestoreUtilsService.isContingentExceeded.and.resolveTo(true);

        await (component as any).updateIsContingentExceeded();
        fixture.detectChanges();

        const statisticsInfo =
          fixture.nativeElement.querySelector('.statistics-info');
        const contingentExceededInfo = fixture.nativeElement.querySelector(
          '.contingent-exceeded'
        );

        expect(statisticsInfo).toBeFalsy();
        expect(contingentExceededInfo).toBeTruthy();
      }));
    });
  });
});
