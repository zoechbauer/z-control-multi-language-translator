import { NAVIGATION_BAR, SPLASH_SCREEN, STATUS_BAR } from './capacitor-tokens';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';

describe('capacitor-tokens', () => {
  it('SPLASH_SCREEN should be defined and factory should return SplashScreen', () => {
    expect(SPLASH_SCREEN).toBeDefined();
    // The factory returns the SplashScreen object
    expect((SPLASH_SCREEN as any).ɵprov.factory()).toBe(SplashScreen);
  });

  it('STATUS_BAR should be defined and factory should return StatusBar', () => {
    expect(STATUS_BAR).toBeDefined();
    // The factory returns the StatusBar object
    expect((STATUS_BAR as any).ɵprov.factory()).toBe(StatusBar);
  });

  it('NAVIGATION_BAR should be defined and factory should return NavigationBar', () => {
    expect(NAVIGATION_BAR).toBeDefined();
    // The factory returns the NavigationBar object
    expect((NAVIGATION_BAR as any).ɵprov.factory()).toBe(NavigationBar);
  });
});
