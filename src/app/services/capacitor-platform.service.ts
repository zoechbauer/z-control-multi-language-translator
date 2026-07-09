import { Injectable, inject } from '@angular/core';
import { SPLASH_SCREEN, STATUS_BAR } from './capacitor-tokens';

@Injectable({ providedIn: 'root' })
export class CapacitorPlatformService {
  private readonly splashScreen = inject(SPLASH_SCREEN);
  private readonly statusBar = inject(STATUS_BAR);


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