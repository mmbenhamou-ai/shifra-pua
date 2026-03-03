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

### M10 🟡 — Alertes pour repas non couverts à J-48h pas automatisées

**Cahier des charges :** PROJECT.md §Notifications — "Rappel 48h avant repas non couvert"
**Statut :** Dashboard admin montre les repas non couverts, mais le webhook `uncovered-48h` n'est pas appelé automatiquement

**Ce qui manque :**
- Cron job (Vercel Cron ou n8n scheduled) qui appelle `/api/webhooks/uncovered-48h` chaque matin à 8h Israel time
- Configuration Vercel Cron dans `vercel.json` :
  ```json
  { "crons": [{ "path": "/api/cron/check-uncovered", "schedule": "0 6 * * *" }] }
  ```
- API route `/api/cron/check-uncovered/route.ts` qui requête les repas sans cook dans les 48h
- n8n workflow qui envoie WhatsApp à toutes les מבשלות disponibles : "יש ארוחה פתוחה ל[date] !"

---

### M11 🟡 — Récapitulatif Shabbat hebdomadaire absent

**Cahier des charges :** PROJECT.md §Notifications — "Recap Shabbat le jeudi soir"
**Statut :** Webhook `shabbat-recap` existe côté Next.js, mais non automatisé

**Ce qui manque :**
- Cron chaque jeudi à 18h Israel time → appelle `/api/webhooks/shabbat-recap`
- Le webhook retourne : liste des repas Shabbat du week-end avec status (couvert/non couvert)
- n8n envoie un message récapitulatif WhatsApp à l'admin
- Format du message : "📋 רשימת שבת : ✅ 3 ארוחות מכוסות | ⚠️ 1 ארוחה פתוחה"

---

### M12 🟡 — Historique des repas pour la יולדת limité

**Cahier des charges :** PROJECT.md §Bénéficiaire — "Voir l'historique de tous mes repas"
**Statut :** Le dashboard montre les repas futurs, mais l'historique complet des repas passés n'est pas accessible

**Ce qui manque :**
- Page `/beneficiary/history` : tous les repas passés avec statut et détails
- Filtres : mois, type de repas (petit-déjeuner / Shabbat)
- Affichage des notes laissées (feedback)
- Statistiques personnelles : total reçus, cuisinières différentes

---

## PRIORITÉ 3 — NICE-TO-HAVE

---

### M13 🟢 — Page publique d'atterrissage (Landing Page)

**Cahier des charges :** Mentionné dans RAPPORT6 comme "ajouté"
**Statut :** Non confirmé si `/` redirige vers login (page publique séparée non vérifiée)

**Ce qui manque :**
- Page publique `/` accessible sans auth avec :
  - Description de l'association en hébreu
  - Boutons "Je suis enceinte / je viens d'accoucher" et "Je veux m'inscrire comme bénévole"
  - Statistiques anonymisées (nb de repas servis, nb de bénévoles)
  - Contact et réseaux sociaux

---

### M14 🟢 — Classement/Leaderboard des bénévoles

**Cahier des charges :** RAPPORT6 §Leaderboard des bénévoles
**Statut :** Mentionné dans RAPPORT6, non confirmé implémenté

**Ce qui manque :**
- Page `/admin/stats` ou section dédiée : top 10 מבשלות et מחלקות du mois
- Affichage : initiales + nombre de repas préparés/livrés
- Calcul : requête Supabase groupée par cook_id/driver_id + count

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

### M16 🟢 — Export Google Calendar / iCal pour les bénévoles

**Cahier des charges :** PROJECT.md §Fonctionnalités futures
**Statut :** Non implémenté

**Ce qui manque :**
- API route `/api/calendar/cook.ics` qui génère un fichier iCal avec les repas assignés
- Lien "Ajouter à mon calendrier" dans le dashboard cook/driver
- Mise à jour automatique (le fichier est régénéré à chaque requête)

---

### M17 🟢 — Notifications push natives PWA

**Cahier des charges :** PROJECT.md §Notifications — "Push notifications"
**Statut :** Service Worker existe mais pas de push subscription

**Ce qui manque :**
- Génération de clés VAPID : `npx web-push generate-vapid-keys`
- Variables env : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- API route `/api/push/subscribe` pour enregistrer les subscriptions
- Table Supabase `push_subscriptions(user_id, endpoint, keys_auth, keys_p256dh)`
- Envoi de push depuis les Server Actions ou webhooks
- Handler `push` dans `public/sw.js` (déjà partiellement là)
- Toggle "Activer les notifications" dans `/profile`

---

### M18 🟢 — Mode sombre (Dark Mode)

**Cahier des charges :** DESIGN.md §Thèmes — non mentionné explicitement mais standard PWA
**Statut :** Non implémenté (design actuel : fond blanc uniquement)

**Ce qui manque :**
- Variables CSS dark mode dans `globals.css` sous `@media (prefers-color-scheme: dark)`
- Toggle manuel dans les settings
- Test sur iOS (dark mode système)

---

### M19 🟢 — Monitoring et alertes erreurs (Sentry ou équivalent)

**Cahier des charges :** BUGS.md §Future — "Monitoring en production"
**Statut :** Non implémenté

**Ce qui manque :**
- Installation : `npm install @sentry/nextjs`
- Configuration `sentry.client.config.ts`, `sentry.server.config.ts`
- Variable env : `SENTRY_DSN`
- Filtrage des erreurs attendues (ex: "מישהי אחרת לקחה" = race condition normale)
- Alertes Slack/email en cas d'erreur critique

---

### M20 🟢 — Tests automatisés (E2E + unitaires)

**Cahier des charges :** TESTS.md liste 60+ tests manuels
**Statut :** Tous les tests sont manuels, aucun test automatisé

**Ce qui manque :**
- Tests unitaires pour les fonctions utilitaires (`normalizePhone`, `isSameNeighborhood`, `shabbatDatesInRange`) avec Vitest ou Jest
- Tests E2E avec Playwright pour les flows critiques :
  - Inscription יולדת → approbation admin → repas générés
  - מבשלת prend repas → marque prêt
  - מחלקת prend livraison → marque livré → יולדת confirme
- CI/CD sur GitHub Actions : tests lancés à chaque PR

---

## RÉSUMÉ

| Priorité | Nombre | Description |
|----------|--------|-------------|
| 🔴 Bloquant prod | 4 | Migrations SQL, SMS OTP, Env vars, n8n |
| 🟡 Haute importance | 8 | Profil, aide, export, feedback, créneaux, crons, récap Shabbat, historique |
| 🟢 Nice-to-have | 8 | Landing page, leaderboard, photos, calendrier, push, dark mode, monitoring, tests |

**Total : 20 fonctionnalités manquantes ou non confirmées implémentées**
