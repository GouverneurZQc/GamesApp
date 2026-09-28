/* Vue : studio « Idée → Image » + galerie du projet */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;

  const form = { idea: '', kind: 'concept', style: 'project', aspect: '16:9', n: 1, refs: [], optimize: null, customPrompt: '' };
  let filter = '';

  const EXAMPLES = [
    ['Une voiture de rallye rouillée transformée en véhicule de survie, pneus énormes, pare-buffle en os de dinosaure, dans un désert orange au coucher du soleil',
      'A rusty rally car turned into a survival vehicle, huge tires, dinosaur-bone bull bar, in an orange desert at sunset'],
    ['Portrait de l\'héroïne : pilote de 24 ans, cheveux courts décolorés, veste de course rapiécée, regard déterminé',
      'Heroine portrait: 24-year-old pilot, short bleached hair, patched racing jacket, determined look'],
    ['Une ville flottante au-dessus des nuages, reliée par des ponts de lianes lumineuses, style aquarelle',
      'A floating city above the clouds, linked by glowing vine bridges, watercolor style'],
    ['Écran de HUD d\'un jeu de course arcade : compteur de vitesse, jauge de nitro, minimap, position 3/8',
      'Arcade racing HUD screen: speedometer, nitro gauge, minimap, position 3/8'],
  ];

  function isUsed(id) {
    const p = S.project;
    if (p.meta.cover === id || p.art.moodboard.includes(id)) return true;
    if (p.ideas.some((i) => (i.images || []).includes(id))) return true;
    if (p.critiques.some((c) => c.images.includes(id))) return true;
    return SC.ENTITY_ORDER.some((t) => p.entities[t].some((e) => e.images.includes(id)));
  }

  GF.views.studio = {
    title: () => T('Idée → Image', 'Idea → Image'),
    render(el) {
      const p = S.project;
      if (form.optimize === null) form.optimize = S.settings.agent.optimizePrompts;
      if (GF.app.pending && GF.app.pending.studioRef) {
        form.refs = Array.from(new Set([...form.refs, GF.app.pending.studioRef]));
        if (!form.idea) form.idea = T('Modifie cette image : ', 'Edit this image: ');
        GF.app.pending = null;
      }
      let prov = null;
      try { prov = GF.ai.resolve('image'); } catch (e) { /* ignore */ }
      const refOK = prov && prov.def.kind !== 'pollinations';
      const gallery = p.gallery.filter((g) => !filter || g.kind === filter || g.source === filter);

      el.innerHTML = `
        <div class="card studio-form">
          <div class="card-head"><h3>${UI.icon('wand')} ${T('Décris ton idée, l\'agent en fait une image', 'Describe your idea, the agent turns it into an image')}</h3>
            <span class="muted small">${T('Fournisseur', 'Provider')} : <strong>${U.esc(prov ? `${prov.label}${prov.imageModel ? ' · ' + prov.imageModel : ''}` : '—')}</strong> · <a class="link" href="#/settings">${T('changer', 'change')}</a></span></div>
          <textarea class="input auto big" id="sIdea" rows="4" placeholder="${T('Ex. : une moto volante cyberpunk garée devant un ramen bar sous la pluie néon…', 'E.g.: a cyberpunk flying motorbike parked in front of a ramen bar in neon rain…')}">${U.esc(form.idea)}</textarea>
          <div class="chips small-chips">${EXAMPLES.map((ex, i) => `<button class="chip" data-ex="${i}">${UI.icon('dice')} ${U.esc(U.truncate(L(ex), 48))}</button>`).join('')}</div>
          <div class="row gap wrap">
            <label class="field"><span class="lbl">${T('Type', 'Type')}</span><select class="input" id="sKind">${UI.options(SC.IMAGE_KINDS.map((k) => [k[0], k[1]]), form.kind)}</select></label>
            <label class="field"><span class="lbl">${T('Style', 'Style')}</span><select class="input" id="sStyle">${UI.options(SC.IMAGE_STYLES.map((s) => [s[0], s[1]]), form.style)}</select></label>
            <label class="field"><span class="lbl">${T('Format', 'Aspect')}</span><select class="input" id="sAspect">${UI.options(SC.ASPECTS.map((a) => [a, [a, a]]), form.aspect)}</select></label>
            <label class="field"><span class="lbl">${T('Nombre', 'Count')}</span><select class="input" id="sN">${UI.options(['1', '2', '3', '4'].map((n) => [n, [n, n]]), String(form.n))}</select></label>
          </div>
          <div class="refs-box">
            <span class="lbl">${T('Images de référence (optionnel) — pour modifier une image ou garder la cohérence', 'Reference images (optional) — to edit an image or keep consistency')}</span>
            <div class="thumbs" id="sRefs">${form.refs.map((id) => UI.tile(id, { actions: ['view', 'remove'] })).join('')}
              <button class="thumb-add" id="sRefAdd" ${refOK ? '' : 'disabled'} title="${refOK ? '' : T('Nécessite OpenAI ou Gemini comme fournisseur d\'images', 'Requires OpenAI or Gemini as image provider')}">${UI.icon('plus')}</button></div>
            ${refOK ? '' : `<small class="muted">${T('Les images de référence nécessitent OpenAI ou Gemini (Paramètres).', 'Reference images require OpenAI or Gemini (Settings).')}</small>`}
          </div>
          <label class="check"><input type="checkbox" id="sOpt" ${form.optimize ? 'checked' : ''}> ${T('L\'agent réécrit mon idée en prompt détaillé (meilleurs résultats)', 'The agent rewrites my idea into a detailed prompt (better results)')}</label>
          <div class="row gap wrap">
            <button class="btn primary" id="sGo">${UI.icon('wand')} ${T('Générer', 'Generate')}</button>
            <button class="btn ghost" id="sPrompt">${UI.icon('sparkles')} ${T('Voir / modifier le prompt d\'abord', 'See / edit the prompt first')}</button>
          </div>
          <div id="sPromptBox"></div>
          <div id="sStatus"></div>
        </div>

        <div class="card">
          <div class="card-head"><h3>${UI.icon('image')} ${T('Galerie du projet', 'Project gallery')} <span class="muted small">${p.gallery.length}</span></h3>
            <select class="input sm" id="gFilter" style="max-width:220px">${UI.options(SC.IMAGE_KINDS.slice(1).map((k) => [k[0], k[1]]), filter, { empty: T('Tous les types', 'All types') })}</select></div>
          <div class="gallery" id="gal">${gallery.length ? gallery.map((g) => UI.tile(g.id, { caption: g.idea || g.prompt, actions: ['view', 'download', 'attach', 'critique', 'edit', 'reuse', 'remove'] })).join('')
            : `<p class="muted">${T('Tes images générées apparaîtront ici.', 'Your generated images will appear here.')}</p>`}</div>
        </div>`;

      const sync = () => {
        form.idea = el.querySelector('#sIdea').value;
        form.kind = el.querySelector('#sKind').value;
        form.style = el.querySelector('#sStyle').value;
        form.aspect = el.querySelector('#sAspect').value;
        form.n = +el.querySelector('#sN').value;
        form.optimize = el.querySelector('#sOpt').checked;
      };
      el.querySelectorAll('#sIdea, #sKind, #sStyle, #sAspect, #sN, #sOpt').forEach((x) => x.addEventListener('change', sync));
      el.querySelector('#sIdea').addEventListener('input', sync);
      el.querySelectorAll('[data-ex]').forEach((b) => { b.onclick = () => { el.querySelector('#sIdea').value = L(EXAMPLES[+b.dataset.ex]); sync(); UI.autoGrow(el); }; });
      el.querySelector('#gFilter').onchange = (e) => { filter = e.target.value; sync(); GF.app.route(); };

      const refsEl = el.querySelector('#sRefs');
      UI.bindTiles(refsEl, { remove: (id) => { form.refs = form.refs.filter((x) => x !== id); sync(); GF.app.route(); } });
      el.querySelector('#sRefAdd').onclick = async () => {
        const ids = await UI.pickImages({ multiple: true, title: T('Images de référence', 'Reference images') });
        if (ids && ids.length) { form.refs = Array.from(new Set([...form.refs, ...ids])).slice(0, 4); sync(); GF.app.route(); }
      };
      if (refOK) UI.setPaste(async (files) => { const ids = await UI.importImages(files); form.refs = [...form.refs, ...ids].slice(0, 4); sync(); GF.app.route(); });

      UI.bindTiles(el.querySelector('#gal'), {
        reuse: (id) => {
          const g = p.gallery.find((x) => x.id === id);
          if (!g) return;
          form.idea = g.idea || g.prompt; form.kind = g.kind || 'free';
          GF.app.route(); el.scrollTop = 0;
        },
        edit: (id) => { form.refs = Array.from(new Set([...form.refs, id])).slice(0, 4); if (!form.idea) form.idea = T('Modifie cette image : ', 'Edit this image: '); GF.app.route(); el.scrollTop = 0; },
        remove: async (id) => {
          const used = isUsed(id);
          if (!(await UI.confirm(used ? T('Retirer de la galerie ? (l\'image reste utilisée dans le projet)', 'Remove from gallery? (the image stays used in the project)') : T('Supprimer définitivement cette image ?', 'Delete this image permanently?'), { danger: true }))) return;
          p.gallery = p.gallery.filter((g) => g.id !== id);
          if (!used) await GF.images.remove(id);
          S.touch(); GF.app.refreshNav(); GF.app.route();
        },
      });

      const status = el.querySelector('#sStatus');
      el.querySelector('#sPrompt').onclick = async (ev) => {
        sync();
        if (!form.idea.trim()) { UI.toast(T('Décris d\'abord ton idée.', 'Describe your idea first.'), 'error'); return; }
        const b = ev.currentTarget; b.disabled = true;
        const box = el.querySelector('#sPromptBox');
        box.innerHTML = UI.spinner(T('L\'agent rédige le prompt…', 'The agent is writing the prompt…'));
        try {
          const kindDef = SC.IMAGE_KINDS.find((k) => k[0] === form.kind);
          const pr = await GF.agent.imagePrompt(form.idea, { kindText: kindDef ? kindDef[2] : '', style: GF.agent.styleText(form.style) });
          form.customPrompt = pr;
          box.innerHTML = `<label class="lbl">${T('Prompt final (modifiable, en anglais)', 'Final prompt (editable)')}</label>
            <textarea class="input auto" id="sCustom" rows="4">${U.esc(pr)}</textarea>
            <button class="btn primary" id="sGoCustom">${UI.icon('wand')} ${T('Générer avec ce prompt', 'Generate with this prompt')}</button>`;
          UI.autoGrow(box);
          box.querySelector('#sGoCustom').onclick = () => generate(box.querySelector('#sCustom').value.trim(), true);
        } catch (e) {
          box.innerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(e.message)}</div></div>`;
        } finally { b.disabled = false; }
      };

      const generate = async (promptText, raw) => {
        sync();
        if (!promptText.trim()) { UI.toast(T('Décris d\'abord ton idée.', 'Describe your idea first.'), 'error'); return; }
        const btn = el.querySelector('#sGo');
        btn.disabled = true;
        const ctrl = new AbortController();
        status.innerHTML = '';
        try {
          const { ids, finalPrompt, provider } = await GF.agent.generateImages({
            prompt: promptText, kind: raw ? 'free' : form.kind, kindText: raw ? '' : undefined, style: raw ? 'none' : form.style,
            aspect: form.aspect, n: form.n, refs: form.refs, optimize: raw ? false : form.optimize, source: 'studio', signal: ctrl.signal,
            onStatus: (s, pr) => {
              status.innerHTML = `${UI.spinner(s)}${pr ? `<details class="small"><summary>${T('Prompt envoyé', 'Prompt sent')}</summary><p>${U.esc(pr)}</p></details>` : ''}`;
            },
          });
          if (raw) { const g = p.gallery.find((x) => x.id === ids[0]); if (g) g.idea = form.idea; }
          UI.toast(T(`${ids.length} image(s) générée(s) avec ${provider.label}`, `${ids.length} image(s) generated with ${provider.label}`), 'success');
          GF.app.refreshNav();
          await GF.app.route();
          const st2 = document.querySelector('#sStatus');
          if (st2) st2.innerHTML = `<details class="small"><summary>${T('Prompt utilisé', 'Prompt used')}</summary><p>${U.esc(finalPrompt)}</p></details>`;
        } catch (e) {
          status.innerHTML = `<div class="ai-error">${UI.icon('info')}<div><strong>${T('Échec de la génération', 'Generation failed')}</strong><br>${U.esc(e.message)}<br><a class="link" href="#/settings">${T('Paramètres IA', 'AI settings')}</a></div></div>`;
        } finally { btn.disabled = false; }
      };
      el.querySelector('#sGo').onclick = () => { sync(); generate(form.idea, false); };
      el.querySelector('#sIdea').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sync(); generate(form.idea, false); } });
    },
  };
})();
