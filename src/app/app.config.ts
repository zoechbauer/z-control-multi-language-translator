import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app-routes';
import { ServicesModule } from './services.module';
import { environment } from 'src/environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      // all ionic services are now available for injection
      mode: 'md',
    }),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),

    importProvidersFrom(ServicesModule),

    provideTranslateService({ fallbackLang: 'de' }),
    ...provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
