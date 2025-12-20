import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: false,
})
export class SettingsComponent  implements OnInit {
  lang: string = 'de';

  constructor(public translate: TranslateService) { }

  ngOnInit() {}

    onLanguageChange(event: any) {
    const lang = event.detail?.value;
    if (lang) {
      // this.localStorage.saveSelectedLanguage(lang);
      this.translate.use(lang);
    }
  }

}
