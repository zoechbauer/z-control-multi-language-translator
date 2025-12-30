import { Component, Input } from '@angular/core';
import {
  IonAccordion,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

import { LogoType } from 'src/app/enums';
import { LogoComponent } from '../logo/logo.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-feedback-accordion',
  templateUrl: './feedback-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    TranslateModule,
    LogoComponent,
    FooterComponent,
    CommonModule
  ],
})
export class FeedbackAccordionComponent {
  @Input() lang: string = 'en';
  LogoType = LogoType;

  constructor(public translate: TranslateService) {}
}
