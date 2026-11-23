'use strict';
// Formes 3D des 20 robes du mage. Chaque fonction reçoit (b, K, h) : le constructeur, la trousse de matières
// (étoffes scannées, cuir, fourrure, métal, galon brodé) et h = true pour la coupe homme.
// Toutes les robes sont taillées pour la marche et la course : ourlets aux chevilles, fentes, ampleur.
const L = require('./lib3d');
const { H, PI, TAU, lerp, clamp, sstep, add, mul, norm, bodyPoint, wBody, wArm, wMantle, wHead, rigid, ARM_Y, ARM_Z, HIP_Y } = L;

const CHEST = rigid('J_Bip_C_UpperChest'), NECK = rigid('J_Bip_C_Neck'), HIPS = rigid('J_Bip_C_Hips');
const pw = pts => x => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], sstep(pts[i - 1][0], pts[i][0], x)); return pts[pts.length - 1][1]; };
const SL = {
  fitted: pw([[0.1, 0.078], [0.2, 0.066], [0.33, 0.054], [0.56, 0.042]]),
  bell: pw([[0.1, 0.078], [0.3, 0.066], [0.42, 0.075], [0.56, 0.125]]),
  wizard: pw([[0.1, 0.08], [0.3, 0.08], [0.56, 0.1]]),
  kimono: pw([[0.1, 0.08], [0.56, 0.09]]),
  short: pw([[0.1, 0.082], [0.31, 0.092]]),
  bishop: pw([[0.1, 0.078], [0.25, 0.085], [0.43, 0.115], [0.52, 0.05], [0.56, 0.047]]),
};
const DROP = { wizard: x => 0.42 * Math.pow(sstep(0.18, 0.56, x), 1.5), kimono: x => 0.28 * sstep(0.15, 0.24, x), bell: x => 0.07 * sstep(0.36, 0.56, x) };
const both = fn => { fn(1); fn(-1); };
const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
const fr = th => ({ o: [Math.sin(th), 0, Math.cos(th)], r: [Math.cos(th), 0, -Math.sin(th)] });
const onG = (o, th, y, ex = 0) => {
  const ff = o.flareFrom === undefined ? HIP_Y : o.flareFrom, bot = o.flareHem !== undefined ? o.flareHem : o.hemY;
  const t = y < ff && bot !== undefined ? clamp((ff - y) / (ff - bot)) : 0, fit = typeof o.fit === 'function' ? o.fit(y, th) : o.fit || 0;
  return bodyPoint(th, y, fit + (o.flare ? o.flare(t, th) : 0) + ex, o.rxMax || 9);
};
const addFit = (fit, off) => (typeof fit === 'function' ? (y, th) => fit(y, th) + off : (fit || 0) + off);
const band = (b, mat, base, frac, off = 0.004, extra = {}) => b.garment(mat, { ...base, lining: null, vRange: [1 - frac, 1], fit: addFit(base.fit, off), ao: false, ...extra });
const galonBas = (b, K, base, frac = 0.05) => band(b, K.galon, base, frac, 0.005, { strip: true });
const quad = (b, mat, P, skin) => b.surf(mat, 1, 1, (u, v) => add(add(mul(P[0], (1 - u) * (1 - v)), mul(P[1], u * (1 - v))), add(mul(P[3], (1 - u) * v), mul(P[2], u * v))), { skin, flat: true });

// Manches : étoffe, doublure, galon au poignet.
function sleeves(b, K, mat, style, o = {}) {
  const r = SL[style], drop = DROP[style] || (() => 0), x1 = style === 'short' ? 0.31 : 0.56;
  both(s => {
    b.sleeve(mat, s, { r, drop, x1 });
    if (o.lining) b.sleeve(o.lining, s, { r, drop, x1, scale: 0.965, x0: 0.2 });
    if (o.galon !== false) b.sleeve(o.edge || K.galon, s, { r: x => r(x) + 0.004, drop, x0: x1 - (o.w || 0.035), x1: x1 + 0.003, nv: 2, strip: !o.edge, wrinkle: false });
  });
}
// Ceinture de cuir : sangle, boucle à ardillon et pan qui pend.
function ceinture(b, cuir, metal, y, o = {}) {
  const h = o.h || 0.042, off = o.off || 0.011, th = o.th || 0, c = bodyPoint(th, y, off + 0.007), f = fr(th), w = h * 0.75, hh = h * 0.62;
  b.belt(cuir, y, h, off);
  b.tube(metal, t => { const a = t * TAU, k = Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))); return add(c, add(mul(f.r, w * Math.cos(a) / k), [0, hh * Math.sin(a) / k, 0])); }, 0.0045, { nu: 6, nv: 16, closed: true });
  b.tube(metal, t => add(c, add(mul(f.r, lerp(-w, w * 0.9, t)), mul(f.o, 0.004))), 0.003, { nu: 5, nv: 1 });
  if (o.tail !== false) b.garment(cuir, { range: [th + 0.2, th + 0.2 + h * 4.2], yTop: y + h * 0.3, hemY: y - 0.17, fit: off + 0.009, nv: 5, taper: v => 1 - 0.55 * sstep(0.75, 1, v), folds: false });
}
// Bourse de cuir pendue à la ceinture.
function bourse(b, cuir, cuir2, metal, th, y) {
  const c = bodyPoint(th, y - 0.085, 0.05), f = fr(th);
  b.ball(cuir, c, 1, { scale: [0.04, 0.052, 0.028], nu: 12, nv: 8 });
  b.ball(cuir2, [c[0], c[1] + 0.022, c[2]], 1, { scale: [0.043, 0.03, 0.03], nu: 12, nv: 6 });
  b.ball(metal, add(add(c, mul(f.o, 0.029)), [0, 0.012, 0]), 0.007, { nu: 6, nv: 4 });
  both(s => b.tube(cuir2, t => add(mul(bodyPoint(th + 0.1 * s, y, 0.014), 1 - t), mul([c[0] + f.r[0] * 0.02 * s, c[1] + 0.04, c[2] + f.r[2] * 0.02 * s], t)), 0.005, { nu: 5, nv: 2 }));
}
const boutons = (b, m, base, ys, th = 0, off = 0.012, r = 0.011) => ys.forEach(y => b.ball(m, onG(base, th, y, off), r, { scale: [1, 1, 0.55], nu: 8, nv: 5 }));
// Laçage croisé sur le devant.
function lacets(b, m, base, y0, y1, n, w = 0.075, off = 0.009) {
  const st = (y0 - y1) / n;
  for (let i = 0; i < n; i++) for (const s of [1, -1]) b.tube(m, t => onG(base, lerp(-w * s, w * s, t), y0 - st * (i + t), off), 0.0032, { nu: 4, nv: 4 });
  for (let i = 0; i <= n; i++) both(s => b.ball(m, onG(base, w * s, y0 - st * i, off), 0.006, { nu: 6, nv: 4 }));
}
// Col droit ouvert devant.
const col = (b, m, o = {}) => b.surf(m, 32, 3, (u, v) => { const th = lerp(-PI, PI, u), r = lerp(o.r0 || 0.068, o.r1 || 0.086, v); return [r * Math.sin(th), lerp(1.34, 1.34 + (o.h || 0.07), v), -0.022 + r * Math.cos(th)]; },
  { closeU: true, skin: CHEST, skip: u => Math.abs(u - 0.5) < (o.open === undefined ? 0.07 : o.open) });
// Bracelet / brassard autour du bras.
const brassard = (b, m, s, x0, x1, r0, r1 = r0, o = {}) => b.sleeve(m, s, { x0, x1, r: x => lerp(r0, r1, (x - x0) / (x1 - x0)), nv: Math.max(2, Math.round((x1 - x0) / 0.03)), wrinkle: false, ...o });
// Cercle de tête + gemme frontale.
function diademe(b, metal, gem, o = {}) {
  b.headRing(metal, 1.556, o.r || 0.0065, { rx: 0.122, rz: 0.132, squash: o.squash });
  if (gem) b.gem(gem, [0, 1.574, 0.106], [0, o.gh || 0.024, 0], o.gr || 0.014, { skin: wHead });
}
const epauliere = (b, m1, m2, s) => { for (let i = 0; i < 3; i++) b.ball(i % 2 ? m2 : m1, [(0.165 + 0.04 * i) * s, 1.352 - 0.016 * i, -0.02], 1, { scale: [0.075, 0.03, 0.095 - 0.008 * i], nu: 12, nv: 6, skin: wMantle }); };

module.exports = {
  'archimage-celeste'(b, K, h) {
    const or = K.metal('or', '#c9a24a', 0.35), nuit = K.velvet('velours-sombre', '#141c3a'), dbl = K.satin('doublure', '#2b356b'), pale = K.gem('pierre-de-lune', '#f1e6b8'), feutre = K.cloth('feutre', '#1b2548');
    const base = { hemY: 0.12, flare: t => (h ? 0.22 : 0.27) * Math.pow(t, 1.15), lining: dbl, seed: 1 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.065);
    sleeves(b, K, K.fab, 'wizard', { lining: dbl });
    const m = { reach: 0.235, drop: 0.15, edge: th => 1 + 0.13 * H.scallop(10, 1)(th) };
    b.mantle(nuit, m); b.mantle(K.galon, { ...m, s0: 0.8, s1: 1, lift: 0.011, nv: 2, strip: true });
    b.belt(K.galon, 1.03, 0.045, 0.009, { strip: true });
    b.garment(K.galon, { range: [-0.11, 0.11], yTop: 1.03, hemY: 0.6, fit: 0.013, flare: base.flare, flareHem: 0.12, strip: 'v', folds: false, taper: v => 1 - 0.95 * sstep(0.88, 1, v) });
    b.ball(or, bodyPoint(0, 1.235, 0.028), 0.026, { scale: [1, 1, 0.45] }); b.gem(pale, bodyPoint(0, 1.235, 0.042), [0, 0.014, 0], 0.012);
    both(s => b.tube(or, t => bodyPoint(lerp(0.05, 0.75, t) * s, 1.235 + 0.035 * t, 0.03 - 0.012 * Math.sin(PI * t)), 0.003, { nu: 5, nv: 8, skin: CHEST }));
    const e = bodyPoint(-1.15, 0.9, 0.06);
    b.tube(K.leather('etui', '#5a3a22'), t => [e[0] - 0.02 + 0.05 * t, e[1] + 0.02 - 0.19 * t, e[2] + 0.02], 0.022, { nu: 10, nv: 3, skin: HIPS });
    b.ball(or, [e[0] - 0.02, e[1] + 0.02, e[2] + 0.02], 0.024, { skin: HIPS, nu: 8, nv: 5 });
    b.disc(feutre, [0, 1.572, -0.03], X, Z, 0.105, a => 0.265 + 0.012 * Math.sin(3 * a), { nv: 4 });
    b.tube(feutre, t => [0.02 * Math.sin(5 * t), 1.57 + 0.35 * t, -0.03 - 0.12 * t * t * t], (t, ph) => (0.122 * Math.pow(1 - t, 0.85) + 0.003) * (1 + 0.07 * Math.sin(ph * 3 + t * 14) * t), { nu: 24, nv: 16, skin: wHead });
    b.tube(K.galon, t => [0, 1.585 + 0.03 * t, -0.03], t => 0.119 - 0.004 * t, { nu: 24, nv: 1, skin: wHead, U: 6, V: 1 });
    b.gem(pale, [0, 1.63, 0.092], [0, 0.026, 0], 0.018, { skin: wHead });
  },

  'pyromancien'(b, K, h) {
    const braise = K.cloth('laine-braise', '#c4611f'), cuir = K.leather('cuir-noir', '#2a2220'), cuir2 = K.leather('cuir-fauve', '#5a3420'), laiton = K.metal('laiton', '#b8873a', 0.4), rubis = K.gem('rubis', '#e0481f');
    const rx = h ? 0.142 : 0.128;
    const base = { yTop: 1.33, rxMax: rx, hemY: 0.4, flare: t => 0.11 * t, hem: H.flame(9, 0.18), slits: [{ th: 0, w: 0.07, from: 0.92 }], lining: braise, seed: 2 };
    b.garment(K.fab, base); band(b, braise, base, 0.16);
    b.garment(K.galon, { range: [-0.05, 0.05], yTop: 1.32, hemY: 1.06, fit: 0.006, strip: 'v', rxMax: rx });
    ceinture(b, cuir, laiton, 1.03, { h: 0.05 }); bourse(b, cuir2, cuir, laiton, -0.95, 1.03);
    for (const s of [1, -1]) b.tube(cuir2, t => bodyPoint(lerp(-0.62, 0.62, t) * s, lerp(1.32, 1.07, t), 0.012, rx), 0.014, { nu: 6, nv: 12, squash: 0.3 });
    b.ball(laiton, bodyPoint(0, 1.195, 0.02), 0.026, { scale: [1, 1, 0.4] }); b.gem(rubis, bodyPoint(0, 1.195, 0.03), [0, 0, 0.008], 0.014, { nu: 6 });
    both(s => {
      epauliere(b, cuir, cuir2, s);
      for (const [tip, r] of [[[0.3, 1.42, -0.02], 0.022], [[0.25, 1.4, 0.07], 0.016], [[0.25, 1.4, -0.11], 0.016]]) b.spike(laiton, [0.2 * s, 1.35, tip[2] * 0.7], [tip[0] * s, tip[1], tip[2]], r, { skin: wMantle, nu: 6, flat: false });
      brassard(b, cuir, s, 0.355, 0.53, 0.05, 0.04); brassard(b, laiton, s, 0.37, 0.378, 0.053); brassard(b, laiton, s, 0.5, 0.508, 0.044);
      brassard(b, cuir2, s, 0.19, 0.225, 0.056);
    });
    col(b, cuir, { h: 0.075, r1: 0.098, open: 0.1 });
    for (let i = 0; i < 7; i++) { const a = lerp(1.05, TAU - 1.05, i / 6); b.spike(laiton, [0.094 * Math.sin(a), 1.405, -0.022 + 0.094 * Math.cos(a)], [0.118 * Math.sin(a), 1.45 + 0.02 * (i % 2), -0.022 + 0.118 * Math.cos(a)], 0.012, { skin: CHEST, nu: 5 }); }
    diademe(b, laiton, rubis, { gh: 0.03, gr: 0.016 });
  },

  'cryomancien'(b, K, h) {
    const fou = K.fur('fourrure-blanche', '#f2f0ea'), ar = K.metal('argent', '#aeb9c4', 0.3), lin = K.linen('lin-blanc', '#e9eef0'), glace = K.gem('glace', '#cfeaf6', 0.82), cuir = K.leather('cuir-gris', '#7b8794');
    const base = { hemY: 0.16, flare: t => 0.13 * t, hem: H.zig(7, 0.08), slits: [{ th: 0, w: 0.1, from: 0.99 }], lining: lin, seed: 3 };
    b.garment(lin, { yTop: 1.0, hemY: 0.22, flare: t => 0.06 * t, fit: -0.006, seed: 9 });
    b.garment(K.fab, base); band(b, fou, base, 0.07, 0.012);
    both(s => b.garment(fou, { ...base, lining: null, slits: null, range: s > 0 ? [0.075, 0.15] : [-0.15, -0.075], yTop: 0.99, fit: 0.012, ao: false }));
    sleeves(b, K, K.fab, 'fitted', { galon: false });
    both(s => brassard(b, fou, s, 0.505, 0.565, 0.062, 0.066));
    const m = { reach: 0.25, drop: 0.2, edge: th => 1 + 0.22 * H.zig(8, 1)(th) };
    b.mantle(K.fab, m); b.mantle(K.galon, { ...m, s0: 0.82, s1: 1, lift: 0.011, nv: 2, strip: true });
    b.tube(fou, t => bodyPoint(t * TAU, 1.335, 0.03), 0.042, { nu: 10, nv: 40, closed: true, skin: CHEST });
    ceinture(b, cuir, ar, 1.03, { h: 0.04 });
    for (const y of [1.2, 1.14, 1.08]) { both(s => b.ball(ar, bodyPoint(0.09 * s, y, 0.014), 0.011, { scale: [1, 1, 0.5], nu: 8, nv: 5 })); b.tube(ar, t => bodyPoint(lerp(-0.09, 0.09, t), y, 0.016), 0.0035, { nu: 5, nv: 4 }); }
    diademe(b, ar);
    b.spike(glace, [0, 1.565, 0.1], [0, 1.67, 0.11], 0.018, { skin: wHead, nu: 5 });
    both(s => { b.spike(glace, [0.045 * s, 1.563, 0.092], [0.062 * s, 1.635, 0.1], 0.013, { skin: wHead, nu: 5 }); b.spike(glace, [0.085 * s, 1.56, 0.062], [0.108 * s, 1.61, 0.068], 0.01, { skin: wHead, nu: 5 }); });
  },

  'druide-sylvestre'(b, K, h) {
    const bure = K.cloth('bure-brune', '#6a4a2e', 'hessian_380'), f1 = K.suede('feuille-claire', '#7f9a4a'), f2 = K.suede('feuille-sombre', '#4c6a34'), corde = K.cloth('chanvre', '#b6a47c', 'hessian_380'),
      cuir = K.leather('cuir', '#5a3d24'), bois = K.flat('ramure', { color: '#8a6a48', rough: 0.7 }), bronze = K.metal('bronze', '#8f6f3a', 0.5);
    const sl = [{ th: PI / 2, w: 0.07, from: 0.8 }, { th: -PI / 2, w: 0.07, from: 0.8 }];
    b.garment(bure, { yTop: 1.0, hemY: 0.16, flare: t => 0.09 * t, hem: H.ragged(14, 0.06, 4), fit: -0.004, slits: sl, seed: 4 });
    const base = { hemY: 0.52, flare: t => 0.15 * t, hem: H.leaf(9, 0.13), slits: sl, seed: 5 };
    b.garment(K.fab, base);
    sleeves(b, K, K.fab, 'bell', { lining: bure });
    b.mantle(f2, { reach: 0.245, drop: 0.16, edge: th => 1 + 0.24 * H.leaf(10, 1, 0.5)(th), lift: 0.008 });
    b.mantle(f1, { reach: 0.215, drop: 0.12, edge: th => 1 + 0.26 * H.leaf(10, 1)(th), lift: 0.013 });
    for (const dy of [0, 0.014]) b.tube(corde, t => bodyPoint(t * TAU, 1.03 + dy, 0.012), 0.0075, { nu: 6, nv: 48, closed: true });
    for (const [th, yEnd] of [[0.22, 0.7], [0.34, 0.77]]) {
      b.tube(corde, t => bodyPoint(th + 0.03 * Math.sin(4 * t), lerp(1.03, yEnd, t), 0.022 + 0.03 * t), 0.007, { nu: 6, nv: 12 });
      b.ball(corde, bodyPoint(th + 0.03 * Math.sin(4), yEnd, 0.052), 0.014, { nu: 8, nv: 6 });
    }
    bourse(b, cuir, cuir, bronze, -0.9, 1.03);
    both(s => { brassard(b, cuir, s, 0.4, 0.5, 0.047, 0.042); for (let i = 0; i < 3; i++) brassard(b, corde, s, 0.415 + 0.03 * i, 0.421 + 0.03 * i, 0.05 - 0.002 * i); });
    b.hood(K.fab);
    both(s => {
      b.tube(bois, t => [s * (0.07 + 0.1 * t + 0.03 * Math.sin(PI * t)), 1.62 + 0.21 * t, -0.04 - 0.03 * t], t => 0.014 * (1 - t) + 0.004, { nu: 6, nv: 10, skin: wHead });
      b.tube(bois, t => [s * (0.115 + 0.07 * t), 1.7 + 0.03 * t + 0.03 * t * t, -0.05 + 0.02 * t], t => 0.009 * (1 - t) + 0.003, { nu: 5, nv: 5, skin: wHead });
      b.tube(bois, t => [s * (0.15 - 0.03 * t), 1.77 + 0.07 * t, -0.06 + 0.04 * t], t => 0.008 * (1 - t) + 0.003, { nu: 5, nv: 5, skin: wHead });
    });
    b.ball(bronze, bodyPoint(0, 1.295, 0.032), 0.018, { scale: [1, 1, 0.5], skin: CHEST });
  },

  'necromancien'(b, K, h) {
    const lin = K.cloth('linceul', '#3a3740', 'hessian_380'), gn = K.flat('spectral', { color: '#8fae5e', emissive: '#3a5a22', rough: 0.6 }), os = K.flat('os', { color: '#d2ccb8', rough: 0.55 }),
      dbl = K.cloth('doublure', '#33402a'), cuir = K.leather('cuir-noir', '#2b2830'), fer = K.metal('fer', '#5c5c62', 0.55), vo = K.flat('orbite', { color: '#0c0b0e' });
    const base = { hemY: 0.07, flare: t => 0.13 * t, hem: H.ragged(16, 0.09, 7), slits: [{ th: PI / 2, w: 0.07, from: 0.78 }, { th: -PI / 2, w: 0.07, from: 0.78 }], lining: dbl, seed: 6 };
    b.garment(K.fab, base); band(b, gn, base, 0.012, 0.003);
    b.garment(lin, { range: [PI - 1.25, PI + 1.25], yTop: 1.34, hemY: 0.1, fit: 0.035, flare: t => 0.18 * t, hem: H.ragged(20, 0.14, 3), folds: 0.03, seed: 8 });
    sleeves(b, K, K.fab, 'wizard', { lining: dbl, galon: false });
    b.hood(K.fab, { r: [0.155, 0.172, 0.182] });
    b.mantle(lin, { reach: 0.2, drop: 0.1, edge: th => 1 + 0.25 * H.ragged(12, 1, 2)(th) });
    b.tube(os, t => bodyPoint(0, lerp(1.26, 1.07, t), 0.012), 0.008, { nu: 6, nv: 6 });
    for (const y0 of [1.235, 1.195, 1.155, 1.115]) both(s => b.tube(os, t => bodyPoint(s * lerp(0.03, 0.55, t), y0 - 0.035 * t * t, 0.012), t => 0.007 * (1 - 0.5 * t), { nu: 6, nv: 8 }));
    ceinture(b, cuir, fer, 1.03, { h: 0.04, th: 0.5 });
    const sk = bodyPoint(0, 1.03, 0.03);
    b.ball(os, sk, 0.034, { scale: [1, 1.1, 0.7] }); b.box(os, [sk[0], sk[1] - 0.034, sk[2] - 0.004], [0.016, 0.012, 0.014]);
    both(s => b.ball(vo, [0.012 * s, sk[1] + 0.004, sk[2] + 0.021], 0.008, { nu: 6, nv: 4 }));
    const ch = t => bodyPoint(lerp(-0.4, -1.3, t), 1.02 - 0.09 * Math.sin(PI * t), 0.022);
    b.tube(fer, ch, 0.004, { nu: 5, nv: 14 });
    for (const t of [0.3, 0.5, 0.7]) { const p = ch(t); b.spike(os, p, [p[0], p[1] - 0.06, p[2]], 0.008, { nu: 5 }); }
    both(s => { for (let i = 0; i < 4; i++) brassard(b, lin, s, 0.4 + 0.03 * i, 0.418 + 0.03 * i, 0.047 - 0.002 * i); });
  },

  'pretresse-solaire'(b, K, h) {
    const or = K.metal('or', '#d0a233', 0.3), az = K.gem('lapis', '#2f6f9c'), satin = K.satin('satin-or', '#c9992e'), bleu = K.satin('satin-azur', '#2f6f9c'), dbl = K.satin('doublure', '#d8c48a');
    const base = { hemY: 0.1, flare: t => (h ? 0.2 : 0.24) * Math.pow(t, 1.1), lining: dbl, seed: 10 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.07);
    sleeves(b, K, K.fab, 'kimono', { lining: dbl, w: 0.045 });
    for (const c of [0, PI]) {
      const tb = { range: [c - 0.4, c + 0.4], yTop: 1.3, hemY: 0.34, fit: 0.012, flare: base.flare, flareHem: 0.1, folds: false };
      b.garment(satin, { ...tb, taper: v => 1 - 0.97 * sstep(0.88, 1, v) });
      for (const s of [1, -1]) b.garment(K.galon, { ...tb, range: s > 0 ? [c + 0.27, c + 0.4] : [c - 0.4, c - 0.27], hemY: 0.42, fit: 0.016, strip: 'v' });
    }
    const sc = onG(base, 0, 0.92, 0.02);
    b.ball(or, sc, 0.04, { scale: [1, 1, 0.3] });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, d = [Math.sin(a), Math.cos(a), 0]; b.spike(or, add(sc, mul(d, 0.04)), add(add(sc, mul(d, i % 2 ? 0.065 : 0.08)), [0, 0, 0.004]), 0.008, { nu: 4 }); }
    b.gem(az, add(sc, [0, 0, 0.014]), [0, 0, 0.006], 0.014, { nu: 8 });
    b.belt(bleu, 1.03, 0.07, 0.017); b.ball(or, bodyPoint(0, 1.03, 0.028), 0.03, { scale: [1, 1, 0.35] });
    const pec = { reach: 0.215, drop: 0.13, pow: 1.3, ripple: 0 };
    b.mantle(or, pec); b.mantle(az, { ...pec, s0: 0.56, s1: 0.68, lift: 0.012, nv: 2 }); b.mantle(az, { ...pec, s0: 0.2, s1: 0.27, lift: 0.012, nv: 2 });
    const hc = [0, 1.5, -0.2];
    b.tube(or, t => add(hc, [0.18 * Math.cos(t * TAU), 0.18 * Math.sin(t * TAU), 0]), 0.012, { nu: 8, nv: 40, closed: true, skin: wHead, squash: 0.5, up: Z });
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, d = [Math.sin(a), Math.cos(a), 0]; b.spike(or, add(hc, mul(d, 0.19)), add(hc, mul(d, i % 2 ? 0.25 : 0.31)), 0.011, { skin: wHead, nu: 4 }); }
    diademe(b, or, az);
  },

  'electromancien'(b, K, h) {
    const cuir = K.leather('cuir-ardoise', '#33363d'), cuir2 = K.leather('cuir-fauve', '#6a4a2a'), acier = K.metal('acier', '#8f9aa6', 0.3), cy = K.gem('cristal-orage', '#7fd0ea');
    const base = { hemY: 0.76, flare: t => 0.05 * t, hem: H.zig(8, 0.07), seed: 11 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.05);
    b.garment(K.fab, { range: [0.75, 2.1], yTop: 0.9, hemY: 0.34, fit: 0.012, flare: t => 0.07 * t, folds: 0.012, taper: v => 1 - 0.9 * Math.pow(v, 1.6) });
    b.garment(K.galon, { range: [-0.055, 0.055], yTop: 1.33, hemY: 0.8, fit: 0.006, strip: 'v' });
    sleeves(b, K, K.fab, 'short');
    col(b, cuir, { h: 0.065 });
    both(s => { brassard(b, cuir, s, 0.35, 0.535, 0.05, 0.041); for (const x of [0.37, 0.43, 0.49]) { const r = 0.053 - (x - 0.37) * 0.05; brassard(b, cuir2, s, x, x + 0.014, r); b.ball(acier, [(x + 0.007) * s, ARM_Y + r * b.corps.arm + 0.001, ARM_Z], 0.007, { skin: wArm, nu: 6, nv: 4 }); } });
    epauliere(b, cuir, cuir2, 1);
    b.tube(cuir2, t => bodyPoint(lerp(0.75, -0.7, t), lerp(1.31, 1.07, t), 0.013), 0.015, { nu: 6, nv: 14, squash: 0.3 });
    const z = y => bodyPoint(0, y, 0.022)[2], pt = (x, y) => [x - 0.05, y, z(y)];
    quad(b, acier, [pt(0.02, 1.27), pt(0.055, 1.27), pt(0.008, 1.19), pt(-0.03, 1.19)], wBody);
    quad(b, acier, [pt(-0.005, 1.205), pt(0.04, 1.205), pt(-0.02, 1.1), pt(-0.02, 1.1)], wBody);
    ceinture(b, cuir, acier, 1.03, { h: 0.05 }); bourse(b, cuir2, cuir, acier, 0.95, 1.03); bourse(b, cuir, cuir2, acier, -0.95, 1.03);
    diademe(b, acier, cy, { gh: 0.03, gr: 0.016 });
    both(s => b.spike(cy, [0.05 * s, 1.56, 0.09], [0.07 * s, 1.62, 0.1], 0.011, { skin: wHead, nu: 5 }));
  },

  'mage-des-marees'(b, K, h) {
    const lag = K.satin('satin-lagon', '#3fa39c'), co = K.satin('satin-corail', '#c96b55'), nacre = K.flat('nacre', { color: '#ece2cc', rough: 0.25, metallic: 0.25 }), corail = K.flat('corail', { color: '#d4735c', rough: 0.7 }), perle = K.flat('perle', { color: '#f3efe6', rough: 0.2, metallic: 0.3 });
    const fl = h ? t => 0.13 * t : t => (t < 0.5 ? -0.012 * Math.pow(Math.sin(PI * t / 0.5), 2) : 0.24 * Math.pow((t - 0.5) / 0.5, 1.6));
    const base = { hemY: 0.1, flare: fl, hem: H.scallop(10, 0.03), slits: [{ th: h ? 0 : 0.55, w: 0.09, from: 0.74 }], lining: co, folds: 0.022, seed: 12 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.05);
    sleeves(b, K, lag, 'bell', { lining: co });
    const m = { reach: 0.225, drop: 0.15, ripple: 0.012, rippleN: 9, edge: th => 1 + 0.14 * H.scallop(9, 1)(th) };
    b.mantle(nacre, m); b.mantle(perle, { ...m, s0: 0.93, s1: 1.0, lift: 0.011, nv: 1 });
    b.belt(lag, 1.03, 0.06, 0.008);
    for (let i = 0; i < 30; i++) b.ball(i % 5 ? corail : perle, bodyPoint(i / 30 * TAU, 1.03, 0.016), i % 5 ? 0.012 : 0.015, { nu: 6, nv: 4 });
    for (const [th, n] of [[0.35, 7], [0.5, 5], [0.65, 6]]) for (let i = 1; i <= n; i++) b.ball(i === n ? perle : corail, bodyPoint(th, 1.03 - 0.026 * i, 0.02 + 0.003 * i), i === n ? 0.014 : 0.009, { nu: 6, nv: 4 });
    b.ball(perle, [0, 1.345, 0.052], 0.02, { skin: CHEST });
    for (const [x, z, hh, lean] of [[0, 0.03, 0.13, 0], [0.06, 0.0, 0.11, 0.05], [-0.06, 0.0, 0.11, -0.05], [0.1, -0.05, 0.08, 0.07], [-0.1, -0.05, 0.08, -0.07]]) {
      const y0 = 1.6 - Math.abs(x) * 0.25;
      b.tube(corail, t => [x + lean * t, y0 + hh * t, z - 0.03], t => 0.009 * (1 - 0.6 * t), { nu: 6, nv: 6, skin: wHead });
      b.tube(corail, t => [x + lean * 0.5 + 0.035 * t, y0 + hh * (0.5 + 0.4 * t), z - 0.03 + 0.02 * t], t => 0.006 * (1 - 0.5 * t), { nu: 5, nv: 4, skin: wHead });
      b.tube(corail, t => [x + lean * 0.3 - 0.03 * t, y0 + hh * (0.3 + 0.4 * t), z - 0.03 - 0.02 * t], t => 0.006 * (1 - 0.5 * t), { nu: 5, nv: 4, skin: wHead });
    }
    b.headRing(perle, 1.565, 0.006, { rx: 0.12, rz: 0.13 });
  },

  'illusionniste'(b, K, h) {
    const sar = K.satin('satin-sarcelle', '#1f8ea3'), or = K.metal('or', '#c9a24a', 0.3), lin = K.linen('lin-blanc', '#efece4'), dbl = K.satin('doublure-or', '#b08a3a'), cuir = K.leather('cuir', '#3a2430'), pru = K.fab;
    const base = { hemY: 0.6, flare: t => 0.14 * t, hem: H.zig(6, 0.2), lining: dbl, seed: 13 };
    b.garment(pru, { ...base, range: [0, PI] }); b.garment(sar, { ...base, range: [-PI, 0] });
    galonBas(b, K, base, 0.05);
    for (let i = 0; i < 6; i++) b.ball(or, bodyPoint((i + 0.5) / 6 * TAU, 0.385, 0.14), 0.02, { nu: 8, nv: 6 });
    both(s => {
      const m = s > 0 ? sar : pru, m2 = s > 0 ? pru : sar, pf = x => 0.05 + 0.058 * Math.sin(PI * (x - 0.1) / 0.16);
      b.sleeve(m, s, { r: SL.fitted, x0: 0.2 });
      b.sleeve(m2, s, { x0: 0.1, x1: 0.26, r: pf, wrinkle: false });
      for (let i = 0; i < 6; i++) b.sleeve(m, s, { x0: 0.105, x1: 0.255, r: x => pf(x) + 0.003, phi: [i * TAU / 6, i * TAU / 6 + 0.45], nu: 2, wrinkle: false });
      brassard(b, K.galon, s, 0.515, 0.562, 0.05, 0.048, { strip: true }); brassard(b, lin, s, 0.558, 0.59, 0.05, 0.066);
    });
    b.mantle(lin, { reach: 0.17, rzF: 0.14, rzB: 0.13, drop: 0.05, lift: 0.014, ripple: 0.012, rippleN: 22, edge: th => 1 + 0.18 * H.zig(14, 1)(th) });
    b.garment(K.galon, { range: [-0.05, 0.05], yTop: 1.3, hemY: 0.82, fit: 0.006, strip: 'v' });
    boutons(b, or, base, [1.24, 1.17, 1.1, 0.96, 0.89], 0, 0.012, 0.012);
    ceinture(b, cuir, or, 1.03, { h: 0.034 });
    b.hood(pru, { uRange: [0.5, 1], r: [0.148, 0.16, 0.168] }); b.hood(sar, { uRange: [0, 0.5], r: [0.148, 0.16, 0.168] });
    const cm = { reach: 0.2, drop: 0.09, lift: 0.02, edge: th => 1 + 0.2 * H.zig(10, 1)(th) };
    b.mantle(pru, { ...cm, range: [0, PI] }); b.mantle(sar, { ...cm, range: [-PI, 0] });
    const P = t => [0.02 + 0.05 * Math.sin(3 * t), 1.6 - 0.62 * t, -0.19 - 0.05 * Math.sin(PI * t)];
    b.tube(pru, P, t => 0.04 * (1 - t) + 0.008, { nu: 10, nv: 16, skin: p => (p[1] > 1.4 ? wHead(p) : wBody(p, 0)) });
    b.ball(or, P(1), 0.02, { nu: 8, nv: 6 });
  },

  'chronomancien'(b, K, h) {
    const vel = K.velvet('velours-brun', '#4a2a16'), cr = K.linen('lin-creme', '#e6d9bd'), lt = K.metal('laiton', '#b98d3c', 0.32), cuir = K.leather('cuir', '#4a2d1b'), cuir2 = K.leather('cuir-clair', '#7a5230'), verre = K.gem('verre', '#cfe6e0', 0.6), dbl = K.satin('doublure', '#8a6a3a');
    const base = { hemY: 0.16, flare: t => 0.13 * t, slits: [{ th: 0, w: 0.1, from: 0.99 }], lining: dbl, seed: 14 };
    b.garment(cr, { yTop: 1.02, hemY: 0.46, flare: t => 0.06 * t, fit: -0.006, seed: 15 });
    b.garment(K.fab, base); galonBas(b, K, base, 0.045);
    both(s => b.garment(K.galon, { ...base, lining: null, slits: null, range: s > 0 ? [0.085, 0.14] : [-0.14, -0.085], yTop: 0.99, fit: 0.006, strip: 'v', ao: false }));
    b.garment(cr, { range: [-0.2, 0.2], yTop: 1.25, hemY: 1.0, fit: 0.006, taper: v => lerp(0.3, 1, sstep(0, 0.6, v)) });
    boutons(b, lt, {}, [1.19, 1.13, 1.07], 0, 0.014, 0.009);
    for (const s of [1, -1]) b.garment(vel, { range: s > 0 ? [0.1, 0.62] : [-0.62, -0.1], yTop: 1.335, hemY: 1.1, fit: 0.009, taper: v => 1 - 0.85 * v });
    b.garment(cr, { range: [-0.17, 0.17], yTop: 1.348, hemY: 1.23, fit: 0.017, taper: v => 1 - 0.7 * v }); b.ball(lt, bodyPoint(0, 1.31, 0.026), 0.012, { skin: CHEST });
    both(s => boutons(b, lt, {}, [1.16, 1.09], 0.5 * s, 0.014, 0.011));
    sleeves(b, K, K.fab, 'bishop', { galon: false });
    both(s => { brassard(b, cr, s, 0.51, 0.566, 0.056, 0.058); for (const dz of [-0.02, 0.02]) b.ball(lt, [0.54 * s, ARM_Y + 0.058 * b.corps.arm, ARM_Z + dz], 0.008, { skin: wArm, nu: 6, nv: 4 }); });
    ceinture(b, cuir, lt, 1.03, { h: 0.044, th: 0.42 }); bourse(b, cuir2, cuir, lt, -1.0, 1.03);
    b.tube(lt, t => bodyPoint(lerp(0.75, 1.3, t), 1.02 - 0.06 * Math.sin(PI * t), 0.022), 0.0035, { nu: 5, nv: 12 });
    const wp = bodyPoint(1.3, 0.96, 0.03); b.ball(lt, wp, 0.03, { scale: [0.45, 1, 1] }); b.ball(verre, [wp[0] + 0.011, wp[1], wp[2]], 0.024, { scale: [0.3, 1, 1] });
    const ac = bodyPoint(0, 1.14, 0.045);
    b.tube(lt, t => bodyPoint(lerp(-0.35, 0.35, t), 1.335 - 0.19 * Math.sin(PI * t), 0.016), 0.0028, { nu: 5, nv: 16, skin: CHEST });
    for (const [ex, ey] of [[X, Y], [norm([1, 0, 1]), Y], [X, norm([0, 0.5, 1])]]) b.tube(lt, t => add(ac, add(mul(ex, 0.034 * Math.cos(t * TAU)), mul(ey, 0.034 * Math.sin(t * TAU)))), 0.004, { nu: 6, nv: 24, closed: true, skin: CHEST });
    b.ball(vel, [0, 1.6, -0.035], 1, { scale: [0.132, 0.05, 0.142], nu: 20, nv: 8, skin: wHead });
    b.tube(K.galon, t => [0, 1.565 + 0.035 * t, -0.03], () => 0.124, { nu: 24, nv: 1, skin: wHead, U: 6, V: 1 });
    b.ball(lt, [0.1, 1.6, 0.06], 0.012, { skin: wHead });
  },

  'geomancien'(b, K, h) {
    const ard = K.cloth('laine-ardoise', '#3f4248'), am = K.gem('amethyste', '#8d5cc4'), li = K.gem('quartz', '#c7b2ea', 0.85), roc = K.flat('roc', { color: '#8d9096', rough: 0.95 }), cuir = K.leather('cuir-gris', '#3a3b40'), fer = K.metal('fer', '#6b6e75', 0.5);
    const base = { hemY: 0.3, flare: t => 0.06 * t, slits: [{ th: PI / 2, w: 0.08, from: 0.76 }, { th: -PI / 2, w: 0.08, from: 0.76 }], lining: ard, seed: 16 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.07);
    const mid = { ...base, lining: null, slits: null, range: [-0.19, 0.19], yTop: 1.33, fit: 0.006, ao: false };
    b.garment(ard, mid);
    for (const s of [1, -1]) b.garment(K.galon, { ...mid, range: s > 0 ? [0.14, 0.2] : [-0.2, -0.14], fit: 0.009, strip: 'v' });
    for (const y of [1.17, 0.9, 0.7, 0.5]) { const p = onG(mid, 0, y, 0.008); b.ball(fer, p, 0.027, { scale: [1, 1.4, 0.3] }); b.gem(am, add(p, [0, 0, 0.006]), [0, 0.034, 0], 0.02); }
    both(s => {
      b.sleeve(K.fab, s, { x1: 0.31, r: pw([[0.1, 0.085], [0.31, 0.102]]) }); brassard(b, K.galon, s, 0.275, 0.313, 0.104, 0.107, { strip: true });
      brassard(b, cuir, s, 0.355, 0.535, 0.05, 0.042);
      for (let i = 0; i < 3; i++) b.ball(roc, [(0.4 + 0.05 * i) * s, ARM_Y + 0.03, ARM_Z], 0.035, { scale: [0.9, 0.7, 1.15], nu: 6, nv: 4, jitter: 0.3, flat: true, skin: wArm, seed: i });
      b.ball(roc, [0.2 * s, 1.36, -0.02], 0.09, { scale: [1.1, 0.62, 1], nu: 7, nv: 5, jitter: 0.35, flat: true, skin: wMantle, seed: s });
      b.ball(roc, [0.13 * s, 1.365, 0.03], 0.05, { scale: [1, 0.6, 1], nu: 6, nv: 4, jitter: 0.35, flat: true, skin: wMantle, seed: 3 + s });
      for (const [bs, tp, r, m] of [[[0.2, 1.39, -0.02], [0.26, 1.57, -0.02], 0.03, am], [[0.15, 1.4, 0.025], [0.14, 1.5, 0.055], 0.02, li], [[0.25, 1.39, -0.06], [0.34, 1.47, -0.095], 0.022, li], [[0.22, 1.39, 0.03], [0.27, 1.47, 0.07], 0.016, am]])
        b.spike(m, [bs[0] * s, bs[1], bs[2]], [tp[0] * s, tp[1], tp[2]], r, { skin: wMantle, nu: 5 });
    });
    ceinture(b, cuir, fer, 1.02, { h: 0.07, tail: false }); b.gem(am, bodyPoint(0, 1.02, 0.024), [0, 0, 0.014], 0.034, { nu: 6 });
    bourse(b, cuir, cuir, fer, 0.95, 1.02);
    diademe(b, fer, null, { r: 0.009, squash: 0.6 });
    b.spike(am, [0, 1.565, 0.1], [0, 1.67, 0.115], 0.018, { skin: wHead, nu: 5 });
    both(s => b.spike(li, [0.045 * s, 1.563, 0.092], [0.066 * s, 1.63, 0.105], 0.013, { skin: wHead, nu: 5 }));
  },

  'voile-lune'(b, K, h) {
    const ar = K.metal('argent', '#cfd4de', 0.25), lu = K.gem('pierre-de-lune', '#f4efcf'), ve = K.flat('voile', { color: '#f4f2fa', alpha: 0.42, rough: 0.6 }), cv = K.flat('voile-cape', { color: '#dcdcec', alpha: 0.3, rough: 0.6 }), dbl = K.satin('doublure', '#6f66a0');
    const base = h ? { hemY: 0.1, flare: t => 0.18 * Math.pow(t, 1.1), hem: H.wave(8, 0.015), lining: dbl, seed: 17 }
      : { yTop: 1.3, rxMax: 0.13, hemY: 0.08, flareFrom: 1.14, flare: t => 0.2 * Math.pow(t, 1.2), hem: H.wave(8, 0.02), lining: dbl, folds: 0.028, seed: 17 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.04);
    b.belt(K.galon, h ? 1.03 : 1.14, 0.04, 0.012, { rxMax: h ? 9 : 0.14, strip: true });
    if (h) { sleeves(b, K, K.fab, 'fitted', { w: 0.04 }); b.garment(K.galon, { range: [-0.05, 0.05], yTop: 1.33, hemY: 1.05, fit: 0.006, strip: 'v' }); col(b, K.fab, { h: 0.045, open: 0.09 }); }
    both(s => {
      if (!h) {
        b.tube(ar, t => [0.085 * s, 1.3 + 0.062 * Math.sin(PI * t), lerp(0.085, -0.088, t)], 0.006, { nu: 6, nv: 10, skin: CHEST });
        brassard(b, ar, s, 0.165, 0.185, 0.05); brassard(b, ar, s, 0.5, 0.512, 0.033);
      }
      b.surf(ve, 8, 14, (u, v) => { const x = lerp(0.15, 0.38, u), hang = 0.56 - 0.3 * Math.abs(u - 0.6);
        return [x * s + s * 0.03 * v * (u - 0.3), ARM_Y - (h ? 0.075 : 0.045) - hang * v, ARM_Z - 0.02 + 0.03 * Math.sin(u * 9 + v * 3) * (0.3 + v)]; }, { skin: wArm });
    });
    const arc = (m, c, R, r0, skin) => b.tube(m, t => { const a = lerp(PI * 1.08, PI * 1.92, t); return add(c, [R * Math.cos(a), R * Math.sin(a), 0]); }, t => r0 * Math.sin(PI * t) + 0.001, { nu: 8, nv: 14, skin });
    const pc = bodyPoint(0, h ? 1.24 : 1.285, 0.014, h ? 9 : 0.13);
    b.tube(ar, t => bodyPoint(lerp(-0.4, 0.4, t), 1.335 - (1.335 - pc[1] - 0.02) * Math.sin(PI * t), 0.012, h ? 9 : 0.13), 0.0025, { nu: 5, nv: 14, skin: CHEST });
    arc(lu, [0, pc[1], pc[2] + 0.004], 0.03, 0.009, CHEST);
    arc(ar, [0, 1.62, 0.1], 0.055, 0.013, wHead);
    b.garment(cv, { range: [PI - 1.4, PI + 1.4], yTop: 1.33, hemY: 0.1, fit: 0.045, flare: t => 0.22 * t, hem: H.wave(6, 0.03), folds: 0.03, ao: false });
    diademe(b, ar, lu, { r: 0.005, gh: 0.014, gr: 0.01 });
  },

  'mage-du-desert'(b, K, h) {
    const ind = K.linen('lin-indigo', '#2a2f6e'), in2 = K.linen('lin-indigo-clair', '#3d438a'), or = K.metal('laiton', '#b8923c', 0.35), cuir = K.leather('cuir', '#6a4526'), sa = K.gem('ambre', '#d98a1e'), dbl = K.linen('doublure', '#e6c27a');
    const base = { hemY: 0.5, flare: t => 0.11 * t, hem: H.diag(0.2, 0.9), lining: dbl, seed: 18 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.06);
    b.belt(ind, 1.02, 0.12, 0.012); b.belt(in2, 1.045, 0.03, 0.016); b.belt(in2, 0.99, 0.025, 0.016);
    b.ball(ind, bodyPoint(1.15, 1.0, 0.035), 0.042);
    b.garment(ind, { range: [1.0, 1.26], yTop: 0.99, hemY: 0.52, fit: 0.032, flare: t => 0.08 * t, folds: 0.012, taper: v => 1 - 0.4 * sstep(0.85, 1, v) });
    b.garment(in2, { range: [1.2, 1.42], yTop: 0.99, hemY: 0.62, fit: 0.027, flare: t => 0.07 * t, folds: 0.012, taper: v => 1 - 0.4 * sstep(0.85, 1, v) });
    b.tube(ind, t => bodyPoint(lerp(-0.5, 0.8, t), lerp(1.335, 1.08, t), 0.012), 0.016, { nu: 6, nv: 14, squash: 0.3 });
    sleeves(b, K, K.fab, 'bishop', { galon: false });
    both(s => { brassard(b, ind, s, 0.51, 0.566, 0.055, 0.056); brassard(b, K.galon, s, 0.525, 0.552, 0.058, 0.059, { strip: true }); });
    b.tube(cuir, t => bodyPoint(t * TAU, 1.12 + 0.17 * Math.sin(t * TAU - 0.5), 0.02), 0.013, { nu: 6, nv: 60, closed: true, squash: 0.3 });
    const g = bodyPoint(-1.9, 0.93, 0.06); b.ball(cuir, g, 1, { scale: [0.05, 0.07, 0.035], nu: 12, nv: 8 }); b.tube(or, t => [g[0], g[1] + 0.065 + 0.03 * t, g[2]], 0.012, { nu: 8, nv: 1 });
    b.ball(ind, [0, 1.578, -0.03], 1, { scale: [0.146, 0.088, 0.156], nu: 20, nv: 10, skin: wHead });
    for (const [y, r, rx, tilt, m] of [[1.555, 0.022, 0.136, 0.035, in2], [1.59, 0.024, 0.13, -0.03, ind], [1.625, 0.02, 0.1, 0.02, in2]]) b.headRing(m, y, r, { rx, rz: rx + 0.011, tilt });
    b.ball(or, [0, 1.588, 0.132], 0.02, { scale: [1, 1, 0.4], skin: wHead }); b.gem(sa, [0, 1.588, 0.14], [0, 0.02, 0], 0.012, { skin: wHead });
    b.blade(ind, [0.125, 1.57, -0.06], [0.02, -0.27, -0.02], Z, 0.045, { skin: wBody, cup: 0.012 });
  },

  'alchimiste'(b, K, h) {
    const cuir = K.leather('cuir-tablier', '#5d3b22'), dl = K.leather('cuir-sombre', '#35241a'), mu = K.linen('lin-moutarde', '#b9963a'), rev = K.linen('revers', '#a39a6a'), lt = K.metal('laiton', '#a8843a', 0.4), liege = K.flat('liege', { color: '#b69668', rough: 0.9 }), dbl = K.linen('doublure', '#4d5220');
    const vial = ['#c9453f', '#4aa8c9', '#62c95e', '#9a5cc9'].map((c, i) => K.gem('fiole-' + (i + 1), c, 0.8));
    const base = { hemY: 0.32, flare: t => 0.11 * t, slits: [{ th: PI, w: 0.08, from: 0.72 }], lining: dbl, seed: 19 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.05);
    sleeves(b, K, K.fab, 'short', { edge: rev, w: 0.05 });
    b.garment(cuir, { range: [-0.38, 0.38], yTop: 1.25, hemY: 1.02, fit: 0.012 });
    const ap = { range: [-0.75, 0.75], yTop: 1.03, hemY: 0.45, fit: 0.014, flare: base.flare, flareHem: 0.32, folds: 0.006, seed: 19 };
    b.garment(cuir, { ...ap, taper: v => 1 - 0.25 * sstep(0.75, 1, v) });
    both(s => {
      const a = bodyPoint(0.38 * s, 1.25, 0.014), c = [0.045 * s, 1.365, -0.07];
      b.tube(dl, t => add(add(mul(a, 1 - t), mul(c, t)), [0.02 * s * Math.sin(PI * t), 0.035 * Math.sin(PI * t), 0]), 0.007, { nu: 6, nv: 10, skin: CHEST });
      b.ball(lt, a, 0.009, { skin: CHEST, nu: 6, nv: 4 });
      const pk = onG(ap, 0.42 * s, 0.72, 0.012); b.box(dl, pk, [0.047, 0.05, 0.009]); b.box(cuir, [pk[0], pk[1] + 0.045, pk[2] + 0.004], [0.049, 0.012, 0.01]);
      for (const dx of [-0.034, 0.034]) b.ball(lt, [pk[0] + dx, pk[1] + 0.045, pk[2] + 0.015], 0.005, { nu: 6, nv: 4 });
    });
    const flask = (m, p, hh, skin) => { b.tube(m, t => [p[0], p[1] + hh * t, p[2]], t => 0.012 * (t > 0.8 ? 0.6 : 1), { nu: 8, nv: 5, skin }); b.ball(liege, [p[0], p[1] + hh + 0.004, p[2]], 0.009, { nu: 6, nv: 4, skin }); };
    const pk = onG(ap, 0.42, 0.78, 0.024); flask(vial[0], [pk[0] - 0.02, pk[1], pk[2]], 0.05, wBody); flask(vial[1], [pk[0] + 0.014, pk[1], pk[2]], 0.04, wBody);
    ceinture(b, dl, lt, 1.03, { h: 0.04, off: 0.019, th: 0.5 }); bourse(b, cuir, dl, lt, -1.05, 1.03);
    const by = th => 1.15 + 0.13 * Math.sin(th + 0.35);
    b.tube(dl, t => bodyPoint(t * TAU, by(t * TAU), 0.022), 0.019, { nu: 6, nv: 60, closed: true, squash: 0.3 });
    [0.36, 0.1, -0.16].forEach((th, i) => { const p = bodyPoint(th, by(th) - 0.03, 0.036); flask(vial[i + 1], p, 0.05, CHEST); b.tube(dl, t => add(p, [0.014 * Math.cos(t * TAU), 0.02, 0.014 * Math.sin(t * TAU)]), 0.003, { nu: 4, nv: 10, closed: true, skin: CHEST }); });
    b.mantle(mu, { reach: 0.14, rzF: 0.125, rzB: 0.115, drop: 0.13, pow: 1.1, lift: 0.01, ripple: 0.012, edge: th => 1 + 0.3 * Math.pow(Math.max(0, Math.cos(th)), 6) });
    b.tube(mu, t => bodyPoint(t * TAU, 1.345, 0.012), 0.022, { nu: 8, nv: 32, closed: true, skin: CHEST });
  },

  'enchanteresse-des-roses'(b, K, h) {
    const vel = K.velvet('velours-bordeaux', '#7a2a45'), cl = K.satin('satin-rose-pale', '#e6c6cf'), tige = K.suede('feuillage', '#5a7a4a'), rose = K.satin('satin-rose', '#c9728a'), or = K.metal('or-rose', '#c9966a', 0.35), dbl = K.satin('doublure', '#a85a72');
    const k = h ? 0.55 : 1, up = y => (h ? y + 0.3 * (1.02 - y) : y);
    const tier = (m, yT, hY, o0, o1, sd) => { const yTop = up(yT), hemY = up(hY);
      const o = { yTop, hemY, flareFrom: yTop, flare: () => 1e-9, folds: 0.014 + 0.08 * o1 * k, foldN: 15, seed: sd, lining: dbl, fit: y => lerp(o0, o1, clamp((yTop - y) / (yTop - hemY), 0, 1.1)) * k };
      b.garment(m, o); band(b, K.galon, o, 0.1, 0.004, { strip: true }); };
    tier(K.fab, 0.36, 0.1, 0.17, 0.34, 21); tier(cl, 0.57, 0.3, 0.09, 0.26, 22); tier(K.fab, 0.79, 0.51, 0.02, 0.18, 23); tier(cl, 1.02, 0.73, 0.0, 0.1, 24);
    const bod = h ? { yTop: 1.352, hemY: 0.98, fit: 0.005 } : { yTop: 1.27, rxMax: 0.128, hemY: 1.0, fit: 0.005 };
    b.garment(vel, bod);
    b.garment(cl, { range: [-0.15, 0.15], yTop: h ? 1.3 : 1.265, rxMax: bod.rxMax, hemY: 1.02, fit: 0.008 });
    lacets(b, or, bod, h ? 1.27 : 1.24, 1.05, 5, 0.15, 0.011);
    both(s => {
      b.sleeve(rose, s, { x0: 0.105, x1: 0.25, r: x => 0.05 + 0.055 * Math.sin(PI * (x - 0.105) / 0.145), wrinkle: false });
      brassard(b, K.galon, s, 0.235, 0.262, 0.056, 0.054, { strip: true });
      if (h) { b.sleeve(vel, s, { r: SL.fitted, x0: 0.22 }); brassard(b, K.galon, s, 0.525, 0.562, 0.047, 0.046, { strip: true }); }
    });
    if (h) col(b, vel, { h: 0.05, open: 0.08 });
    const rc = bodyPoint(0, h ? 1.3 : 1.265, 0.024, bod.rxMax);
    const fleur = (c, r, skin) => { b.ball(rose, c, r, { scale: [1, 1, 0.6], skin }); for (let i = 0; i < 5; i++) { const a = i * 1.2566; b.ball(vel, add(c, [r * 0.62 * Math.cos(a), r * 0.62 * Math.sin(a), r * 0.3]), r * 0.5, { nu: 8, nv: 5, skin }); } b.ball(cl, add(c, [0, 0, r * 0.62]), r * 0.36, { nu: 8, nv: 5, skin }); };
    fleur(rc, 0.03, CHEST);
    both(s => b.blade(tige, add(rc, [0.014 * s, 0, 0]), [0.06 * s, -0.022, 0.004], Y, 0.02, { skin: CHEST }));
    both(s => {
      b.ball(vel, bodyPoint(PI + 0.42 * s, 1.03, 0.055), 0.075, { scale: [1, 0.6, 0.4] });
      b.garment(vel, { range: s > 0 ? [PI + 0.06, PI + 0.3] : [PI - 0.3, PI - 0.06], yTop: 1.02, hemY: up(0.58), flareFrom: -1, fit: y => lerp(0.03, 0.2 * k + 0.03, (1.02 - y) / 0.44), taper: v => 1 - 0.5 * sstep(0.8, 1, v), folds: false });
    });
    b.ball(vel, bodyPoint(PI, 1.03, 0.05), 0.035);
    b.belt(K.galon, 1.01, 0.035, 0.008, { strip: true });
    if (!h) b.tube(vel, t => [0.052 * Math.sin(t * TAU), 1.37, -0.028 + 0.052 * Math.cos(t * TAU)], 0.006, { nu: 6, nv: 24, closed: true, skin: NECK });
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * TAU, p = [0.108 * Math.sin(a), 1.595 + 0.012 * Math.cos(a), -0.03 + 0.118 * Math.cos(a)];
      b.ball(i % 2 ? vel : rose, p, 0.024, { nu: 8, nv: 6, skin: wHead }); b.ball(cl, [p[0] * 1.08, p[1] + 0.012, p[2] * 1.08 + 0.002], 0.01, { nu: 6, nv: 4, skin: wHead });
      b.blade(tige, p, [0.05 * Math.sin(a + 0.3), -0.01, 0.05 * Math.cos(a + 0.3)], Y, 0.014, { skin: wHead });
    }
  },

  'arcaniste'(b, K, h) {
    const dp = K.velvet('velours-aubergine', '#2a1248'), ar = K.metal('argent', '#b9bec8', 0.3), mv = K.gem('cristal-arcane', '#b98cf0'), cuir = K.leather('reliure', '#3a2030'), dbl = K.satin('doublure', '#8a8fa0'), parch = K.flat('parchemin', { color: '#d9c9a0', rough: 0.9 });
    const base = { hemY: 0.12, flare: t => (h ? 0.16 : 0.19) * t, lining: dbl, seed: 25 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.06);
    sleeves(b, K, K.fab, 'bell', { lining: dbl });
    const cape = { reach: 0.25, drop: 0.19, edge: th => 1 + 0.3 * H.zig(4, 1, 0.5)(th) };
    b.mantle(dp, cape); b.mantle(K.galon, { ...cape, s0: 0.86, s1: 1, lift: 0.011, nv: 2, strip: true });
    for (const s of [1, -1]) {
      const st = { range: s > 0 ? [0.09, 0.31] : [-0.31, -0.09], yTop: 1.34, hemY: 0.42, fit: 0.017, flare: base.flare, flareHem: 0.12, folds: false };
      b.garment(K.galon, { ...st, strip: 'v', taper: v => 1 - 0.9 * sstep(0.95, 1, v) });
      const e = onG(st, 0.2 * s, 0.41, 0.006); for (const dx of [-0.02, 0, 0.02]) b.tube(ar, t => [e[0] + dx, e[1] - 0.05 * t, e[2]], 0.003, { nu: 4, nv: 2 });
    }
    b.tube(dp, t => { const a = lerp(0.95, TAU - 0.95, t); return [0.1 * Math.sin(a), 1.345, -0.03 + 0.11 * Math.cos(a)]; }, t => 0.046 * Math.pow(Math.sin(PI * t), 0.5) + 0.002, { nu: 10, nv: 20, skin: CHEST });
    b.ball(ar, bodyPoint(0, 1.25, 0.036), 0.024, { scale: [1, 1, 0.4], skin: CHEST }); b.gem(mv, bodyPoint(0, 1.25, 0.048), [0, 0.016, 0], 0.012, { skin: CHEST });
    ceinture(b, cuir, ar, 1.03, { h: 0.04, off: 0.021, th: 0.55 });
    const tp = bodyPoint(-1.25, 0.92, 0.055);
    b.box(cuir, tp, [0.024, 0.072, 0.052], { skin: HIPS }); b.box(parch, [tp[0], tp[1], tp[2] + 0.004], [0.02, 0.066, 0.05], { skin: HIPS });
    for (const dy of [-0.045, 0.045]) b.box(ar, [tp[0], tp[1] + dy, tp[2] + 0.03], [0.027, 0.008, 0.026], { skin: HIPS });
    b.tube(cuir, t => add(mul(bodyPoint(-1.25, 1.03, 0.02), 1 - t), mul([tp[0], tp[1] + 0.072, tp[2]], t)), 0.005, { nu: 5, nv: 2, skin: HIPS });
    const rl = bodyPoint(1.2, 0.95, 0.05); b.tube(parch, t => [rl[0], rl[1] - 0.05 + 0.14 * t, rl[2] - 0.03 + 0.04 * t], 0.016, { nu: 8, nv: 2, skin: HIPS });
    diademe(b, ar, mv);
    both(s => { b.gem(mv, [0.2 * s, 1.59, -0.02], [0, 0.045, 0], 0.02, { skin: wHead }); b.gem(mv, [0.235 * s, 1.5, 0.02], [0, 0.026, 0], 0.012, { skin: wHead }); });
  },

  'sorcier-de-cour'(b, K, h) {
    const or = K.metal('or', '#c9a24a', 0.3), noir = K.velvet('velours-noir', '#1a161c'), dent = K.linen('dentelle', '#f1ebe0'), satin = K.satin('brocart-or', '#b8923c'), plume = K.flat('plume', { color: '#6b1a30', rough: 0.8 }), cuir = K.leather('cuir-noir', '#1f1a1c'), dbl = K.satin('doublure-or', '#a8843a'), rub = K.gem('grenat', '#a01f3a');
    const base = { hemY: 0.5, flare: t => 0.2 * Math.pow(t, 0.8), lining: dbl, seed: 26 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.05);
    const pl = { ...base, lining: null, range: [-0.17, 0.17], yTop: 1.33, fit: 0.006, ao: false };
    b.garment(satin, pl);
    for (const s of [1, -1]) b.garment(K.galon, { ...pl, range: s > 0 ? [0.12, 0.18] : [-0.18, -0.12], fit: 0.009, strip: 'v' });
    boutons(b, or, base, [1.16, 1.08, 0.94, 0.86, 0.78, 0.7, 0.62], 0, 0.013, 0.012);
    b.garment(dent, { range: [-0.16, 0.16], yTop: 1.3, hemY: 1.17, fit: 0.016, hem: H.scallop(44, 0.012), nu: 24, folds: false });
    b.garment(dent, { range: [-0.21, 0.21], yTop: 1.35, hemY: 1.25, fit: 0.024, hem: H.scallop(44, 0.012), nu: 30, folds: false });
    b.ball(or, bodyPoint(0, 1.325, 0.034), 0.014, { skin: CHEST }); b.gem(rub, bodyPoint(0, 1.325, 0.044), [0, 0.01, 0], 0.009, { skin: CHEST });
    sleeves(b, K, K.fab, 'bishop', { galon: false });
    both(s => { brassard(b, K.galon, s, 0.5, 0.556, 0.056, 0.058, { strip: true }); brassard(b, dent, s, 0.552, 0.59, 0.05, 0.072); });
    ceinture(b, cuir, or, 1.03, { h: 0.04, th: 0.45 }); bourse(b, cuir, cuir, or, -1.0, 1.03);
    const cp = { range: [1.95, PI + 0.75], yTop: 1.345, hemY: 0.44, fit: y => 0.03 + 0.06 * (1.345 - y), hem: H.wave(3, 0.03), skin: wMantle, lining: dbl, folds: 0.02, seed: 27 };
    b.garment(noir, cp); band(b, K.galon, cp, 0.045, 0.003, { strip: true });
    b.tube(or, t => bodyPoint(lerp(2.0, -0.95, t), 1.335 - 0.085 * Math.sin(PI * t), 0.014), 0.005, { nu: 6, nv: 20 });
    for (const th of [2.0, -0.95]) b.ball(or, bodyPoint(th, 1.335, 0.016), 0.014, { skin: CHEST });
    const ex = norm([1, 0.14, 0]);
    b.disc(noir, [0, 1.588, -0.03], ex, Z, 0.1, a => 0.27 + 0.02 * Math.cos(a) + 0.012 * Math.sin(2 * a), { nv: 4 });
    b.tube(noir, t => [0, 1.588 + 0.075 * t, -0.03], t => lerp(0.114, 0.1, t), { nu: 24, nv: 2, skin: wHead });
    b.disc(noir, [0, 1.663, -0.03], X, Z, 0, 0.1, { nu: 24, nv: 1 });
    b.tube(K.galon, t => [0, 1.598 + 0.028 * t, -0.03], () => 0.116, { nu: 24, nv: 1, skin: wHead, U: 6, V: 1 });
    b.blade(plume, [-0.1, 1.61, -0.06], [-0.13, 0.2, -0.22], [0.3, 1, 0], 0.05, { curl: -0.06, cup: 0.012 });
    b.blade(K.flat('plume-or', { color: '#c9a24a', rough: 0.7 }), [-0.1, 1.61, -0.05], [-0.16, 0.12, -0.15], [0.3, 1, 0], 0.03, { curl: -0.04 });
    b.blade(noir, [-0.1, 1.61, -0.07], [-0.08, 0.24, -0.24], [0.3, 1, 0], 0.035, { curl: -0.07 });
    b.ball(or, [-0.105, 1.615, -0.03], 0.014, { skin: wHead });
  },

  'sylphe-des-vents'(b, K, h) {
    const bl = K.satin('satin-blanc', '#f1efe8'), or = K.metal('or-pale', '#d9c98a', 0.3), pl = K.flat('plume-blanche', { color: '#f4f2ec', rough: 0.85 }), pm = K.flat('plume-sauge', { color: '#9fcdb2', rough: 0.85 }), op = K.gem('opale', '#dff1e6');
    b.garment(bl, { yTop: 1.0, hemY: 0.64, flare: t => 0.17 * t, fit: -0.003, hem: H.leaf(7, 0.15, 0.5), seed: 28 });
    const base = h ? { hemY: 0.68, flare: t => 0.18 * t, hem: H.leaf(8, 0.14), seed: 29 } : { yTop: 1.285, rxMax: 0.128, hemY: 0.7, flare: t => 0.2 * t, hem: H.leaf(8, 0.14), seed: 29 };
    b.garment(K.fab, base); galonBas(b, K, base, 0.035);
    if (h) { sleeves(b, K, K.fab, 'short', { w: 0.03 }); b.garment(K.galon, { range: [-0.05, 0.05], yTop: 1.33, hemY: 1.06, fit: 0.006, strip: 'v' }); }
    both(s => {
      if (!h) { const a = bodyPoint(0.5 * s, 1.285, 0.004, 0.128), c = [0.03 * s, 1.368, -0.075];
        b.tube(bl, t => add(add(mul(a, 1 - t), mul(c, t)), [0.03 * s * Math.sin(PI * t), 0.03 * Math.sin(PI * t), 0]), 0.008, { nu: 6, nv: 10, skin: CHEST }); }
      [[0.3, 0.2, -0.12], [0.35, 0.1, -0.15], [0.36, -0.02, -0.15], [0.31, -0.13, -0.13], [0.22, -0.2, -0.1]].forEach((d, i) =>
        b.blade(i % 2 ? pm : pl, [0.05 * s, 1.25, -0.115 - 0.004 * i], [d[0] * s, d[1], d[2]], [0, 1, 0.3], 0.055 - 0.004 * i, { skin: CHEST, cup: 0.012 }));
      b.tube(bl, t => { const x = lerp(0.33, 0.52, t), a2 = t * 4 * TAU, r = lerp(0.046, 0.034, t) * b.corps.arm; return [x * s, ARM_Y + r * Math.cos(a2), ARM_Z + r * Math.sin(a2)]; }, 0.0055, { nu: 5, nv: 70, skin: wArm });
      brassard(b, or, s, h ? 0.32 : 0.15, h ? 0.335 : 0.17, h ? 0.05 : 0.052);
      b.tube(bl, t => [s * (0.09 + 0.27 * t), 1.3 - 0.6 * t + 0.04 * Math.sin(7 * t), -0.125 - 0.1 * Math.sin(3 * t)], 0.014, { nu: 6, nv: 24, squash: 0.15, skin: CHEST, up: Z });
      b.blade(pl, [0.118 * s, 1.5, -0.03], [0.05 * s, 0.15, -0.1], [s, 0.2, 0.3], 0.03);
      b.blade(pm, [0.12 * s, 1.49, -0.04], [0.09 * s, 0.05, -0.13], [s * 0.3, 1, 0.2], 0.024);
    });
    if (!h) b.tube(bl, t => [0.054 * Math.sin(t * TAU), 1.366, -0.028 + 0.054 * Math.cos(t * TAU)], 0.007, { nu: 6, nv: 24, closed: true, skin: NECK });
    b.belt(K.galon, 1.03, 0.04, 0.008, { strip: true });
    b.blade(pl, bodyPoint(0.6, 1.02, 0.03), [0.02, -0.27, 0.03], [1, 0, -0.6], 0.036, { skin: wBody });
    b.blade(pm, bodyPoint(0.45, 1.02, 0.03), [0.0, -0.2, 0.03], [1, 0, -0.4], 0.028, { skin: wBody });
    b.ball(or, bodyPoint(0.52, 1.03, 0.02), 0.014);
    diademe(b, or, op, { r: 0.0055 });
  },

  'prismancien'(b, K, h) {
    const bl = K.satin('satin-nacre', '#eceaf0'), ar = K.metal('argent', '#c9ced8', 0.22);
    const col3 = { cy: '#8fd0e0', pk: '#e3a6cf', ye: '#eadf9a', vi: '#b79ae6', gn: '#a6dcb4' }, M = {};
    for (const k in col3) M[k] = K.gem('cristal-' + k, col3[k], 0.85);
    const hemY = th => 0.16 - 0.1 * Math.pow(Math.abs(Math.cos(th)), 3);
    const F = th => 0.6 * Math.cos(9 * th + 1) + 0.4 * Math.cos(14 * th + 2.2);
    const chP = (th, k, off = 0) => { const y = lerp(1.352, hemY(th), k), r = L.bodyRing(y), f = 0.035 * Math.pow(k, 1.6) * F(th);
      const rx = Math.max(r[1] + 0.012, lerp(0.09, 0.44, k)) + off + f, rz = Math.max((r[3] - r[2]) / 2 + 0.012, lerp(0.09, 0.38, k)) + off + f;
      return [rx * Math.sin(th), y, lerp((r[2] + r[3]) / 2, 0, sstep(0, 0.5, k)) + rz * Math.cos(th)]; };
    const skin = p => { const a = sstep(0.95, 1.15, p[1]), m = new Map(); for (const [n, v] of wMantle(p)) m.set(n, (m.get(n) || 0) + v * a); for (const [n, v] of wBody(p)) m.set(n, (m.get(n) || 0) + v * (1 - a)); return [...m].filter(e => e[1] > 1e-4).sort((p1, p2) => p2[1] - p1[1]).slice(0, 4); };
    const chas = (m, k0, k1, off, nv, o = {}) => b.surf(m, 128, nv, (u, v) => { const th = lerp(-PI, PI, u), a = typeof k0 === 'function' ? k0(th) : k0, c = typeof k1 === 'function' ? k1(th) : k1; return chP(th, lerp(a, c, v), off); },
      { closeU: true, flip: true, skin, ...o });
    chas(K.fab, 0, 1, 0, 44, { color: (u, v) => { const c = 1 - 0.4 * Math.max(0, -F(lerp(-PI, PI, u))) * Math.pow(v, 0.8); return [c, c, c]; } });
    chas(K.galon, 0.93, 1, 0.004, 2, { strip: true });
    const yk = th => 0.1 + 0.1 * Math.pow(Math.abs(Math.cos(th)), 4);
    chas(bl, 0, yk, 0.006, 10); chas(K.galon, th => yk(th) * 0.78, yk, 0.009, 2, { strip: true });
    const ec = chP(0, 0.1, 0.022);
    b.ball(ar, ec, 0.034, { scale: [1, 1, 0.3], skin: CHEST }); b.gem(M.cy, add(ec, [0, 0, 0.008]), [0, 0.034, 0], 0.024, { nu: 3, skin: CHEST });
    both(s => {
      b.sleeve(bl, s, { r: SL.fitted });
      b.sleeve(s > 0 ? M.cy : M.pk, s, { x0: 0.5, x1: 0.566, r: x => lerp(0.05, 0.085, (x - 0.5) / 0.066), nu: 6, nv: 1, wrinkle: false, surf: { flat: true } });
      brassard(b, K.galon, s, 0.47, 0.502, 0.05, 0.049, { strip: true });
    });
    ['vi', 'cy', 'ye', 'pk', 'gn'].forEach((k, i) => { const a = lerp(PI - 1.1, PI + 1.1, i / 4), d = [Math.sin(a), 0, Math.cos(a)];
      b.spike(M[k], [0.075 * d[0], 1.35, -0.022 + 0.075 * d[2]], [0.19 * d[0], 1.48 + 0.05 * (i % 2), -0.022 + 0.19 * d[2]], 0.035, { nu: 4, skin: CHEST }); });
    diademe(b, ar, null);
    b.gem(M.cy, [0, 1.6, 0.1], [0, 0.05, 0.004], 0.015, { skin: wHead });
    both(s => b.gem(s > 0 ? M.pk : M.ye, [0.05 * s, 1.59, 0.09], [0.01 * s, 0.038, 0], 0.012, { skin: wHead }));
  },

  'chamane-des-esprits'(b, K, h) {
    const daim = K.suede('daim-brun', '#3a2416'), d2 = K.suede('daim-clair', '#a57c4e'), tu = K.cloth('laine-turquoise', '#2f8f86', 'wool_boucle'), os = K.flat('os', { color: '#ddd3b8', rough: 0.55 }), pt = K.flat('plume-turquoise', { color: '#2f8f86', rough: 0.85 }),
      pc = K.flat('plume-claire', { color: '#ddd3b8', rough: 0.85 }), pd = K.flat('plume-brune', { color: '#8a623c', rough: 0.85 }), perle = K.gem('turquoise', '#2fa89c'), cuir = K.leather('cuir', '#4a2f1c');
    const base = { yTop: 1.04, hemY: 0.38, flare: t => 0.09 * t, hem: H.zig(40, 0.06), nu: 240, slits: [{ th: 1.25, w: 0.08, from: 0.84 }], seed: 30 };
    b.garment(K.fab, base);
    ceinture(b, cuir, os, 1.03, { h: 0.05, off: 0.008, th: -0.5 });
    bourse(b, d2, daim, os, 0.9, 1.03);
    for (const [th, m] of [[-0.95, pt], [-1.1, pc], [-1.25, pd]]) b.blade(m, bodyPoint(th, 1.01, 0.03), [0.01, -0.22, 0.02], fr(th).r, 0.028, { skin: wBody, cup: 0.008 });
    const po = { reach: 0.44, rzF: 0.225, rzB: 0.215, rpow: 0.45, drop: 0.5, pow: 1.15, nu: 96, nv: 16, lift: 0.012, ripple: 0.012, rippleN: 11 };
    b.mantle(daim, po);
    b.mantle(tu, { ...po, s0: 0.58, s1: 0.68, lift: 0.017, nv: 2 }); b.mantle(K.galon, { ...po, s0: 0.72, s1: 0.82, lift: 0.017, nv: 2, strip: true }); b.mantle(d2, { ...po, s0: 0.88, s1: 0.92, lift: 0.017, nv: 1 });
    b.mantle(d2, { ...po, s0: 0.985, s1: 1, nu: 240, nv: 2, edge: th => 1 + 0.08 * H.zig(60, 1)(th), lift: 0.011 });
    for (let i = 0; i < 11; i++) { const a = lerp(-1.1, 1.1, i / 10), p = [0.082 * Math.sin(a), 1.353, -0.022 + 0.082 * Math.cos(a)];
      b.spike(os, p, [p[0] * 1.35, 1.31 - 0.012 * Math.cos(a * 1.5), p[2] + 0.03 * Math.cos(a)], 0.008, { nu: 5, skin: CHEST }); b.ball(perle, p, 0.007, { nu: 6, nv: 4, skin: CHEST }); }
    both(s => {
      for (let i = 0; i < 3; i++) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r = 0.036 * b.corps.arm; b.ball(i === 1 ? os : perle, [(0.485 + 0.014 * i) * s, ARM_Y + r * Math.cos(a), ARM_Z + r * Math.sin(a)], 0.007, { nu: 6, nv: 4, skin: wArm }); }
      b.tube(os, t => [s * (0.1 + 0.13 * t + 0.03 * Math.sin(PI * t)), 1.56 + 0.2 * Math.pow(t, 1.3), -0.03 - 0.02 * t], t => (0.03 * (1 - t) + 0.003) * (1 + 0.06 * Math.sin(t * 40)), { nu: 8, nv: 20, skin: wHead });
    });
    [[0, pt, 0.21], [0.075, pc, 0.17], [-0.075, pd, 0.17], [0.14, pt, 0.12], [-0.14, pc, 0.12]].forEach(([dx, m, hh]) => b.blade(m, [dx * 0.5, 1.6, -0.06], [dx, hh, -0.05], X, 0.03, { cup: 0.006 }));
    b.headRing(d2, 1.555, 0.012, { rx: 0.122, rz: 0.132, squash: 0.5 });
    for (let i = 0; i < 9; i++) { const a = lerp(-0.9, 0.9, i / 8); b.ball(i % 2 ? os : perle, [0.124 * Math.sin(a), 1.555, -0.03 + 0.134 * Math.cos(a)], 0.008, { nu: 6, nv: 4, skin: wHead }); }
  },
};
