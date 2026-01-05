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
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../ui/components/header/header.component';
import { Tab } from '../enums';
import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import {
  GoogleLanguage,
  TranslationGoogleTranslateService,
} from '../services/translation-google-translate.service';
import { AppConstants } from '../shared/app.constants';

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
    TranslatePipe
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

  private supportedLanguages: GoogleLanguage[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public localStorage: LocalStorageService,
    public readonly utilsService: UtilsService,
    private readonly googleTranslateService: TranslationGoogleTranslateService
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
    this.localStorage.loadTargetLanguages();
    this.loadSupportedLanguages(this.baseLang);
    this.initFormControls();
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
  }

  clear(): void {
    this.initFormControls();
  }

  getTargetLanguageNames(): string {
    return this.googleTranslateService.getLanguageNamesStringWithLineBreaks(
      this.supportedLanguages,
      this.selectedLanguages
    );
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
      this.localStorage.targetLanguages$.subscribe((langs) => {
        this.selectedLanguages = langs;
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

  private disableFormControls(): void {
    this.textareaDisabled = true;
    this.clearBtnDisabled = false;
    this.translateBtnDisabled = true;
  }

  private loadSupportedLanguages(lang: string): void {
    this.googleTranslateService
      .getSupportedLanguagesWithLangCodeInName(lang)
      .subscribe((langs) => {
        this.supportedLanguages = langs;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
