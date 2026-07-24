import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FirebaseFirestoreUtilsService } from '@app/services/firebase-firestore-utils.service';
import {
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCard,
  IonRow,
  IonGrid,
  IonCol,
  IonCardSubtitle,
} from '@ionic/angular/standalone';
import { NgFor, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { UtilsService } from '@app/services/utils.service';
import { DisplayedUserContingentData } from '@app/shared/firebase-firestore.interfaces';
import { FireStoreConstants } from '@app/shared/app.constants';

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
  translate = inject(TranslateService);
  private readonly firestoreUtilsService = inject(
    FirebaseFirestoreUtilsService
  );
  private readonly utilsService = inject(UtilsService);

  isContingentExceeded: boolean = false;
  displayedContingentData: DisplayedUserContingentData[] = [];
  yearMonth: string = FireStoreConstants.currentYearMonthPath();
  private readonly subscriptions: Subscription[] = [];

  get hideColumn(): boolean {
    return this.utilsService.isPortrait && this.utilsService.isNative;
  }

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
