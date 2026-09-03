# RAUM — Instructions du projet

Site statique HTML/CSS/JS (aucun framework, aucun build) pour RAUM, un concept-demo de café
japonais à Düsseldorf — voir le footer/disclaimer sur chaque page. Déployé sur GitHub Pages :
https://mohamedkourouma7645-svg.github.io/raum-cafe-demo/

## Règles à toujours suivre

- Toujours inspecter le code existant avant de modifier quoi que ce soit.
- Ne jamais supprimer une fonctionnalité existante sans prévenir l'utilisateur.
- Privilégier les composants réutilisables (voir `components/` — Web Components natifs,
  aucune dépendance, voir `components/README.md` pour la convention).
- Le site doit être responsive et fonctionner parfaitement sur mobile.
- Respecter le design actuel du site (palette bone/matcha, polices Cormorant + Manrope,
  `--tokens` CSS dans `style.css`).
- Pour les interactions utilisateur, créer de vrais composants fonctionnels, pas seulement
  des éléments visuels.
- Tester les fonctionnalités après modification (Playwright, WebKit + Chromium, mobile et
  desktop) avant de considérer une tâche terminée.
- Pour les boutons de quantité, utiliser un composant réutilisable avec + et − (voir le
  sélecteur de quantité sur `menu.html` / `script.js`, `.dish-qty`).
- Les quantités doivent toujours être synchronisées avec le panier et le prix total.
- Éviter les dépendances inutiles — pas de framework, pas de bundler, sauf décision
  explicite et déjà discutée avec l'utilisateur.

## Déploiement

`git add -A && git commit -m "..." && git push` — GitHub Pages reconstruit automatiquement.
Bump le cache-busting (`?v=<timestamp>`) sur `style.css`/`script.js` dans les 7 fichiers
`.html` à chaque changement de ces deux fichiers :
```
V=$(date -u +%Y%m%d%H%M)
for f in *.html; do
  sed -i '' -E "s|style\.css\?v=[0-9]+|style.css?v=$V|; s|script\.js\?v=[0-9]+|script.js?v=$V|" "$f"
done
```
Vérifier le déploiement en pollant le contenu réel (pas l'API GitHub, peu fiable) :
```
until curl -s https://mohamedkourouma7645-svg.github.io/raum-cafe-demo/menu.html | grep -q '<marqueur unique>'; do sleep 5; done
```
