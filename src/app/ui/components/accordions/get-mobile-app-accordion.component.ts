import { Component, Input, inject } from '@angular/core';
import {
  IonAccordion,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GetMobileAppComponent } from '../get-mobile-app/get-mobile-app.component';

@Component({
  selector: 'app-get-mobile-app-accordion',
  templateUrl: './get-mobile-app-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    TranslateModule,
    GetMobileAppComponent,
  ],
})
export class GetMobileAppAccordionComponent {
  translate = inject(TranslateService);

  @Input() lang!: string;
}
