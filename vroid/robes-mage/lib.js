'use strict';
// Outils de dessin partagés par les 20 robes (SVG généré, aucune dépendance).

const CX = 150;
const f = n => Math.round(n * 10) / 10;
const dstr = segs => segs.map(s => s[0] + s.slice(1).map(f).join(' ')).join(' ');
const mir = segs => segs.map(s => [s[0], ...s.slice(1).map((v, i) => (i % 2 === 0 ? 300 - v : v))]);

function rev(segs) {
  const pts = segs.map(s => s.slice(-2));
  const out = [['M', ...pts[pts.length - 1]]];
  for (let i = segs.length - 1; i >= 1; i--) {
    const s = segs[i], p = pts[i - 1];
    if (s[0] === 'L') out.push(['L', ...p]);
    else if (s[0] === 'Q') out.push(['Q', s[1], s[2], ...p]);
    else if (s[0] === 'C') out.push(['C', s[3], s[4], s[1], s[2], ...p]);
  }
  return out;
}

// Contour gauche (du haut-centre au bas-centre) -> forme fermée symétrique.
const sym = segs => dstr(segs) + ' ' + dstr(rev(mir(segs)).slice(1)) + ' Z';
const poly = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + ' Z';
const line = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L');
const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const flip = svg => `<g transform="translate(300,0) scale(-1,1)">${svg}</g>`;
const both = svg => svg + flip(svg);
const at = (svg, x, y, rot = 0, sc = 1) => `<g transform="translate(${f(x)},${f(y)}) rotate(${rot}) scale(${sc})">${svg}</g>`;

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Ourlet : segments de (x0,y0) à (x1,y1) selon un style.
function hem(x0, x1, y0, style = 'straight', n = 4, amp = 10, seed = 1, y1 = y0) {
  const out = [], r = rng(seed), w = (x1 - x0) / n, Y = t => y0 + (y1 - y0) * t;
  for (let i = 0; i < n; i++) {
    const a = x0 + w * i, b = a + w, m = (a + b) / 2;
    const ya = Y(i / n), yb = Y((i + 1) / n), ym = (ya + yb) / 2;
    switch (style) {
      case 'zigzag': out.push(['L', m, ym + amp], ['L', b, yb]); break;
      case 'scallop': out.push(['Q', m, ym + amp * 2, b, yb]); break;
      case 'wave': out.push(['Q', m, ym + (i % 2 ? -amp : amp) * 2, b, yb]); break;
      case 'ragged': out.push(['L', a + w * (0.3 + r() * 0.4), ym + amp * (0.5 + r() * 0.7)], ['L', b, yb]); break;
      case 'flame': out.push(['Q', a + w * 0.15, ya + amp * 0.7, m, ym + amp * (0.7 + (i % 2) * 0.5)], ['Q', b - w * 0.1, yb + amp * 0.3, b, yb]); break;
      case 'leaf': out.push(['Q', a, ya + amp * 0.85, m, ym + amp], ['Q', b, yb + amp * 0.85, b, yb]); break;
      default: out.push(['L', b, yb]);
    }
  }
  return out;
}

// Corps de robe : col -> épaule -> taille -> ourlet.
function bodySegs(o = {}) {
  const { neckW = 9, neckY = 93, shW = 34, shY = 101, chW = 25, chY = 130, waW = 20, waY = 178,
    hemW = 50, hemY = 425, hemStyle = 'straight', hemN = 4, hemAmp = 10, kneeW, kneeY, seed = 1, flare = 0.45 } = o;
  const s = [['M', CX, neckY], ['L', CX - neckW, neckY], ['L', CX - shW, shY], ['L', CX - chW, chY],
    ['Q', CX - waW - 1, (chY + waY) / 2, CX - waW, waY]];
  if (kneeW) {
    s.push(['C', CX - waW - 10, waY + 35, CX - kneeW - 3, kneeY - 45, CX - kneeW, kneeY]);
    s.push(['Q', CX - kneeW - 4, (kneeY + hemY) / 2 + 14, CX - hemW, hemY]);
  } else {
    s.push(['C', CX - waW - (hemW - waW) * flare, waY + (hemY - waY) * 0.35, CX - hemW, hemY - (hemY - waY) * 0.3, CX - hemW, hemY]);
  }
  s.push(...hem(CX - hemW, CX, hemY, hemStyle, hemN, hemAmp, seed));
  return s;
}

// Bras en pose A (comme le modèle VRoid par défaut).
const S = [116, 103], Wp = [72, 212];
const AL = Math.hypot(Wp[0] - S[0], Wp[1] - S[1]);
const u = [(Wp[0] - S[0]) / AL, (Wp[1] - S[1]) / AL];
const no = [-u[1], u[0]];
const A = (t, off = 0) => [S[0] + u[0] * t * AL + no[0] * off, S[1] + u[1] * t * AL + no[1] * off];

function arms(o = {}) {
  const { skin = '#f3d3bd', glove, gloveFrom = 0.6 } = o;
  let s = P(poly([A(0, 8), A(1, 6), A(1, -6), A(0.08, -9)]), skin);
  s += `<circle cx="${f(A(1.07)[0])}" cy="${f(A(1.07)[1])}" r="7.5" fill="${glove || skin}"/>`;
  if (glove) s += P(poly([A(gloveFrom, 8.6), A(1.02, 6.8), A(1.02, -6.8), A(gloveFrom, -8.6)]), glove);
  return both(s);
}

// Manche gauche (à passer dans both()/flip()).
function sleeve(style, fill, o = {}) {
  const { edge, lining = 'rgba(0,0,0,.45)' } = o;
  const st = edge ? `stroke="${edge}" stroke-width="2.2" stroke-opacity="1"` : '';
  switch (style) {
    case 'fitted':
      return P(poly([A(-0.04, 10), A(0.5, 9), A(1, 7.5), A(1, -7.5), A(0.12, -11)]), fill, st);
    case 'bell':
      return P(poly([A(0.96, 13), A(1.05, -22), A(0.9, -10)]), lining, 'stroke="none"') +
        P(poly([A(-0.04, 10), A(0.55, 10), A(1.0, 16), A(1.05, -24), A(0.55, -10), A(0.12, -11)]), fill, st);
    case 'wizard': {
      const a1 = A(1, 13), D = [Wp[0] + 24, Wp[1] + 88], a2 = A(0.32, -10);
      const d = dstr([['M', ...A(-0.04, 10)], ['L', ...a1], ['Q', Wp[0] - 8, Wp[1] + 58, ...D],
        ['Q', Wp[0] + 40, Wp[1] + 22, ...a2], ['L', ...A(0.12, -11)]]) + ' Z';
      const open = dstr([['M', ...a1], ['Q', Wp[0] - 8, Wp[1] + 58, ...D], ['Q', Wp[0] + 14, Wp[1] + 40, ...A(1, -8)]]) + ' Z';
      return P(d, fill, st) + P(open, lining, 'stroke="none"');
    }
    case 'kimono': {
      const p1 = A(0.92, 10), p4 = A(0.28, -10);
      return P(poly([A(-0.04, 10), p1, [p1[0] + 8, p1[1] + 80], [p1[0] + 44, p1[1] + 72], p4, A(0.12, -11)]), fill, st);
    }
    case 'short':
      return P(poly([A(-0.04, 11), A(0.42, 14), A(0.42, -13), A(0.12, -11)]), fill, st);
    case 'bishop':
      return P(dstr([['M', ...A(-0.04, 10)], ['Q', ...A(0.62, 27), ...A(0.9, 9)], ['L', ...A(0.9, -9)],
        ['Q', ...A(0.62, -24), ...A(0.12, -11)]]) + ' Z', fill, st);
    case 'puff':
      return `<circle cx="${f(A(0.13, 2)[0])}" cy="${f(A(0.13, 2)[1])}" r="${o.r || 19}" fill="${fill}"/>`;
    default: return '';
  }
}
const cuff = (fill, t0 = 0.88, t1 = 1.03, w = 10) => P(poly([A(t0, w), A(t1, w), A(t1, -w), A(t0, -w)]), fill);

function leg(o = {}) {
  const { fill = '#f3d3bd', boot = '#3a2a22', bootTop = 396, sole } = o;
  let s = P(poly([[136, 196], [149.5, 196], [148.5, 430], [138, 430]]), fill);
  s += P(dstr([['M', 135, bootTop], ['L', 150, bootTop], ['L', 149.5, 434], ['Q', 140, 441, 127, 438], ['Q', 126, 430, 136, 426]]) + ' Z', boot);
  if (sole) s += P(dstr([['M', 127, 438], ['Q', 140, 441, 149.5, 434], ['L', 149.5, 438], ['Q', 138, 444, 127, 441]]) + ' Z', sole, 'stroke="none"');
  return s;
}
const legs = o => both(leg(o));

const HAIR = '#3b2a35', SKIN = '#f3d3bd';
const hairBack = (c = HAIR) => P(sym([['M', 150, 34], ['C', 120, 34, 117, 70, 122, 102], ['L', 150, 106]]), c);
const neck = (skin = SKIN) => P(poly([[143.5, 72], [156.5, 72], [157.5, 96], [142.5, 96]]), skin);
function head(o = {}) {
  const { skin = SKIN, hair = HAIR, bangs = true } = o;
  let s = `<circle cx="131.5" cy="60" r="3.6" fill="${skin}"/><circle cx="168.5" cy="60" r="3.6" fill="${skin}"/>`;
  s += `<ellipse cx="150" cy="58" rx="18.5" ry="21.5" fill="${skin}"/>`;
  s += `<g stroke="none"><ellipse cx="142.5" cy="61" rx="2.1" ry="3" fill="#2a1c2e"/><ellipse cx="157.5" cy="61" rx="2.1" ry="3" fill="#2a1c2e"/>` +
    `<circle cx="138.5" cy="67.5" r="3.2" fill="#ff8f8f" opacity=".32"/><circle cx="161.5" cy="67.5" r="3.2" fill="#ff8f8f" opacity=".32"/></g>` +
    `<path d="M146.5 70.5 Q150 73 153.5 70.5" fill="none" stroke="#7a3d3d" stroke-opacity="1" stroke-width="1.3"/>`;
  if (bangs) s += P(sym([['M', 150, 35], ['C', 131, 34, 128, 48, 130, 65], ['Q', 133, 52, 140, 48], ['Q', 145, 51, 150, 45]]), hair);
  return s;
}

// --- Symboles (centrés sur l'origine) ---
const star4 = r => `M0 ${-r} Q${r * 0.18} ${-r * 0.18} ${r} 0 Q${r * 0.18} ${r * 0.18} 0 ${r} Q${-r * 0.18} ${r * 0.18} ${-r} 0 Q${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
const moon = r => `M0 ${-r} A${r} ${r} 0 0 0 0 ${r} A${r * 1.5} ${r * 1.5} 0 0 1 0 ${-r} Z`;
const flame = r => `M0 ${-r} C${r * 0.7} ${-r * 0.2} ${r * 0.75} ${r * 0.6} 0 ${r} C${-r * 0.75} ${r * 0.6} ${-r * 0.55} ${r * 0.05} ${-r * 0.15} ${-r * 0.25} C${-r * 0.1} ${-r * 0.6} 0 ${-r * 0.8} 0 ${-r} Z`;
const leaf = r => `M0 ${-r} Q${r * 0.75} 0 0 ${r} Q${-r * 0.75} 0 0 ${-r} Z`;
const diamond = (w, h) => `M0 ${-h} L${w} 0 L0 ${h} L${-w} 0 Z`;
const bolt = r => `M${r * 0.25} ${-r} L${-r * 0.55} ${r * 0.1} L${-r * 0.05} ${r * 0.1} L${-r * 0.3} ${r} L${r * 0.55} ${-r * 0.2} L${r * 0.05} ${-r * 0.2} Z`;
function gear(r, teeth = 8, th = r * 0.28) {
  const pts = [], step = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [[a - step * 0.3, r], [a - step * 0.18, r + th], [a + step * 0.18, r + th], [a + step * 0.3, r]]
      .forEach(([an, rr]) => pts.push([Math.cos(an) * rr, Math.sin(an) * rr]));
  }
  return poly(pts);
}
function snowflake(r) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
    d += `M0 0 L${f(c * r)} ${f(s * r)} `;
    for (const k of [-1, 1]) {
      const b = a + k * Math.PI / 4;
      d += `M${f(c * r * 0.6)} ${f(s * r * 0.6)} l${f(Math.cos(b) * r * 0.3)} ${f(Math.sin(b) * r * 0.3)} `;
    }
  }
  return d;
}
const sun = (r, n = 8) => {
  let d = '';
  for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; d += `M${f(Math.cos(a) * r * 1.5)} ${f(Math.sin(a) * r * 1.5)} L${f(Math.cos(a) * r * 2.3)} ${f(Math.sin(a) * r * 2.3)} `; }
  return d;
};
const feather = (len, w, fill, spine = 'rgba(0,0,0,.35)') =>
  P(`M0 0 Q${w} ${-len * 0.5} 0 ${-len} Q${-w} ${-len * 0.5} 0 0 Z`, fill) + `<path d="M0 0 L0 ${-len * 0.92}" fill="none" stroke="${spine}" stroke-width="1"/>`;
const furLine = (pts, r, fill) => pts.map(p => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="${fill}"/>`).join('');
const qPts = (p0, pc, p1, n) => Array.from({ length: n }, (_, i) => {
  const t = i / (n - 1), a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t;
  return [a * p0[0] + b * pc[0] + c * p1[0], a * p0[1] + b * pc[1] + c * p1[1]];
});

// --- Motifs de tissu : tuile 64x64 raccordable ---
const N = 'stroke="none"';
const TILES = {
  stars: c => `<path d="${star4(10)}" transform="translate(17 18)" fill="${c.m}"/><path d="${star4(6.5)}" transform="translate(47 47)" fill="${c.n}"/>` +
    `<circle cx="45" cy="13" r="1.8" fill="${c.m}"/><circle cx="11" cy="50" r="1.8" fill="${c.n}"/><circle cx="31" cy="37" r="1.3" fill="${c.m}"/>`,
  flames: c => `<path d="${flame(12)}" transform="translate(17 19)" fill="${c.m}"/><path d="${flame(6)}" transform="translate(17 23)" fill="${c.n}"/>` +
    `<path d="${flame(10)}" transform="translate(48 47)" fill="${c.m}"/><path d="${flame(5)}" transform="translate(48 50)" fill="${c.n}"/>`,
  snow: c => `<path d="${snowflake(15)}" transform="translate(32 32)" fill="none" stroke="${c.m}" stroke-width="2.2" stroke-linecap="round"/>` +
    [[0, 0], [64, 0], [0, 64], [64, 64]].map(p => `<path d="${star4(6)}" transform="translate(${p[0]} ${p[1]})" fill="${c.n}"/>`).join(''),
  leaves: c => `<path d="${leaf(13)}" transform="translate(18 18) rotate(-35)" fill="${c.m}"/><path d="${leaf(11)}" transform="translate(47 46) rotate(40)" fill="${c.n}"/>` +
    `<path d="${leaf(6)}" transform="translate(46 14) rotate(70)" fill="${c.n}"/><path d="${leaf(6)}" transform="translate(14 50) rotate(-70)" fill="${c.m}"/>`,
  runes: c => `<g fill="none" stroke="${c.m}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8 v22 M12 8 l10 8 l-10 7"/>` +
    `<path d="M46 34 l8 9 l-8 9 l-8 -9 Z M46 27 v7 M46 52 v7"/></g><g fill="none" stroke="${c.n}" stroke-width="2" stroke-linecap="round"><path d="M38 8 l12 12 M50 8 l-12 12"/><path d="M10 42 h14 M17 42 v16"/></g>`,
  rays: c => `<circle cx="32" cy="32" r="5.5" fill="${c.m}"/><path d="${sun(5.5)}" transform="translate(32 32)" fill="none" stroke="${c.m}" stroke-width="2.2" stroke-linecap="round"/>` +
    [[0, 0], [64, 0], [0, 64], [64, 64]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${c.n}"/>`).join(''),
  bolts: c => `<path d="${bolt(15)}" transform="translate(18 20)" fill="${c.m}"/><path d="${bolt(11)}" transform="translate(47 46) rotate(18)" fill="${c.n}"/>`,
  scales: c => `<g fill="none" stroke="${c.m}" stroke-width="2.4">` + [-16, 0, 16, 32, 48].map((y, i) =>
    `<path d="M${i % 2 ? 0 : -16} ${y} a16 16 0 0 0 32 0 a16 16 0 0 0 32 0 a16 16 0 0 0 32 0"/>`).join('') + `</g>` +
    `<circle cx="16" cy="9" r="2" fill="${c.n}"/><circle cx="48" cy="41" r="2" fill="${c.n}"/>`,
  diamonds: c => `<path d="M32 0 L64 32 L32 64 L0 32 Z" fill="${c.m}"/><path d="${diamond(5, 8)}" transform="translate(32 32)" fill="${c.n}"/>` +
    [[0, 0], [64, 0], [0, 64], [64, 64]].map(p => `<path d="${diamond(5, 8)}" transform="translate(${p[0]} ${p[1]})" fill="${c.n}"/>`).join(''),
  gears: c => `<path d="${gear(12, 8)}" transform="translate(32 32)" fill="none" stroke="${c.m}" stroke-width="3"/><circle cx="32" cy="32" r="4" fill="${c.m}"/>` +
    [[0, 0], [64, 0], [0, 64], [64, 64]].map(p => `<path d="${gear(6, 6)}" transform="translate(${p[0]} ${p[1]})" fill="${c.n}"/>`).join(''),
  hex: c => { const a = 64 / 3; return `<g fill="none" stroke="${c.m}" stroke-width="2.6" stroke-linejoin="round">` + [0, 32].map(y =>
    `<path d="M0 ${y + 16} L${f(a / 2)} ${y} L${f(a * 1.5)} ${y} L${f(a * 2)} ${y + 16} L${f(a * 1.5)} ${y + 32} L${f(a / 2)} ${y + 32} Z M${f(a * 2)} ${y + 16} L64 ${y + 16}"/>`).join('') +
    `</g><path d="${diamond(3.5, 6)}" transform="translate(${f(a)} 16)" fill="${c.n}"/><path d="${diamond(3, 5)}" transform="translate(${f(a * 2.5)} 32)" fill="${c.n}"/>`; },
  crescents: c => `<path d="${moon(11)}" transform="translate(20 20) rotate(-20)" fill="${c.m}"/><path d="${moon(7)}" transform="translate(48 47) rotate(150)" fill="${c.n}"/>` +
    `<circle cx="46" cy="14" r="1.8" fill="${c.n}"/><circle cx="14" cy="50" r="1.8" fill="${c.m}"/>`,
  stripes: c => `<rect x="5" width="9" height="64" fill="${c.m}"/><rect x="19" width="3" height="64" fill="${c.n}"/><rect x="36" width="13" height="64" fill="${c.m}"/><rect x="54" width="3" height="64" fill="${c.n}"/>` +
    `<g fill="${c.n}">${[8, 24, 40, 56].map(y => `<path d="${diamond(3, 4.5)}" transform="translate(42.5 ${y})"/>`).join('')}</g>`,
  plaid: c => `<rect x="10" width="12" height="64" fill="${c.m}" opacity=".5"/><rect y="10" width="64" height="12" fill="${c.m}" opacity=".5"/>` +
    `<rect x="42" width="2.5" height="64" fill="${c.n}"/><rect y="42" width="64" height="2.5" fill="${c.n}"/><rect x="50" width="1.5" height="64" fill="${c.n}" opacity=".6"/><rect y="50" width="64" height="1.5" fill="${c.n}" opacity=".6"/>`,
  roses: c => [[20, 22, 11], [50, 50, 8]].map(([x, y, r]) => `<path d="${leaf(r * 0.8)}" transform="translate(${x + r} ${y + r * 0.6}) rotate(-50)" fill="${c.g}"/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.m}"/><circle cx="${x - 1}" cy="${y - 1}" r="${r * 0.62}" fill="${c.n}"/><circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${c.m}"/>`).join(''),
  arcane: c => `<g fill="none" stroke="${c.m}" stroke-width="2.2" stroke-linejoin="round"><circle cx="32" cy="32" r="15"/><path d="M32 19 L43 39 L21 39 Z"/></g><circle cx="32" cy="33" r="2.6" fill="${c.n}"/>` +
    [[0, 0], [64, 0], [0, 64], [64, 64]].map(p => `<path d="${diamond(4, 7)}" transform="translate(${p[0]} ${p[1]})" fill="${c.n}"/>`).join(''),
  damask: c => [0, 90, 180, 270].map(r => `<path d="M0 -22 C9 -11 9 -6 0 0 C-9 -6 -9 -11 0 -22 Z" transform="translate(32 32) rotate(${r})" fill="${c.m}"/>`).join('') +
    `<circle cx="32" cy="32" r="3.5" fill="${c.n}"/>` + [[0, 0], [64, 0], [0, 64], [64, 64]].map(p => `<path d="${diamond(6, 9)}" transform="translate(${p[0]} ${p[1]})" fill="${c.m}"/>`).join(''),
  swirls: c => `<g fill="none" stroke-linecap="round" stroke-width="2.8"><path d="M8 26 h20 a9 9 0 1 0 -9 -9" stroke="${c.m}"/><path d="M34 52 h18 a7 7 0 1 0 -7 -7" stroke="${c.n}"/><path d="M40 14 h14" stroke="${c.n}"/><path d="M6 46 h12" stroke="${c.m}"/></g>`,
  triangles: c => { const t = [[[0, 32], [16, 0], [32, 32]], [[16, 0], [48, 0], [32, 32]], [[32, 32], [48, 0], [64, 32]], [[48, 0], [80, 0], [64, 32]],
    [[0, 32], [32, 32], [16, 64]], [[16, 64], [32, 32], [48, 64]], [[32, 32], [64, 32], [48, 64]], [[48, 64], [64, 32], [80, 64]]];
    return t.map((p, i) => P(poly(p), c.rb[i], N) + (i === 3 || i === 7 ? P(poly(p.map(q => [q[0] - 64, q[1]])), c.rb[i], N) : '')).join('') +
      `<path d="M0 32 H64 M0 0 H64 M16 0 L32 32 L48 0 L64 32 M0 32 L16 0 M16 64 L32 32 L48 64 L64 32 M0 32 L16 64" fill="none" stroke="${c.m}" stroke-width="2.2"/>`; },
  tribal: c => `<path d="M0 15 L16 4 L32 15 L48 4 L64 15" fill="none" stroke="${c.m}" stroke-width="4" stroke-linejoin="miter"/>` +
    `<g fill="${c.n}">${[0, 16, 32, 48].map(x => `<path d="M${x} 40 L${x + 8} 26 L${x + 16} 40 Z"/>`).join('')}</g>` +
    `<g fill="${c.m}">${[8, 24, 40, 56].map(x => `<circle cx="${x}" cy="50" r="2.6"/>`).join('')}</g><rect y="58" width="64" height="2.5" fill="${c.n}"/>`,
};
const tile = (type, c) => `<rect width="64" height="64" fill="${c.b}"/>` + TILES[type](c);

// Contexte par robe : identifiants uniques + <defs>.
function ctx(id) {
  let n = 0;
  const K = { id, defs: [], uid: () => `${id}-${++n}` };
  K.pat = (type, c, scale = 0.5) => {
    const pid = K.uid();
    K.defs.push(`<pattern id="${pid}" patternUnits="userSpaceOnUse" width="64" height="64" patternTransform="scale(${scale})">${tile(type, c)}</pattern>`);
    return `url(#${pid})`;
  };
  K.grad = (stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units = 'objectBoundingBox') => {
    const gid = K.uid();
    K.defs.push(`<linearGradient id="${gid}" gradientUnits="${units}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
      stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] === undefined ? 1 : s[2]}"/>`).join('') + `</linearGradient>`);
    return `url(#${gid})`;
  };
  K.clip = inner => { const cid = K.uid(); K.defs.push(`<clipPath id="${cid}">${inner}</clipPath>`); return `url(#${cid})`; };
  // Bande intérieure le long d'un contour (galon), limitée à une tranche verticale.
  K.trim = (d, color, w, yMin = 0, yMax = 600) =>
    `<g clip-path="${K.clip(`<rect x="0" y="${yMin}" width="300" height="${yMax - yMin}"/>`)}"><path d="${d}" fill="none" stroke="${color}" stroke-opacity="1" stroke-width="${w * 2}" clip-path="${K.clip(`<path d="${d}"/>`)}"/></g>`;
  // Volume : ombre sur les côtés + plis.
  K.shade = d => P(d, K.grad([[0, '#000', 0.3], [0.28, '#000', 0], [0.72, '#000', 0], [1, '#000', 0.3]], 0, 0, 1, 0), N);
  return K;
}
function folds(waY, hemY, hemW, n = 3, col = 'rgba(0,0,0,.17)') {
  let s = '';
  for (let i = 1; i <= n; i++) {
    const xt = i * 4.5, xb = hemW * i / (n + 1.2), yt = waY + 22 + i * 14;
    s += `<path d="M${f(CX - xt)} ${yt} Q${f(CX - (xt + xb) / 2 + 2)} ${f((yt + hemY) / 2)} ${f(CX - xb)} ${hemY - 6}" />`;
  }
  return `<g fill="none" stroke="${col}" stroke-opacity="1" stroke-width="1.7">${both(s)}</g>`;
}
const belt = (y, w, h, fill) => `<rect x="${CX - w}" y="${y - h / 2}" width="${w * 2}" height="${h}" rx="2" fill="${fill}"/>`;

module.exports = { CX, f, dstr, mir, rev, sym, poly, line, P, flip, both, at, rng, hem, bodySegs, A, S, Wp, arms, sleeve, cuff, leg, legs,
  HAIR, SKIN, hairBack, neck, head, star4, moon, flame, leaf, diamond, bolt, gear, snowflake, sun, feather, furLine, qPts, N, TILES, tile, ctx, folds, belt };
