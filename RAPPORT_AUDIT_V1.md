# RAPPORT D’AUDIT FONCTIONNEL V1 — SHIFRA & PUA

Ce rapport présente l'audit "Zéro Blocage" pour le lancement de la V1. L'objectif est de garantir un parcours utilisateur fluide de l'inscription à la confirmation de livraison.

## 1. Cartographie des Parcours

### Scénario A : Breakfast (Yoledet + Admin + Deliverer)
1. **Inscription Yoledet** : Création automatique du profil (`yoledet`, `is_approved=false`). Redirection vers `/pending`.
2. **Approbation Admin** : L'admin approuve le profil via `/admin`. Status : `is_approved=true`.
3. **Commande Breakfast** : La yoledet commande son petit-déjeuner sur `/yoledet`. Status repas : `open`.
4. **Préparation Kitchen** : L'admin (cuisine centrale) marque le repas comme prêt via `/admin`. Status repas : `ready`.
5. **Prise en charge Deliverer** : Un bénévole voit le repas sur `/volunteer`, le prend. Status repas : `delivering`.
6. **Livraison** : Le bénévole livre et marque comme fait sur `/volunteer`. Status repas : `delivered`.
7. **Confirmation** : La yoledet confirme la réception sur `/yoledet`. Status repas : `confirmed`.

### Scénario B : Shabbat (Admin + Cook + Deliverer + Yoledet)
1. **Activation Shabbat** : L'admin active `shabbat_enabled` pour une yoledet sur `/admin`.
2. **Création Repas** : L'admin crée un repas de type `shabbat` pour la yoledet (RPC `create_meal`). Status : `open`.
3. **Prise en charge Cook** : Un bénévole (`cook`) prend le repas pour cuisiner via `/volunteer`. Status : `cooking`.
4. **Prêt à l'envoi** : Le cook marque le repas comme prêt sur `/volunteer`. Status : `ready`.
5. **Livraison & Confirmation** : Identique au scénario A (Deliverer prend, livre, Yoledet confirme).

---

## 2. Top 15 Blocages Potentiels (Classés par Gravité)

| # | Niveau | Blocage | Cause Code / Fichier | Correctif Minimal |
|---|---|---|---|---|
| 1 | **CRITIQUE** | **Impossible de créer un repas Shabbat** | UI manquante dans `/app/admin/page.tsx` | Ajouter un formulaire "Créer un repas" appelant `create_meal`. |
| 2 | **CRITIQUE** | **Livreurs bloqués pour Shabbat** | RLS `Approved can see open meals` filtre par `shabbat_enabled` | Modifier la policy pour autoriser le rôle `deliverer` sans ce flag. |
| 3 | **IMPORTANT** | **Adresse de livraison "כתובת" (vide)** | `profiles.city` par défaut vide. `yoledet_create_breakfast_meal` fallback mediocre. | Forcer la saisie de la ville ou ajouter un champ `address` dans `create_meal`. |
| 4 | **IMPORTANT** | **Doublon Dashboard Yoledet** | `/app/beneficiary` et `/app/yoledet` coexistent. | Rediriger `/beneficiary` vers `/yoledet` pour éviter la confusion. |
| 5 | **IMPORTANT** | **Status Cook bloqué si non approuvé** | RPC `take_cooking` lève une exception stricte. | S'assurer que l'UI `/volunteer` n'affiche RIEN si `is_approved` est false. |
| 6 | **IMPORTANT** | **Lien WhatsApp incorrect** | Composant `TaskCard` ou `MealCard` peut avoir des formats de numéros mal gérés. | Normaliser les numéros de téléphone en DB (prefix +972). |
| 7 | **MOYEN** | **Redirection Post-Login infinie** | `middleware.ts` vs `app/page.tsx` redirection loop possible. | OK en l'état (vérifié), mais surveiller le cache session. |
| 8 | **MOYEN** | **Bouton Admin "Mark Ready" Breakfast** | Pas d'événement `actor_id` dans la première version. | Utiliser la version du RPC incluant `actor_id`. |
| 9 | **MOYEN** | **Annulation repas manquante** | Status `cancelled` non géré dans le workflow V1. | Ajouter une action Admin "Annuler" (minimal). |
| 10 | **MOYEN** | **Validation Date Breakfast** | On peut commander pour hier. | Ajouter une validation `p_date >= CURRENT_DATE` dans le RPC. |
| 11 | **BÉGNIN** | **Traduction Events** | `message_he` hardcodé en DB. | OK pour V1. |
| 12 | **BÉGNIN** | **Multiples rôles** | Un cook ne peut pas être deliverer en même temps (un seul rôle). | Utiliser une table de rôles ou enum multi-choix (Post-V1). |
| 13 | **BÉGNIN** | **Performance Dashboard Admin** | `Promise.all` on `getUserById` is slow. | Limiter aux 20 derniers ou utiliser un cache (Post-V1). |
| 14 | **BÉGNIN** | **UI Mobile Overlay** | Headers fixes peuvent masquer du contenu. | Ajouter `pb-20` aux containers (vérifié). |
| 15 | **BÉGNIN** | **Logo manquant** | Icones Lucide utilisées partout. | OK pour V1. |

---

## 3. Plan de Patch (2 PRs)

### PR #1 : Correctifs Critiques (Le "Zero Blocage")
- **DB** : Correction RLS `Approved can see open meals` pour Shabbat (autoriser Deliverers).
- **Admin** : Ajout du formulaire simple `CreateMealForm` dans `/admin`.
- **Yoledet** : Correction redirection `/beneficiary` -> `/yoledet`.
- **RPC** : Ajout de validation de date minimale dans `yoledet_create_breakfast_meal`.

### PR #2 : UX & Fiabilité
- **Profile** : Ajout d'un écran de complétion de profil (Phone, City) post-login.
- **Volunteer** : Amélioration des liens WhatsApp avec format international.
- **Admin** : Ajout d'une vue "Historique des repas" pour éviter de naviguer en DB.

---

## 4. Checklist de Tests Manuels (10 min)

1. [ ] **Signup** : Créer un compte, vérifier redirection vers `/pending`.
2. [ ] **Admin Approve** : Depuis l'admin, approuver le compte en `yoledet`.
3. [ ] **Order Breakfast** : Commander un repas pour demain sur `/yoledet`.
4. [ ] **Admin Ready** : Marquer le repas comme "Prêt" sur `/admin`.
5. [ ] **Deliverer Take** : Changer de compte (ou bypass), prendre la livraison sur `/volunteer`.
6. [ ] **Deliverer Done** : Marquer comme livré.
7. [ ] **Yoledet Confirm** : Confirmer la réception sur `/yoledet`.
8. [ ] **Shabbat Flow** : Admin crée un repas Shabbat -> Chef le prend -> Livreur le livre.
9. [ ] **WhatsApp** : Cliquer sur le bouton téléphone d'une tâche, vérifier l'ouverture du lien.
10. [ ] **Legacy** : Aller sur `/driver`, vérifier redirection vers `/volunteer`.
