import { Component, Input, OnInit } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { NgFor, NgIf, NgTemplateOutlet, DecimalPipe, JsonPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LogoComponent } from '../logo/logo.component';
import { LogoType } from 'src/app/enums';
import {
  FirebaseFirestoreService,
} from 'src/app/services/firebase-firestore.service';
import { environment } from 'src/environments/environment';
import { UserStatistics, UserType, FirestoreContingentData } from 'src/app/shared/firebase-firestore.interfaces';

@Component({
  selector: 'app-get-statistics',

  templateUrl: './get-statistics.component.html',
  styleUrls: ['./get-statistics.component.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    LogoComponent,
    NgIf,
    NgFor,
    JsonPipe,
    NgTemplateOutlet,
    DecimalPipe,
    TranslateModule,
  ],
})
export class GetStatisticsComponent implements OnInit {
  @Input() lang!: string;
  LogoType = LogoType;

  // Statistics data
  isLoading = true;
  contingentData: FirestoreContingentData | null = null;
  isStopped = false;
  totalCharCount = 0;
  totalLimit = 0;
  totalBuffer = 0;
  totalRemaining = 0;
  userCharCount = 0;
  userLimit = 0;
  userRemaining = 0;
  userStatistics: UserStatistics[] = [];
  users: UserType[] = [];
  displayedUserStatistics: Array<{
    label: string;
    uid: string;
    charCount: number;
    remaining: number;
    platform: string;
    lastUpdated?: string;
  }> = [];

  constructor(private readonly firestoreService: FirebaseFirestoreService) {}

  ngOnInit(): void {
    this.init();
  }

  async init() {
    this.isLoading = true;
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
    this.userCharCount = await this.firestoreService.getCharCountForUser();
    this.userRemaining = Math.max(0, this.userLimit - this.userCharCount);

    // user statistics
    this.userStatistics = await this.firestoreService.getAllUserStatistics();
    console.log('User Statistics:', this.userStatistics);

    this.users = await this.firestoreService.getUsers();
    console.log('Users:', this.users);

    this.displayedUserStatistics = this.userStatistics.map((user) => {
      const userInfo = this.users.find((u) => u.userId === user.uid);
      const label = userInfo?.name || 'unknown';
      const platform = userInfo?.deviceInfo?.platform?.toLowerCase().includes('win32')
        ? 'web'
        : 'native';

      const remaining = this.userLimit - user.charCount;

      let lastUpdated = '';
      if (user.lastUpdated) {
        const dateObj = new Date(user.lastUpdated);
        lastUpdated = Number.isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleString();
      }

      return {
        label,
        uid: user.uid,
        charCount: user.charCount,
        remaining: Math.max(0, remaining),
        platform,
        lastUpdated,
      };
    });

    this.isLoading = false;
  }
}
