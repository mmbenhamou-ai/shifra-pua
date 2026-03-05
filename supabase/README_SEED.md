# Seed Supabase (DEV)

Ce projet utilise un seed SQL minimal pour faciliter les tests en local.

## Contenu du seed

- Ajout de 3 entrées dans `public.breakfast_menu` (hébreu), actives et ordonnées.
- Aucune insertion dans `auth.users` ni dans les tables liées aux profils/utilisatrices.

Le fichier est idempotent (utilise `ON CONFLICT DO NOTHING`), il peut donc être rejoué sans erreur.

## Commande recommandée

En local, après modification du schéma ou pour repartir de zéro :

```bash
npx supabase db reset
```

Cette commande :

- applique toutes les migrations dans `supabase/migrations/`
- exécute ensuite le seed `supabase/seed.sql`

Tu peux ensuite te connecter avec un compte Google réel ; les menus de petit‑déjeuner seront déjà présents pour les écrans Admin / יולדת / מתנדבת.

