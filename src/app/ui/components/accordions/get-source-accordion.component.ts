import { Component, Input } from '@angular/core';
import {
  IonAccordion,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GetSourceCodeComponent } from '../get-source-code/get-source-code.component';

@Component({
  selector: 'app-get-source-accordion',
  templateUrl: './get-source-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    TranslateModule,
    GetSourceCodeComponent
  ],
})
export class GetSourceAccordionComponent {
  @Input() selectedLanguage!: string;

  constructor(public translate: TranslateService) {}

}
