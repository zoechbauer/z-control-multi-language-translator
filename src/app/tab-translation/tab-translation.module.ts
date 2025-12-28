import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabTranslationPage } from './tab-translation.page';
import { TranslateModule } from '@ngx-translate/core';

import { TabTranslationPageRoutingModule } from './tab-translation-routing.module';
import { TranslateComponent } from '../translate/translate.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    FormsModule,
    TabTranslationPageRoutingModule,
  ],
  declarations: [TabTranslationPage, TranslateComponent],
})
export class TabTranslationPageModule {}
