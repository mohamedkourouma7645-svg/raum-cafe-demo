# Composants UI (Web Components natifs)

Pas de dépendance, pas d'étape de build — chaque composant est une classe JS qui étend
`HTMLElement` et s'enregistre via `customElements.define(...)`.

## Pourquoi pas de Shadow DOM

Les composants rendent dans le DOM "normal" (light DOM), pas dans un Shadow DOM. Ça veut
dire qu'ils héritent automatiquement de `style.css` (palette, polices Cormorant/Manrope,
`--tokens`) exactement comme le reste du site — aucune CSS à dupliquer, aucun risque de
décalage visuel avec le design actuel.

## Ajouter un nouveau composant

1. Créer `components/mon-composant.js` :
   ```js
   class MonComposant extends HTMLElement {
     connectedCallback() {
       if (this.dataset.rendered) return;
       // construire le DOM interne ici, en réutilisant les classes CSS existantes
       // (ex: .btn, .card, .dish-qty, etc.) plutôt que d'en inventer de nouvelles
       this.dataset.rendered = 'true';
     }
   }
   customElements.define('mon-composant', MonComposant);
   ```
2. L'ajouter dans `components/index.js` : `import './mon-composant.js';`
3. L'utiliser dans une page : `<mon-composant attribut="valeur">Contenu</mon-composant>`

## Composants disponibles

- **`<ui-button>`** — bouton/lien stylé selon le design du site.
  - `variant="solid"` (défaut) ou `variant="line"`
  - `href="..."` → rend un `<a>` (sinon un `<button>`)
  - `target`, `rel`, `type` → passés tels quels à l'élément généré
  - Exemple : `<ui-button variant="line" href="/menu.html">Voir le menu</ui-button>`

## Utilisation sur une page

Ajouter une seule fois, avant la fermeture de `</body>` :
```html
<script type="module" src="components/index.js"></script>
```
Le tag ne fait rien tant qu'aucun composant custom (`<ui-button>`, etc.) n'est utilisé sur
la page — l'inclure ne change rien à l'existant.

Voir `components/test.html` pour un exemple fonctionnel isolé.
