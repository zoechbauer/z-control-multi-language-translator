import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import {
  GoogleLanguage,
  TranslationGoogleTranslateService,
} from 'src/app/services/translation-google-translate.service';

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
export class LanguageAccordionComponent implements OnInit, OnDestroy {
  @Input() lang?: string;
  @Output() ionChange = new EventEmitter<string>();

  baseLanguageName: string = '';
  private subscription?: Subscription;

  constructor(
    public translate: TranslateService,
    private readonly googleTranslateService: TranslationGoogleTranslateService
  ) {}

  ngOnInit() {
    this.loadBaseLanguageName();
  }

  onLanguageChange(event: any) {
    this.loadBaseLanguageName();
  }

  private loadBaseLanguageName() {
    this.subscription = this.googleTranslateService
      .getBaseLanguageName(this.lang)
      .subscribe((name) => {
        this.baseLanguageName = name;
        this.ionChange.emit(this.baseLanguageName);
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
