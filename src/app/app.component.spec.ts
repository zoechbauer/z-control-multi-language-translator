import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import { SafeAreaInsetsService } from './services/safe-area-insets.service';
import { SystemBarsService } from './services/system-bars.service';
import { FirebaseFirestoreService } from './services/firebase-firestore.service';
import { TextSpeechService } from './services/text-to-speach.service';
import { LocalStorageService } from './services/local-storage.service';
import { createTranslateServiceMock } from './testing/translate-service.mock';

describe('AppComponent', () => {
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
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
