@echo off
rem ============================================================
rem  DevPortals - lanceur Windows
rem  Double-clique sur ce fichier pour demarrer la plateforme :
rem  catalogue public des jeux, studio (avec comptes) et portails.
rem  Si Python n'est pas installe, la version portable officielle
rem  (python.org) est telechargee UNE seule fois dans runtime\python
rem  et verifiee (empreinte SHA-256). Rien n'est installe dans Windows.
rem  Laisse la fenetre noire ouverte : elle fait tourner le serveur.
rem
rem  Mot de passe oublie : ouvre une invite de commandes dans ce
rem  dossier et tape   DevPortals.bat --reset-password NOM
rem ============================================================
setlocal
chcp 65001 >nul
title DevPortals - serveur
cd /d "%~dp0"

rem Port du serveur (adresse http://localhost:8765/). Garde toujours le meme.
set "PORT=8765"

set "PYVER=3.13.7"
set "PYDIR=%~dp0runtime\python"
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
set "PYCHECK=import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)"

if not exist "%~dp0serveur\server.py" goto :nofolder

rem 1) Python portable deja prepare par DevPortals
if exist "%PYDIR%\python.exe" goto :portable

rem 2) Python installe sur le PC (lanceur "py" ou "python")
py -3 -c "%PYCHECK%" >nul 2>nul
if not errorlevel 1 goto :usepy
python -c "%PYCHECK%" >nul 2>nul
if not errorlevel 1 goto :usepython

rem 3) Sinon : telechargement de Python portable officiel
goto :install

:portable
"%PYDIR%\python.exe" "%~dp0serveur\server.py" --port %PORT% %*
goto :end

:usepy
py -3 "%~dp0serveur\server.py" --port %PORT% %*
goto :end

:usepython
python "%~dp0serveur\server.py" --port %PORT% %*
goto :end

:install
set "ARCH=%PROCESSOR_ARCHITECTURE%"
if defined PROCESSOR_ARCHITEW6432 set "ARCH=%PROCESSOR_ARCHITEW6432%"
set "PYARCH="
if /i "%ARCH%"=="AMD64" set "PYARCH=amd64"
if /i "%ARCH%"=="ARM64" set "PYARCH=arm64"
if not defined PYARCH goto :noarch
if "%PYARCH%"=="amd64" set "PYSHA=f6cca216a359be84797cabb54149ce5e062afb16cc7567eb7fc51cacb2d86b65"
if "%PYARCH%"=="arm64" set "PYSHA=2ddcf25e71f7205e652ebb57439f22fd2bab37d7f5c9152dbe32867bf2c77a50"
set "PYURL=https://www.python.org/ftp/python/%PYVER%/python-%PYVER%-embed-%PYARCH%.zip"
set "PYZIP=%~dp0runtime\python-%PYVER%-embed-%PYARCH%.zip"
echo.
echo  Python est introuvable sur ce PC.
echo  Telechargement de Python %PYVER% portable (officiel, python.org, environ 11 Mo)...
echo  Il sera range dans le dossier runtime\python de DevPortals.
echo.
if not exist "%~dp0runtime" mkdir "%~dp0runtime"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}; try { Invoke-WebRequest -UseBasicParsing -Uri $env:PYURL -OutFile $env:PYZIP; $h = (Get-FileHash -Algorithm SHA256 -LiteralPath $env:PYZIP).Hash; if ($h -ne $env:PYSHA) { Remove-Item -LiteralPath $env:PYZIP -Force; Write-Host ' [ERREUR] Empreinte SHA-256 incorrecte : fichier refuse.'; exit 2 }; Expand-Archive -LiteralPath $env:PYZIP -DestinationPath $env:PYDIR -Force; Remove-Item -LiteralPath $env:PYZIP -Force } catch { Write-Host (' [ERREUR] ' + $_.Exception.Message); exit 1 }"
if errorlevel 1 goto :dlfail
if not exist "%PYDIR%\python.exe" goto :dlfail
echo  Python portable pret.
echo.
goto :portable

:dlfail
echo.
echo [ERREUR] Impossible de preparer Python automatiquement (connexion Internet ?).
echo Installe Python 3 depuis https://www.python.org/downloads/
echo en cochant "Add python.exe to PATH", puis relance DevPortals.bat.
pause
exit /b 1

:noarch
echo.
echo [ERREUR] Windows 32 bits detecte : installe Python 3 depuis https://www.python.org/downloads/
echo en cochant "Add python.exe to PATH", puis relance DevPortals.bat.
pause
exit /b 1

:nofolder
echo [ERREUR] Dossier "serveur" introuvable. Garde ce fichier dans le dossier DevPortals.
pause
exit /b 1

:end
if errorlevel 1 pause
endlocal
