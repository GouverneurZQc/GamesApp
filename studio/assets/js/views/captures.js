/* Vue : captures d'écran par version — comparaison avant/après, auto-évaluation, notes */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui;

  const CRITERIA = [
    ['read', ['Lisibilité', 'Readability']], ['art', ['Direction artistique', 'Art direction']], ['comp', ['Composition', 'Composition']],
    ['light', ['Lumière & couleurs', 'Lighting & color']], ['ui', ['Interface / HUD', 'UI / HUD']], ['feel', ['Impression générale', 'Overall feel']],
  ];
  const STATUS = [['wip', ['En cours', 'Work in progress']], ['review', ['À revoir', 'To review']], ['good', ['Validée', 'Approved']], ['marketing', ['Prête pour le marketing', 'Marketing-ready']]];

  DP.views.captures = {
    title: () => T('Captures & versions', 'Captures & builds'),
    render(el, params) {
      const p = S.project;
      if (DP.app.pending && DP.app.pending.captureImages) {
        const c = newCapture(DP.app.pending.captureImages);
        DP.app.pending = null;
        params = { id: c.id };
        history.replaceState(null, '', `#/captures/${c.id}`);
      }
      let cur = params.id || (p.captures[0] && p.captures[0].id);
      el.innerHTML = `
        <div class="split">
          <div class="split-list card">
            <button class="btn primary block" id="newCap">${UI.icon('upload')} ${T('Nouvelle capture', 'New capture')}</button>
            <button class="btn block ghost" id="cmpBtn">${UI.icon('compare')} ${T('Comparer deux images', 'Compare two images')}</button>
            <div class="list" id="capList">${p.captures.length ? p.captures.map((c) => `
              <button class="list-item ${c.id === cur ? 'active' : ''}" data-id="${c.id}">
                <span class="num" style="background-size:cover;background-position:center" ${c.images[0] ? `data-bg-img="${c.images[0]}"` : ''}></span>
                <span class="li-body"><strong>${U.esc(c.title || T('Sans titre', 'Untitled'))}</strong><small>${U.esc([c.version, U.fmtDay(c.date)].filter(Boolean).join(' · '))}${c.public ? ' · 🌐' : ''}</small></span>
              </button>`).join('') : `<p class="muted pad small">${T('Documente l\'évolution visuelle du jeu : une capture par version.', 'Document the game\'s visual evolution: one capture per build.')}</p>`}</div>
          </div>
          <div class="split-detail" id="capDetail"></div>
        </div>`;
      const det = el.querySelector('#capDetail');
      el.querySelector('#newCap').onclick = async () => {
        const files = await U.pickFiles({ multiple: true });
        if (!files.length) return;
        const ids = await UI.importFiles(files);
        const c = newCapture(ids);
        DP.app.go(`captures/${c.id}`);
      };
      el.querySelector('#cmpBtn').onclick = () => compareModal();
      el.querySelectorAll('#capList [data-id]').forEach((b) => { b.onclick = () => DP.app.go(`captures/${b.dataset.id}`); });
      UI.setPaste(async (files) => { const ids = await UI.importFiles(files); const c = newCapture(ids); DP.app.go(`captures/${c.id}`); });

      const c = p.captures.find((x) => x.id === cur);
      if (!c) {
        det.innerHTML = UI.empty('camera', T('Aucune capture sélectionnée', 'No capture selected'),
          T('Colle une capture d\'écran (Ctrl+V) ou importe des images. Note chaque version, évalue-la, compare l\'avant/après et rends les meilleures publiques pour le portail.',
            'Paste a screenshot (Ctrl+V) or import images. Note each build, rate it, compare before/after and make the best public for the portal.'));
        return;
      }
      c.scores = c.scores || {};
      const avg = CRITERIA.map(([k]) => c.scores[k]).filter((v) => v != null && v !== '');
      det.innerHTML = `
        <div class="card drop-target" id="cCard">
          <div class="row gap">
            <input class="title-input grow" id="cTitle" value="${U.esc(c.title)}" placeholder="${T('Titre (ex. Menu principal, Niveau 2…)', 'Title (e.g. Main menu, Level 2…)')}">
            ${UI.publicToggle(c.public, 'id="cPub"')}
            <button class="btn icon ghost" id="cDel">${UI.icon('trash')}</button>
          </div>
          <div class="fields">
            <label class="field"><span class="lbl">${T('Version / build', 'Version / build')}</span><input class="input" id="cVer" value="${U.esc(c.version || '')}" placeholder="0.3.1"></label>
            <label class="field"><span class="lbl">${T('Date', 'Date')}</span><input class="input" type="date" id="cDate" value="${U.esc(c.date || '')}"></label>
            <label class="field"><span class="lbl">${T('État', 'Status')}</span><select class="input" id="cStatus">${UI.options(STATUS, c.status)}</select></label>
          </div>
          <div class="thumbs big" id="cImgs">${c.images.map((id) => UI.tile(id, { actions: ['view', 'download', 'attach', 'remove'] })).join('')}</div>
          <div class="dropzone sm">${UI.icon('upload')} ${T('Ajoute des images : glisse, colle ou', 'Add images: drop, paste or')} <button class="link" id="cAdd">${T('parcours', 'browse')}</button></div>
        </div>
        <div class="grid2">
          <div class="card">
            <h3>${UI.icon('star')} ${T('Auto-évaluation (0-10)', 'Self-review (0-10)')} ${avg.length ? `<span class="tag">${(avg.reduce((a, b) => a + +b, 0) / avg.length).toFixed(1)}/10</span>` : ''}</h3>
            ${CRITERIA.map(([k, lab]) => `<div class="field"><span class="lbl">${U.esc(L(lab))}</span><div class="rating"><input type="range" min="0" max="10" data-sc="${k}" value="${c.scores[k] ?? 5}"><output>${c.scores[k] ?? '–'}</output></div></div>`).join('')}
          </div>
          <div class="card">
            <h3>${UI.icon('edit')} ${T('Notes & retours', 'Notes & feedback')}</h3>
            <textarea class="input auto" id="cNotes" rows="10" placeholder="${T('Ce qui marche, ce qui cloche, ce qu\'il faut changer pour la prochaine version… (Markdown)', 'What works, what is off, what to change next build… (Markdown)')}">${U.esc(c.notes || '')}</textarea>
            <button class="btn sm" id="cTask">${UI.icon('check')} ${T('Transformer chaque ligne « - … » en tâche', 'Turn each "- …" line into a task')}</button>
          </div>
        </div>
        ${c.images.length >= 2 ? `<div class="card"><h3>${UI.icon('compare')} ${T('Avant / après', 'Before / after')}</h3><div id="cmpHere"></div></div>` : ''}`;
      DP.media.hydrate(det);
      UI.autoGrow(det);
      const touch = () => { c.updatedAt = Date.now(); S.touch(); };
      det.querySelector('#cTitle').addEventListener('input', (e) => { c.title = e.target.value; touch(); });
      det.querySelector('#cVer').addEventListener('input', (e) => { c.version = e.target.value; touch(); });
      det.querySelector('#cDate').addEventListener('change', (e) => { c.date = e.target.value; touch(); });
      det.querySelector('#cStatus').onchange = (e) => { c.status = e.target.value; touch(); };
      det.querySelector('#cNotes').addEventListener('input', (e) => { c.notes = e.target.value; touch(); });
      det.querySelector('#cPub').onclick = () => { c.public = !c.public; touch(); DP.app.route(); };
      det.querySelectorAll('[data-sc]').forEach((r) => r.addEventListener('input', () => { c.scores[r.dataset.sc] = +r.value; r.nextElementSibling.textContent = r.value; touch(); }));
      det.querySelector('#cDel').onclick = () => {
        S.trash('capture', c);
        p.captures = p.captures.filter((x) => x.id !== c.id); S.touch(); DP.app.refreshNav();
        UI.toast(T('Capture déplacée dans la corbeille', 'Capture moved to trash'), 'success'); DP.app.go('captures');
      };
      det.querySelector('#cTask').onclick = () => {
        const lines = String(c.notes || '').split('\n').filter((l) => /^\s*[-*•]\s+/.test(l)).map((l) => l.replace(/^\s*[-*•]\s+/, '').trim()).filter(Boolean);
        if (!lines.length) { UI.toast(T('Aucune ligne commençant par « - » dans les notes.', 'No line starting with "-" in the notes.'), 'error'); return; }
        lines.forEach((l) => p.tasks.unshift({ id: U.uid('task_'), title: l, desc: `${T('Capture', 'Capture')} : ${c.title}`, status: 'todo', priority: 'med', category: 'Art', milestone: '', createdAt: Date.now() }));
        S.touch(); DP.app.refreshNav(); UI.toast(T(`${lines.length} tâche(s) créée(s)`, `${lines.length} task(s) created`), 'success');
      };
      const addImgs = async (files) => { const ids = await UI.importFiles(files); c.images.push(...ids); touch(); DP.app.route(); };
      UI.setPaste(addImgs);
      UI.bindDrop(det.querySelector('#cCard'), addImgs);
      det.querySelector('#cAdd').onclick = async () => { const ids = await UI.pickImages({ multiple: true }); if (ids && ids.length) { c.images.push(...ids); touch(); DP.app.route(); } };
      UI.bindTiles(det.querySelector('#cImgs'), { remove: (id) => { c.images = c.images.filter((x) => x !== id); touch(); DP.app.route(); } });
      const here = det.querySelector('#cmpHere');
      if (here) mountCompare(here, c.images[0], c.images[c.images.length - 1]);
    },
  };

  function newCapture(images) {
    const c = { id: U.uid('cap_'), title: T('Capture', 'Capture') + ' ' + (S.project.captures.length + 1), version: '', date: U.today(), images: images || [], notes: '', scores: {}, status: 'wip', public: false, createdAt: Date.now(), updatedAt: Date.now() };
    S.project.captures.unshift(c);
    S.touch(); DP.app.refreshNav();
    return c;
  }

  /** Curseur de comparaison avant / après */
  async function mountCompare(host, a, b) {
    const [ua, ub] = await Promise.all([DP.media.url(a), DP.media.url(b)]);
    host.innerHTML = `<div class="compare"><img src="${ub}" alt="" draggable="false"><div class="cmp-top" style="width:50%"><img src="${ua}" alt="" draggable="false"></div><div class="cmp-line" style="left:50%"></div>
      <span class="cmp-lbl" style="left:10px">${T('Avant', 'Before')}</span><span class="cmp-lbl" style="right:10px">${T('Après', 'After')}</span></div>`;
    const box = host.querySelector('.compare');
    const top = box.querySelector('.cmp-top');
    const topImg = top.querySelector('img');
    const line = box.querySelector('.cmp-line');
    const fit = () => { topImg.style.width = `${box.clientWidth}px`; topImg.style.height = 'auto'; };
    box.querySelector('img').onload = fit; fit();
    new ResizeObserver(fit).observe(box);
    const set = (x) => {
      const r = box.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
      top.style.width = `${pct}%`; line.style.left = `${pct}%`;
    };
    let drag = false;
    box.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = true; box.setPointerCapture(e.pointerId); set(e.clientX); });
    box.addEventListener('pointermove', (e) => { if (drag) set(e.clientX); });
    box.addEventListener('pointerup', () => { drag = false; });
    box.addEventListener('pointercancel', () => { drag = false; });
  }

  async function compareModal() {
    const p = S.project;
    const pool = Array.from(new Set([...p.captures.flatMap((c) => c.images), ...p.gallery.filter((g) => g.kind !== 'audio').map((g) => g.id)]));
    if (pool.length < 2) { UI.toast(T('Il faut au moins deux images.', 'You need at least two images.'), 'error'); return; }
    const picked = [];
    const m = UI.modal({
      title: T('Comparer : choisis l\'image AVANT puis l\'image APRÈS', 'Compare: pick the BEFORE image then the AFTER image'), wide: true,
      body: `<div class="pick-grid" id="pg">${pool.map((id) => `<button class="pick" data-id="${id}"><img data-img="${id}" alt=""></button>`).join('')}</div><div id="cmpOut"></div>`,
    });
    m.root.querySelectorAll('.pick').forEach((b) => {
      b.onclick = () => {
        if (picked.length >= 2) picked.length = 0;
        picked.push(b.dataset.id);
        m.root.querySelectorAll('.pick').forEach((x) => x.classList.toggle('sel', picked.includes(x.dataset.id)));
        if (picked.length === 2) { m.root.querySelector('#pg').hidden = true; mountCompare(m.root.querySelector('#cmpOut'), picked[0], picked[1]); }
      };
    });
  }
})();
