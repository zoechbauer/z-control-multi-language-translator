import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  @Input() lang?: string;
  @Output() ionChange = new EventEmitter<string>();

  constructor(public translate: TranslateService) {}

  onLanguageChange(event: any) {
    this.ionChange.emit(this.lang);
  }
}
