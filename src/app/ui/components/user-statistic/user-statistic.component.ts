import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils.service';
import { IonCardHeader, IonCardTitle, IonCardContent, IonCard, IonRow, IonGrid, IonCol, IonCardSubtitle } from '@ionic/angular/standalone';
import { NgFor, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { UtilsService } from 'src/app/services/utils.service';
import { DisplayedUserContingentData } from 'src/app/shared/firebase-firestore.interfaces';
import { FireStoreConstants } from 'src/app/shared/app.constants';

@Component({
  selector: 'app-user-statistic',
  templateUrl: './user-statistic.component.html',
  styleUrls: ['./user-statistic.component.scss'],
  imports: [
    IonGrid,
    IonCol,
    IonRow,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    TranslatePipe,
    DecimalPipe,
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
    private readonly utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.updateIsContingentExceeded();
    this.updateTranslationStatistics();
    this.subscriptions.push(
      this.firestoreUtilsService.statisticsRefresh$.subscribe(() => {
        this.updateIsContingentExceeded();
        this.updateTranslationStatistics();
      })
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
