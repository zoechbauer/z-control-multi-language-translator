import { Component, OnInit } from '@angular/core';

import { TranslationService } from '../services/translation';

@Component({
  selector: 'app-translate-v1',
  templateUrl: './translate-v1.component.html',
  styleUrls: ['./translate-v1.component.scss'],
  standalone: false,
})
export class TranslateV1Component implements OnInit {
  germanWord: string = "";
  translations: { [lang: string]: string } | null = null;

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.germanWord = '';
  }

  translate(): void {
    if (!this.germanWord.trim()) {
      return;
    }

    this.translationService
      .translateWordFromGerman(this.germanWord)
      .subscribe((result) => {
        this.translations = result;
      });
  }
}
