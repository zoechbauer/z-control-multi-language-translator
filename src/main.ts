import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

import { AppModule } from './app/app.module';

// Register German locale data for number/date pipes
registerLocaleData(localeDe);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));