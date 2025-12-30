import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LogoComponent } from '../logo/logo.component';
import { LogoType } from 'src/app/enums';
@Component({
  selector: 'app-get-source-code',
  templateUrl: './get-source-code.component.html',
  styleUrls: ['./get-source-code.component.scss'],
  standalone: true,
  imports: [IonIcon, LogoComponent, NgIf, NgTemplateOutlet, TranslateModule],
})
export class GetSourceCodeComponent  {
  @Input() lang: string = 'en';
  LogoType = LogoType;

  constructor() { }

}
