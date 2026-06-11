# z-control Translator

Translate text into multiple languages instantly — fast, easy, and powered by Google Translate!

z-control Translator is a modern, user-friendly app built with Ionic and Angular.  
Instantly translate text up to 100 characters into up to 5 selected languages, listen to translations with text-to-speech, and track your monthly translation quota.  
Perfect for travelers, language learners, students, and anyone who needs quick translations.  
Enjoy a clean, accessible design, multi-language UI, and built-in help — all with privacy in mind.

## Features

- **Instant translation**: Translate text up to 100 characters into up to 5 selected languages using Google Translate
- **Text-to-speech**: Listen to translated text with built-in speech output (supports 100+ languages)
- **Multi-language support**: UI available in English and German; translate to/from 100+ languages
- **Smart language selection**: Automatically exclude base language from target language options
- **Translation statistics**: View detailed monthly translation statistics showing character usage and quota remaining
- **Shared monthly quota**: Free tier with 500,000 characters per month shared across all users
- **Quota management**: Real-time feedback when quota is reached; simulated translations continue to work
- **Speech customization** (mobile): Adjust speech rate and pitch for optimal listening experience
- **Modern, accessible UI**: Clean design with light/dark mode and responsive layout for phones, tablets, and web
- **Built-in help**: Comprehensive help page with step-by-step instructions and FAQs
- **Related products**: Easy access to z-control products and feedback channels
- **Privacy-first**: No data storage — translations are processed securely via Google, text is never stored locally

Download now for free and translate, listen, and learn with ease!

## Download & Online Access

- **Web App:**  
  [Run the app online (Firebase Hosting)](https://z-control-translator.web.app/)

- **Native Mobile App on Android devices:**
  [Get the app on Google Play Store](https://play.google.com/store/apps/details?id=at.zcontrol.zoe.translator) — currently available through closed testing.
  Installation and setup guidance is included in the app's help section.

---

## 🛠️ Tech Stack

- **Framework**: Ionic 8 with Angular 20
- **Language**: TypeScript
- **Styling**: SCSS with Ionic CSS Variables
- **Backend**: Firebase (Firestore, Cloud Functions, Hosting) managed in the separate [z-control Backend Functions](https://github.com/zoechbauer/z-control-backend-functions) project
- **Translation API**: Google Cloud Translation API (Basic variant)
- **Text-to-Speech**: Web Speech API (browser) + native platform APIs (mobile)
- **Build Tool**: Angular CLI
- **Icons**: Ionicons
- **State Management**: RxJS (BehaviorSubject, Subject)
- **Testing**: Karma + Jasmine (frontend), Vitest + Istanbul (backend)
- **Deployment**: Firebase Hosting, Capacitor (Android)

## 📁 Project Structure

```
multi-language-translator/
├── docs/                        # Documentation and guides
│   ├── anonymous-login.md
│   ├── capacitor-8-upgrade-checklist.md
│   ├── clean-android-build-step-by-step.md
│   ├── coding-guidelines.md
│   ├── firebase-config-enviroment-files.md
│   ├── firebase-functions-esm-build-guide.md
│   ├── fix-invalid-source-release-21-problem.md
│   ├── google-cloud-translation-api-pricing.md
│   ├── ionic-capacitor-splash-screens-guide.md
│   ├── local-testing-guide-secureTranslate.md
│   ├── mobile-installation-guide.md
│   ├── README.md
│   ├── solving-installation-problems-android.md
│   ├── standalone-config.md
│   ├── text-to-speech-integration.md
│   ├── todo-list.md
│   ├── why-use-runInInjectionContext.md
│   ├── unit-testing/
│   └── upload-to-google-playstore/
│
├── resources/                   # Android icons & splash screens
│
├── src/
│   ├── global.scss
│   ├── index.html
│   ├── main.ts
│   ├── polyfills.ts
│   ├── test.ts
│   ├── zone-flags.ts
│   │
│   ├── app/
│   │   ├── app-routing.module.ts
│   │   ├── app.component.*
│   │   ├── app.module.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── app.constants.ts
│   │   │   ├── firebase-firestore-service.ts
│   │   │   └── ...other shared services
│   │   │
│   │   ├── services/
│   │   │   ├── firebase-firestore-utils-service.ts
│   │   │   ├── local-storage.service.ts
│   │   │   ├── text-to-speech.service.ts
│   │   │   ├── translation.service.ts
│   │   │   ├── utils.service.ts
│   │   │   └── validation.service.ts
│   │   │
│   │   ├── tab-translation/
│   │   │   ├── tab-translation-routing.module.ts
│   │   │   ├── tab-translation.module.ts
│   │   │   ├── tab-translation.page.*
│   │   │   └── (child components)
│   │   │
│   │   ├── tab-settings/
│   │   │   ├── tab-settings-routing.module.ts
│   │   │   ├── tab-settings.module.ts
│   │   │   ├── tab-settings.page.*
│   │   │   └── (child components)
│   │   │
│   │   ├── tabs/
│   │   │   ├── tabs-routing.module.ts
│   │   │   ├── tabs.module.ts
│   │   │   └── tabs.page.*
│   │   │
│   │   └── ui/
│   │       └── components/
│   │           ├── accordions/
│   │           │   ├── feedback-accordion.component.*
│   │           │   ├── get-help.component.*
│   │           │   ├── get-mobile-app.component.*
│   │           │   ├── get-source-code.component.*
│   │           │   ├── language-accordion.component.*
│   │           │   ├── privacy-policy-accordion.component.*
│   │           │   ├── speech-output-settings.component.*
│   │           │   ├── statistics-accordion.component.*
│   │           │   └── target-languages-accordion.component.*
│   │           ├── get-help/
│   │           │   └── get-help.component.*
│   │           ├── get-mobile-app/
│   │           │   └── get-mobile-app.component.*
│   │           ├── get-source-code/
│   │           │   └── get-source-code.component.*
│   │           ├── get-statistics/
│   │           │   └── get-statistics.component.*
│   │           ├── header/
│   │           │   └── header.component.*
│   │           ├── logo/
│   │           │   └── logo.component.*
│   │           ├── privacy-policy/
│   │           │   └── privacy-policy.component.*
│   │           ├── user-detail-modal/
│   │           │   └── user-detail-modal.component.*
│   │           └── (other UI components)
│   │
│   ├── assets/
│   │   ├── i18n/
│   │   │   ├── de.json
│   │   │   └── en.json
│   │   ├── icon/
│   │   │   └── (app logos & icons)
│   │   └── logs/
│   │       └── CHANGELOG.md
│   │
│   ├── environments/
│   │   ├── environment.prod.ts
│   │   └── environment.ts
│   │
│   └── theme/
│       └── variables.scss
│
├── tools/                       # Project-wide dev tools (backup scripts, templates)
├── android/                     # Capacitor Android configuration
├── angular.json
├── capacitor.config.ts
├── firebase.json
├── firestore.rules
├── ionic.config.json
├── karma.conf.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.spec.json
├── package.json
└── README.md                    # This file

```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Ionic CLI](https://ionicframework.com/docs/cli)
- [Angular CLI](https://angular.io/cli)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

### Installation

```bash
git clone https://github.com/zoechbauer/z-control-multi-language-translator
cd multi-language-translator
npm install
ionic serve
```

The app will open at `http://localhost:4200/` in your browser.

### Running with Firebase Emulator (Local Testing)

For local testing with Firestore emulator:

*Backend*
- Start Firebase emulator suite in [z-control Backend Functions](https://github.com/zoechbauer/z-control-backend-functions) repository

*Frontend*
- Update environment.ts in this app to use Firestore emulator
- Run ionic serve

See [local-testing-guide-secureTranslate.md](docs/local-testing-guide-secureTranslate.md) for detailed instructions.

### Testing

#### Frontend Tests (Karma + Jasmine)

```bash
# Run unit tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with code coverage
npm run test:coverage
```
#### Backend Tests (Vitest + Istanbul)

See [z-control Backend Functions](https://github.com/zoechbauer/z-control-backend-functions) repository documentation for backend testing instructions, as the backend code and tests are maintained there.

### Building for Android

```bash
ionic build --prod
npx cap sync android
cd android
./gradlew assembleRelease
```

See [mobile-installation-guide.md](docs/mobile-installation-guide.md) for detailed setup instructions.

## Translation Statistics

The app tracks monthly translation usage:

- **Monthly Quota**: 500,000 characters shared across all users
- **Character Count**: Tracked per user and globally
- **Target Languages Stored**: Selected target languages are recorded along with each translation for analytics
- **Statistics Page**: Detailed breakdown available in Settings for programmer devices
- **Quota Display**: Current usage and remaining quota shown on Translation page

When the monthly quota is reached, translations continue to work in **simulated mode** without consuming additional quota.

## Documentation

All documentation, deployment guides, setup instructions, and troubleshooting tips are located in the [`docs/`](docs/) folder.

### Recommended Reading

- [Getting Started Guide](docs/README.md)
- [Local Testing Guide](docs/local-testing-guide-secureTranslate.md)
- [Mobile Installation](docs/mobile-installation-guide.md)
- [Coding Guidelines](docs/coding-guidelines.md)

## Privacy Policy

See [Privacy Policy](https://z-control-translator.web.app/privacy) in the app.

Data handling:

- **No local storage of translations**: Text is sent securely to Google for translation and discarded after response
- **Character counts stored**: Only the character count and selected target languages are recorded in Firestore for statistics
- **User statistics**: Aggregated data is available to users; individual user data is only visible to that user
- **Device information**: Stored only on programmer devices for debugging purposes

## License

[MIT](LICENSE)

## Contact & Support

For questions, feedback, or support:  
[z-control Support & Feedback](https://z-control-4070.web.app/home)

Email: [zcontrol.app.qr@gmail.com](mailto:zcontrol.app.qr@gmail.com)

---

## Version History

See [CHANGELOG.md](src/assets/logs/CHANGELOG.md) for detailed release notes and version history.
