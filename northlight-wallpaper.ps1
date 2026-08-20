$ErrorActionPreference = 'Stop'
$cacheDir = Join-Path $env:LOCALAPPDATA 'Gidlight'
$imagePath = Join-Path $cacheDir 'current.jpg'
$apiUrl = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US'
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null
$data = Invoke-RestMethod -Uri $apiUrl
$imageUrl = 'https://www.bing.com' + $data.images[0].url
Invoke-WebRequest -Uri $imageUrl -OutFile $imagePath
Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name Wallpaper -Value $imagePath
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Wallpaper {
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int SystemParametersInfo(int action, int parameter, string path, int flags);
}
"@
[Wallpaper]::SystemParametersInfo(20, 0, $imagePath, 3) | Out-Null
Write-Host "Gidlight desktop wallpaper updated: $imagePath"
Write-Host "Windows lock-screen updates require an organization policy or a packaged native app with the required capability."
