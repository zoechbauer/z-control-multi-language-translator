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
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;

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
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['formatDateTimeISO', 'formatDateISO'],
      {
        isPortrait: true,
        isNative: false,
      }
    );
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
          useValue: utilsServiceSpy,
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

  describe('formatDateTimeISO()', () => {
    beforeEach(() => {
      utilsServiceSpy.formatDateTimeISO.calls.reset();
      component.displayMode = DisplayMode.Programmer;
    });

    it('should call UtilsService.formatDateTimeISO when dateTime is valid', () => {
      component.getFormatDateTime(new Date('2026-03-09T00:00:00Z'));
      expect(utilsServiceSpy.formatDateTimeISO).toHaveBeenCalledWith(
        new Date('2026-03-09T00:00:00Z')
      );
    });

    it('should call UtilsService.formatDateTimeISO when dateTime is invalid', () => {
      component.getFormatDateTime(new Date('invalid-date'));

      expect(utilsServiceSpy.formatDateTimeISO).toHaveBeenCalled();
      const callArg =
        utilsServiceSpy.formatDateTimeISO.calls.mostRecent().args[0];
      expect(callArg instanceof Date).toBeTrue();
      expect(Number.isNaN(callArg!.getTime())).toBeTrue(); // Invalid Date
    });

    it('should call UtilsService.formatDateTimeISO when dateTime is null', () => {
      component.getFormatDateTime(null);
      expect(utilsServiceSpy.formatDateTimeISO).toHaveBeenCalledWith(null);
    });
  });

  describe('formatDateISO()', () => {
    beforeEach(() => {
      utilsServiceSpy.formatDateISO.calls.reset();
      component.displayMode = DisplayMode.User;
    });

    it('should call UtilsService.formatDateISO when dateTime is valid', () => {
      component.getFormatDateTime(new Date('2026-03-09T00:00:00Z'));
      expect(utilsServiceSpy.formatDateISO).toHaveBeenCalledWith(
        new Date('2026-03-09T00:00:00Z')
      );
    });

    it('should call UtilsService.formatDateISO when dateTime is invalid', () => {
      component.getFormatDateTime(new Date('invalid-date'));

      expect(utilsServiceSpy.formatDateISO).toHaveBeenCalled();
      const callArg =
        utilsServiceSpy.formatDateISO.calls.mostRecent().args[0];
      expect(callArg instanceof Date).toBeTrue();
      expect(Number.isNaN(callArg!.getTime())).toBeTrue(); // Invalid Date
    });

    it('should call UtilsService.formatDateISO when dateTime is null', () => {
      component.getFormatDateTime(null);
      expect(utilsServiceSpy.formatDateISO).toHaveBeenCalledWith(null);
    });
  });
});
