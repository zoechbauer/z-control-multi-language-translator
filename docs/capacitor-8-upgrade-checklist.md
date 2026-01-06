#Capacitor 7 to 8 Upgrade & Accordion Fix Guide#
This document covers the migration steps for Capacitor 8 

## 1. Capacitor 8 Upgrade Checklist ##

### package.json Dependencies ###
Ensure your `package.json` has the following Capacitor dependencies updated to version 8.0.0:

```json

"@capacitor/android": "8.0.0",
"@capacitor/app": "8.0.0",
"@capacitor/core": "8.0.0",
"@capacitor/haptics": "8.0.0",
"@capacitor/keyboard": "8.0.0",
"@capacitor/status-bar": "8.0.0"
```
### Android Gradle Configuration (android/build.gradle) ###
Capacitor 8 requires modern build tools. Update your root build.gradle:
```groovy
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:8.10.1'
        classpath 'com.google.gms:google-services:4.4.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.23"
    }
}
```

### Gradle Wrapper (gradle-wrapper.properties) ###
```properties
properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-all.zip
```

## 2. Resolving "Duplicate Class" (Kotlin) Errors ##
During the upgrade, you may see Duplicate class kotlin.collections.jdk8. This is caused by the transition to a unified Kotlin library.
Fix: Add this to the bottom of android/app/build.gradle:
```groovy
configurations.all {
    exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk7'
    exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk8'
}
```