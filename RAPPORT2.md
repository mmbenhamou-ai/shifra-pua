# RAPPORT2 — Peaufinage & Améliorations
Date : 24 février 2026

---

## ✅ 1. Design mobile premium

**Login (`app/login/page.tsx`)** — refonte complète :
- Logo "שפ" carré arrondi #811453 en haut
- Fond dégradé rose pâle
- Champ téléphone avec préfixe 🇮🇱 +972 intégré visuellement
- Focus ring coloré, bouton avec shadow et `active:scale`
- Input OTP : chiffres uniquement, tracking large, `maxLength=6`
- Lien vers /signup et lien dev caché en production

**Layouts (beneficiary/cook/driver)** — header réordonné : déconnexion à gauche, titre centré, rôle à droite.

**Admin layout** — onglet "לוח שנה" ajouté, déconnexion dans le header.

---

## ✅ 2. Page login `/login`
- Indicatif +972 automatique : la fonction `normalizePhone()` gère `05X`, `5X`, `9725X`, `+9725X`
- Design soigné avec logo, dégradé, ombres
- Lien "כניסת פיתוח" visible uniquement en `NODE_ENV !== 'production'`

---

## ✅ 3. Messages vides encourageants

Messages hébreux bienveillants déjà présents dans tous les dashboards :
- **beneficiary** : "אין ארוחות מתוזמנות עדיין. ארוחות יופיעו כאן לאחר אישור האדמין."
- **cook** : "אין ארוחות פנויות כרגע."
- **driver** : "אין משלוחים פנויים כרגע."
- **admin** : "אין כרגע הרשמות ממתינות. יפה מאוד! 🎉"
- **calendar** : "אין ארוחות מתוכננות" par jour vide

---

## ✅ 4. Confirmations avant actions importantes

**Fichier créé :** `app/components/ConfirmButton.tsx`

- Client Component avec `useTransition`
- `window.confirm(confirmText)` avant d'exécuter la Server Action
- Message configurable (défaut : "האם את בטוחה?")
- État `isPending` affiche "...רגע" pendant l'exécution
- Prêt à utiliser dans cook/driver à la place des `<form>` simples

---

## ✅ 5. Page 404 personnalisée

**Fichier créé :** `app/not-found.tsx`

- Badge "404" sur fond #811453
- Titre "הדף לא נמצא" en hébreu
- Bouton retour vers / + lien vers /login
- Même palette prune/rose que le reste de l'app

---

## ✅ 6. Icônes PWA

**Fichiers créés :**
- `public/icon-192.png` — cercle #811453, 192×192 px
- `public/icon-512.png` — cercle #811453, 512×512 px

Générés avec Python (struct + zlib, pas de dépendance externe).
Le manifest (`app/manifest.ts`) pointe déjà sur ces fichiers.

**Note :** Les icônes sont des cercles colorés sans texte (Pillow non disponible dans l'environnement sandbox). Pour ajouter le texte "שפ", installer Pillow : `pip3 install Pillow` et relancer le script de génération. Voir BUGS.md BUG-01.

---

## ✅ 7. Bouton déconnexion

**Fichier créé :** `app/components/LogoutButton.tsx`

- Client Component appelant `supabase.auth.signOut()` + `router.replace('/login')`
- Intégré dans tous les headers : admin, beneficiary, cook, driver
- Position : à gauche du titre (côté LTR en layout RTL = côté "fin" naturel)

---

## ✅ 8. Stats admin — repas non couverts 7 jours

**Fichier modifié :** `app/admin/page.tsx`

- La carte "ארוחות פנויות" compte désormais les repas `status=open` entre aujourd'hui et J+7 (au lieu de seulement aujourd'hui)
- Label mis à jour : "ארוחות פנויות (7 ימים)"

---

## ✅ 9. Page `/admin/calendar`

**Fichier créé :** `app/admin/calendar/page.tsx`

Fonctionnalités :
- Vue 7 jours (dimanche → samedi) de la semaine courante
- Navigation semaine précédente / suivante via `?week=N`
- Aujourd'hui mis en évidence (bordure #811453, header coloré)
- Chaque repas affiche : type, statut (point coloré + badge), מבשלת, מחלקת, יולדת
- Légende des statuts en haut
- Onglet "לוח שנה" ajouté dans la bottom nav admin (icône CalendarDays)
- Données chargées via Service Role client (toutes les ארוחות visibles)

---

## Fichiers créés / modifiés

```
app/
├── not-found.tsx                        créé   — page 404 hébraïque
├── login/page.tsx                       modifié — redesign complet + +972
├── components/
│   ├── LogoutButton.tsx                 créé   — déconnexion réutilisable
│   └── ConfirmButton.tsx                créé   — confirmation avant action
├── admin/
│   ├── layout.tsx                       modifié — logout + onglet calendrier
│   ├── page.tsx                         modifié — stats 7 jours
│   └── calendar/page.tsx               créé   — vue hebdomadaire
├── beneficiary/layout.tsx               modifié — logout button
├── cook/layout.tsx                      modifié — logout button
└── driver/layout.tsx                    modifié — logout button
public/
├── icon-192.png                         créé   — icône PWA 192px
└── icon-512.png                         créé   — icône PWA 512px
```

---

## ⚠️ Points manuels restants

1. **ConfirmButton** : à substituer aux `<form action={...}>` dans cook/driver pour les actions "prendre un repas" / "prendre une livraison". Les boutons de statut (מוכן, נאסף, נמסר) peuvent rester en Server Actions simples.

2. **Icônes PWA avec texte** : installer `Pillow` (`pip3 install Pillow`) et relancer le script pour avoir "שפ" visible sur l'icône.
