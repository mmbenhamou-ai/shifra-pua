Tu travailles sur le projet **Shifra & Pua (שפרה ופועה)** : une PWA de coordination logistique solidaire pour des repas post-accouchement à Jérusalem.

L’application permet à :
- des יולדות (bénéficiaires)
- des מבשלות (cuisinières bénévoles)
- des מחלקות (livreuses bénévoles)
- une אדמין (administratrice)

de coordonner la préparation et la livraison de repas (petits-déjeuners + Shabbat) via un workflow structuré inspiré de Wolt, mais dans un cadre communautaire non commercial.

---

# 🎯 Objectif produit

Créer une plateforme :

- Ultra simple (1 action principale par écran)
- Mobile-first (Android prioritaire)
- 100 % hébreu, RTL
- Robuste en cas d’usage réel (concurrence, double clic, latence)
- Sécurisée via RLS Supabase strictes
- Stable en production Vercel

La priorité est la fiabilité logistique, pas l’optimisation esthétique.

---

# ⚙️ Stack technique

- Next.js 15+ (App Router, Server Actions)
- TypeScript strict
- Supabase (PostgreSQL + Auth OTP SMS)
- RLS activées
- Tailwind CSS v4
- Vercel (preview + production)
- n8n (webhooks WhatsApp)
- PWA (manifest + offline)

---

# 📚 Documentation à lire (ordre obligatoire)

1. PROJECT.md → logique métier complète (source de vérité)
2. ARCHITECTURE.md → structure routes + DB + RLS
3. DESIGN.md → design tokens (var(--brand)), règles UI
4. PLAYBOOK_CURSOR.md → règles strictes d’exécution
5. BUGS.md → bugs ouverts et corrigés
6. AUDIT_SUITE.md → roadmap production

Règle absolue :
Ne jamais implémenter une feature qui contredit PROJECT.md.

---

# 🔐 Points critiques à ne jamais casser

1. Auth Supabase (OTP SMS)
2. RLS Supabase existantes
3. Workflow repas :
   open → cooking → ready → delivering → delivered → confirmed
4. Anti-conflit :
   Impossible que deux bénévoles prennent le même item
5. Respect strict RTL
6. Couleurs via tokens CSS uniquement (pas de hex en dur)

---

# 🧠 Conventions obligatoires

- Texte utilisateur : hébreu uniquement
- dir="rtl" sur tous les layouts
- Boutons min 48px height
- 8px spacing system
- Une feature = un bloc complet (pas de patch partiel)

---

# 🚦 Méthode pour continuer le développement

Pour chaque nouvelle tâche :

1. Vérifier compatibilité avec PROJECT.md
2. Lister fichiers concernés
3. Vérifier impact RLS
4. Implémenter la feature complète
5. Fournir :
   - Résumé visuel (ce que l’utilisateur voit)
   - Test manuel précis
   - Message de commit proposé

---

# 🧯 En cas de bug

- Identifier la cause racine
- Chercher occurrences similaires dans le codebase
- Corriger toutes les occurrences similaires en une seule fois
- Ne jamais patcher seulement le symptôme

---

# 🎨 Relation Design (Stitch) → Code

Le design est défini dans DESIGN.md et via Stitch.
Ne pas modifier la structure UX sans justification.
Le code doit traduire l’intention visuelle, pas réinventer le layout.

---

# 📈 Priorité stratégique actuelle

La priorité n’est pas d’ajouter des fonctionnalités.
La priorité est :

1. Robustesse anti-conflits
2. Cohérence RLS
3. Stabilité production
4. UX simple et fluide

---

Tu peux maintenant analyser le projet (PROJECT.md, ARCHITECTURE.md, DESIGN.md) et proposer :
- Un audit technique structuré
- Les risques critiques
- Les améliorations prioritaires
- La prochaine tâche à implémenter selon AUDIT_SUITE.md

Si tu n’as pas accès aux fichiers, demande-les explicitement.