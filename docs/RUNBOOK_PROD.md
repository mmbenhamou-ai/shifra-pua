# RUNBOOK Production — Shifra & Pua (Phase 6)

## 1. Pré-requis locaux

- Docker Desktop démarré
- Supabase CLI installé (`supabase` dans le PATH)
- `psql` disponible en ligne de commande

## 2. Vérifications locales avant déploiement

```bash
# 1) Reset de la base locale (migrations Phase 6 + seed)
supabase start
supabase db reset

# 2) Sanity check schéma (tables / colonnes / fonctions critiques)
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/sanity_schema.sql

# 3) Smoke tests RLS / RPC (auth.uid(), rôles, statuts)
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/smoke_rpcs.sql

# 4) Build et tests applicatifs
npm run build
npm test
npx playwright test
```

Tous ces appels doivent passer **sans erreur** avant tout déploiement production.

### Chemin rapide GO-LIVE

1. Exécuter :

   ```bash
   node scripts/preflight-prod.js
   ```

   - Si des variables de **niveau 1** manquent → corriger avant de continuer.
   - Des warnings (niveau 2) ou infos (niveau 3) peuvent être tolérés pour un premier go-live.

2. Lancer la suite de vérifications locales ci-dessus (`supabase db reset` + sanity + smoke + build + tests).
3. Valider la checklist QA manuelle de `RAPPORT_FINAL.md` (5 points).

## 3. Vérifications en production

Une fois déployé sur Vercel avec la base Supabase production configurée :

1. **Endpoints de test désactivés**
   - `curl -I https://your-domain/test-login` → HTTP 404
   - `curl -I https://your-domain/api/dev-login` → HTTP 404

2. **Login normal**
   - Parcours complet d'authentification OTP pour une nouvelle bénéficiaire.

3. **Flux Phase 6 complet**
   - Admin crée / approuve une bénéficiaire et génère les repas.
   - Cook prend un repas sur `/cook`, marque comme prêt.
   - Driver prend le repas sur `/driver`, marque `picked_up` puis `delivered`.
   - Beneficiary confirme la réception sur `/beneficiary`.

4. **Concurrence**
   - Depuis deux navigateurs / sessions cook, tenter de prendre le même repas.
   - Résultat attendu : une seule success, l'autre voit le message `"מישהי אחרת לקחה"`.

## 4. Monitoring minimal

- **Logs Vercel**
  - Surveillez les erreurs 500/404 inhabituelles, et en particulier les erreurs RPC (`ERR_CONFLICT`, `ERR_FORBIDDEN`, `ERR_NOT_APPROVED`, `ERR_INVALID_STATE`).
- **Logs Supabase**
  - Vérifier les erreurs dans les fonctions SQL (RPC) et les policies RLS.
- **Sentry (si activé)**
  - S'assurer que le DSN (`NEXT_PUBLIC_SENTRY_DSN`) est défini et que les erreurs sont bien remontées.

## 5. Procédures d'incident

### 5.1 Repas bloqué

Symptômes : repas qui reste trop longtemps en `cook_assigned`, `ready`, `driver_assigned` ou `picked_up`.

1. Aller sur `/admin/stuck`.
2. Identifier le repas concerné.
3. Utiliser les boutons :
   - **"החזר לפתוח"** pour renvoyer en statut `open`.
   - **"החזר למוכן"** pour renvoyer en statut `ready`.
4. Vérifier que l'action apparaît dans `admin_audit_log`.

En parallèle, le cron `/api/cron/recover-stuck` corrige automatiquement certains cas selon la durée passée dans chaque statut.

### 5.2 Conflit concurrentiel

Symptôme : message d'erreur `"מישהי אחרת לקחה"` côté UI quand deux bénévoles cliquent en même temps.

- C'est un **comportement attendu** : la première requête gagne, la seconde reçoit `ERR_CONFLICT` et le message en hébreu.
- Aucune action corrective n'est nécessaire, expliquer simplement le comportement aux bénévoles.

### 5.3 Reset / maintenance de la base

**Ne pas** lancer de `supabase db reset` sur la base de production.

En cas de problème grave :

1. Sauvegarder la base via les outils Supabase (export SQL / snapshot).
2. Consulter l'historique des migrations et des événements (`admin_audit_log`, `notifications_log`).
3. Si besoin, corriger manuellement quelques enregistrements `meals` via l'interface SQL, en respectant la machine à états et les triggers.

## 6. Script de préflight

Avant chaque déploiement, exécuter :

```bash
node scripts/preflight-prod.js
```

Le script vérifie la présence des variables d'environnement critiques (Supabase, webhooks, cron, push). Il doit afficher un rapport avec toutes les valeurs **présentes**.  
- Si des valeurs de **niveau 1** manquent ➔ sortie avec code `1` (déploiement à bloquer).  
- Les variables de niveaux 2/3 produisent des warnings/infos mais ne bloquent pas le déploiement si les features associées ne sont pas encore activées.

## 7. Déploiement Vercel CLI (sans Git)

Pour les étapes détaillées de déploiement via la CLI Vercel (sans intégration Git), se référer à :

- `docs/DEPLOY_VERCEL_CLI.md`
