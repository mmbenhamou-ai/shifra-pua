# Configuration Vercel & Supabase — Shifra & Pua

## 1. Variables d'environnement Vercel

### 1.1 Go-live minimal (niveau 1)

Pour un lancement minimal (sans cron, sans webhooks n8n, sans push, sans Google Maps), les variables suivantes doivent être définies :

- `NEXT_PUBLIC_SUPABASE_URL` — URL publique Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clé anonyme publique.

Si vous activez des fonctionnalités backend-only (cron, webhooks, push), il faudra également définir :

- `SUPABASE_SERVICE_ROLE_KEY` — clé service_role (backend uniquement : cron, webhooks, push).
- `WEBHOOK_SECRET` — secret partagé pour les webhooks (si webhooks activés).
- `CRON_SECRET` — secret Bearer pour les routes `/api/cron/*` (si cron activé).

### 1.2 Fonctionnalités recommandées (niveau 2)

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — clé publique VAPID pour les notifications push (si push activé).
- `VAPID_PRIVATE_KEY` — clé privée VAPID.
- `VAPID_SUBJECT` — contact (par ex. `mailto:admin@shifrapua.com`).
- `NEXT_PUBLIC_SENTRY_DSN` — DSN Sentry (observabilité, recommandé).
- `N8N_UNCOVERED_WEBHOOK` — URL du webhook n8n pour les repas non couverts (si n8n activé).
- `N8N_SHABBAT_RECAP_WEBHOOK` — URL du webhook n8n pour le récap Shabbat.

### 1.3 Optionnel (niveau 3)

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — clé Google Maps pour l'autocomplete d'adresse (si l'on souhaite le confort d'autocomplétion ; si absente, le champ adresse fonctionne en saisie manuelle).

Mettre à jour également `.env.local` en local avec les mêmes clés.

## 2. Déploiement Vercel sans Git

Depuis le répertoire du projet :

```bash
vercel link      # lier le dossier au projet Vercel
vercel env pull  # récupérer les variables d'environnement vers .env.local (si déjà configurées)
vercel --prod    # déploiement production
```

Vérifier ensuite la checklist du `docs/RUNBOOK_PROD.md`.

Pour une checklist complète et ordonnée couvrant Vercel, Supabase, n8n, cron et tests post-deploy, se référer à :

- `docs/GO_LIVE_CHECKLIST.md`

## 3. Configuration Supabase Auth

Dans le tableau de bord Supabase :

- **Auth → URL de redirection** :
  - URL de production (ex. `https://your-domain/auth/callback`).
  - URL de préproduction / preview (ex. `https://*.vercel.app/auth/callback`).
- S'assurer que les domaines Vercel sont bien autorisés.

## 4. Supabase Realtime

Pour les écrans temps réel (dashboards admin, listes de repas) :

- Activer Realtime sur les tables nécessaires (au minimum `meals`, éventuellement `users`, `notifications_log`).
- Autoriser les événements `INSERT`, `UPDATE` (et `DELETE` si besoin) pour les canaux utilisés par l'app.

## 5. Secrets & webhooks (n8n)

- Tous les webhooks externes doivent recevoir un header `x-webhook-secret` dont la valeur est `WEBHOOK_SECRET`.
- Côté n8n :
  - ajouter une vérification du header `x-webhook-secret` dans le workflow,
  - refuser/stopper le workflow si la valeur ne correspond pas.
- Les routes suivantes l'envoient déjà :
  - `/api/cron/check-uncovered`
  - `/api/cron/shabbat-recap`

## 6. Notifications push (PWA)

- Générer une paire de clés VAPID (par exemple via un script Node ou l'outil web-push).
- Renseigner `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` dans les variables d'environnement.
- Vérifier que la table `user_push_subscriptions` existe (créée par les migrations Phase 6) et que les policies RLS autorisent les utilisatrices à gérer leurs propres abonnements.
- Pour tester :
  1. Charger l'app sur un navigateur supportant les pushs (Chrome/Edge).
  2. Accepter les notifications.
  3. Vérifier dans Supabase que `user_push_subscriptions` contient un enregistrement pour l'utilisatrice.

