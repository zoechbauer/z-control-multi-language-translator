import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  IonGrid,
  IonCol,
  IonRow,
  IonIcon,
  IonButton,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
} from '@ionic/angular/standalone';
import {
  NgFor,
  NgIf,
  NgTemplateOutlet,
  DecimalPipe,
  JsonPipe,
  NgClass,
} from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { LogoComponent } from '../logo/logo.component';
import { DisplayMode, LogoType } from 'src/app/shared/enums';
import { FirebaseFirestoreService } from 'src/app/services/firebase-firestore.service';
import { environment } from 'src/environments/environment';
import {
  FirestoreContingentData,
  DisplayedUserStatistics,
  StatisticsData,
  UserStatisticsSummary,
} from 'src/app/shared/firebase-firestore.interfaces';
import { UtilsService } from 'src/app/services/utils.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { FirebaseFirestoreUtilsService } from 'src/app/services/firebase-firestore-utils.service';
import { SpinnerComponent } from '../spinner/spinner.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-get-statistics',

  templateUrl: './get-statistics.component.html',
  styleUrls: ['./get-statistics.component.scss'],
  standalone: true,
  imports: [
    IonSearchbar,
    IonButton,
    IonRow,
    IonCol,
    NgIf,
    NgFor,
    JsonPipe,
    NgTemplateOutlet,
    DecimalPipe,
    TranslateModule,
    IonGrid,
    IonIcon,
    IonRadioGroup,
    IonRadio,
    IonSelect,
    IonSelectOption,
    LogoComponent,
    SpinnerComponent,
    FormsModule,
    NgClass,
  ],
})
export class GetStatisticsComponent implements OnInit, OnDestroy {
  @Input() lang!: string;

  LogoType = LogoType;
  DisplayMode = DisplayMode;
  displayMode: DisplayMode = DisplayMode.User;
  currentUserUid: string | null = null;
  isProgrammerDevice: boolean = false;
  filterSelectedMonth: string = '';
  allFilterMonthValues: string[] = [];
  searchTerm: string = '';
  platformFilter: 'all' | 'web' | 'native' = 'all';
  onlyExceeded = false;

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
  userStatisticsSummaryData: UserStatisticsSummary[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly firestoreUtilsService: FirebaseFirestoreUtilsService,
    private readonly localStorageService: LocalStorageService,
    private readonly utilsService: UtilsService
  ) {}

  get hideColumn(): boolean {
    return this.utilsService.isPortrait;
  }

  get hideColumnIfUserOrPortrait(): boolean {
    return (
      this.utilsService.isPortrait || this.displayMode === DisplayMode.User
    );
  }

  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  get isFirebaseEmulator(): boolean {
    return environment.app.useFirebaseEmulator;
  }

  /**
   * Returns the statistics rows filtered by the current search term.
   *
   * Supported filter modes:
   * - Text search (default): matches `userName` or `displayedPlatform` (case-insensitive).
   * - Translated character count:
   *   - `>123` => rows with `translatedCharCount >= 123`
   *   - `<10`  => rows with `translatedCharCount <= 10`
   * - Target language count:
   *   - `>>5` => rows with `targetLanguages.length >= 5`
   *   - `<<1` => rows with `targetLanguages.length <= 1`
   *
   * Notes:
   * - Optional spaces after operators are supported (for example `> 123`, `>> 5`).
   * - If the search term is empty, all rows are returned unchanged.
   */
  get filteredUserStats(): DisplayedUserStatistics[] {
    const rows = this.statisticsData?.displayedUserStatistics ?? [];
    const term = (this.searchTerm ?? '').trim();

    if (!term) {
      return rows;
    }

    // Target language count filters: >>5 or <<1
    const targetMatch = term.match(/^(>>|<<)\s*(\d+)$/);
    if (targetMatch) {
      const operator = targetMatch[1];
      const value = Number(targetMatch[2]);

      return rows.filter((u) => {
        const count = u.targetLanguages?.length ?? 0;
        return operator === '>>' ? count >= value : count <= value;
      });
    }

    // Translated char count filters: >123 or <10
    const charMatch = term.match(/^(>|<)\s*(\d+)$/);
    if (charMatch) {
      const operator = charMatch[1];
      const value = Number(charMatch[2]);

      return rows.filter((u) =>
        operator === '>'
          ? u.translatedCharCount >= value
          : u.translatedCharCount <= value
      );
    }

    // Default text filter on userName, displayedPlatform, or displayedModel
    const lower = term.toLowerCase();
    return rows.filter(
      (u) =>
        u.userName.toLowerCase().includes(lower) ||
        (u.displayedPlatform ?? '').toLowerCase().includes(lower) ||
        (u.displayedModel ?? '').toLowerCase().includes(lower)
    );
  }

  ngOnInit(): void {
    this.init();
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.subscriptions.push(
      this.firestoreUtilsService.statisticsRefresh$.subscribe(() => {
        // Only reload if not currently loading
        if (!this.isLoading) {
          this.init();
        }
      }),
      this.firestoreService.programmerDeviceRefresh$.subscribe(() => {
        // Update isProgrammerDevice without triggering full reload
        const newValue = this.firestoreService.isProgrammerDevice;
        if (this.isProgrammerDevice !== newValue) {
          this.isProgrammerDevice = newValue;
        }
      }),
      this.localStorageService.statisticsDisplayMode$.subscribe((mode) => {
        this.displayMode = mode;
      }),
      this.localStorageService.statisticsSelectedMonth$.subscribe((month) => {
        this.filterSelectedMonth = month;
      })
    );
  }

  async init() {
    this.isLoading = true;
    this.searchTerm = '';
    this.isProgrammerDevice = this.firestoreService.isProgrammerDevice;
    await this.setFilterValues();

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
        this.totalLimit - this.totalBuffer - this.totalCharCount
      );

      // User contingent
      this.userLimit =
        this.contingentData.maxFreeTranslateCharsPerMonthForUser ??
        environment.app.maxFreeTranslateCharsPerMonthForUser;

      // user statistics and info
      this.statisticsData =
        await this.firestoreUtilsService.getDisplayedUserStatistics();
      this.userStatisticsSummaryData =
        this.firestoreUtilsService.getUserStatisticsSummary(
          this.statisticsData?.displayedUserStatistics ?? []
        );

      // Calculate the sum of all users' translated characters
      this.allUsersCharCount =
        this.statisticsData?.displayedUserStatistics.reduce(
          (sum, userStat) => sum + userStat.translatedCharCount,
          0
        ) ?? 0;
    } catch (error) {
      console.error('GetStatisticsComponent: Error loading statistics', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async setFilterValues(): Promise<void> {
    this.displayMode =
      await this.localStorageService.getStatisticsDisplayMode();

    this.allFilterMonthValues =
      this.utilsService.getAllFirestoreSearchStringsForMonth();
    this.filterSelectedMonth =
      await this.localStorageService.getStatisticsSelectedMonth();
    if (!this.filterSelectedMonth) {
      // use currrent month as default if no value is stored
      this.filterSelectedMonth =
        this.utilsService.formatDateTimeFirestoreSearchString(new Date());
    }
  }

  onFilterData(): void {
    // Trigger data reload with current filters
    this.init();
  }

  onSelectedMonthChange(event: any): void {
    const value = event?.detail?.value;
    if (value) {
      this.filterSelectedMonth = value;

      // Store selected month in local storage
      this.localStorageService
        .saveStatisticsSelectedMonth(this.filterSelectedMonth)
        .catch((error) => {
          console.error('Error saving selected month to local storage:', error);
        });
    }
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserUid;
  }

  onDisplayModeChange(event: any): void {
    const value = event?.detail?.value;
    if (value === DisplayMode.User || value === DisplayMode.Programmer) {
      this.displayMode = value;

      // Store display mode in local storage
      this.localStorageService
        .saveStatisticsDisplayMode(this.displayMode)
        .catch((error) => {
          console.error('Error saving display mode to local storage:', error);
        });
    }
  }

  async showDetailInfos(
    lang: string,
    userStatistic: DisplayedUserStatistics
  ): Promise<void> {
    this.utilsService.openUserDetail(lang, userStatistic, this.displayMode);
  }

  getFormatDateTime(dateTime: Date | null): string {
    if (this.displayMode === DisplayMode.Programmer) {
      return this.utilsService.formatDateTimeISO(dateTime);
    }

    return this.utilsService.formatDateISO(dateTime);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
