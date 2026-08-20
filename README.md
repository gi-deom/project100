# Gidlight wallpaper slideshow

A dependency-free Bing wallpaper slideshow. It requests the Bing Image Archive across multiple markets and historical offsets, deduplicates every result, and keeps the queue open-ended rather than stopping at a fixed image count. Uniquely seeded photo fallbacks are used only when the public archive returns fewer results.

The slideshow checks Bing automatically every 15 minutes. New wallpaper URLs are merged into the existing queue without restarting playback or repeating an image. The refresh button performs the same update immediately.

When Bing exposes a homepage motion background, the loader recognizes MP4 and WebM URLs as video slides. They play muted, loop, and crossfade like image slides. Bing does not publish motion backgrounds through the historical `HPImageArchive` endpoint, and some regional homepage responses omit the video URL, so video slides appear only when Bing makes that media URL available to the browser.

## Kali Linux application

The web interface includes a Settings tab where the slideshow interval can be set from 1 to 120 minutes. Preferences are saved in the browser.

For Kali Linux desktop and lock-screen wallpaper updates, make the installer executable and run it from this folder:

```bash
chmod +x install-kali.sh
./install-kali.sh
```

This installs a `Gidlight Wallpaper` application launcher and a systemd user timer. The timer fetches the newest Bing image and applies it using XFCE (Kali's usual desktop), GNOME, or KDE commands when available. The browser settings control the web slideshow; the native updater uses an 8-minute system timer.

## Windows application

When hosted over HTTPS, supported browsers can install Gidlight from the browser's **Install app** command using the included web manifest and service worker. To also update the Windows desktop wallpaper at sign-in, run PowerShell from this folder:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install-windows.ps1
```

The Windows helper updates the desktop wallpaper. Windows lock-screen changes require a packaged native application with the appropriate Windows capability or an organization policy; a normal web app cannot silently change that protected setting.

The Settings tab controls the slideshow interval in seconds, minutes, hours, or days. The selected value is saved locally and is independent of the OS wallpaper updater.

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
