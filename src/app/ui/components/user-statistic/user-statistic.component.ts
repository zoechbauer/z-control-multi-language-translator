import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils-service';
import {
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCard,
  IonIcon,
  IonRow,
  IonGrid,
  IonCol,
  IonButton,
} from '@ionic/angular/standalone';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { UtilsService } from 'src/app/services/utils.service';
import { DisplayedUserContingentData } from 'src/app/shared/firebase-firestore.interfaces';
import { FireStoreConstants } from 'src/app/shared/app.constants';

@Component({
  selector: 'app-user-statistic',
  templateUrl: './user-statistic.component.html',
  styleUrls: ['./user-statistic.component.scss'],
  imports: [
    IonButton,
    IonGrid,
    IonCol,
    IonRow,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    TranslatePipe,
    DecimalPipe,
    NgIf,
    NgFor,
  ],
})
export class UserStatisticComponent implements OnInit, OnDestroy {
  isContingentExceeded: boolean = false;
  displayedContingentData: DisplayedUserContingentData[] = [];
  yearMonth: string = FireStoreConstants.currentYearMonthPath();
  private readonly subscriptions: Subscription[] = [];

  get hideColumn(): boolean {
    return this.utilsService.isPortrait && this.utilsService.isNative;
  }

  constructor(
    public translate: TranslateService,
    private readonly firestoreUtilsService: FirebaseFirestoreUtilsService,
    private readonly utilsService: UtilsService,
  ) {}

  ngOnInit() {
    this.updateIsContingentExceeded();
    this.updateTranslationStatistics();
    this.subscriptions.push(
      this.firestoreUtilsService.statisticsRefresh$.subscribe(() => {
        this.updateIsContingentExceeded();
        this.updateTranslationStatistics();
      }),
    );
  }

  private async updateIsContingentExceeded() {
    this.isContingentExceeded =
      await this.firestoreUtilsService.isContingentExceeded();
  }

  private async updateTranslationStatistics() {
    this.displayedContingentData =
      await this.firestoreUtilsService.getDisplayedUserContingentData();
  }

  getFormatDateTime(dateTime: Date | null): string {
    return dateTime
      ? this.utilsService.formatDateTimeISO(new Date(dateTime))
      : '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
