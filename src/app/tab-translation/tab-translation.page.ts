import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
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
  IonInput,
  IonRow,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../ui/components/header/header.component';
import { Tab } from '../enums';
import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';

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
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonCol,
    IonContent,
    IonGrid,
    IonInput,
    IonRow,
    IonSelect,
    IonSelectOption,
    TranslateModule,
    CommonModule,
    FormsModule,
    HeaderComponent,
  ],
})
export class TabTranslationPage implements OnInit, OnDestroy {
  Tab = Tab;
  // TODO use IonTextArea - see tab-qr.page.ts
  text: string = '';
  defaultSourceLang: string = 'de';
  translations: Translation[] = [];
  selectedLanguages: string[] = [];
  selectedLanguagesString = '';
  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public localStorage: LocalStorageService,
    public readonly utilsService: UtilsService,
    private readonly translationService: TranslationGoogleTranslateService
  ) {}

  ngOnInit() {
    this.text = '';
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
    this.localStorage.initializeServicesAsync(this.translate).then(() => {
      this.setupSubscriptions();
    });
    this.localStorage.loadTargetLanguages();
  }

  get maxInputLength(): number {
    // TODO move to environment settings
    // return environment.maxInputLength ?? 20;
    return 20;
  }

  translateText(): void {
    if (!this.text.trim()) {
      return;
    }
    this.translations = [];

    this.selectedLanguages.forEach((translateToLang) => {
      this.translationService
        .translateText(this.text, this.defaultSourceLang, translateToLang)
        .subscribe((result) => {
          // Defensive: result may be undefined/null or not have the key
          const translatedText = result?.[translateToLang] ?? '';
          this.translations.push({
            language: translateToLang,
            translatedText,
          });
        });
    });
  }

  clear(): void {
    this.text = '';
    this.translations = [];
  }

  private setupEventListeners(): void {
    // Single resize listener
    window.addEventListener('resize', () => {
      this.utilsService.showOrHideIonTabBar();
    });
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
      }),
      this.localStorage.targetLanguages$.subscribe((langs) => {
        this.selectedLanguages = langs;
        this.selectedLanguagesString = langs.join(', ');
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
