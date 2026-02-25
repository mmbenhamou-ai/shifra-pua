# BUGS & PROBLÈMES CONNUS — שפרה פועה

---

## ✅ Corrigés

### BUG-01 : Icônes PWA ✅ CORRIGÉ (RAPPORT2)
`public/icon-192.png` et `public/icon-512.png` générés avec Python.
Note : icônes sans texte (Pillow non disponible). Remplacer manuellement par des icônes de qualité.

### BUG-02 : Service Worker non enregistré ✅ CORRIGÉ (RAPPORT4)
`app/components/ServiceWorkerRegister.tsx` créé et intégré dans `app/layout.tsx`.
Le SW s'enregistre automatiquement au chargement de l'app.

### BUG-04 : Pas d'authentification sur les webhooks ✅ CORRIGÉ (RAPPORT4)
`app/api/webhooks/_auth.ts` créé avec `checkWebhookAuth()`.
Tous les webhooks vérifient `x-webhook-secret` ou `?secret=` contre `process.env.WEBHOOK_SECRET`.
Si `WEBHOOK_SECRET` n'est pas défini (dev), la vérification est ignorée.

### BUG-05 : test-login accessible en production ✅ CORRIGÉ (RAPPORT4)
`app/test-login/page.tsx` : affiche un message d'erreur si `NODE_ENV === 'production'`.

### BUG-07 : Pas de feedback visuel pendant les Server Actions ✅ CORRIGÉ (RAPPORT3)
Tous les boutons d'action dans cook/driver/beneficiary utilisent `useTransition` avec état `isPending`.

---

## 🔴 Critique — à corriger avant mise en production

### BUG-03 : next-pwa incompatible avec Next.js 16
**Impact :** `next-pwa` (5.x) ne supporte pas Next.js 16.
**Décision :** Manifest natif + SW manuel. Aucune action requise.

---

## 🟡 Mineur — à corriger si nécessaire

### BUG-06 : Pas de pagination sur les listes admin
**Fichiers :** `app/admin/registrations/page.tsx`, `app/admin/users/page.tsx`
**Impact :** Limite Supabase à 100 lignes par défaut.
**Solution :** Ajouter `.range(0, 49)` + boutons de pagination.

### BUG-08 : start_date dans beneficiaries peut être antérieure à aujourd'hui
**Impact :** Repas passés créés avec status=open inutiles.
**Solution :** Validation dans `signup/actions.ts` : `start_date >= today`.

---

## 🟢 Améliorations futures

- **Notifications SMS** : intégrer Twilio/Vonage via n8n.
- **Coordonnées GPS** : `users.address_lat` / `users.address_lng` pour Waze précis.
- **Icônes PWA de qualité** : remplacer les icônes générées par un vrai design.
- **Export CSV** : exporter les données des repas/utilisatrices.
- **Pagination admin** : BUG-06 ci-dessus.
- **notifications_log** : La table `notifications_log` doit être créée en base avec les colonnes : `id` (uuid), `user_id` (uuid), `message` (text), `type` (text), `read` (boolean, default false), `created_at` (timestamptz). Les notifications peuvent être insérées via triggers Supabase ou depuis les Server Actions.

---

## Phase 5 — Notes d'implémentation (RAPPORT5)

### Table notifications_log requise
```sql
CREATE TABLE notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read own notifs" ON notifications_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service role can insert" ON notifications_log
  FOR INSERT WITH CHECK (true);
```

### Table beneficiaries.end_date requis
La colonne `end_date` doit exister dans la table `beneficiaries` pour le compte à rebours.
```sql
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS end_date date;
```

---

## Phase 6 — Migrations à exécuter (fichier : supabase/migrations/001_phase6_schema.sql)

Exécuter le fichier `supabase/migrations/001_phase6_schema.sql` dans **Supabase > SQL Editor**.

### Nouvelles colonnes sur `beneficiaries`
- `num_adults`, `num_children`, `children_ages` — composition du foyer
- `is_vegetarian`, `spicy_level` (0-2), `cooking_notes` — préférences alimentaires
- `preferred_time_slot_id` — FK vers `time_slots`
- `shabbat_friday`, `shabbat_saturday`, `shabbat_kashrut` — préférences Shabbat

### Nouvelles tables
- **`time_slots`** : créneaux horaires définis par l'admin (5 créneaux par défaut insérés)
- **`meal_items`** : items Shabbat réservables individuellement par les cuisinières
- **`feedbacks`** : notation 1-5 + message de remerciement après confirmation

### Nouvelles colonnes sur `meals`
- `time_slot_id` — FK vers `time_slots`
- `conflict_at` — horodatage si conflit de réservation détecté

### Fonctions SQL atomiques (SECURITY DEFINER)
- `take_meal_atomic(meal_id, user_id, role)` — prise de repas sans conflit
- `reserve_meal_item_atomic(item_id, cook_id)` — réservation item Shabbat sans conflit

### Triggers
- `trg_shabbat_complete` — notifie l'admin quand tous les items Shabbat sont couverts

### RLS granulaire sur `meals`
- יולדת liée : peut passer `delivered → confirmed` uniquement
- Cuisinière assignée : peut passer `cook_assigned/cooking → ready` uniquement
- Livreuse assignée : peut passer `driver_assigned/picked_up → suivant` uniquement
- Cuisinière approuvée : peut prendre un repas `open`
- Livreuse approuvée : peut prendre un repas `ready`
- Admin : peut tout modifier
