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
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-target-languages-accordion',
  templateUrl: './target-languages-accordion.component.html',
  standalone: true,
  imports: [
    IonIcon,
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
export class TargetLanguagesAccordionComponent implements OnInit, OnDestroy {
  @Input() lang?: string;
  @Output() ionChange = new EventEmitter<string>();

  targetLanguages: string[] = [];
  private targetLanguagesSub?: Subscription;

  // TODO: Adjust maxTargetLanguages based on environment settings
  maxTargetLanguages = 3;

  constructor(
    public translate: TranslateService,
    private readonly localStorage: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.localStorage.loadTargetLanguages();
    this.targetLanguagesSub = this.localStorage.targetLanguages$.subscribe(
      (langs) => {
        this.targetLanguages = langs;
      }
    );
  }

  onTargetLanguagesChange(event: any) {
    this.ionChange.emit(this.targetLanguages.join(','));
  }

  ngOnDestroy(): void {
    this.targetLanguagesSub?.unsubscribe();
  }
}
