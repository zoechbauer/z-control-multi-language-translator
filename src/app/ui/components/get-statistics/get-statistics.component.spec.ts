import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { GetStatisticsComponent } from './get-statistics.component';
import { FirebaseFirestoreService } from 'src/app/services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { UtilsService } from 'src/app/services/utils.service';
import { DisplayMode } from 'src/app/shared/enums';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('GetStatisticsComponent', () => {
  let component: GetStatisticsComponent;
  let fixture: ComponentFixture<GetStatisticsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), GetStatisticsComponent],
      providers: [
        {
          provide: FirebaseFirestoreService,
          useValue: {
            programmerDeviceRefresh$: of(void 0),
            isProgrammerDevice: false,
            readContingentData: jasmine
              .createSpy('readContingentData')
              .and.resolveTo({}),
            getTotalCharCount: jasmine
              .createSpy('getTotalCharCount')
              .and.resolveTo(0),
          },
        },
        {
          provide: FirebaseFirestoreUtilsService,
          useValue: {
            statisticsRefresh$: of(void 0),
            getDisplayedUserStatistics: jasmine
              .createSpy('getDisplayedUserStatistics')
              .and.resolveTo({
                displayedUserStatistics: [],
                userTranslationStatistics: [],
                users: [],
                programmerDeviceUIDs: [],
              }),
          },
        },
        {
          provide: LocalStorageService,
          useValue: {
            loadFirestoreUid: jasmine
              .createSpy('loadFirestoreUid')
              .and.resolveTo('uid-test'),
            statisticsDisplayMode$: of(DisplayMode.User),
            getStatisticsDisplayMode: jasmine
              .createSpy('getStatisticsDisplayMode')
              .and.resolveTo(DisplayMode.User),
            saveStatisticsDisplayMode: jasmine
              .createSpy('saveStatisticsDisplayMode')
              .and.resolveTo(undefined),
          },
        },
        {
          provide: UtilsService,
          useValue: { isPortrait: false },
        },
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GetStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
