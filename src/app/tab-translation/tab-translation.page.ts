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
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../ui/components/header/header.component';
import { Tab, ToastAnchor } from '../enums';
import { AppConstants } from '../shared/app.constants';
import { DeviceInfo } from '../shared/firebase-firestore.interfaces';
import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';
import { ToastService } from '../services/toast.service';
import { TextSpeechService } from '../services/text-to-speach.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils-service';
import { UserStatisticComponent } from '../ui/components/user-statistic/user-statistic.component';

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
    IonLabel,
    IonItem,
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
    IonAccordionGroup,
    IonAccordion,
    FormsModule,
    HeaderComponent,
    TranslatePipe,
    AsyncPipe,
    UserStatisticComponent,
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
  speakBtnDisabled: boolean = false;
  cardInputVisible: boolean = true;
  cardResultsVisible: boolean = false;

  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public localStorage: LocalStorageService,
    public readonly utilsService: UtilsService,
    public readonly ttsService: TextSpeechService,
    private readonly googleTranslateService: TranslationGoogleTranslateService,
    private readonly toastService: ToastService,
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly firestoreUtilsService: FirebaseFirestoreUtilsService,
  ) {}

  get maxInputLength(): number {
    return AppConstants.maxInputLength;
  }

  get maxTargetLanguages(): number {
    return AppConstants.maxTargetLanguages;
  }

  get toggleButtonLabel(): string {
    return this.cardInputVisible
      ? this.translate.instant('TRANSLATE.CARD.BUTTON.TOGGLE_CARD_RESULTS')
      : this.translate.instant('TRANSLATE.CARD.BUTTON.TOGGLE_CARD_INPUT');
  }

  get showTranslationResultEnteredTextCard(): boolean {
    return (
      this.cardResultsVisible &&
      (!this.utilsService.isNative || this.utilsService.isPortrait)
    );
  }

  get deviceInfos(): DeviceInfo {
    return this.utilsService.getDeviceInfo();
  }

  isContingentExceeded: boolean = false;

  ngOnInit() {
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
    this.setupSubscriptions();
    this.updateIsContingentExceeded().then(() => {
      this.initFormControls();
      this.getTranslationPlaceholder();
    });
  }

  private async updateIsContingentExceeded() {
    this.isContingentExceeded =
      await this.firestoreUtilsService.isContingentExceeded();
  }

  getTranslationPlaceholder(): string {
    return this.translate.instant('TRANSLATE.CARD.PLACEHOLDER.INPUT_TEXT', {
      baseLanguage: this.baseLangString.substring(
        0,
        this.baseLangString.indexOf(' ('),
      ),
    });
  }

  onTextareaInput(): void {
    const hasText = this.text.trim().length > 0;
    this.translateBtnDisabled = !hasText;
    this.clearBtnDisabled = !hasText;
  }

  async translateTextOrSimulate(): Promise<void> {
    // if contingent is exceeded, simulate translation and show toast
    await this.updateIsContingentExceeded();

    // Early exit if no text or no target languages
    if (!this.text.trim() || this.selectedLanguages.length === 0) {
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.NO_TEXT_OR_LANGUAGES',
        ),
        ToastAnchor.TRANSLATE_PAGE,
      );
      return;
    }
    if (TranslationGoogleTranslateService.SIMULATE_TRANSLATION) {
      this.simulateTranslateText();
      this.toggleCard();
      return;
    }
    if (this.isContingentExceeded) {
      this.simulateTranslationOnContingentExceeded();
      this.toggleCard();
      return;
    }
    this.disableFormControls();

    // Call secure cloud function for contingent check, update, and translation
    try {
      const translations =
        await this.googleTranslateService.secureTranslateCloudFunction(
          this.text,
          this.baseLang,
          this.selectedLanguages,
        );
      if (!translations) {
        this.simulateTranslationOnContingentExceeded();
        this.toggleCard();
        return;
      }
      this.translations = Object.entries(translations).map(
        ([language, translatedText]) => ({
          language,
          translatedText: String(translatedText),
        }),
      );
      this.firestoreUtilsService.requestStatisticsRefresh();

      this.toggleCard();
    } catch (error: any) {
      console.error('Translation error:', error); // TODO test
      if (error?.message?.includes('contingent')) {
        this.simulateTranslationOnContingentExceeded();
        this.toggleCard();
      } else {
        console.error('Translation error:', error);
        this.toastService.showToast(
          this.translate.instant('TRANSLATE.CARD_RESULTS.TOAST.ERROR'),
          ToastAnchor.TRANSLATE_PAGE,
        );
      }
    }
  }

  private simulateTranslationOnContingentExceeded(): void {
    this.toastService.showToast(
      this.translate.instant(
        'TRANSLATE.CARD_RESULTS.TOAST.CONTINGENT_EXCEEDED',
      ),
      ToastAnchor.TRANSLATE_PAGE,
    );
    this.simulateTranslateText();
  }

  private simulateTranslateText(): void {
    if (!this.text.trim()) {
      return;
    }
    this.disableFormControls();

    this.googleTranslateService
      .getTranslations(
        this.googleTranslateService.simulateTranslateText.bind(
          this.googleTranslateService,
        ),
        this.text,
        this.baseLang,
        this.selectedLanguages,
      )
      .subscribe((results: Translation[]) => {
        this.translations = results;
        this.text = this.translate.instant(
          'TRANSLATE.CARD_RESULTS.SIMULATION.INPUT',
        );
      });
  }

  async speak(text: string, lang: string) {
    if (this.speakBtnDisabled) {
      return;
    }
    try {
      this.speakBtnDisabled = true;
      await this.ttsService.speak(text, lang);
    } catch (err) {
      this.toastService.showToast(
        this.translate.instant(
          'TRANSLATE.CARD_RESULTS.TOAST.SPEAK_NOT_SUPPORTED',
        ),
        ToastAnchor.TRANSLATE_PAGE,
      );
      console.error('TTS error:', err);
    } finally {
      this.speakBtnDisabled = false;
    }
  }

  clear(): void {
    this.initFormControls();
  }

  getTextareaRows(): string {
    return this.utilsService.isNative && this.utilsService.isPortrait
      ? '4'
      : '2';
  }

  toggleCard(): void {
    this.cardInputVisible = !this.cardInputVisible;
    this.cardResultsVisible = !this.cardResultsVisible;
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
        this.initFormControls();
      }),
    );
  }

  private initFormControls(): void {
    this.textareaDisabled = this.selectedLanguages.length === 0;
    this.clearBtnDisabled = true;
    this.translateBtnDisabled = true;
    this.translations = [];
    this.text = '';
    this.cardInputVisible = true;
    this.cardResultsVisible = false;
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
