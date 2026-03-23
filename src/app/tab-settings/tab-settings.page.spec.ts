import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { TabSettingsPage } from './tab-settings.page';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { TextSpeechService } from '../services/text-to-speech.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { createTranslateServiceMock } from '../testing/translate-service.mock';

describe('TabSettingsPage', () => {
  let component: TabSettingsPage;
  let fixture: ComponentFixture<TabSettingsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TabSettingsPage],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: LocalStorageService,
          useValue: {
            selectedLanguage$: of('de'),
            textToSpeechValues$: of({ rate: 1, pitch: 1 }),
            loadTargetLanguages: jasmine.createSpy('loadTargetLanguages'),
            saveSelectedLanguage: jasmine.createSpy('saveSelectedLanguage'),
            targetLanguagesSubject: { getValue: () => [] },
            saveTargetLanguages: jasmine.createSpy('saveTargetLanguages'),
            saveTextToSpeechValues: jasmine.createSpy('saveTextToSpeechValues'),
          },
        },
        {
          provide: UtilsService,
          useValue: {
            showOrHideIonTabBar: jasmine.createSpy('showOrHideIonTabBar'),
            logoClicked$: of(void 0),
            isNative: false,
          },
        },
        {
          provide: TextSpeechService,
          useValue: jasmine.createSpyObj('TextSpeechService', [
            'updateTtsSupportedLanguagesMap',
          ]),
        },
        {
          provide: FirebaseFirestoreService,
          useValue: jasmine.createSpyObj('FirebaseFirestoreService', ['init']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabSettingsPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
