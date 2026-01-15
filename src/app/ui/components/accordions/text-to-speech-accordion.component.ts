import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RangeCustomEvent } from '@ionic/angular';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonRange,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppConstants } from 'src/app/shared/app.constants';
import { TextToSpeechValues } from 'src/app/shared/interfaces';

@Component({
  selector: 'app-text-to-speech-accordion',
  templateUrl: './text-to-speech-accordion.component.html',
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonAccordion,
    IonItem,
    IonLabel,
    IonRange,
    TranslateModule,
    CommonModule,
    FormsModule,
  ],
})
export class TextToSpeechAccordionComponent {
  @Input() lang!: string;
  @Input() isNative!: boolean;

  @Input() ngModel!: TextToSpeechValues;
  @Output() ngModelChange = new EventEmitter<TextToSpeechValues>();

  constructor(public translate: TranslateService) {}

  getTtsRateLabel(): string {
    return this.ngModel?.rate
      ? `${this.translate.instant(
          'SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_RATE'
        )} : ${this.ngModel.rate}`
      : this.translate.instant(
          'SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_RATE'
        );
  }

    getTtsPitchLabel(): string {
    return this.ngModel?.pitch
      ? `${this.translate.instant(
          'SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_PITCH'
        )} : ${this.ngModel.pitch}`
      : this.translate.instant(
          'SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_PITCH'
        );
  }

  onChangeTtsRate(event: RangeCustomEvent) {
    this.ngModel = { ...this.ngModel, rate: event.detail.value as number };
    this.ngModelChange.emit(this.ngModel);
  }

  onChangeTtsPitch(event: RangeCustomEvent) {
    this.ngModel = { ...this.ngModel, pitch: event.detail.value as number };
    this.ngModelChange.emit(this.ngModel);
  }

  resetTtsSettings() {
    this.ngModel = {
      ...this.ngModel,
      rate: AppConstants.textToSpeechDefaultValue,
      pitch: AppConstants.textToSpeechDefaultValue,
    };
    this.ngModelChange.emit(this.ngModel);
  }
}
