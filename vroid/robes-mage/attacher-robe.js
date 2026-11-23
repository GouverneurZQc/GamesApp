// Habille un personnage VRoid (VRM chargé avec three.js + @pixiv/three-vrm) avec une robe .glb de ce dossier.
//
//   import { attacherRobe, retirerRobe } from './attacher-robe.js';
//   const robe = await new GLTFLoader().loadAsync('glb/01-archimage-celeste.glb');
//   const maillage = attacherRobe(robe.scene, vrm);   // à appeler quand le personnage est en pose de repos (pose T)
//   ...
//   retirerRobe(maillage);
//
// La robe est liée aux os du personnage (mêmes noms J_Bip_* que VRoid Studio) : elle suit les animations.
// Elle s'adapte aussi à la taille et aux proportions du personnage.
import * as THREE from 'three';

const HUMANOIDE = {
  J_Bip_C_Hips: 'hips', J_Bip_C_Spine: 'spine', J_Bip_C_Chest: 'chest', J_Bip_C_UpperChest: 'upperChest', J_Bip_C_Neck: 'neck', J_Bip_C_Head: 'head',
  J_Bip_L_Shoulder: 'leftShoulder', J_Bip_L_UpperArm: 'leftUpperArm', J_Bip_L_LowerArm: 'leftLowerArm', J_Bip_L_Hand: 'leftHand',
  J_Bip_L_UpperLeg: 'leftUpperLeg', J_Bip_L_LowerLeg: 'leftLowerLeg', J_Bip_L_Foot: 'leftFoot',
  J_Bip_R_Shoulder: 'rightShoulder', J_Bip_R_UpperArm: 'rightUpperArm', J_Bip_R_LowerArm: 'rightLowerArm', J_Bip_R_Hand: 'rightHand',
  J_Bip_R_UpperLeg: 'rightUpperLeg', J_Bip_R_LowerLeg: 'rightLowerLeg', J_Bip_R_Foot: 'rightFoot',
};
const REPLI = { J_Bip_C_UpperChest: 'J_Bip_C_Chest', J_Bip_C_Chest: 'J_Bip_C_Spine', J_Bip_C_Spine: 'J_Bip_C_Hips', J_Bip_C_Neck: 'J_Bip_C_UpperChest',
  J_Bip_L_Shoulder: 'J_Bip_C_UpperChest', J_Bip_R_Shoulder: 'J_Bip_C_UpperChest' };

/**
 * @param {THREE.Object3D} robe   scène du .glb de la robe
 * @param {object} personnage     le VRM (objet renvoyé par three-vrm) ou la racine Object3D du personnage
 * @param {object} [options]      { echelle: nombre } pour forcer l'épaisseur de la robe (1 = telle que modélisée)
 * @returns {THREE.Group} groupe contenant la robe, ajouté au personnage
 */
export function attacherRobe(robe, personnage, options = {}) {
  const racine = personnage.scene || personnage;
  const os = nom => {
    for (let n = nom; n; n = REPLI[n]) {
      const o = (personnage.humanoid && HUMANOIDE[n] && personnage.humanoid.getRawBoneNode(HUMANOIDE[n])) || racine.getObjectByName(n);
      if (o) return o;
    }
    throw new Error(`Os introuvable sur le personnage : ${nom}`);
  };
  racine.updateMatrixWorld(true);
  const invRacine = racine.matrixWorld.clone().invert();
  const repos = o => new THREE.Vector3().setFromMatrixPosition(invRacine.clone().multiply(o.matrixWorld));

  // Un VRM 0.x regarde vers -Z dans son propre repère, un VRM 1.0 vers +Z (comme les robes).
  const versArriere = repos(os('J_Bip_L_UpperArm')).x < repos(os('J_Bip_R_UpperArm')).x;
  const F = new THREE.Matrix4(); if (versArriere) F.makeRotationY(Math.PI);
  const Finv = F.clone().invert();

  const groupe = new THREE.Group(); groupe.name = 'Robe';
  const maillages = []; robe.traverse(o => { if (o.isSkinnedMesh) maillages.push(o); });
  for (const m of maillages) {
    const sq = m.skeleton, posRobe = sq.bones.map((_, i) => new THREE.Vector3().setFromMatrixPosition(sq.boneInverses[i].clone().invert()));
    const iHanches = sq.bones.findIndex(b => b.name === 'J_Bip_C_Hips');
    const echelle = options.echelle || repos(os('J_Bip_C_Hips')).y / posRobe[iHanches].y;
    const cibles = [], inverses = [];
    sq.bones.forEach((b, i) => {
      const cible = os(b.name), pc = repos(cible).applyMatrix4(Finv), pr = posRobe[i];
      // Au repos : sommet -> F * (pc + echelle * (sommet - pr))
      const local = new THREE.Matrix4().makeTranslation(pc.x, pc.y, pc.z).multiply(new THREE.Matrix4().makeScale(echelle, echelle, echelle)).multiply(new THREE.Matrix4().makeTranslation(-pr.x, -pr.y, -pr.z));
      inverses.push(cible.matrixWorld.clone().invert().multiply(racine.matrixWorld).multiply(F).multiply(local));
      cibles.push(cible);
    });
    m.removeFromParent(); m.position.set(0, 0, 0); m.quaternion.identity(); m.scale.set(1, 1, 1);
    groupe.add(m);
    racine.add(groupe); groupe.updateMatrixWorld(true);
    m.bind(new THREE.Skeleton(cibles, inverses), new THREE.Matrix4());
    m.frustumCulled = false;
  }
  racine.add(groupe);
  return groupe;
}

export function retirerRobe(groupe) {
  groupe.removeFromParent();
  groupe.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(mt => { if (mt.map) mt.map.dispose(); mt.dispose(); }); } });
}
