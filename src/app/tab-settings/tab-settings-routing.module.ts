import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabSettingsPage } from './tab-settings.page';

const routes: Routes = [
  {
    path: '',
    component: TabSettingsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabSettingsPageRoutingModule {}
