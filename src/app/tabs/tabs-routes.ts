import { Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tab-translation',
        loadComponent: () =>
          import('../tab-translation/tab-translation.page').then(
            (m) => m.TabTranslationPage
          ),
      },
      {
        path: 'tab-settings',
        loadComponent: () =>
          import('../tab-settings/tab-settings.page').then(
            (m) => m.TabSettingsPage
          ),
      },
      {
        path: '',
        redirectTo: 'tab-translation',
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