# Rapport Final du Projet Shifra & Pua (03 Mars 2026)

L'application web Shifra & Pua (Next.js, Tailwind, Supabase) vient d'atteindre sa version finale 1.0.
Le développement était initialement un « PoC » avant de subir un audit approfondi listant 20 corrections techniques, fonctionnelles et des ajouts de confort (nice-to-have).
**Toutes les missions de ces documents d'audit ont été accomplies à 100%.**

## 1. Structure métier

* Inscription des bénéficiaires et bénévoles via OTP.
* 4 rôles actifs avec accès restreints via Row Level Security (RLS) et Middlewares :
  * **Admin** : Dashboards de gestion des inscriptions, planifications des repas, statistiques.
  * **Cook (מבשלת)** : Choix des repas ouverts, gestion des items Shabbat.
  * **Driver (מחלקת)** : Récupération et navigation Waze pour les livraisons.
  * **Beneficiary (יולדת)** : Calendrier des livraisons, suivi historique, validations et feedback.

## 2. Phase 6 — modèle de données et sécurité

* Modèle unique Phase 6 : `users`, `beneficiaries`, `meals`, `meal_items`, `time_slots`, `feedbacks`, `notifications_log`, `admin_audit_log`, `user_push_subscriptions`, `app_settings`, `menus`.
* Historique V1 archivé : toutes les migrations 20240304*.sql sont déplacées dans `supabase/_archived_migrations_v1/`.
* Chaîne de migrations canonique dans `supabase/migrations/20250305*.sql` :
  * **001** — schéma de base (tables + FKs + RLS activée),
  * **002** — RLS granulaires par rôle (beneficiary/cook/driver/admin/service_role limité),
  * **003** — trigger `on_auth_user_created` vers `public.users`,
  * **004** — trigger Shabbat `notify_admin_shabbat_complete`,
  * **005** — RPC sécurisées.
* Toutes les RPC critiques sont `SECURITY DEFINER` avec `SET search_path = public` et :
  * identité uniquement via `auth.uid()`,
  * vérification `users.approved` + `users.role` côté SQL,
  * transitions de statut atomiques via `UPDATE ... WHERE ... RETURNING`,
  * erreurs explicites : `ERR_FORBIDDEN`, `ERR_NOT_APPROVED`, `ERR_CONFLICT`, `ERR_INVALID_STATE`.
* Les droits sont durcis : `REVOKE ALL ON FUNCTION ... FROM PUBLIC` puis `GRANT EXECUTE ... TO authenticated`.

Les détails de la configuration Supabase (migrations, génération de types, sanity et smoke tests) sont documentés dans `supabase/README.md`.

## 3. Anti-blocage et outils admin

* Page `app/admin/stuck/page.tsx` :
  * liste les repas bloqués (`cook_assigned`, `ready`, `driver_assigned`, `picked_up` trop anciens),
  * permet à l’admin de les remettre en `open` ou `ready` via la RPC `admin_unlock_meal`,
  * journalise chaque action dans `admin_audit_log`.
* Cron `app/api/cron/recover-stuck/route.ts` (protégé par `CRON_SECRET`) :
  * repasse automatiquement certains repas en `open`/`ready` après un temps configurable,
  * écrit également dans `admin_audit_log`.
* Les autres crons et webhooks (`check-uncovered`, webhooks n8n) restent protégés par des secrets HTTP.

## 4. Service-role, RLS et Server Actions

* Le client `service_role` (`createAdminClient`) est réservé à :
  * `app/api/cron/*`,
  * `app/api/webhooks/*`,
  * `lib/push-notifications.ts`,
  * quelques endpoints admin d’export strictement backend.
* Les Server Actions appelables depuis le front (par ex. `app/actions/meals.ts`, `app/actions/release.ts`) utilisent désormais `createSupabaseServerClient` + RPC sécurisées **exclusivement**.
* Les políticas RLS garantissent :
  * **meals** :
    * beneficiary ne peut confirmer que ses propres repas (`delivered → confirmed`),
    * cook ne peut prendre/avancer que ses propres repas (`open → cook_assigned → ready`),
    * driver idem pour la livraison (`ready → driver_assigned → picked_up → delivered`),
    * admin (et service_role) peut tout gérer.
  * **meal_items** :
    * seule une cuisinière approuvée peut réserver un item libre ou déjà à elle,
    * admin/service_role peuvent gérer tous les items.
  * **notifications_log**, **user_push_subscriptions**, **feedbacks**, **time_slots**, **app_settings** :
    * lecture minimale pour les utilisateurs,
    * écriture contrôlée via RPC/service backend.
  * **admin_audit_log** :
    * lecture réservée aux admins,
    * insertion autorisée pour service_role / backends sécurisés.

## 5. Tests et reproductibilité

* `npm run build` : build Next.js 16 + TypeScript 0 erreur.
* `npm test` : suite Vitest verte.
* `npx playwright test` :
  * flux Phase 6 complet (cook → driver → beneficiary),
  * tests de concurrence (2 cooks sur le même repas),
  * guards de rôle /auth,
  * release cook.
* Reproductibilité DB (via Docker + Supabase CLI) :
  * `supabase db reset` applique les migrations Phase 6 + `supabase/seed.sql`,
  * `supabase/sanity_schema.sql` vérifie la présence des tables/colonnes/fonctions clés,
  * `supabase/smoke_rpcs.sql` exécute des scénarios RLS/RPC pour s’assurer que :
    * les appels non authentifiés échouent,
    * les rôles non approuvés/mal typés sont refusés,
    * les statuts invalides lèvent `ERR_INVALID_STATE`,
    * les signatures RPC sont correctes.

## 6. Guards production (endpoints de test)

* `/test-login` :
  * page client de login de test disponible **uniquement** en développement,
  * en production, le `middleware` intercepte et renvoie un 404.
* `/api/dev-login` :
  * route d’aide au login de test en développement,
  * bloquée en production par un double garde :
    * `middleware` (404),
    * condition `NODE_ENV === 'production'` dans le handler qui renvoie un 403/404.

## 7. Audit externe / Antigravity

Le rapport complet de l’audit Antigravity est archivé dans :

- `docs/audit_report_antigravity.md`

Ce document (copie du fichier `audit_report.md.resolved` généré par Antigravity) constitue la référence détaillée des risques identifiés, des recommandations et des corrections apportées. Il complète :

- `docs/RESUME_COMPLET_AUDIT_V1.md` (synthèse humainement lisible),
- `supabase/README.md` (détails techniques sur la base de données et les migrations).

## 8. Conclusion GO/NO-GO

Sous réserve :

1. que Docker + Supabase CLI soient opérationnels dans l’environnement de déploiement,
2. que `supabase db reset && psql -f supabase/sanity_schema.sql && psql -f supabase/smoke_rpcs.sql` passent sans erreur,
3. que la checklist QA manuelle suivante soit validée en environnement de staging,

> la version Phase 6 de Shifra & Pua est considérée **prête pour un GO production**.

### Checklist QA manuelle

1) Flux complet : créer un repas via admin → cook le prend (/cook) → marque prêt → driver le prend (/driver) → marque livré → beneficiary confirme (/beneficiary) — vérifier qu'à chaque étape le statut change correctement
2) Concurrence : ouvrir deux onglets cook sur le même repas, cliquer "prendre" simultanément — l'un doit voir une erreur "מישהי אחרת לקחה"
3) Repas bloqué : forcer un repas en cook_assigned anciennement via DB, visiter /admin/stuck → bouton "החזר לפתוח" visible et fonctionnel
4) Guard production : vérifier curl -I https://your-domain/test-login → 404 (build production) et curl -I https://your-domain/api/dev-login → 404
5) Release : cook prend un repas → clique sur le bouton \"↩ להחזיר לרשימה הפנויה\" (ReleaseButton) → repas repasse en open et réapparaît dans les disponibles

