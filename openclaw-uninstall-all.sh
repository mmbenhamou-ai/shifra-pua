#!/bin/bash
# Désinstallation complète d'OpenClaw sur le VPS : conteneur, config.
# Usage: bash openclaw-uninstall-all.sh
#        bash openclaw-uninstall-all.sh -k   # garde une sauvegarde de ~/.openclaw (pas de suppression)

set -e

KEEP_CONFIG=false
[ "${1:-}" = "-k" ] || [ "${1:-}" = "--keep" ] && KEEP_CONFIG=true

echo "=== 1. Conteneur OpenClaw ==="
sudo docker stop openclaw 2>/dev/null || true
sudo docker rm openclaw 2>/dev/null || true
echo "Conteneur supprimé."

echo "=== 2. Config OpenClaw (~/.openclaw) ==="
if [ -d ~/.openclaw ]; then
  if $KEEP_CONFIG; then
    BAK=".openclaw.bak.$(date +%Y%m%d%H%M%S)"
    mv ~/.openclaw ~/"$BAK"
    echo "Sauvegarde: ~/$BAK"
  else
    rm -rf ~/.openclaw
    echo "~/.openclaw supprimé."
  fi
else
  echo "Pas de dossier ~/.openclaw."
fi

echo ""
echo "Désinstallation terminée. Pour réinstaller proprement:"
echo "  bash openclaw-install-ubuntu.sh"
echo "Puis éditer ~/.openclaw/env (GEMINI_API_KEY) et ~/.openclaw/openclaw.json (botToken, gateway.auth.token),"
echo "et lancer: bash openclaw-gemini-only.sh"
