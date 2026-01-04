import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class TabsPage {
  constructor(public translate: TranslateService) {}
}
