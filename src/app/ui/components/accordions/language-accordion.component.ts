import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LocalStorageService } from '@app/services/local-storage.service';

@Component({
  selector: 'app-language-accordion',
  templateUrl: './language-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    TranslateModule,
    CommonModule,
    FormsModule,
  ],
})
export class LanguageAccordionComponent {
  translate = inject(TranslateService);
  localStorage = inject(LocalStorageService);

  @Input() lang?: string;
}
