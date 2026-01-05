// src/app/services.module.ts
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Drivers } from '@ionic/storage';
import { IonicStorageModule } from '@ionic/storage-angular';

import { UtilsService } from './services/utils.service';
import { LocalStorageService } from './services/local-storage.service';
import { TranslationGoogleTranslateService } from './services/translation-google-translate.service';

@NgModule({
  imports: [
    IonicModule,
  IonicStorageModule.forRoot({
      name: '__mydb',
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    })
    ],
  providers: [
    UtilsService,
    LocalStorageService,
    TranslationGoogleTranslateService
  ]
})
export class ServicesModule { }
