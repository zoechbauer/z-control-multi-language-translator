# Standalone Angular Configuration with app.config.ts

This document explains how to configure a modern Angular application using standalone components and a central configuration file (`app.config.ts`). This approach is recommended for Angular 15+ projects that do not use a traditional `AppModule`.

## What is `app.config.ts`?

`app.config.ts` is a TypeScript file where you declare all external providers and application-wide configuration for your Angular app. Instead of using `@NgModule`'s `providers` array, you use this file to collect and export your providers, which are then passed to the Angular bootstrap function.

## Why use `app.config.ts`?

- **Centralized configuration**: All global providers (such as Firebase, Ionic, routing, HTTP interceptors, etc.) are declared in one place.
- **Standalone support**: Works seamlessly with Angular's standalone components and the new bootstrap API.
- **Cleaner codebase**: No need for a root `AppModule`.

## Example: Declaring Providers in `app.config.ts`

```ts
// src/app/app.config.ts
import { ApplicationConfig } from "@angular/core";
import { provideIonicAngular } from "@ionic/angular/standalone";
import { provideRouter } from "@angular/router";
import { provideFirebaseApp, initializeApp } from "@angular/fire/app";
import { provideAuth, getAuth } from "@angular/fire/auth";
import { provideFirestore, getFirestore } from "@angular/fire/firestore";
import { environment } from "../environments/environment";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    // ...other global providers
  ],
};
```

## Bootstrapping with `appConfig`

In your `main.ts`, use the `bootstrapApplication` function and pass in your `appConfig`:

```ts
// src/main.ts
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
```

## Benefits

- All providers are visible and maintainable in one file.
- Easy to add or remove providers as your app grows.
- Fully compatible with Angular's standalone component architecture.

## When to Use

- New Angular projects using standalone components.
- Migrating from NgModule-based configuration to standalone.

## See Also

- [Angular Standalone Components Documentation](https://angular.io/guide/standalone-components)
- [Angular ApplicationConfig API](https://angular.io/api/core/ApplicationConfig)

---

**Summary:**
Use `app.config.ts` to declare all global providers for your Angular app, and reference it in `bootstrapApplication(AppComponent, appConfig)` in your `main.ts` for a clean, modern, and maintainable configuration.
