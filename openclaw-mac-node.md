# Contrôler ton Mac depuis OpenClaw (Telegram)

Pour que le bot OpenClaw sur le serveur Oracle puisse **exécuter des commandes sur ton Mac**, il faut faire tourner un **node** OpenClaw sur le Mac, connecté au même gateway.

## Principe

- **Gateway** = sur le serveur (92.5.2.68), déjà en place.
- **Node** = petit client sur ton Mac ; il se connecte au gateway en WebSocket et expose `system.run` / `system.which` sur le Mac.
- Quand tu parles au bot Telegram, l’agent peut utiliser l’outil **exec** avec `host: "node"` et le `node` = ton Mac ; la commande s’exécute sur le Mac.

## Étape 1 : Installer OpenClaw sur le Mac

Sur ton Mac (Terminal) :

```bash
# Avec npm (si Node.js est installé)
npm install -g openclaw

# Ou avec Homebrew si disponible
brew install openclaw
```

Vérifier : `openclaw --version`

## Étape 2 : Connexion du node au gateway

Deux façons selon comment tu exposes le gateway.

### Option A – Tunnel SSH (recommandé si pas de domaine)

Le port 18789 n’est pas exposé sur Internet ; on le rend accessible **uniquement depuis ton Mac** via SSH.

1. **Sur le Mac**, ouvre un tunnel (à garder ouvert). Si le port 18789 est déjà pris, utilise 18790 :

   ```bash
   ssh -N -L 18790:127.0.0.1:18789 -i ~/Downloads/ssh-key-2026-03-01-2.key ubuntu@92.5.2.68
   ```

2. **Sur le serveur**, récupère le token : `sudo cat /home/ubuntu/.openclaw/openclaw.json | grep -o '"token": "[^"]*"'` (prends la valeur de `gateway.auth.token`).

3. **Dans un autre terminal sur le Mac**, exporte le token puis lance le node (port 18790 si tu as utilisé 18790 ci‑dessus) :

   ```bash
   export OPENCLAW_GATEWAY_TOKEN="COLLE_ICI_LE_TOKEN_DU_SERVEUR"
   openclaw node run --host 127.0.0.1 --port 18790 --display-name "Mac mini de MMB"
   ```

4. **Sur le serveur**, approuve le node la première fois (la demande peut être sous « devices », pas « nodes ») :

   ```bash
   docker exec -it openclaw sh -c "cd /app && node openclaw.mjs nodes pending"
   docker exec -it openclaw sh -c "cd /app && node openclaw.mjs nodes approve REQUESTID"
   ```
   Si « No pending pairing requests », essaie :  
   `docker exec -it openclaw sh -c "cd /app && node openclaw.mjs devices approve --latest"`

Après approbation, le node reste connecté ; le bot peut envoyer des commandes **exec** sur ce node (ton Mac).

### Option B – Gateway exposé (WSS ou port 18789)

Si tu as un domaine avec Caddy (HTTPS) qui fait `reverse_proxy` vers `127.0.0.1:18789` :

- Sur le Mac :  
  `openclaw node run --host ton-domaine.com --port 443 --tls --display-name "Mac mini de MMB"`

Si tu préfères exposer le port 18789 en clair (moins sécurisé) :

- Sur le serveur : modifier le `docker run` pour mapper `-p 18789:18789` (au lieu de `127.0.0.1:18789`) et ouvrir le port 18789 dans la Security List OCI.
- Sur le Mac :  
  `openclaw node run --host 92.5.2.68 --port 18789 --display-name "Mac mini de MMB"`

Puis, comme en A, approuver le node depuis le gateway : `openclaw nodes pending` → `openclaw nodes approve <requestId>`.

## Étape 3 : Autoriser les commandes (exec approvals)

Par défaut, les commandes exécutées sur un node sont soumises aux **exec approvals** du gateway.

- Sur le serveur (ou dans le conteneur) :  
  `openclaw approvals --node <node-id>`  
  pour configurer ce qui est autorisé (allowlist, demander confirmation, etc.).
- Voir aussi : [Exec approvals](https://docs.openclaw.ai/tools/exec-approvals) et `~/.openclaw/exec-approvals.json`.

## Résumé

| Où          | Action |
|------------|--------|
| **Mac**    | Installer OpenClaw, lancer le tunnel SSH (option A) puis `openclaw node run ... --display-name "Mac mini de MMB"` avec le bon `--host` / `--port` (et `--tls` si WSS). |
| **Serveur**| Approuver le node une fois : `openclaw nodes pending` → `openclaw nodes approve <requestId>`. |
| **Telegram** | Demander au bot d’exécuter une action ; l’agent utilisera l’outil exec vers le node « Mac mini de MMB ». |

Tant que le node tourne sur le Mac et est approuvé, le bot peut contrôler ton Mac (commandes autorisées par les exec approvals).

---

## Dépannage : « socket hang up » / 1006

Si le node affiche `gateway connect failed: socket hang up` et `gateway closed (1006)` :

### 1. Vérifier que le tunnel est bien actif

**Sur le Mac**, dans un terminal **où le tunnel SSH tourne** (la commande `ssh -N -L 18789:...` doit rester ouverte) :

```bash
# Dans un autre terminal sur le Mac :
curl -v http://127.0.0.1:18789/
```

- Si **« Connection refused »** : le tunnel n’est pas actif ou tu as lancé `curl` dans le même terminal que le tunnel (il ne peut pas faire les deux). Lance le tunnel dans un terminal dédié, puis `curl` dans un second.
- Si tu reçois une **réponse HTTP** (même 404 ou erreur) : le tunnel et le gateway répondent ; le souci vient probablement du protocole WebSocket ou de la config gateway (voir ci‑dessous).

### 2. Vérifier le gateway sur le serveur

En SSH sur le serveur (92.5.2.68) :

```bash
# Le conteneur tourne ?
docker ps | grep openclaw

# Le gateway répond en local ?
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/
```

Si le conteneur est arrêté : `docker start openclaw`. Si `curl` ne renvoie pas un code HTTP (ex. 200, 404), le gateway à l’intérieur du conteneur ne répond pas.

### 3. Logs du gateway au moment de la connexion du node

Sur le serveur, **juste après** avoir relancé le node sur le Mac (et vu l’erreur 1006) :

```bash
docker logs openclaw --tail 80
```

Regarder s’il y a une erreur au moment où le node se connecte (refus, auth, TLS, etc.). Ça permet de savoir si le gateway ferme la connexion et pourquoi.

### 4. Envoyer le token du gateway au node

Si le gateway a `gateway.auth.token` dans sa config, le node **doit** envoyer ce même token, sinon la connexion est fermée (1006). Sur le Mac :

```bash
export OPENCLAW_GATEWAY_TOKEN="<token_du_serveur>"
openclaw node run --host 127.0.0.1 --port 18789 --display-name "Mac mini de MMB"
```

Le token est dans `~/.openclaw/openclaw.json` sur le serveur (champ `gateway.auth.token`).

### 5. Approuver le node depuis le conteneur

Sur le serveur, la CLI OpenClaw est dans le conteneur, pas sur l’hôte. Utiliser :

```bash
docker exec -it openclaw sh -c "cd /app && node openclaw.mjs nodes pending"
docker exec -it openclaw sh -c "cd /app && node openclaw.mjs nodes approve REQUESTID"
```

Si « No pending pairing requests », essayer :  
`docker exec -it openclaw sh -c "cd /app && node openclaw.mjs devices approve --latest"`
