import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

import { HelpModalComponent } from '../help-modal/help-modal.component';
import { Tab } from '../enums';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  logoClickedSub = new Subject<boolean>();
  logoClicked$ = this.logoClickedSub.asObservable();
  private currentModal: HTMLIonModalElement | null = null;

  constructor(
    private readonly modalController: ModalController,
    private readonly router: Router
  ) {
    window.addEventListener('orientationchange', () => {
      if (this.currentModal) {
        this.setModalLandscapeClasses(this.currentModal);
      }
    });
  }

  get isDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  get isPortrait(): boolean {
    return window.matchMedia('(orientation: portrait)').matches;
  }

  get isSmallScreen(): boolean {
    const isMobileWidth = window.innerWidth <= 768;
    return isMobileWidth && this.isPortrait;
  }

  get isSmallDevice(): boolean {
    const isMobileHeight = window.innerHeight <= 640;
    return isMobileHeight && this.isPortrait;
  }

  get isDesktop(): boolean {
    return !Capacitor.isNativePlatform();
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  navigateToTab(tab: Tab): void {
    this.router.navigate([`/tabs/tab-${tab}`]);
  }

  navigateToTabWithParams(tab: Tab, params: any): void {
    this.router.navigate([`/tabs/tab-${tab}`], { queryParams: params });
  }

  showOrHideIonTabBar(): void {
    if (this.isSmallScreen) {
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

  async openHelpModal() {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
    });
    this.currentModal = modal;
    this.setModalLandscapeClasses(modal);
    return await modal.present();
  }

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

  setModalLandscapeClasses(modal: HTMLIonModalElement) {
    setTimeout(() => {
      if (modal.classList && typeof modal.classList.remove === 'function') {
        modal.classList.remove(
          'manual-instructions-modal',
          'change-log-modal',
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

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

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
}
