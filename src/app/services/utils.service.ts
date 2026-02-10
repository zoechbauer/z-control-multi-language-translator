import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { HelpModalComponent } from '../help-modal/help-modal.component';
import { Tab } from '../enums';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { environment } from 'src/environments/environment';
import { DeviceInfo } from '../shared/app.interfaces';

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
    private readonly modalController: ModalController,
    private readonly router: Router,
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
   * Returns true if the device is a small device (mobile, short height, portrait).
   */
  get isSmallDevice(): boolean {
    const isMobileHeight = window.innerHeight <= 640;
    return isMobileHeight && this.isPortrait;
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
          'desktop',
          'landscape',
        );
        switch (modal.component) {
          case HelpModalComponent:
            modal.classList.add('manual-instructions-modal');
            break;
          case MarkdownViewerComponent:
            modal.classList.add('change-log-modal');
            break;
          default:
            console.error(
              'Unknown modal component for setting landscape class',
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
   * Returns the current year and month as a string in the format 'YYYY-MM'.
   */
  getCurrentYearMonth(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Checks if the given Firebase UID matches the programmer's device UID from the environment config.
   * @param firebaseUID The Firebase UID to check
   * @returns True if the UID matches the programmer's device, false otherwise
   */
  isProgrammerDevice(firebaseUID: string | null): boolean {
    const pgmDevices = environment.app.programmerDevices.devices.map((deviceObj) => {
      return Object.values(deviceObj)[0];
    });

    if (!firebaseUID) {
      return false;
    }

    return pgmDevices.includes(firebaseUID);
  }

  /**
   * Returns device information such as user agent, platform, language, and app version.
   */
  getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      appVersion: environment.version,
    };
  }
}
