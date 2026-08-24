# Gidlight wallpaper slideshow

A dependency-free Bing wallpaper slideshow. It requests the Bing Image Archive across multiple markets and historical offsets, deduplicates every result, and keeps the queue open-ended rather than stopping at a fixed image count. Uniquely seeded photo fallbacks are used only when the public archive returns fewer results.

The slideshow checks Bing automatically every 15 minutes. New wallpaper URLs are merged into the existing queue without restarting playback or repeating an image. The refresh button performs the same update immediately.

Animated wallpapers are loaded online from Bing when its homepage exposes a motion background and from several Wikimedia Commons nature-video categories. Up to 250 current landscape, ocean, waterfall, cloud, and forest candidates are requested without an API key. Browser-supported MP4 and WebM files play muted and loop in the slideshow; unavailable or unsupported files are skipped automatically.

Animated wallpaper works in the browser and fullscreen modes. Native XFCE desktop video requires an additional X11 embedding utility such as `xwinwrap`; the installed static desktop/lock-screen updater continues using Bing photos when that utility is unavailable.

## Kali Linux application

The web interface changes wallpaper every 30 seconds by default. The interval can still be customized in Settings, and preferences are saved in the browser.

For Kali Linux desktop and lock-screen wallpaper updates, make the installer executable and run it from this folder:

```bash
chmod +x install-kali.sh
./install-kali.sh
```

This installs a `Gidlight Wallpaper` application launcher and a persistent systemd user timer. It rotates through Bing's curated high-resolution wallpapers every 30 seconds, updates every XFCE monitor/workspace (or GNOME/KDE), starts again automatically after login/restart, and catches up after the computer has been off. XFCE displays its lock dialog over the current desktop, so the same current image is visible there; GNOME receives a separate lock-screen setting. The browser settings control only the web slideshow.

The slideshow cannot literally run while the computer is shut down. The persistent timer resumes automatically at the next login and immediately catches up with a missed run.

## Windows application

When hosted over HTTPS, supported browsers can install Gidlight from the browser's **Install app** command using the included web manifest and service worker. To also update the Windows desktop wallpaper at sign-in, run PowerShell from this folder:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install-windows.ps1
```

The Windows helper updates the desktop wallpaper. Windows lock-screen changes require a packaged native application with the appropriate Windows capability or an organization policy; a normal web app cannot silently change that protected setting.

The Settings tab controls the slideshow interval in seconds, minutes, hours, or days. The selected value is saved locally and is independent of the OS wallpaper updater.

## Android APK

The native Android companion APK is available from the [Gidlight Android v1.0.0 release](https://github.com/gi-deom/project100/releases/tag/v1.0.0). Download `app-debug.apk` on the phone, allow installation from that source, open Gidlight, and approve it through Android's live-wallpaper picker.

## Run it

Open `index.html` directly in a browser. No build step or package installation is required.

## Publish as `project100`

From a machine with Git installed and authenticated to GitHub:

```powershell
git init
git add .
git commit -m "Create Gidlight wallpaper slideshow"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/project100.git
git push -u origin main
```

The included GitHub Actions workflow deploys the root folder to GitHub Pages after the push. Enable Pages in the repository settings with **GitHub Actions** as the source if GitHub has not enabled it automatically.

The Bing archive endpoint may be restricted by browser CORS or network policy. When that happens, the page uses a small remote demo set and labels the status accordingly.
