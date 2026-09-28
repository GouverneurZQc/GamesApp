#!/bin/sh
# DevPortals - lanceur macOS / Linux
# Demarre le serveur (Python 3.9+) : catalogue public, studio avec comptes, portails des jeux.
# Mot de passe oublie : ./lancer.sh --reset-password NOM
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${DEVPORTALS_PORT:-8765}"
if command -v python3 >/dev/null 2>&1; then
  exec python3 "$DIR/serveur/server.py" --port "$PORT" "$@"
elif command -v python >/dev/null 2>&1; then
  exec python "$DIR/serveur/server.py" --port "$PORT" "$@"
else
  echo "Python 3 est requis : https://www.python.org/downloads/ (ou via le gestionnaire de paquets)."
  exit 1
fi
