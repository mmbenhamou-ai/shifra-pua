#!/bin/bash
# OpenClaw : Gemini 2.5 et 2.0 uniquement (primary 2.5-flash, fallback 2.0-flash).
# À lancer sur le VPS. Clé: ~/.openclaw/env avec export GEMINI_API_KEY="..."
# Usage: bash openclaw-gemini-only.sh

set -e

[ -f "${HOME}/.openclaw/env" ] && set -a && . "${HOME}/.openclaw/env" && set +a

CONFIG="${HOME}/.openclaw/openclaw.json"

if [ ! -f "$CONFIG" ]; then
  echo "Erreur: $CONFIG introuvable."
  exit 1
fi

command -v jq &>/dev/null || { sudo apt-get update -qq; sudo apt-get install -y jq; }

echo "=== Sauvegarde config ==="
cp "$CONFIG" "${CONFIG}.bak.before-gemini-only"

echo "=== Mise à jour: Gemini 2.5 + 2.0 uniquement ==="
jq '
  .agents.defaults.model = {
    "primary": "google/gemini-2.5-flash",
    "fallbacks": ["google/gemini-2.0-flash"]
  } |
  del(.models.providers.ollama?, .models.providers.groq?)
' "$CONFIG" > "${CONFIG}.new" && mv "${CONFIG}.new" "$CONFIG"
jq '.agents.defaults.model' "$CONFIG"

echo "=== Recréation du conteneur (Gemini uniquement) ==="
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
if [ -z "$GEMINI_API_KEY" ]; then
  echo "Clé manquante. Crée ~/.openclaw/env avec GEMINI_API_KEY (voir openclaw-env.example), puis relance:"
  echo "  bash openclaw-gemini-only.sh"
  exit 1
fi

docker stop openclaw 2>/dev/null || true
docker rm openclaw 2>/dev/null || true
docker run -d --name openclaw --restart unless-stopped \
  --network host \
  -v "${HOME}/.openclaw:/home/node/.openclaw" \
  -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
  ghcr.io/openclaw/openclaw:latest

echo "Conteneur recréé. Vérification:"
docker ps | grep openclaw
echo ""
echo "Bot Telegram : Gemini 2.5 en priorité, 2.0 si quota épuisé."
