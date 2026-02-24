# RAPPORT DE DÉVELOPPEMENT — שפרה פועה

Date : 24 février 2026

---

## ✅ Points 1–3 : Génération des repas + Dashboards + Server Actions

### Génération automatique des repas (approveUser)

**Fichier :** `app/admin/actions/registrations.ts`

- `approved = true` est positionné via le Service Role client (bypass RLS)
- Si l'utilisatrice a `role = beneficiary`, la logique de génération s'exécute
- Si l'enregistrement `beneficiaries` est manquant → il est créé automatiquement (`start_date = aujourd'hui`, `num_breakfast_days = 14`, `num_shabbat_weeks = 2`)
- Si `start_date` est NULL → il est mis à jour à aujourd'hui en base
- Les menus actifs sont récupérés par type (`breakfast`, `shabbat_friday`, `shabbat_saturday`)
- Les repas sont générés uniquement pour les types ayant un menu actif
- Tous les repas sont insérés avec `status = open`
- Après approbation : `redirect('/admin/registrations')` force un rechargement propre

### Dashboards connectés à Supabase

**`app/beneficiary/page.tsx`**
- Récupère les repas de la יולדת connectée via `beneficiary_id`
- Affiche le statut coloré pour chaque repas
- Bouton "אישור קבלה ✓" uniquement sur les repas `status = delivered`

**`app/cook/page.tsx`**
- Section "הארוחות שלי" : repas `cook_assigned` ou `ready` avec tפריט complet
- Section "ארוחות פנויות לבישול" : repas `open` du jour et suivants

**`app/driver/page.tsx`**
- Section "המסירות שלי" : livraisons `driver_assigned` ou `picked_up` avec adresses מבשלת + יולדת, téléphone cliquable
- Section "משלוחים פנויים" : repas `cook_assigned` ou `ready` disponibles
- Boutons de navigation Waze + Google Maps sur chaque adresse de יולדת (via `NavButtons.tsx`)

### Server Actions

**Fichier :** `app/actions/meals.ts`

| Action | Transition |
|--------|-----------|
| `confirmMealReceived` | `delivered` → `confirmed` |
| `takeMeal` | `open` → `cook_assigned` + `cook_id = user.id` |
| `markMealReady` | `cook_assigned` → `ready` |
| `takeDelivery` | `cook_assigned\|ready` → `driver_assigned` + `driver_id = user.id` |
| `markPickedUp` | `driver_assigned` → `picked_up` |
| `markDelivered` | `picked_up` → `delivered` |

Toutes les actions utilisent le Service Role client et appellent `revalidatePath` après mise à jour.

---

## ✅ Point 4 : Webhooks API pour n8n

**Dossier :** `app/api/webhooks/`

| Route | Usage |
|-------|-------|
| `GET /api/webhooks/new-registration` | Liste des nouvelles inscriptions, filtrables par `?since=<ISO_DATE>` |
| `GET /api/webhooks/registration-approved` | Utilisatrices approuvées, filtrables par `?since=<ISO_DATE>` |
| `GET /api/webhooks/meal-taken` | Repas avec `status = cook_assigned` |
| `GET /api/webhooks/meal-ready` | Repas avec `status = ready` (prêts à être livrés) |
| `GET /api/webhooks/meal-delivered` | Repas avec `status = delivered` |

Chaque route accepte aussi `POST` pour recevoir des callbacks Supabase DB webhooks.
Toutes utilisent le Service Role client (lecture sans RLS).

---

## ✅ Point 5 : PWA — app installable sur Android

**Fichiers créés/modifiés :**

- `app/manifest.ts` — manifest Next.js natif avec nom, couleurs, icônes, `start_url = /login`, `display = standalone`
- `app/layout.tsx` — metadata complète : `manifest`, `appleWebApp`, `themeColor`, viewport sans zoom (`userScalable: false`)
- `public/sw.js` — service worker minimal : cache de la page `/login` pour offline, nettoyage des anciens caches

**Note :** Next.js 16 supporte le manifest nativement via `app/manifest.ts`. `next-pwa` n'est pas nécessaire et serait incompatible avec Next.js 16 (voir BUGS.md).

Pour finaliser l'installation PWA, ajouter les icônes :
- `public/icon-192.png` (192×192 px)
- `public/icon-512.png` (512×512 px)

---

## ✅ Point 6 : Protection des routes

Toutes les pages sont protégées via leurs layouts :

| Layout | Vérification |
|--------|-------------|
| `app/admin/layout.tsx` | Session + `role = admin` |
| `app/beneficiary/layout.tsx` | Session + `role = beneficiary` + `approved = true` |
| `app/cook/layout.tsx` | Session + `role = cook` + `approved = true` |
| `app/driver/layout.tsx` | Session + `role = driver` + `approved = true` |

**`app/page.tsx`** (accueil) redirige automatiquement :
- Non connecté → `/login`
- Connecté sans profil → `/signup`
- Connecté non approuvé → `/signup/pending`
- Connecté approuvé → dashboard selon rôle (`/admin`, `/beneficiary`, `/cook`, `/driver`)

---

## ✅ Point 7 : Design mobile

- Tous les boutons d'action : `min-h-[48px]` (cible tactile Android recommandée)
- Couleur principale `#811453` (prune) sur tous les boutons primaires
- Navigation admin : bottom navigation bar fixe avec icônes lucide-react
- Texte : `text-zinc-900` / `text-zinc-800` sur fond clair, contrastes WCAG AA
- Layout `dir="rtl"` sur toutes les pages
- `app/layout.tsx` : `viewport` avec `userScalable: false` pour éviter le zoom involontaire
- Boutons Waze/Google Maps : `min-h-[40px]`, style coloré distinctif

---

## Fichiers créés ou modifiés

```
app/
├── layout.tsx                          modifié — metadata PWA, viewport, lang=he
├── manifest.ts                         créé   — PWA manifest
├── page.tsx                            modifié — redirect intelligent selon rôle
├── actions/
│   └── meals.ts                        créé   — 6 Server Actions statuts repas
├── admin/
│   ├── layout.tsx                      modifié — vérification role=admin
│   ├── page.tsx                        modifié — données réelles Supabase
│   ├── registrations/page.tsx          modifié — données réelles
│   ├── menus/
│   │   ├── page.tsx                    modifié — Server Component pur
│   │   └── CreateMenuForm.tsx          créé   — Client Component (fix hydration)
│   ├── users/page.tsx                  modifié — données réelles
│   └── actions/
│       ├── registrations.ts            modifié — génération repas + redirect
│       └── menus.ts                    modifié — Service Role client
├── beneficiary/
│   ├── layout.tsx                      modifié — vérification rôle + approved
│   └── page.tsx                        modifié — données réelles Supabase
├── cook/
│   ├── layout.tsx                      modifié — vérification rôle + approved
│   └── page.tsx                        modifié — données réelles Supabase
├── driver/
│   ├── layout.tsx                      modifié — vérification rôle + approved
│   ├── page.tsx                        modifié — données réelles + NavButtons
│   └── NavButtons.tsx                  créé   — boutons Waze / Google Maps
├── signup/
│   ├── page.tsx                        modifié — champ start_date
│   └── actions.ts                      modifié — sauvegarde start_date
└── api/
    ├── dev-login/route.ts              créé   — login dev email/password
    └── webhooks/
        ├── new-registration/route.ts   créé
        ├── registration-approved/route.ts créé
        ├── meal-taken/route.ts         créé
        ├── meal-ready/route.ts         créé
        └── meal-delivered/route.ts     créé
public/
└── sw.js                               créé   — service worker offline
```
