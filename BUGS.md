# BUGS & PROBLÈMES CONNUS — שפרה פועה

---

## 🔴 Critique — à corriger avant mise en production

### BUG-01 : Icônes PWA manquantes
**Fichiers :** `public/icon-192.png`, `public/icon-512.png`
**Impact :** L'app ne peut pas être installée sur Android sans ces icônes (Chrome affiche une erreur dans le manifest).
**Solution :** Créer ou exporter deux icônes PNG aux dimensions 192×192 et 512×512 px avec le logo de l'app.

### BUG-02 : Service Worker non enregistré automatiquement
**Fichier :** `public/sw.js`
**Impact :** Le SW est présent mais n'est pas enregistré par le code applicatif — l'app n'est pas réellement offline-capable.
**Solution :** Ajouter dans `app/layout.tsx` un script d'enregistrement :
```html
<script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
` }} />
```
Ou utiliser un Client Component dédié `app/ServiceWorkerRegister.tsx`.

### BUG-03 : next-pwa incompatible avec Next.js 16
**Impact :** `next-pwa` (dernière version 5.x) ne supporte pas Next.js 16 et crasherait au build.
**Décision :** Utilisation du manifest natif Next.js + SW manuel. Surveiller la sortie d'une version compatible.

---

## 🟡 Mineur — à corriger avant utilisation réelle

### BUG-04 : Pas d'authentification sur les webhooks
**Fichiers :** `app/api/webhooks/*/route.ts`
**Impact :** Les endpoints sont publics — n'importe qui peut lire les données si l'URL est connue.
**Solution :** Ajouter une vérification de token dans les headers :
```typescript
const token = req.headers.get('x-webhook-secret');
if (token !== process.env.WEBHOOK_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
Ajouter `WEBHOOK_SECRET` dans `.env.local` et configurer le même secret dans n8n.

### BUG-05 : test-login accessible en production
**Fichier :** `app/test-login/page.tsx`, `app/api/dev-login/route.ts`
**Impact :** La page de test crée un utilisateur admin avec un mot de passe connu — risque de sécurité.
**Solution :** L'API route vérifie déjà `NODE_ENV !== 'production'`, mais la page `/test-login` elle-même n'est pas bloquée. Ajouter une vérification similaire dans le composant page.

### BUG-06 : Pas de pagination sur les listes admin
**Fichiers :** `app/admin/registrations/page.tsx`, `app/admin/users/page.tsx`
**Impact :** Si le nombre d'utilisatrices dépasse ~100, les requêtes Supabase renverront 100 lignes max (limite par défaut) sans avertissement.
**Solution :** Ajouter `.range(0, 49)` + pagination ou scroll infini.

### BUG-07 : Pas de feedback visuel pendant les Server Actions
**Impact :** Quand une מבשלת clique "לקחתי על עצמי", il n'y a pas de spinner — l'utilisatrice peut cliquer plusieurs fois.
**Solution :** Convertir les boutons d'action en Client Components avec `useTransition` et état `pending`, comme `CreateMenuForm.tsx`.

### BUG-08 : start_date dans beneficiaries peut être antérieure à aujourd'hui
**Impact :** Si une יולדת s'inscrit et met `start_date` dans le passé, les repas passés sont créés avec `status = open` sans être jamais assignés.
**Solution :** Ajouter une validation côté serveur dans `signup/actions.ts` pour que `start_date >= aujourd'hui`, ou filtrer les repas passés lors de l'affichage.

---

## 🟢 Améliorations futures (non-bugs)

- **Notifications SMS** : intégrer Twilio/Vonage via n8n pour notifier les מתנדבות quand un repas est disponible.
- **Coordonnées GPS** : stocker `lat/lng` dans `users.address_lat` et `users.address_lng` pour des liens Waze plus précis.
- **Page profil** : permettre à chaque utilisatrice de modifier ses informations.
- **Vue calendrier admin** : afficher les repas dans un calendrier hebdomadaire.
- **Export CSV** : permettre à l'admin d'exporter les données des repas/utilisatrices.
