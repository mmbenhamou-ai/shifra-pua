#!/usr/bin/env bash
# deploy.sh — Vérifie les variables d'environnement avant déploiement

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Vérification des variables d'environnement שפרה ופועה...${NC}"

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "WEBHOOK_SECRET"
)

OPTIONAL_VARS=(
  "NEXT_PUBLIC_APP_URL"
  "NODE_ENV"
)

MISSING=0

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR:-}" ]; then
    echo -e "${RED}✗ MANQUANT: ${VAR}${NC}"
    MISSING=$((MISSING + 1))
  else
    # Masquer la valeur sauf les 6 premiers chars
    VAL="${!VAR}"
    MASKED="${VAL:0:6}***"
    echo -e "${GREEN}✓ ${VAR}: ${MASKED}${NC}"
  fi
done

for VAR in "${OPTIONAL_VARS[@]}"; do
  if [ -z "${!VAR:-}" ]; then
    echo -e "${YELLOW}⚠ OPTIONNEL: ${VAR} (non défini)${NC}"
  else
    echo -e "${GREEN}✓ ${VAR}: ${!VAR}${NC}"
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ ${MISSING} variable(s) obligatoire(s) manquante(s). Arrêt du déploiement.${NC}"
  echo -e "${YELLOW}💡 Copiez .env.example vers .env.local et remplissez les valeurs.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Toutes les variables obligatoires sont définies.${NC}"
echo ""

# Vérifier que Next.js compile
echo -e "${YELLOW}🔨 Test de build Next.js...${NC}"
if ! npm run build 2>&1 | tail -20; then
  echo -e "${RED}❌ Build échoué. Corriger les erreurs avant de déployer.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Build réussi. Déploiement vers Vercel...${NC}"
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || echo "Rien à committer"
git push

echo -e "${GREEN}🚀 Push effectué — Vercel va déployer automatiquement.${NC}"
