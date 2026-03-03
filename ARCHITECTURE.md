# ARCHITECTURE.md — שפרה ופועה

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 15+ (App Router) |
| Langage | TypeScript |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth (OTP SMS) |
| Styles | Tailwind CSS v4 |
| Deploy | Vercel |
| PWA | Service Worker natif |

---

## Structure des routes

```
app/
├── page.tsx                    # Redirection intelligente selon rôle
├── layout.tsx                  # Layout global (PWA meta, SW register)
├── login/page.tsx              # Auth OTP téléphone
├── signup/page.tsx             # Inscription 2 étapes avec validation
├── signup/pending/page.tsx     # Confirmation d'attente
├── profile/page.tsx            # Modifier son profil
├── help/page.tsx               # FAQ par rôle
├── about/page.tsx              # Page À propos
├── donate/page.tsx             # Page don
├── leaderboard/page.tsx        # Classement mensuel des bénévoles
├── thank-you/page.tsx          # Fin de période יולדת
├── maintenance/page.tsx        # Page maintenance
├── offline/page.tsx            # Page hors-ligne (SW)
│
├── beneficiary/
│   ├── layout.tsx              # Auth guard (role=beneficiary)
│   ├── page.tsx                # Dashboard avec tracking Wolt-style
│   ├── history/page.tsx        # Historique complet
│   ├── MealCard.tsx            # Carte repas avec progression
│   └── MealCountdown.tsx       # Compte à rebours end_date
│
├── cook/
│   ├── layout.tsx              # Auth guard (role=cook)
│   ├── page.tsx                # Dashboard Wolt restaurant cards
│   ├── history/page.tsx        # Historique des cuisines
│   ├── schedule/page.tsx       # Planning 2 semaines
│   ├── CookActions.tsx         # Boutons actions
│   └── ReleaseButton.tsx       # Rendre un repas
│
├── driver/
│   ├── layout.tsx              # Auth guard (role=driver)
│   ├── page.tsx                # Dashboard tracking livraison
│   ├── history/page.tsx        # Historique livraisons
│   ├── schedule/page.tsx       # Planning 2 semaines
│   ├── DriverActions.tsx       # Boutons actions
│   ├── NavButtons.tsx          # Waze/Google Maps
│   └── ReleaseButton.tsx       # Rendre un repas
│
├── admin/
│   ├── layout.tsx              # Auth guard (role=admin) + nav
│   ├── page.tsx                # Dashboard stats + alertes
│   ├── registrations/          # Gestion inscriptions + recherche
│   ├── meals/                  # Vue complète repas + assign + delete
│   ├── menus/                  # CRUD menus + réordonnancement plats
│   ├── users/                  # Gestion utilisatrices (rôle/actif)
│   ├── stats/                  # Statistiques + graphiques
│   ├── calendar/               # Calendrier hebdomadaire
│   ├── reports/                # Rapports mensuels
│   ├── announcements/          # Envoi notifications globales
│   ├── volunteers/             # Vue dédiée bénévoles
│   ├── logs/                   # Audit trail
│   ├── settings/               # Paramètres globaux
│   └── actions/                # Server Actions admin
│
├── actions/
│   ├── meals.ts                # Actions repas (tous rôles)
│   └── release.ts              # Rendre un repas
│
├── api/
│   ├── dev-login/route.ts      # Login dev uniquement
│   ├── public/stats/route.ts   # Stats publiques anonymisées
│   └── webhooks/               # n8n webhooks (authentifiés)
│       ├── _auth.ts            # Middleware auth webhook
│       ├── new-registration/
│       ├── registration-approved/
│       ├── meal-taken/
│       ├── meal-ready/
│       └── meal-delivered/
│
└── components/
    ├── LogoutButton.tsx
    ├── NotificationBell.tsx
    ├── NotificationBellWrapper.tsx
    ├── ServiceWorkerRegister.tsx
    └── Skeleton.tsx
```

---

## Schéma Base de Données

### Table: `users`
```sql
id            uuid (PK, = auth.uid())
name          text
phone         text
role          text  -- 'beneficiary' | 'cook' | 'driver' | 'admin'
address       text
neighborhood  text
has_car       boolean
also_driver   boolean DEFAULT false  -- bénévole qui est aussi מחלקת
notif_cooking  boolean DEFAULT true
notif_delivery boolean DEFAULT true
approved      boolean DEFAULT false
notes         text    -- allergies, préférences
created_at    timestamptz
```

### Table: `beneficiaries`
```sql
id              uuid PK
user_id         uuid FK → users
start_date      date
end_date        date
num_breakfast_days  int
num_shabbat_weeks   int
```

### Table: `meals`
```sql
id              uuid PK
beneficiary_id  uuid FK → beneficiaries
cook_id         uuid FK → users (nullable)
driver_id       uuid FK → users (nullable)
menu_id         uuid FK → menus (nullable)
date            date
type            text -- 'breakfast' | 'shabbat_friday' | 'shabbat_saturday'
status          text -- 'open' | 'cook_assigned' | 'ready' | 'driver_assigned' | 'picked_up' | 'delivered' | 'confirmed'
pickup_time     text (nullable)
delivery_time   text (nullable)
created_at      timestamptz
```

### Table: `menus`
```sql
id         uuid PK
name       text
type       text -- 'breakfast' | 'shabbat_friday' | 'shabbat_saturday'
items      text[] -- liste des plats
active     boolean DEFAULT true
created_at timestamptz
```

### Table: `notifications_log`
```sql
id         uuid PK DEFAULT gen_random_uuid()
user_id    uuid FK → users
message    text
type       text  -- 'meal_taken' | 'meal_ready' | etc.
read       boolean DEFAULT false
created_at timestamptz DEFAULT now()
```

### Table: `app_settings` (optionnelle)
```sql
key   text PK
value text
```

---

## Flux d'authentification

```
1. /login → OTP SMS via Supabase Auth
2. Callback → / (root page)
3. Root page → vérifie session + users table + approved + role
4. Redirection intelligente vers le bon dashboard
5. middleware.ts → protège toutes les routes /admin /beneficiary /cook /driver
```

## Flux d'approbation יולדת

```
1. Admin → /admin/registrations → clique "אישור"
2. approveUser() Server Action:
   - users.approved = true
   - Crée/complète enregistrement beneficiaries avec start_date
   - Génère meals: num_breakfast_days repas breakfast + num_shabbat_weeks shabbat
3. Redirection vers /admin/registrations (hard refresh)
```

## Variables d'environnement requises

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## Déploiement

1. Push vers GitHub → Vercel auto-deploy
2. Vérifier env vars dans Vercel Dashboard
3. Vérifier RLS policies en production
4. Tester avec un vrai numéro de téléphone israélien

## Performance

- Server Components pour toutes les pages de données
- Client Components uniquement pour les boutons interactifs
- Loading skeletons sur toutes les routes avec fetch
- Images optimisées (Next.js Image)
- Bundle splitting automatique par route

## Sécurité

- Supabase RLS sur toutes les tables
- Service Role Key uniquement côté serveur
- Webhook HMAC secret authentication
- CSP headers configurés dans next.config.ts
- HSTS activé en production
- Middleware d'authentification global
