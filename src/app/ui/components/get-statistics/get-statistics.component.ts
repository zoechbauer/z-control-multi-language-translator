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
} from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LogoComponent } from '../logo/logo.component';
import { AllMonthsOption, DisplayMode, LogoType } from 'src/app/shared/enums';
import { FirebaseFirestoreService } from 'src/app/services/firebase-firestore.service';
import { environment } from 'src/environments/environment';
import {
  FirestoreContingentData,
  DisplayedUserStatistics,
  StatisticsData,
  UserStatisticsSummary,
  DisplayedUserStatisticsRow,
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
  ],
})
export class GetStatisticsComponent implements OnInit, OnDestroy {
  @Input() lang!: string;

  LogoType = LogoType;
  DisplayMode = DisplayMode;
  displayMode: DisplayMode = DisplayMode.User;
  selectedDisplayMode: DisplayMode = DisplayMode.User;
  currentUserUid: string | null = null;
  isProgrammerDevice: boolean = false;
  filterSelectedMonth: string = '';
  selectedMonthForStatisticsSections: string = '';
  allFilterMonthValues: string[] = [];
  searchTerm: string = '';
  platformFilter: 'all' | 'web' | 'native' = 'all';
  onlyExceeded = false;
  showRawDebugDetails = false;
  showDisplayedValuesDetail = false;
  showTranslationStatisticsDetail = false;
  showUserMappingDetail = false;
  showProgrammerDevicesDetail = false;

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
  userStatisticsSummaryData: UserStatisticsSummary[] = [];
  filteredUserStatsRows: DisplayedUserStatisticsRow[] = [];
  private allUserStatsRows: DisplayedUserStatisticsRow[] = [];
  private readonly subscriptions: Subscription[] = [];
  private _statisticsData: StatisticsData | null = null;
  private isPortrait = true;

  constructor(
    private readonly translate: TranslateService,
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly firestoreUtilsService: FirebaseFirestoreUtilsService,
    private readonly localStorageService: LocalStorageService,
    private readonly utilsService: UtilsService
  ) {}

  get statisticsData(): StatisticsData | null {
    return this._statisticsData;
  }

  set statisticsData(value: StatisticsData | null) {
    this._statisticsData = value;
    this.allUserStatsRows = (value?.displayedUserStatistics ?? []).map(
      (userStat) => ({
        ...userStat,
        formattedLastActivityDate: this.getFormatDateTime(
          userStat.lastTranslationDate ?? userStat.userCreatedAt
        ),
        isCurrentUser: this.isCurrentUser(userStat.userId),
      })
    );
    this.applyUserStatsFilter();
  }

  get hideColumn(): boolean {
    return this.isPortrait;
  }

  get hideColumnIfUserOrPortrait(): boolean {
    return this.isPortrait || this.displayMode === DisplayMode.User;
  }

  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  get isFirebaseEmulator(): boolean {
    return environment.app.useFirebaseEmulator;
  }

  get isAllMonthsSelected(): boolean {
    return this.filterSelectedMonth === AllMonthsOption.SelectOptionValue;
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupEventListeners();
    this.init();
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
      })
    );
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.isPortrait = this.utilsService.isPortrait;
    });

    window.addEventListener('orientationchange', () => {
      this.isPortrait = this.utilsService.isPortrait;
    });
  }

  async init() {
    this.isLoading = true;
    this.searchTerm = '';
    this.isPortrait = this.utilsService.isPortrait;
    this.isProgrammerDevice = this.firestoreService.isProgrammerDevice;
    await this.setFilterValues();

    try {
      this.currentUserUid = await this.localStorageService.loadFirestoreUid();

      // Read control flags
      this.contingentData = await this.firestoreService.readContingentData(
        this.filterSelectedMonth
      );
      this.isStopped = !!this.contingentData.StopTranslationForAllUsers;

      // Total contingent
      this.totalLimit =
        this.contingentData.maxFreeTranslateCharsPerMonth ??
        environment.app.maxFreeTranslateCharsPerMonth;
      this.totalBuffer =
        this.contingentData.maxFreeTranslateCharsBufferPerMonth ??
        environment.app.maxFreeTranslateCharsBufferPerMonth;
      this.totalCharCount = await this.firestoreService.getTotalCharCount(
        this.filterSelectedMonth
      );
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
        await this.firestoreUtilsService.getDisplayedUserStatistics(
          this.isProgrammerDevice
        );
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

  onSearchTermChange(value: string | null | undefined): void {
    this.searchTerm = value ?? '';
    this.applyUserStatsFilter();
  }

  trackByUserId(index: number, userStat: DisplayedUserStatisticsRow): string {
    return userStat.userId;
  }

  /**
   * Sets the filteredUserStatsRows with the rows filtered by the current search term.
   *
   * Supported filter modes:
   * - Text search (default): matches `userName` or `displayedPlatform` (case-insensitive).
   * - Translated character count:
   *   - `>123` => rows with `translatedCharCount > 123`
   *   - `<10`  => rows with `translatedCharCount < 10`
   * - Target language count:
   *   - `>>5` => rows with `targetLanguages.length > 5`
   *   - `<<1` => rows with `targetLanguages.length < 1`
   *
   * Notes:
   * - Optional spaces after operators are supported (for example `> 123`, `>> 5`).
   * - If the search term is empty, all rows are returned unchanged.
   */
  private applyUserStatsFilter(): void {
    const rows = this.allUserStatsRows;
    const term = (this.searchTerm ?? '').trim();

    if (!term) {
      this.filteredUserStatsRows = rows;
      return;
    }

    // Target language count filters: >>5 or <<1
    const targetMatch = /^(>>|<<)\s*(\d+)$/.exec(term);
    if (targetMatch) {
      const operator = targetMatch[1];
      const value = Number(targetMatch[2]);

      this.filteredUserStatsRows = rows.filter((u) => {
        const count = u.targetLanguages?.length ?? 0;
        return operator === '>>' ? count > value : count < value;
      });
      return;
    }

    // Translated character count filters: >123 or <10
    const charMatch = /^([<>])\s*(\d+)$/.exec(term);
    if (charMatch) {
      const operator = charMatch[1];
      const value = Number(charMatch[2]);

      this.filteredUserStatsRows = rows.filter((u) =>
        operator === '>'
          ? u.translatedCharCount > value
          : u.translatedCharCount < value
      );
      return;
    }

    // Default text filter on userName, displayedPlatform, or displayedModel
    const lower = term.toLowerCase();
    this.filteredUserStatsRows = rows.filter(
      (u) =>
        u.userName.toLowerCase().includes(lower) ||
        (u.displayedPlatform ?? '').toLowerCase().includes(lower) ||
        (u.displayedModel ?? '').toLowerCase().includes(lower)
    );
  }

  getSectionHeader(translationKey: string): string {
    let selectedMonth: string;

    if (this.isAllMonthsSelected) {
      selectedMonth = this.translate.instant(AllMonthsOption.SelectOptionValue);
    } else {
      selectedMonth = this.translate.instant(
        this.selectedMonthForStatisticsSections
      );
    }

    return `${this.translate.instant(translationKey)}: ${selectedMonth}`;
  }

  private async setFilterValues(): Promise<void> {
    this.displayMode =
      await this.localStorageService.getStatisticsDisplayMode();
    this.selectedDisplayMode = this.displayMode;

    this.allFilterMonthValues =
      this.utilsService.getAllFirestoreSearchStringsForMonth();
    this.filterSelectedMonth =
      await this.localStorageService.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        this.isProgrammerDevice
      );
    this.selectedMonthForStatisticsSections = this.filterSelectedMonth;
  }

  async onFilterData(): Promise<void> {
    this.selectedMonthForStatisticsSections = this.filterSelectedMonth;
    this.displayMode = this.selectedDisplayMode;

    // Store selected month in local storage
    await this.localStorageService
      .saveStatisticsSelectedMonth(this.filterSelectedMonth)
      .catch((error) => {
        console.error('Error saving selected month to local storage:', error);
      });
    // Store display mode in local storage
    await this.localStorageService
      .saveStatisticsDisplayMode(this.displayMode)
      .catch((error) => {
        console.error('Error saving display mode to local storage:', error);
      });
    // Trigger data reload with current filters
    await this.init();
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserUid;
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
