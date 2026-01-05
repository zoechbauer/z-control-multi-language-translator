import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  IonTabs,
  IonTabBar,
  IonLabel,
  IonIcon,
  IonTabButton,
} from '@ionic/angular/standalone';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonLabel,
    IonIcon,
    IonTabButton,
    TranslateModule,
  ],
})
export class TabsPage {
  constructor(public translate: TranslateService) {}
}
