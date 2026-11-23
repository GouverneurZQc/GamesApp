#!/usr/bin/env node
'use strict';
// Génère les aperçus SVG, les données JSON et la galerie HTML des 20 robes du mage.
//   node generer.js          -> apercus/*.svg, robes.json, index.html
//   node generer.js --png    -> en plus : tissus/*.png (textures 1024x1024 raccordables, via Playwright)
const fs = require('fs');
const path = require('path');
const { ctx, tile } = require('./lib');
const robes = require('./robes');

const OUT = __dirname;
const num = i => String(i + 1).padStart(2, '0');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function renderRobe(r) {
  const K = ctx(r.id);
  const inner = r.draw(K);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500" role="img" aria-label="${esc(r.nom)}">` +
    `<defs>${K.defs.join('')}</defs><rect width="300" height="500" rx="14" fill="${r.bg}"/>` +
    `<ellipse cx="150" cy="483" rx="72" ry="8" fill="#000" opacity=".18"/>` +
    `<g transform="translate(0,42)" stroke="#1a1020" stroke-opacity=".5" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;
}
// Tuile de tissu : n x n répétitions du motif 64x64.
const renderTile = (r, n = 2, id = r.id + '-tile') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${64 * n} ${64 * n}" role="img" aria-label="Tissu : ${esc(r.motif.nom)}">` +
  `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="64" height="64">${tile(r.motif.type, r.motif.c)}</pattern></defs>` +
  `<rect width="${64 * n}" height="${64 * n}" fill="url(#${id})"/></svg>`;

const data = robes.map((r, i) => ({
  numero: i + 1, id: r.id, nom: r.nom, theme: r.theme,
  couleurs: r.couleurs.map(([nom, hex]) => ({ nom, hex })),
  silhouette: r.silhouette, manches: r.manches, details: r.details, coiffe: r.coiffe,
  tissu: { motif: r.motif.nom, fichier: `tissus/${num(i)}-${r.id}.png` },
  base_vroid: r.vroid, apercu: `apercus/${num(i)}-${r.id}.svg`,
}));

function page(standalone) {
  const cards = robes.map((r, i) => `
<article class="robe" id="robe-${num(i)}">
  <div class="art">${renderRobe(r)}</div>
  <div class="body">
    <p class="theme"><span class="no">${num(i)}</span>${esc(r.theme)}</p>
    <h2>${esc(r.nom)}</h2>
    <ul class="swatches">${r.couleurs.map(([n, h]) => `<li><button type="button" class="sw" data-hex="${h}" title="Copier ${h}"><span class="chip" style="background:${h}"></span><span class="sw-n">${esc(n)}</span><span class="hex">${h}</span></button></li>`).join('')}</ul>
    <dl>
      <dt>Silhouette</dt><dd>${esc(r.silhouette)}</dd>
      <dt>Manches</dt><dd>${esc(r.manches)}</dd>
      <dt>Détails</dt><dd>${esc(r.details)}</dd>
      <dt>Coiffe</dt><dd>${esc(r.coiffe)}</dd>
    </dl>
    <div class="fabric"><div class="tile">${renderTile(r, 2, r.id + '-t')}</div>
      <p><strong>Tissu : ${esc(r.motif.nom)}</strong><span>Base VRoid : ${esc(r.vroid)}</span></p></div>
  </div>
</article>`).join('');

  const body = `<title>Garde-robe du Mage</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Figtree:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* Mise en page : planche de costumes, une fiche par robe, l'illustration porte la couleur. */
:root{--bg:#f2eff7;--surface:#fff;--ink:#1d1830;--muted:#5f5776;--line:#dbd5e8;--accent:#5a3ec8;
  --display:"Marcellus",Georgia,serif;--text:"Figtree",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14111f;--surface:#1e1a2c;--ink:#ece8f7;--muted:#a79fbe;--line:#342e49;--accent:#b6a1ff;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#14111f;--surface:#1e1a2c;--ink:#ece8f7;--muted:#a79fbe;--line:#342e49;--accent:#b6a1ff;color-scheme:dark}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--ink);font:400 15px/1.5 var(--text)}
.wrap{max-width:1240px;margin:0 auto;padding-block:36px 56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header{display:grid;gap:10px;margin-bottom:28px}
.eyebrow{font:500 12px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0}
h1{font:400 clamp(30px,5vw,46px)/1.08 var(--display);margin:0;text-wrap:balance}
.lede{max-width:62ch;color:var(--muted);margin:0;font-size:16px}
.strip{display:flex;height:10px;border-radius:5px;overflow:hidden;margin-top:8px}
.strip span{flex:1}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:22px}
.robe{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.art{padding:10px 10px 0}
.art svg{display:block;width:100%;height:auto}
.body{padding:14px 16px 16px;display:grid;gap:12px;min-width:0}
.theme{margin:0;font:500 11.5px/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;gap:8px;align-items:baseline}
.no{color:var(--accent);font-variant-numeric:tabular-nums}
h2{font:400 21px/1.2 var(--display);margin:-6px 0 0;text-wrap:balance}
.swatches{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.sw{all:unset;box-sizing:border-box;display:grid;grid-template-columns:22px 1fr auto;gap:9px;align-items:center;width:100%;cursor:pointer;padding:3px 4px;border-radius:7px}
.sw:hover{background:color-mix(in srgb,var(--accent) 10%,transparent)}
.sw:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.chip{width:22px;height:22px;border-radius:6px;border:1px solid var(--line)}
.sw-n{font-size:13.5px;min-width:0}
.hex{font:400 12px/1 var(--mono);color:var(--muted)}
dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:5px 12px;font-size:13.5px;border-top:1px solid var(--line);padding-top:12px}
dt{color:var(--muted);font-weight:500}
dd{margin:0;min-width:0}
.fabric{display:grid;grid-template-columns:54px 1fr;gap:12px;align-items:center;border-top:1px solid var(--line);padding-top:12px}
.tile svg{display:block;width:54px;height:54px;border-radius:8px}
.fabric p{margin:0;display:grid;gap:2px;font-size:13px;min-width:0}
.fabric strong{font-weight:600}
.fabric span{color:var(--muted)}
.how{margin-top:36px;border-top:1px solid var(--line);padding-top:24px;display:grid;gap:10px;max-width:70ch}
.how h3{font:400 22px/1.2 var(--display);margin:0}
.how ol{margin:0;padding-left:20px;display:grid;gap:6px;color:var(--muted)}
.how li::marker{color:var(--accent)}
.toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:8px 14px;border-radius:999px;font:500 13px/1 var(--mono)}
</style>
<div class="wrap">
<header>
  <p class="eyebrow">Personnage VRoid · classe Mage</p>
  <h1>Garde-robe du Mage</h1>
  <p class="lede">Vingt robes, vingt écoles de magie. Chacune a sa propre coupe, sa propre palette et son propre tissu : aucune ne partage sa couleur dominante ni sa silhouette avec une autre. Touchez une couleur pour copier son code.</p>
  <div class="strip" aria-hidden="true">${robes.map(r => `<span style="background:${r.couleurs[0][1]}"></span>`).join('')}</div>
</header>
<main class="grid">${cards}
</main>
<section class="how">
  <h3>Les reproduire dans VRoid Studio</h3>
  <ol>
    <li>Partez du vêtement indiqué en « Base VRoid » et réglez longueur et ampleur d’après la silhouette.</li>
    <li>Dans l’éditeur de texture, remplissez le calque de base avec la première couleur de la fiche ; les suivantes servent aux galons, doublures et accessoires.</li>
    <li>Importez la texture du tissu (PNG 1024 px, raccordable) comme calque par-dessus, puis peignez galons et emblèmes.</li>
    <li>Ajoutez la coiffe et les accessoires en dernier.</li>
  </ol>
</section>
</div>
<div class="toast" id="toast" hidden></div>
<script>
(function(){
  var toast=document.getElementById('toast'),timer;
  function say(t){toast.textContent=t;toast.hidden=false;clearTimeout(timer);timer=setTimeout(function(){toast.hidden=true},1400)}
  document.addEventListener('click',function(e){
    var b=e.target.closest('.sw');if(!b)return;var hex=b.getAttribute('data-hex');
    function fallback(){var r=document.createRange();r.selectNodeContents(b.querySelector('.hex'));var s=getSelection();s.removeAllRanges();s.addRange(r);say(hex+' sélectionné')}
    try{navigator.clipboard.writeText(hex).then(function(){say(hex+' copié')},fallback)}catch(err){fallback()}
  });
})();
</script>`;
  return standalone
    ? `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n</head>\n<body>\n${body}\n</body>\n</html>\n`
    : body;
}

async function png() {
  const { chromium } = require('playwright');
  fs.mkdirSync(path.join(OUT, 'tissus'), { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  for (const [i, r] of robes.entries()) {
    await pg.setContent(`<body style="margin:0">${renderTile(r, 4).replace('<svg ', '<svg width="1024" height="1024" style="display:block" ')}</body>`);
    await pg.screenshot({ path: path.join(OUT, 'tissus', `${num(i)}-${r.id}.png`) });
  }
  await browser.close();
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'apercus'), { recursive: true });
  robes.forEach((r, i) => fs.writeFileSync(path.join(OUT, 'apercus', `${num(i)}-${r.id}.svg`), renderRobe(r) + '\n'));
  fs.writeFileSync(path.join(OUT, 'robes.json'), JSON.stringify(data, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'index.html'), page(true));
  const frag = process.argv.find(a => a.startsWith('--fragment='));
  if (frag) fs.writeFileSync(frag.split('=')[1], page(false));
  if (process.argv.includes('--png')) await png();
  console.log(`${robes.length} robes générées.`);
})().catch(e => { console.error(e); process.exit(1); });
