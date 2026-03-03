# AUDIT_BUGS.md — שפרה ופועה
> Audit technique complet — 27 février 2026
> Légende : 🔴 Critique | 🟡 Important | 🟢 Mineur

---

## SÉCURITÉ

---

### BUG-S01 🔴 — Service Role Key exposable côté client
**Fichier :** `lib/supabase-admin.ts`
**Description :** Le client admin (qui bypass RLS avec `SUPABASE_SERVICE_ROLE_KEY`) n'a aucune protection runtime contre une importation accidentelle dans un Client Component. Si un développeur importe `createAdminClient()` dans un fichier marqué `'use client'`, la clé serait exposée dans le bundle JS envoyé au navigateur.

**Correction exacte :**
```typescript
// lib/supabase-admin.ts — ajouter en tête de fichier
import { headers } from 'next/headers';

export function createAdminClient() {
  // Guard: empêche l'utilisation côté client
  if (typeof window !== 'undefined') {
    throw new Error(
      '[SECURITY] createAdminClient() ne peut être appelé que côté serveur. ' +
      'Vérifie que ton fichier n\'est pas marqué "use client".'
    );
  }
  // ... reste du code existant
}
```

---

### BUG-S02 🔴 — Rôle mis en cache dans le cookie pendant 7 jours sans invalidation
**Fichier :** `middleware.ts`
**Description :** Le rôle de l'utilisateur est mis en cache dans un cookie avec `maxAge: 60 * 60 * 24 * 7` (7 jours). Si un admin change le rôle d'un utilisateur (ex: de `cook` à `driver`), l'utilisateur garde ses anciens accès pendant 7 jours sans se déconnecter.

**Correction exacte :**
Dans `middleware.ts`, réduire le maxAge du cookie de rôle à 1 heure maximum :
```typescript
// Changer :
response.cookies.set('user_role', userRole, { maxAge: 60 * 60 * 24 * 7 });
// Par :
response.cookies.set('user_role', userRole, {
  maxAge: 60 * 60, // 1 heure max
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});
```
Et dans `app/admin/users/UserActions.tsx` (action de changement de rôle), appeler une API route qui invalide le cookie :
```typescript
// app/api/admin/invalidate-role-cache/route.ts
export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('user_role');
  return response;
}
```

---

### BUG-S03 🟡 — Webhooks n8n sans authentification en développement
**Fichier :** `app/api/webhooks/_auth.ts`
**Description :** Si `WEBHOOK_SECRET` n'est pas défini en production (variable env oubliée lors du déploiement), tous les webhooks sont acceptés sans authentification. La condition actuelle ne vérifie que `NODE_ENV` mais Vercel peut avoir `NODE_ENV=production` avec une variable env manquante.

**Correction exacte :**
```typescript
// app/api/webhooks/_auth.ts
export function checkWebhookAuth(request: Request): boolean {
  const secret = process.env.WEBHOOK_SECRET;

  // En production, rejeter si WEBHOOK_SECRET absent
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.error('[SECURITY] WEBHOOK_SECRET manquant en production !');
    return false; // Rejeter, pas accepter
  }

  // En dev sans secret configuré : accepter avec warning
  if (!secret) {
    console.warn('[DEV] Webhook auth désactivée — configurez WEBHOOK_SECRET pour tester');
    return true;
  }

  const headerSecret = request.headers.get('x-webhook-secret');
  const urlSecret = new URL(request.url).searchParams.get('secret');
  return headerSecret === secret || urlSecret === secret;
}
```

---

### BUG-S04 🟡 — CSP permet `unsafe-inline` et `unsafe-eval`
**Fichier :** `next.config.ts`
**Description :** La Content Security Policy autorise `'unsafe-inline'` pour les scripts et `'unsafe-eval'`, ce qui neutralise la protection XSS pour les scripts injectés. C'est partiellement nécessaire pour Tailwind v4 en développement, mais en production Tailwind génère des classes statiques qui n'en ont pas besoin.

**Correction exacte :**
```typescript
// next.config.ts — remplacer dans la CSP :
const scriptSrc = process.env.NODE_ENV === 'production'
  ? `script-src 'self'`           // Production : strict
  : `script-src 'self' 'unsafe-inline' 'unsafe-eval'`; // Dev uniquement

const styleSrc = `style-src 'self' 'unsafe-inline' fonts.googleapis.com`;
```

---

### BUG-S05 🟡 — Aucun rate limiting sur les endpoints d'authentification
**Fichier :** `app/login/page.tsx` + `middleware.ts`
**Description :** Un attaquant peut tenter un nombre illimité de codes OTP ou bombarder l'endpoint de login. Supabase limite côté auth, mais pas côté applicatif (requêtes Supabase, webhooks, etc.).

**Correction exacte :**
Ajouter dans `middleware.ts` une protection basique via en-tête Vercel :
```typescript
// middleware.ts — ajouter avant les vérifications de session
if (request.nextUrl.pathname === '/login') {
  // Vercel fournit l'IP via x-forwarded-for
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  // Utiliser Vercel KV ou Edge Config pour rate limiting
  // (ou simplement se fier au rate limiting Supabase Auth)
}
```
Solution alternative recommandée : activer le rate limiting dans le dashboard Supabase → Auth → Rate Limits (configure à 5 OTP/heure par téléphone).

---

### BUG-S06 🟢 — Absence de logs des actions admin
**Fichier :** `app/admin/actions/registrations.ts`, `app/admin/actions/meals.ts`
**Description :** Les actions critiques (approbation/rejet d'utilisateur, suppression de repas, changement de rôle) ne sont pas enregistrées dans un log d'audit. Impossible de savoir qui a fait quoi en cas de problème.

**Correction exacte :**
Ajouter dans chaque Server Action admin :
```typescript
// Après chaque action admin réussie :
await admin.from('admin_audit_log').insert({
  admin_id: session.user.id,
  action: 'approve_user', // ou 'reject_user', 'delete_meal', etc.
  target_id: userId,
  details: { role: user.role, name: user.name },
  created_at: new Date().toISOString(),
});
```
Créer la table SQL :
```sql
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id),
  action text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_can_read" ON admin_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

---

## BUGS FONCTIONNELS

---

### BUG-F01 🔴 — `also_driver` sauvegardé mais jamais utilisé
**Fichier :** `app/signup/actions.ts` → `app/admin/actions/registrations.ts`
**Description :** Lors de l'inscription, un bénévole peut cocher "Je peux aussi conduire" (`also_driver: true`). Ce champ est enregistré dans `users` mais `approveUser()` ne l'utilise jamais. La cuisinière n'apparaît pas dans le dashboard מחלקת.

**Correction exacte dans `app/admin/actions/registrations.ts`**, dans la fonction `approveUser()` :
```typescript
// Après avoir récupéré le profil user, ajouter :
if (user.also_driver && user.role === 'cook') {
  // Option A : changer le rôle en 'both' si la DB supporte ce rôle
  await admin.from('users').update({ role: 'both' }).eq('id', userId);

  // Option B (si 'both' n'existe pas) : créer un enregistrement secondaire
  // Cette option nécessite une refonte du schéma
}
```
Et dans `app/driver/page.tsx`, modifier la requête pour inclure les users avec `role = 'both'` :
```typescript
// Dans la query des drivers disponibles :
.or('role.eq.driver,role.eq.both')
```

---

### BUG-F02 🔴 — Génération des repas silencieusement partielle si aucun menu actif
**Fichier :** `app/admin/actions/registrations.ts` — fonction `approveUser()`
**Description :** Si aucun menu actif n'existe pour un type de repas (ex: `shabbat_friday`), la génération des repas de ce type est ignorée silencieusement. L'admin voit "Utilisatrice approuvée" mais la יולדת n'a pas tous ses repas.

**Correction exacte :**
```typescript
// Dans approveUser(), après avoir récupéré les menus actifs :
const missingTypes = [];
if (numBreakfast > 0 && !menuByType['breakfast']) missingTypes.push('petit déjeuner');
if (shabbatFriday && !menuByType['shabbat_friday']) missingTypes.push('Shabbat vendredi');
if (shabbatSaturday && !menuByType['shabbat_saturday']) missingTypes.push('Shabbat samedi');

if (missingTypes.length > 0) {
  // Option A : bloquer l'approbation
  return { error: `Aucun menu actif pour : ${missingTypes.join(', ')}. Créez d'abord un menu dans Gestion des menus.` };

  // Option B : approuver quand même mais alerter (log dans notifications_log)
}
```

---

### BUG-F03 🟡 — Inscription dupliquée par téléphone après rejet
**Fichier :** `app/signup/actions.ts`
**Description :** `rejectUser()` supprime l'enregistrement `users` mais pas la session Supabase Auth. L'utilisateur rejeté peut se reconnecter avec le même OTP et réutiliser le même numéro de téléphone pour créer un nouveau compte, contournant ainsi le rejet.

**Correction exacte :**
Dans `app/admin/actions/registrations.ts`, dans `rejectUser()` :
```typescript
export async function rejectUser(userId: string) {
  const admin = createAdminClient();

  // 1. Récupérer l'auth_uid de l'utilisateur
  const { data: user } = await admin.from('users').select('id').eq('id', userId).single();

  // 2. Supprimer le compte Supabase Auth (empêche reconnexion OTP)
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) console.error('Erreur suppression auth:', authError);

  // 3. Supprimer l'enregistrement users (CASCADE supprimera beneficiaries)
  await admin.from('users').delete().eq('id', userId);

  revalidatePath('/admin/registrations');
}
```

---

### BUG-F04 🟡 — Calcul des dates Shabbat ne gère pas les cas limites
**Fichier :** `app/admin/actions/registrations.ts` — fonction `shabbatDatesInRange()`
**Description :** Si `start_date` est un vendredi ou samedi, le calcul peut inclure le Shabbat de la semaine en cours ou le sauter, selon l'implémentation. Aucun test de ce cas limite n'est documenté.

**Correction exacte :**
```typescript
function shabbatDatesInRange(startDate: Date, numWeeks: number) {
  const results: { friday: string; saturday: string }[] = [];

  // Trouver le prochain vendredi >= startDate
  const d = new Date(startDate);
  const dayOfWeek = d.getDay(); // 0=Dimanche, 5=Vendredi, 6=Samedi

  let daysToFriday: number;
  if (dayOfWeek === 5) daysToFriday = 0;        // C'est vendredi
  else if (dayOfWeek === 6) daysToFriday = 6;   // C'est samedi → prochain vendredi
  else daysToFriday = 5 - dayOfWeek;            // Autres jours

  d.setDate(d.getDate() + daysToFriday);

  for (let i = 0; i < numWeeks; i++) {
    const friday = new Date(d);
    const saturday = new Date(d);
    saturday.setDate(saturday.getDate() + 1);
    results.push({
      friday: toDateStr(friday),
      saturday: toDateStr(saturday),
    });
    d.setDate(d.getDate() + 7); // Semaine suivante
  }

  return results;
}
```

---

### BUG-F05 🟡 — Action `markMealReady` sans vérification que le cuisinier est bien assigné
**Fichier :** `app/actions/meals.ts`
**Description :** `markMealReady()` vérifie la session mais ne vérifie pas via RPC atomique que `cook_id === session.user.id`. Une cuisinière pourrait appeler cette action sur le repas d'une autre cuisinière via manipulation de l'ID.

**Correction exacte :**
```typescript
// app/actions/meals.ts — markMealReady()
export async function markMealReady(mealId: string) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non authentifié');

  const admin = createAdminClient();

  // Vérification atomique : uniquement si cook_id === userId ET status === cook_assigned
  const { data, error } = await admin
    .from('meals')
    .update({ status: 'ready' })
    .eq('id', mealId)
    .eq('cook_id', session.user.id)    // ← Vérification ownership
    .eq('status', 'cook_assigned')      // ← Vérification statut
    .select();

  if (error) throw new Error('Erreur: ' + error.message);
  if (!data || data.length === 0) throw new Error('Action non autorisée ou statut incorrect');

  revalidatePath('/cook');
}
```
Appliquer le même pattern à `markPickedUp()`, `markDelivered()`, `confirmMealReceived()`.

---

### BUG-F06 🟡 — Email facultatif mais utilisé dans certains flows
**Fichier :** `app/signup/page.tsx` + `app/signup/actions.ts`
**Description :** L'email est un champ optionnel dans le formulaire d'inscription mais certains webhooks n8n et notifications nécessitent une adresse email. Si absent, le webhook échoue silencieusement.

**Correction exacte :**
Option A — Rendre l'email obligatoire dans le formulaire (modifier la validation) :
```typescript
// app/signup/page.tsx — dans validateStep1() ou validateStep2() :
if (!formData.email || !formData.email.includes('@')) {
  newErrors.email = 'כתובת אימייל נדרשת';
  isValid = false;
}
```
Option B — Gérer le cas null dans les webhooks :
```typescript
// Dans les webhook handlers, ne pas échouer si email absent :
const email = user.email ?? null;
const notificationTarget = email ?? user.phone; // Fallback au téléphone
```

---

### BUG-F07 🟡 — `confirmMealReceived` ne vérifie pas que le statut est `delivered`
**Fichier :** `app/actions/meals.ts`
**Description :** Si `confirmMealReceived()` ne filtre pas sur `status = 'delivered'`, une יולדת pourrait théoriquement confirmer une livraison avant qu'elle soit marquée livrée (si elle connaît le mealId).

**Correction exacte :**
```typescript
export async function confirmMealReceived(mealId: string) {
  const admin = createAdminClient();
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non authentifié');

  // Récupérer l'ID beneficiary de l'utilisateur
  const { data: ben } = await admin
    .from('beneficiaries')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
  if (!ben) throw new Error('Bénéficiaire introuvable');

  // Mise à jour atomique avec toutes les conditions
  const { data, error } = await admin
    .from('meals')
    .update({ status: 'confirmed' })
    .eq('id', mealId)
    .eq('beneficiary_id', ben.id)     // ← Ownership
    .eq('status', 'delivered')         // ← Statut requis
    .select();

  if (!data || data.length === 0) throw new Error('Action non valide');
  revalidatePath('/beneficiary');
}
```

---

## BUGS DE PERFORMANCE

---

### BUG-P01 🟡 — Requêtes sans limite sur les pages principales
**Fichiers :** `app/beneficiary/page.tsx`, `app/cook/page.tsx`, `app/driver/page.tsx`
**Description :** Ces pages fetchent tous les repas sans `.limit()`. Pour une יולדת avec 45 repas ou une cuisine très active, cela peut renvoyer des centaines de lignes.

**Correction exacte :**
```typescript
// app/beneficiary/page.tsx :
const { data: meals } = await supabase
  .from('meals')
  .select('*, cook:users!cook_id(name), driver:users!driver_id(name)')
  .eq('beneficiary_id', ben.id)
  .order('date', { ascending: false })
  .limit(30);  // ← Ajouter

// app/cook/page.tsx — available meals :
const { data: availableMeals } = await supabase
  .from('meals')
  .select('...')
  .eq('status', 'open')
  .gte('date', today)
  .order('date')
  .limit(20);  // ← Ajouter

// app/driver/page.tsx — available deliveries :
.limit(20);  // ← Même chose
```

---

### BUG-P02 🟡 — Admin pages sans pagination UI (100 enregistrements sur une page)
**Fichiers :** `app/admin/meals/page.tsx`, `app/admin/users/page.tsx`, `app/admin/registrations/page.tsx`
**Description :** Les pages admin ont un hard limit de 100 enregistrements mais pas de pagination. Avec 200+ repas, les 100+ supplémentaires sont invisibles.

**Correction exacte :**
Utiliser les `searchParams` Next.js pour la pagination :
```typescript
// app/admin/meals/page.tsx :
export default async function MealsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page ?? '1');
  const perPage = 25;
  const offset = (page - 1) * perPage;

  const { data: meals, count } = await supabase
    .from('meals')
    .select('*', { count: 'exact' })
    .range(offset, offset + perPage - 1)
    .order('date', { ascending: false });

  const totalPages = Math.ceil((count ?? 0) / perPage);
  // Passer page, totalPages aux composants de pagination
}
```

---

### BUG-P03 🟢 — Requête N+1 potentielle dans le dashboard cook
**Fichier :** `app/cook/page.tsx`
**Description :** Si les repas et les bénéficiaires sont fetchés en deux requêtes séparées sans join, on a une requête par repas pour obtenir les préférences alimentaires.

**Correction exacte :**
Vérifier que la requête utilise des joins Supabase plutôt que des requêtes séparées :
```typescript
// Utiliser un join complet plutôt que des fetches séparés :
const { data: meals } = await admin
  .from('meals')
  .select(`
    *,
    beneficiary:beneficiaries!beneficiary_id(
      *,
      user:users!user_id(name, address, neighborhood, phone)
    ),
    menu:menus!menu_id(name, items)
  `)
  .in('status', ['open'])
  .gte('date', today)
  .order('date');
```

---

## BUGS D'INTERFACE

---

### BUG-U01 🟡 — Messages d'erreur des actions ne disparaissent pas
**Fichiers :** `app/cook/CookActions.tsx`, `app/driver/DriverActions.tsx`
**Description :** Les états d'erreur (ex: "מישהי אחרת לקחה את הארוחה") restent affichés indéfiniment, même après résolution du problème ou navigation.

**Correction exacte :**
```typescript
// Dans CookActions.tsx et DriverActions.tsx :
const [error, setError] = useState<string | null>(null);

// Ajouter auto-dismiss :
useEffect(() => {
  if (!error) return;
  const timer = setTimeout(() => setError(null), 5000);
  return () => clearTimeout(timer);
}, [error]);

// Dans le JSX, ajouter bouton fermer :
{error && (
  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
    <span className="flex-1">{error}</span>
    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
  </div>
)}
```

---

### BUG-U02 🟡 — Bouton Waze ouvre avec adresse non encodée
**Fichier :** `app/driver/DriverActions.tsx`
**Description :** Les adresses hébraïques contiennent des caractères Unicode qui doivent être encodés pour les URLs Waze/Google Maps. Une adresse comme "רחוב הרצל 5, ירושלים" ouvrira une URL cassée.

**Correction exacte :**
```typescript
// Dans DriverActions.tsx :
function buildNavigationUrl(address: string, app: 'waze' | 'google'): string | null {
  if (!address || address.trim().length < 5) return null;

  // Ajouter ", ישראל" si manquant pour améliorer la géolocalisation
  const fullAddress = address.includes('ישראל') ? address : `${address}, ישראל`;
  const encoded = encodeURIComponent(fullAddress);

  if (app === 'waze') return `https://waze.com/ul?q=${encoded}&navigate=yes`;
  return `https://maps.google.com/?q=${encoded}`;
}

// Utilisation :
const wazeUrl = buildNavigationUrl(benAddress, 'waze');
<a href={wazeUrl ?? '#'} onClick={!wazeUrl ? (e) => e.preventDefault() : undefined}
   className={!wazeUrl ? 'opacity-40 cursor-not-allowed' : ''}>
  Waze
</a>
```

---

### BUG-U03 🟡 — Matching de quartier cuisine/livraison : faux positifs
**Fichiers :** `app/cook/page.tsx`, `app/driver/page.tsx`
**Description :** Le badge "קרוב אלייך 📍" utilise un `includes()` basique. "גן" matche dans "רמת גן" ET "גן שאול" ET "גן עדן", ce qui donne des faux positifs.

**Correction exacte :**
```typescript
// lib/utils.ts — ajouter :
export function isSameNeighborhood(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;

  const normalize = (s: string) => s
    .trim()
    .toLowerCase()
    .replace(/[\u0591-\u05C7]/g, '') // Supprimer nikoud hébreu
    .replace(/\s+/g, ' ');

  const na = normalize(a);
  const nb = normalize(b);

  // Correspondance exacte uniquement (pas includes)
  return na === nb;
}
```

---

### BUG-U04 🟢 — Absence de composants `error.tsx` (Error Boundaries)
**Fichiers :** Tous les dossiers de route
**Description :** Une erreur non catchée dans un Server Component affiche la page d'erreur Next.js générique en anglais, cassant l'expérience utilisateur hébreu.

**Correction exacte :**
Créer `app/error.tsx` (et variantes par route) :
```typescript
'use client';
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4 bg-pale">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-border">
        <div className="text-4xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-brand mb-2">משהו השתבש</h2>
        <p className="text-muted-foreground text-sm mb-6">אנא נסי שוב או חזרי לדף הבית</p>
        <button onClick={reset} className="btn-primary w-full">נסי שוב</button>
      </div>
    </div>
  );
}
```
Créer dans : `app/error.tsx`, `app/beneficiary/error.tsx`, `app/cook/error.tsx`, `app/driver/error.tsx`, `app/admin/error.tsx`.

---

### BUG-U05 🟢 — `inputMode` absent sur les champs numériques
**Fichiers :** `app/signup/page.tsx`, `app/login/page.tsx`
**Description :** Sur iOS, les champs "nombre d'adultes", "nombre d'enfants" et "code OTP" ouvrent le clavier alphabétique au lieu du pavé numérique.

**Correction exacte :**
```typescript
// Pour les champs numériques dans signup/page.tsx :
<input
  type="text"
  inputMode="numeric"      // ← Ouvre le clavier numérique sur mobile
  pattern="[0-9]*"         // ← Validation HTML5
  value={formData.numAdults}
  // ...
/>

// Pour le code OTP dans login/page.tsx :
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]{6}"
  maxLength={6}
  // ...
/>
```

---

### BUG-U06 🟢 — README.md est le template générique Next.js
**Fichier :** `README.md`
**Description :** Le README contient le template standard `create-next-app` sans aucune information spécifique au projet. Un nouveau développeur ne sait pas comment démarrer.

**Correction exacte :**
Remplacer le contenu de `README.md` par les informations du projet, ou y référencer `GUIDE-DEMARRAGE.md` qui contient les vraies instructions de démarrage.

---

## BUGS TYPESCRIPT

---

### BUG-T01 🟡 — Assertions `as` non sécurisées dans les transformations de données
**Fichiers :** Divers composants
**Description :** Plusieurs endroits utilisent des `as TypeName` pour caster des données Supabase sans vérification runtime. Si le schéma DB change, ces casts silencieux masquent les erreurs.

**Correction exacte :**
Utiliser des fonctions de validation (zod ou validation manuelle) :
```typescript
// lib/types.ts — définir des type guards :
export function isMeal(obj: unknown): obj is Meal {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'status' in obj &&
    'date' in obj
  );
}

// Dans les pages, remplacer :
const meal = data as Meal;
// Par :
if (!isMeal(data)) throw new Error('Format de repas invalide');
const meal = data;
```

---

### BUG-T02 🟢 — Types Supabase non générés automatiquement
**Description :** Les types TypeScript pour les tables Supabase sont écrits manuellement et peuvent diverger du schéma réel. Aucune génération automatique n'est configurée.

**Correction exacte :**
Ajouter dans `package.json` :
```json
{
  "scripts": {
    "types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts"
  }
}
```
Et utiliser ces types générés dans les requêtes Supabase.

---

**Total : 18 bugs identifiés**
| Criticité | Nombre |
|-----------|--------|
| 🔴 Critique | 2 |
| 🟡 Important | 11 |
| 🟢 Mineur | 5 |
