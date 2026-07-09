import { Component, Input, inject } from '@angular/core';
import {
  IonAccordion,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GetStatisticsComponent } from '../get-statistics/get-statistics.component';

@Component({
  selector: 'app-get-statistics-accordion',
  templateUrl: './get-statistics-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    TranslateModule,
    GetStatisticsComponent
  ],
})
export class GetStatisticsAccordionComponent {
  translate = inject(TranslateService);

  @Input() lang!: string;
  @Input() yearMonth!: string;

}
