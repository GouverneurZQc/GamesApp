#!/usr/bin/env node
'use strict';
// Génère les robes en 3D : glb/femme/NN-id.glb et glb/homme/NN-id.glb (maillage skinné sur le squelette VRoid,
// textures incluses), les mannequins d'essayage, catalogue.json et la page essayage.html.
//   node generer3d.js [id ...]        (les textures doivent exister : node textures.js <scans>)
const fs = require('fs');
const path = require('path');
const L = require('./lib3d');
const catalogue = require('./catalogue');
const formes = require('./robes3d');

const TEX = path.join(__dirname, 'textures'), IDX = JSON.parse(fs.readFileSync(path.join(TEX, 'index.json')));
const TILE = { caban: 0.35, poly_wool_herringbone: 0.3, rough_linen: 0.35, hessian_380: 0.3, velour_velvet: 0.4, crepe_satin: 0.5, crepe_georgette: 0.4, floral_jacquard: 0.45,
  quatrefoil_jacquard_fabric: 0.3, brown_leather: 0.4, curly_teddy_natural: 0.25, scuba_suede: 0.35, wool_boucle: 0.3 };
const tx = n => path.join(TEX, n + '.jpg');

// Trousse de matières d'une robe.
function trousse(b, R, num) {
  const scan = (name, sc, color, o = {}) => b.mat(name, { color, gain: IDX[sc].gain, tex: tx(sc + (o.big ? '' : '-512')), normal: tx(sc + '-relief'), rough: o.rough === undefined ? IDX[sc].rough : o.rough, tile: TILE[sc] });
  return {
    fab: R.tisse ? b.mat('etoffe', { tex: tx(`${num}-${R.id}-tissu`), normal: tx(R.scan + '-relief'), rough: IDX[R.scan].rough, tile: 0.5 }) : scan('etoffe', R.scan, R.base, { big: true }),
    galon: b.mat('galon', { tex: tx(`${num}-${R.id}-galon`), rough: 0.5, metallic: 0.3 }),
    cloth: (n, c, sc = 'caban') => scan(n, sc, c), linen: (n, c) => scan(n, 'rough_linen', c), satin: (n, c) => scan(n, 'crepe_satin', c), velvet: (n, c) => scan(n, 'velour_velvet', c),
    leather: (n, c) => scan(n, 'brown_leather', c, { rough: 0.5 }), suede: (n, c) => scan(n, 'scuba_suede', c), fur: (n, c) => scan(n, 'curly_teddy_natural', c, { rough: 1 }),
    metal: (n, c, rough = 0.3) => b.mat(n, { color: c, metallic: 1, rough }),
    gem: (n, c, alpha) => b.mat(n, { color: c, rough: 0.08, metallic: 0.05, emissive: '#' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * 0.25).toString(16).padStart(2, '0')).join(''), ...(alpha ? { alpha } : {}) }),
    flat: (n, def) => b.mat(n, def),
  };
}

// Mannequin neutre pour l'essayage (même squelette que les robes).
function mannequin(sexe) {
  const b = new L.Builder(sexe), m = b.mat('mannequin', { color: sexe === 'h' ? '#aab0bb' : '#b9b3c4', rough: 0.75 }), { lerp, sstep, ARM_Y, ARM_Z } = L;
  const wLeg = p => { const S = p[0] >= 0 ? 'L' : 'R', low = sstep(0.56, 0.47, p[1]), foot = sstep(0.14, 0.08, p[1]); return [[`J_Bip_${S}_UpperLeg`, 1 - low], [`J_Bip_${S}_LowerLeg`, low * (1 - foot)], [`J_Bip_${S}_Foot`, foot]].filter(e => e[1] > 1e-3); };
  const pw = pts => x => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], sstep(pts[i - 1][0], pts[i][0], x)); return pts[pts.length - 1][1]; };
  b.garment(m, { hemY: 0.84, fit: -0.014, folds: false, nu: 48 });
  b.ball(m, [0, 0.86, 0], 1, { scale: [0.165, 0.09, 0.12], nu: 24, nv: 10 });
  const lr = pw([[0.08, 0.036], [0.3, 0.052], [0.5, 0.05], [0.7, 0.07], [0.88, 0.078]]);
  for (const s of [1, -1]) {
    b.tube(m, t => [0.082 * s, lerp(0.9, 0.08, t), -0.004 - 0.02 * t], t => lr(lerp(0.9, 0.08, t)), { nu: 16, nv: 24, skin: wLeg });
    b.ball(m, [0.082 * s, 0.045, 0.035], 1, { scale: [0.045, 0.042, 0.11], nu: 12, nv: 8, skin: L.rigid(`J_Bip_${s > 0 ? 'L' : 'R'}_Foot`) });
    b.sleeve(m, s, { r: pw([[0.1, 0.05], [0.3, 0.04], [0.56, 0.027]]), x1: 0.57, wrinkle: false, nu: 16 });
    b.ball(m, [0.62 * s, ARM_Y, ARM_Z], 1, { scale: [0.07, 0.022, 0.042], nu: 12, nv: 8, skin: L.wArm });
  }
  b.tube(m, t => [0, lerp(1.32, 1.43, t), lerp(-0.03, -0.02, t)], 0.043, { nu: 16, nv: 3, skin: L.rigid('J_Bip_C_Neck') });
  b.ball(m, [0, 1.495, -0.012], 1, { scale: [0.098, 0.125, 0.108], nu: 24, nv: 14, skin: L.wHead });
  return b.toGLB('Mannequin').glb;
}

const OUT = path.join(__dirname, 'glb'), only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const stats = fs.existsSync(path.join(__dirname, 'catalogue.json')) ? Object.fromEntries(JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogue.json'))).map(r => [r.id, r])) : {};
let total = 0;
for (const [sexe, dir] of [['f', 'femme'], ['h', 'homme']]) {
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  fs.writeFileSync(path.join(OUT, `mannequin-${dir}.glb`), mannequin(sexe));
  catalogue.forEach((r, i) => {
    if (only.length && !only.includes(r.id)) return;
    const num = String(i + 1).padStart(2, '0'), b = new L.Builder(sexe);
    formes[r.id](b, trousse(b, r, num), sexe === 'h');
    const { glb, tris } = b.toGLB(r.nom), f = `${num}-${r.id}.glb`;
    fs.writeFileSync(path.join(OUT, dir, f), glb); total += glb.length;
    stats[r.id] = { ...(stats[r.id] || {}), numero: i + 1, id: r.id, nom: r.nom, theme: r.theme, description: r.desc, couleurs: r.couleurs, fichier: f, [dir]: { triangles: tris, ko: Math.round(glb.length / 1024) } };
    console.log(dir.padEnd(6), f.padEnd(34), String(tris).padStart(6), 'triangles', (glb.length / 1024).toFixed(0).padStart(5), 'Ko');
  });
}
const data = catalogue.map(r => stats[r.id]).filter(Boolean);
fs.writeFileSync(path.join(__dirname, 'catalogue.json'), JSON.stringify(data, null, 1) + '\n');
console.log(`total ${(total / 1048576).toFixed(1)} Mo`);

// Page d'essayage : essayage.html (autonome) et, avec --fragment=<fichier>, la version à publier.
const tpl = fs.readFileSync(path.join(__dirname, 'essayage.tpl.html'), 'utf8');
const attacher = fs.readFileSync(path.join(__dirname, 'attacher-robe.js'), 'utf8').replace(/^import .*$/m, '').replace(/^export /gm, '');
const page = (three, vrm, b64 = false) => tpl.replace('__B64__', String(b64)).replace('__DATA__', () => JSON.stringify(data)).replace('__ATTACHER__', () => attacher).split('__THREE__').join(three).replace('__VRM__', vrm).replace('__BASE__', '');
const CDN = ['https://cdn.jsdelivr.net/npm/three@0.160.0', 'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@2.1.0/lib/three-vrm.module.min.js'];
fs.writeFileSync(path.join(__dirname, 'essayage.html'), `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n</head>\n<body>\n${page(...CDN)}\n</body>\n</html>\n`);
for (const a of process.argv) { if (a.startsWith('--fragment=')) fs.writeFileSync(a.slice(11), page(...CDN, true)); if (a.startsWith('--local=')) fs.writeFileSync(a.slice(8), '<!doctype html><meta charset="utf-8">' + page('/nm/three', '/nm/@pixiv/three-vrm/lib/three-vrm.module.js')); }
