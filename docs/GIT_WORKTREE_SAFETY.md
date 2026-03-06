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

## Vérifier le repo actif

Dans le terminal (ou avant toute édition) :

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git worktree list
git status --short
```

- Si `pwd` ou `--show-toplevel` est un chemin sous `/Users/mmb/.cursor/worktrees/`, vous n’êtes **pas** dans le repo principal.
- Le repo principal est le seul qui affiche `[main]` dans `git worktree list`.

## Repérer un repo imbriqué

Un sous-dossier peut avoir son propre `.git` (ex. `stitch-skills/`). Pour lister les `.git` dans le projet :

```bash
find /Users/mmb/Documents/Cursor/shifra-pua -maxdepth 3 -name .git 2>/dev/null
```

Ne pas confondre le repo Shifra & Pua avec un sous-repo : les correctifs applicatifs doivent aller dans le repo principal, pas dans un sous-repo.

## Pourquoi ne jamais modifier /Users/mmb/.cursor/worktrees/

Les worktrees Cursor sont des copies de travail souvent en **detached HEAD**. Les changements y restent invisibles pour le repo principal : `git status`, `git push` et Vercel ne les voient pas. Modifier un worktree donne l’illusion qu’un fix est fait alors qu’il n’est pas déployé.

## Vérifier qu’un fix existe vraiment

Un fix n’est réel que s’il est dans le repo principal :

1. `cd /Users/mmb/Documents/Cursor/shifra-pua`
2. `git status --short` → les fichiers modifiés doivent apparaître
3. `git diff --stat` → les changements doivent être listés
4. Après commit : `git log -1 --oneline` pour confirmer le commit
5. Après push : le déploiement Vercel reflète le repo principal
