import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [IonIcon, TranslateModule],
})
export class FooterComponent {
  showDetails = false;

  constructor(public translate: TranslateService) {}

  get mailtoLink() {
    return 'mailto:zcontrol.app.qr@gmail.com?subject=z-control%20QR%20Code%20Generator%20App%20Feedback';
  }
}
