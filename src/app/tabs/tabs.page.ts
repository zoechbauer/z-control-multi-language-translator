import { Component, inject } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  IonTabs,
  IonTabBar,
  IonLabel,
  IonIcon,
  IonTabButton,
} from '@ionic/angular/standalone';

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
  translate = inject(TranslateService);

}
