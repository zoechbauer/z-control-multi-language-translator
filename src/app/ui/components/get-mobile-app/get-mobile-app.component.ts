import { Component, Input } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { DecimalPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LogoComponent } from '../logo/logo.component';
import { LogoType } from 'src/app/enums';
import { AppConstants } from 'src/app/shared/app.constants';
@Component({
  selector: 'app-get-mobile-app',
  templateUrl: './get-mobile-app.component.html',
  styleUrls: ['./get-mobile-app.component.scss'],
  standalone: true,
  imports: [IonIcon, LogoComponent, IonButton, NgIf, NgTemplateOutlet, TranslateModule, DecimalPipe],
})
export class GetMobileAppComponent {
  @Input() lang!: string;
  LogoType = LogoType;

  constructor() {}

  get maxTranslateCharsLengthPerMonth(): number {
    return AppConstants.maxFreeTranslateCharsPerMonth;
  }
}
