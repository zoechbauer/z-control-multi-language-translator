import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabSettingsPage } from './tab-settings.page';
import { TabSettingsPageRoutingModule } from './tab-settings-routing.module';
import { SettingsComponent } from '../settings/settings.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabSettingsPageRoutingModule,
  ],
  declarations: [TabSettingsPage, SettingsComponent],
})
export class TabSettingsPageModule {}
