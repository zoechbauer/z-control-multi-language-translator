import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tab-translation',
        loadChildren: () =>
          import('../tab-translation/tab-translation.module').then(
            (m) => m.TabTranslationPageModule
          ),
      },
      {
        path: 'tab-settings',
        loadChildren: () =>
          import('../tab-settings/tab-settings.module').then(
            (m) => m.TabSettingsPageModule
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/tab-translation',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab-translation',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
