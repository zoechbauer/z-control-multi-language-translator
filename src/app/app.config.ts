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
import {
  provideFirestore,
  getFirestore,
  connectFirestoreEmulator,
} from '@angular/fire/firestore';
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from '@angular/fire/functions';

import { routes } from './app-routes';
import { ServicesModule } from './services.module';
import { environment } from '@env/environment';

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
    // DRY: Helper to get emulator host if using emulator from ionic_setup
    (() => {
      const getEmulatorHost = () => {
        const host = globalThis.location.hostname;

        if (!environment.app.useFirebaseEmulator) {
          return undefined;
        }

        // Browser running on same machine as emulator
        if (host === 'localhost' || host === '127.0.0.1') {
          return '127.0.0.1';
        }

        // Browser/device running on LAN (example IP of your dev machine)
        if (host === '10.0.0.68') {
          return '10.0.0.68';
        }

        return undefined;
      };

      return [
        provideFirestore(() => {
          const firestore = getFirestore();
          const emulatorHost = getEmulatorHost();
          if (emulatorHost) {
            console.log(
              'Connecting to Firestore emulator with host:',
              emulatorHost
            );
            connectFirestoreEmulator(firestore, emulatorHost, 8080);
          }
          return firestore;
        }),
        provideFunctions(() => {
          const functions = getFunctions();
          const emulatorHost = getEmulatorHost();
          if (emulatorHost) {
            console.log(
              'Connecting to Functions emulator with host:',
              emulatorHost
            );
            connectFunctionsEmulator(functions, emulatorHost, 5001);
          }
          return functions;
        }),
      ];
    })(),
  ],
};
