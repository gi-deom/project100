# Gidlight Android companion

This is a native Android live-wallpaper companion for the Gidlight web app.

The project is configured for Android 12-era phones such as the Tecno Spark 9T (model KH6): `minSdk 26`, portrait-first UI, no Android 13+ APIs, and moderate wallpaper refresh work suitable for the phone's 720p display. It targets SDK 35 so Android 12, 13, 14, 15, and newer releases can run it through Android's compatibility model. Future SDK updates should be tested by raising `compileSdk` and `targetSdk` together.

## What it does

- Opens Android's official live-wallpaper picker.
- Lets the user approve Gidlight for the home screen, lock screen, or both, depending on the device.
- Fetches the newest Bing wallpaper and renders it to the authorized wallpaper surface.
- Refreshes on an 8-minute native interval.

Android requires explicit user approval. The app cannot force or bypass wallpaper permissions.

On the Tecno phone, install the APK, open Gidlight, tap **Choose live wallpaper**, then approve it in the Android wallpaper picker. If HiOS offers separate choices, select Home screen, Lock screen, or both. Battery optimization may need to be disabled for Gidlight if the phone stops background wallpaper updates. On Android 13+, Android may show additional notification, battery, or wallpaper confirmation screens; approve only the permissions you want to use.

## Build

Open this `android` folder in Android Studio with Android SDK 35 and JDK 17 installed, then run the `app` configuration on a device or emulator. Android Studio can generate the Gradle wrapper if needed.

Or install the prebuilt APK from the [Gidlight Android v1.0.0 release](https://github.com/gi-deom/project100/releases/tag/v1.0.0).
