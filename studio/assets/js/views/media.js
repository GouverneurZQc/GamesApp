/* Vue : médiathèque (images et sons du projet) */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui;
  const st = { filter: 'all', q: '' };

  DP.views.media = {
    title: () => T('Médiathèque', 'Media library'),
    async render(el) {
      const p = S.project;
      const recs = await DP.media.listByProject(p.id);
      const byId = new Map(recs.map((r) => [r.id, r]));
      // la médiathèque reflète tous les fichiers du projet
      const before = p.gallery.length;
      p.gallery = p.gallery.filter((g) => byId.has(g.id));
      const known = new Set(p.gallery.map((g) => g.id));
      recs.filter((r) => !known.has(r.id)).sort((a, b) => b.createdAt - a.createdAt).forEach((r) => p.gallery.push({
        id: r.id, kind: r.kind || (/^audio\//.test(r.type) ? 'audio' : 'image'), caption: (r.name || '').replace(/\.[a-z0-9]+$/i, ''), tags: [], public: false, createdAt: r.createdAt,
      }));
      if (p.gallery.length !== before) S.touch();
      const total = recs.reduce((n, r) => n + (r.size || (r.blob && r.blob.size) || 0), 0);
      const q = st.q.toLowerCase();
      const list = p.gallery.filter((g) => {
        if (st.filter === 'image' && g.kind === 'audio') return false;
        if (st.filter === 'audio' && g.kind !== 'audio') return false;
        if (st.filter === 'public' && !g.public) return false;
        if (st.filter === 'unused' && S.mediaUsed(g.id)) return false;
        return !q || `${g.caption} ${(g.tags || []).join(' ')}`.toLowerCase().includes(q);
      });

      el.innerHTML = `
        <div class="page-head">
          <div class="row gap wrap">
            <div class="search">${UI.icon('search')}<input class="input" id="q" value="${U.esc(st.q)}" placeholder="${T('Légende, tag…', 'Caption, tag…')}"></div>
            <div class="seg" id="flt">${[['all', T('Tout', 'All')], ['image', T('Images', 'Images')], ['audio', T('Sons', 'Audio')], ['public', T('Publics', 'Public')], ['unused', T('Non utilisés', 'Unused')]]
              .map(([k, l]) => `<button data-f="${k}" class="${st.filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          </div>
          <div class="row gap wrap">
            <span class="muted small">${recs.length} ${T('fichiers', 'files')} · ${U.fmtSize(total)}</span>
            <button class="btn ghost" id="clean">${UI.icon('trash')} ${T('Nettoyer', 'Clean up')}</button>
            <button class="btn primary" id="up">${UI.icon('upload')} ${T('Importer', 'Import')}</button>
          </div>
        </div>
        <div class="dropzone" id="drop">${UI.icon('upload')} ${T('Glisse ici tes images et sons (MP3, OGG, WAV…), ou colle une image avec Ctrl+V. Coche « Public » pour les afficher dans la galerie du portail.', 'Drop images and sounds (MP3, OGG, WAV…) here, or paste an image with Ctrl+V. Tick "Public" to show them in the portal gallery.')}</div>
        <div class="gallery" id="gal">${list.length ? list.map((g) => card(g, byId.get(g.id))).join('') : `<p class="muted">${T('Aucun média.', 'No media.')}</p>`}</div>`;

      const add = async (files) => { const ids = await UI.importFiles(files); if (ids.length) { UI.toast(T(`${ids.length} fichier(s) importé(s)`, `${ids.length} file(s) imported`), 'success'); DP.app.refreshNav(); DP.app.route(); } };
      UI.setPaste(add);
      UI.bindDrop(el.querySelector('#drop'), add, { audio: true });
      el.querySelector('#up').onclick = async () => { const files = await U.pickFiles({ accept: 'image/*,audio/*,.mp3,.ogg,.wav,.m4a,.flac', multiple: true }); if (files.length) add(files); };
      el.querySelector('#q').addEventListener('input', U.debounce((e) => { st.q = e.target.value; DP.app.route(); }, 400));
      el.querySelectorAll('#flt [data-f]').forEach((b) => { b.onclick = () => { st.filter = b.dataset.f; DP.app.route(); }; });
      el.querySelector('#clean').onclick = async () => {
        const orphans = recs.filter((r) => !S.mediaUsed(r.id) && !p.gallery.some((g) => g.id === r.id));
        if (!orphans.length) { UI.toast(T('Aucun fichier orphelin à supprimer.', 'No orphan files to delete.'), 'success'); return; }
        if (!(await UI.confirm(T(`Supprimer ${orphans.length} fichier(s) qui ne sont utilisés nulle part ?`, `Delete ${orphans.length} file(s) not used anywhere?`), { danger: true }))) return;
        for (const r of orphans) await DP.media.remove(r.id);
        UI.toast(T('Nettoyage terminé', 'Cleanup done'), 'success'); DP.app.route();
      };

      const gal = el.querySelector('#gal');
      UI.bindTiles(gal);
      gal.querySelectorAll('[data-cap]').forEach((inp) => inp.addEventListener('input', () => { const g = p.gallery.find((x) => x.id === inp.dataset.cap); g.caption = inp.value; S.touch(); }));
      gal.querySelectorAll('[data-tags]').forEach((inp) => inp.addEventListener('input', () => { const g = p.gallery.find((x) => x.id === inp.dataset.tags); g.tags = U.tagsFromString(inp.value); S.touch(); }));
      gal.querySelectorAll('[data-pub]').forEach((b) => { b.onclick = () => { const g = p.gallery.find((x) => x.id === b.dataset.pub); g.public = !g.public; S.touch(); b.outerHTML = UI.publicToggle(g.public, `data-pub="${g.id}"`); DP.app.route(); }; });
      gal.querySelectorAll('[data-dl]').forEach((b) => { b.onclick = () => DP.media.download(b.dataset.dl); });
      gal.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          const id = b.dataset.del;
          const used = S.mediaUsed(id);
          if (!(await UI.confirm(used ? T('Retirer de la médiathèque ? (le fichier reste utilisé ailleurs dans le projet)', 'Remove from the library? (the file stays used elsewhere in the project)') : T('Supprimer définitivement ce fichier ?', 'Delete this file permanently?'), { danger: true }))) return;
          p.gallery = p.gallery.filter((g) => g.id !== id);
          if (!used) await DP.media.remove(id);
          S.touch(); DP.app.refreshNav(); DP.app.route();
        };
      });
    },
  };

  function card(g, rec) {
    const isAudio = g.kind === 'audio';
    return `<div class="media-card">
      ${isAudio ? `<div class="audio-card">${UI.icon('music')}<audio controls preload="none" data-audio="${g.id}"></audio></div>` : UI.tile(g.id, { actions: ['view', 'attach', 'capture'] })}
      <div class="mc-body">
        <input class="input sm" data-cap="${g.id}" value="${U.esc(g.caption || '')}" placeholder="${T('Légende', 'Caption')}">
        <input class="input sm" data-tags="${g.id}" value="${U.esc((g.tags || []).join(', '))}" placeholder="${T('tags', 'tags')}">
        <div class="row gap between">${UI.publicToggle(g.public, `data-pub="${g.id}"`)}
          <span class="row"><small class="faint">${rec ? U.fmtSize(rec.size || rec.blob.size) : ''}</small>
          <button class="btn icon sm ghost" data-dl="${g.id}" title="${T('Télécharger', 'Download')}">${UI.icon('download')}</button>
          <button class="btn icon sm ghost" data-del="${g.id}" title="${T('Supprimer', 'Delete')}">${UI.icon('trash')}</button></span></div>
      </div></div>`;
  }
})();
