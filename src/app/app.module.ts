import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import {
  HttpClientModule,
} from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import {
  provideTranslateHttpLoader,
} from '@ngx-translate/http-loader';

import { addIcons } from 'ionicons';
import { arrowForwardOutline, languageOutline, mailOutline, settingsOutline } from 'ionicons/icons';
addIcons({
  'settings-outline': settingsOutline,
  'language-outline': languageOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'mail-outline': mailOutline
});

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      fallbackLang: 'de',
    }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ...provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
