#!/bin/sh
# GameForge Studio - lanceur macOS / Linux
DIR="$(cd "$(dirname "$0")" && pwd)"
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$DIR/index.html"
elif command -v open >/dev/null 2>&1; then
  open "$DIR/index.html"
else
  echo "Ouvre ce fichier dans ton navigateur : $DIR/index.html"
fi
