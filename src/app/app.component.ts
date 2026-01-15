import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Component, Renderer2 } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';

import { SafeAreaInsets } from './services/safe-area-insets';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  isNativeApp = Capacitor.isNativePlatform();
  showTabsBar = environment.app.showTabsBar;

  constructor(
    private readonly renderer: Renderer2,
    private readonly safeAreaInsets: SafeAreaInsets
  ) {
    this.initializeApp();
  }

  initializeApp() {
    if (this.isNativeApp) {
      this.renderer.addClass(document.body, 'native-app');

      SplashScreen.hide();

      this.safeAreaInsets.setSafeAreaInsetsFix();

      StatusBar.setOverlaysWebView({ overlay: false });

// don't use utilsService.isDarkMode here to avoid broken layout
      const isDarkMode = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;

      const primaryColor = '#3880ff';

      if (isDarkMode) {
        StatusBar.setBackgroundColor({ color: primaryColor });
        StatusBar.setStyle({ style: Style.Light });
      } else {
        StatusBar.setBackgroundColor({ color: primaryColor });
        StatusBar.setStyle({ style: Style.Dark });
      }

      StatusBar.show();
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }
  }
}
