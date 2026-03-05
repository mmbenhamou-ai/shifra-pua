# Supabase — שפרה ופועה (Phase 6)

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) démarré
- [Supabase CLI](https://supabase.com/docs/guides/cli) installé : `npm install -g supabase`

## Initialisation locale

```bash
# 1. Démarrer Supabase local
supabase start

# 2. Réinitialiser la base (applique les migrations + seed)
supabase db reset
```

## Migrations

Les migrations Phase 6 sont dans `supabase/migrations/` et s'appliquent dans l'ordre lexical :

| Fichier | Contenu |
|---|---|
| `20250305000001_phase6_base.sql` | Tables : users, beneficiaries, menus, meals, time_slots, meal_items, feedbacks, notifications_log, app_settings, admin_audit_log, user_push_subscriptions |
| `20250305000002_phase6_rls.sql` | Politiques RLS par rôle pour toutes les tables |
| `20250305000003_phase6_auth_trigger.sql` | Trigger `on_auth_user_created` (Phase 6 → public.users) |
| `20250305000004_phase6_shabbat_trigger.sql` | Trigger notification admin quand Shabbat complet |
| `20250305000005_phase6_secure_rpcs.sql` | RPCs sécurisées (auth.uid(), machine à états, ERR_CONFLICT) |

Les anciennes migrations V1 sont archivées dans `supabase/_archived_migrations_v1/` (ne sont pas appliquées).

## Régénérer `lib/database.types.ts`

Avec Docker et le projet Supabase démarré :

```bash
supabase gen types typescript --local > lib/database.types.ts
```

En production (projet hébergé) :

```bash
supabase gen types typescript --project-id <YOUR_PROJECT_ID> > lib/database.types.ts
```

## Vérification post-reset (Sanity check)

Après `supabase db reset`, exécuter dans le SQL Editor local :

```bash
# Depuis l'interface Supabase local (http://localhost:54323)
# ou via psql :
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/sanity_schema.sql
```

Doit afficher : `SANITY CHECK PASSED: all tables, columns and functions present`

## Smoke tests RLS/RPC

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/smoke_rpcs.sql
```

## Seed

Le fichier `supabase/seed.sql` insère 3 menus de base (breakfast, shabbat_friday, shabbat_saturday) pour les tests en local.

## Quick verification (end-to-end)

Après avoir démarré Docker et Supabase :

```bash
supabase db reset
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/sanity_schema.sql
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/smoke_rpcs.sql

npm run build
npm test
npx playwright test
```

Si toutes ces commandes passent, la Phase 6 (modèle, RLS, RPC, workflows, tests) est considérée comme cohérente avec l’état du code.
