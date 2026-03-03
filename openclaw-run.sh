#!/bin/bash
# Vérifie la config puis lance le bot OpenClaw. À lancer sur le VPS depuis le dossier du dépôt.
# Usage: bash openclaw-run.sh
# Avant: avoir rempli ~/.openclaw/openclaw.json (botToken) et ~/.openclaw/env (GEMINI_API_KEY).

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="${HOME}/.openclaw/openclaw.json"
ENV_FILE="${HOME}/.openclaw/env"

erreur=0

if [ ! -f "$CONFIG" ]; then
  echo "ERREUR: $CONFIG introuvable. Lancer d’abord: bash openclaw-install-ubuntu.sh"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "ERREUR: jq introuvable. Installer: sudo apt-get install -y jq"
  exit 1
fi

TOKEN=$(jq -r '.channels.telegram.botToken // empty' "$CONFIG")
if [ -z "$TOKEN" ] || [ "$TOKEN" = "REMPLACER_PAR_BOT_TOKEN_TELEGRAM" ] || [ "$TOKEN" = "TON_BOT_TOKEN_TELEGRAM" ]; then
  echo "ERREUR: Token Telegram manquant. Éditer $CONFIG et mettre le token du bot (BotFather) dans channels.telegram.botToken"
  erreur=1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERREUR: $ENV_FILE introuvable. Créer le fichier avec: echo 'export GEMINI_API_KEY=\"ta-clé\"' > $ENV_FILE"
  erreur=1
elif ! grep -q 'GEMINI_API_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "ERREUR: GEMINI_API_KEY absent ou vide dans $ENV_FILE. Ajouter: export GEMINI_API_KEY=\"...\""
  erreur=1
fi

if [ "$erreur" -eq 1 ]; then
  echo ""
  echo "Après avoir corrigé, relancer: bash openclaw-run.sh"
  exit 1
fi

echo "Config OK. Lancement du bot..."
[ -f "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a
bash "$DIR/openclaw-gemini-only.sh"
echo "Terminé. Tester le bot sur Telegram (conversation privée)."
