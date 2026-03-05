# Migrations — ordre d’exécution

En cas de **timeout** dans le SQL Editor Supabase, ne pas exécuter `005_consolidated_final.sql` en entier.

## Option 1 : SQL Editor (un fichier à la fois)

Exécuter dans l’ordre, **un seul fichier par exécution** :

1. `006_schema_users_beneficiaries_timeslots.sql`
2. `007_schema_meal_items_feedbacks_meals_notif_settings.sql`
3. `008_rls_policies_new_tables.sql`
4. `009_rls_policies_meals.sql`
5. `010_functions_trigger_verify.sql`

Copier-coller le contenu d’un fichier → Run → attendre la fin → passer au suivant.

## Option 2 : CLI Supabase (recommandé, pas de timeout)

Si le projet est **en pause** (offre gratuite), le réactiver depuis le **Dashboard** : [Supabase](https://supabase.com/dashboard) → votre projet → bouton **Restore project**. Attendre 1–2 min que le projet soit actif.

Puis en local, à la racine du projet :

```bash
npx supabase link --project-ref rxshtudurghuluugcypg
export SUPABASE_DB_PASSWORD="votre_mot_de_passe_db"
npx supabase db push
```

`db push` exécute toutes les migrations dans l’ordre (001 → 010) sans limite de temps du navigateur.
