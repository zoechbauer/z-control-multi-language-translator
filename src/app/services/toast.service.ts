import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from './utils.service';
import { ToastAnchor } from '../enums';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(
    public translate: TranslateService,
    private readonly toastController: ToastController,
    private readonly utilsService: UtilsService,
  ) {}

  /**
   * Shows a toast with a translated message, typically used for disabled actions.
   * @param toastMsg The translation key or message to display
   * @param anchorId Optional anchor ID for positioning the toast
   */
  async showDisabledToast(toastMsg: string, anchorId?: ToastAnchor) {
    const translatedMsg = this.translate.instant(toastMsg);

    this.showToastMessage(translatedMsg, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  /**
   * Displays a toast message below the header using a translated message string.
   * @param translatedToastMessage The message to display (already translated).
   * @param anchorId Optional anchor ID, default is ToastAnchor.SETTINGS_PAGE.
   */
  showToast(translatedToastMessage: string, anchorId?: ToastAnchor): void {
    this.showToastMessage(translatedToastMessage, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  async showToastMessage(
    translatedToastMessage: string,
    anchorId?: ToastAnchor,
  ) {
    const toastOptions: any = {
      message: translatedToastMessage,
      duration: 3000,
      icon: 'information-circle',
      color: 'medium',
      position: this.getToastPosition(),
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    };

    const anchor = this.getToastAnchor(anchorId);
    if (anchor) {
      toastOptions.positionAnchor = anchor;
    }

    const toast = await this.toastController.create(toastOptions);
    await toast.present();
  }

  private getToastPosition(): 'top' | 'bottom' {
    if (this.utilsService.isDesktop) {
      return 'bottom';
    }
    // On mobile devices, display toast at the top to prevent it from being obscured by the navigation bar or keyboard.
    return 'top';
  }

  private getToastAnchor(anchorId?: ToastAnchor): string | undefined {
    if (this.utilsService.isDesktop) {
      return undefined; // Do not set anchor on desktop
    }
    // On mobile devices, display toast below the header prevent it from being obscured by the header bar.
    return anchorId || ToastAnchor.SETTINGS_PAGE;
  }
}
