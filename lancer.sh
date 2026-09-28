#!/bin/sh
# DevPortals - lanceur macOS / Linux
# Demarre le serveur local (Python 3) qui sert le studio et le portail joueurs.
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${DEVPORTALS_PORT:-8765}"
if command -v python3 >/dev/null 2>&1; then
  exec python3 "$DIR/serveur/server.py" --port "$PORT"
elif command -v python >/dev/null 2>&1; then
  exec python "$DIR/serveur/server.py" --port "$PORT"
else
  echo "Python 3 est requis pour le serveur local (https://www.python.org)."
  echo "Sans serveur, ouvre $DIR/studio/index.html dans ton navigateur (portail joueurs desactive)."
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$DIR/studio/index.html"; elif command -v open >/dev/null 2>&1; then open "$DIR/studio/index.html"; fi
fi
