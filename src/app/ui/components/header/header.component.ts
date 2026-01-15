import { Component, Input } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LogoType, Tab } from './../../../enums';
import { UtilsService } from 'src/app/services/utils.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    NgIf,
    LogoComponent,
  ],
})
export class HeaderComponent {
  @Input() currentTab!: Tab;
  @Input() selectedTargetLanguages: string[] = [];
  LogoType = LogoType;
  Tab = Tab;

  constructor(
    public translate: TranslateService,
    public readonly utilsService: UtilsService
  ) {}

  get isLargeScreen(): boolean {
    return !this.utilsService.isSmallScreen;
  }

  get onTranslateTab(): boolean {
    return this.currentTab === Tab.Translate;
  }

  get onSettingsTab(): boolean {
    return this.currentTab === Tab.Settings;
  }

  get hideTabsBar(): boolean {
    return !this.utilsService.isShowIonTabBar;
  }

  goToSettings() {
    this.utilsService.navigateToTab(Tab.Settings);
  }

  goToTranslate() {
    this.utilsService.navigateToTab(Tab.Translate);
  }

  goToSettingsAndOpenFeedback() {
    this.utilsService.navigateToTabWithParams(Tab.Settings, {
      open: 'z-control',
    });
    setTimeout(() => {
      this.utilsService.logoClickedSub.next(true);
    }, 500);
  }

  async openHelpModal() {
    this.utilsService.openHelpModal();
  }
}
