#!/bin/bash
# OpenClaw sur le VPS (Ubuntu) : Gemini 2.5 et 2.0 uniquement (primary 2.5-flash, fallback 2.0-flash).
# Usage: scp ce fichier sur le serveur puis: bash openclaw-install-ubuntu.sh
# Prérequis: exécuter en tant qu'utilisateur qui gardera la config (ex. ubuntu). Pas de sudo pour le script entier.

set -e

OPENCLAW_DIR="${HOME}/.openclaw"
CONFIG="${OPENCLAW_DIR}/openclaw.json"
ENV_FILE="${OPENCLAW_DIR}/env"

echo "=== 1. Docker ==="
sudo apt-get update -qq
sudo apt-get install -y docker.io jq
sudo usermod -aG docker "$USER" 2>/dev/null || true

echo "=== 2. Répertoire et config (propriétaire: $USER) ==="
mkdir -p "$OPENCLAW_DIR"
# Config : Gemini 2.5 + 2.0 uniquement, gateway correct
cat > "$CONFIG" << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-2.5-flash",
        "fallbacks": ["google/gemini-2.0-flash"]
      }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "REMPLACER_PAR_BOT_TOKEN_TELEGRAM",
      "dmPolicy": "open",
      "allowFrom": ["*"],
      "groups": { "*": { "requireMention": true } }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "controlUi": { "dangerouslyAllowHostHeaderOriginFallback": true },
    "auth": { "token": "REMPLACER_PAR_TOKEN_GATEWAY_FORT" }
  }
}
EOF
chmod 644 "$CONFIG"

echo "=== 3. Fichier env (clé Gemini) ==="
if [ ! -f "$ENV_FILE" ]; then
  echo 'export GEMINI_API_KEY=""' > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Créé $ENV_FILE"
else
  echo "$ENV_FILE existe déjà (conservé)."
fi

echo "=== 4. Conteneur OpenClaw ==="
[ -f "$ENV_FILE" ] && set -a && . "$ENV_FILE" && set +a
sudo docker pull ghcr.io/openclaw/openclaw:latest
sudo docker rm -f openclaw 2>/dev/null || true
sudo docker run -d --name openclaw --restart unless-stopped \
  --network host \
  -v "${OPENCLAW_DIR}:/home/node/.openclaw" \
  -e GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  ghcr.io/openclaw/openclaw:latest

echo ""
echo "=== Installation terminée ==="
echo "1. Éditer la config et la clé :"
echo "   nano $ENV_FILE     # mettre ta GEMINI_API_KEY"
echo "   nano $CONFIG      # remplacer REMPLACER_PAR_BOT_TOKEN_TELEGRAM et REMPLACER_PAR_TOKEN_GATEWAY_FORT"
echo "2. Si tu as mis la clé Gemini dans env, recréer le conteneur pour l’injecter :"
echo "   . $ENV_FILE && bash openclaw-gemini-only.sh"
echo "3. (Optionnel) Reconnecte-toi en SSH pour utiliser docker sans sudo."
echo ""
echo "Bot : Gemini 2.5 en priorité, 2.0 si quota épuisé."
