# Guide de démarrage — Pas à pas avec Cursor

## Prérequis à installer

1. **Node.js** → https://nodejs.org (version LTS)
2. **Cursor** → https://cursor.com
3. **Compte Supabase** → https://supabase.com (gratuit)
4. **Compte Vercel** → https://vercel.com (gratuit)

---

## Étape 0 — Créer le projet

Ouvre Cursor, puis ouvre le terminal intégré (Ctrl+`) et tape :

```bash
npx create-next-app@latest meal-app --typescript --tailwind --app --src-dir=false
cd meal-app
```

Ensuite :
1. Copie le fichier `PROJECT.md` à la racine du projet
2. Copie le fichier `.cursorrules` à la racine du projet

---

## Étape 1 — Setup Supabase (jour 1)

### Dans Supabase (site web) :
1. Crée un nouveau projet
2. Va dans Settings / API et copie :
   - Project URL
   - anon public key
3. Va dans Authentication / Providers et active "Phone" (SMS OTP)

### Dans Cursor Agent (Cmd+I) :
Écris :
> "Installe @supabase/supabase-js et @supabase/ssr. Crée le fichier lib/supabase.ts avec la config client et server. Utilise les variables d'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY. Réfère-toi à PROJECT.md."

---

## Étape 2 — Base de données (jour 1)

Dans Cursor Agent :
> "Crée toutes les tables dans Supabase selon le schéma décrit dans PROJECT.md. Génère le SQL complet que je pourrai exécuter dans le SQL Editor de Supabase. Inclus les RLS policies pour chaque table."

Copie le SQL généré → colle dans Supabase SQL Editor → exécute.

---

## Étape 3 — Auth + Login (jour 2)

Dans Cursor Agent :
> "Crée la page de login avec authentification par téléphone OTP via Supabase. L'utilisateur entre son numéro de téléphone, reçoit un code par SMS, entre le code. Si c'est un nouvel utilisateur, redirige vers la page d'inscription. Si existant, redirige vers le dashboard selon son rôle. Tout en hébreu, RTL."

---

## Étape 4 — Inscription (jour 2-3)

> "Crée la page d'inscription. L'utilisateur choisit son rôle : יולדת (bénéficiaire), מבשלת (cuisinière), ou מחלקת (livreuse). Selon le rôle, le formulaire demande les champs correspondants (voir PROJECT.md). Après soumission, affiche un message 'ההרשמה שלך ממתינה לאישור'. En hébreu, RTL."

---

## Étape 5 — Dashboard Admin (jour 3-5)

Fais-le en plusieurs prompts :

> "Crée le layout admin protégé : seuls les users avec role=admin peuvent y accéder. Barre de navigation avec les onglets : לוח בקרה, הרשמות, תפריטים, משתמשות. En hébreu, RTL."

> "Crée la page d'approbation des inscriptions. L'admin voit toutes les inscriptions en attente. Pour chaque יולדת, elle peut approuver et définir le nombre de jours de petit-déjeuner et de semaines de Shabbat. Pour les מתנדבות, juste approuver/refuser."

> "Crée la page de gestion des תפריטים (menus). L'admin peut créer, modifier, supprimer des menus. Chaque menu a un nom, un type (בוקר/שבת ליל/שבת צהריים) et une liste de plats."

> "Crée le tableau de bord admin avec : nombre de יולדות actives, ארוחות de la semaine, ארוחות non couvertes (pas de cuisinière ou pas de livreuse). Vue calendrier de la semaine."

---

## Étape 6 — Dashboard Bénéficiaire (jour 5-6)

> "Crée le dashboard יולדת. Elle voit la liste de ses ארוחות de la semaine. Pour chaque ארוחה : date, type (בוקר/שבת), statut (פנוי/יש מבשלת/בדרך/נמסר), et un bouton 'התקבל' pour confirmer la réception. En hébreu, RTL, design mobile-first."

---

## Étape 7 — Dashboard Cuisinière (jour 6-7)

> "Crée le dashboard מבשלת. Deux sections : 1. ארוחות פנויות — toutes les ארוחות qui n'ont pas encore de cuisinière. Chaque carte montre la date, le type, le תפריט. Bouton 'אני לוקחת' pour réserver. 2. הארוחות שלי — les ארוחות que j'ai prises. Bouton 'מוכן לאיסוף' quand c'est prêt."

---

## Étape 8 — Dashboard Livreuse (jour 7-8)

> "Crée le dashboard מחלקת. Deux sections : 1. משלוחים פנויים — les ארוחות qui ont une cuisinière mais pas de livreuse. 2. המשלוחים שלי — avec pour chaque livraison : כתובת המבשלת, כתובת היולדת, שעת איסוף, שעת מסירה. Boutons 'נאסף' et 'נמסר'."

---

## Étape 9 — Génération automatique des ארוחות (jour 8-9)

> "Quand l'admin approuve une יולדת, le système doit automatiquement créer toutes les ארוחות dans la table meals : une par jour pour les petits-déjeuners (selon num_breakfast_days), et les repas de Shabbat (vendredi soir + samedi midi) pour num_shabbat_weeks semaines. Calcule les dates automatiquement à partir de start_date."

---

## Étape 10 — Webhooks pour n8n (jour 9-10)

> "Crée des API routes sous /api/webhooks/ qui envoient des requêtes POST vers n8n quand : une inscription est créée, une inscription est approuvée, une מתנדבת prend une ארוחה, une ארוחה est marquée 'מוכן לאיסוף', une ארוחה est marquée 'נמסר'. Le payload JSON inclut : phone, event_type, et les données pertinentes."

---

## Étape 11 — n8n Workflows (jour 10-11)

Dans n8n (séparé de Cursor) :
1. Crée un workflow avec un Webhook trigger
2. Selon event_type, envoie un message WhatsApp ou SMS
3. Configure les templates de messages en hébreu

---

## Étape 12 — PWA (jour 11)

> "Configure next-pwa pour que l'app soit installable comme une application sur téléphone. Ajoute le manifest.json avec le nom de l'app, les icônes, le thème color."

---

## Étape 13 — Tests + Corrections (jour 12-14)

- Teste chaque rôle
- Vérifie le RTL partout
- Teste sur mobile (Chrome DevTools)
- Corrige les bugs avec Cursor Agent

---

## Étape 14 — Déploiement (jour 14)

1. Crée un repo GitHub
2. Connecte-le à Vercel
3. Ajoute les variables d'environnement dans Vercel
4. Deploy

---

## Astuces Cursor

- **Si ça ne marche pas** : copie l'erreur dans le chat Cursor et demande de corriger
- **Si le design est moche** : "Améliore le design de cette page. Plus moderne, plus propre, couleurs chaudes."
- **Si c'est lent** : "Optimise les requêtes Supabase sur cette page"
- **Si tu es bloqué** : décris le problème en français dans le chat, Cursor t'aidera
