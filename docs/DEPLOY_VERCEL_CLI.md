# Déploiement Vercel via CLI (sans Git)

Ce guide explique comment déployer Shifra & Pua sur Vercel en ligne de commande, sans passer par l’intégration Git.

---

## 1. Où se placer

1. Ouvrir un terminal.
2. Se placer dans le dossier du projet :

   ```bash
   cd /Users/mmb/Documents/Cursor/shifra-pua
   ```

3. Vérifier que vous êtes bien dans le bon dossier :

   ```bash
   ls
   ```

   Vous devez voir au minimum `package.json`, `next.config.ts` (ou `next.config.js`), `app/`, `supabase/`, etc.

4. (Optionnel) Vérifier rapidement le `package.json` :

   ```bash
   cat package.json | head
   ```

   Cela permet de confirmer que c’est bien un projet Next.js prêt à être déployé.

---

## 2. Lier le projet au projet Vercel existant

Depuis le dossier du projet :

```bash
vercel link
```

Vercel va poser plusieurs questions (en anglais) :

- **"Set up and deploy?"**
  - Si vous n’êtes pas sûr d’être au bon endroit ➔ répondez `n` (NO) et recommencez après avoir vérifié le dossier.
  - Si vous êtes bien dans le dossier du projet ➔ répondez `y` (YES).
- **"Link to existing project?"**
  - Répondez `y` (YES).
  - Sélectionnez le projet correspondant à Shifra & Pua (nom tel que configuré sur Vercel, par ex. `shifrapua`).

Une fois le lien effectué, Vercel va mémoriser l’association entre ce dossier et le projet Vercel.

---

## 3. Récupérer les variables d’environnement Vercel

Toujours dans le dossier du projet :

```bash
vercel env pull
```

- Cette commande crée (ou met à jour) un fichier `.env.local` à la racine du projet.
- Vérifiez sa présence :

  ```bash
  ls .env.local
  ```

Si des variables manquent, il faudra les ajouter dans le Dashboard Vercel (onglet **Environment Variables**), puis relancer `vercel env pull`.

---

## 4. Préflight de configuration

Avant de déployer, lancez le script de préflight pour vérifier la configuration minimale :

```bash
node scripts/preflight-prod.js
```

- Si le script affiche des erreurs de **niveau 1** (variables obligatoires manquantes), corrigez-les dans Vercel (et/ou localement) avant de continuer.
- Des warnings de niveau 2/3 sont tolérés pour un premier MVP si les fonctionnalités associées ne sont pas encore activées.

---

## 5. Déployer en production

Une fois le préflight OK :

```bash
vercel --prod
```

- La CLI va construire le projet et le déployer sur l’URL de production configurée.
- À la fin, Vercel affiche l’URL du déploiement (par ex. `https://shifra-pua.vercel.app`).

Vous pouvez relancer `vercel --prod` à chaque nouvelle version validée par les tests.

---

## 6. Sans GitHub (ou GitLab)

Il n’est **pas nécessaire** d’avoir GitHub connecté pour utiliser Vercel :

- La CLI `vercel` suffit pour construire et déployer depuis votre machine.
- Plus tard, vous pourrez connecter un dépôt Git si vous souhaitez automatiser les déploiements :
  - créer un dépôt Git (`git init`),
  - pousser sur GitHub/GitLab,
  - connecter ce dépôt dans le Dashboard Vercel au même projet.

Mais pour le MVP, la combinaison :

```bash
vercel link
vercel env pull
node scripts/preflight-prod.js
vercel --prod
```

est suffisante pour déployer et mettre à jour l’app.

---

## 7. Dépannage (erreurs fréquentes)

### 7.1 "There are no files inside your deployment"

**Cause probable** : vous avez lancé `vercel` depuis un dossier vide ou le home directory (`~`).

**Correctif** :

1. Quitter la CLI (`Ctrl+C`).
2. Revenir dans le dossier du projet :
   ```bash
   cd /Users/mmb/Documents/Cursor/shifra-pua
   ```
3. Vérifier la présence de `package.json` :
   ```bash
   ls package.json
   ```
4. Relancer :
   ```bash
   vercel link
   vercel --prod
   ```

### 7.2 "No framework detected"

**Cause probable** : Vercel ne voit pas de projet Next.js (pas de `package.json`/`next.config`).

**Correctif** :

- Vérifier que vous êtes bien dans le dossier du projet (voir section 1).
- Vérifier que `package.json` contient bien `next`, `react`, etc.

### 7.3 Variables Supabase manquantes

**Symptôme** : erreurs 500 côté API (ex. "Supabase URL missing", "Missing env var"), ou preflight qui échoue.

**Correctif** :

1. Aller dans le Dashboard Vercel → Project → **Environment Variables**.
2. Ajouter/compléter les variables requises (voir `docs/VERCEL_SUPABASE_SETUP.md`).
3. Relancer :
   ```bash
   vercel env pull
   node scripts/preflight-prod.js
   vercel --prod
   ```

### 7.4 Erreurs type `ENOTEMPTY: directory not empty, rmdir '.next/server'`

**Symptôme** : build local cassé ou dossier `.next` incohérent.

**Correctif** :

```bash
rm -rf .next
npm run build
```

Si le build passe en local, vous pouvez relancer le déploiement Vercel.

---

## 8. Post-deploy checks

Après un déploiement réussi, valider :

1. **Guards de dev désactivés en prod**
   - `curl -I https://<votre-domaine>/test-login` → HTTP 404
   - `curl -I https://<votre-domaine>/api/dev-login` → HTTP 404

2. **Login normal**
   - Ouvrir `https://<votre-domaine>/login` dans un navigateur.
   - Effectuer un parcours de login OTP (bénéficiaire ou bénévole) et vérifier l’accès aux tableaux de bord.

3. **Webhooks n8n**
   - Provoquer un événement connu (ex : inscription validée, repas pris, etc.).
   - Vérifier dans n8n que le webhook associé a bien été reçu avec le header `x-webhook-secret` correspondant à votre `WEBHOOK_SECRET`.

4. **Cron recover-stuck**
   - Appeler la route cron sans token :
     ```bash
     curl -I https://<votre-domaine>/api/cron/recover-stuck
     ```
     → doit renvoyer 401/403 (non autorisé).
   - Appeler la même route avec le bon Bearer token (CRON_SECRET) pour tester en manuel :
     ```bash
     curl -I -H "Authorization: Bearer <CRON_SECRET>" https://<votre-domaine>/api/cron/recover-stuck
     ```
     → doit renvoyer 200 et/ou un JSON `{ ok: true, ... }`.

Ces vérifications valident que les guards de sécurité sont bien en place et que l’intégration Supabase/n8n fonctionne.
