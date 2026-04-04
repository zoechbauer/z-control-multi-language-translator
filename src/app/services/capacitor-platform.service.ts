import { Injectable, Inject } from '@angular/core';
import { SPLASH_SCREEN, STATUS_BAR } from './capacitor-tokens';

@Injectable({ providedIn: 'root' })
export class CapacitorPlatformService {
  constructor(
    @Inject(SPLASH_SCREEN) private readonly splashScreen: any,
    @Inject(STATUS_BAR) private readonly statusBar: any
  ) {}

  async hideSplashScreen() {
    await this.splashScreen.hide();
  }
  async setStatusBarOverlay(overlay: boolean) {
    await this.statusBar.setOverlaysWebView({ overlay });
  }
  async showStatusBar() {
    await this.statusBar.show();
  }
}