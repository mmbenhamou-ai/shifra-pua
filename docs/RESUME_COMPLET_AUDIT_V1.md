# Résumé complet — Audit fonctionnel V1 (Phases 1 à 5)

Un seul document qui sert de point d'entrée pour tout l'audit : ce qui a été fait, ce qui a été corrigé dans le code, et ce qui reste recommandé. Les détails restent dans les docs par phase quand ils existent.

---

## 1. Contexte et périmètre

- **Stack** : Next.js App Router, Supabase, rôles admin / yoledet / cook / deliverer.
- **Schéma V1** : `profiles`, `meals`, `meal_events` ; statuts `open` → `cooking` → `ready` → `delivering` → `delivered` → `confirmed` ; colonnes `deliverer_id` (pas `driver_id`).
- **Les 5 phases** : cartographie, simulation parcours, correction des blocages, cas limites, simulation 200 utilisateurs.

---

## 2. Phase 1 — Cartographie

- **Routes** : pages app/ (admin, yoledet, volunteer, public, legacy) et API (auth, cron, webhooks, export, push).
- **Server Actions** : listées par fichier avec tables/RPC utilisées (actions/meals, release, profile, signup, admin/*, yoledet, volunteer, beneficiary/*).
- **RPC** : create_profile_if_missing, update_my_profile_safe, yoledet_create_breakfast_meal, confirm_received, take_cooking, mark_ready, take_delivery, mark_delivered, create_meal (admin), take_meal_atomic / reserve_meal_item_atomic (legacy).
- **Tables** : profiles, meals, meal_events, breakfast_menu, meal_items, notifications_log, admin_audit_log, app_settings, user_push_subscriptions, feedbacks, menus, time_slots.
- **Flux** : login → callback → profil ; création meal (yoledet breakfast / admin create_meal) ; prise cooking → ready → take delivery → delivered → confirm_received.
- **Incohérences identifiées** : plus de `users`/`beneficiaries` dans app/lib ; RPC legacy take_meal_atomic ; colonnes driver_id vs deliverer_id dans plusieurs fichiers ; table menus vs breakfast_menu.

*Note : Le fichier CARTOGRAPHIE_PROJET_V1.md n'existe pas dans docs/ ; le résumé s'appuie sur le contenu décrit en session.*

---

## 3. Phase 2 — Simulation parcours utilisateur

- **Parcours** : inscription yoledet → admin approuve → meal créé → cook prend (shabbat) / admin marque ready (breakfast) → deliverer prend → deliverer marque delivered → yoledet confirme.
- **Blocages critiques identifiés** :
  - **B1** : Admin crée un repas via create_meal avec client service_role → auth.uid() NULL → RPC refuse.
  - **B2** : Admin marque breakfast ready avec client service_role → auth.uid() NULL → mark_ready refuse.
  - **B3** : Inscription sans session → redirect login, perte du formulaire.
- **Corrections appliquées** (déjà en code) :
  - B1 : [app/admin/actions/meals.ts](../app/admin/actions/meals.ts) — createManualMeal utilise createSupabaseServerClient() pour l'appel RPC create_meal (audit log reste en admin).
  - B2 : [app/admin/page.tsx](../app/admin/page.tsx) — markBreakfastReady utilise createSupabaseServerClient() pour mark_ready.

*Référence détaillée : SIMULATION_PARCOURS_UTILISATEUR.md si présent ailleurs.*

---

## 4. Phase 3 — Correction des blocages

- **Priorités** : pages cassées, Server Actions incorrectes, queries vers tables inexistantes, rôles, colonnes.
- **Corrections effectuées** (en plus de B1/B2) : aucune autre modification de code n'est exigée pour les « blocages critiques » du parcours ; le reste relève de Phase 4/5 (release, UI, admin V1).

---

## 5. Phase 4 — Cas limites

- **7 scénarios** : deux bénévoles même meal (OK en base) ; cook abandonne ; deliverer annule ; yoledet non approuvée (redirect /pending) ; meal date passée ; cook prend meal déjà ready (refusé par RPC) ; deliverer prend meal sans cook (breakfast, OK).
- **Problèmes** : releaseMealAsCook/Driver utilisaient statuts et colonnes incorrects (cook_assigned, driver_assigned, driver_id).
- **Corrections appliquées** : [app/actions/release.ts](../app/actions/release.ts) — statut `cooking` (au lieu de cook_assigned), `delivering` et `deliverer_id` (au lieu de driver_assigned / driver_id), revalidatePath `/volunteer`.
- **Recommandé** : Boutons « להחזיר » sur [app/volunteer/page.tsx](../app/volunteer/page.tsx) pour cooking et delivering ; filtre par date optionnel sur les listes « à prendre ».

*Référence : [docs/PHASE4_CAS_LIMITES.md](PHASE4_CAS_LIMITES.md).*

---

## 6. Phase 5 — Simulation 200 utilisateurs

- **Contexte** : 20 yoledot, 50 cooks, 50 deliverers, 3 admins.
- **Scénarios problématiques** : repas en open (shabbat/breakfast) non pris / non marqués ; repas bloqués en cooking/delivering (pas de bouton release sur /volunteer) ; delivered non confirmé ; cook/deliverer désapprouvée en cours de route ; conflit admin/RPC (statuts ou colonnes legacy) ; table users / champs legacy dans l'admin.
- **Blocages du workflow** : tableau synthétique par statut (condition de blocage / condition pour progresser) — voir doc détaillée.
- **Correctifs recommandés** : (1) Boutons « להחזיר » sur /volunteer ; (2) moyen admin pour débloquer un repas orphelin (cooking/delivering) ; (3) aligner toutes les actions admin sur le schéma V1 (profiles, statuts, deliverer_id, create_meal) ; (4) rappels/visibilité breakfast pour admins ; (5) filtre date optionnel ; (6) rappel יולדת pour confirmation.

*Référence : [docs/PHASE5_SIMULATION_UTILISATEURS_REELS.md](PHASE5_SIMULATION_UTILISATEURS_REELS.md).*

---

## 6bis. Validation du workflow complet

Pour qu’un audit soit concluant, le workflow doit être validé en conditions réelles. Cette section décrit le parcours à tester et la vérification en base.

**Workflow testé :**

1. Inscription yoledet  
2. Approbation admin  
3. Création meal (breakfast par yoledet, ou shabbat par admin)  
4. Prise cooking (shabbat) / admin marque ready (breakfast)  
5. Passage ready (cook marque « מוכן » pour shabbat)  
6. Prise delivery  
7. Livraison (deliverer marque « נמסר »)  
8. Confirmation yoledet  

**Résultat attendu sur `meals` :**

`open` → `cooking` → `ready` → `delivering` → `delivered` → `confirmed`

**Vérification dans `meal_events` :**

Pour le meal concerné, les lignes doivent correspondre aux transitions (colonnes `type` / `message_he`). Types insérés par les RPC en V1 : `created`, `take_cooking`, `mark_ready`, `take_delivery`, `mark_delivered`, `confirm_received`.

Sans cette validation, l’audit reste théorique. Prochaine étape recommandée : **test manuel du workflow** avec 1 yoledet, 1 cook, 1 deliverer, 1 admin (comptes réels ou dev), puis `SELECT id, status FROM meals` et `SELECT meal_id, type FROM meal_events ORDER BY created_at` pour confirmer la chaîne complète.

---

## 7. État final — Synthèse

### Déjà corrigé dans le code

- create_meal et mark_ready (breakfast) appelés avec le client serveur (session admin) pour que auth.uid() soit défini.
- releaseMealAsCook et releaseMealAsDriver alignés sur V1 (cooking, deliverer_id, revalidatePath /volunteer).

### À faire (recommandations)

- Exposer les boutons « להחזיר » sur la page /volunteer (cooking et delivering).
- Aligner l'admin sur le schéma V1 : remplacer `users` par `profiles` dans ensureAdmin (ou équivalent), utiliser uniquement les statuts V1 et deliverer_id dans updateMealStatus / assignCook / assignDriver, et s'assurer que createManualMeal utilise bien la RPC create_meal (déjà le cas si la correction B1 est bien déployée).
- Donner à l'admin un moyen de débloquer un repas orphelin (cooking/delivering) : RPC admin_release_meal ou procédure documentée.
- Optionnel : filtre par date sur les listes volunteer ; rappels admins (breakfast) et יולדת (confirmation).

### Références

- Détails cas limites : [docs/PHASE4_CAS_LIMITES.md](PHASE4_CAS_LIMITES.md).
- Détails simulation 200 users : [docs/PHASE5_SIMULATION_UTILISATEURS_REELS.md](PHASE5_SIMULATION_UTILISATEURS_REELS.md).

### Prochaines étapes recommandées

1. **Test réel du workflow** (section 6bis) : 1 yoledet, 1 cook, 1 deliverer, 1 admin ; parcours complet puis vérification `meals.status` et `meal_events`.
2. Ensuite seulement : audit final (sécurité, performance, UX, production).
