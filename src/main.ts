import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  arrowUpOutline,
  caretDownOutline,
  checkboxOutline,
  checkmarkOutline,
  closeOutline,
  cloudDownloadOutline,
  helpOutline,
  languageOutline,
  listOutline,
  locationOutline,
  lockClosedOutline,
  logoGooglePlaystore,
  mailOutline,
  openOutline,
  personOutline,
  phonePortraitOutline,
  qrCodeOutline,
  rocketOutline,
  settingsOutline,
  trashOutline,
  volumeHighOutline,
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Register Ionicons used in the application
addIcons({
  'arrow-back-outline': arrowBackOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'arrow-up-outline': arrowUpOutline,
  'caret-down-outline': caretDownOutline,
  'checkbox-outline': checkboxOutline,
  'checkmark-outline': checkmarkOutline,
  'close-outline': closeOutline,
  'cloud-download': cloudDownloadOutline,
  'help-outline': helpOutline,
  'language-outline': languageOutline,
  'list-outline': listOutline,
  'location-outline': locationOutline,
  'lock-closed': lockClosedOutline,
  'logo-google-playstore': logoGooglePlaystore,
  'mail-outline': mailOutline,
  'open-outline': openOutline,
  'person-outline': personOutline,
  'phone-portrait': phonePortraitOutline,
  'qr-code-outline': qrCodeOutline,
  'rocket-outline': rocketOutline,
  'settings-outline': settingsOutline,
  'trash-outline': trashOutline,
  'volume-high-outline': volumeHighOutline,
});

// Register German locale data for number/date pipes
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, appConfig);
