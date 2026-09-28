/* Vue : direction artistique — style, palette, moodboard, prompt de style global */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui;

  const FIELDS = [
    ['lighting', ['Lumière & ambiance', 'Lighting & mood'], ['ex. lumière chaude de fin de journée, néons, brouillard…', 'e.g. warm golden hour, neon, fog…']],
    ['shapes', ['Formes & silhouettes', 'Shapes & silhouettes'], ['ex. formes rondes et amicales, angles agressifs pour les ennemis…', 'e.g. round friendly shapes, aggressive angles for enemies…']],
    ['materials', ['Matières & textures', 'Materials & textures'], ['ex. peint à la main, métal usé, peu de détails…', 'e.g. hand-painted, worn metal, low detail…']],
    ['camera', ['Caméra & cadrage', 'Camera & framing'], ['ex. vue 3e personne, caméra basse et dynamique…', 'e.g. third-person, low dynamic camera…']],
    ['ui', ['Style de l\'interface', 'UI style'], ['ex. HUD minimal, diégétique, typographie grasse…', 'e.g. minimal, diegetic HUD, bold type…']],
    ['typography', ['Typographie', 'Typography'], ['ex. titres condensés, texte sans-serif lisible…', 'e.g. condensed titles, readable sans-serif…']],
    ['dos', ['À faire ✔', 'Do ✔'], ['Ce qui définit le style…', 'What defines the style…']],
    ['donts', ['À éviter ✘', "Don't ✘"], ['Ce qui casserait le style…', 'What would break the style…']],
  ];

  const AI = [
    ['directions', 'palette', ['3 directions artistiques', '3 art directions'],
      'Propose 3 directions artistiques très différentes pour mon jeu. Pour chacune : nom, description, 3 jeux/films de référence, palette (codes hex), forces, risques et coût de production pour mon équipe. Termine en recommandant franchement l\'une d\'elles.',
      'Propose 3 very different art directions for my game. For each: name, description, 3 reference games/films, palette (hex codes), strengths, risks and production cost for my team. End by frankly recommending one.'],
    ['moodboard', 'eye', ['Analyser le moodboard', 'Analyze the moodboard'],
      'Analyse les images de mon moodboard : style dominant, cohérence, ce qui détonne, palette observée, et recommandations concrètes pour en tirer une direction artistique claire.',
      'Analyze my moodboard images: dominant style, consistency, what clashes, observed palette, and concrete recommendations to derive a clear art direction.'],
    ['critique', 'camera', ['Critique de ma DA', 'Critique my art direction'],
      'Critique ma direction artistique actuelle sans complaisance : lisibilité en jeu, originalité, adéquation au genre et au public, faisabilité pour mon équipe. Note /10 et priorités.',
      'Critique my current art direction without complacency: in-game readability, originality, fit for genre and audience, feasibility for my team. Score /10 and priorities.'],
    ['uiguide', 'image', ['Guide d\'interface', 'UI guidelines'],
      'Propose des lignes directrices d\'interface (HUD, menus, iconographie, typographie, couleurs d\'état, accessibilité) cohérentes avec ma direction artistique.',
      'Propose UI guidelines (HUD, menus, iconography, typography, state colors, accessibility) consistent with my art direction.'],
    ['readability', 'target', ['Lisibilité gameplay', 'Gameplay readability'],
      'Comment garantir la lisibilité du gameplay avec ma direction artistique (silhouettes, contrastes, codes couleur ennemis/alliés/interactifs, VFX) ? Donne des règles concrètes.',
      'How to ensure gameplay readability with my art direction (silhouettes, contrast, color codes for enemies/allies/interactables, VFX)? Give concrete rules.'],
  ];

  GF.views.art = {
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
                  <button class="btn sm ghost" id="palAI">${UI.icon('sparkles')} ${T('Proposer avec l\'IA', 'Suggest with AI')}</button>
                </div></div>
              <div class="palette-edit" id="palette"></div>
            </div>

            <div class="card">
              <h3>${UI.icon('sliders')} ${T('Règles du style', 'Style rules')}</h3>
              <div class="fields">
                ${FIELDS.map(([k, lab, ph]) => `<label class="field"><span class="lbl">${U.esc(L(lab))}</span><textarea class="input auto" rows="2" data-k="${k}" placeholder="${U.esc(L(ph))}">${U.esc(a[k] || '')}</textarea></label>`).join('')}
              </div>
            </div>

            <div class="card">
              <div class="card-head"><h3>${UI.icon('wand')} ${T('Prompt de style global (images IA)', 'Global style prompt (AI images)')}</h3>
                <button class="btn sm ghost" id="spAI">${UI.icon('sparkles')} ${T('Rédiger avec l\'IA', 'Write with AI')}</button></div>
              <p class="muted small">${T('Ajouté à chaque image générée quand le style « Style du projet » est choisi, pour garder un rendu cohérent. En anglais de préférence.', 'Added to every generated image when "Project style" is selected, to keep a consistent look. English preferred.')}</p>
              <textarea class="input auto" rows="3" data-k="stylePrompt" placeholder="stylized 3D, cel-shaded outlines, warm sunset palette, chunky shapes…">${U.esc(a.stylePrompt)}</textarea>
            </div>

            <div class="card">
              <div class="card-head"><h3>${UI.icon('image')} ${T('Moodboard', 'Moodboard')}</h3><span class="muted small">${a.moodboard.length} ${T('images', 'images')}</span></div>
              <div class="mood-grid" id="mood">${a.moodboard.map((id) => UI.tile(id, { actions: ['view', 'download', 'critique', 'remove'] })).join('')}</div>
              <div class="dropzone" id="moodDrop">${UI.icon('upload')} ${T('Glisse des images de référence ici, colle-les (Ctrl+V) ou', 'Drop reference images here, paste them (Ctrl+V) or')} <button class="link" id="moodUp">${T('parcours', 'browse')}</button></div>
              <div class="row gap wrap">
                <button class="btn" id="moodGen">${UI.icon('wand')} ${T('Générer une image de style', 'Generate a style image')}</button>
                <span id="moodStatus" class="grow"></span>
              </div>
            </div>
          </div>

          <div class="ent-side">
            <div class="card">
              <h3>${UI.icon('sparkles')} ${T('Directeur artistique IA', 'AI art director')}</h3>
              <div class="chips">${AI.map(([k, ic, lab]) => `<button class="chip" data-ai="${k}">${UI.icon(ic)} ${U.esc(L(lab))}</button>`).join('')}</div>
              <button class="btn block" id="fillAI">${UI.icon('wand')} ${T('Remplir les champs vides avec l\'IA', 'Fill empty fields with AI')}</button>
            </div>
            <div id="artOut"></div>
          </div>
        </div>`;

      el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => {
        a[inp.dataset.k] = inp.dataset.kind === 'tags' ? U.tagsFromString(inp.value) : inp.value;
        S.touch();
      }));

      // Palette
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
        palEl.querySelector('#palAdd').onclick = () => { a.palette.push('#8b5cf6'); S.touch(); drawPal(); };
      };
      drawPal();
      el.querySelector('#palExtract').onclick = async () => {
        if (!a.moodboard.length) { UI.toast(T('Ajoute d\'abord des images au moodboard.', 'Add images to the moodboard first.'), 'error'); return; }
        const cols = await extractPalette(a.moodboard.slice(0, 10), 8);
        a.palette = cols; S.touch(); drawPal();
        UI.toast(T('Palette extraite du moodboard', 'Palette extracted from moodboard'), 'success');
      };
      el.querySelector('#palAI').onclick = async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        try {
          const data = await GF.agent.json({
            prompt: GF.lang === 'en'
              ? 'Propose a 6 to 8 color palette for my game consistent with the art direction and genre. JSON array of {"hex": "#RRGGBB", "name": string, "usage": string}.'
              : 'Propose une palette de 6 à 8 couleurs pour mon jeu, cohérente avec la direction artistique et le genre. Tableau JSON de {"hex": "#RRGGBB", "name": texte, "usage": texte}.',
            persona: 'artdir', focus: 'art',
          });
          const arr = (Array.isArray(data) ? data : Object.values(data).find(Array.isArray) || []).map((c) => (typeof c === 'string' ? c : c.hex)).filter((h) => /^#[0-9a-f]{6}$/i.test(h || ''));
          if (!arr.length) throw new Error(T('Palette invalide', 'Invalid palette'));
          a.palette = arr; S.touch(); drawPal();
          const details = (Array.isArray(data) ? data : []).filter((c) => c && c.hex).map((c) => `- \`${c.hex}\` **${c.name || ''}** — ${c.usage || ''}`).join('\n');
          if (details) el.querySelector('#artOut').insertAdjacentHTML('afterbegin', `<div class="ai-out"><div class="ai-head"><span class="ai-badge">${UI.icon('palette')} ${T('Palette proposée', 'Proposed palette')}</span></div><div class="md">${GF.md.render(details)}</div></div>`);
        } catch (e) { UI.toast(e.message, 'error'); } finally { b.disabled = false; }
      };

      // Moodboard
      const addMood = async (files) => { const ids = await UI.importImages(files); a.moodboard.push(...ids); S.touch(); GF.app.route(); };
      UI.setPaste(addMood);
      UI.bindDrop(el.querySelector('#moodDrop'), addMood);
      el.querySelector('#moodUp').onclick = async () => {
        const ids = await UI.pickImages({ multiple: true, title: T('Ajouter au moodboard', 'Add to moodboard') });
        if (ids && ids.length) { a.moodboard.push(...ids.filter((i) => !a.moodboard.includes(i))); S.touch(); GF.app.route(); }
      };
      UI.bindTiles(el.querySelector('#mood'), { remove: (id) => { a.moodboard = a.moodboard.filter((x) => x !== id); S.touch(); GF.app.route(); } });
      el.querySelector('#moodGen').onclick = async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        const st = el.querySelector('#moodStatus');
        try {
          const desc = `${T('Image de référence de style (key art) pour le jeu', 'Style reference key art for the game')} ${S.project.name}. ${S.project.meta.pitch || ''} ${a.summary || ''}`;
          const { ids } = await GF.agent.generateImages({ prompt: desc, kind: 'keyart', style: 'project', aspect: '16:9', n: 1, source: 'moodboard', onStatus: (s) => { st.innerHTML = UI.spinner(s); } });
          a.moodboard.push(...ids); S.touch(); GF.app.route();
        } catch (e) { st.innerHTML = `<span class="err">${U.esc(e.message)}</span>`; } finally { b.disabled = false; }
      };

      // Prompt de style
      el.querySelector('#spAI').onclick = () => {
        GF.agent.run({
          into: el.querySelector('#artOut'), position: 'prepend', title: T('Prompt de style', 'Style prompt'), saveAsIdea: false,
          prompt: 'Write a reusable style prompt in English (40 to 80 words) describing my game\'s art direction precisely (rendering technique, palette, lighting, shapes, materials, mood), to append to every image generation prompt for consistency. Output only the prompt.',
          persona: 'artdir', focus: 'art', images: GF.agent.canSee() ? a.moodboard.slice(0, 4) : [],
          actions: [{ label: T('Utiliser ce prompt', 'Use this prompt'), icon: 'check', onClick: (t) => { a.stylePrompt = t.replace(/^["'\s]+|["'\s]+$/g, ''); S.touch(); GF.app.route(); UI.toast(T('Prompt de style enregistré', 'Style prompt saved'), 'success'); } }],
        });
      };

      el.querySelectorAll('[data-ai]').forEach((b) => {
        b.onclick = () => {
          const x = AI.find((y) => y[0] === b.dataset.ai);
          const withImgs = x[0] === 'moodboard' || x[0] === 'critique';
          if (x[0] === 'moodboard' && !a.moodboard.length) { UI.toast(T('Ajoute d\'abord des images au moodboard.', 'Add images to the moodboard first.'), 'error'); return; }
          GF.agent.run({
            into: el.querySelector('#artOut'), position: 'prepend', title: L(x[2]), prompt: GF.lang === 'en' ? x[4] : x[3],
            persona: x[0] === 'critique' ? 'critic' : 'artdir', focus: 'art', images: withImgs && (x[0] === 'moodboard' || GF.agent.canSee()) ? a.moodboard.slice(0, 8) : [], ideaCategory: 'art',
          });
        };
      });

      el.querySelector('#fillAI').onclick = async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        const keys = ['styleName', 'summary', 'references', ...FIELDS.map((f) => f[0])];
        const empty = keys.filter((k) => !String(a[k] || '').trim());
        if (!(a.keywords || []).length) empty.push('keywords');
        if (!empty.length) { UI.toast(T('Tout est déjà rempli 👌', 'Everything is already filled 👌'), 'success'); b.disabled = false; return; }
        const out = el.querySelector('#artOut');
        out.insertAdjacentHTML('afterbegin', `<div class="card" id="fillSp">${UI.spinner(T('L\'agent remplit la direction artistique…', 'The agent is filling the art direction…'))}</div>`);
        try {
          const data = await GF.agent.json({
            prompt: (GF.lang === 'en'
              ? `Fill in the empty fields of my art direction, consistent with the project and what is already filled. Keys to provide: ${empty.join(', ')} (keywords = array of strings, others = text). Values in English.`
              : `Remplis les champs vides de ma direction artistique, de façon cohérente avec le projet et ce qui est déjà rempli. Clés à fournir : ${empty.join(', ')} (keywords = tableau de chaînes, les autres = texte). Valeurs en français.`) + ' JSON object.',
            persona: 'artdir', focus: 'art', images: GF.agent.canSee() ? a.moodboard.slice(0, 4) : [],
          });
          let n = 0;
          for (const k of empty) {
            if (data[k] == null || data[k] === '') continue;
            a[k] = k === 'keywords' ? (Array.isArray(data[k]) ? data[k].map(String) : U.tagsFromString(data[k])) : (Array.isArray(data[k]) ? data[k].join('\n') : String(data[k]));
            n++;
          }
          S.touch();
          UI.toast(T(`${n} champ(s) rempli(s)`, `${n} field(s) filled`), 'success');
          GF.app.route();
        } catch (e) {
          const sp = el.querySelector('#fillSp'); if (sp) sp.outerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(e.message)}</div></div>`;
        } finally { b.disabled = false; }
      };
    },
  };

  /** Extraction simple des couleurs dominantes (quantification + distance minimale) */
  async function extractPalette(ids, k = 8) {
    const counts = new Map();
    for (const id of ids) {
      const rec = await GF.images.get(id);
      if (!rec) continue;
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
    const sorted = Array.from(counts.entries()).sort((x, y) => y[1] - x[1]);
    const out = [];
    for (const [key] of sorted) {
      const r = ((key >> 8) & 15) * 17, g = ((key >> 4) & 15) * 17, b = (key & 15) * 17;
      if (out.some((o) => Math.abs(o[0] - r) + Math.abs(o[1] - g) + Math.abs(o[2] - b) < 90)) continue;
      out.push([r, g, b]);
      if (out.length >= k) break;
    }
    return out.map(([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''));
  }
})();
