import { Component, Input, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  ModalController,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DisplayedUserStatistics } from 'src/app/shared/firebase-firestore.interfaces';
import { UtilsService } from 'src/app/services/utils.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { TranslationGoogleTranslateService } from 'src/app/services/translation-google-translate.service';

@Component({
  selector: 'app-user-detail-modal',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    CommonModule,
    TranslatePipe,
  ],
})
export class UserDetailComponent implements OnInit {
  @Input() lang!: string;
  @Input() userStatistic!: DisplayedUserStatistics;
  targetLanguagesDisplay: string = '';

  constructor(
    public readonly localStorage: LocalStorageService,
    public translate: TranslateService,
    private readonly googleTranslateSevervice: TranslationGoogleTranslateService,
    private readonly modalCtrl: ModalController,
    private readonly utilsService: UtilsService,
  ) {}

  ngOnInit() {
    this.getTargetLanguagesWithLineBreak();
  }

  close(): void {
    this.modalCtrl.dismiss();
  }

  getAppVersion(): string {
    return `${this.userStatistic.deviceInfo.appVersion.major}.${this.userStatistic.deviceInfo.appVersion.minor} (${this.userStatistic.deviceInfo.appVersion.date})`;
  }

  getFormatDateTime(dateTime: Date | null): string {
    return dateTime
      ? this.utilsService.formatDateTimeISO(new Date(dateTime))
      : '';
  }

  private async getTargetLanguagesWithLineBreak(): Promise<void> {
    this.targetLanguagesDisplay =
      await this.googleTranslateSevervice.getFormattedTargetLanguageNamesForCodes(
        this.lang,
        this.userStatistic.targetLanguages,
      );
  }
}
