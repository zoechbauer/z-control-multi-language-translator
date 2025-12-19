import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabTranslationPage } from './tab-translation.page';

const routes: Routes = [
  {
    path: '',
    component: TabTranslationPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabTranslationPageRoutingModule {}
