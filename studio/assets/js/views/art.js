/* Vue : direction artistique — style, palette, règles, moodboard */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui;

  const FIELDS = [
    ['lighting', ['Lumière & ambiance', 'Lighting & mood'], ['ex. lumière chaude de fin de journée, néons, brouillard…', 'e.g. warm golden hour, neon, fog…']],
    ['shapes', ['Formes & silhouettes', 'Shapes & silhouettes'], ['ex. formes rondes et amicales, angles agressifs pour les ennemis…', 'e.g. round friendly shapes, aggressive angles for enemies…']],
    ['materials', ['Matières & textures', 'Materials & textures'], ['ex. peint à la main, métal usé…', 'e.g. hand-painted, worn metal…']],
    ['camera', ['Caméra & cadrage', 'Camera & framing'], ['ex. vue 3e personne, caméra basse…', 'e.g. third-person, low camera…']],
    ['ui', ['Style de l\'interface', 'UI style'], ['ex. HUD minimal, diégétique…', 'e.g. minimal, diegetic HUD…']],
    ['typography', ['Typographie', 'Typography'], ['ex. titres condensés, texte sans-serif lisible…', 'e.g. condensed titles, readable sans-serif…']],
    ['dos', ['À faire ✔', 'Do ✔'], ['Ce qui définit le style…', 'What defines the style…']],
    ['donts', ['À éviter ✘', "Don't ✘"], ['Ce qui casserait le style…', 'What would break the style…']],
  ];

  DP.views.art = {
    title: () => T('Direction artistique', 'Art direction'),
    render(el) {
      const a = S.project.art;
      el.innerHTML = `
        <div class="ent-layout">
          <div class="ent-main">
            <div class="card">
              <h3>${UI.icon('palette')} ${T('Identité visuelle', 'Visual identity')}</h3>
              <div class="fields">
                <label class="field"><span class="lbl">${T('Nom du style', 'Style name')}</span><input class="input" data-k="styleName" value="${U.esc(a.styleName)}" placeholder="${T('ex. Néo-rétro cel-shadé', 'e.g. Neo-retro cel-shaded')}"></label>
                <label class="field"><span class="lbl">${T('Mots-clés', 'Keywords')}</span><input class="input" data-k="keywords" data-kind="tags" value="${U.esc((a.keywords || []).join(', '))}" placeholder="${T('coloré, anguleux, lumineux…', 'colorful, angular, bright…')}"></label>
                <label class="field wide"><span class="lbl">${T('Résumé de la direction artistique', 'Art direction summary')}</span><textarea class="input auto" rows="3" data-k="summary">${U.esc(a.summary)}</textarea></label>
                <label class="field wide"><span class="lbl">${T('Références (jeux, films, artistes)', 'References (games, films, artists)')}</span><textarea class="input auto" rows="2" data-k="references">${U.esc(a.references)}</textarea></label>
              </div>
            </div>
            <div class="card">
              <div class="card-head"><h3>${UI.icon('palette')} ${T('Palette de couleurs', 'Color palette')}</h3>
                <div class="row gap">
                  <button class="btn sm ghost" id="palExtract">${UI.icon('eye')} ${T('Extraire du moodboard', 'Extract from moodboard')}</button>
                  <button class="btn sm ghost" id="palCopy">${UI.icon('copy')} ${T('Copier les codes', 'Copy codes')}</button>
                </div></div>
              <div class="palette-edit" id="palette"></div>
            </div>
            <div class="card">
              <h3>${UI.icon('sliders')} ${T('Règles du style', 'Style rules')}</h3>
              <div class="fields">${FIELDS.map(([k, lab, ph]) => `<label class="field"><span class="lbl">${U.esc(L(lab))}</span><textarea class="input auto" rows="2" data-k="${k}" placeholder="${U.esc(L(ph))}">${U.esc(a[k] || '')}</textarea></label>`).join('')}</div>
            </div>
            <div class="card drop-target" id="moodCard">
              <div class="card-head"><h3>${UI.icon('image')} ${T('Moodboard', 'Moodboard')}</h3><span class="muted small">${a.moodboard.length} ${T('images', 'images')}</span></div>
              <div class="mood-grid" id="mood">${a.moodboard.map((id) => UI.tile(id, { actions: ['view', 'download', 'attach', 'remove'] })).join('')}</div>
              <div class="dropzone">${UI.icon('upload')} ${T('Glisse des images de référence ici, colle-les (Ctrl+V) ou', 'Drop reference images here, paste them (Ctrl+V) or')} <button class="link" id="moodUp">${T('parcours', 'browse')}</button></div>
            </div>
          </div>
          <div class="ent-side">
            <div class="card">
              <h3>${UI.icon('sparkles')} ${T('Questions de direction artistique', 'Art direction questions')}</h3>
              <div class="stack">${DP.toolboxData.QUESTIONS.filter((q) => q.cat === 'art').map((q) => `<div class="qcard"><p>${U.esc(L(q.t))}</p></div>`).join('')}</div>
            </div>
            <div class="card">
              <h3>${UI.icon('check')} ${T('Test de lisibilité', 'Readability test')}</h3>
              <p class="muted small">${T('Affiche le moodboard en noir et blanc : si le gameplay reste lisible, les valeurs (clair / foncé) sont bonnes.', 'Show the moodboard in grayscale: if gameplay stays readable, your values (light / dark) are good.')}</p>
              <button class="btn block" id="gray">${UI.icon('eye')} ${T('Basculer noir & blanc', 'Toggle grayscale')}</button>
            </div>
          </div>
        </div>`;

      el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => {
        a[inp.dataset.k] = inp.dataset.kind === 'tags' ? U.tagsFromString(inp.value) : inp.value;
        S.touch();
      }));

      const palEl = el.querySelector('#palette');
      const drawPal = () => {
        palEl.innerHTML = `${(a.palette || []).map((c, i) => `<div class="swatch">
            <input type="color" data-i="${i}" value="${/^#[0-9a-f]{6}$/i.test(c) ? c : '#888888'}">
            <input class="input sm hex" data-hex="${i}" value="${U.esc(c)}">
            <button class="btn icon sm ghost" data-rm="${i}">${UI.icon('x')}</button></div>`).join('')}
          <button class="swatch add" id="palAdd">${UI.icon('plus')}</button>`;
        palEl.querySelectorAll('input[type=color]').forEach((inp) => inp.addEventListener('input', () => { a.palette[+inp.dataset.i] = inp.value; palEl.querySelector(`[data-hex="${inp.dataset.i}"]`).value = inp.value; S.touch(); }));
        palEl.querySelectorAll('[data-hex]').forEach((inp) => inp.addEventListener('change', () => { let v = inp.value.trim(); if (!v.startsWith('#')) v = '#' + v; a.palette[+inp.dataset.hex] = v; S.touch(); drawPal(); }));
        palEl.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { a.palette.splice(+b.dataset.rm, 1); S.touch(); drawPal(); }; });
        palEl.querySelector('#palAdd').onclick = () => { a.palette.push('#888888'); S.touch(); drawPal(); };
      };
      drawPal();
      el.querySelector('#palExtract').onclick = async () => {
        if (!a.moodboard.length) { UI.toast(T('Ajoute d\'abord des images au moodboard.', 'Add images to the moodboard first.'), 'error'); return; }
        a.palette = await extractPalette(a.moodboard.slice(0, 12), 8); S.touch(); drawPal();
        UI.toast(T('Palette extraite du moodboard', 'Palette extracted from moodboard'), 'success');
      };
      el.querySelector('#palCopy').onclick = async () => { await U.copyText((a.palette || []).join(', ')); UI.toast(T('Codes copiés', 'Codes copied'), 'success'); };

      const addMood = async (files) => { const ids = await UI.importFiles(files); a.moodboard.push(...ids); S.touch(); DP.app.route(); };
      UI.setPaste(addMood);
      UI.bindDrop(el.querySelector('#moodCard'), addMood);
      el.querySelector('#moodUp').onclick = async () => {
        const ids = await UI.pickImages({ multiple: true, title: T('Ajouter au moodboard', 'Add to moodboard') });
        if (ids && ids.length) { a.moodboard.push(...ids.filter((i) => !a.moodboard.includes(i))); S.touch(); DP.app.route(); }
      };
      UI.bindTiles(el.querySelector('#mood'), { remove: (id) => { a.moodboard = a.moodboard.filter((x) => x !== id); S.touch(); DP.app.route(); } });
      el.querySelector('#gray').onclick = () => { const m = el.querySelector('#mood'); m.style.filter = m.style.filter ? '' : 'grayscale(1)'; };
    },
  };

  /** Couleurs dominantes (quantification + distance minimale) */
  async function extractPalette(ids, k = 8) {
    const counts = new Map();
    for (const id of ids) {
      const rec = await DP.media.get(id);
      if (!rec || rec.kind === 'audio') continue;
      try {
        const { img, url } = await U.loadImage(rec.blob);
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        URL.revokeObjectURL(url);
        const d = ctx.getImageData(0, 0, 64, 64).data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      } catch (e) { /* ignore */ }
    }
    const out = [];
    for (const [key] of Array.from(counts.entries()).sort((x, y) => y[1] - x[1])) {
      const r = ((key >> 8) & 15) * 17, g = ((key >> 4) & 15) * 17, b = (key & 15) * 17;
      if (out.some((o) => Math.abs(o[0] - r) + Math.abs(o[1] - g) + Math.abs(o[2] - b) < 90)) continue;
      out.push([r, g, b]);
      if (out.length >= k) break;
    }
    return out.map(([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''));
  }
})();
