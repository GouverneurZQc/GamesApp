# Garde-robe du Mage (personnages VRoid)

20 robes de mage en fantasy réaliste, chacune en **coupe femme** et en **coupe homme** : 40 fichiers `.glb`
prêts à porter sur un personnage VRoid Studio (`.vrm`).

- `glb/femme/NN-nom.glb`, `glb/homme/NN-nom.glb` — les robes. Maillage skinné sur les os VRoid (`J_Bip_…`),
  textures incluses (couleur + relief), 12 000 à 30 000 triangles, 0,5 à 1,6 Mo.
- `glb/mannequin-femme.glb`, `glb/mannequin-homme.glb` — mannequins neutres pour l'essayage.
- `attacher-robe.js` — module three.js qui relie une robe aux os du personnage et l'ajuste à sa taille.
- `essayage.html` — page d'essayage 3D (à servir en HTTP, par ex. `python3 -m http.server` dans ce dossier) :
  choix de la robe et de la coupe, poses (bras baissés, T, marche, course), dépôt d'un `.vrm` personnel.
- `catalogue.json` — nom, thème, description, couleurs, fichiers et nombre de triangles.

## Porter une robe

**three.js + @pixiv/three-vrm**

```js
import { attacherRobe, retirerRobe } from './attacher-robe.js';
const robe = await new GLTFLoader().loadAsync('glb/femme/01-archimage-celeste.glb');
const groupe = attacherRobe(robe.scene, vrm);   // personnage en pose de repos (pose T)
// ... plus tard : retirerRobe(groupe);
```

La robe suit ensuite toutes les animations du personnage (marche, course, etc.). Les modèles VRM 0.x et 1.0
sont reconnus automatiquement.

**Blender** : importer le `.vrm` puis la robe `.glb` ; sur le maillage de la robe, choisir l'armature du
personnage dans le modificateur Armature ; supprimer l'armature importée avec la robe.

## À savoir

- Les robes sont taillées sur le corps VRoid standard (pose T, personnage regardant vers +Z, mètres), avec un
  peu d'aisance. Elles se portent par-dessus une tenue fine ; un haut épais peut dépasser.
- Pour la marche et la course : ourlets aux chevilles, fentes, ampleur, et jupes liées aux deux jambes.
  Il n'y a pas de simulation de tissu : sur de très grands écarts de jambes, l'étoffe s'étire.
- Coupe homme : buste plat, épaules plus larges, hanches plus étroites, taille 1,07 × la coupe femme.

## Régénérer

```
node textures.js <dossier des scans>   # prépare textures/ à partir des étoffes Poly Haven (1k, JPG)
node generer3d.js                      # reconstruit glb/, catalogue.json et essayage.html
```

Fichiers : `catalogue.js` (les 20 robes), `robes3d.js` (formes), `lib3d.js` (moteur : corps, plis, skinning,
export GLB), `lib.js` (motifs tissés), `textures.js`.

## Crédits

Étoffes, cuir, fourrure et daim : textures photographiées de [Poly Haven](https://polyhaven.com) (licence CC0) —
caban, poly_wool_herringbone, rough_linen, hessian_380, velour_velvet, crepe_satin, crepe_georgette,
floral_jacquard, quatrefoil_jacquard_fabric, brown_leather, curly_teddy_natural, scuba_suede, wool_boucle.
