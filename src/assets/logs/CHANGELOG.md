# What's New?

Welcome to our updates and improvements of the **z-control Multi Language Translator** app!

## [1.2] – 2026-02-24

### 🚀 Improvements

- Enhanced the GetStatisticsComponent for better privacy and usability:
  - User IDs are now only visible on programmer devices to protect user privacy.
  - Users with no translations this month are hidden from statistics on user devices for a cleaner view. On programmer devices, all users remain visible in descending order by creation date for monitoring.
  - Improved dark mode styling for better readability of user details.
- Enhanced color styling of the Translation page for improved visual consistency in both light and dark modes.
- Reordered Settings page accordions for quicker access to frequently used features.
- Improved explanations and instructions in multiple Settings accordions for better user guidance.
- Added comprehensive README.md to the project root with app information, installation instructions, and usage guidelines.
- Added a user help entry explaining the Facebook in-app browser speech output issue, including problem description, cause, and step-by-step solution.

### 🐛 Fixes

- Fixed device information comparison in Cloud Functions to prevent unnecessary Firestore updates when only property order differs.

## [1.1] – 2026-02-18

### ✨ New Features

- Released the "User Statistics" accordion on the Settings page for all users, showing the current-month character usage and remaining monthly quota.
- Added a "Statistics" section on the Translation page that summarizes total characters translated by all users and by you for the current month, giving an at-a-glance view of the monthly contingent.
- On translation the selected target languages are now stored in Firestore along with the character count, enabling more detailed usage insights and statistics.
- Added the "Statistics" section to the help page with detailed explanations of the monthly translation contingent, how character counts are calculated, and tips for managing your usage effectively.

### 🚀 Improvements

- Speak Button is disabled during speaking the translation to prevent multiple clicks and repeated speech, enhancing user experience and ensuring clear audio output.
- Improved the cloud function with atomic updates to the user statistics, ensuring accurate tracking of translation usage and preventing race conditions when multiple translations occur simultaneously.
- Enhanced the GetStatisticsComponent to provide better insights into translation usage:
  - Current user is now highlighted in the statistics grid for easier identification
  - Users who have exceeded their monthly quota are visually marked
  - Added validation to compare total character count with the sum of individual user counts, ensuring data integrity
  - Added collapsible raw data section in JSON format for programmers, enabling detailed debugging and transparency of stored data
- Improved information in the "Get Mobile App" component for better clarity and user guidance, and disabled download button because native app is not yet published online.

## [1.0] – 2026-02-11

### ✨ New Features

- App deployed to Firebase Hosting for enhanced online accessibility and streamlined user distribution.
- Help page now features an updated link to the Firebase-hosted web app, providing users with seamless access to the online version.

## [0.10] – 2026-02-10

### 🚀 Improvements

- Restructured environment configuration for enhanced management of programmer devices.
- Added `useFirebaseEmulator` option to environment files for seamless switching between Firestore emulator and production database.
- Relocated device information storage from monthly statistics to user document in userMapping collection, enhancing data organization.
- Enhanced local testing documentation to clarify Firestore emulator configuration and integration.
- Refactored Firestore access layer by moving functions to Backend, improving security and separation of concerns.

## [0.9] – 2026-01-30

### ✨ New Features

- Introduced a user statistics accordion in the settings (for programmer devices), enabling detailed translation statistics display, including total and monthly character counts.
- Implemented GetStatisticsAccordionComponent and GetStatisticsComponent for fetching and displaying user/global statistics from Firestore.
- LocalStorageService now manages the Firestore UID for the current user, improving user-specific data handling.
- TabSettingsPage now conditionally displays the statistics accordion for programmer devices, enhancing role-based UI.
- UtilsService includes a new method to detect programmer devices.
- Added and improved translations for statistics in both English and German.
- Updated environment configuration to support mobile and web device UIDs.
- Refactored text-to-speech service to log supported languages for better debugging.
- Cleaned up unused imports and improved code readability across multiple services.
- Documentation: Added guides for anonymous login and a TODO list for environment and programmer device management.
- Added temporary console logs for testing contingent limits.
- Introduced new environment variables and updated generate-env.js for better configuration management.

### 🚀 Improvements

- On mobile devices, the translation input card is now hidden in landscape mode to maximize available screen space and enhance usability.
- The UI now displays a clear message at the top of the screen when no target languages are selected, guiding users to select at least one language before translating.
- Translation logic has been refactored to use centralized configuration constants and RxJS BehaviorSubjects, improving maintainability and reducing code duplication.
- Updated all dependencies to their latest versions for greater stability and performance.

## [0.8] – 2026-01-22

### ✨ New Features

- Added SystemBarsService for advanced control of status and navigation bar styles, integrating the capgo-capacitor-navigation-bar dependency for a more seamless and customizable system UI experience.
- Integrated Firebase, enabling analytics and additional Firebase services. The app now supports environment-based configuration for secure management of Firebase credentials.
- Introduced user translation statistics tracking with Firebase Firestore, recording the number of characters translated per user each month for improved usage insights.
- Users are now notified when the free monthly translation character limit is reached, with a clear warning toast and feedback when attempting to translate beyond the quota.
- Added simulated transalation mode when the monthly quota is exceeded, allowing users to continue using the app's features without consuming additional quota. Simulated translations return a fixed text response.

### 🚀 Improvements

- On mobile devices, the translation input card is now hidden in landscape mode to maximize available screen space and enhance usability.
- The UI now displays a clear message at the top of the screen when no target languages are selected, guiding users to select at least one language before translating.
- Translation logic has been refactored to use centralized configuration constants and RxJS BehaviorSubjects, improving maintainability and reducing code duplication.
- Updated all dependencies to their latest versions for greater stability and performance.

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
