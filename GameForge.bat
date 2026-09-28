@echo off
rem ============================================================
rem  GameForge Studio - lanceur Windows
rem  Double-clique sur ce fichier pour ouvrir l'application.
rem  Aucune installation requise : tout tourne dans ton navigateur.
rem ============================================================
chcp 65001 >nul
title GameForge Studio
cd /d "%~dp0"

if not exist "%~dp0index.html" (
  echo [ERREUR] index.html introuvable. Garde ce fichier .bat dans le dossier de GameForge Studio.
  pause
  exit /b 1
)

echo.
echo    GameForge Studio
echo    ----------------
echo    Ouverture dans ton navigateur...
echo    (Chrome, Edge ou Firefox recommandes)
echo.
start "" "%~dp0index.html"
exit /b 0
