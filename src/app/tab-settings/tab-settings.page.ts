import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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

@Component({
  selector: 'app-tab-settings',
  templateUrl: './tab-settings.page.html',
  imports: [
    IonicModule,
    TranslateModule,
    HeaderComponent,
    LanguageAccordionComponent,
    TargetLanguagesAccordionComponent,
    FeedbackAccordionComponent,
    ChangeLogAccordionComponent,
    GetSourceAccordionComponent,
    PrivacyPolicyAccordionComponent,
    GetMobileAppAccordionComponent
  ],
})
export class TabSettingsPage implements OnInit, OnDestroy {
  openAccordion: string | null = null;
  showAllAccordions = true;
  selectedLanguage?: string;
  LogoType = LogoType;
  Tab = Tab;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public readonly localStorage: LocalStorageService,
    public readonly utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.showAllAccordions = true;
    this.localStorage.initializeServicesAsync(this.translate).then(() => {
      this.setupSubscriptions();
    });
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
        this.selectedLanguage = lang;
      })
    );
    this.subscriptions.push(
      this.utilsService.logoClicked$.subscribe(() => {
        this.openFeedbackAccordion();
      })
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
    console.log('onAccordionGroupChange - event.detail.value', event.detail.value);
    
    this.openAccordion = event.detail.value;
    this.showAllAccordions = this.openAccordion == null;
  }

  onLanguageChange(event: any) {
    const lang = event.detail?.value;
    if (lang) {
      this.localStorage.saveSelectedLanguage(lang);
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
    }
  }  
  
  onTargetLanguagesChange(event: any) {
    const languages = event.detail?.value;
    if (languages) {
      this.localStorage.saveTargetLanguages(languages);
    }
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

  openHelpModal() {
    this.utilsService.openHelpModal();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
