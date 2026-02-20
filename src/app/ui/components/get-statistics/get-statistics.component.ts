import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  IonSpinner,
  IonGrid,
  IonCol,
  IonRow,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import {
  NgFor,
  NgIf,
  NgTemplateOutlet,
  DecimalPipe,
  JsonPipe,
} from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { LogoComponent } from '../logo/logo.component';
import { LogoType } from 'src/app/enums';
import { FirebaseFirestoreService } from 'src/app/services/firebase-firestore.service';
import { environment } from 'src/environments/environment';
import {
  FirestoreContingentData,
  DisplayedUserStatistics,
  StatisticsData,
} from 'src/app/shared/firebase-firestore.interfaces';
import { UtilsService } from 'src/app/services/utils.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils-service';

@Component({
  selector: 'app-get-statistics',

  templateUrl: './get-statistics.component.html',
  styleUrls: ['./get-statistics.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonRow,
    IonCol,
    IonSpinner,
    LogoComponent,
    NgIf,
    NgFor,
    JsonPipe,
    NgTemplateOutlet,
    DecimalPipe,
    TranslateModule,
    IonGrid,
    IonIcon,
  ],
})
export class GetStatisticsComponent implements OnInit, OnDestroy {
  @Input() lang!: string;
  LogoType = LogoType;
  currentUserUid: string | null = null;

  // Statistics data
  isLoading = true;
  contingentData: FirestoreContingentData | null = null;
  isStopped = false;
  totalCharCount = 0;
  allUsersCharCount = 0;
  totalLimit = 0;
  totalBuffer = 0;
  totalRemaining = 0;
  userLimit = 0;
  statisticsData: StatisticsData | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly firestoreUtilsService: FirebaseFirestoreUtilsService,
    private readonly localStorageService: LocalStorageService,
    private readonly utilsService: UtilsService,
  ) {}

  get hideColumn(): boolean {
    return this.utilsService.isPortrait;
  }

  get isProgrammerDevice(): boolean {
    const currentUserId = this.firestoreService.getCurrentUserId();
    return this.utilsService.isProgrammerDevice(currentUserId);
  }

  get isFirebaseEmulator(): boolean {
    return environment.app.useFirebaseEmulator;
  }

  ngOnInit(): void {
    this.init();
    this.subscriptions.push(
      this.firestoreUtilsService.statisticsRefresh$.subscribe(() => {
        this.init();
      }),
    );
  }

  async init() {
    this.isLoading = true;

    try {
      this.currentUserUid = await this.localStorageService.loadFirestoreUid();

      // Read control flags
      this.contingentData = await this.firestoreService.readContingentData();
      this.isStopped = !!this.contingentData.StopTranslationForAllUsers;

      // Total contingent
      this.totalLimit =
        this.contingentData.maxFreeTranslateCharsPerMonth ??
        environment.app.maxFreeTranslateCharsPerMonth;
      this.totalBuffer =
        this.contingentData.maxFreeTranslateCharsBufferPerMonth ??
        environment.app.maxFreeTranslateCharsBufferPerMonth;
      this.totalCharCount = await this.firestoreService.getTotalCharCount();
      this.totalRemaining = Math.max(
        0,
        this.totalLimit - this.totalBuffer - this.totalCharCount,
      );

      // User contingent
      this.userLimit =
        this.contingentData.maxFreeTranslateCharsPerMonthForUser ??
        environment.app.maxFreeTranslateCharsPerMonthForUser;

      // user statistics and info
      this.statisticsData =
        await this.firestoreUtilsService.getDisplayedUserStatistics();

      // Calculate the sum of all users' translated characters
      this.allUsersCharCount =
        this.statisticsData?.displayedUserStatistics.reduce(
          (sum, userStat) => sum + userStat.translatedCharCount,
          0,
        ) ?? 0;
    } catch (error) {
      console.error('GetStatisticsComponent: Error loading statistics', error);
    } finally {
      this.isLoading = false;
    }
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserUid;
  }

  async showDetailInfos(lang: string, userStatistic: DisplayedUserStatistics): Promise<void> {
    this.utilsService.openUserDetail(lang, userStatistic);
  }

  getFormatDate(dateTime: Date | null): string {
    return dateTime
      ? this.utilsService.formatDateISO(new Date(dateTime))
      : '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
