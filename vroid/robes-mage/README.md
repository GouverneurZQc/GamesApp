# Garde-robe du Mage (personnage VRoid)

20 robes pour la classe Mage : chacune a sa propre silhouette, sa palette et son tissu.

- `index.html` — planche des 20 robes (à ouvrir dans un navigateur).
- `apercus/` — une illustration SVG par robe.
- `tissus/` — une texture PNG 1024 × 1024 raccordable par robe, à importer comme calque dans l'éditeur de texture de VRoid Studio.
- `robes.json` — nom, thème, couleurs (hex), silhouette, manches, détails, coiffe et base VRoid conseillée.

Les fichiers sont générés par `node generer.js` (ajouter `--png` pour refaire les textures, nécessite Playwright).
Pour modifier ou ajouter une robe : `robes.js`.
