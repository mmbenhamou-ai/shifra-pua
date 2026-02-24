# BUGS & PROBLÈMES CONNUS — שפרה פועה

---

## ✅ Corrigés

### BUG-01 : Icônes PWA ✅ CORRIGÉ (RAPPORT2)
`public/icon-192.png` et `public/icon-512.png` générés avec Python.
Note : icônes sans texte (Pillow non disponible). Remplacer manuellement par des icônes de qualité.

### BUG-02 : Service Worker non enregistré ✅ CORRIGÉ (RAPPORT4)
`app/components/ServiceWorkerRegister.tsx` créé et intégré dans `app/layout.tsx`.
Le SW s'enregistre automatiquement au chargement de l'app.

### BUG-04 : Pas d'authentification sur les webhooks ✅ CORRIGÉ (RAPPORT4)
`app/api/webhooks/_auth.ts` créé avec `checkWebhookAuth()`.
Tous les webhooks vérifient `x-webhook-secret` ou `?secret=` contre `process.env.WEBHOOK_SECRET`.
Si `WEBHOOK_SECRET` n'est pas défini (dev), la vérification est ignorée.

### BUG-05 : test-login accessible en production ✅ CORRIGÉ (RAPPORT4)
`app/test-login/page.tsx` : affiche un message d'erreur si `NODE_ENV === 'production'`.

### BUG-07 : Pas de feedback visuel pendant les Server Actions ✅ CORRIGÉ (RAPPORT3)
Tous les boutons d'action dans cook/driver/beneficiary utilisent `useTransition` avec état `isPending`.

---

## 🔴 Critique — à corriger avant mise en production

### BUG-03 : next-pwa incompatible avec Next.js 16
**Impact :** `next-pwa` (5.x) ne supporte pas Next.js 16.
**Décision :** Manifest natif + SW manuel. Aucune action requise.

---

## 🟡 Mineur — à corriger si nécessaire

### BUG-06 : Pas de pagination sur les listes admin
**Fichiers :** `app/admin/registrations/page.tsx`, `app/admin/users/page.tsx`
**Impact :** Limite Supabase à 100 lignes par défaut.
**Solution :** Ajouter `.range(0, 49)` + boutons de pagination.

### BUG-08 : start_date dans beneficiaries peut être antérieure à aujourd'hui
**Impact :** Repas passés créés avec status=open inutiles.
**Solution :** Validation dans `signup/actions.ts` : `start_date >= today`.

---

## 🟢 Améliorations futures

- **Notifications SMS** : intégrer Twilio/Vonage via n8n.
- **Coordonnées GPS** : `users.address_lat` / `users.address_lng` pour Waze précis.
- **Icônes PWA de qualité** : remplacer les icônes générées par un vrai design.
- **Export CSV** : exporter les données des repas/utilisatrices.
- **Pagination admin** : BUG-06 ci-dessus.
