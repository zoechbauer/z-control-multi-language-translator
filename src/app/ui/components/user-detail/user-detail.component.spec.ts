import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { UtilsService } from 'src/app/services/utils.service';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { UserDetailComponent } from './user-detail.component';
import { TranslationGoogleTranslateService } from 'src/app/services/translation-google-translate.service';
import { DisplayMode } from 'src/app/shared/enums';

class ModalControllerMock {
  dismiss = jasmine.createSpy('dismiss');
  create = jasmine.createSpy('create');
}

describe('UserDetailComponent (unit)', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;
  let translateSpy: jasmine.SpyObj<TranslationGoogleTranslateService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  function getDisplayedUserStatistic(): any {
    return {
      userId: 'U-1',
      userName: 'User 1',
      userType: 'U',
      userCreatedAt: new Date('2026-03-09T00:00:00Z'),
      userLastUpdated: null,
      device: 'Device 1',
      isNative: false,
      deviceInfo: {
        appVersion: {
          major: 1,
          minor: 0,
          date: '2026-03-09',
        },
        language: 'en',
        platform: 'web-desktop',
        userAgent: 'user agent string',
      },
      displayedPlatform: 'web-desktop',
      displayedModel: 'Model 1',
      translationCount: 1234,
      targetLanguages: ['fr', 'en'],
      lastTranslationDate: new Date('2026-03-09T00:00:00Z'),
    };
  }

  beforeEach(waitForAsync(() => {
    translateSpy = jasmine.createSpyObj('TranslationGoogleTranslateService', [
      'getBaseLanguageName',
      'getFormattedTargetLanguageNamesForCodes',
    ]);
    translateSpy.getBaseLanguageName.and.returnValue(of('English (en)'));
    translateSpy.getFormattedTargetLanguageNamesForCodes.and.returnValue(
      Promise.resolve('')
    );

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), UserDetailComponent],
      providers: [
        provideIonicAngular(),
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: TranslationGoogleTranslateService,
          useValue: translateSpy,
        },
        {
          provide: ModalController,
          useFactory: () => new ModalControllerMock(),
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
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;

    mockTranslateService = TestBed.inject(
      TranslateService
    ) as jasmine.SpyObj<TranslateService>;

    component.lang = 'en';
    component.userStatistic = getDisplayedUserStatistic();
    component.displayMode = DisplayMode.User;

    fixture.detectChanges();
  }));

  it('should create the component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should call ModalController.dismiss when close() is called', () => {
    spyOn(component['modalCtrl'], 'dismiss').and.callThrough();
    component.close();
    expect(component['modalCtrl'].dismiss).toHaveBeenCalled();
  });

  describe('formatting and display logic', () => {
    it('should set targetLanguagesDisplay with formatted language names and line breaks', async () => {
      component.lang = 'en';
      translateSpy.getFormattedTargetLanguageNamesForCodes.and.returnValue(
        Promise.resolve('French (fr)<br/>English (en)')
      );

      const languages = ['fr', 'en'];

      await (<any>component).getTargetLanguagesWithLineBreak();
      await Promise.resolve();

      expect(
        translateSpy.getFormattedTargetLanguageNamesForCodes
      ).toHaveBeenCalledWith('en', languages);

      expect(component.targetLanguagesDisplay).toBe(
        'French (fr)<br/>English (en)'
      );
    });

    it('should return "native - Android App" for native platform', () => {
      component.userStatistic = {
        ...component.userStatistic,
        displayedPlatform: 'native',
      };
      expect(component.getDisplayedPlatform()).toBe('native - Android App');
    });

    it('should return the correct app version string format', () => {
      component.userStatistic.deviceInfo.appVersion = {
        major: 2,
        minor: 5,
        date: '2026-04-01',
      };
      expect(component.getAppVersion()).toBe('2.5 (2026-04-01)');
    });
  });

  describe('getFormatDateTime()', () => {
    it('should return formatted date/time string when dateTime is provided', () => {
      const dateTime = new Date('2026-03-09T00:00:00Z');
      const formattedDateTime = '2026-03-09 00:00';
      (
        component['utilsService'].formatDateTimeISO as jasmine.Spy
      ).and.returnValue(formattedDateTime);
      expect(component.getFormatDateTime(dateTime)).toBe(formattedDateTime);
    });

    it('should return empty string when dateTime is null', () => {
      const dateTime = null;
      expect(component.getFormatDateTime(dateTime)).toBe('');
    });
  });
});
