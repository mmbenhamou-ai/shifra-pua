# Design — שפרה ופועה

Document de référence pour garder **design et code synchronisés**.  
Les tokens sont définis dans `app/globals.css` (`:root` + `@theme`). Utiliser les variables CSS ou les classes Tailwind générées pour rester cohérent.

---

## Palette principale (Brand)

| Nom token      | Hex       | Usage |
|----------------|-----------|--------|
| `--brand`      | `#91006A` | Boutons principaux, header, liens, titres (aligné Stitch) |
| `--brand-dark` | `#4A0731` | Dégradés (fin), titres forts |
| `--brand-border` | `#F7D4E2` | Bordures cartes, champs, séparateurs |
| `--brand-muted` | `#FBE4F0` | En-têtes de blocs, barres de progression (fond) |
| `--brand-pale`  | `#FFF7FB` | Fond de page, fond champs, états sélectionnés |

**En Tailwind (après @theme)** : `bg-brand`, `text-brand`, `border-brand-border`, `bg-brand-muted`, `bg-brand-pale`, etc.

---

## Arrière-plans de page

- Fond dégradé standard : `linear-gradient(to bottom, var(--page-bg), var(--page-bg-end))`  
  → équivalent `#FFF7FB` → `#FBE4F0`
- Login : `linear-gradient(160deg, var(--gradient-login-start), var(--gradient-login-mid), var(--gradient-login-end))`

---

## Texte secondaire

| Token | Hex | Usage |
|-------|-----|--------|
| `--text-muted`   | `#7C365F` | Sous-titres, légendes, liens secondaires |
| `--text-muted-alt` | `#9B6A8A` | Pied de section (ex. login) |

---

## Sémantique (états)

| Contexte | Fond | Texte |
|----------|------|--------|
| Succès (livré, confirmé) | `--success-bg` (#D1FAE5) | `--success-text` (#065F46) |
| Attention (en attente)   | `--warning-bg` (#FEF3C7) | `--warning-text` (#92400E) |
| Bouton succès (ex. "נמסר") | `--success` / `--success-light` (dégradé) | blanc |

---

## Composants récurrents

- **Carte** : `rounded-2xl` (ou `--radius-card-lg`), `border border-brand-border`, `bg-white`, `shadow-sm`
- **En-tête de carte** : `bg-brand-muted`, `text-brand`
- **Bouton principal** : `bg-brand` (ou dégradé `brand` → `brand-dark`), `text-brand-on`, `rounded-2xl`
- **Bouton secondaire** : `border-brand-border`, `text-brand`, fond blanc ou `brand-pale`
- **Champ formulaire** : `border-2 border-brand-border`, `bg-input-bg`, `focus:border-brand`

---

## Principes (PROJECT.md)

- Mobile-first, RTL, hébreu
- Couleurs chaudes et bienveillantes
- Boutons et zones de tap larges

---

## Synchronisation avec le code

1. **Changer une couleur globalement** : modifier la variable dans `app/globals.css` (`:root`).
2. **Nouveau composant** : utiliser les classes Tailwind du thème (`bg-brand`, `text-brand`, etc.) ou `var(--brand)` en style inline si besoin.
3. **Figma / maquette** : faire correspondre les couleurs de la maquette aux tokens ci-dessus ; en cas de changement design, mettre à jour `globals.css` et ce fichier.

---

## Typographie

- **Police principale** : `system-ui` (San Francisco / Segoe / Roboto), lisible en hébreu.  
- **Hiérarchie** (taille approximative Tailwind) :
  - Titre de page : `text-2xl` / `text-3xl`, `font-semibold`, `text-brand`
  - Titre de section : `text-xl`, `font-semibold`
  - Corps de texte : `text-base`, `text-slate-800`
  - Légendes / hints : `text-sm`, `text-muted`
- **Contraintes** :
  - Toujours garder \(\geq 14px\) pour le texte interactif.
  - Éviter plus de 3 tailles différentes sur un même écran.

---

## Espacements & rayons

- **Espacement vertical par défaut** : `space-y-4` entre les blocs d’UI.
- **À l’intérieur d’une carte** :
  - Padding : `p-4` mobile, `p-6` desktop
  - Espacement entre lignes : `space-y-2` ou `space-y-3`
- **Rayons** :
  - Cartes et boutons principaux : `rounded-2xl`
  - Badges / pills : `rounded-full`

---

## États interactifs

- **Hover** (desktop seulement) :
  - Bouton principal : légère variation de dégradé (`brand` → `brand-dark`), ombre un peu plus marquée.
  - Lignes de liste : `bg-brand-pale`.
- **Focus visible** (accessibilité) :
  - Anneau Tailwind : `focus-visible:ring-2 focus-visible:ring-brand`.
- **Désactivé** :
  - Opacité réduite (`opacity-50`), curseur `not-allowed`, jamais uniquement par la couleur.

---

## Responsive & layout

- **Mobile-first** : maquette de référence = mobile ; le desktop ne doit jamais casser la lecture.
- **Largeurs** :
  - Contenu principal : `max-w-md` / `max-w-lg` centré.
  - Listes : une colonne sur mobile, deux colonnes max sur large screen.
- **Marges** :
  - Marges horizontales : `px-4` mobile, `px-6` / `px-8` desktop.

---

## Patterns spécifiques (exemples)

- **Liste de livraisons** :
  - Carte par livraison, état (succès / attente) via les tokens sémantiques.
  - Bouton d’action principal (ex. marquer comme livré) toujours aligné à droite (RTL).
- **Écran de login** :
  - Fond dégradé `gradient-login-*`.
  - Carte centrée, avec en-tête `bg-brand-muted` et titre `text-brand`.

---

## Formulaires & inputs

- **Structure** :
  - Label au-dessus du champ, aligné à droite (RTL), `text-sm` et `text-muted`.
  - Message d’aide (optionnel) sous le champ, `text-xs text-muted-alt`.
- **Champs texte** :
  - `border-2 border-brand-border bg-input-bg rounded-2xl px-4 py-3`
  - Placeholder plus clair que le texte (\(\approx\) `text-muted-alt`).
- **Erreurs** :
  - Bordure `border-red-300` + message `text-xs text-red-700`.
  - Optionnel : petite icône d’erreur alignée à gauche du champ (RTL).

---

## Feedback & toasts

- **Toast de succès** :
  - Fond `--success-bg`, texte `--success-text`, icône check.
  - Durée courte (3–4s), possibilité de fermer manuellement.
- **Toast d’erreur** :
  - Fond proche `#FEE2E2`, texte `#B91C1C`.
- **Position** :
  - En bas de l’écran sur mobile (au-dessus de la navigation / CTA).

---

## Accessibilité (a11y)

- Contraste suffisant entre texte et fond (viser \(\geq 4.5:1\) pour le texte principal).
- Ne jamais coder un état uniquement par la couleur (ajouter icône, texte ou motif).
- Focus visible toujours activé sur les éléments interactifs.
- Zones de tap \(\geq 44x44px\).

---

## États vides & erreurs d’écran

- **État vide** :
  - Illustration simple / icône douce, texte court et positif.
  - Appel à l’action clair (ex. ajouter une livraison).
- **Erreur globale (ex. réseau)** :
  - Message clair en une phrase, ton empathique.
  - Bouton de retry principal en `bg-brand`.
- **404 / contenu manquant** :
  - Illustration légère, lien retour vers l’écran principal.

---

## Iconographie & langage visuel

- Icônes simples, peu détaillées, avec traits arrondis.
- Utiliser la même icône pour la même action sur tout le produit.
- Éviter les icônes ambiguës sans label : privilégier `icône + texte`.

---

## Navigation

- Navigation principale pensée pour le mobile :
  - Soit barre du bas, soit liste dans une vue principale.
- Toujours indiquer visuellement où l’on se trouve (titre de page clair, éventuellement breadcrumb simplifié).
- Les actions critiques (valider, enregistrer, marquer comme livré) sont toujours dans un CTA principal en bas de l’écran.

---

## Motion & micro‑interactions

- Animations discrètes, rapides (\(\leq 200ms\)), sans rebond agressif.
- Transitions possibles :
  - Survol / pression de bouton : légère variation d’ombre et d’échelle (\(\leq 1.02\)).
  - Apparition des toasts : fade + slide léger depuis le bas.
- Éviter les animations continues (clignotements, auto‑scroll) qui fatiguent.

---

## Spécificités RTL & hébreu

- Tout le layout part de la droite : alignement des titres, labels et CTA principaux à droite.
- Icônes directionnelles inversées (ex. flèches retour → vers la droite).
- Quand un texte mélange hébreu + chiffres / anglais, vérifier que l’affichage reste lisible (tester dans l’UI).
