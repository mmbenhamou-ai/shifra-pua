# Phase 5 — Simulation utilisateurs réels

Contexte : **200 utilisateurs** — 20 יולדות, 50 מבשלות, 50 מחלקות, 3 אדמין.

Objectif : identifier les **états incohérents**, les **repas bloqués**, les **erreurs de statut** et les **actions impossibles à terminer**, et lister tous les scénarios où **un meal ne peut plus progresser** dans le workflow.

---

## SECTION 1 — Scénarios problématiques

### 1.1 Repas restés en **open** (shabbat)

- **Contexte** : Beaucoup de repas shabbat en `open` ; 50 cooks mais répartition inégale (dates, géographie, charge).
- **Risque** : Certains repas ne sont jamais pris par une cook (date passée, peu visibles, ou trop de repas pour le nombre de volontaires actives).
- **Résultat** : Le meal **ne progresse jamais** tant qu’aucune cook ne clique « אני מבשלת ». Aucune contrainte métier ni RPC ne force la prise en charge.
- **À l’échelle** : Avec 20 יולדות et plusieurs repas par semaine, des dizaines de repas peuvent être en `open` ; une partie peut rester bloquée si l’affichage ou la date ne favorise pas la prise.

### 1.2 Repas breakfast restés en **open**

- **Contexte** : La יולדת crée un repas breakfast (RPC `yoledet_create_breakfast_meal`) → status `open`. Seul un **admin** peut le passer en `ready` (mark_ready).
- **Risque** : Avec **3 admins**, si personne ne consulte la file « מטבח בוקר » sur `/admin`, les repas breakfast restent indéfiniment en `open`.
- **Résultat** : Le meal **ne progresse pas** tant qu’un admin ne marque pas « מוכנה ». Aucune délégation ni alerte automatique.

### 1.3 Repas bloqués en **cooking**

- **Contexte** : Une cook a pris un repas (status `cooking`, `cook_id` renseigné). Elle ne marque jamais « מוכן » (oubli, indisponibilité, abandon).
- **Risque** : Sans action de la cook, le repas ne peut pas passer en `ready`. Les RPC `mark_ready` et `take_delivery` exigent respectivement un repas en `open`/`cooking` ou `ready` ; une autre cook ne peut pas « reprendre » le même repas (déjà `cook_id` non null).
- **Résultat** : Le meal **reste bloqué en cooking** tant que :
  - la cook ne marque pas ready, **ou**
  - la cook n’utilise pas « להחזיר » (release) pour le remettre en `open` — et aujourd’hui **aucun bouton « להחזיר » n’est exposé sur /volunteer** (seulement sur les pages legacy /cook qui redirigent).
- **À l’échelle** : Avec 50 cooks, plusieurs repas peuvent rester en `cooking` sans suite si les volontaires oublient ou ne voient pas le bouton d’abandon.

### 1.4 Repas bloqués en **ready**

- **Contexte** : Repas en `ready` (breakfast marqué par admin, ou shabbat marqué par la cook). Aucune deliverer ne le prend.
- **Risque** : Date passée, ou trop de repas ready en même temps, ou peu de deliverers connectées → personne ne clique « אני לוקחת לחלוקה ».
- **Résultat** : Le meal **ne progresse pas** vers `delivering`. Aucune contrainte ni réaffectation automatique.
- **À l’échelle** : Pics d’activité (plusieurs breakfasts + shabbat le même jour) peuvent laisser des repas en `ready` longtemps.

### 1.5 Repas bloqués en **delivering**

- **Contexte** : Une deliverer a pris un repas (status `delivering`, `deliverer_id` renseigné). Elle ne marque jamais « נמסר » (oubli, problème de livraison).
- **Risque** : Même logique qu’en cooking : seule cette deliverer (ou un admin) peut marquer `delivered` ; une autre ne peut pas prendre le même repas.
- **Résultat** : Le meal **reste bloqué en delivering** tant que la deliverer ne marque pas delivered ou n’utilise pas « להחזיר ». Le bouton « להחזיר » pour la livraison **n’est pas sur /volunteer** (seulement sur /driver qui redirige).
- **À l’échelle** : Avec 50 deliverers, des livraisons peuvent rester « en route » indéfiniment.

### 1.6 Repas bloqués en **delivered** (non confirmés)

- **Contexte** : Repas livré (status `delivered`). La יולדת ne clique jamais sur « אישרתי קבלה ».
- **Risque** : Pas de blocage pour les autres acteurs, mais le workflow métier n’est « terminé » qu’en `confirmed`. Les stats et le suivi peuvent compter des repas « livrés mais non confirmés ».
- **Résultat** : Le meal **ne passe jamais à confirmed** tant que la יולדת ne confirme pas. Pas d’action possible par une autre personne (RPC `confirm_received` exige `yoledet_id = auth.uid()`).

### 1.7 Cook ou deliverer **désapprouvée** en cours de route

- **Contexte** : Une cook a pris un repas (cooking). Un admin met son profil en `is_approved = false` (désinscription, abus, etc.).
- **Risque** : Les RPC `mark_ready`, `take_delivery`, `mark_delivered` vérifient `is_approved = true` pour le rôle concerné. La cook désapprouvée **ne peut plus appeler mark_ready**. Elle ne peut pas non plus « להחזיר » si elle n’a pas accès à /volunteer (getProfileOrRedirect redirige les non approuvées vers /pending).
- **Résultat** : Le meal **reste bloqué en cooking** avec un `cook_id` pointant vers une personne qui ne peut plus agir. Même chose pour une deliverer désapprouvée → repas bloqué en **delivering**.
- **À l’échelle** : Rare mais possible (modération, erreur admin).

### 1.8 Conflit admin / RPC (statuts et colonnes)

- **Contexte** : Certains chemins admin (ex. `updateMealStatus`, `assignCook`, `assignDriver`) utilisent des **noms de statuts ou colonnes différents** du schéma V1 (ex. `cook_assigned`, `driver_assigned`, `picked_up`, ou `driver_id` au lieu de `deliverer_id`). Le schéma réel est `open` → `cooking` → `ready` → `delivering` → `delivered` → `confirmed`.
- **Risque** : Si l’admin change le statut ou assigne cook/driver via ces actions, la base peut passer à des valeurs **qui n’existent pas** dans l’enum `meal_status` ou ne correspondent pas aux RPC (ex. `cook_assigned` au lieu de `cooking`). Les écrans volunteer et les RPC ne reconnaissent plus l’état → **repas inutilisable** (ni prise par une cook, ni marquage ready, etc.).
- **Résultat** : **État incohérent** : le meal a un statut ou une colonne que le reste de l’app ne gère pas → **impossible de le faire progresser** sans intervention SQL ou correction du code admin.

### 1.9 Table `users` / champs legacy dans les actions admin

- **Contexte** : Si des Server Actions admin (ex. `ensureAdmin`, ou des lectures pour les listes) interrogent encore la table **users** ou des champs **beneficiary_id**, **driver_id**, **type**, **menu_id** au lieu de **profiles**, **yoledet_id**, **deliverer_id**, **service_type**, **menu_item_id**, les requêtes peuvent échouer (table ou colonnes absentes) ou mélanger ancien/nouveau schéma.
- **Risque** : Erreurs au chargement de `/admin/meals`, échec des actions (assignation, changement de statut) → **impossibilité d’utiliser l’admin** pour débloquer un repas.
- **Résultat** : Blocage opérationnel côté admin plutôt que blocage d’un meal précis ; aggrave les cas 1.2, 1.7, 1.8.

---

## SECTION 2 — Blocages du workflow (synthèse)

| Statut du meal | Condition de blocage | Peut progresser si… |
|----------------|----------------------|----------------------|
| **open** (shabbat) | Aucune cook ne prend le repas | Une cook appelle take_cooking |
| **open** (breakfast) | Aucun admin ne marque ready | Un admin appelle mark_ready (breakfast) |
| **cooking** | La cook ne marque pas ready et ne libère pas | La cook marque ready, ou utilise release (pas d’UI sur /volunteer) |
| **ready** | Aucune deliverer ne prend le repas | Une deliverer appelle take_delivery |
| **delivering** | La deliverer ne marque pas delivered et ne libère pas | La deliverer marque delivered, ou utilise release (pas d’UI sur /volunteer) |
| **delivered** | La יולדת ne confirme pas | La יולדת appelle confirm_received |
| **cooking / delivering** (assignée désapprouvée) | Cook/deliverer désapprouvée ne peut plus agir ni accéder à /volunteer | Admin force le statut ou réaffecte (si l’admin utilise le bon schéma V1) |

**Scénarios où le meal ne peut plus progresser sans intervention :**

1. **open (shabbat)** : personne ne le prend → bloqué.
2. **open (breakfast)** : aucun admin ne marque ready → bloqué.
3. **cooking** : cook ne fait rien et pas de bouton « להחזיר » visible sur le flux principal → bloqué (sauf accès legacy /cook).
4. **ready** : aucune deliverer ne le prend → bloqué.
5. **delivering** : deliverer ne fait rien et pas de bouton « להחזיר » visible → bloqué (sauf accès legacy /driver).
6. **delivering / cooking** : assignée désapprouvée → plus personne ne peut avancer le repas sans admin (et sans incohérence de statut).
7. **Statut ou colonne incorrects** (admin legacy) → repas dans un état que les RPC et l’UI ne gèrent pas → bloqué jusqu’à correction données/code.

---

## SECTION 3 — Correctifs simples

### 3.1 Exposer « להחזיר » sur /volunteer (cooking et delivering)

- **Objectif** : Permettre à une cook ou une deliverer de rendre un repas sans dépendre des pages /cook ou /driver (qui redirigent).
- **Action** : Sur la page `/volunteer`, dans les blocs « ארוחות שבת שבחרת לבשל » et « משלוחים שאת מחלקת », ajouter un bouton « להחזיר » qui appelle `releaseMealAsCook(mealId)` ou `releaseMealAsDriver(mealId)` (déjà corrigées en V1 dans `app/actions/release.ts`).
- **Effet** : Réduit les blocages en **cooking** et **delivering** quand la volontaire abandonne ou ne peut pas terminer.

### 3.2 Admin : déblocage manuel d’un repas (cooking / delivering)

- **Objectif** : Permettre à un admin de remettre un repas en `open` ou `ready` quand la cook ou la deliverer assignée ne peut plus agir (désapprouvée, disparue).
- **Action** :  
  - Soit ajouter en base une **RPC** du type `admin_release_meal(meal_id)` (SECURITY DEFINER, réservée aux admins) qui met `status = 'open'`, `cook_id = null` si le repas est en `cooking`, ou `status = 'ready'`, `deliverer_id = null` si en `delivering`.  
  - Soit, si l’admin a déjà un moyen de faire des UPDATE directs sur `meals` (client service_role), documenter la procédure : mettre `cook_id = null`, `status = 'open'` pour un repas en cooking ; `deliverer_id = null`, `status = 'ready'` pour un repas en delivering.
- **Effet** : Déblocage des cas 1.7 et des repas « orphelins » en cooking/delivering.

### 3.3 Aligner toutes les actions admin sur le schéma V1

- **Objectif** : Éviter les états incohérents (statuts ou colonnes inexistants).
- **Action** :  
  - Remplacer toute référence à la table **users** par **profiles** (ex. `ensureAdmin` ou équivalent).  
  - Utiliser uniquement les statuts **open**, **cooking**, **ready**, **delivering**, **delivered**, **confirmed** dans `updateMealStatus` et dans les transitions (assignCook / assignDriver si conservés).  
  - Utiliser **deliverer_id** (et pas **driver_id**) partout.  
  - S’assurer que la création de repas admin passe par la RPC **create_meal** (yoledet_id, service_type, date, etc.) et non par un INSERT direct avec beneficiary_id/type.
- **Effet** : Évite les blocages de type 1.8 et 1.9 ; l’admin peut servir de filet de secours pour débloquer des repas.

### 3.4 Rappels ou file d’attente visible pour les admins (breakfast)

- **Objectif** : Réduire les repas breakfast restant en `open` par oubli.
- **Action** :  
  - Afficher sur `/admin` (ou dans une notification) le **nombre de repas breakfast en open** (déjà le cas dans la carte « מטבח בוקר »).  
  - Optionnel : notification (email/push) aux admins quand un nouveau repas breakfast est créé, pour inciter à marquer « מוכנה ».
- **Effet** : Limite les blocages 1.2.

### 3.5 Filtrage par date (optionnel) pour les listes « à prendre »

- **Objectif** : Éviter que des repas à date passée encombrent les listes « ארוחות שבת פתוחות » et « ארוחות מוכנות לחלוקה » et donnent l’impression qu’il y a beaucoup à faire alors qu’ils sont obsolètes.
- **Action** : Dans les requêtes volunteer qui construisent `openShabbatMeals` et `readyForDelivery`, ajouter un filtre `.gte('date', today)` (au sens date du jour). Les repas déjà assignés (myCookingMeals, myDeliveries) peuvent rester sans filtre pour que la volontaire voie ses tâches même si la date est passée.
- **Effet** : Meilleure lisibilité ; moins de risque de prise de repas « trop vieux » ; les repas vraiment anciens restent en base mais ne bloquent pas l’attention.

### 3.6 Rappel יולדת pour confirmation (optionnel)

- **Objectif** : Augmenter le taux de passage à **confirmed** après livraison.
- **Action** : Notification (push ou autre) à la יולדת quand un repas passe en `delivered`, avec un lien court vers `/yoledet` pour cliquer sur « אישרתי קבלה ».
- **Effet** : Réduit le nombre de repas restant en `delivered` sans confirmation.

---

## Résumé

- **Scénarios problématiques** : Repas bloqués en open (shabbat ou breakfast), cooking, ready, delivering, delivered ; cook/deliverer désapprouvée en cours de route ; incohérences admin (statuts/colonnes legacy).
- **Blocages du workflow** : Un meal ne peut plus progresser dès qu’aucun acteur autorisé n’effectue l’action suivante (prise, marquage ready, livraison, confirmation) ou ne peut plus agir (désapprobation), ou lorsque l’état en base est incohérent avec le schéma V1.
- **Correctifs simples prioritaires** : (1) Boutons « להחזיר » sur /volunteer pour cooking et delivering. (2) Aligner toutes les actions et écrans admin sur le schéma V1 (profiles, statuts, deliverer_id, create_meal). (3) Moyen admin pour remettre un repas en open/ready quand l’assignée est désapprouvée ou absente.
