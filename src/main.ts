import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { addIcons } from 'ionicons';
import { 
  arrowForwardOutline,
  arrowBackOutline,
  languageOutline,
  mailOutline,
  settingsOutline,
  listOutline,
  logoGooglePlaystore,
  help,
  arrowUpOutline,
  closeOutline,
  openOutline,
  personOutline,
  locationOutline,
  cloudDownloadOutline,
  rocketOutline,
  checkmarkOutline,
  lockClosedOutline,
  phonePortraitOutline,
  qrCodeOutline
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Register Ionicons used in the application
addIcons({
  'settings-outline': settingsOutline,
  'language-outline': languageOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'arrow-back-outline': arrowBackOutline,
  'mail-outline': mailOutline,
  'list-outline': listOutline,
  'logo-google-playstore': logoGooglePlaystore,
  'help': help,
  'arrow-up-outline': arrowUpOutline,
  'close-outline': closeOutline,
  'open-outline': openOutline,
  'person-outline': personOutline,
  'location-outline': locationOutline,
  'cloud-download': cloudDownloadOutline,
  'rocket': rocketOutline,
  'checkmark': checkmarkOutline,
  'lock-closed': lockClosedOutline,
  'phone-portrait': phonePortraitOutline,
  'qr-code-outline': qrCodeOutline
});

// Register German locale data for number/date pipes
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, appConfig);