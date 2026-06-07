# What's New?

Welcome to our updates and improvements of the **z-control Translator** app!

## Versioning

This project uses a simplified major.minor versioning scheme:

- Major versions indicate significant milestones or breaking changes.
- Minor versions indicate new features, improvements, and bug fixes.
- Patch numbers are intentionally omitted; all changes are released as major or minor versions.

## [2.1] – 2026-06-07

### 🚀 Improvements

- Improved Styling of the App Title: The app title is now displayed on the same place at the top of the screen on both the Translation and Settings pages, providing a more polished and visually appealing layout.
- Improved Styling of the Statistics Display Mode Toggle: The display mode toggle in the statistics accordion has been restyled for better visual consistency and usability, making it easier for users to switch between programmer and user views.
- Changed Version Numbering from 1.16 to 2.0 to reflect the significant new features and improvements added in version 2.0, including the multi-app backend support and independent maintenance of Firebase Functions.

### 🔧 Internal

- Improved emulator host resolution to reliably support both local emulator and production environments, enabling smoother development, testing, and deployment workflows.
- Firebase Functions are now maintained and deployed independently from the z-control IONIC Setup app, allowing more flexible backend releases and simpler multi-app operations.
- Updated README.md with new information about the independent maintenance of Firebase Functions and a link to the z-control IONIC Setup project for backend updates.

## [2.0] – 2026-05-30

### ✨ New Features

- Refactored the backend to support upcoming new apps: the app now sends an appId with every request, allowing multiple apps to share the same Firebase backend while keeping their data organized and secure.
- Without updating the app, the app crashes due to the new required appId parameter in backend requests, so this version update is necessary to ensure users receive the latest features and fixes.

### 🔧 Internal
- Improved reliability by validating appId in all backend requests and providing clear error messages if an unsupported appId is used.
- Updated all unit tests to ensure the app remains stable and compatible with this new multi-app structure. Test coverage: 136 backend tests (99.6%) and 767 frontend tests (99.4%).

## [1.15] – 2026-05-18

### 🚀 Improvements

- Improved the statistics page on mobile devices so switching to landscape mode is noticeably faster and smoother.

### 🔧 Internal

- Optimized statistics rendering by caching orientation state, precomputing displayed statistics rows, and loading debug JSON sections only when expanded.
- Updated unit tests for statistics filtering, cached orientation behavior, and debug-section toggles. Total: 676 tests, 99.4% frontend coverage.

## [1.14] – 2026-05-08

### 🚀 Improvements

- Improved the translation page layout for better readability and usability. The base language and selected target languages are now shown below the input card, so action buttons are no longer hidden by the keyboard or microphone on mobile devices.
- Improved the help text in the Select Target Languages accordion with clearer, step-by-step guidance on choosing target languages and starting translation.
- Improved the message shown when no target languages are selected on the translation page, making it clearer that target languages must be selected in Settings before translating.

### 🐛 Fixes

- Fixed a red message briefly appearing on mobile devices even when languages were selected. The app now waits for language selection to load from Firestore before showing the message.

### 🔧 Internal

- Updated translation-page unit tests for the new layout and messages, including checks for base/target language display below the input card and the updated no-target-languages message. Total: 666 tests, 99.4% frontend coverage.

## [1.13] – 2026-05-07

### 🐛 Fixes

- Fixed an issue in the statistics month filter where user devices could still show data from the previous month. The app now automatically detects a month change and updates the stored month, so users always see current statistics without needing to create a new translation.

### 🔧 Internal

- Added a complete backend Vitest setup for Firebase Functions, including Istanbul coverage reporting and Vitest UI.
- Added 123 unit tests across 9 backend files, achieving 100% statement and branch coverage of backend code.
- Updated frontend unit tests after fixing the local-storage month-change issue, reaching 664 tests and 99.3% frontend coverage.

## [1.12] – 2026-04-29

### ✨ New Features

- When selecting "All Months" in the programmer statistics filter, data across all available months is aggregated and displayed in a single view, enabling a comprehensive overview of translation usage over time.

### 🔧 Internal

- Extended test suite with 52 additional unit tests (Firebase Firestore service, user detail component, statistics filter), reaching 660 specs and 99.38% coverage on all frontend code.
- Added CSS classes to statistics elements to improve selector stability in tests.

## [1.11] – 2026-04-25

### ✨ New Features

- In statistics programmer view a new filter has been added to select a specific month or all months for the displayed data, allowing programmers to analyze translation usage patterns over time and monitor monthly trends more effectively.
- Added Apple device detection in programmer statistics, so iPhone, iPad, and Mac usage is now identified and displayed more clearly.
- Improved platform visibility in programmer view, making it easier to understand which device categories are used for translations.

### 🚀 Improvements

- The user statistics accordion now always displays up-to-date quota data when opened or re-opened, even if the month has changed and no new translations have been made.
- The monthly statistics accordion now always displays up-to-date data when re-opened, showing both your own translations and those from other users. Previously, this refresh only occurred when a new translation was made.
- Changed Translation from 'User Translation' to 'User Device' and 'Programmer Translation' to 'Programmer Device' for better clarity.
- Refactored device and platform detection into a dedicated `DeviceUtilsService` to improve structure, reuse, and maintainability.
- Introduced dedicated enums for device and platform types, improving consistency and type safety across the app.
- Improved detection logic for mobile and tablet web clients, with a clearer separation between phone/tablet and desktop behavior.
- Programmer-only sections in the statistics view are now correctly restricted to authorized devices.
- Added 61 unit tests, increasing the total suite to 608 specs and improving confidence in platform/device classification and related UI behavior.

## [1.10] – 2026-04-15

### ✨ New Features

- Added 67 template tests, increasing the total test count to 547 specs and improving confidence in the app's most important UI components and pages.

### 🚀 Improvements

- Improved the layout of the statistics page and contingent information component for better readability and usability.

## [1.9] – 2026-04-11

### ✨ New Features

- Added a troubleshooting section to the help page: "No speaker icon is shown for translated texts (mobile)", with a clear solution for Samsung devices. The section explains the issue, its cause, and provides step-by-step instructions to resolve it by selecting "Google Speech Recognition and Synthesis" as the TTS engine.
- Added a Spinner Component to provide a consistent loading indicator across the app, improving user experience during data fetching and processing operations.
- Added unit tests for the new Spinner Component, ensuring its functionality and reliability across different scenarios.

## [1.8] – 2026-04-08

### ✨ New Features

- Completed the unit test suite for all TypeScript files, bringing the total to 480 tests and achieving 98% statement coverage for TypeScript code. This ensures robust validation of all features and edge cases, significantly improving overall code quality and reliability. (Note: HTML template logic is not included in this coverage metric.)
- Introduced a new `isSmallDevice` method in UtilsService for more accurate device detection, enhancing responsive design on all screen sizes and orientations. This method is fully covered by unit tests.
- Added `CapacitorPlatformService` to provide a unified interface for platform detection, improving both maintainability and testability.

### 🚀 Improvements

- Refined the `isSmallDevice` logic for more precise small screen detection, further enhancing app responsiveness on all devices and orientations.
- Increased textarea height on small devices in portrait mode for better usability and easier text entry.
- The translation input card now automatically hides on small devices in landscape mode to maximize space for results, while remaining visible in portrait mode on both native and web platforms.
- Moved date formatting and validation logic from components to UtilsService for better separation of concerns and testability, with comprehensive unit tests added for all date formatting functions.

## [1.7] – 2025-03-31

### ✨ New Features

- Added comprehensive unit tests across all services, achieving 98% statement coverage for service code and significantly enhancing code quality and reliability. (Note: The 98% coverage metric applies specifically to service code; overall app coverage may differ.)
- Introduced callable functions (`is-programmer-devices.ts`, `create-missing-contingent-data.ts`) to enhance testability and modularity.
- Added `firebase-firestore-auth-wrapper.service.ts` to improve authentication handling and test coverage.
- Updated app title and favicon to "z-control Translator" for improved brand consistency and recognition.
- Added developer documentation for unit testing with Angular, including a quick-start reference for running tests and a curated list of tutorials and learning resources.

### 🚀 Improvements

- Refined Jasmine and Karma configurations to ensure all tests are fully visible and reliably executed in the browser, streamlining the developer testing experience.
- Added a createSecureTranslateCallable helper to TranslationGoogleTranslateService to improve testability and reuse when invoking the authenticated Cloud Function.
- Standardized file names and Enums, corrected typos, and improved naming conventions for greater consistency and readability throughout the codebase.
- Added new translations for improved localization and user experience.

### 🐛 Fixes

- Fixed typos in Text-to-Speech file names and firebase-firestore-utils file names and import paths to ensure consistent naming and prevent import errors.

## [1.6] – 2026-03-15

### ✨ New Features

- In programmer view, the statistics page includes the new section "User Statistics Overview" that summarizes the distribution of users by user type, platform, device model, and number of target languages used, giving programmers a quick overview of user demographics and usage patterns.
- In programmer view, the device model is now shown in both the statistics grid and the user details page, providing clearer insight into the devices used for translation. You can also filter by model in the statistics grid to monitor specific devices more easily.

## [1.5] – 2026-03-12

### ✨ New Features

- On programmer devices, the statistics accordion now includes a display mode toggle to switch between programmer view (detailed data) and user view, letting programmers preview the user experience without needing a separate device.
- In programmer view, the statistics grid now shows the number of target languages used by each user.
- In programmer view, the statistics grid can now be searched and filtered by user type, platform, translated character count, and target language count for easier monitoring and debugging.
- On the user detail page, the `isProgrammerDevice` filter has been replaced by the programmer view toggle.

### 🚀 Improvements

- Improved displayed information in the translation page if no target languages are selected, guiding users to select at least one target language before translating.

### 🐛 Fixes

- Fixed web authentication on browser refresh to avoid creating unnecessary new anonymous UIDs, keeping user translation totals consistent and improving callable Cloud Function authentication.
- Unit tests were stabilized for standalone Angular components by updating spec configuration (`imports` instead of legacy patterns), aligning Firestore-related mocks with current return types, introducing a shared `createTranslateServiceMock()` helper across specs, and fixing TypeScript test-project configuration for reliable Jasmine type resolution.

## [1.4] – 2026-03-07

### ✨ New Features

- Programmer device UIDs are now managed in Firestore and initialized from environment files, enabling runtime updates without requiring code changes or redeployment.

### 🐛 Fixes on Mobile Version

- In native mobile builds, the header now renders at the correct height across all tested Android devices (including Samsung A53).
- In native mobile builds, the status bar is now consistently visible and correctly styled across all tested Android devices.

## [1.3] – 2026-03-03

### ✨ New Features

- App deployed to Google Play Store for Testing by invited users (internal test group and closed test group), making it easily accessible on Android devices without manual installation.

### 🚀 Improvements

- Rebranded the app to "z-control Translator" for improved memorability and a more modern, streamlined brand identity.
- Updated documentation for the Google Play Store publication process.

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
- Added a comprehensive installation guide to help users set up the z-control Translator app on Android devices step by step.
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
