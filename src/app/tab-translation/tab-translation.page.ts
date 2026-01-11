import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonRow,
  IonIcon,
  IonTextarea,
} from '@ionic/angular/standalone';
import { AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../ui/components/header/header.component';
import { Tab, ToastAnchor } from '../enums';
import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';
import { AppConstants } from '../shared/app.constants';
import { ToastService } from '../services/toast.service';
import { TextSpeechService } from '../services/text-to-speach.service';

interface TranslationResult {
  [lang: string]: string;
}

interface Translation {
  language: string;
  translatedText: string;
}

@Component({
  selector: 'app-tab-translation',
  templateUrl: 'tab-translation.page.html',
  styleUrls: ['tab-translation.page.scss'],
  imports: [
    IonIcon,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonCol,
    IonContent,
    IonGrid,
    IonIcon,
    IonRow,
    IonTextarea,
    FormsModule,
    HeaderComponent,
    TranslatePipe,
    AsyncPipe,
  ],
})
export class TabTranslationPage implements OnInit, OnDestroy {
  Tab = Tab;
  text: string = '';
  baseLang: string = 'de';
  baseLangString: string = 'Deutsch (de)';
  translations: Translation[] = [];
  selectedLanguages: string[] = [];
  textareaDisabled: boolean = false;
  translateBtnDisabled: boolean = false;
  clearBtnDisabled: boolean = false;

  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public localStorage: LocalStorageService,
    public readonly utilsService: UtilsService,
    private readonly googleTranslateService: TranslationGoogleTranslateService,
    private readonly toastService: ToastService,
    private readonly ttsService: TextSpeechService
  ) {}

  get maxInputLength(): number {
    return AppConstants.maxInputLength;
  }

  get maxTargetLanguages(): number {
    return AppConstants.maxTargetLanguages;
  }

  ngOnInit() {
    this.text = '';
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
    this.localStorage.initializeServicesAsync(this.translate).then(() => {
      this.setupSubscriptions();
    });
    this.initFormControls();
  }

  getTranslationPlaceholder(): string {
    return this.selectedLanguages.length === 0
      ? this.translate.instant('TRANSLATE.CARD.PLACEHOLDER.NO_TARGET_LANGUAGES')
      : this.translate.instant('TRANSLATE.CARD.PLACEHOLDER.INPUT_TEXT');
  }

  onTextareaInput(): void {
    const hasText = this.text.trim().length > 0;
    this.translateBtnDisabled = !hasText;
    this.clearBtnDisabled = !hasText;
  }

  translateText(): void {
    if (!this.text.trim()) {
      return;
    }
    this.disableFormControls();
    this.translations = [];

    this.selectedLanguages.forEach((translateToLang: string) => {
      this.googleTranslateService
        .translateText(this.text, this.baseLang, translateToLang)
        .subscribe((result) => {
          // Defensive: result may be undefined/null or not have the key
          const translatedText = result?.[translateToLang] ?? '';
          this.translations.push({
            language: translateToLang,
            translatedText,
          });
          this.translations.sort((a, b) =>
            a.language.localeCompare(b.language)
          );
        });
    });
    this.toastService.showToast(
      this.translate.instant('TRANSLATE.CARD_RESULTS.TOAST.TEXT_TRANSLATED'),
      ToastAnchor.TRANSLATE_PAGE
    );
  }

  async speak(text: string, lang: string) {
    try {
      await this.ttsService.speak(text, lang);
    } catch (err) {
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.SPEAK_NOT_SUPPORTED'
        ),
        ToastAnchor.TRANSLATE_PAGE
      );
      console.error('TTS error:', err);
    }
  }

  clear(): void {
    this.initFormControls();
  }

  getTextareaRows(): string {
    return this.utilsService.isNative && this.utilsService.isPortrait
      ? '5'
      : '3';
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.utilsService.showOrHideIonTabBar();
    });
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
        this.baseLang = lang;
      }),
      this.localStorage.selectedLanguageName$.subscribe((name) => {
        this.baseLangString = name;
      }),
      this.localStorage.targetLanguages$.subscribe((langs) => {
        this.selectedLanguages = langs;
        this.setCssClasses();
      })
    );
  }

  private initFormControls(): void {
    this.textareaDisabled = false;
    this.clearBtnDisabled = true;
    this.translateBtnDisabled = true;
    this.translations = [];
    this.text = '';
  }

  private setCssClasses(): void {
    const textarea = document.querySelector('ion-textarea');
    if (textarea) {
      if (this.selectedLanguages.length === 0) {
        textarea.classList.add('no-target-languages');
      } else {
        textarea.classList.remove('no-target-languages');
      }
    }
  }

  private disableFormControls(): void {
    this.textareaDisabled = true;
    this.clearBtnDisabled = false;
    this.translateBtnDisabled = true;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
