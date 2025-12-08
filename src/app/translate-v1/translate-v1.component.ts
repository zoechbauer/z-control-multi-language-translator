import { Component, OnInit } from '@angular/core';

import { TranslationGoogleTranslateService } from '../services/translation-google-translate.service';


@Component({
  selector: 'app-translate-v1',
  templateUrl: './translate-v1.component.html',
  styleUrls: ['./translate-v1.component.scss'],
  standalone: false,
})
export class TranslateV1Component implements OnInit {
  germanWord: string = '';
  translations: { [lang: string]: string } | null = null;

  constructor(private translationService: TranslationGoogleTranslateService) {}

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
        console.log('Translation Result:', result);
        this.translations = result;
      });
  }
}
