#!/bin/bash
# Diagnostic OpenClaw (Telegram + Gemini) — à lancer sur le VPS.
# Usage: bash openclaw-check.sh

CONFIG="${HOME}/.openclaw/openclaw.json"
ENV_FILE="${HOME}/.openclaw/env"

echo "=== 1. Config ~/.openclaw/openclaw.json ==="
if [ ! -f "$CONFIG" ]; then
  echo "  ERREUR: $CONFIG introuvable."
else
  echo "  Fichier OK."
  if command -v jq &>/dev/null; then
    TOKEN=$(jq -r '.channels.telegram.botToken // empty' "$CONFIG")
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "REMPLACER_PAR_BOT_TOKEN_TELEGRAM" ] || [ "$TOKEN" = "TON_BOT_TOKEN_TELEGRAM" ]; then
      echo "  ERREUR: channels.telegram.botToken non renseigné ou encore un placeholder. Remplacer par le token @BotFather."
    else
      echo "  botToken: défini (${#TOKEN} caractères)."
    fi
    EN=$(jq -r '.channels.telegram.enabled' "$CONFIG" 2>/dev/null)
    echo "  telegram.enabled: $EN"
  fi
fi

echo ""
echo "=== 2. Fichier env (GEMINI_API_KEY) ==="
if [ ! -f "$ENV_FILE" ]; then
  echo "  ERREUR: $ENV_FILE introuvable. Créer avec: export GEMINI_API_KEY=\"...\""
else
  echo "  Fichier OK."
  if grep -q 'GEMINI_API_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
    echo "  GEMINI_API_KEY: défini dans env."
  else
    echo "  ERREUR: GEMINI_API_KEY absent ou vide dans $ENV_FILE"
  fi
fi

echo ""
echo "=== 3. Conteneur OpenClaw ==="
if ! command -v docker &>/dev/null; then
  echo "  ERREUR: docker introuvable."
elif ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx openclaw; then
  echo "  ERREUR: conteneur 'openclaw' ne tourne pas. Lancer: . ~/.openclaw/env && bash openclaw-gemini-only.sh"
else
  echo "  Conteneur openclaw: en cours d'exécution."
  if docker exec openclaw env 2>/dev/null | grep -q 'GEMINI_API_KEY=.'; then
    echo "  GEMINI_API_KEY: présente dans le conteneur."
  else
    echo "  ERREUR: GEMINI_API_KEY absente dans le conteneur. Relancer: . ~/.openclaw/env && bash openclaw-gemini-only.sh"
  fi
fi

echo ""
echo "=== 4. Derniers logs (openclaw) ==="
if command -v docker &>/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx openclaw; then
  docker logs openclaw --tail 30 2>&1
else
  echo "  (conteneur non disponible)"
fi

echo ""
echo "--- Si le bot ne répond pas: corriger les ERREUR ci-dessus, puis bash openclaw-run.sh"
