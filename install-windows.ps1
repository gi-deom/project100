$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = Join-Path $env:LOCALAPPDATA 'Gidlight'
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Copy-Item (Join-Path $projectDir 'northlight-wallpaper.ps1') (Join-Path $installDir 'northlight-wallpaper.ps1') -Force
$startupDir = [Environment]::GetFolderPath('Startup')
$launcher = Join-Path $startupDir 'Gidlight Wallpaper.cmd'
"@echo off`r`npowershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$installDir\northlight-wallpaper.ps1`"" | Set-Content -Path $launcher -Encoding ASCII
Start-Process (Join-Path $projectDir 'index.html')
Write-Host 'Gidlight is installed for Windows and will update the desktop wallpaper at sign-in.'
Write-Host 'For the full slideshow app, use your browser Install App command when hosted.'
