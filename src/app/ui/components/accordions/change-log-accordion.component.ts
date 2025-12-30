import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-change-log-accordion',
  templateUrl: './change-log-accordion.component.html',
  standalone: true,
  imports: [
    IonAccordion,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    TranslateModule,
    CommonModule
  ],
})
export class ChangeLogAccordionComponent {
  @Input() versionInfo!: string;
  @Input() lang: string = 'en';
  @Output() ionChange = new EventEmitter<void>();

  constructor(public translate: TranslateService) {}

  openChangelog() {
    this.ionChange.emit();
  }
}
