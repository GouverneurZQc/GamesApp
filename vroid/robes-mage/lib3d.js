'use strict';
// Générateur de vêtements 3D pour personnages VRoid : maillage, skinning et export GLB (aucune dépendance).
// Repère : mètres, Y vers le haut, le personnage regarde vers +Z (comme VRM 1.0), pose en T.
const fs = require('fs');

const PI = Math.PI, TAU = PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => { const l = len(a); return l > 1e-12 ? mul(a, 1 / l) : [0, 1, 0]; };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// --- Squelette VRoid standard (positions monde en pose T, relevées sur un modèle VRoid Studio) ---
const BONES = [
  ['Root', null, [0, 0, 0]],
  ['J_Bip_C_Hips', 'Root', [0, 0.9081, 0.0036]],
  ['J_Bip_C_Spine', 'J_Bip_C_Hips', [0, 0.9601, 0.0161]],
  ['J_Bip_C_Chest', 'J_Bip_C_Spine', [0, 1.0732, 0.0191]],
  ['J_Bip_C_UpperChest', 'J_Bip_C_Chest', [0, 1.1808, 0.0045]],
  ['J_Bip_C_Neck', 'J_Bip_C_UpperChest', [0, 1.3131, -0.0339]],
  ['J_Bip_C_Head', 'J_Bip_C_Neck', [0, 1.3863, -0.0247]],
];
for (const [S, sx] of [['L', 1], ['R', -1]]) {
  BONES.push(
    [`J_Bip_${S}_Shoulder`, 'J_Bip_C_UpperChest', [0.0224 * sx, 1.2865, -0.0255]],
    [`J_Bip_${S}_UpperArm`, `J_Bip_${S}_Shoulder`, [0.1086 * sx, 1.2742, -0.0255]],
    [`J_Bip_${S}_LowerArm`, `J_Bip_${S}_UpperArm`, [0.3284 * sx, 1.2742, -0.0255]],
    [`J_Bip_${S}_Hand`, `J_Bip_${S}_LowerArm`, [0.5431 * sx, 1.2742, -0.0258]],
    [`J_Bip_${S}_UpperLeg`, 'J_Bip_C_Hips', [0.0772 * sx, 0.8683, -0.0001]],
    [`J_Bip_${S}_LowerLeg`, `J_Bip_${S}_UpperLeg`, [0.0772 * sx, 0.5154, -0.0075]],
    [`J_Bip_${S}_Foot`, `J_Bip_${S}_LowerLeg`, [0.0772 * sx, 0.1007, -0.0324]],
  );
}
const BI = Object.fromEntries(BONES.map((b, i) => [b[0], i]));
const ARM_Y = 1.2742, ARM_Z = -0.0255, HIP_Y = 0.88;

// --- Enveloppe du corps (avec ~1,5 cm d'aisance) : y, demi-largeur, z dos, z devant ---
// Femme : relevée sur un modèle VRoid. Homme : même repère, buste plat, épaules larges, hanches étroites ;
// à l'export la version homme est agrandie (x1,07) et ses bras écartés de 1,2 cm.
const CORPS = {
  f: { scale: 1, shift: 0, arm: 1, body: [[1.352, 0.062, -0.082, 0.040], [1.315, 0.120, -0.090, 0.060], [1.275, 0.158, -0.095, 0.095], [1.20, 0.152, -0.098, 0.143],
    [1.12, 0.142, -0.100, 0.143], [1.04, 0.138, -0.105, 0.138], [0.96, 0.158, -0.118, 0.138], [0.88, 0.182, -0.138, 0.138]] },
  h: { scale: 1.07, shift: 0.012, arm: 1.12, body: [[1.352, 0.068, -0.086, 0.046], [1.315, 0.132, -0.095, 0.068], [1.275, 0.172, -0.101, 0.100], [1.20, 0.166, -0.105, 0.126],
    [1.12, 0.156, -0.105, 0.126], [1.04, 0.151, -0.107, 0.127], [0.96, 0.157, -0.115, 0.130], [0.88, 0.170, -0.129, 0.131]] },
};
let cur = CORPS.f, BODY = cur.body;
function bodyRing(y) {
  if (y >= BODY[0][0]) return BODY[0];
  for (let i = 1; i < BODY.length; i++) if (y >= BODY[i][0]) {
    const a = BODY[i - 1], b = BODY[i], t = sstep(0, 1, (a[0] - y) / (a[0] - b[0]));
    return [y, lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
  }
  return BODY[BODY.length - 1];
}
// Point sur le corps : angle th (0 = devant, +PI/2 = côté gauche du personnage), hauteur y, décalage off.
function bodyPoint(th, y, off = 0, rxMax = 9) {
  const r = bodyRing(y), rx = Math.min(r[1], rxMax) + off, cz = (r[2] + r[3]) / 2, rz = (r[3] - r[2]) / 2 + off;
  return [rx * Math.sin(th), y, cz + rz * Math.cos(th)];
}

// --- Poids de skinning ---
const top4 = w => {
  const m = new Map(); for (const [n, v] of w) if (v > 1e-4) m.set(n, (m.get(n) || 0) + v);
  const a = [...m].sort((p, q) => q[1] - p[1]).slice(0, 4), s = a.reduce((t, e) => t + e[1], 0);
  return a.map(([n, v]) => [n, v / s]);
};
const SPINE = [['J_Bip_C_Hips', -9], ['J_Bip_C_Spine', 0.9601], ['J_Bip_C_Chest', 1.0732], ['J_Bip_C_UpperChest', 1.1808], ['J_Bip_C_Neck', 1.3131], ['J_Bip_C_Head', 1.3863]];
function wBody(p, legMax = 0.93) {
  const [x, y] = p, w = [];
  const s = SPINE.map(([, j]) => (j < 0 ? 1 : sstep(j - 0.04, j + 0.04, y)));
  SPINE.forEach(([n], i) => w.push([n, s[i] - (s[i + 1] || 0)]));
  const leg = sstep(0.93, 0.64, y) * legMax;
  if (leg > 0) {
    const side = sstep(-0.06, 0.06, x), low = 0.72 * sstep(0.56, 0.4, y);
    w[0][1] *= 1 - leg;
    w.push(['J_Bip_L_UpperLeg', leg * side * (1 - low)], ['J_Bip_L_LowerLeg', leg * side * low],
      ['J_Bip_R_UpperLeg', leg * (1 - side) * (1 - low)], ['J_Bip_R_LowerLeg', leg * (1 - side) * low]);
  }
  return top4(w);
}
function wArm(p) {
  const S = p[0] >= 0 ? 'L' : 'R', x = Math.abs(p[0]);
  const s1 = sstep(0.085, 0.165, x), s2 = sstep(0.29, 0.37, x), s3 = sstep(0.515, 0.57, x);
  return top4([['J_Bip_C_UpperChest', 1 - s1], [`J_Bip_${S}_UpperArm`, s1 - s2], [`J_Bip_${S}_LowerArm`, s2 - s3], [`J_Bip_${S}_Hand`, s3]]);
}
// Pèlerines et ponchos : suivent le buste, et en partie les bras sur les côtés.
function wMantle(p) {
  const S = p[0] >= 0 ? 'L' : 'R', x = Math.abs(p[0]);
  const a = 0.75 * sstep(0.13, 0.26, x), f = 0.5 * sstep(0.3, 0.42, x);
  return top4([...wBody(p, 0).map(([n, v]) => [n, v * (1 - a)]), [`J_Bip_${S}_UpperArm`, a * (1 - f)], [`J_Bip_${S}_LowerArm`, a * f]]);
}
const rigid = name => () => [[name, 1]];
const wHead = rigid('J_Bip_C_Head');

// --- Formes d'ourlet : angle -> longueur ajoutée (m) ---
const frac = x => x - Math.floor(x);
const H = {
  zig: (n, a, ph = 0) => th => a * (1 - Math.abs(2 * frac(n * th / TAU + ph) - 1)),
  scallop: (n, a, ph = 0) => th => a * Math.pow(Math.abs(Math.sin(n * th / 2 + ph * PI)), 0.6),
  wave: (n, a) => th => a * 0.5 * (1 + Math.sin(n * th)),
  leaf: (n, a, ph = 0) => th => a * (1 - Math.pow(2 * frac(n * th / TAU + ph) - 1, 2)),
  flame: (n, a) => th => { const k = Math.floor(n * th / TAU + 100); return a * (0.55 + 0.45 * hash(k)) * Math.pow(1 - Math.abs(2 * frac(n * th / TAU) - 1), 1.4); },
  ragged: (n, a, seed = 1) => th => { const u = n * th / TAU + 100, k = Math.floor(u), c = 0.25 + 0.5 * hash(k + seed), f = frac(u);
    return a * (0.35 + 0.65 * hash(k * 3.1 + seed)) * (f < c ? f / c : (1 - f) / (1 - c)); },
  vee: (a, k = 3) => th => a * Math.pow(Math.abs(Math.cos(th)), k),
  diag: (a, ph = 0) => th => a * 0.5 * (1 + Math.sin(th + ph)),
};

class Builder {
  constructor(sexe = 'f') { cur = CORPS[sexe]; BODY = cur.body; this.corps = cur; this.h = sexe === 'h'; this.mats = new Map(); this.prims = new Map(); this.tile = 0.5; }
  // Matériau : { color:'#hex', tex:'chemin.png', metallic, rough, alpha, emissive:'#hex' }
  mat(name, def) { this.mats.set(name, def); this.prims.set(name, { pos: [], nrm: [], uv: [], jw: [], col: [], idx: [] }); return name; }

  _v(pr, p, n, uv, w, col) {
    pr.pos.push(p[0], p[1], p[2]); pr.nrm.push(n[0], n[1], n[2]); pr.uv.push(uv[0], uv[1]);
    pr.jw.push(w); pr.col.push(col || null); return pr.pos.length / 3 - 1;
  }

  // Surface paramétrique (u,v dans [0,1]).
  surf(mat, nu, nv, fn, o = {}) {
    const pr = this.prims.get(mat); if (!pr) throw new Error('matériau inconnu : ' + mat);
    const { closeU = false, skin = wBody, flat = false, skip, mirror = false, color, uv } = o;
    const flip = !!o.flip !== mirror;
    const G = [];
    for (let j = 0; j <= nv; j++) { const row = []; for (let i = 0; i <= nu; i++) {
      const p = closeU && i === nu ? fn(0, j / nv) : fn(i / nu, j / nv);
      row.push(mirror ? [-p[0], p[1], p[2]] : p);
    } G.push(row); }
    const at = (i, j) => G[clamp(j, 0, nv)][closeU ? ((i % nu) + nu) % nu : clamp(i, 0, nu)];
    const nrmAt = (i, j) => {
      for (const jj of [j, j + 1, j - 1]) {
        if (jj < 0 || jj > nv) continue;
        const n = cross(sub(at(i + 1, jj), at(i - 1, jj)), sub(at(i, j + 1), at(i, j - 1)));
        if (len(n) > 1e-10) return norm(mul(n, flip ? -1 : 1));
      }
      return [0, 1, 0];
    };
    // Répétitions de texture d'après les longueurs réelles.
    let uL = 0, vL = 0; const jm = nv >> 1;
    for (let i = 0; i < nu; i++) uL += len(sub(G[jm][i + 1], G[jm][i]));
    for (let j = 0; j < nv; j++) vL += len(sub(G[j + 1][nu >> 2], G[j][nu >> 2]));
    const tile = this.mats.get(mat).tile || this.tile;
    const U = o.U !== undefined ? o.U : closeU ? Math.max(1, Math.round(uL / tile)) : uL / tile, V = o.V !== undefined ? o.V : vL / tile;
    const uvAt = (i, j) => (uv ? uv(i / nu, j / nv) : o.strip === 'v' ? [j / nv * Math.max(1, Math.round(vL / (4 * uL))), i / nu] : o.strip ? [i / nu * Math.max(1, Math.round(uL / (4 * vL))), j / nv] : [i / nu * U, j / nv * V]);
    const colAt = (i, j) => (color ? color(i / nu, j / nv, G[j][i]) : null);
    const quad = (i, j) => [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]];
    if (flat) {
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        if (skip && skip((i + 0.5) / nu, (j + 0.5) / nv)) continue;
        const q = quad(i, j);
        for (const t of flip ? [[0, 2, 1], [1, 2, 3]] : [[0, 1, 2], [1, 3, 2]]) {
          const P = t.map(k => G[q[k][1]][q[k][0]]), n = cross(sub(P[1], P[0]), sub(P[2], P[0]));
          if (len(n) < 1e-12) continue;
          const nn = norm(n);
          t.forEach((k, m) => pr.idx.push(this._v(pr, P[m], nn, uvAt(q[k][0], q[k][1]), skin(P[m]), colAt(q[k][0], q[k][1]))));
        }
      }
      return;
    }
    const id = [];
    for (let j = 0; j <= nv; j++) { const row = []; for (let i = 0; i <= nu; i++) row.push(this._v(pr, G[j][i], nrmAt(i, j), uvAt(i, j), skin(G[j][i]), colAt(i, j))); id.push(row); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      if (skip && skip((i + 0.5) / nu, (j + 0.5) / nv)) continue;
      const q = quad(i, j);
      for (const t of flip ? [[0, 2, 1], [1, 2, 3]] : [[0, 1, 2], [1, 3, 2]]) {
        const P = t.map(k => G[q[k][1]][q[k][0]]);
        if (len(cross(sub(P[1], P[0]), sub(P[2], P[0]))) < 1e-12) continue;
        pr.idx.push(...t.map(k => id[q[k][1]][q[k][0]]));
      }
    }
  }

  // Vêtement enroulé autour du corps, du haut (yTop) à l'ourlet (hemY).
  //  flare(t)   : ampleur ajoutée (m) entre flareFrom et l'ourlet (t de 0 à 1)
  //  hem(th)    : longueur ajoutée selon l'angle (ourlets découpés)
  //  range      : portion d'angle (panneaux, tabards, capes) ; par défaut tour complet
  garment(mat, o = {}) {
    const { yTop = 1.352, hemY = 0.03, flare = () => 0, flareFrom = HIP_Y, fit = 0, hem = () => 0, range, rxMax = 9, taper } = o;
    const full = !range, r0 = full ? -PI : range[0], r1 = full ? PI : range[1], vr = o.vRange || [0, 1];
    const nu = o.nu || (full ? 128 : Math.max(4, Math.round(128 * (r1 - r0) / TAU))), nv = o.nv || Math.max(2, Math.ceil((yTop - hemY + 0.1) * (vr[1] - vr[0]) / 0.035));
    // Plis du tombé : ondulation radiale qui grandit vers l'ourlet.
    const amp = o.folds === false || hemY > 0.8 ? 0 : o.folds !== undefined ? o.folds : Math.min(0.045, 0.006 + 0.11 * Math.abs(flare(1, 0)));
    const sd = o.seed || 1, n1 = o.foldN || 11, n2 = Math.round(n1 * 1.6), p1 = hash(sd) * TAU, p2 = hash(sd + 7) * TAU, p3 = hash(sd + 13) * TAU;
    const F = th => 0.6 * Math.cos(n1 * th + p1 + 0.5 * Math.sin(3 * th + p3)) + 0.4 * Math.cos(n2 * th + p2);
    const geo = (u, vv) => {
      const v = lerp(vr[0], vr[1], vv), uu = taper ? 0.5 + (u - 0.5) * taper(v) : u;
      const th = lerp(r0, r1, uu), bot = hemY - hem(th), y = lerp(yTop, bot, v) + (bot - hemY) * (v * v * v - v);
      const fb = o.flareHem !== undefined ? o.flareHem - hem(th) : bot;
      const t = flareFrom > fb ? clamp((flareFrom - y) / (flareFrom - fb)) : 0;
      const fo = typeof fit === 'function' ? fit(y, th) : fit, f = amp ? F(th) : 0;
      return { th, y, t, f, p: bodyPoint(th, y, fo + (y < flareFrom ? flare(t, th) : 0) + amp * Math.pow(t, 1.3) * f, rxMax) };
    };
    const slits = o.slits || [];
    const skip = slits.length || (o.surf && o.surf.skip) ? (u, v) => {
      if (o.surf && o.surf.skip && o.surf.skip(u, v)) return true;
      const g = geo(u, v);
      return slits.some(s => { let d = Math.abs(g.th - s.th) % TAU; if (d > PI) d = TAU - d; return g.y < s.from && d < s.w * (0.3 + 0.7 * sstep(s.from, hemY, g.y)); });
    } : undefined;
    const color = amp && o.ao !== false ? (u, v) => { const g = geo(u, v), c = 1 - 0.42 * Math.max(0, -g.f) * Math.pow(g.t, 0.7); return [c, c, c]; } : undefined;
    this.surf(mat, nu, nv, (u, v) => geo(u, v).p, { closeU: full, flip: true, skin: o.skin || wBody, strip: o.strip, color, ...o.surf, skip });
    if (o.lining) this.garment(o.lining, { ...o, lining: null, vRange: [Math.max(vr[0], 0.45), vr[1]], fit: typeof fit === 'function' ? (y, th) => fit(y, th) - 0.005 : fit - 0.005, folds: amp, strip: undefined });
  }

  // Manche le long du bras (pose T). r(x) rayon, drop(x) pan qui pend sous le bras.
  sleeve(mat, side, o = {}) {
    const { x0 = 0.1, x1 = 0.56, r = () => 0.06, drop = () => 0, nu = 24, phi = [0, TAU] } = o;
    const nv = o.nv || Math.max(3, Math.ceil((x1 - x0) / 0.02)), full = phi[1] - phi[0] >= TAU - 1e-6, k = (o.scale || 1) * (o.raw ? 1 : cur.arm);
    const wr = o.wrinkle === false || x1 - x0 < 0.2 ? 0 : 0.045;
    this.surf(mat, nu, nv, (u, v) => {
      const x = lerp(x0, x1, v), ph = lerp(phi[0], phi[1], u), c = Math.cos(ph);
      const rr = r(x) * k * (1 + wr * Math.sin(x * 130 + 2 * Math.sin(ph * 2)) * Math.exp(-Math.pow((x - 0.33) / 0.075, 2)));
      return [x, ARM_Y + (rr + (c < 0 ? drop(x) * -c * (1 + 0.06 * Math.sin(x * 60)) : 0)) * c, ARM_Z + rr * Math.sin(ph)];
    }, { closeU: full, mirror: side < 0, skin: wArm, strip: o.strip, ...o.surf });
  }

  // Tube le long d'un chemin path(t) ; r(t, phi) rayon. Sert aux cordes, cornes, anneaux, cônes...
  tube(mat, path, r, o = {}) {
    const { nu = 10, nv = 16, closed = false, up = [0, 1, 0] } = o;
    const rf = typeof r === 'function' ? r : () => r;
    this.surf(mat, nu, nv, (u, v) => {
      const e = 1e-3, c = path(v), T = norm(sub(path(closed ? v + e : Math.min(1, v + e)), path(closed ? v - e : Math.max(0, v - e))));
      let ref = Math.abs(dot(up, T)) > 0.95 ? [0, 0, 1] : up; if (Math.abs(dot(ref, T)) > 0.95) ref = [1, 0, 0];
      const Nn = norm(sub(ref, mul(T, dot(ref, T)))), B = cross(T, Nn), ph = u * TAU, rr = rf(v, ph);
      const sq = o.squash || 1;
      return add(c, add(mul(Nn, rr * Math.cos(ph) * sq), mul(B, rr * Math.sin(ph))));
    }, { closeU: true, skin: o.skin || wBody, flat: o.flat, mirror: o.mirror, U: o.U, V: o.V });
  }
  // Anneau autour du corps (ceinture) à la hauteur y.
  belt(mat, y, h = 0.03, off = 0.008, o = {}) { this.garment(mat, { yTop: y + h / 2, hemY: y - h / 2, fit: off, nv: 2, ...o }); }
  // Anneau autour de la tête.
  headRing(mat, y, r = 0.008, o = {}) {
    const { rx = 0.112, rz = 0.122, cz = -0.03, tilt = 0 } = o;
    this.tube(mat, t => { const a = t * TAU; return [rx * Math.sin(a), y + tilt * Math.cos(a), cz + rz * Math.cos(a)]; }, r, { nu: 8, nv: 40, closed: true, skin: wHead, squash: o.squash });
  }
  ball(mat, c, r, o = {}) {
    const s = o.scale || [1, 1, 1], nu = o.nu || 12, nv = o.nv || 8, j = o.jitter || 0;
    this.surf(mat, nu, nv, (u, v) => {
      const th = u * TAU, ph = v * PI, k = j ? 1 + j * (hash(Math.round(u * nu) % nu * 7.3 + Math.round(v * nv) * 3.7 + (o.seed || 0)) - 0.5) : 1;
      return [c[0] + r * s[0] * k * Math.sin(ph) * Math.sin(th), c[1] + r * s[1] * k * Math.cos(ph), c[2] + r * s[2] * k * Math.sin(ph) * Math.cos(th)];
    }, { closeU: true, flip: true, skin: o.skin || wBody, flat: o.flat, mirror: o.mirror });
  }
  // Pointe (cône) de base à tip.
  spike(mat, base, tip, r, o = {}) {
    this.tube(mat, t => add(base, mul(sub(tip, base), t)), t => r * (1 - t) + 1e-4, { nu: o.nu || 5, nv: 1, flat: o.flat !== false, skin: o.skin, mirror: o.mirror });
  }
  // Gemme : double pyramide.
  gem(mat, c, half, r, o = {}) {
    this.tube(mat, t => add(c, mul(half, 2 * t - 1)), t => r * (1 - Math.abs(2 * t - 1)) + 1e-4, { nu: o.nu || 4, nv: 2, flat: true, skin: o.skin, mirror: o.mirror });
  }
  box(mat, c, h, o = {}) {
    const ax = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let a = 0; a < 3; a++) for (const s of [-1, 1]) {
      const b = (a + 1) % 3, d = (a + 2) % 3;
      this.surf(mat, 1, 1, (u, v) => add(c, add(mul(ax[a], s * h[a]), add(mul(ax[b], (2 * u - 1) * h[b] * s), mul(ax[d], (2 * v - 1) * h[d])))), { flat: true, skin: o.skin || wBody, mirror: o.mirror });
    }
  }
  // Disque ou anneau plat : centre c, axes ex/ey, rayons r0..r1 (r1 peut dépendre de l'angle).
  disc(mat, c, ex, ey, r0, r1, o = {}) {
    const rf = typeof r1 === 'function' ? r1 : () => r1;
    this.surf(mat, o.nu || 40, o.nv || 2, (u, v) => { const a = u * TAU, rr = lerp(r0, rf(a), v); return add(c, add(mul(ex, rr * Math.cos(a)), mul(ey, rr * Math.sin(a)))); },
      { closeU: true, skin: o.skin || wHead, flat: o.flat, mirror: o.mirror, flip: o.flip });
  }
  // Plume / feuille : lame plate de base vers base+dir, largeur w.
  blade(mat, base, dir, side, w, o = {}) {
    const n = norm(cross(dir, side)), sd = norm(side), curl = o.curl || 0;
    this.surf(mat, 6, 2, (u, v) => { const ww = w * Math.pow(Math.sin(PI * clamp(u, 0.02, 1)), 0.7) * (o.taper ? 1 - u * 0.6 : 1), s = 2 * v - 1;
      return add(add(base, mul(dir, u)), add(mul(sd, s * ww), mul(n, curl * u * u + (o.cup || 0) * s * s))); }, { skin: o.skin || wHead, mirror: o.mirror });
  }
  // Pèlerine posée sur les épaules : du col (s=0) au bord (s=1).
  mantle(mat, o = {}) {
    const { reach = 0.24, rzF = 0.17, rzB = 0.15, cz = 0, drop = 0.17, dropB, side = 0, pow = 1.5, lift = 0.008, edge = () => 1, s0 = 0, s1 = 1, range, yNeck = 1.352, rNeck = 0.064 } = o;
    const full = !range, a0 = full ? -PI : range[0], a1 = full ? PI : range[1];
    this.surf(mat, o.nu || (full ? 72 : 36), o.nv || 10, (u, v) => {
      const th = lerp(a0, a1, u), s = lerp(s0, s1, v) * edge(th), c = Math.cos(th), sn = Math.sin(th);
      const rx = lerp(rNeck, reach, s), rz = lerp(rNeck, c >= 0 ? rzF : rzB, o.rpow ? Math.pow(Math.min(s, 1), o.rpow) + Math.max(0, s - 1) : s), z0 = lerp(-0.022, cz, Math.min(1, s));
      const dr = (c >= 0 ? drop : dropB === undefined ? drop : dropB) * Math.pow(Math.abs(c), 1.3) + side * Math.abs(sn);
      const rp = o.ripple === 0 ? 0 : (o.ripple || 0.007) * s * s * Math.cos((o.rippleN || 13) * th + 1.3);
      return [rx * sn * (1 + rp * 2), yNeck + lift - dr * Math.pow(s, pow) - rp, z0 + rz * c * (1 + rp * 2)];
    }, { closeU: full, flip: true, skin: o.skin || wMantle, strip: o.strip, ...o.surf });
  }
  // Calotte / capuche autour de la tête ; ouverture du visage devant si face=true.
  hood(mat, o = {}) {
    const { c = [0, 1.475, -0.035], r = [0.15, 0.165, 0.17], face = true, vMax = 0.78, uRange = [0, 1] } = o, fullU = uRange[1] - uRange[0] >= 1;
    this.surf(mat, fullU ? 40 : 20, 14, (uu, v) => { const u = lerp(uRange[0], uRange[1], uu), th = (u - 0.5) * TAU, ph = v * vMax * PI;
      return [c[0] + r[0] * Math.sin(ph) * Math.sin(th), c[1] + r[1] * Math.cos(ph), c[2] + r[2] * Math.sin(ph) * Math.cos(th)]; },
      { closeU: fullU, flip: true, skin: o.skin || wBody, skip: face ? (u, v) => Math.abs(u - 0.5) < 0.13 && v > 0.3 : undefined });
  }

  // --- Export GLB ---
  toGLB(name) {
    const chunks = []; let off = 0;
    const views = [], accessors = [];
    const view = (buf, target) => { const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); off += pad; }
      views.push({ buffer: 0, byteOffset: off, byteLength: buf.length, ...(target ? { target } : {}) }); chunks.push(buf); off += buf.length; return views.length - 1; };
    const acc = (arr, type, comp, target, minmax) => {
      const bv = view(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), target), n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
      const a = { bufferView: bv, componentType: comp, count: arr.length / n, type };
      if (minmax) { a.min = [1e9, 1e9, 1e9]; a.max = [-1e9, -1e9, -1e9]; for (let i = 0; i < arr.length; i++) { a.min[i % 3] = Math.min(a.min[i % 3], arr[i]); a.max[i % 3] = Math.max(a.max[i % 3], arr[i]); } }
      accessors.push(a); return accessors.length - 1;
    };
    const lin = h => [1, 3, 5].map(i => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    const materials = [], textures = [], images = [], primitives = [], texIdx = new Map();
    let tris = 0;
    const texOf = file => { if (!texIdx.has(file)) { images.push({ bufferView: view(fs.readFileSync(file)), mimeType: /\.png$/.test(file) ? 'image/png' : 'image/jpeg' }); textures.push({ sampler: 0, source: images.length - 1 }); texIdx.set(file, textures.length - 1); } return texIdx.get(file); };
    const S = this.corps.scale, shift = this.corps.shift, isArm = n => /Arm|Hand/.test(n);
    for (const [mname, def] of this.mats) {
      const pr = this.prims.get(mname); if (!pr.idx.length) continue;
      const m = { name: mname, doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [...lin(def.color || '#ffffff').map(v => Math.min(1, v * (def.gain || 1))), def.alpha === undefined ? 1 : def.alpha], metallicFactor: def.metallic || 0, roughnessFactor: def.rough === undefined ? 0.85 : def.rough } };
      if (def.alpha !== undefined && def.alpha < 1) m.alphaMode = 'BLEND';
      if (def.emissive) m.emissiveFactor = lin(def.emissive);
      if (def.tex) m.pbrMetallicRoughness.baseColorTexture = { index: texOf(def.tex) };
      if (def.normal) m.normalTexture = { index: texOf(def.normal), scale: def.normalScale || 1 };
      materials.push(m);
      const nV = pr.pos.length / 3, J = new Uint8Array(nV * 4), Wt = new Uint8Array(nV * 4), pos = new Float32Array(pr.pos);
      pr.jw.forEach((w, i) => {
        const ww = w.slice(0, 4), s = ww.reduce((t, e) => t + e[1], 0); let tot = 0, big = 0, armW = 0;
        ww.forEach(([n, v], k) => { const q = Math.round(v / s * 255); J[i * 4 + k] = q ? joints.indexOf(BI[n]) : 0; Wt[i * 4 + k] = q; tot += q; if (q > Wt[i * 4 + big]) big = k; if (isArm(n)) armW += v / s; });
        Wt[i * 4 + big] += 255 - tot;
        pos[i * 3] = (pos[i * 3] + Math.sign(pos[i * 3]) * shift * armW) * S; pos[i * 3 + 1] *= S; pos[i * 3 + 2] *= S;
      });
      const attributes = { POSITION: acc(pos, 'VEC3', 5126, 34962, true), NORMAL: acc(new Float32Array(pr.nrm), 'VEC3', 5126, 34962),
        TEXCOORD_0: acc(new Float32Array(pr.uv), 'VEC2', 5126, 34962), JOINTS_0: acc(J, 'VEC4', 5121, 34962), WEIGHTS_0: Object.assign(accessors[acc(Wt, 'VEC4', 5121, 34962)], { normalized: true }) && accessors.length - 1 };
      if (pr.col.some(Boolean)) { const C = new Uint8Array(nV * 4).fill(255); pr.col.forEach((c, i) => { if (c) for (let k = 0; k < 3; k++) C[i * 4 + k] = Math.round(clamp(c[k]) * 255); }); attributes.COLOR_0 = Object.assign(accessors[acc(C, 'VEC4', 5121, 34962)], { normalized: true }) && accessors.length - 1; }
      primitives.push({ attributes, indices: acc(nV > 65535 ? new Uint32Array(pr.idx) : new Uint16Array(pr.idx), 'SCALAR', nV > 65535 ? 5125 : 5123, 34963), material: materials.length - 1 });
      tris += pr.idx.length / 3;
    }
    const bp = BONES.map(([n, , p]) => [(p[0] + Math.sign(p[0]) * shift * (isArm(n) ? 1 : /Shoulder/.test(n) ? 0.5 : 0)) * S, p[1] * S, p[2] * S]);
    const nodes = BONES.map(([n, parent], i) => ({ name: n, translation: sub(bp[i], parent ? bp[BI[parent]] : [0, 0, 0]).map(v => +v.toFixed(6)) }));
    BONES.forEach(([n, parent], i) => { if (parent) (nodes[BI[parent]].children = nodes[BI[parent]].children || []).push(i); });
    const ibm = new Float32Array(joints.length * 16);
    joints.forEach((b, k) => { const p = bp[b]; ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -p[0], -p[1], -p[2], 1], k * 16); });
    nodes.push({ name, mesh: 0, skin: 0 });
    const json = { asset: { version: '2.0', generator: 'GamesApp robes-mage' }, scene: 0, scenes: [{ name, nodes: [0, nodes.length - 1] }], nodes,
      meshes: [{ name, primitives }], skins: [{ name: 'Armature', joints, skeleton: 0, inverseBindMatrices: acc(ibm, 'MAT4', 5126) }], materials,
      ...(textures.length ? { textures, images, samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }] } : {}),
      accessors, bufferViews: views, buffers: [{ byteLength: 0 }] };
    const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); off += pad; }
    json.buffers[0].byteLength = off;
    let jb = Buffer.from(JSON.stringify(json)); if (jb.length % 4) jb = Buffer.concat([jb, Buffer.alloc(4 - (jb.length % 4), 0x20)]);
    const bin = Buffer.concat(chunks), head = Buffer.alloc(12);
    head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jb.length + 8 + bin.length, 8);
    const jh = Buffer.alloc(8), bh = Buffer.alloc(8);
    jh.writeUInt32LE(jb.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
    return { glb: Buffer.concat([head, jh, jb, bh, bin]), tris };
  }
}
const joints = BONES.map((_, i) => i).slice(1); // tous les os sauf Root

module.exports = { Builder, CORPS, corps: () => cur, BONES, H, PI, TAU, lerp, clamp, sstep, add, sub, mul, norm, cross, hash, bodyPoint, bodyRing, wBody, wArm, wMantle, wHead, rigid, ARM_Y, ARM_Z, HIP_Y };
