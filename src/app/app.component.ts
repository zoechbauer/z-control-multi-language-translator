import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar } from '@capacitor/status-bar';

import { SafeAreaInsetsService } from './services/safe-area-insets.service';
import { environment } from 'src/environments/environment';
import { SystemBarsService } from './services/system-bars.service';
import { FirebaseFirestoreService } from './services/firebase-firestore.service';
import { TextSpeechService } from './services/text-to-speach.service';
import { LocalStorageService } from './services/local-storage.service';
import { TranslateService } from '@ngx-translate/core';

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
    private readonly translate: TranslateService,
    private readonly renderer: Renderer2,
    private readonly safeAreaInsets: SafeAreaInsetsService,
    private readonly systemBars: SystemBarsService,
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly textSpeechService: TextSpeechService,
    private readonly localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    this.initializeApp();
  }

  async initializeApp() {
    if (this.isNativeApp) {
      this.renderer.addClass(document.body, 'native-app');

      await SplashScreen.hide();
      await StatusBar.setOverlaysWebView({ overlay: false });
      this.safeAreaInsets.setSafeAreaInsetsFix();

      const isDarkMode = await this.systemBars.getCurrentIsDarkMode();
      await this.systemBars.setBars(isDarkMode);

      await StatusBar.show();
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }

    await this.localStorageService.initializeServicesAsync(this.translate);
    await this.firestoreService.init();
    await this.textSpeechService.init();
  }
}
