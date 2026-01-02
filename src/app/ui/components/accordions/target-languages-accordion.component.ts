import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  GoogleLanguage,
  TranslationGoogleTranslateService,
} from 'src/app/services/translation-google-translate.service';
import { AppConstants } from 'src/app/shared/app.constants';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-target-languages-accordion',
  templateUrl: './target-languages-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    TranslateModule,
    CommonModule,
    FormsModule,
  ],
})
export class TargetLanguagesAccordionComponent implements OnInit, OnDestroy {
  @Input() lang?: string;

  targetLanguages: GoogleLanguage[] = [];
  selectedTargetLanguageCodes: string[] = [];
  baseLanguageName: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    public translate: TranslateService,
    private readonly localStorage: LocalStorageService,
    private readonly googleTranslateService: TranslationGoogleTranslateService
  ) {}

  get maxTargetLanguages(): number {
    return AppConstants.maxTargetLanguages;
  }

  ngOnInit(): void {
    this.loadBaseLanguageName(this.lang);
    this.loadSelectedTargetLanguages();
    this.loadSupportedLanguagesWithoutBaseLanguage();
  }

  getTargetLanguageNames(): string {
    return this.googleTranslateService.getLanguageNamesStringWithLineBreaks(
      this.targetLanguages,
      this.selectedTargetLanguageCodes
    );
  }

  private loadSelectedTargetLanguages(): void {
    this.localStorage.loadTargetLanguages();
    this.subscriptions.push(
      this.localStorage.targetLanguages$.subscribe((langs: string[]) => {
        this.selectedTargetLanguageCodes = langs;
      })
    );
  }

  private loadSupportedLanguagesWithoutBaseLanguage(): void {
    this.subscriptions.push(
      this.googleTranslateService
        .getSupportedLanguagesWithLangCodeInName(this.lang || 'en')
        .subscribe((langs) => {
          this.targetLanguages = langs.filter(
            (lang) => lang.language !== this.lang
          );

          console.log(
            'Filtered target languages:',
            this.targetLanguages.filter((lang) => lang.name.startsWith('Chine'))
          );
        })
    );
  }

  private loadBaseLanguageName(langCode: string | undefined): void {
    this.subscriptions.push(
      this.googleTranslateService
        .getBaseLanguageName(langCode)
        .subscribe((name) => {
          this.baseLanguageName = name;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
