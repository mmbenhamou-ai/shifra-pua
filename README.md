## שפרה ופועה — Quickstart DEV

Application Next.js / Supabase pour organiser les repas post-partum à Jérusalem :

- **Rôles principaux** :  
  - `yoledet` (יולדת) : reçoit des repas.  
  - `cook` (מבשלת) : prépare les repas (Shabbat uniquement).  
  - `deliverer` (מחלקת) : fait les livraisons (breakfast + Shabbat).  
  - `admin` : gère les profils, les menus et le suivi.
- **Produits** :  
  - `breakfast` : petits-déjeuners préparés en cuisine centrale.  
  - `shabbat` : repas de Shabbat cuisinés par les bénévoles.

Stack : **Next.js App Router + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, RLS, RPC)**.

---

### 1. Pré‑requis

- **Node.js** ≥ 20  
- **npm** (ou pnpm/yarn)  
- **Docker Desktop** (ou équivalent)  
- **Supabase CLI** installé (`npm install -g supabase` ou via la doc officielle).

---

### 2. Démarrage local (base + app)

Installation des dépendances :

```bash
npm install
```

Démarrage de l’instance Supabase locale (Postgres + Auth + Studio) :

```bash
npx supabase start
```

Application des migrations + seed de base :

```bash
npx supabase db reset
```

Lancement du frontend Next.js :

```bash
npm run dev
```

L’application est accessible sur `http://localhost:3000`.

---

### 3. Variables d’environnement (`.env.local`)

Créer un fichier `.env.local` à la racine du projet, par exemple :

```bash
cp .env.local.example .env.local  # si présent
```

Variables nécessaires côté frontend :

- `NEXT_PUBLIC_SUPABASE_URL`  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Variables nécessaires côté serveur :

- `SUPABASE_SERVICE_ROLE_KEY` (service role pour les actions admin)  
- `WEBHOOK_SECRET` (déjà vérifié dans `lib/supabase.ts`, utilisé au déploiement)

Pour récupérer les valeurs locales générées par la CLI Supabase :

```bash
npx supabase status
```

La commande affiche l’URL, la clé **anon** et la clé **service_role** de l’instance locale. Recopier :

- `API URL` → `NEXT_PUBLIC_SUPABASE_URL`  
- `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

Configurer ensuite Google OAuth (console Google) avec l’URL de redirection suivante :

- `http://localhost:3000/auth/callback`

Dans Supabase (Auth → Providers → Google), renseigner le **Client ID** et le **Client Secret** correspondants.

---

### 4. Seed de base Supabase (`supabase/seed.sql`)

Le fichier `supabase/seed.sql` est exécuté automatiquement par :

```bash
npx supabase db reset
```

Il ajoute un seed minimal :

- 3 entrées dans `public.breakfast_menu` (hébreu) :
  - ארוחת בוקר קלאסית  
  - ארוחת בוקר עשירה  
  - ארוחת בוקר קלה  
- `is_active = true`, `sort_order = 1..3`  
- Seed idempotent via `ON CONFLICT DO NOTHING` (aucun risque à le rejouer).
- **Aucun insert** dans `auth.users` (les comptes réels sont créés via OAuth Google).

Pour rejouer uniquement les migrations + seed :

```bash
npx supabase db reset
```

---

### 5. Smoke tests RPC (local)

Les RPC critiques (take_cooking, mark_ready, take_delivery, mark_delivered, confirm_received) sont validées via un script SQL de smoke tests :

- Fichier : `supabase/smoke_rpcs.sql`
- Script npm :

```bash
npm run smoke:rpc
```

Ce script :

- insère des profils de test (`profiles`) : admin, yoledet, cook, deliverer (UUIDs fixes)  
- insère quelques `meals` de test (breakfast + shabbat)  
- utilise `set_config('request.jwt.claims', ...)` pour simuler différents `auth.uid()` côté Postgres  
- vérifie notamment :
  - `take_delivery` → la deuxième prise échoue (conflit)  
  - enforcement de `is_approved` / rôle sur `take_delivery`  
  - `mark_ready` sur breakfast accessible seulement à l’admin  
  - `confirm_received` accessible seulement à la yoledet correspondante  
  - création de `meal_events` associée aux succès.

La sortie attendue contient des `NOTICE` du type :

- `OK: second take_delivery failed as expected`  
- `OK: cook blocked from mark_ready breakfast as expected`  
- `OK: yoledet successfully confirmed receipt`

Si aucun message `FAILED` n’apparaît, les RPC et RLS de base sont considérées comme saines en local.

---

### 6. Où se trouve la logique métier ?

- **Migrations Supabase** (`supabase/migrations/*.sql`) :
  - Enums (`user_role`, `meal_status`, `service_type`, `breakfast_mode`)  
  - Tables principales : `profiles`, `meals`, `meal_events`, `breakfast_menu`, etc.

- **RPC / fonctions SQL** (dans les migrations, ex. `20240304000001_rpcs_v1.sql` et `20240304000003_product_rules.sql`) :
  - `take_cooking`, `mark_ready`, `take_delivery`, `mark_delivered`, `confirm_received`  
  - vérifient les rôles (`profiles.role`), `is_approved`, `service_type` (breakfast vs shabbat), et créent des `meal_events`.

- **RLS Policies** (dans les migrations) :
  - accès lecture/écriture aux `meals` / `meal_events` en fonction de `auth.uid()`, du rôle et de `shabbat_enabled`.  
  - mutations `meals.status/cook_id/deliverer_id` bloquées côté client (RPC only).

- **Pages Next.js principales** :
  - `/login` : OAuth Google → `/auth/callback`  
  - `/pending` : compte en attente d’approbation  
  - `/admin` : gestion profils + panneau cuisine breakfast  
  - `/yoledet` : vue des repas, choix breakfast, confirmation livraison  
  - `/volunteer` : tableau de bord בישול/חלוקה, transitions RPC  
  - `/updates` : feed basé sur `meal_events`, filtré selon le rôle.


