import { Component, Input, inject } from '@angular/core';
import { IonAccordion, IonItem, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

import { LogoType } from '@app/shared/enums';
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
    CommonModule,
  ],
})
export class FeedbackAccordionComponent {
  translate = inject(TranslateService);

  @Input() lang!: string;
  LogoType = LogoType;
}
