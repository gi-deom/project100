#!/usr/bin/env python3
"""Download and rotate Bing images on Linux desktop and lock screens."""

import json
import pathlib
import shutil
import subprocess
import tempfile
import urllib.request

BING_URL = "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US"
CACHE_DIR = pathlib.Path.home() / ".cache" / "gidlight"
STATE_PATH = CACHE_DIR / "state.json"


def command_exists(name):
    return shutil.which(name) is not None


def run(command, *, capture=False):
    return subprocess.run(command, check=False, text=True,
        stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
        stderr=subprocess.DEVNULL)


def load_state():
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"index": -1}


def fetch_archive():
    request = urllib.request.Request(BING_URL, headers={"User-Agent": "Gidlight/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)["images"]


def download_slide(entry):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    identity = entry.get("hsh") or pathlib.Path(entry["urlbase"]).name
    destination = CACHE_DIR / f"{identity}.jpg"
    if not destination.exists():
        url = "https://www.bing.com" + entry["urlbase"] + "_UHD.jpg"
        with tempfile.NamedTemporaryFile(dir=CACHE_DIR, suffix=".jpg", delete=False) as output:
            temporary = pathlib.Path(output.name)
        try:
            urllib.request.urlretrieve(url, temporary)
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)
    return destination


def xfce_properties():
    result = run(["xfconf-query", "-c", "xfce4-desktop", "-l"], capture=True)
    properties = (result.stdout or "").splitlines()
    return [prop for prop in properties
            if prop.endswith(("/last-image", "/last-single-image", "/image-path"))
            and prop.startswith("/backdrop/")]


def apply_wallpaper(image_path):
    image = str(image_path.resolve())
    if command_exists("xfconf-query"):
        properties = xfce_properties() or ["/backdrop/screen0/monitor0/image-path"]
        for prop in properties:
            run(["xfconf-query", "-c", "xfce4-desktop", "-p", prop, "-s", image])
            style_prop = prop.rsplit("/", 1)[0] + "/image-style"
            run(["xfconf-query", "-c", "xfce4-desktop", "-p", style_prop, "-s", "5"])
    elif command_exists("gsettings"):
        uri = image_path.resolve().as_uri()
        run(["gsettings", "set", "org.gnome.desktop.background", "picture-uri", uri])
        run(["gsettings", "set", "org.gnome.desktop.background", "picture-uri-dark", uri])
    elif command_exists("plasma-apply-wallpaperimage"):
        run(["plasma-apply-wallpaperimage", image])
    else:
        raise RuntimeError("No supported desktop wallpaper command found")

    # GNOME has a separate lock-screen image. XFCE's lock dialog appears over
    # the current desktop, so updating every XFCE backdrop covers it as well.
    if command_exists("gsettings"):
        uri = image_path.resolve().as_uri()
        run(["gsettings", "set", "org.gnome.desktop.screensaver", "picture-uri", uri])


def main():
    state = load_state()
    archive = fetch_archive()
    index = (int(state.get("index", -1)) + 1) % len(archive)
    image_path = download_slide(archive[index])
    apply_wallpaper(image_path)
    STATE_PATH.write_text(json.dumps({"index": index, "image": str(image_path)}), encoding="utf-8")


if __name__ == "__main__":
    main()
