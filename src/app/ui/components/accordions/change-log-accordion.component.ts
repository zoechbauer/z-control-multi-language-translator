import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
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
  translate = inject(TranslateService);

  @Input() versionInfo!: string;
  @Input() lang!: string;
  @Output() ionChange = new EventEmitter<void>();

  openChangelog() {
    this.ionChange.emit();
  }
}
