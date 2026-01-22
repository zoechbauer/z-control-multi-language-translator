import { Injectable } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  NavigationBar,
  NavigationBarColor,
} from '@capgo/capacitor-navigation-bar';

@Injectable({
  providedIn: 'root',
})
export class SystemBarsService {
  private readonly primaryColor = '#3880ff';
  private readonly lightBgColor = '#fefefe'; // almost white
  private readonly darkBgColor = '#000000';

  /**
   * Sets the status bar and navigation bar colors and styles based on the dark mode setting.
   * @param isDarkMode Whether dark mode is enabled
   */
  async setBars(isDarkMode: boolean): Promise<void> {
    const bgColor = isDarkMode ? this.darkBgColor : this.lightBgColor;
    const statusStyle = isDarkMode ? Style.Light : Style.Dark;
    const navDarkButtons = !isDarkMode; // dark icons on light background

    // StatusBar
    await StatusBar.setBackgroundColor({ color: bgColor });
    await StatusBar.setStyle({ style: statusStyle });

    // NavigationBar
    await NavigationBar.setNavigationBarColor({
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
