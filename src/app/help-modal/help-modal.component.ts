import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import {
  IonToolbar,
  IonTitle,
  IonHeader,
  IonIcon,
  IonButton,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from './../services/utils.service';
import { AppConstants } from '../shared/app.constants';
@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
  imports: [
    IonButtons,
    IonContent,
    IonButton,
    IonIcon,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
  ],
})
export class HelpModalComponent implements OnInit, OnDestroy {
  @Input() scrollToSection?: string; // Optional: ID of the section to scroll to when the modal opens (e.g., 'floating-keyboard' or 'web-version')

  readonly scrollToTopObj = {
    id: 'toc-DE',
    text: this.translate.instant('SCROLL_TO_TOP_DE'),
  };
  selectedLanguage: string = 'de';
  isPortrait = this.utilsService.isPortrait;
  private langSub?: Subscription;

  constructor(
    public readonly utilsService: UtilsService,
    private readonly modalController: ModalController,
    private readonly translate: TranslateService,
    private readonly localStorage: LocalStorageService
  ) {}

  get maxInputLength() {
    return AppConstants.maxInputLength;
  }
  get maxTargetLanguages() {
    return AppConstants.maxTargetLanguages;
  }
  get maxFreeTranslateCharsLengthPerMonth() {
    return AppConstants.maxFreeTranslateCharsPerMonth;
  }

  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  get emailSubjectHelpText(): string {
    const key = this.isNative ? 'HELP_EMAIL_SUBJECT' : 'HELP_EMAIL_SUBJECT_WEB';
    return this.translate.instant(key);
  }

  get languageChangeButtonHelpText(): string {
    const key = this.isNative
      ? 'HELP_LANGUAGE_CHANGE_BUTTON'
      : 'HELP_LANGUAGE_CHANGE_WEB_BUTTON';
    return this.translate.instant(key);
  }
  get deviceText(): string {
    const key = this.isNative ? 'HELP_DEVICE_TEXT' : 'HELP_DEVICE_TEXT_WEB';
    return this.translate.instant(key);
  }

  private readonly orientationListener = () => {
    this.isPortrait = this.utilsService.isPortrait;
  };

  ngOnInit() {
    // Scroll to specific section if provided
    if (this.scrollToSection) {
      setTimeout(() => {
        this.utilsService.scrollToElement(this.scrollToSection!);
      }, 500); // Delay to ensure modal is fully rendered
    }

    this.langSub = this.localStorage.selectedLanguage$.subscribe((lang) => {
      this.selectedLanguage = lang;
      this.setScrollToTopObj();
    });

    window.addEventListener('resize', this.orientationListener);
    window.addEventListener('orientationchange', this.orientationListener);
    this.orientationListener();
  }

  private setScrollToTopObj() {
    if (this.selectedLanguage === 'de') {
      this.scrollToTopObj.id = 'toc-DE';
      this.scrollToTopObj.text = this.translate.instant('SCROLL_TO_TOP_DE');
    } else if (this.selectedLanguage === 'en') {
      this.scrollToTopObj.id = 'toc';
      this.scrollToTopObj.text = this.translate.instant('SCROLL_TO_TOP_EN');
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }

  scrollToTop() {
    this.utilsService.scrollToElement(this.scrollToTopObj.id);
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
    window.removeEventListener('resize', this.orientationListener);
    window.removeEventListener('orientationchange', this.orientationListener);
  }
}
