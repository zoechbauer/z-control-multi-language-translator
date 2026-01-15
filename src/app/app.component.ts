import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar } from '@capacitor/status-bar';

import { SafeAreaInsets } from './services/safe-area-insets';
import { environment } from 'src/environments/environment';
import { SystemBarsService } from './services/system-bars.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  isNativeApp = Capacitor.isNativePlatform();
  showTabsBar = environment.app.showTabsBar;

  constructor(
    private readonly renderer: Renderer2,
    private readonly safeAreaInsets: SafeAreaInsets,
    private readonly systemBars: SystemBarsService
  ) {}

  ngOnInit() {
    this.initializeApp();
  }

  async initializeApp() {
    if (this.isNativeApp) {
      this.renderer.addClass(document.body, 'native-app');

      SplashScreen.hide();
      this.safeAreaInsets.setSafeAreaInsetsFix();
      StatusBar.setOverlaysWebView({ overlay: false });

      const isDarkMode = await this.systemBars.getCurrentIsDarkMode();
      await this.systemBars.setBars(isDarkMode);

      StatusBar.show();

      // // don't use utilsService.isDarkMode here to avoid broken layout
      // const isDarkMode = window.matchMedia(
      //   '(prefers-color-scheme: dark)'
      // ).matches;

      // StatusBar.setOverlaysWebView({ overlay: false });

      // const primaryColor = '#3880ff';
      // if (isDarkMode) {
      //   StatusBar.setBackgroundColor({ color: primaryColor });
      //   StatusBar.setStyle({ style: Style.Light });
      // } else {
      //   StatusBar.setBackgroundColor({ color: primaryColor });
      //   StatusBar.setStyle({ style: Style.Dark });
      // }
      // StatusBar.show();

      // const navColorLight = '#ffffff';
      // const navColorDark = '#000000';
      // NavigationBar.setNavigationBarColor({
      //   color: isDarkMode ? navColorDark : navColorLight,
      //   darkButtons: !isDarkMode,
      // });
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }
  }
}
