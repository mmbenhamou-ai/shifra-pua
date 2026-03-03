## שפרה ופועה — Plateforme repas post-partum

Application Next.js / Supabase pour gérer les repas offerts aux יולדות par les bénévoles (מבשלות / מחלקות).

### Démarrage rapide

1. Installer les dépendances :

```bash
npm install
```

2. Configurer l’environnement :

```bash
cp .env.example .env.local
# Remplir les variables (voir ARCHITECTURE.md)
```

3. Lancer le serveur de dev :

```bash
npm run dev
```

L’application est accessible sur `http://localhost:3000`.

### Documentation projet

- `ARCHITECTURE.md` : structure des routes, schéma DB, flux métier
- `DESIGN.md` : design system (tokens, composants, layout)
- `TESTS.md` : scénarios de tests manuels avant production
- `BUGS.md` / `AUDIT_BUGS.md` : suivi des bugs et audits techniques
- `GUIDE-DEMARRAGE.md` : guide détaillé pour nouveaux contributeurs

### Déploiement

Le script `./deploy.sh` vérifie les variables d’environnement critiques (Supabase, WEBHOOK_SECRET), lance `npm run build`, puis pousse sur la branche configurée (déploiement Vercel automatique).

