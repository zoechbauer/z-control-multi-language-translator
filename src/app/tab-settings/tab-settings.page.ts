import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { IonContent, IonicModule } from '@ionic/angular';
import { NgIf } from '@angular/common';

import { environment } from '@env/environment';
import { LogoType, Tab } from '../shared/enums';
import { TextToSpeechValues } from '../shared/app.interfaces';
import { FireStoreConstants } from '../shared/app.constants';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { TextSpeechService } from '../services/text-to-speech.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { HeaderComponent } from '../ui/components/header/header.component';
import { LanguageAccordionComponent } from '../ui/components/accordions/language-accordion.component';
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { ChangeLogAccordionComponent } from '../ui/components/accordions/change-log-accordion.component';
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { TargetLanguagesAccordionComponent } from '../ui/components/accordions/target-languages-accordion.component';
import { GetMobileAppAccordionComponent } from '../ui/components/accordions/get-mobile-app-accordion.component';
import { TextToSpeechAccordionComponent } from '../ui/components/accordions/text-to-speech-accordion.component';
import { GetStatisticsAccordionComponent } from '../ui/components/accordions/get-statistics-accordion.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';

// Single source of truth for settings accordion IDs.
// Add new accordion IDs here when extending the settings page.
const ACCORDION_VALUES = [
  'language',
  'target-languages',
  'text-to-speech',
  'z-control',
  'get-statistics',
  'privacy-policy',
  'change-log',
  'get-mobile-app',
  'get-source',
] as const;

type AccordionValue = (typeof ACCORDION_VALUES)[number];

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
  imports: [
    NgIf,
    IonicModule,
    TranslatePipe,
    HeaderComponent,
    LanguageAccordionComponent,
    TargetLanguagesAccordionComponent,
    FeedbackAccordionComponent,
    ChangeLogAccordionComponent,
    GetSourceAccordionComponent,
    PrivacyPolicyAccordionComponent,
    GetMobileAppAccordionComponent,
    TextToSpeechAccordionComponent,
    GetStatisticsAccordionComponent,
    SpinnerComponent,
  ],
})
export class TabSettingsPage implements OnInit, OnDestroy {
  translate = inject(TranslateService);
  readonly localStorage = inject(LocalStorageService);
  readonly utilsService = inject(UtilsService);
  private readonly textToSpeechService = inject(TextSpeechService);
  private readonly firestoreUtilsService = inject(FirebaseFirestoreUtilsService);

  private readonly validAccordionValues = new Set<AccordionValue>(
    ACCORDION_VALUES
  );
  openAccordion: AccordionValue | null = null;
  showAllAccordions = true;
  selectedLanguage!: string;
  selectedLanguageName?: string;
  LogoType = LogoType;
  Tab = Tab;
  textToSpeechValues!: TextToSpeechValues;
  currentYearMonth: string = FireStoreConstants.currentYearMonthPath();
  isLoading = true;
  private readonly subscriptions: Subscription[] = [];

  ngOnInit() {
    this.isLoading = true;
    this.showAllAccordions = true;
    this.setupSubscriptions();
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe(async (lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
        this.selectedLanguage = lang;
        await this.localStorage.loadTargetLanguages();
        this.isLoading = false;
      })
    );
    this.subscriptions.push(
      this.utilsService.logoClicked$.subscribe(() => {
        this.openFeedbackAccordion();
      })
    );
    this.subscriptions.push(
      this.localStorage.textToSpeechValues$.subscribe(
        (ttsValues: TextToSpeechValues) => {
          this.textToSpeechValues = ttsValues;
        }
      )
    );
  }

  private openFeedbackAccordion() {
    this.openAccordion = null;
    this.openAccordion = 'z-control';
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.utilsService.showOrHideIonTabBar();
    });
  }

  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  onAccordionGroupChange(event: CustomEvent, content: IonContent) {
    const value = this.normalizeAccordionValue(event?.detail?.value);

    // Ignore bubbled value-change events from nested controls (e.g. radio groups).
    if (value === undefined) {
      return;
    }

    // refresh statistic on open to update data on month change - we need to do this before setting the openAccordion value, because the accordion content gets destroyed on close and recreated on open - so we need to update the data before that happens
    if (value === 'get-statistics') {
      this.firestoreUtilsService.requestStatisticsRefresh();
    }

    this.openAccordion = value;
    this.showAllAccordions = this.openAccordion == null;
  }

  private normalizeAccordionValue(
    rawValue: unknown
  ): AccordionValue | null | undefined {
    // Header toggle close can emit undefined, null, or empty string.
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return null;
    }

    if (
      typeof rawValue === 'string' &&
      this.validAccordionValues.has(rawValue as AccordionValue)
    ) {
      return rawValue as AccordionValue;
    }

    return undefined;
  }

  onLanguageChange(event: any) {
    const lang = event.detail?.value;
    if (lang) {
      this.localStorage.saveSelectedLanguage(lang);
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
      this.removeBaseLangFromTargetLanguages(lang);
    }
  }

  private removeBaseLangFromTargetLanguages(baseLang: string) {
    const targetLangs = this.localStorage.targetLanguagesSubject.getValue();
    if (targetLangs.includes(baseLang)) {
      const updatedLangs = targetLangs.filter((lang) => lang !== baseLang);
      this.localStorage.saveTargetLanguages(updatedLangs);
    }
  }

  onTargetLanguagesChange(languages: string[]) {
    if (languages) {
      this.localStorage.saveTargetLanguages(languages);
      this.textToSpeechService.updateTtsSupportedLanguagesMap(
        this.utilsService.isNative,
        languages
      );
    }
  }

  onChangeTtsValue(values: any) {
    this.localStorage.saveTextToSpeechValues(values);
  }

  showAll() {
    this.openAccordion = null;
    this.showAllAccordions = true;
  }

  async openChangelog() {
    this.utilsService.openChangelog();
  }

  get versionInfo() {
    const { major, minor, date } = {
      major: environment.version.major,
      minor: environment.version.minor,
      date: environment.version.date,
    };
    return `${major}.${minor} (${date})`;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
