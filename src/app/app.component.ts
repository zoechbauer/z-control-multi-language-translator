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
    private readonly safeAreaInsets: SafeAreaInsetsService,
    private readonly systemBars: SystemBarsService,
    private readonly firestoreService: FirebaseFirestoreService,
    private readonly textSpeechService: TextSpeechService,
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
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }

    this.firestoreService.init();
    this.textSpeechService.init();
  }
}
