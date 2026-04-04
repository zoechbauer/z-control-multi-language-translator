import { InjectionToken } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';

export const SPLASH_SCREEN = new InjectionToken<typeof SplashScreen>('SplashScreen', {
  providedIn: 'root',
  factory: () => SplashScreen,
});
export const STATUS_BAR = new InjectionToken<typeof StatusBar>('StatusBar', {
  providedIn: 'root',
  factory: () => StatusBar,
});
export const NAVIGATION_BAR = new InjectionToken<typeof NavigationBar>('NavigationBar', {
  providedIn: 'root',
  factory: () => NavigationBar,
});