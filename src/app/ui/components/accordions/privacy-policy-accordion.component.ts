import { Component, Input } from '@angular/core';
import {
  IonAccordion,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LogoType } from 'src/app/enums';
import { PrivacyPolicyComponent } from './../privacy-policy/privacy-policy.component';

@Component({
  selector: 'app-privacy-policy-accordion',
  templateUrl: './privacy-policy-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    TranslateModule,
    PrivacyPolicyComponent,
  ],
})
export class PrivacyPolicyAccordionComponent {
  @Input() selectedLanguage: string | undefined = 'en';
  LogoType = LogoType;

  constructor(public translate: TranslateService) {}
}
