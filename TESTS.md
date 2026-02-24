# TESTS.md — Scénarios de test manuels — שפרה פועה

## Avant de lancer en production, valider tous les scénarios ci-dessous.

---

## 1. Authentification

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| A1 | Ouvrir `/login` sans être connectée | Page login s'affiche avec logo שפרה פועה |
| A2 | Entrer un numéro invalide (ex: 123) | OTP refusé, message d'erreur clair |
| A3 | Entrer `050-1234567` → recevoir OTP | Redirection vers dashboard selon rôle |
| A4 | OTP expiré (>5 min) | Message d'erreur "קוד פג תוקף" |
| A5 | Aller sur `/admin` sans session | Redirection vers `/login` |
| A6 | Aller sur `/beneficiary` avec rôle `cook` | Redirection vers `/cook` |
| A7 | Session expirée → cliquer un bouton | Middleware redirige vers `/login` |
| A8 | `/test-login` en production | Affiche "דף זה אינו זמין בסביבת ייצור" |

---

## 2. Inscription

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| B1 | Cliquer "הרשמה" | Formulaire en 2 étapes s'affiche |
| B2 | Soumettre formulaire sans nom | Erreur "שם מלא הוא שדה חובה" |
| B3 | Numéro invalide (ex: 0123456) | Erreur "מספר טלפון ישראלי תקין" |
| B4 | Numéro valide (050-1234567) | Indicateur vert "✓ מספר תקין" |
| B5 | יולדת sans adresse | Erreur "כתובת מגורים היא שדה חובה" |
| B6 | יולדת sans start_date | Erreur "תאריך התחלה הוא שדה חובה" |
| B7 | Inscription complète | Redirection vers `/signup/pending` |
| B8 | Inscription dupliquée (même user) | Upsert sans erreur |

---

## 3. Flux Admin — Approbation

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| C1 | Admin voit nouvelle inscription dans `/admin/registrations` | Carte avec nom, téléphone, rôle |
| C2 | Admin approuve une יולדת | Repas générés automatiquement dans `meals` |
| C3 | Admin approuve יולדת sans start_date | start_date = aujourd'hui, repas générés |
| C4 | Admin rejette une inscription | Utilisatrice supprimée de la liste |
| C5 | Après approbation, page se rafraîchit | Utilisatrice disparaît des "en attente" |
| C6 | Générer repas : type breakfast | N repas avec type=breakfast, status=open |
| C7 | Générer repas : type shabbat | Repas shabbat_friday + shabbat_saturday |

---

## 4. Flux יולדת (bénéficiaire)

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| D1 | Se connecter comme יולדת approuvée | Dashboard avec liste des repas |
| D2 | Repas avec status=open | Affiché comme "ממתינה למבשלת" |
| D3 | Repas avec status=delivered | Bouton "התקבל" visible |
| D4 | Cliquer "התקבל" | Confirmation demandée, puis status=confirmed |
| D5 | Compte à rebours | Affiche "עוד X ימים של ארוחות" si end_date défini |
| D6 | end_date passé | Message "שירות הארוחות הסתיים 🎉" |
| D7 | Modifier profil `/profile` | Nom/téléphone/adresse mis à jour |

---

## 5. Flux מבשלת (cuisinière)

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| E1 | Se connecter comme מבשלת approuvée | Dashboard avec ארוחות פנויות |
| E2 | Cliquer "לקחת ארוחה" | Confirmation, puis status=cook_assigned |
| E3 | Repas apparu dans "הארוחות שלי" | Menu et adresse יולדת visibles |
| E4 | Cliquer "מוכן לאיסוף" | Confirmation, status=ready |
| E5 | Repas disparaît de "הארוחות שלי" après ready | Uniquement si status != cook_assigned |
| E6 | Rendre un repas | status revient à open, cook_id = null |
| E7 | Historique `/cook/history` | Liste des repas préparés passés |

---

## 6. Flux מחלקת (livreur)

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| F1 | Se connecter comme מחלקת approuvée | Dashboard avec משלוחים זמינים |
| F2 | Cliquer "לקחת משלוח" | Confirmation, status=driver_assigned |
| F3 | Cliquer "נאסף" | Confirmation, status=picked_up |
| F4 | Cliquer "נמסר" | Confirmation, status=delivered |
| F5 | Boutons Waze et Google Maps | S'ouvrent dans nouvel onglet avec adresse |
| F6 | Téléphone cliquable | Ouvre l'app téléphone |
| F7 | Historique `/driver/history` | Liste des livraisons passées |

---

## 7. Admin — Gestion des repas

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| G1 | `/admin/meals` | Liste tous les repas avec filtres |
| G2 | Filtrer par statut "open" | Uniquement repas ouverts |
| G3 | Filtrer par date | Repas de cette date uniquement |
| G4 | Changer statut via dropdown | Status mis à jour immédiatement |
| G5 | Assigner une מבשלת | cook_id mis à jour |
| G6 | Assigner une מחלקת | driver_id mis à jour |
| G7 | Supprimer un repas | Confirmation, repas supprimé |
| G8 | Créer repas manuel | Repas apparaît avec status=open |

---

## 8. Admin — Menus

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| H1 | Créer menu avec 3 plats | Menu créé, actif par défaut |
| H2 | Désactiver un menu | badge "לא פעיל", ignoré lors de génération |
| H3 | Flèches ↑↓ sur les plats | Ordre des plats modifié |
| H4 | Ajouter un plat | Plat ajouté en fin de liste |
| H5 | Supprimer un plat | Confirmation, plat retiré |
| H6 | Supprimer le menu | Confirmation, menu supprimé |

---

## 9. Notifications

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| I1 | Cloche 🔔 dans header | Visible sur tous les dashboards |
| I2 | Badge rouge avec compteur | Affiché si notifications non lues |
| I3 | Ouvrir le panneau | Liste des dernières 20 notifications |
| I4 | Toutes marquées comme lues | Badge disparaît |
| I5 | Nouvelle notif en temps réel | Badge incrémenté sans rechargement |

---

## 10. PWA

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| J1 | Ouvrir dans Chrome Android | Bannière "Ajouter à l'écran d'accueil" |
| J2 | Installer l'app | Icône שפ apparaît sur l'écran |
| J3 | Ouvrir app installée | Lancée en mode standalone (sans barre URL) |
| J4 | Mode hors-ligne | Page `/login` accessible depuis cache SW |
| J5 | Mettre à jour l'app | Service Worker se met à jour |

---

## 11. Webhooks

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| K1 | GET `/api/webhooks/new-registration` sans secret | 401 Unauthorized |
| K2 | GET avec `?secret=WEBHOOK_SECRET` | 200 avec données |
| K3 | POST avec `x-webhook-secret` correct | Traité sans erreur |
| K4 | Nouvelle inscription → webhook n8n | n8n reçoit payload |

---

## 12. Sécurité

| # | Scénario | Résultat attendu |
|---|---------|-----------------|
| L1 | Accéder à `/admin` sans être admin | Redirection vers `/` |
| L2 | Appel direct API avec fausse session | Erreur 401/403 |
| L3 | Injections SQL dans les formulaires | Paramétré par Supabase — protégé |
| L4 | HTTPS en production | Certificat SSL valide |

---

## Check-list déploiement

- [ ] Variables `.env.local` toutes définies (voir `.env.example`)
- [ ] `npm run build` sans erreurs
- [ ] Base de données Supabase : tables `users`, `beneficiaries`, `meals`, `menus`, `notifications_log`
- [ ] RLS activé sur toutes les tables
- [ ] Service Role Key sécurisée (non exposée côté client)
- [ ] `WEBHOOK_SECRET` défini en production
- [ ] Icônes PWA replacées par de vraies icônes design
- [ ] Test sur iPhone et Android
- [ ] Test avec un vrai numéro de téléphone israélien
