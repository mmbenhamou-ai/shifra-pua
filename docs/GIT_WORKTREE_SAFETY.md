# Sécurité Git / Worktrees — Shifra & Pua

## Contexte

Le **repo principal** (celui qui est poussé sur origin et déployé sur Vercel) est :

```
/Users/mmb/Documents/Cursor/shifra-pua
```

Cursor peut ouvrir des **worktrees** (copies de travail détachées) sous :

```
/Users/mmb/.cursor/worktrees/shifra-pua/keq
/Users/mmb/.cursor/worktrees/shifra-pua/vgy
...
```

Les modifications faites dans un worktree **ne sont pas** dans le repo principal tant qu’elles n’y sont pas recopiées ou mergees. Un `git status` ou `git push` exécuté dans le repo principal ne verra pas les changements faits dans un worktree.

## Règles obligatoires

1. **Toujours travailler dans le repo principal** pour les correctifs et features de prod :  
   `/Users/mmb/Documents/Cursor/shifra-pua`

2. **Avant toute modification**, exécuter et vérifier :
   - `pwd` → doit être le repo principal
   - `git rev-parse --show-toplevel` → doit afficher le chemin du repo principal
   - `git worktree list` → repérer quel répertoire est `[main]`
   - `git status --short` → voir l’état actuel

3. **Ne jamais modifier directement** des fichiers sous  
   `/Users/mmb/.cursor/worktrees/`  
   pour appliquer un fix de prod. Ces dossiers servent à la **lecture / comparaison / copie** vers le repo principal.

4. **Avant de considérer qu’un fix est « fait »** :
   - `git status` dans le repo principal doit montrer les fichiers modifiés
   - `git diff --stat` doit afficher les changements
   - `npm run build` doit réussir dans le repo principal

5. **Commit et push** uniquement depuis le repo principal, après vérification ci‑dessus.

## En cas de doute

Ouvrir le projet Cursor en pointant explicitement sur le repo principal :

```
/Users/mmb/Documents/Cursor/shifra-pua
```

et non sur un chemin sous `.cursor/worktrees/`.
