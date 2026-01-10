import { Component, Input, OnInit } from '@angular/core';
import { GoogleLanguage } from 'src/app/services/translation-google-translate.service';
import {
  IonItem,
  IonCheckbox,
  IonSearchbar,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonButton,
  IonTitle,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AppConstants } from 'src/app/shared/app.constants';

@Component({
  selector: 'app-language-multi-select',
  templateUrl: './language-multi-select.component.html',
  styleUrls: ['./language-multi-select.component.scss'],
  imports: [
    IonIcon,
    IonItem,
    IonCheckbox,
    IonSearchbar,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonContent,
    IonList,
    IonButton,
    IonTitle,
    IonButtons,
    CommonModule,
    TranslateModule,
  ],
})
export class LanguageMultiSelectComponent implements OnInit {
  @Input() baseLang!: string;
  @Input() allLanguages: GoogleLanguage[] = [];
  @Input() selectedCodes: string[] = [];

  searchTerm = '';
  filteredLanguages: GoogleLanguage[] = [];
  selection = new Set<string>();

  constructor(
    private readonly modalController: ModalController,
    private readonly translate: TranslateService
  ) {}

  ngOnInit() {
    this.filteredLanguages = [...this.allLanguages];
    this.selectedCodes.forEach((c) => this.selection.add(c));
  }

  get maxTargetLanguages(): number {
    return AppConstants.maxTargetLanguages;
  }

  get selectedLanguagesCount(): number {
    return this.selection.size;
  }

  get selectedLanguages(): string {
    const selected = Array.from(this.selection)
      .sort((a, b) => a.localeCompare(b))
      .toString();
    return this.baseLang + ' -> ' + selected;
  }

  getCheckboxTooltip(language: string): string {
    return this.isChecked(language) ? this.translate.instant('SETTINGS.TARGET_LANGUAGES.MODAL.SEARCH.TOOLTIPS.DESELECT_TARGET_LANG') : this.translate.instant('SETTINGS.TARGET_LANGUAGES.MODAL.SEARCH.TOOLTIPS.SELECT_TARGET_LANG');
  }

  filter(ev: any) {
    const term = (ev.target.value || '').toLowerCase();
    this.searchTerm = term;
    this.filteredLanguages = this.allLanguages.filter((l) =>
      l.name.toLowerCase().includes(term)
    );
  }

  clearSearch(searchbar: any) {
    searchbar.value = '';
    this.searchTerm = '';
    this.filteredLanguages = [...this.allLanguages];
  }

  filterSelectedLanguages() {
    this.filteredLanguages = this.allLanguages.filter((l) =>
      this.selection.has(l.language)
    );
  }

  toggle(lang: GoogleLanguage) {
    if (this.selection.has(lang.language)) {
      this.selection.delete(lang.language);
      return;
    }
    if (this.selection.size < this.maxTargetLanguages) {
      this.selection.add(lang.language);
    }
  }

  isChecked(language: string): boolean {
    return this.selection.has(language);
  }

  closeModal() {
    this.modalController.dismiss(Array.from(this.selection));
  }
}
