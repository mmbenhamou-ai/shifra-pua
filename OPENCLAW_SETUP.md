# OpenClaw sur VPS (Oracle Cloud) + Telegram + node Mac

Installation propre : **Gemini 2.5 et 2.0 uniquement** (primary 2.5-flash, fallback 2.0-flash). Tout par scripts.

## Fichiers du dépôt

| Fichier | Rôle |
|--------|------|
| **openclaw-uninstall-all.sh** | Tout désinstaller (conteneur, config). Option `-k` : garde une sauvegarde de ~/.openclaw. |
| **openclaw-install-ubuntu.sh** | **Installation propre** : Docker, jq, config Gemini 2.5/2.0, gateway (bind lan + controlUi), ~/.openclaw/env, conteneur. |
| **openclaw-gemini-only.sh** | Injecte GEMINI_API_KEY et force la config Gemini 2.5 + 2.0 uniquement. À lancer après avoir rempli ~/.openclaw/env. |
| **openclaw-env.example** | Exemple : une ligne `export GEMINI_API_KEY="..."`. L’install crée ~/.openclaw/env automatiquement. |
| **openclaw-openclaw.json.example** | Référence (Gemini 2.5 + 2.0, gateway, Telegram). |
| **openclaw-run.sh** | Vérifie token + clé Gemini puis lance le bot (une seule commande après avoir rempli les secrets). |
| **openclaw-check.sh** | Diagnostic : config, token Telegram, clé Gemini, conteneur, logs. À lancer si le bot ne répond pas. |
| **openclaw-mac-node.md** | Guide : tunnel SSH, node Mac, approbation. |

## Ordre recommandé (réinstallation propre)

### 1. Tout désinstaller (si tu avais une ancienne install)

```bash
bash openclaw-uninstall-all.sh
# ou avec sauvegarde : bash openclaw-uninstall-all.sh -k
```

### 2. Installation propre

```bash
bash openclaw-install-ubuntu.sh
```

Exécuter en tant qu’utilisateur qui garde la config (ex. `ubuntu`). Le script crée ~/.openclaw avec la bonne config (Gemini 2.5/2.0, gateway) et ~/.openclaw/env.

### 3. Renseigner les secrets

```bash
nano ~/.openclaw/env      # mettre : export GEMINI_API_KEY="ta-clé"
nano ~/.openclaw/openclaw.json   # remplacer REMPLACER_PAR_BOT_TOKEN_TELEGRAM et REMPLACER_PAR_TOKEN_GATEWAY_FORT
```

### 4. Lancer le bot

Depuis le dossier du dépôt sur le VPS :

```bash
bash openclaw-run.sh
```

Le script vérifie token Telegram et clé Gemini ; si tout est OK, il recrée le conteneur et lance le bot. Sinon il affiche quoi corriger.

(Reconnecte-toi en SSH si besoin pour utiliser `docker` sans sudo.)

### 5. Tester le bot Telegram

1. **Créer un bot** : sur Telegram, parler à [@BotFather](https://t.me/BotFather), `/newbot`, noter le token (ex. `7123456789:AAH...`).
2. **Config** : dans `~/.openclaw/openclaw.json`, remplacer `REMPLACER_PAR_BOT_TOKEN_TELEGRAM` par ce token (dans `channels.telegram.botToken`).
3. **Redémarrer** : `bash openclaw-run.sh`
4. **Tester** : ouvrir le bot sur Telegram, envoyer `/start` ou un message ; le bot doit répondre via Gemini.

En groupe : le bot ne réagit que si on le mentionne (config `requireMention: true`).

#### Le bot ne répond pas — à vérifier sur le VPS

**D’abord lancer le diagnostic :** `bash openclaw-check.sh` (ou tout corriger puis `bash openclaw-run.sh`) (depuis le dépôt sur le VPS). Il affiche les erreurs (token, clé, conteneur) et les derniers logs.

Puis vérifier à la main si besoin :

1. **Token Telegram** : dans `~/.openclaw/openclaw.json`, `channels.telegram.botToken` doit être le vrai token du bot (BotFather), sans espaces, pas `REMPLACER_...`.
2. **Conteneur** : `docker ps | grep openclaw` → le conteneur doit tourner. Sinon : `bash openclaw-run.sh`
3. **Clé Gemini** : le conteneur doit avoir `GEMINI_API_KEY` (injectée par `openclaw-run.sh` (qui appelle openclaw-gemini-only.sh) après avoir rempli `~/.openclaw/env`). Vérifier : `docker exec openclaw env | grep GEMINI`
4. **Logs** : `docker logs openclaw --tail 100` — erreurs Telegram (webhook/polling) ou erreurs API Gemini (quota, clé invalide).
5. **« All models failed » / rate limit** : si d’autres modèles qu’Gemini apparaissent dans l’erreur, relancer **`bash openclaw-run.sh`** pour forcer la config Gemini 2.5 + 2.0 uniquement. Si seul Gemini est en rate limit : attendre quelques minutes ou vérifier le quota dans Google AI Studio.
6. **DM vs groupe** : en conversation privée le bot répond à tout message ; en groupe il faut **mentionner** le bot (ex. `@TonBot dis bonjour`).

### 6. Node sur le Mac (contrôle du Mac par le bot)

Voir **openclaw-mac-node.md** : tunnel SSH (port 18790 si 18789 pris), `openclaw node run`, puis `devices approve --latest` ou `nodes approve` sur le serveur.

## Récap

- **Tout désinstaller** → openclaw-uninstall-all.sh (option `-k` pour garder une sauvegarde)
- **Install propre** → openclaw-install-ubuntu.sh → éditer env + openclaw.json → openclaw-run.sh
- **Test Telegram** → token @BotFather dans `openclaw.json` → openclaw-run.sh → envoyer un message au bot
- **Node Mac** → openclaw-mac-node.md
