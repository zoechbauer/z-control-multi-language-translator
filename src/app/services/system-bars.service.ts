import { Inject, Injectable } from '@angular/core';
import { Style } from '@capacitor/status-bar';
import { NavigationBarColor } from '@capgo/capacitor-navigation-bar';

import { STATUS_BAR, NAVIGATION_BAR } from './capacitor-tokens';

@Injectable({
  providedIn: 'root',
})
export class SystemBarsService {
  private readonly lightBgColor = '#3880ff';
  private readonly darkBgColor = '#000000';

  constructor(
    @Inject(STATUS_BAR) private readonly statusBar: any,
    @Inject(NAVIGATION_BAR) private readonly navigationBar: any
  ) {}

  // Only specific Samsung models need a status style override.
  // J5 is intentionally excluded because it works with the default mode-based logic.
  private hasSamsungStatusStyleOverride(userAgent: string): boolean {
    return /SM-A\d{3}/i.test(userAgent);
  }

  /**
   * Sets the status bar and navigation bar colors and styles based on the dark mode setting.
   * @param isDarkMode Whether dark mode is enabled
   */
  async setBars(isDarkMode: boolean): Promise<void> {
    const bgColor = isDarkMode ? this.darkBgColor : this.lightBgColor;
    const userAgent = navigator.userAgent || '';
    const hasSamsungOverride = this.hasSamsungStatusStyleOverride(userAgent);

    // Keep verified behavior for models matched in hasSamsungStatusStyleOverride().
    let statusStyle = isDarkMode ? Style.Dark : Style.Light;
    if (hasSamsungOverride) {
      statusStyle = Style.Dark;
    }

    const navDarkButtons = !isDarkMode;

    // StatusBar
    await this.statusBar.setBackgroundColor({ color: bgColor });
    await this.statusBar.setStyle({ style: statusStyle });

    // NavigationBar
    await this.navigationBar.setNavigationBarColor({
      color: isDarkMode ? NavigationBarColor.BLACK : NavigationBarColor.WHITE,
      darkButtons: navDarkButtons,
    });
  }

  /**
   * Returns whether the user's system prefers dark mode.
   * @returns True if dark mode is preferred, false otherwise
   */
  async getCurrentIsDarkMode(): Promise<boolean> {
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
