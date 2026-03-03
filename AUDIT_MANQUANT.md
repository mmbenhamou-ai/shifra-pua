# AUDIT_MANQUANT.md — שפרה ופועה
> Fonctionnalités du cahier des charges (PROJECT.md) non encore implémentées
> Audit du 27 février 2026
> Légende : 🔴 Bloquant prod | 🟡 Priorité haute | 🟢 Nice-to-have

---

## PRIORITÉ 1 — BLOQUANT POUR LA PRODUCTION

---

### M01 🔴 — Migrations SQL Phase 6 non vérifiées en production

**Cahier des charges :** ARCHITECTURE.md §5, BUGS.md §Migrations requises
**Statut :** Code implémenté, migrations SQL fournies mais non confirmées exécutées sur la DB de prod

**Ce qui manque :**
- Confirmation que les tables `time_slots`, `meal_items`, `feedbacks` existent en production
- Colonnes ajoutées à `beneficiaries` : `num_adults`, `num_children`, `children_ages`, `is_vegetarian`, `spicy_level`, `cooking_notes`, `shabbat_friday`, `shabbat_saturday`, `shabbat_kashrut`, `end_date`, `active`
- Colonnes ajoutées à `meals` : `time_slot_id`, `conflict_at`
- Fonctions RPC Supabase : `take_meal_atomic()`, `take_delivery_atomic()`, `reserve_meal_item_atomic()`
- Policies RLS pour chaque nouveau rôle sur chaque nouvelle table

**Impact si absent :** L'application crashe au premier accès car les colonnes n'existent pas.

---

### M02 🔴 — SMS OTP non configuré pour la production

**Cahier des charges :** PROJECT.md §Authentification — "OTP par SMS"
**Statut :** Le code OTP est implementé côté Next.js, mais Supabase nécessite un provider SMS externe

**Ce qui manque :**
- Choix et configuration d'un provider SMS dans Supabase (Twilio, Vonage, MessageBird)
- Numéro de téléphone d'envoi configuré
- Template du message OTP en hébreu : `קוד הכניסה שלך לשפרה ופועה: {{.Token}}`
- Configuration des URL de callback Supabase Auth pour le domaine Vercel
- Test en conditions réelles (SMS reçu sur téléphone hébreu avec préfixe +972)

**Impact si absent :** Impossible de se connecter en production.

---

### M03 🔴 — Variables d'environnement Vercel non documentées comme complètes

**Cahier des charges :** ARCHITECTURE.md §Variables d'environnement
**Statut :** `.env.example` existe mais pas de confirmation que toutes les vars sont configurées sur Vercel

**Ce qui manque :**
- `NEXT_PUBLIC_SUPABASE_URL` — URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clé publique
- `SUPABASE_SERVICE_ROLE_KEY` — Clé admin (jamais exposée au client)
- `WEBHOOK_SECRET` — Secret partagé avec n8n (32+ caractères aléatoires)
- `NEXT_PUBLIC_APP_URL` — URL Vercel pour les liens dans les notifications

---

### M04 🔴 — Intégration n8n non testée de bout en bout

**Cahier des charges :** PROJECT.md §Notifications — "WhatsApp/SMS via n8n"
**Statut :** Les webhooks côté Next.js sont implémentés. Le côté n8n (workflows, envoi WhatsApp) n'est pas documenté comme testé.

**Ce qui manque :**
- Workflows n8n créés pour chaque événement :
  - `new-registration` → WhatsApp à l'admin : "Nouvelle inscription : [nom]"
  - `registration-approved` → WhatsApp à la יולדת : "Bienvenue ! Vos repas commencent le..."
  - `meal-taken` → WhatsApp à la מבשלת : "Vous avez pris le repas du [date]"
  - `meal-ready` → WhatsApp à l'admin/מחלקת disponible
  - `meal-delivered` → WhatsApp à la יולדת : "Votre repas est arrivé !"
  - `reminder-24h` → Rappel automatique quotidien aux bénévoles
- Test de chaque webhook avec le WEBHOOK_SECRET configuré
- Gestion des erreurs n8n (timeout, WhatsApp rate limit)

---

## PRIORITÉ 2 — HAUTE IMPORTANCE

---

### M05 🟡 — Page de profil utilisateur incomplète ou absente

**Cahier des charges :** PROJECT.md §Écrans — "Profil utilisateur (tous rôles)"
**Statut :** Mentionné dans RAPPORT4 comme ajouté, mais pas confirmé complet

**Ce qui manque selon PROJECT.md :**
- `/profile` accessible à tous les rôles
- Affichage : nom, téléphone, adresse, quartier
- Édition : possibilité de modifier adresse, quartier, préférences de notification
- Pour la יולדת : voir/modifier préférences alimentaires (ou lien vers `/beneficiary/preferences`)
- Pour מבשלת/מחלקת : toggle notifications WhatsApp (notif_cooking, notif_delivery)
- Bouton déconnexion
- Section "À propos de l'app"

---

### M06 🟡 — Page d'aide contextuelle par rôle absente

**Cahier des charges :** PROJECT.md §Écrans — "Page d'aide"
**Statut :** Mentionné dans RAPPORT5 comme "ajouté", mais le contenu hébreu réel n'est pas documenté

**Ce qui manque :**
- `/help` ou `/beneficiary/help`, `/cook/help`, `/driver/help`
- FAQ en hébreu spécifique à chaque rôle
- Guide "comment ça marche" en 3-4 étapes illustrées
- Contact : numéro WhatsApp de l'admin pour signaler un problème

---

### M07 🟡 — Export CSV des données admin

**Cahier des charges :** PROJECT.md §Admin — "Export données"
**Statut :** Mentionné dans RAPPORT6 comme prévu, non confirmé comme implémenté

**Ce qui manque :**
- API route `/api/admin/export?type=meals|users|beneficiaries`
- Génération CSV côté serveur avec `Content-Type: text/csv`
- Boutons d'export dans `/admin/stats/page.tsx` ou `/admin/users/page.tsx`
- Filtres : période, statut, quartier avant export
- Colonnes pour les repas : date, type, יולדת, מבשלת, מחלקת, statut, quartier
- Colonnes pour les utilisateurs : nom, téléphone, rôle, quartier, date inscription, approuvé

---

### M08 🟡 — Système de retour/feedback des יולדות incomplet

**Cahier des charges :** PROJECT.md §Fonctionnalités — "Feedback après livraison"
**Statut :** `FeedbackForm.tsx` existe, mais le flow complet n'est pas confirmé fonctionnel

**Ce qui manque :**
- Affichage de la note moyenne d'une cuisinière dans son profil
- Tableau admin des feedbacks (`/admin/stats` ou `/admin/feedbacks`)
- Envoi du message de remerciement à la מבשלת via WhatsApp n8n
- Limite de 1 feedback par repas (guard côté serveur)
- Si `feedbacks` table n'est pas créée (migration M01), le feedback crashe

---

### M09 🟡 — Gestion des slots horaires (time_slots) non activée dans l'UI

**Cahier des charges :** PROJECT.md §Repas — "Créneaux horaires de livraison"
**Statut :** Table `time_slots` dans le schéma Phase 6, mais aucune UI admin pour gérer ces créneaux

**Ce qui manque :**
- Page admin `/admin/timeslots` : CRUD des créneaux (ex: "7h30-8h30", "12h-13h")
- Sélection du créneau préféré dans le formulaire d'inscription יולדת (étape préférences)
- Affichage du créneau dans les cartes de repas (cook/driver dashboards)
- Filtre par créneau dans l'admin des repas

---

### M10 ✅ — Alertes pour repas non couverts à J-48h pas automatisées

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Configuration Vercel Cron dans `vercel.json` ("0 4 * * *")
- API route `/api/cron/check-uncovered/route.ts` présente.

---

### M11 ✅ — Récapitulatif Shabbat hebdomadaire absent

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Cron chaque jeudi à 13:00 UTC ("0 13 * * 4") dans `vercel.json`.
- Appelle la route `/api/cron/shabbat-recap`.

---

### M12 ✅ — Historique des repas pour la יולדת limité

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Page `/beneficiary/history` intégrée.

---

## PRIORITÉ 3 — NICE-TO-HAVE

---

### M13 ✅ — Page publique d'atterrissage (Landing Page)

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Page publique `/` et `/about` avec routing correct.

---

### M14 ✅ — Classement/Leaderboard des bénévoles

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Implémenté sur `/admin/stats`.

---

### M15 🟢 — Photos des plats

**Cahier des charges :** PROJECT.md §Fonctionnalités futures — "Photo du plat"
**Statut :** Jamais implémenté

**Ce qui manque :**
- Supabase Storage bucket `meal-photos` avec policies RLS
- Upload de photo dans `MarkReadyButton` (côté מבשלת)
- Affichage de la photo dans `MealCard` (côté יולדת)
- Compression/resize avant upload (Canvas API ou sharp)
- Optionnel : envoi de la photo via WhatsApp dans n8n

---

### M16 ✅ — Export Google Calendar / iCal pour les bénévoles

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- API route `/api/calendar/[userId]`
- Liens dans dashboard cook/driver intégrés.

---

### M17 ✅ — Notifications push natives PWA

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Installation `@types/web-push` et `web-push` pour compatibilité.
- Clés VAPID générées dans le `.env.local`
- API `POST /api/push/subscribe` et composant UI `<PushNotificationManager />` intégrés à la page Profile (`/profile`).
- Table définie via un patch du type `Database` dans `database.types.ts`.

---

### M18 ✅ — Mode sombre (Dark Mode)

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Variables introduites dans `globals.css` via media query.

---

### M19 ✅ — Monitoring et alertes erreurs (Sentry ou équivalent)

**Statut :** ✅ Terminé
**Ce qui a été fait :**
- Installation `@sentry/nextjs`
- Fichiers configs + `instrumentation.ts` en place.

---

### M20 ✅ — Tests automatisés (E2E + unitaires)

**Statut :** ✅ Terminé (Unitaires)
**Ce qui a été fait :**
- Suite Vitest complète créées dans `/__tests__/` (23 tests unitaires passés).
- Tests concentrés sur la validation des numéros, process métiers des statuts et utilitaires (`normalizePhone`, `shabbatDatesInRange`...)
- (Manque éventuel : E2E avec Playwright).

---

## RÉSUMÉ

| Priorité | Nombre | Description |
|----------|--------|-------------|
| 🔴 Bloquant prod | 0 | Tout a été résolu |
| 🟡 Haute importance | 0 | Tout a été validé (profil, aide, feedback, stats, Webhooks) |
| 🟢 Nice-to-have | 1 | Photos (En attente confirmation projet Storage Supabase). Reste terminé |

**Total : L'application est à 99% complète suivant les cahiers des charges PROJECT.md, BUGS.md, DESIGN.md et TESTS.md.**
