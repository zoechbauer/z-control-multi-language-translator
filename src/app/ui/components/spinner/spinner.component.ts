import { NgIf } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { IonSpinner } from "@ionic/angular/standalone";
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: true,
  imports: [IonSpinner, TranslatePipe, NgIf],
})
export class SpinnerComponent {
  translate = inject(TranslateService);

  @Input() showText: boolean = false;

}
