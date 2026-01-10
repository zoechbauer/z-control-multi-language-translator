import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  ModalController,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  GoogleLanguage,
  TranslationGoogleTranslateService,
} from 'src/app/services/translation-google-translate.service';
import { AppConstants } from 'src/app/shared/app.constants';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { LanguageMultiSelectComponent } from '../language-multi-select/language-multi-select.component';

@Component({
  selector: 'app-target-languages-accordion',
  templateUrl: './target-languages-accordion.component.html',
  standalone: true,
  imports: [
    IonIcon,
    IonAccordion,
    IonItem,
    IonLabel,
    TranslateModule,
    CommonModule,
    FormsModule,
  ],
})
export class TargetLanguagesAccordionComponent implements OnInit, OnDestroy {
  @Input() lang!: string;
  @Output() ionChange = new EventEmitter<string[]>();

  targetLanguages: GoogleLanguage[] = [];
  selectedTargetLanguageCodes: string[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    public readonly localStorage: LocalStorageService,
    private readonly googleTranslateService: TranslationGoogleTranslateService,
    private readonly modalController: ModalController
  ) {}

  get maxTargetLanguages(): number {
    return AppConstants.maxTargetLanguages;
  }

  ngOnInit(): void {
    this.loadSelectedTargetLanguages();
    this.loadSupportedLanguagesWithoutBaseLanguage();
  }

  async openLanguageSelect(): Promise<void> {
    const modal = await this.modalController.create({
      component: LanguageMultiSelectComponent,
      componentProps: {
        baseLang: this.lang,
        allLanguages: this.targetLanguages,
        selectedCodes: this.selectedTargetLanguageCodes,
        maxSelection: this.maxTargetLanguages,
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<string[]>();
    if (data) {
      this.selectedTargetLanguageCodes = data;
      this.ionChange.emit(this.selectedTargetLanguageCodes);
    }
  }

  private loadSelectedTargetLanguages(): void {
    this.subscriptions.push(
      this.localStorage.targetLanguages$.subscribe((langs: string[]) => {
        this.selectedTargetLanguageCodes = langs;
      })
    );
  }

  private loadSupportedLanguagesWithoutBaseLanguage(): void {
    this.subscriptions.push(
      this.googleTranslateService
        .getSupportedLanguagesWithLangCodeInName(this.lang)
        .subscribe((langs) => {
          this.targetLanguages = langs.filter(
            (lang) => lang.language !== this.lang
          );
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
