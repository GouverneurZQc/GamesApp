@echo off
rem ============================================================
rem  DevPortals - lanceur Windows
rem  Double-clique sur ce fichier pour ouvrir le studio.
rem  Il demarre un petit serveur local (inclus dans Windows, aucune
rem  installation) qui heberge aussi le portail pour tes joueurs.
rem  Laisse la fenetre noire ouverte pendant que tu travailles.
rem ============================================================
chcp 65001 >nul
title DevPortals - serveur local
cd /d "%~dp0"

rem Port du serveur : garde toujours le meme pour retrouver tes projets.
set PORT=8765

if not exist "%~dp0serveur\server.ps1" (
  echo [ERREUR] Dossier "serveur" introuvable. Garde ce fichier dans le dossier DevPortals.
  pause
  exit /b 1
)

where powershell >nul 2>nul
if %errorlevel%==0 (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serveur\server.ps1" -Port %PORT%
  if errorlevel 1 pause
  exit /b
)

where python >nul 2>nul
if %errorlevel%==0 (
  python "%~dp0serveur\server.py" --port %PORT%
  if errorlevel 1 pause
  exit /b
)

echo [ERREUR] PowerShell et Python sont introuvables.
echo Ouvre studio\index.html directement dans ton navigateur (le portail joueurs sera desactive).
pause
