# What's New?

Welcome to our updates and improvements of the **z-control Multi Language Translator** app!

## [0.8] – YYYY-MM-DD

### 🚀 New Features

- Introduced SystemBarsService to manage status and navigation bar styles, and integrated the capgo-capacitor-navigation-bar dependency for enhanced control over system UI elements.

### 🚀 Improvements

- On mobile devices, the translation page does not display the translation input card when in landscape mode, optimizing screen space for better usability.

## [0.7] – 2026-01-15

### ✨ New Features

 - Added a Privacy Policy to the landing page with localized content in English and German, providing clear information about data handling and user privacy.
 Updated the Settings page links to direct users to the new, app-specific Privacy Policy and enhanced the data privacy information provided.
- The visibility of the Tab Bar can now be configured via environment files. When the Tab Bar is hidden, header buttons are provided for navigation between the Translate and Settings pages.
- Added a simulated translation mode that can be enabled via configuration in the environment files. This mode allows developers to test the app's layout and functionality without consuming API quota by simulating translations. The functionality is the same as the real translation but returns a fixed translation text for each target language.
- On the Translation page, you can now control the visibility of the translation input card and results card with a toggle button. This allows you to hide the input card when not needed, providing a cleaner and more focused interface.

### 🚀 Improvements

- Updated copyright year in the app footer from 2025 to 2026.
- Changed placeholder text in the translation textarea to dynamically include the name of the selected base language, providing clearer context for users.
- Added keyboard accessibility to the text-to-speech button next to each translated text, allowing users to activate TTS using the Enter key for improved usability.
- Disabled the TTS rate and pitch sliders in the Text-to-Speech settings accordion when the app is running on web browsers, as these settings are only applicable to native mobile platforms.
- Updated the user help documentation to include instructions on using the new features, such as the privacy policy, Tab Bar visibility settings, simulated translation mode, and toggling input/results cards.
- Some minor styling adjustments were made to improve the overall look and feel of the app.

## [0.6] – 2026-01-11

### ✨ New Features

- Added text-to-speech (TTS) functionality for translated text using the browser's built-in Web Speech API. Users can now listen to translations directly within the app by clicking a button next to each translated text.
- Added toast notifications to inform users when text has been successfully translated and when TTS is not supported in their browser.

### 🚀 Improvements

- Enhanced the help page with clear instructions on using the new text-to-speech feature and selecting target languages. The documentation was streamlined to better guide users through the app's key functions. The styling of the help page was also improved for better readability.

## [0.5] – 2026-01-10

### 🚀 Improvements

- Replaced the ion-select component with a custom Language Multi-Select, enabling users to quickly filter and search for languages by name or code, and to view only selected languages for a smoother experience.
- Added a clear visual indicator (red placeholder text) in the translation textarea when no target languages are selected, guiding users to choose at least one target language before translating.
- The base language is now automatically excluded from the list of target languages when changed in settings, preventing redundant translations and ensuring Google Translate only translates into different languages.
- Standardized the language input property in all Accordion components to `lang` for consistency across the codebase.
- Accordion components no longer assign a default value to the language input; the parent component must now explicitly provide the language context.
- Refactored language and target language selection logic to use centralized configuration constants and RxJS BehaviorSubjects, improving maintainability and reducing code duplication.

## [0.4] – 2026-01-06

### 🚀 Improvements

- Expanded documentation with a detailed, step-by-step guide for cleaning and rebuilding the Android project in Android Studio, helping users ensure a clean build environment and resolve build issues.
- Enhanced the troubleshooting section with a clear solution for the "invalid source release: 21" error during Android builds, including instructions for updating Gradle settings for Java 17 compatibility.
- Updated the mobile installation guide with additional tips and clarifications to help users successfully install the app on Android devices.
- Upgraded Capacitor and related dependencies to their latest versions for improved stability and performance.

### 🐛 Bug Fixes

- Fixed an issue where accordions on the Settings page would not open or close on mobile devices when the app was installed via Android Studio. Accordions now expand and collapse as expected.
- Removed unused modules left over from the previous commit, streamlining the codebase and improving performance.

## [0.3] – 2026-01-04

### ✨ New Features & Improvements

- The app is now fully installable on Android devices using Android Studio, making mobile access seamless.
- Enhanced layout and responsive styling for a consistent, polished experience across phones, tablets, and web browsers.
- Added a comprehensive installation guide to help users set up the z-control Multi Language Translator app on Android devices step by step.
- Included detailed documentation on Google Cloud Translation API pricing to help users understand potential costs and plan accordingly.

## [0.2] – 2026-01-02

### ✨ New Features

- Language selection now shows all supported languages from Google Translate, making it easier to choose your preferred options.
- Language names are displayed instead of codes for a clearer and friendlier experience.
- Button states and feedback have been improved for smoother translation.
- The app now uses a centralized configuration for input limits and target languages.
- The license has been updated to MIT for open-source transparency.

## [0.1] – 2025-12-31

### ✨ New Features

- Instantly translate your text into several languages at once.
- Choose your main language and select from English, French, Spanish, or German as target languages.
- View release notes and app details in a clear, easy-to-read format.
- Enjoy a simple and intuitive interface for quick access to all features.
- Visit the Settings page for helpful tips, privacy information, and to send feedback.
- You can also find links to install the mobile app and view the source code (these currently point to our QR Code Generator App until this app is published online).

### 🛡 Security

- Your data always stays on your device and is never shared with others.
- Only the text you choose to translate is sent securely to Google for translation.
