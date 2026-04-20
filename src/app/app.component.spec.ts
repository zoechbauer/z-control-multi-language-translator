import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import { SafeAreaInsetsService } from './services/safe-area-insets.service';
import { SystemBarsService } from './services/system-bars.service';
import { FirebaseFirestoreService } from './services/firebase-firestore.service';
import { TextSpeechService } from './services/text-to-speech.service';
import { LocalStorageService } from './services/local-storage.service';
import { createTranslateServiceMock } from './testing/translate-service.mock';
import { CapacitorPlatformService } from './services/capacitor-platform.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: SafeAreaInsetsService,
          useValue: jasmine.createSpyObj('SafeAreaInsetsService', [
            'setSafeAreaInsetsFix',
          ]),
        },
        {
          provide: SystemBarsService,
          useValue: jasmine.createSpyObj('SystemBarsService', [
            'getCurrentIsDarkMode',
            'setBars',
          ]),
        },
        {
          provide: FirebaseFirestoreService,
          useValue: jasmine.createSpyObj('FirebaseFirestoreService', ['init']),
        },
        {
          provide: TextSpeechService,
          useValue: jasmine.createSpyObj('TextSpeechService', ['init']),
        },
        {
          provide: LocalStorageService,
          useValue: {
            initializeServicesAsync: jasmine
              .createSpy('initializeServicesAsync')
              .and.resolveTo(undefined),
            selectedLanguage$: of('de'),
            loadTargetLanguages: jasmine.createSpy('loadTargetLanguages'),
          },
        },
        {
          provide: CapacitorPlatformService,
          useValue: {
            hideSplashScreen: jasmine
              .createSpy('hideSplashScreen')
              .and.resolveTo(undefined),
            setStatusBarOverlay: jasmine
              .createSpy('setStatusBarOverlay')
              .and.resolveTo(undefined),
            showStatusBar: jasmine
              .createSpy('showStatusBar')
              .and.resolveTo(undefined),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  describe('class logic', () => {
    it('should create the app', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app).toBeTruthy();
    });

    describe('ngOnInit', () => {
      it('should call initializeApp', () => {
        spyOn(component, 'initializeApp');
        component.ngOnInit();
        expect(component.initializeApp).toHaveBeenCalled();
      });
    });

    describe('initializeApp', () => {
      it('should initialize services and set system bars for native app', async () => {
        component.isNativeApp = true;

        const safeAreaInsetsService = TestBed.inject(
          SafeAreaInsetsService
        ) as jasmine.SpyObj<SafeAreaInsetsService>;
        const systemBarsService = TestBed.inject(
          SystemBarsService
        ) as jasmine.SpyObj<SystemBarsService>;
        const firestoreService = TestBed.inject(
          FirebaseFirestoreService
        ) as jasmine.SpyObj<FirebaseFirestoreService>;
        const textSpeechService = TestBed.inject(
          TextSpeechService
        ) as jasmine.SpyObj<TextSpeechService>;
        const localStorageService = TestBed.inject(LocalStorageService) as any;

        await component.initializeApp();

        expect(safeAreaInsetsService.setSafeAreaInsetsFix).toHaveBeenCalled();
        expect(systemBarsService.getCurrentIsDarkMode).toHaveBeenCalled();
        expect(systemBarsService.setBars).toHaveBeenCalled();
        expect(firestoreService.init).toHaveBeenCalled();
        expect(textSpeechService.init).toHaveBeenCalled();
        expect(localStorageService.initializeServicesAsync).toHaveBeenCalled();
      });
    });
  });

  describe('template rendering', () => {
    it('should render ion-app element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('ion-app')).toBeTruthy();
    });

    it('should render ion-router-outlet element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('ion-router-outlet')).toBeTruthy();
    });

    describe('should add or remove classes on body element based on platform', () => {
      it('should add native-app class to body for native platform', async () => {
        component.isNativeApp = true;
        await component.initializeApp();
        expect(document.body.classList.contains('native-app')).toBeTrue();
      });

      it('should add web-app class for web platform', async () => {
        component.isNativeApp = false;
        await component.initializeApp();
        expect(document.body.classList.contains('web-app'))
          .withContext('web-app class')
          .toBeTrue();
      });
    });

    describe('should add or remove classes on body.div element based on platform and tabs bar visibility', () => {
      it('should add web-app-width to body for web platform', async () => {
        component.isNativeApp = false;
        fixture.detectChanges();

        const bodyDiv = fixture.nativeElement.querySelector('div');
        expect(bodyDiv?.classList.contains('web-app-width')).toBeTrue();
      });

      it('should add native-app-height-show-tabs-bar for native platform with tabs bar', async () => {
        component.isNativeApp = true;
        component.showTabsBar = true;
        fixture.detectChanges();

        const bodyDiv = fixture.nativeElement.querySelector('div');
        expect(
          bodyDiv?.classList.contains('native-app-height-show-tabs-bar')
        ).toBeTrue();
      });

      it('should not add native-app-height-show-tabs-bar for native platform without tabs bar', async () => {
        component.isNativeApp = true;
        component.showTabsBar = false;
        fixture.detectChanges();

        const bodyDiv = fixture.nativeElement.querySelector('div');
        expect(bodyDiv.classList.contains('native-app-height-show-tabs-bar'))
          .withContext('native-app-height-show-tabs-bar class')
          .toBeFalse();
        expect(bodyDiv.classList.contains('native-app-height-hide-tabs-bar'))
          .withContext('native-app-height-hide-tabs-bar class')
          .toBeTrue();
      });
    });
  });
});
