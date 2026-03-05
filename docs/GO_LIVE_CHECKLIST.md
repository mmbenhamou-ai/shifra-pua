# GO LIVE CHECKLIST — Shifra & Pua

> Source of truth GO LIVE : en cas de divergence avec d’autres documents, cette checklist prévaut pour la mise en production.

## A) Avant déploiement (local)

- [ ] `cd /Users/mmb/Documents/Cursor/shifra-pua`
- [ ] `vercel link` (projet : sélectionner le projet existant Shifra & Pua, ex. `shifrapua`)
- [ ] `vercel env pull` (vérifier que `.env.local` est créé dans ce dossier)
- [ ] `node scripts/preflight-prod.js` (aucune variable de **niveau 1** manquante)
- [ ] `npm run build` (build vert)

---

## B) Vercel Dashboard (env vars prod)

- [ ] Ajouter / vérifier les variables **niveau 1** :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `WEBHOOK_SECRET`
  - `CRON_SECRET`
- [ ] (Option) Niveau 2 :
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `N8N_UNCOVERED_WEBHOOK`
  - `N8N_SHABBAT_RECAP_WEBHOOK`

---

## C) Supabase Dashboard (réglages indispensables)

### Auth → URL Configuration

- [ ] Ajouter les Redirect URLs pour les domaines Vercel (preview + production) dans la configuration d’authentification.
- [ ] Vérifier que la "Site URL" pointe bien vers le domaine de production.

### Realtime

- [ ] Activer Realtime sur la table `meals` pour les événements `UPDATE`.
- [ ] (Option) Activer Realtime sur d’autres tables réellement utilisées en temps réel, si nécessaire.

### Database / Sécurité

- [ ] Confirmer que la RLS est activée sur les tables clés (`users`, `beneficiaries`, `meals`, `meal_items`, `notifications_log`, `admin_audit_log`, `user_push_subscriptions`, etc.).
- [ ] Confirmer que les fonctions RPC critiques existent et sont actives :
  - `take_meal_atomic`
  - `reserve_meal_item_atomic`
  - `cook_release_meal`
  - `driver_release_meal`
  - `mark_meal_ready`
  - `mark_picked_up`
  - `mark_delivered`
  - `confirm_meal_received`
  - `admin_unlock_meal`

---

## D) n8n (WhatsApp / automatisations)

- [ ] Configurer `WEBHOOK_SECRET` dans tous les nœuds webhook (ajouter un header `x-webhook-secret` avec cette valeur).
- [ ] Envoyer un payload test minimal (ex. corps JSON avec `{ "test": true, "source": "shifra-pua" }`).
- [ ] Vérifier que le workflow reçoit bien l’appel et que l’événement est loggé côté n8n.

---

## E) Cron (anti-blocage)

- [ ] Configurer `CRON_SECRET` dans le job cron (utiliser l’en-tête `Authorization: Bearer <CRON_SECRET>`).
- [ ] Tester manuellement la route cron principale :
  - [ ] Sans header : appel de la route cron ➔ réponse 401/403 attendue.
  - [ ] Avec header correct : appel avec `Authorization: Bearer <CRON_SECRET>` ➔ réponse 200 attendue.

---

## F) Déploiement

- [ ] `vercel --prod`

---

## G) Tests post-deploy (production)

- [ ] `curl` ou équivalent sur `/test-login` ➔ HTTP 404
- [ ] `curl` ou équivalent sur `/api/dev-login` ➔ HTTP 404
- [ ] Parcours de login normal OK (OTP, redirections vers les bons tableaux de bord)
- [ ] Flux Phase 6 complet OK : admin → cook → driver → beneficiary (tous les statuts passent correctement)
- [ ] `/admin/stuck` accessible par un compte admin, et les actions de déblocage fonctionnent (repas repassent en `open`/`ready` + logs dans `admin_audit_log`).
- [ ] Vérifier qu’au moins un webhook WhatsApp / n8n est reçu et traité correctement (avec le header `x-webhook-secret`).
