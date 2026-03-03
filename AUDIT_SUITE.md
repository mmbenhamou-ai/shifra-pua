# AUDIT_SUITE.md — שפרה ופועה
> Plan des 20 prochaines tâches pour atteindre la production
> Ordre de priorité absolue — 27 février 2026

---

## PHASE A — FONDATIONS (Jours 1-2)
> Sans ces tâches, l'app ne peut pas fonctionner en production

---

### TÂCHE 1 — Exécuter les migrations SQL Phase 6 sur Supabase prod

**Priorité :** CRITIQUE — à faire en premier
**Durée estimée :** 30 min
**Fichier à modifier :** `supabase/migrations/` + Supabase Dashboard SQL Editor

**Changements précis :**
1. Ouvrir Supabase Dashboard → SQL Editor
2. Exécuter dans cet ordre :
   ```sql
   -- 1. Nouvelles tables
   CREATE TABLE IF NOT EXISTS time_slots (...);
   CREATE TABLE IF NOT EXISTS meal_items (...);
   CREATE TABLE IF NOT EXISTS feedbacks (...);

   -- 2. Nouvelles colonnes sur beneficiaries
   ALTER TABLE beneficiaries
     ADD COLUMN IF NOT EXISTS num_adults int DEFAULT 2,
     ADD COLUMN IF NOT EXISTS num_children int DEFAULT 0,
     ADD COLUMN IF NOT EXISTS children_ages int[] DEFAULT '{}',
     ADD COLUMN IF NOT EXISTS is_vegetarian boolean DEFAULT false,
     ADD COLUMN IF NOT EXISTS spicy_level int DEFAULT 1,
     ADD COLUMN IF NOT EXISTS cooking_notes text,
     ADD COLUMN IF NOT EXISTS shabbat_friday boolean DEFAULT true,
     ADD COLUMN IF NOT EXISTS shabbat_saturday boolean DEFAULT true,
     ADD COLUMN IF NOT EXISTS shabbat_kashrut text DEFAULT 'רגיל',
     ADD COLUMN IF NOT EXISTS end_date date,
     ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

   -- 3. Nouvelles colonnes sur meals
   ALTER TABLE meals
     ADD COLUMN IF NOT EXISTS time_slot_id uuid REFERENCES time_slots(id),
     ADD COLUMN IF NOT EXISTS conflict_at timestamptz;

   -- 4. Fonctions RPC atomiques
   CREATE OR REPLACE FUNCTION take_meal_atomic(p_meal_id uuid, p_user_id uuid, p_role text)
   RETURNS SETOF meals LANGUAGE plpgsql SECURITY DEFINER AS $$
   BEGIN
     RETURN QUERY
     UPDATE meals SET cook_id = p_user_id, status = 'cook_assigned'
     WHERE id = p_meal_id AND status = 'open' AND cook_id IS NULL
     RETURNING *;
   END;
   $$;

   -- (Répéter pour take_delivery_atomic, reserve_meal_item_atomic)

   -- 5. RLS policies
   ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
   -- ... policies par rôle
   ```
3. Vérifier dans Table Editor que toutes les colonnes sont créées
4. Tester la RPC avec un appel depuis Next.js en dev

---

### TÂCHE 2 — Configurer l'authentification SMS OTP sur Supabase

**Priorité :** CRITIQUE
**Durée estimée :** 1-2h (selon provider)
**Fichier à modifier :** Supabase Dashboard (pas de code Next.js à changer)

**Changements précis :**
1. Supabase Dashboard → Authentication → Providers → Phone
2. Activer le provider Phone
3. Choisir provider SMS (recommandé : **Twilio** ou **Vonage**)
4. Configurer les credentials du provider SMS
5. Personnaliser le template OTP en hébreu :
   - Message : `קוד הכניסה שלך לשפרה ופועה: {{ .Token }}`
   - Expiration : 600 secondes (10 min)
6. Supabase Dashboard → Authentication → URL Configuration :
   - Site URL : `https://votre-domaine.vercel.app`
   - Redirect URLs : `https://votre-domaine.vercel.app/**`
7. Tester avec un vrai téléphone +972

---

### TÂCHE 3 — Configurer toutes les variables d'environnement sur Vercel

**Priorité :** CRITIQUE
**Durée estimée :** 15 min
**Fichier à modifier :** Vercel Dashboard → Settings → Environment Variables

**Changements précis :**
Variables à configurer (toutes en Production + Preview) :
```
NEXT_PUBLIC_SUPABASE_URL         = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    = eyJ...
SUPABASE_SERVICE_ROLE_KEY        = eyJ... (NE PAS préfixer NEXT_PUBLIC_)
WEBHOOK_SECRET                   = [32 chars aléatoires, ex: openssl rand -hex 32]
NEXT_PUBLIC_APP_URL              = https://votre-domaine.vercel.app
```
Après configuration :
- Cliquer "Redeploy" sur le dernier déploiement Vercel
- Vérifier dans les logs que les variables sont bien lues (pas d'erreur "missing env var")

---

### TÂCHE 4 — Corriger BUG-S01 : Guard contre importation admin côté client

**Priorité :** CRITIQUE — sécurité
**Durée estimée :** 15 min
**Fichier à modifier :** `lib/supabase-admin.ts`

**Changements précis :**
```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  // Guard runtime : bloque l'usage côté browser
  if (typeof window !== 'undefined') {
    throw new Error(
      '[SECURITY] createAdminClient() interdit côté client. ' +
      'Retire "use client" de ce fichier ou utilise createBrowserClient() à la place.'
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    throw new Error('[CONFIG] SUPABASE_SERVICE_ROLE_KEY manquant');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
```

---

## PHASE B — SÉCURITÉ & ROBUSTESSE (Jours 3-4)

---

### TÂCHE 5 — Corriger BUG-S02 : Cache du rôle réduit à 1h + invalidation

**Priorité :** IMPORTANT — sécurité
**Durée estimée :** 45 min
**Fichiers à modifier :** `middleware.ts`, `app/admin/users/UserActions.tsx`

**Changements précis dans `middleware.ts` :**
```typescript
// Chercher la ligne qui set le cookie user_role
// Remplacer maxAge par 3600 (1 heure) :
response.cookies.set('user_role', userRole, {
  maxAge: 60 * 60,        // 1h au lieu de 7 jours
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});
```

**Créer `app/api/admin/invalidate-session/route.ts` :**
```typescript
import { NextResponse } from 'next/server';
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('user_role');
  return res;
}
```

**Dans `app/admin/users/UserActions.tsx`**, après un changement de rôle réussi :
```typescript
// Appeler l'API d'invalidation
await fetch('/api/admin/invalidate-session', { method: 'POST' });
```

---

### TÂCHE 6 — Corriger BUG-S03 : Webhook auth stricte en production

**Priorité :** IMPORTANT — sécurité
**Durée estimée :** 20 min
**Fichier à modifier :** `app/api/webhooks/_auth.ts`

**Code complet du fichier corrigé :**
```typescript
export function checkWebhookAuth(request: Request): boolean {
  const secret = process.env.WEBHOOK_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      console.error('[SECURITY CRITICAL] WEBHOOK_SECRET manquant en production !');
      return false; // Rejeter, jamais accepter sans secret en prod
    }
  } else {
    if (!secret) {
      console.warn('[DEV] Webhook auth désactivée — configurez WEBHOOK_SECRET');
      return true; // En dev seulement : accepter sans secret
    }
  }

  const headerSecret = request.headers.get('x-webhook-secret');
  const urlSecret = new URL(request.url).searchParams.get('secret');

  return headerSecret === secret || urlSecret === secret;
}
```

---

### TÂCHE 7 — Corriger BUG-F01 : Activer also_driver lors de l'approbation

**Priorité :** IMPORTANT — fonctionnel
**Durée estimée :** 1h
**Fichier à modifier :** `app/admin/actions/registrations.ts`, `app/driver/page.tsx`, `app/cook/page.tsx`

**Dans `app/admin/actions/registrations.ts`**, dans `approveUser()` :
```typescript
// Après avoir récupéré le profil user :
const { data: user } = await admin
  .from('users')
  .select('role, also_driver, name')
  .eq('id', userId)
  .single();

// Nouveau : activer le double rôle
if (user.also_driver && user.role === 'cook') {
  await admin.from('users').update({ role: 'both' }).eq('id', userId);
}
```

**Dans `app/driver/page.tsx`**, modifier la requête des livraisons disponibles :
```typescript
// Remplacer .eq('role', 'driver') par :
.in('role', ['driver', 'both'])
```

**Dans `app/cook/page.tsx`**, modifier la requête :
```typescript
.in('role', ['cook', 'both'])
```

**Dans `middleware.ts`**, dans les RBAC rules :
```typescript
'/driver': ['driver', 'both'],
'/cook': ['cook', 'both'],
```

---

### TÂCHE 8 — Corriger BUG-F02 : Bloquer approbation si menus absents

**Priorité :** IMPORTANT — fonctionnel
**Durée estimée :** 30 min
**Fichier à modifier :** `app/admin/actions/registrations.ts`

**Dans `approveUser()`, après la requête des menus actifs :**
```typescript
const { data: activeMenus } = await admin
  .from('menus')
  .select('id, type')
  .eq('active', true);

const menuByType: Record<string, string> = {};
activeMenus?.forEach(m => { menuByType[m.type] = m.id; });

// Vérification : menus requis présents ?
const missingMenus: string[] = [];
if (ben.num_breakfast_days > 0 && !menuByType['breakfast'])
  missingMenus.push('ארוחת בוקר');
if (ben.shabbat_friday && !menuByType['shabbat_friday'])
  missingMenus.push('שבת (שישי)');
if (ben.shabbat_saturday && !menuByType['shabbat_saturday'])
  missingMenus.push('שבת (שבת)');

if (missingMenus.length > 0) {
  return {
    error: `חסרים תפריטים פעילים עבור: ${missingMenus.join(', ')}. אנא צרי תפריטים קודם.`
  };
}
```
Ajouter le retour de `{error}` dans le composant `app/admin/registrations/page.tsx` pour afficher le message.

---

### TÂCHE 9 — Ajouter Error Boundaries sur toutes les routes

**Priorité :** IMPORTANT — UX
**Durée estimée :** 45 min
**Fichiers à créer :** `app/error.tsx`, `app/beneficiary/error.tsx`, `app/cook/error.tsx`, `app/driver/error.tsx`, `app/admin/error.tsx`

**Template pour chaque fichier (adapter le texte par rôle) :**
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
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-brand mb-2">משהו השתבש</h2>
        <p className="text-sm text-gray-500 mb-6">
          אירעה שגיאה לא צפויה. אנא נסי שוב.
        </p>
        <button
          onClick={reset}
          className="w-full py-3 bg-brand text-white rounded-xl font-semibold"
        >
          נסי שוב
        </button>
      </div>
    </div>
  );
}
```

---

## PHASE C — QUALITÉ DU CODE (Jours 5-6)

---

### TÂCHE 10 — Corriger BUG-F05/F07 : Vérifications d'ownership sur les actions repas

**Priorité :** IMPORTANT — sécurité fonctionnelle
**Durée estimée :** 1h30
**Fichier à modifier :** `app/actions/meals.ts`

**Ajouter des filtres d'ownership à chaque action :**
```typescript
// markMealReady — vérifier que c'est bien cette cuisinière
const { data, error } = await admin
  .from('meals')
  .update({ status: 'ready' })
  .eq('id', mealId)
  .eq('cook_id', session.user.id)     // OWNERSHIP
  .eq('status', 'cook_assigned')       // ÉTAT VALIDE
  .select();
if (!data?.length) throw new Error('Action non autorisée');

// markPickedUp — vérifier que c'est bien cette livreuse
.eq('driver_id', session.user.id)
.eq('status', 'driver_assigned')

// markDelivered — vérifier livreuse assignée
.eq('driver_id', session.user.id)
.eq('status', 'picked_up')

// confirmMealReceived — vérifier que c'est bien la יולדת du repas
// Nécessite un join beneficiaries pour obtenir beneficiary_id → vérifier user_id
```

---

### TÂCHE 11 — Corriger BUG-U01 : Auto-dismiss des erreurs dans CookActions/DriverActions

**Priorité :** IMPORTANT — UX mobile
**Durée estimée :** 30 min
**Fichiers à modifier :** `app/cook/CookActions.tsx`, `app/driver/DriverActions.tsx`

**Dans les deux fichiers, ajouter après `const [error, setError] = useState` :**
```typescript
// Auto-dismiss après 5 secondes
useEffect(() => {
  if (!error) return;
  const timer = setTimeout(() => setError(null), 5000);
  return () => clearTimeout(timer);
}, [error]);
```

**Modifier le rendu de l'erreur :**
```typescript
{error && (
  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50
                  border border-red-200 rounded-xl p-3 mt-2">
    <span className="flex-1">{error}</span>
    <button
      onClick={() => setError(null)}
      className="text-red-400 hover:text-red-600 p-1"
      aria-label="סגור"
    >
      ✕
    </button>
  </div>
)}
```

---

### TÂCHE 12 — Corriger BUG-U02 : Encodage URL Waze/Maps + validation adresse

**Priorité :** IMPORTANT — UX livreuse
**Durée estimée :** 30 min
**Fichiers à modifier :** `lib/utils.ts` (créer si absent), `app/driver/DriverActions.tsx`

**Dans `lib/utils.ts` :**
```typescript
export function buildWazeUrl(address: string | null | undefined): string | null {
  if (!address || address.trim().length < 5) return null;
  const full = address.includes('ישראל') ? address : `${address.trim()}, ישראל`;
  return `https://waze.com/ul?q=${encodeURIComponent(full)}&navigate=yes`;
}

export function buildGoogleMapsUrl(address: string | null | undefined): string | null {
  if (!address || address.trim().length < 5) return null;
  const full = address.includes('ישראל') ? address : `${address.trim()}, ישראל`;
  return `https://maps.google.com/?q=${encodeURIComponent(full)}`;
}
```

**Dans `app/driver/DriverActions.tsx` :**
```typescript
import { buildWazeUrl, buildGoogleMapsUrl } from '@/lib/utils';

const wazeUrl = buildWazeUrl(benAddress);
const mapsUrl = buildGoogleMapsUrl(benAddress);

// Bouton Waze :
{wazeUrl ? (
  <a href={wazeUrl} target="_blank" rel="noopener" className="btn-secondary">
    Waze 🗺️
  </a>
) : (
  <span className="text-xs text-gray-400">כתובת חסרה</span>
)}
```

---

### TÂCHE 13 — Ajouter pagination aux pages admin

**Priorité :** IMPORTANT — scalabilité
**Durée estimée :** 2h
**Fichiers à modifier :** `app/admin/meals/page.tsx`, `app/admin/users/page.tsx`, `app/admin/registrations/page.tsx`

**Pattern à appliquer dans chaque page :**
```typescript
// Page component :
export default async function Page({
  searchParams,
}: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1'));
  const perPage = 25;
  const offset = (page - 1) * perPage;

  const { data, count, error } = await admin
    .from('meals')
    .select('*', { count: 'exact' })
    .range(offset, offset + perPage - 1)
    .order('date', { ascending: false });

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div>
      {/* ... liste ... */}
      <PaginationControls page={page} totalPages={totalPages} />
    </div>
  );
}
```

**Créer `app/components/PaginationControls.tsx` :**
```typescript
export function PaginationControls({ page, totalPages }: { page: number; totalPages: number }) {
  return (
    <div dir="rtl" className="flex gap-2 justify-center mt-6">
      {page > 1 && (
        <a href={`?page=${page - 1}`} className="px-4 py-2 border border-border rounded-xl text-sm">
          הקודם ←
        </a>
      )}
      <span className="px-4 py-2 text-sm text-gray-500">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <a href={`?page=${page + 1}`} className="px-4 py-2 border border-border rounded-xl text-sm">
          → הבא
        </a>
      )}
    </div>
  );
}
```

---

## PHASE D — FONCTIONNALITÉS MANQUANTES (Jours 7-10)

---

### TÂCHE 14 — Implémenter les Cron Jobs pour alertes automatiques

**Priorité :** IMPORTANT — automatisation
**Durée estimée :** 2h
**Fichiers à créer/modifier :** `vercel.json`, `app/api/cron/check-uncovered/route.ts`, `app/api/cron/shabbat-recap/route.ts`

**Dans `vercel.json` :**
```json
{
  "crons": [
    {
      "path": "/api/cron/check-uncovered",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/shabbat-recap",
      "schedule": "0 15 * * 4"
    }
  ]
}
```

**`app/api/cron/check-uncovered/route.ts` :**
```typescript
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  // Vérifier que c'est bien un appel Vercel Cron (header spécifique)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: uncoveredMeals } = await admin
    .from('meals')
    .select('id, date, type, beneficiary_id')
    .eq('status', 'open')
    .gte('date', now.toISOString().split('T')[0])
    .lte('date', in48h.toISOString().split('T')[0]);

  if (uncoveredMeals && uncoveredMeals.length > 0) {
    // Appeler le webhook n8n pour envoyer les alertes
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/uncovered-48h`, {
      headers: { 'x-webhook-secret': process.env.WEBHOOK_SECRET ?? '' },
    });
  }

  return NextResponse.json({ checked: uncoveredMeals?.length ?? 0 });
}
```
Ajouter `CRON_SECRET` aux variables Vercel.

---

### TÂCHE 15 — Implémenter l'export CSV

**Priorité :** IMPORTANT — opérationnel
**Durée estimée :** 1h30
**Fichiers à créer :** `app/api/admin/export/route.ts`, modifier `app/admin/stats/page.tsx`

**`app/api/admin/export/route.ts` :**
```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  // Auth check : admin seulement
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const admin = createAdminClient();
  const { data: user } = await admin.from('users').select('role').eq('id', session.user.id).single();
  if (user?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const type = new URL(request.url).searchParams.get('type') ?? 'meals';
  const date = new Date().toISOString().split('T')[0];

  let csvContent = '';
  let filename = '';

  if (type === 'meals') {
    const { data } = await admin
      .from('meals')
      .select('date, type, status, beneficiary:beneficiaries(user:users(name, address)), cook:users!cook_id(name), driver:users!driver_id(name)')
      .order('date', { ascending: false })
      .limit(500);

    filename = `repas-${date}.csv`;
    csvContent = 'תאריך,סוג,סטטוס,יולדת,כתובת,מבשלת,מחלקת\n';
    data?.forEach(m => {
      csvContent += `${m.date},${m.type},${m.status},"${(m.beneficiary as any)?.user?.name ?? ''}","${(m.beneficiary as any)?.user?.address ?? ''}","${(m.cook as any)?.name ?? ''}","${(m.driver as any)?.name ?? ''}"\n`;
    });
  } else if (type === 'users') {
    const { data } = await admin
      .from('users')
      .select('name, phone, role, neighborhood, approved, created_at')
      .order('created_at', { ascending: false });

    filename = `משתמשות-${date}.csv`;
    csvContent = 'שם,טלפון,תפקיד,שכונה,מאושרת,תאריך הרשמה\n';
    data?.forEach(u => {
      csvContent += `"${u.name}","${u.phone}","${u.role}","${u.neighborhood ?? ''}",${u.approved},${u.created_at}\n`;
    });
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

**Dans `app/admin/stats/page.tsx` ou `app/admin/page.tsx` :**
```tsx
<a href="/api/admin/export?type=meals" className="btn-secondary text-sm">
  ייצוא ארוחות CSV ↓
</a>
<a href="/api/admin/export?type=users" className="btn-secondary text-sm">
  ייצוא משתמשות CSV ↓
</a>
```

---

### TÂCHE 16 — Compléter la page de profil utilisateur `/profile`

**Priorité :** IMPORTANT — UX
**Durée estimée :** 2h
**Fichiers à modifier/créer :** `app/profile/page.tsx`, `app/profile/ProfileForm.tsx`

**`app/profile/page.tsx` (Server Component) :**
```typescript
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const admin = createAdminClient();
  const { data: user } = await admin
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return (
    <main dir="rtl" className="min-h-screen bg-pale p-4">
      <h1 className="text-xl font-bold text-brand mb-6">הפרופיל שלי</h1>
      <ProfileForm user={user} />
    </main>
  );
}
```

**`app/profile/ProfileForm.tsx` (Client Component) :**
- Afficher nom, téléphone (non modifiable), adresse, quartier
- Champs éditables : adresse, quartier, notes
- Toggles : notif_cooking, notif_delivery
- Bouton "שמור" → Server Action `updateProfile()`
- Message de succès après sauvegarde

---

### TÂCHE 17 — Ajouter `inputMode` sur tous les champs numériques

**Priorité :** IMPORTANT — UX mobile
**Durée estimée :** 30 min
**Fichiers à modifier :** `app/signup/page.tsx`, `app/login/page.tsx`

**Dans `app/login/page.tsx` — champ téléphone :**
```tsx
<input
  type="tel"
  inputMode="tel"
  pattern="[0-9+\-\s]*"
  // ...
/>
```

**Champ code OTP :**
```tsx
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={6}
  autoComplete="one-time-code"   // ← Autocompletion OTP sur iOS/Android
  // ...
/>
```

**Dans `app/signup/page.tsx` — champs num_adults, num_children :**
```tsx
<input
  type="number"
  inputMode="numeric"
  min={1}
  max={20}
  // ...
/>
```

---

## PHASE E — MONITORING & QUALITÉ (Jours 11-14)

---

### TÂCHE 18 — Générer les types TypeScript depuis Supabase

**Priorité :** QUALITÉ CODE
**Durée estimée :** 30 min
**Fichiers à créer/modifier :** `lib/database.types.ts`, `package.json`

**Dans `package.json` :**
```json
{
  "scripts": {
    "types:supabase": "supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/database.types.ts"
  }
}
```

**Exécuter :**
```bash
npm install supabase --save-dev
npx supabase login
npm run types:supabase
```

**Utiliser les types générés dans les requêtes :**
```typescript
import type { Database } from '@/lib/database.types';
type Meal = Database['public']['Tables']['meals']['Row'];
type User = Database['public']['Tables']['users']['Row'];
```

---

### TÂCHE 19 — Installer et configurer Sentry pour le monitoring

**Priorité :** IMPORTANT — production monitoring
**Durée estimée :** 45 min
**Fichiers à créer :** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

**Installation :**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**`sentry.client.config.ts` :**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% des transactions en prod
  // Ignorer les erreurs "normales" (race conditions)
  ignoreErrors: [
    'מישהי אחרת לקחה את הארוחה',
    'Non authentifié',
  ],
});
```

Ajouter `NEXT_PUBLIC_SENTRY_DSN` et `SENTRY_AUTH_TOKEN` aux variables Vercel.

---

### TÂCHE 20 — Écrire les tests unitaires des fonctions critiques

**Priorité :** QUALITÉ — non bloquant mais important
**Durée estimée :** 2h
**Fichiers à créer :** `__tests__/utils.test.ts`, `__tests__/meals.test.ts`

**Installation :**
```bash
npm install --save-dev vitest @vitest/ui
```

**`__tests__/utils.test.ts` :**
```typescript
import { describe, it, expect } from 'vitest';
import { normalizePhone, isSameNeighborhood, buildWazeUrl, shabbatDatesInRange } from '@/lib/utils';

describe('normalizePhone', () => {
  it('normalise 0501234567 → +972501234567', () => {
    expect(normalizePhone('0501234567')).toBe('+972501234567');
  });
  it('normalise 972501234567 → +972501234567', () => {
    expect(normalizePhone('972501234567')).toBe('+972501234567');
  });
  it('passe +972501234567 tel quel', () => {
    expect(normalizePhone('+972501234567')).toBe('+972501234567');
  });
});

describe('isSameNeighborhood', () => {
  it('corresponde : exactement pareil', () => {
    expect(isSameNeighborhood('רמת גן', 'רמת גן')).toBe(true);
  });
  it('ne correspond pas : sous-chaîne', () => {
    expect(isSameNeighborhood('גן', 'רמת גן')).toBe(false);
  });
  it('gère les valeurs null', () => {
    expect(isSameNeighborhood(null, 'רמת גן')).toBe(false);
  });
});

describe('buildWazeUrl', () => {
  it('encode les caractères hébreux', () => {
    const url = buildWazeUrl('רחוב הרצל 5, ירושלים');
    expect(url).toContain('%D7%A8%D7%97%D7%95%D7%91');
  });
  it('retourne null pour adresse vide', () => {
    expect(buildWazeUrl('')).toBeNull();
    expect(buildWazeUrl(null)).toBeNull();
  });
});

describe('shabbatDatesInRange', () => {
  it('calcule 2 Shabbats à partir d\'un lundi', () => {
    const start = new Date('2026-03-02'); // Lundi
    const result = shabbatDatesInRange(start, 2);
    expect(result).toHaveLength(2);
    expect(result[0].friday).toBe('2026-03-06');
    expect(result[0].saturday).toBe('2026-03-07');
  });
  it('gère le cas où start_date est un vendredi', () => {
    const start = new Date('2026-03-06'); // Vendredi
    const result = shabbatDatesInRange(start, 1);
    expect(result[0].friday).toBe('2026-03-06'); // Ce vendredi même
  });
});
```

**Dans `package.json` :**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## CHECKLIST FINALE AVANT MISE EN PRODUCTION

```
□ TÂCHE 1  — Migrations SQL Phase 6 exécutées et vérifiées
□ TÂCHE 2  — SMS OTP configuré et testé sur vrai téléphone
□ TÂCHE 3  — Variables d'environnement Vercel configurées
□ TÂCHE 4  — Guard createAdminClient() côté client
□ TÂCHE 5  — Cache rôle réduit à 1h + invalidation
□ TÂCHE 6  — Webhook auth stricte en production
□ TÂCHE 7  — also_driver activé lors approbation
□ TÂCHE 8  — Blocage si menus manquants
□ TÂCHE 9  — Error Boundaries sur toutes les routes
□ TÂCHE 10 — Ownership checks sur les actions repas
□ TÂCHE 11 — Auto-dismiss erreurs cook/driver
□ TÂCHE 12 — Encodage URL Waze/Maps corrigé
□ TÂCHE 13 — Pagination admin (25/page)
□ TÂCHE 14 — Cron jobs alertes automatiques
□ TÂCHE 15 — Export CSV fonctionnel
□ TÂCHE 16 — Page profil complète
□ TÂCHE 17 — inputMode sur champs numériques
□ TÂCHE 18 — Types TypeScript générés depuis Supabase
□ TÂCHE 19 — Sentry configuré et testé
□ TÂCHE 20 — Tests unitaires passants (vitest)
```

---

## ESTIMATION DE TEMPS

| Phase | Tâches | Jours |
|-------|--------|-------|
| A — Fondations | 1-4 | 1-2 |
| B — Sécurité | 5-9 | 1-2 |
| C — Qualité code | 10-13 | 1-2 |
| D — Fonctionnalités | 14-17 | 3-4 |
| E — Monitoring | 18-20 | 1-2 |
| **Total** | **20 tâches** | **7-12 jours** |

**Score production-readiness attendu après ces 20 tâches : 9.5/10**
