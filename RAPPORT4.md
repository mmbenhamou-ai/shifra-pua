# RAPPORT4 — Profil, Sécurité, Middleware, Alertes
Date : 24 février 2026

---

## ✅ 1. Page profil `/profile`

**Fichiers créés :**
- `app/profile/page.tsx` — Server Component, charge les données de l'utilisatrice connectée
- `app/profile/ProfileForm.tsx` — Client Component avec `useTransition`, feedback success/error
- `app/profile/actions.ts` — Server Action `updateProfile` (Service Role client)

**Champs modifiables :** שם מלא, מספר טלפון, כתובת, שכונה  
**Accès :** lien 👤 dans le header de chaque dashboard (beneficiary/cook/driver)  
**Retour :** bouton "← חזרה" vers le dashboard selon le rôle  
**Sécurité :** vérifie la session avant toute écriture

---

## ✅ 2. Déploiement Vercel

**Fichiers créés :**
- `vercel.json` — framework nextjs, région cdg1 (Paris), headers Cache-Control pour SW et manifest
- `.env.example` — template avec toutes les variables requises (sans valeurs)

**Variables nécessaires pour Vercel :**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WEBHOOK_SECRET
```

**Pour déployer :**
1. `git push origin main`
2. Connecter le repo sur vercel.com
3. Ajouter les variables d'environnement
4. Deploy

---

## ✅ 3. Admin Calendar — noms מבשלות/מחלקות

La page `/admin/calendar` affichait déjà les noms (depuis la création). Confirmé fonctionnel :
- Chaque repas affiche : type, statut, nom מבשלת (🍲), nom מחלקת (🚗), nom יולדת
- Code couleur par statut avec point coloré

---

## ✅ 4. Alerte rouge — repas non couverts 24h

**Fichier modifié :** `app/admin/page.tsx`

- Requête supplémentaire : repas `status=open` entre aujourd'hui et J+1
- Bloc d'alerte rouge affiché au-dessus des stats si `urgent.length > 0`
- Affiche chaque repas urgent avec date, type, nom יולדת
- Bouton rouge "שלחי הודעה למתנדבות →" vers `/admin/registrations`
- Disparaît automatiquement si aucun repas urgent

---

## ✅ 5. Dashboard מבשלת — menu complet amélioré

**Fichier modifié :** `app/cook/page.tsx`

- Redesign du bloc menu : header avec nom + compteur de mנות
- Chaque plat numéroté (1., 2., ...)
- Fond #FFF7FB, bordure rose, texte `text-sm` (plus lisible qu'avant)

---

## ✅ 6. Corrections BUGS.md

| Bug | Statut |
|-----|--------|
| BUG-01 Icônes PWA | ✅ Corrigé RAPPORT2 |
| BUG-02 SW non enregistré | ✅ Corrigé RAPPORT4 |
| BUG-03 next-pwa incompatible | N/A — solution alternative en place |
| BUG-04 Webhooks non sécurisés | ✅ Corrigé RAPPORT4 |
| BUG-05 test-login en prod | ✅ Corrigé RAPPORT4 |
| BUG-06 Pas de pagination | 🟡 Reste à faire |
| BUG-07 Pas de feedback | ✅ Corrigé RAPPORT3 |
| BUG-08 start_date passée | 🟡 Reste à faire |

---

## ✅ 7. Middleware Next.js

**Fichier créé :** `middleware.ts`

- Protège toutes les routes sous `/admin`, `/beneficiary`, `/cook`, `/driver`, `/profile`
- Utilise `createServerClient` de `@supabase/ssr` avec les cookies de la requête
- Si session expirée → redirect vers `/login?redirectTo=<pathname>`
- Ignore : routes publiques (`/login`, `/signup`, `/test-login`), assets (`/_next`, fichiers avec extension), webhooks
- `config.matcher` exclus `_next/static`, `_next/image`, `favicon.ico`, icônes, SW, manifest

---

## ✅ BUG-02 : Service Worker enregistré

**Fichier créé :** `app/components/ServiceWorkerRegister.tsx`
- Client Component avec `useEffect` qui appelle `navigator.serviceWorker.register('/sw.js')`
- Intégré dans `app/layout.tsx` — actif sur toutes les pages
- PWA maintenant réellement installable et offline-capable

---

## ✅ BUG-04 : Webhooks sécurisés

**Fichier créé :** `app/api/webhooks/_auth.ts`
- `checkWebhookAuth()` vérifie `x-webhook-secret` header ou `?secret=` query param
- Si `WEBHOOK_SECRET` n'est pas défini → pas de vérification (mode dev)
- Tous les 5 webhooks GET appellent ce helper en première ligne

---

## ✅ BUG-05 : test-login bloqué en production

`app/test-login/page.tsx` : renvoie un message d'erreur si `NODE_ENV === 'production'`.

---

## Fichiers créés / modifiés

```
app/
├── layout.tsx                           modifié — ServiceWorkerRegister intégré
├── profile/
│   ├── page.tsx                         créé   — page profil Server Component
│   ├── ProfileForm.tsx                  créé   — formulaire Client Component
│   └── actions.ts                       créé   — Server Action updateProfile
├── admin/page.tsx                       modifié — alerte 24h + query urgentMeals
├── cook/
│   ├── layout.tsx                       modifié — lien 👤 profil
│   └── page.tsx                         modifié — menu complet redesigné
├── beneficiary/layout.tsx               modifié — lien 👤 profil
├── driver/layout.tsx                    modifié — lien 👤 profil
├── test-login/page.tsx                  modifié — bloqué en production
├── components/
│   └── ServiceWorkerRegister.tsx        créé   — enregistrement SW
└── api/webhooks/
    ├── _auth.ts                         créé   — helper auth webhook
    ├── new-registration/route.ts        modifié — auth check
    ├── registration-approved/route.ts   modifié — auth check
    ├── meal-taken/route.ts              modifié — auth check
    ├── meal-ready/route.ts              modifié — auth check
    └── meal-delivered/route.ts         modifié — auth check
middleware.ts                            créé   — protection globale des routes
vercel.json                              créé   — config déploiement
.env.example                             créé   — template variables d'environnement
BUGS.md                                  modifié — bugs corrigés marqués ✅
```
