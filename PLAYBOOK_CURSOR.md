# Playbook Cursor — Shifra & Pua (שפרה ופועה)

## Setup — À faire une seule fois

### .cursorrules (remplace le fichier existant)

Tu travailles sur "שפרה ופועה" — PWA de gestion de repas pour femmes qui accouchent à Jérusalem. Stack : Next.js App Router, Supabase, Tailwind, TypeScript. 4 rôles : admin, יולדת, מבשלת, מחלקת. Tout en hébreu RTL, mobile Android first, couleur #811453.

Ces règles sont non-négociables :

AVANT chaque action :
- Vérifie la compatibilité avec PROJECT.md
- Liste les fichiers à créer ou modifier
- Traiter en un seul bloc tout ce qui relève de la même feature ou du même correctif (pas de découpage arbitraire par nombre de fichiers)
- Toujours vérifier que l'action respecte les RLS Supabase existantes

PENDANT l'exécution :
- Faire tout le périmètre cohérent d’un coup (feature complète, correctif complet, toutes les migrations concernées)
- Ne jamais casser ce qui fonctionne déjà (auth, dashboards, Server Actions)
- Si une dépendance nouvelle est nécessaire : installe-la et explique pourquoi en 1 phrase
- Tout texte visible par l'utilisateur DOIT être en hébreu
- Tous les composants doivent être RTL (dir="rtl")
- Boutons tactiles minimum 48px de hauteur

APRÈS chaque action / quand tu décris ce que tu as fait :
- Écrire de la façon la plus courte et concise possible (sauf si l’utilisateur demande de détailler)
- Inclure : résumé minimal + action de test (URL + action) + proposition de commit

EN CAS D'ERREUR / RÉPARATION (dès qu’une erreur est collée) :
- Réfléchir : quelles autres erreurs du même type peuvent exister ? (même pattern, même famille, autres fichiers/migrations)
- Chercher ces occurrences dans le projet, puis corriger automatiquement toutes sans demander confirmation
- Identifie la cause racine — pas juste le symptôme
- Si erreur Supabase RLS : vérifier les policies avant de modifier le code

EN CAS DE DOUTE : arrête-toi et pose une question.

---

### Prompt de démarrage de session

À utiliser à chaque réouverture du projet (Cmd+L) :

@PROJECT.md @RAPPORT_FINAL.md @BUGS.md @AUDIT_SUITE.md

Résume-moi en 5 points :
1. Ce qui est complété et fonctionnel (avec commits)
2. Ce qui était en cours à la dernière session
3. Les bugs connus non résolus (depuis BUGS.md)
4. La prochaine tâche prioritaire selon AUDIT_SUITE.md
5. Premier test visuel à faire pour confirmer que l'app tourne correctement

Attends mes instructions avant toute action.

---

## Exécution d'une tâche

### Prompt standard (Cmd+I → Agent)

@PROJECT.md

Exécute cette tâche : [décris la tâche]

Avant de commencer : liste les fichiers concernés (tu peux enchaîner toutes les modifications liées à cette tâche en un bloc).
Après exécution : résumé visuel + URL à tester + action précise + proposition de commit.
Arrête-toi après avoir livré tout le périmètre de la tâche.

---

## En cas de bug

### Bug simple / Erreur collée

@errors

Ce que je vois à l'écran (ou erreur collée) : [description / copier-coller]

1. Réfléchir : quelles autres erreurs du même type peuvent exister ailleurs (même pattern, même famille) ?
2. Chercher ces occurrences dans le projet.
3. Corriger automatiquement toutes les occurrences en une fois (sans demander avant).
4. Résumer : cause racine + ce qui a été corrigé (fichiers et nombre d’occurrences).

### Bug qui boucle (même erreur 2 fois)

Bascule sur Claude Opus dans le Chat :

@codebase

L'Agent a échoué deux fois sur ce problème : [description]

Tentative 1 : [copie]
Tentative 2 : [copie]

Explique d'abord pourquoi l'approche actuelle échoue logiquement.
Puis propose une seule correction minimale qui traite la cause racine.
Ne donne pas de code immédiatement.

---

## Commit après chaque étape validée

La tâche [description] est validée — [ce qui marche visuellement].
Commit Git : "✅ [nom fonctionnalité] — validé"

Règle absolue : pas de commit = pas d'étape suivante.

---

## Mise à jour du journal

À la fin de chaque session :

Mets à jour JOURNAL.md :
- Date et durée de session
- Tâches complétées avec leurs commits
- Ce qui fonctionne visuellement
- Bugs rencontrés et solutions appliquées
- Prochaine tâche prioritaire
- Premier test visuel à faire à la prochaine session

---

## Rollback si quelque chose casse

Quelque chose s'est cassé après [tâche].
Reviens au dernier commit fonctionnel.
Dis-moi exactement ce que tu as annulé.

---

## Interdits absolus

- Laisser Cursor enchaîner deux tâches sans validation
- Dire "refais tout" ou "optimise tout"
- Continuer sans commit après une tâche réussie
- Démarrer une session sans le prompt de contexte
- Accepter un résultat sans le tester visuellement
- Découper une même feature ou un même correctif en petites étapes sans raison
- Écrire du texte en français dans l'interface utilisateur
- Supprimer ou modifier les RLS Supabase sans vérification

---

## Boucle opérationnelle

```
Démarrage → prompt contexte (@PROJECT.md @JOURNAL.md @BUGS.md)
        ↓
Exécuter une tâche (Agent, tout le périmètre cohérent en un bloc)
        ↓
Tester visuellement sur http://localhost:3000
        ↓
Bug → cause racine → correction ciblée
Boucle 2x → Opus pour diagnostic → solution à l'Agent
        ↓
Validé → Commit Git
        ↓
Journal mis à jour → Tâche suivante
```
