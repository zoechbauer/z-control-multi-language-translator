import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs.page').then(m => m.TabsPage),
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

export const TabsPageRoutingModule = RouterModule.forChild(routes);