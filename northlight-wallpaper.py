#!/usr/bin/env python3
"""Apply the latest Bing wallpaper to common Kali Linux desktops."""

import json
import os
import pathlib
import shutil
import subprocess
import tempfile
import urllib.request

BING_URL = "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US"
CACHE_DIR = pathlib.Path.home() / ".cache" / "gidlight"
IMAGE_PATH = CACHE_DIR / "current.jpg"


def command_exists(name):
    return shutil.which(name) is not None


def run(command):
    subprocess.run(command, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def download_image():
    with urllib.request.urlopen(BING_URL, timeout=30) as response:
        image_url = "https://www.bing.com" + json.load(response)["images"][0]["url"]
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    temporary_path = pathlib.Path(tempfile.mktemp(suffix=".jpg", dir=CACHE_DIR))
    urllib.request.urlretrieve(image_url, temporary_path)
    temporary_path.replace(IMAGE_PATH)


def apply_wallpaper():
    image = str(IMAGE_PATH)
    if command_exists("xfconf-query"):
        run(["xfconf-query", "-c", "xfce4-desktop", "-p", "/backdrop/screen0/monitor0/image-path", "-s", image])
        run(["xfconf-query", "-c", "xfce4-desktop", "-p", "/backdrop/screen0/monitor0/image-style", "-s", "5"])
    elif command_exists("gsettings"):
        uri = pathlib.Path(image).as_uri()
        run(["gsettings", "set", "org.gnome.desktop.background", "picture-uri", uri])
        run(["gsettings", "set", "org.gnome.desktop.background", "picture-uri-dark", uri])
    elif command_exists("plasma-apply-wallpaperimage"):
        run(["plasma-apply-wallpaperimage", image])
    else:
        raise RuntimeError("No supported desktop wallpaper command found")

    if command_exists("gsettings"):
        uri = pathlib.Path(image).as_uri()
        run(["gsettings", "set", "org.gnome.desktop.screensaver", "picture-uri", uri])


if __name__ == "__main__":
    download_image()
    apply_wallpaper()