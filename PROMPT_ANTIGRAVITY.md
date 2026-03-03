# Prompt d'onboarding pour Google Antigravity — Shifra & Pua

Copier-coller le bloc ci-dessous à Google Antigravity pour qu'il prenne connaissance du projet et puisse continuer le développement.

---

## Bloc à envoyer à Antigravity

```
Tu travailles sur le projet **Shifra & Pua (שפרה ופועה)** : une PWA de gestion de repas post-accouchement pour des familles à Jérusalem. L'application permet à des bénévoles (מבשלות = cuisinières, מחלקות = livreuses) d'offrir des repas à des יולדות (bénéficiaires), le tout piloté par une אדמין (administratrice).

**Stack :** Next.js 15+ (App Router), TypeScript, Supabase (PostgreSQL + Auth OTP SMS), Tailwind CSS v4, déploiement Vercel. Interface entièrement en **hébreu**, **RTL**, mobile first.

---

## Où trouver le cahier des charges et la documentation

Tout est à la **racine du dépôt** (ou du dossier projet) :

| Fichier | Rôle |
|--------|------|
| **PROJECT.md** | **Cahier des charges principal** : spécification fonctionnelle en hébreu (4 rôles, types de repas, flux d'inscription, workflow des repas, écrans, notifications). C'est la référence pour toute nouvelle fonctionnalité. |
| **ARCHITECTURE.md** | Stack, structure des routes (app/), schéma DB, RLS, API, variables d'environnement. À lire pour comprendre l'organisation du code. |
| **DESIGN.md** | Design system : tokens CSS (--brand #91006A, fonds, bordures), composants récurrents, principes UI. Utiliser ces tokens (pas de couleurs en dur). |
| **PLAYBOOK_CURSOR.md** | Règles d'exécution : vérifier PROJECT.md avant toute action, traiter une feature en un bloc, tout texte en hébreu, RTL, boutons min 48px, en cas d'erreur chercher les occurrences similaires et tout corriger. |
| **BUGS.md** | Bugs connus (corrigés et ouverts). Consulter avant de toucher aux zones concernées. |
| **AUDIT_SUITE.md** | Plan des prochaines tâches priorisées pour la production. Utiliser pour choisir la prochaine tâche à faire. |
| **README.md** | Démarrage rapide (npm install, .env.local, npm run dev). |
| **GUIDE-DEMARRAGE.md** | Guide pas à pas pour nouveaux contributeurs (setup Supabase, auth, etc.). |

**Règle d'or :** Avant toute modification, vérifier la **compatibilité avec PROJECT.md** et lister les fichiers à créer ou modifier.

---

## Comment analyser le projet pour continuer le développement

1. **Lire en priorité (dans cet ordre)**
   - PROJECT.md — pour le métier et les écrans
   - ARCHITECTURE.md — pour les routes et la DB
   - DESIGN.md — pour les couleurs et composants

2. **Parcourir la structure du code**
   - app/ : pages et layouts par rôle (admin/, beneficiary/, cook/, driver/), plus login, signup, profile, help, about, etc.
   - lib/ : clients Supabase, auth-dev, utils.
   - app/actions/ : Server Actions (meals, release, etc.).
   - supabase/migrations/ : schéma et évolutions SQL.

3. **Conventions à respecter**
   - Tout texte visible par l'utilisateur en **hébreu**.
   - Tous les composants en **RTL** (dir="rtl").
   - Couleurs via **variables CSS** (var(--brand), etc.) — pas de hex en dur pour la marque.
   - Boutons tactiles **min. 48px** de hauteur.
   - En cas de bug : identifier la cause, chercher les **occurrences du même type** dans le projet et corriger en une fois.

4. **Pour enchaîner le développement**
   - Consulter **AUDIT_SUITE.md** pour la prochaine tâche prioritaire.
   - Consulter **BUGS.md** pour les problèmes connus.
   - Pour chaque tâche : lister les fichiers concernés, faire le périmètre complet (feature ou correctif), puis proposer un résumé + test manuel + message de commit.

Tu peux maintenant analyser les fichiers du projet (en commençant par PROJECT.md, ARCHITECTURE.md, DESIGN.md) et poursuivre le développement en appliquant ces règles. Si tu n'as pas accès au repo, demande à l'utilisateur de te fournir le contenu de ces fichiers ou un lien vers le dépôt.
```

---

## Remarques

- **Chemin du projet** : si Antigravity a accès au système de fichiers, lui préciser le chemin du repo (ex. `/Users/mmb/Documents/Cursor/shifra-pua`).
- **Sans accès au repo** : coller en pièce jointe ou en suite de message le contenu de `PROJECT.md`, `ARCHITECTURE.md` et `DESIGN.md` pour la première prise en main.
