#!/usr/bin/env node
'use strict';
// Prépare les textures (JPEG raccordables) dans textures/ à partir d'étoffes photographiées (Poly Haven, CC0) :
//  - <scan>.jpg / <scan>-512.jpg : version neutre (niveaux de gris) que chaque robe teint à sa couleur
//  - <scan>-relief.jpg : carte de relief (normal map)
//  - NN-id-tissu.jpg : étoffes à motif tissé (rayures, carreaux, frise) ; NN-id-galon.jpg : galons brodés
//   node textures.js <dossier des scans>   (fichiers <scan>_diff.jpg, <scan>_nor.jpg, <scan>_rough.jpg en 1k)
const fs = require('fs');
const path = require('path');
const T = require('./lib');
const catalogue = require('./catalogue');

const OUT = path.join(__dirname, 'textures');
const circ = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const ngon = (n, r, rot = 0) => 'M' + Array.from({ length: n }, (_, i) => { const a = rot + i * 2 * Math.PI / n; return `${(r * Math.sin(a)).toFixed(1)} ${(-r * Math.cos(a)).toFixed(1)}`; }).join(' L') + ' Z';
// Symboles brodés des galons (centrés sur l'origine, ~±30) : { d, trait } trait=true -> dessiné au fil (contour).
const SYM = {
  star: { d: T.star4(30) }, flame: { d: T.flame(30) }, snow: { d: T.snowflake(28), trait: 1 }, leaf: { d: T.leaf(30) + ' M0 -22 V22' },
  rune: { d: 'M-10 -26 V26 M-10 -26 L14 -8 L-10 8 M-10 8 L12 24', trait: 1 }, sun: { d: circ(0, 0, 11) + ' ' + T.sun(11, 12), trait: 1, plein: circ(0, 0, 11) },
  bolt: { d: T.bolt(30) }, wave: { d: 'M-40 6 Q-30 -22 -20 6 T0 6 T20 6 T40 6', trait: 1 }, diamond: { d: T.diamond(16, 28) }, gear: { d: T.gear(17, 8, 8) + ' ' + circ(0, 0, 6) },
  hex: { d: ngon(6, 26), trait: 1, plein: ngon(6, 11) }, moon: { d: T.moon(28) }, zig: { d: 'M-40 14 L-20 -14 L0 14 L20 -14 L40 14', trait: 1, plein: T.diamond(6, 9) },
  alchimie: { d: circ(0, 0, 24) + ' ' + ngon(3, 22), trait: 1 }, rose: { d: [0, 1, 2, 3, 4].map(i => circ(15 * Math.sin(i * 1.2566), -15 * Math.cos(i * 1.2566), 11)).join(' ') + ' ' + circ(0, 0, 8) },
  arcane: { d: circ(0, 0, 25) + ' ' + ngon(4, 24), trait: 1, plein: circ(0, 0, 6) }, trefle: { d: [0, 1, 2, 3].map(i => circ(13 * Math.sin(i * 1.5708), -13 * Math.cos(i * 1.5708), 11)).join(' ') },
  volute: { d: 'M-34 12 h30 a13 13 0 1 0 -13 -13 M4 12 h26', trait: 1 }, prisme: { d: ngon(3, 28), trait: 1, plein: ngon(3, 10) }, totem: { d: 'M-40 20 L-20 -4 L0 20 L20 -4 L40 20', trait: 1, plein: ngon(3, 13, Math.PI) },
};

// --- Code exécuté dans la page ---
async function rendre(jobs) {
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const grids = new Map();
  const grid = (P, seed) => { const k = P + ':' + seed; if (!grids.has(k)) { const r = rng(seed * 7919 + P), g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = r(); grids.set(k, g); } return grids.get(k); };
  const sm = t => t * t * (3 - 2 * t);
  // Bruit de valeur périodique : u,v dans [0,1), P cellules.
  const vn = (u, v, P, seed) => { const g = grid(P, seed), x = u * P, y = v * P, x0 = Math.floor(x), y0 = Math.floor(y), fx = sm(x - x0), fy = sm(y - y0);
    const a = g[(y0 % P) * P + (x0 % P)], b = g[(y0 % P) * P + ((x0 + 1) % P)], c = g[((y0 + 1) % P) * P + (x0 % P)], d = g[((y0 + 1) % P) * P + ((x0 + 1) % P)];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  const fbm = (u, v, P, oct, seed) => { let s = 0, a = 0.5, t = 0; for (let o = 0; o < oct; o++) { s += a * vn(u, v, P << o, seed + o); t += a; a *= 0.5; } return s / t; };
  const TAU = Math.PI * 2;
  // Hauteur du tissage selon l'étoffe (0..1) et variation de teinte.
  const etoffes = {
    laine: (u, v) => ({ h: 0.5 + 0.32 * Math.sin(TAU * 128 * u) * Math.sin(TAU * 128 * v) + 0.3 * (fbm(u, v, 64, 3, 11) - 0.5), k: 0.11, dye: 0.14 }),
    lin: (u, v) => ({ h: 0.5 + 0.22 * Math.sin(TAU * 128 * u) * Math.sin(TAU * 128 * v) + 0.35 * (vn(u, v * 0.999, 256, 5) - 0.5) * vn(u, v, 6, 9) + 0.2 * (vn(u * 0.999, v, 8, 21) - 0.5), k: 0.08, dye: 0.1 }),
    soie: (u, v) => ({ h: 0.5 + 0.06 * Math.sin(TAU * 256 * v) + 0.5 * (fbm(u, v, 5, 3, 31) - 0.5), k: 0.05, dye: 0.1 }),
    velours: (u, v) => ({ h: 0.5 + 0.25 * (fbm(u, v, 96, 2, 41) - 0.5) + 0.3 * (fbm(u, v, 6, 3, 43) - 0.5), k: 0.07, dye: 0.16 }),
    cuir: (u, v) => { const c = Math.abs(fbm(u, v, 14, 4, 51) - 0.5) * 2, p = fbm(u, v, 90, 2, 53); return { h: 0.55 - 0.45 * Math.pow(1 - c, 6) + 0.18 * (p - 0.5), k: 0.2, dye: 0.25 }; },
    fourrure: (u, v) => { const s = fbm(u * 1.0, v * 0.12, 160, 3, 61); return { h: s, k: 0.3, dye: 0.12 }; },
  };
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const jpeg = (c, q) => c.toDataURL('image/jpeg', q).split(',')[1];
  const out = {};
  for (const j of jobs) {
    if (j.kind === 'tissu') {
      const S = j.size, c = canvas(S, S), x = c.getContext('2d');
      if (j.svg) { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(j.svg); await img.decode(); x.drawImage(img, 0, 0, S, S); }
      else { x.fillStyle = j.color; x.fillRect(0, 0, S, S); }
      const d = x.getImageData(0, 0, S, S), p = d.data, f = etoffes[j.etoffe];
      for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
        const u = xx / S, v = yy / S, e = f(u, v), i = (yy * S + xx) * 4;
        const s = (1 + e.k * 2 * (e.h - 0.5)) * (1 + e.dye * (fbm(u, v, 4, 4, 71) - 0.5)) * (1 + 0.035 * (vn(u, v, 512, 77) - 0.5));
        p[i] = Math.min(255, p[i] * s); p[i + 1] = Math.min(255, p[i + 1] * s); p[i + 2] = Math.min(255, p[i + 2] * s);
      }
      x.putImageData(d, 0, 0); out[j.name] = jpeg(c, j.q || 0.82);
    } else if (j.kind === 'relief') {
      const S = j.size, f = etoffes[j.etoffe], H = new Float32Array(S * S);
      for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) H[yy * S + xx] = f(xx / S, yy / S).h + 0.6 * (fbm(xx / S, yy / S, 3, 3, 91) - 0.5) * (j.froisse || 0);
      const c = canvas(S, S), x = c.getContext('2d'), d = x.createImageData(S, S), p = d.data, k = j.force;
      for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
        const l = H[yy * S + (xx + S - 1) % S], r = H[yy * S + (xx + 1) % S], t = H[((yy + S - 1) % S) * S + xx], b = H[((yy + 1) % S) * S + xx];
        let nx = (l - r) * k, ny = (b - t) * k, nz = 1; const n = Math.hypot(nx, ny, nz), i = (yy * S + xx) * 4;
        p[i] = 127.5 + 127.5 * nx / n; p[i + 1] = 127.5 + 127.5 * ny / n; p[i + 2] = 127.5 + 127.5 * nz / n; p[i + 3] = 255;
      }
      x.putImageData(d, 0, 0); out[j.name] = jpeg(c, 0.8);
    } else if (j.kind === 'galon') {
      const W = 512, Hh = 128, c = canvas(W, Hh), x = c.getContext('2d');
      x.fillStyle = j.fond; x.fillRect(0, 0, W, Hh);
      const draw = (col, dx, dy) => {
        x.fillStyle = col; x.strokeStyle = col; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round';
        x.fillRect(0, 9 + dy, W, 8); x.fillRect(0, 111 + dy, W, 8); x.fillRect(0, 22 + dy, W, 2.5); x.fillRect(0, 103.5 + dy, W, 2.5);
        for (let i = -1; i < 5; i++) {
          x.save(); x.translate(64 + 128 * i + dx, 64 + dy); x.scale(0.92, 0.92);
          const P = new Path2D(j.d); if (j.trait) x.stroke(P); else x.fill(P); if (j.plein) x.fill(new Path2D(j.plein)); x.restore();
          x.save(); x.translate(128 * i + dx, 64 + dy); x.fill(new Path2D('M0 -9 L6 0 L0 9 L-6 0 Z')); x.beginPath(); x.arc(-22, 0, 2.6, 0, 7); x.arc(22, 0, 2.6, 0, 7); x.fill(); x.restore();
        }
      };
      draw('rgba(0,0,0,.5)', 2, 2.5); draw(j.fil, 0, 0);
      const d = x.getImageData(0, 0, W, Hh), p = d.data;
      for (let yy = 0; yy < Hh; yy++) for (let xx = 0; xx < W; xx++) {
        const i = (yy * W + xx) * 4, u = xx / W, v = yy / Hh, lum = (p[i] + p[i + 1] + p[i + 2]) / 765;
        const fil = 1 + 0.2 * Math.sin((xx + yy * 0.6) * 1.9) * (lum > 0.4 ? 1 : 0.35), s = fil * (1 + 0.12 * (vn(u, v * 0.25, 64, 3) - 0.5)) * (1 + 0.1 * Math.sin(TAU * 64 * v) * Math.sin(TAU * 256 * u) * 0.5);
        p[i] = Math.min(255, p[i] * s); p[i + 1] = Math.min(255, p[i + 1] * s); p[i + 2] = Math.min(255, p[i + 2] * s);
      }
      x.putImageData(d, 0, 0); out[j.name] = jpeg(c, 0.85);
    }
  }
  return out;
}

const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
function svgTissu(type, c, cells = 8) {
  const S = 64 * cells;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 ${S} ${S}"><defs><pattern id="p" patternUnits="userSpaceOnUse" width="64" height="64">${T.tile(type, c)}</pattern></defs><rect width="${S}" height="${S}" fill="url(#p)"/></svg>`;
}

const SCANS = ['caban', 'poly_wool_herringbone', 'rough_linen', 'hessian_380', 'velour_velvet', 'crepe_satin', 'crepe_georgette', 'floral_jacquard',
  'quatrefoil_jacquard_fabric', 'brown_leather', 'curly_teddy_natural', 'scuba_suede', 'wool_boucle'];

// Dans la page : neutralise un scan (luminance, moyenne ramenée à 0,86) ou le multiplie par un motif coloré.
async function scanner(jobs) {
  const load = async b64 => { const i = new Image(); i.src = 'data:image/jpeg;base64,' + b64; await i.decode(); return i; };
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const out = {};
  for (const j of jobs) {
    const img = await load(j.src), S = j.size, c = canvas(S, S), x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, S, S);
    if (j.kind === 'relief') { out[j.name] = { jpg: c.toDataURL('image/jpeg', 0.84).split(',')[1] }; continue; }
    const d = x.getImageData(0, 0, S, S), p = d.data, n = S * S, L = new Float32Array(n); let mean = 0;
    for (let i = 0; i < n; i++) { L[i] = (0.2126 * p[i * 4] + 0.7152 * p[i * 4 + 1] + 0.0722 * p[i * 4 + 2]) / 255; mean += L[i]; }
    mean /= n;
    if (j.kind === 'rugosite') { out[j.name] = { mean }; continue; }
    const k = 0.86 / mean; let pat = null;
    if (j.svg) { const pc = canvas(S, S), px = pc.getContext('2d'); const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(j.svg); await im.decode(); px.drawImage(im, 0, 0, S, S); pat = px.getImageData(0, 0, S, S).data; }
    let lin = 0;
    for (let i = 0; i < n; i++) { const v = Math.min(1, L[i] * k);
      if (pat) { p[i * 4] = pat[i * 4] * v; p[i * 4 + 1] = pat[i * 4 + 1] * v; p[i * 4 + 2] = pat[i * 4 + 2] * v; }
      else { p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = v * 255; }
      lin += v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    x.putImageData(d, 0, 0);
    out[j.name] = { jpg: c.toDataURL('image/jpeg', j.q || 0.82).split(',')[1], lin: lin / n };
  }
  return out;
}

(async () => {
  const { chromium } = require('playwright');
  const SRC = process.argv[2];
  if (!SRC) { console.error('usage : node textures.js <dossier des scans>'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const b64 = f => fs.readFileSync(path.join(SRC, f)).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const index = {};
  const run = async (fn, jobs) => { const res = await page.evaluate(fn, jobs); for (const n in res) { if (res[n].jpg) fs.writeFileSync(path.join(OUT, n + '.jpg'), Buffer.from(res[n].jpg, 'base64')); } return res; };
  for (const sc of SCANS) {
    const r = await run(scanner, [
      { kind: 'neutre', name: sc, size: 1024, src: b64(sc + '_diff.jpg'), q: 0.8 },
      { kind: 'neutre', name: sc + '-512', size: 512, src: b64(sc + '_diff.jpg'), q: 0.8 },
      { kind: 'relief', name: sc + '-relief', size: 512, src: b64(sc + '_nor.jpg') },
      { kind: 'rugosite', name: sc + '-r', size: 64, src: b64(sc + '_rough.jpg') },
    ]);
    index[sc] = { gain: +(1 / r[sc].lin).toFixed(3), rough: +Math.min(1, r[sc + '-r'].mean).toFixed(2) };
  }
  const galons = [];
  for (const [i, r] of catalogue.entries()) {
    const num = String(i + 1).padStart(2, '0'), m = r.motif;
    if (r.tisse) await run(scanner, [{ kind: 'tisse', name: `${num}-${r.id}-tissu`, size: 1024, src: b64(r.scan + '_diff.jpg'), svg: svgTissu(m.type, { b: r.base, m: m.m, n: m.n }) }]);
    const s = SYM[r.galon.sym];
    galons.push({ kind: 'galon', name: `${num}-${r.id}-galon`, fil: r.galon.fil, fond: r.galon.fond, d: s.d, trait: !!s.trait, plein: s.plein || null });
  }
  const res = await page.evaluate(rendre, galons);
  for (const n in res) fs.writeFileSync(path.join(OUT, n + '.jpg'), Buffer.from(res[n], 'base64'));
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1) + '\n');
  const files = fs.readdirSync(OUT), tot = files.reduce((t, f) => t + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`${files.length} fichiers, ${(tot / 1048576).toFixed(1)} Mo`); console.log(JSON.stringify(index));
})().catch(e => { console.error(e); process.exit(1); });
