import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { AllMonthsOption, DisplayMode, Tab } from '../shared/enums';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { environment } from 'src/environments/environment';
import { DisplayedUserStatistics } from '../shared/firebase-firestore.interfaces';
import { UserDetailComponent } from '../ui/components/user-detail/user-detail.component';
import { HelpModalComponent } from '../ui/components/get-help/get-help.component';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  /**
   * Emits when the logo is clicked (used for feedback or navigation triggers).
   */
  logoClickedSub = new Subject<boolean>();
  /**
   * Observable for logo click events.
   */
  logoClicked$ = this.logoClickedSub.asObservable();
  private currentModal: HTMLIonModalElement | null = null;

  constructor(
    private readonly translate: TranslateService,
    private readonly modalController: ModalController,
    private readonly router: Router
  ) {
    globalThis.addEventListener('orientationchange', () => {
      if (this.currentModal) {
        this.setModalLandscapeClasses(this.currentModal);
      }
    });
  }

  /**
   * Returns true if the user's system prefers dark mode.
   */
  get isDarkMode(): boolean {
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Returns true if the device is in portrait orientation.
   */
  get isPortrait(): boolean {
    return globalThis.matchMedia('(orientation: portrait)').matches;
  }

  /**
   * Returns true if the device is a small screen (mobile, portrait).
   */
  get isSmallScreen(): boolean {
    const isMobileWidth = window.innerWidth <= 768;
    return isMobileWidth && this.isPortrait;
  }

  /**
   * Returns true if the device is a small device (short height, short width).
   */
  get isSmallDevice(): boolean {
    const isMobileHeight = window.innerHeight <= 640;
    const isMobileWidth = window.innerWidth <= 768;
    return isMobileHeight && isMobileWidth;
  }

  /**
   * Returns true if the app is running on a desktop (not native platform).
   */
  get isDesktop(): boolean {
    return !Capacitor.isNativePlatform();
  }

  /**
   * Returns true if the app is running on a native platform (Capacitor/Cordova).
   */
  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Returns true if the IonTabBar should be shown (based on config and screen size).
   */
  get isShowIonTabBar(): boolean {
    if (!environment.app.showTabsBar) {
      return false;
    }
    return this.isSmallScreen;
  }

  /**
   * Navigates to the specified tab.
   * @param tab The tab to navigate to
   */
  navigateToTab(tab: Tab): void {
    this.router.navigate([`/tabs/tab-${tab}`]);
  }

  /**
   * Navigates to the specified tab with query parameters.
   * @param tab The tab to navigate to
   * @param params Query parameters to include
   */
  navigateToTabWithParams(tab: Tab, params: any): void {
    this.router.navigate([`/tabs/tab-${tab}`], { queryParams: params });
  }

  /**
   * Shows or hides the IonTabBar based on current settings.
   */
  showOrHideIonTabBar(): void {
    if (this.isShowIonTabBar) {
      this.showIonTabBar();
    } else {
      this.hideIonTabBar();
    }
  }

  private hideIonTabBar(): void {
    const element = document.querySelector('ion-tab-bar');
    if (!element?.classList.contains('hide-ion-tab-bar')) {
      element?.classList.add('hide-ion-tab-bar');
    }
  }

  private showIonTabBar(): void {
    const element = document.querySelector('ion-tab-bar');
    if (element?.classList.contains('hide-ion-tab-bar')) {
      element?.classList.remove('hide-ion-tab-bar');
    }
  }

  /**
   * Opens the help modal dialog displaying the HelpModalComponent.
   *
   * This method creates and presents a modal containing the HelpModalComponent.
   * It also sets the currentModal reference and applies appropriate classes for
   * landscape/desktop orientation.
   *
   * @returns {Promise<void>} A promise that resolves when the modal is presented.
   */
  async openHelpModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
    });
    this.currentModal = modal;
    this.setModalLandscapeClasses(modal);
    return await modal.present();
  }

  /**
   * Opens the changelog modal dialog.
   */
  async openChangelog() {
    const modal = await this.modalController.create({
      component: MarkdownViewerComponent,
      componentProps: {
        fullChangeLogPath: 'assets/logs/CHANGELOG.md',
      },
    });
    this.currentModal = modal;
    this.setModalLandscapeClasses(modal);
    return await modal.present();
  }

  /**
   * Opens the user detail modal dialog.
   * @param lang The language code for displaying statistics in the modal
   * @param userStatistic The user statistics to display in the modal
   * @param displayMode The display mode for the user detail modal
   */
  async openUserDetail(
    lang: string,
    userStatistic: DisplayedUserStatistics,
    displayMode: DisplayMode
  ): Promise<void> {
    const modal = await this.modalController.create({
      component: UserDetailComponent,
      componentProps: {
        lang: lang,
        userStatistic: userStatistic,
        displayMode: displayMode,
      },
    });
    this.currentModal = modal;
    this.setModalLandscapeClasses(modal);
    return await modal.present();
  }

  /**
   * Sets appropriate CSS classes on the modal based on component type, device orientation, and platform.
   * Removes existing modal classes and adds component-specific and device-specific classes.
   * @param modal The modal element to apply classes to
   */
  setModalLandscapeClasses(modal: HTMLIonModalElement) {
    setTimeout(() => {
      if (modal.classList && typeof modal.classList.remove === 'function') {
        modal.classList.remove(
          'manual-instructions-modal',
          'change-log-modal',
          'user-detail-modal',
          'desktop',
          'landscape'
        );
        switch (modal.component) {
          case HelpModalComponent:
            modal.classList.add('manual-instructions-modal');
            break;
          case MarkdownViewerComponent:
            modal.classList.add('change-log-modal');
            break;
          case UserDetailComponent:
            modal.classList.add('user-detail-modal');
            break;
          default:
            console.error(
              'Unknown modal component for setting landscape class'
            );
        }
        if (this.isDesktop) {
          modal.classList.add('desktop');
        }
        if (!this.isPortrait) {
          modal.classList.add('landscape');
        }
      }
    }, 10);
  }

  /**
   * Scrolls to a specific element by ID
   * @param id - The ID of the target element
   * @param event - The click event to prevent default behavior
   */
  scrollTo(id: string, event: Event) {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  }

  /**
   * Scrolls smoothly to the element with the given ID (no event parameter).
   * @param elementId The element ID
   */
  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /**
   * Scrolls smoothly to the element with the given ID, adjusting for tab bar and navigation bar height.
   * @param elementId The element ID
   */
  scrollToElementUsingTabBar(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      const tabBarHeight = 60;
      const navigationBarHeight = 44;
      const yOffset = -navigationBarHeight - tabBarHeight;

      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      element.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  /**
   * Formats a Date object to an ISO-like string in the format 'YYYY-MM-DD'.
   * @param date The date to format or null
   * @returns The formatted date string or an empty string if date is null
   */
  formatDateISO(date: Date | null): string {
    if (date == null) return '';
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      console.error('Invalid date provided for formatting:', date);
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a Date object to an ISO-like string in the format 'YYYY-MM-DD HH:mm'.
   * @param date The date to format or null
   * @returns The formatted date string or an empty string if formatting fails
   */
  formatDateTimeISO(date: Date | null): string {
    if (date == null) return '';
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      console.error('Invalid date provided for formatting:', date);
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * Formats a Date object to a Firestore search string in the format 'YYYY-MM'.
   * @param date The date to format or null
   * @returns The formatted date string or an empty string if formatting fails
   */
  formatDateTimeFirestoreSearchString(date: Date | null): string {
    if (date == null) return '';
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      console.error('Invalid date provided for formatting:', date);
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Generates an array of Firestore search strings for each month from a start date to the current date.
   * @returns An array of formatted date strings in the format 'YYYY-MM' and 'all'
   */
  getAllFirestoreSearchStringsForMonth(): string[] {
    const startDate = new Date('2026-02-01');
    const endDate = new Date();
    const searchStrings: string[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const searchString =
        this.formatDateTimeFirestoreSearchString(currentDate);
      searchStrings.push(searchString);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    searchStrings.push(AllMonthsOption.SelectOptionValue);

    return searchStrings;
  }

  /**
   * Returns the current month.
   * @returns {string} The current month
   */
  getCurrentMonth(): string {
    return this.formatDateTimeFirestoreSearchString(
      new Date()
    );
  }
}
