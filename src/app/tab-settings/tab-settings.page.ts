import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { IonContent, IonicModule } from '@ionic/angular';

import { LocalStorageService } from '../services/local-storage.service';
import { environment } from 'src/environments/environment';
import { UtilsService } from '../services/utils.service';
import { LogoType, Tab } from '../enums';
import { HeaderComponent } from '../ui/components/header/header.component';
import { LanguageAccordionComponent } from '../ui/components/accordions/language-accordion.component';
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { ChangeLogAccordionComponent } from '../ui/components/accordions/change-log-accordion.component';
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { TargetLanguagesAccordionComponent } from '../ui/components/accordions/target-languages-accordion.component';
import { GetMobileAppAccordionComponent } from '../ui/components/accordions/get-mobile-app-accordion.component';
import { TextToSpeechAccordionComponent } from '../ui/components/accordions/text-to-speech-accordion.component';
import { TextSpeechService } from '../services/text-to-speach.service';
import { TextToSpeechValues } from '../shared/app.interfaces';
import { GetStatisticsAccordionComponent } from '../ui/components/accordions/get-statistics-accordion.component';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { FireStoreConstants } from '../shared/app.constants';

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
  imports: [
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
  ],
})
export class TabSettingsPage implements OnInit, OnDestroy {
  openAccordion: string | null = null;
  showAllAccordions = true;
  selectedLanguage!: string;
  selectedLanguageName?: string;
  LogoType = LogoType;
  Tab = Tab;
  textToSpeechValues!: TextToSpeechValues;
  currentYearMonth: string = FireStoreConstants.currentYearMonthPath();
  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public readonly localStorage: LocalStorageService,
    public readonly utilsService: UtilsService,
    private readonly textToSpeechService: TextSpeechService,
    private readonly firestoreService: FirebaseFirestoreService,
  ) {}

  ngOnInit() {
    this.showAllAccordions = true;
    this.setupSubscriptions();
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
        this.selectedLanguage = lang;
        this.localStorage.loadTargetLanguages();
      }),
    );
    this.subscriptions.push(
      this.utilsService.logoClicked$.subscribe(() => {
        this.openFeedbackAccordion();
      }),
    );
    this.subscriptions.push(
      this.localStorage.textToSpeechValues$.subscribe(
        (ttsValues: TextToSpeechValues) => {
          this.textToSpeechValues = ttsValues;
        },
      ),
    );
  }

  private openFeedbackAccordion() {
    this.openAccordion = '';
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
    this.openAccordion = event.detail.value;
    this.showAllAccordions = this.openAccordion == null;
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
        languages,
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
