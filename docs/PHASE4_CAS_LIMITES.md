# Phase 4 — Test des cas limites

Analyse de 7 scénarios edge case : comportement actuel, impact système, correction minimale.

---

## SECTION 1 — Edge cases analysés

### 1. Deux bénévoles prennent le même meal (course critique)

**Scénario** : Deux cooks cliquent « אני מבשלת » sur le même repas shabbat presque en même temps. Ou deux deliverers cliquent « אני לוקחת לחלוקה » sur le même repas ready.

**Ce qui se passe actuellement** :

- **take_cooking** : `SELECT ... FOR UPDATE` puis `UPDATE meals SET cook_id = auth.uid(), status = 'cooking' WHERE id = meal_id AND status = 'open' AND cook_id IS NULL`. Une seule requête réussit ; l’autre ne met à jour aucune ligne → `IF NOT FOUND THEN RAISE EXCEPTION 'Meal already taken or not open for cooking'`.
- **take_delivery** : même logique avec `status = 'ready'` et `deliverer_id IS NULL`.

**Conclusion** : La course est gérée en base (FOR UPDATE + condition dans le WHERE). Le second appel reçoit une erreur et l’UI peut afficher le message hébreu via `toHebrewRpcErrorMessage` (« המשימה כבר נתפסה על ידי מישהי אחרת »). **Ne casse pas le système.**

**Correction** : Aucune. Optionnel : s’assurer que le composant volunteer affiche bien l’erreur retournée par l’action (déjà le cas avec TaskCard + `res.error`).

---

### 2. Cook abandonne après avoir pris cooking

**Scénario** : Une cook a pris un repas (status = cooking, cook_id = elle). Elle veut annuler / rendre le repas.

**Ce qui se passe actuellement** :

- La page **/volunteer** (flux principal) **n’a pas de bouton « abandonner » ou « להחזיר »**. Seuls « אני מבשלת » et « מוכן » sont proposés.
- Les actions `releaseMealAsCook` et `releaseMealAsDriver` existent dans `app/actions/release.ts` et sont utilisées par les pages legacy **/cook** et **/driver** (qui redirigent vers /volunteer). De plus, elles ciblent des statuts **inexistants** dans le schéma V1 :
  - `releaseMealAsCook` : `.eq('status', 'cook_assigned')` alors que le schéma utilise **`cooking`**.
  - `releaseMealAsDriver` : `.eq('status', 'driver_assigned')` et colonne **`driver_id`** alors que le schéma utilise **`delivering`** et **`deliverer_id`**.

Donc même si on ajoutait un bouton sur /volunteer, les release actions **ne mettraient à jour aucune ligne** (0 row updated), et ne lèveraient pas d’erreur explicite côté app.

**Conclusion** : **Problème** : pas d’UI d’abandon sur le flux principal ; les actions de release sont **cassées** (mauvais statuts et mauvaise colonne).

**Correction minimale** :

1. **app/actions/release.ts** : aligner sur le schéma V1 :
   - `releaseMealAsCook` : `status = 'cooking'` (au lieu de `'cook_assigned'`), garder `cook_id`.
   - `releaseMealAsDriver` : `status = 'delivering'` (au lieu de `'driver_assigned'`), colonne `deliverer_id` (au lieu de `driver_id`). Mettre à jour `revalidatePath` vers `/volunteer` au lieu de `/driver`.
2. Optionnel : ajouter sur **/volunteer** un bouton « להחזיר » à côté de « מוכן » pour les repas en cooking (et équivalent pour les livraisons en delivering), qui appelle ces actions.

---

### 3. Deliverer annule livraison

**Scénario** : Une deliverer a pris un repas (status = delivering, deliverer_id = elle). Elle veut annuler.

**Ce qui se passe actuellement** : Même situation que le cas 2 : pas de bouton sur /volunteer ; `releaseMealAsDriver` existe mais utilise `driver_id` et `driver_assigned` → **aucune ligne mise à jour**.

**Conclusion** : **Problème** : même cause que cas 2 (release cassée + pas d’UI sur le flux principal).

**Correction minimale** : Celle du cas 2 (corriger **app/actions/release.ts** avec `deliverer_id` et `delivering`, et revalidatePath `/volunteer`). Puis, si souhaité, exposer un bouton « להחזיר » pour les livraisons en cours.

---

### 4. Yoledet non approuvée tente d’accéder au dashboard

**Scénario** : Une utilisatrice inscrite (profiles.is_approved = false, role = yoledet) essaie d’ouvrir **/yoledet** ou **/volunteer** ou **/admin**.

**Ce qui se passe actuellement** :

- Les pages protégées appellent `getProfileOrRedirect({ allowedRoles: [...] })` (lib/auth.ts).
- `getProfileOrRedirect` fait un `redirect('/pending')` si `!profile.is_approved` (avant même de tester les rôles).
- Donc toute tentative d’accès à /yoledet, /volunteer ou /admin par une personne non approuvée aboutit à une **redirection vers /pending**. Pas d’accès au dashboard, pas d’erreur 500.

**Conclusion** : **Ne casse pas le système.** Comportement attendu.

**Correction** : Aucune.

---

### 5. Meal date passée

**Scénario** : Un repas a une `date` dans le passé (ex. hier). Il est encore en status `open` ou `ready`. Un volontaire le prend.

**Ce qui se passe actuellement** :

- Les RPC **take_cooking**, **take_delivery**, **mark_ready**, etc. **ne vérifient pas la date** du repas.
- Les requêtes côté app (volunteer, admin, yoledet) **ne filtrent pas par date** (pas de `.gte('date', today)`). Donc les repas passés restent visibles dans « ארוחות שבת פתוחות », « ארוחות מוכנות לחלוקה », etc.
- Un volontaire peut donc prendre ou livrer un repas dont la date est passée. Les données restent cohérentes (pas de crash), mais le flux métier peut être discutable (repas « en retard »).

**Conclusion** : **Ne casse pas le système** au sens technique. Comportement métier à trancher (autoriser le rattrapage ou non).

**Correction minimale (optionnelle)** :

- **Côté affichage** : filtrer les repas « à prendre » par date ≥ aujourd’hui dans les requêtes volunteer (et éventuellement admin), ex. `.gte('date', new Date().toISOString().split('T')[0]`) pour `openShabbatMeals` et `readyForDelivery`. Les repas déjà assignés (myCookingMeals, myDeliveries) peuvent rester sans filtre de date pour que la cook/deliverer voie ses tâches en cours même si la date est passée.
- **Côté RPC (optionnel)** : ajouter en début de take_cooking / take_delivery un check `IF meal_record.date < CURRENT_DATE` puis RAISE EXCEPTION pour bloquer en base. À faire seulement si la règle métier est « on ne peut plus prendre un repas dont la date est passée ».

---

### 6. Cook prend un meal déjà ready

**Scénario** : Une cook clique « אני מבשלת » sur un repas qui est déjà en status **ready** (par ex. marqué ready par une autre ou par admin).

**Ce qui se passe actuellement** :

- La RPC **take_cooking** exige `meal_record.status = 'open'` et `meal_record.cook_id IS NULL`. Elle fait ensuite `UPDATE ... WHERE status = 'open' AND cook_id IS NULL`. Si le repas est déjà `ready`, l’UPDATE ne touche aucune ligne → `RAISE EXCEPTION 'Meal already taken or not open for cooking'`.
- Côté UI, un repas en status `ready` n’est pas listé dans « ארוחות שבת פתוחות לבישול » (la requête filtre `.eq('status', 'open')`). Donc en pratique la cook ne devrait pas voir ce repas dans la liste « prendre en cooking ». Si elle contournait l’UI (ex. ancien lien ou cache), la RPC bloque.

**Conclusion** : **Ne casse pas le système.** La RPC et les requêtes protègent correctement.

**Correction** : Aucune.

---

### 7. Deliverer prend un meal sans cook (breakfast)

**Scénario** : Repas **breakfast** : pas de cook (admin marque « מוכנה » depuis le dashboard). Une deliverer prend ce repas depuis « ארוחות מוכנות לחלוקה ».

**Ce qui se passe actuellement** :

- Pour les repas breakfast, le flux est : **open** → (admin appelle **mark_ready**) → **ready**. Aucune étape **cooking** / cook_id.
- La RPC **take_delivery** exige uniquement : `status = 'ready'` et `deliverer_id IS NULL`. Elle ne vérifie **pas** la présence d’un cook. Donc un repas breakfast (ready, cook_id = null) est tout à fait prenable par une deliverer.
- La liste « ארוחות מוכנות לחלוקה » est construite avec `.eq('status', 'ready').is('deliverer_id', null)` sans condition sur cook_id. Donc les breakfasts prêts apparaissent bien et peuvent être pris.

**Conclusion** : **Ne casse pas le système.** Comportement voulu pour les breakfasts (pas de cook, livraison directe après marquage admin).

**Correction** : Aucune.

---

## SECTION 2 — Problèmes détectés

| # | Problème | Sévérité | Fichier(s) |
|---|----------|----------|------------|
| 1 | **releaseMealAsCook** utilise `status = 'cook_assigned'` au lieu de `'cooking'` | Critique (action inopérante) | app/actions/release.ts |
| 2 | **releaseMealAsDriver** utilise `driver_id` et `status = 'driver_assigned'` au lieu de `deliverer_id` et `'delivering'` | Critique (action inopérante) | app/actions/release.ts |
| 3 | Pas d’UI « abandonner / להחזיר » sur /volunteer pour cooking et delivering | Important (UX) | app/volunteer/page.tsx, composants |
| 4 | Repas à date passée affichés et prenables sans filtre | Mineur (métier) | Requêtes volunteer (et optionnel RPC) |

Les cas 1 et 2 **cassent** les actions de release si on les appelle (ex. depuis des pages legacy ou un futur bouton). Les cas 3 et 4 n’empêchent pas le système de tourner mais limitent l’usage ou la clarté métier.

---

## SECTION 3 — Corrections recommandées

### Correction 1 et 2 — Aligner release.ts sur le schéma V1 (obligatoire)

**Fichier** : `app/actions/release.ts`

- **releaseMealAsCook** :
  - Remplacer `.eq('status', 'cook_assigned')` par `.eq('status', 'cooking')`.
  - Garder `.eq('cook_id', session.user.id)`.
  - Remplacer `revalidatePath('/cook')` par `revalidatePath('/volunteer')`.
- **releaseMealAsDriver** :
  - Remplacer `.eq('status', 'driver_assigned')` par `.eq('status', 'delivering')`.
  - Remplacer `.eq('driver_id', session.user.id)` par `.eq('deliverer_id', session.user.id)`.
  - Remplacer `.update({ ..., driver_id: null })` par `.update({ status: 'ready', deliverer_id: null })`.
  - Remplacer `revalidatePath('/driver')` par `revalidatePath('/volunteer')`.

**Pourquoi** : Le schéma V1 (meal_status) utilise `open`, `cooking`, `ready`, `delivering`, `delivered`, `confirmed` et la colonne livraison est `deliverer_id`. Sans ces changements, les UPDATE ne ciblent aucune ligne et l’abandon ne fonctionne pas.

### Correction 3 — Boutons « להחזיר » sur /volunteer (optionnel)

- Dans la section « ארוחות שבת שבחרת לבשל », ajouter un bouton « להחזיר » qui appelle `releaseMealAsCook(meal.id)` (avec gestion d’erreur comme les autres actions).
- Dans la section « משלוחים שאת מחלקת », ajouter un bouton « להחזיר » qui appelle `releaseMealAsDriver(meal.id)`.
- Exposer les deux actions depuis la page (elles existent déjà dans app/actions/release.ts une fois corrigées).

### Correction 4 — Filtrer les repas par date (optionnel)

- Dans **getVolunteerData** (app/volunteer/page.tsx), pour les requêtes `openShabbatMeals` et `readyForDelivery`, ajouter un filtre `.gte('date', new Date().toISOString().split('T')[0])` si la règle métier est de ne plus proposer les repas dont la date est passée. Ne pas filtrer `myCookingMeals` et `myDeliveries` pour garder la visibilité des tâches en cours.

---

## Résumé

| Cas limite | Casse le système ? | Action |
|------------|--------------------|--------|
| 1. Deux bénévoles même meal | Non | Aucune |
| 2. Cook abandonne | Oui (actions release cassées) | Corriger release.ts + optionnel UI |
| 3. Deliverer annule | Oui (même cause) | Corriger release.ts + optionnel UI |
| 4. Yoledet non approuvée | Non | Aucune |
| 5. Meal date passée | Non | Optionnel : filtre date + RPC |
| 6. Cook prend meal déjà ready | Non | Aucune |
| 7. Deliverer prend meal sans cook | Non | Aucune |

**Correction minimale prioritaire** : appliquer les modifications dans **app/actions/release.ts** (statuts et colonnes V1 + revalidatePath) pour que l’abandon cooking/delivery soit fonctionnel dès qu’une UI l’appellera.
