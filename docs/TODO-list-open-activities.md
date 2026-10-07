# TODO — Open activities

This document lists open tasks and follow-ups for the z-control Translator project. Use it to coordinate work, keep priorities visible, and track completion.

## Open tasks (closed items are marked with [x])

- [ ] When upgrading Ionic or Angular, verify Toast behavior in Web (production) build. Test steps: set the Firebase flag StopTranslationForAllUsers = true and perform a translation. If the Toast does not appear, add ToastService and its spec from the Ionic Setup project.
- [ ] Improve the Help page: allow switching between Settings and Translation sections. Render action buttons conditionally based on the environment setting app.showTabsBar.
