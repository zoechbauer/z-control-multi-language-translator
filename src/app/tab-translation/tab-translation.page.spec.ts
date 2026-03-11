import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { TabTranslationPage } from './tab-translation.page';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';
import { ToastService } from '../services/toast.service';
import { TextSpeechService } from '../services/text-to-speach.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils-service';
import { createTranslateServiceMock } from '../testing/translate-service.mock';

describe('TabTranslationPage', () => {
  let component: TabTranslationPage;
  let fixture: ComponentFixture<TabTranslationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TabTranslationPage],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        { provide: LocalStorageService, useValue: {} },
        {
          provide: UtilsService,
          useValue: { isNative: false, isPortrait: true },
        },
        { provide: TranslationGoogleTranslateService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: TextSpeechService, useValue: {} },
        { provide: FirebaseFirestoreService, useValue: {} },
        { provide: FirebaseFirestoreUtilsService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabTranslationPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
