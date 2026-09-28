/* Vue : devlog (articles) & notes de version — ce que les joueurs verront sur le portail */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;
  let tab = 'posts';
  let mode = 'edit';

  DP.views.devlog = {
    title: () => T('Devlog & mises à jour', 'Devlog & updates'),
    render(el, params) {
      if (params.id === 'posts' || params.id === 'patches') tab = params.id;
      const d = S.project.devlog;
      el.innerHTML = `
        <div class="tabs big">
          <button data-tab="posts" class="${tab === 'posts' ? 'on' : ''}">${UI.icon('megaphone')} ${T('Articles / actualités', 'Posts / news')} <em>${d.posts.length}</em></button>
          <button data-tab="patches" class="${tab === 'patches' ? 'on' : ''}">${UI.icon('file')} ${T('Notes de version', 'Patch notes')} <em>${d.patches.length}</em></button>
        </div>
        <div id="dlBody"></div>`;
      el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => DP.app.go(`devlog/${b.dataset.tab}`); });
      const body = el.querySelector('#dlBody');
      if (tab === 'posts') renderPosts(body, params.sub); else renderPatches(body, params.sub);
    },
  };

  /** Ce qui a changé dans le projet depuis une date (pour préparer un article) */
  function changesSince(ts) {
    const p = S.project, out = [];
    for (const t of SC.PORTAL_TYPES) {
      const added = p.entities[t].filter((e) => e.createdAt > ts);
      const upd = p.entities[t].filter((e) => e.createdAt <= ts && e.updatedAt > ts);
      if (added.length) out.push(`- **${T('Nouveau', 'New')} — ${L(SC.ENTITIES[t].label)}** : ${added.map((e) => e.fields.name || '?').join(', ')}`);
      if (upd.length) out.push(`- **${T('Mis à jour', 'Updated')} — ${L(SC.ENTITIES[t].label)}** : ${upd.map((e) => e.fields.name || '?').join(', ')}`);
    }
    const tasks = p.tasks.filter((x) => x.status === 'done' && (x.doneAt || 0) > ts);
    if (tasks.length) out.push(`- **${T('Travail terminé', 'Work completed')}** : ${tasks.map((x) => x.title).join(' ; ')}`);
    const caps = p.captures.filter((c) => c.createdAt > ts);
    if (caps.length) out.push(`- **${T('Nouvelles captures', 'New screenshots')}** : ${caps.map((c) => c.title).join(', ')}`);
    return out;
  }

  function renderPosts(el, selId) {
    const p = S.project, list = p.devlog.posts;
    const sorted = list.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.createdAt - a.createdAt);
    const cur = list.find((x) => x.id === selId) || sorted[0];
    el.innerHTML = `
      <div class="split">
        <div class="split-list card">
          <button class="btn primary block" id="newPost">${UI.icon('plus')} ${T('Nouvel article', 'New post')}</button>
          <div class="list">${sorted.length ? sorted.map((x) => `<button class="list-item ${cur && x.id === cur.id ? 'active' : ''}" data-id="${x.id}">
            <span class="li-body"><strong>${U.esc(x.title || T('Sans titre', 'Untitled'))}</strong><small>${U.fmtDay(x.date)} · ${x.public ? `🌐 ${T('publié', 'published')}` : T('brouillon', 'draft')}</small></span></button>`).join('')
            : `<p class="muted pad small">${T('Raconte l\'avancée du jeu à tes joueurs : nouveautés, coulisses, annonces.', 'Tell players how the game is going: news, behind the scenes, announcements.')}</p>`}</div>
        </div>
        <div class="split-detail" id="postDet"></div>
      </div>`;
    el.querySelector('#newPost').onclick = () => {
      const last = sorted[0];
      const since = last ? last.createdAt : (p.createdAt || 0);
      const changes = changesSince(since);
      const x = { id: U.uid('post_'), title: '', date: U.today(), cover: '', tags: [], public: false,
        content: changes.length ? `${T('Voici les nouveautés depuis la dernière mise à jour :', 'Here is what\'s new since the last update:')}\n\n${changes.join('\n')}\n` : '',
        createdAt: Date.now(), updatedAt: Date.now() };
      list.unshift(x); S.touch(); DP.app.refreshNav();
      DP.app.go(`devlog/posts/${x.id}`);
    };
    el.querySelectorAll('.list [data-id]').forEach((b) => { b.onclick = () => DP.app.go(`devlog/posts/${b.dataset.id}`); });
    const det = el.querySelector('#postDet');
    if (!cur) { det.innerHTML = UI.empty('megaphone', T('Aucun article', 'No posts'), T('Un nouvel article est pré-rempli automatiquement avec ce qui a changé dans ton projet.', 'A new post is automatically prefilled with what changed in your project.')); return; }
    const touch = () => { cur.updatedAt = Date.now(); S.touch(); };
    det.innerHTML = `
      <div class="card">
        <div class="row gap">
          <input class="title-input grow" id="pTitle" value="${U.esc(cur.title)}" placeholder="${T('Titre de l\'article', 'Post title')}">
          ${UI.publicToggle(cur.public, 'id="pPub"')}
          <button class="btn icon ghost" id="pDel">${UI.icon('trash')}</button>
        </div>
        <div class="fields">
          <label class="field"><span class="lbl">${T('Date', 'Date')}</span><input class="input" type="date" id="pDate" value="${U.esc(cur.date || '')}"></label>
          <label class="field"><span class="lbl">${T('Tags', 'Tags')}</span><input class="input" id="pTags" value="${U.esc((cur.tags || []).join(', '))}" placeholder="${T('annonce, coulisses, mise à jour…', 'announcement, behind the scenes, update…')}"></label>
          <div class="field"><span class="lbl">${T('Image de couverture', 'Cover image')}</span>
            <div class="row gap">${cur.cover ? `<img data-img="${cur.cover}" style="height:40px;border-radius:6px" alt="">` : ''}<button class="btn sm" id="pCover">${UI.icon('image')} ${cur.cover ? T('Changer', 'Change') : T('Choisir', 'Choose')}</button>${cur.cover ? `<button class="btn sm ghost" id="pCoverX">${UI.icon('x')}</button>` : ''}</div></div>
        </div>
        <div class="tabs">
          <button data-mode="edit" class="${mode === 'edit' ? 'on' : ''}">${UI.icon('edit')} ${T('Écrire', 'Write')}</button>
          <button data-mode="preview" class="${mode === 'preview' ? 'on' : ''}">${UI.icon('eye')} ${T('Aperçu', 'Preview')}</button>
          <button id="insChanges">${UI.icon('refresh')} ${T('Insérer les nouveautés depuis l\'article précédent', 'Insert changes since previous post')}</button>
        </div>
        ${mode === 'edit' ? `<textarea class="input auto doc" id="pContent" rows="14" placeholder="${T('Écris ton article (Markdown)…', 'Write your post (Markdown)…')}">${U.esc(cur.content || '')}</textarea>`
          : `<div class="md preview">${DP.md.render(cur.content) || `<p class="muted">${T('Vide.', 'Empty.')}</p>`}</div>`}
        <p class="muted small">${cur.public ? T('🌐 Publié : visible sur le portail après la prochaine publication.', '🌐 Published: visible on the portal after the next publish.') : T('Brouillon : clique sur « Privé » pour le publier.', 'Draft: click "Private" to publish it.')}</p>
      </div>`;
    DP.media.hydrate(det); UI.autoGrow(det);
    det.querySelector('#pTitle').addEventListener('input', (e) => { cur.title = e.target.value; touch(); });
    det.querySelector('#pDate').addEventListener('change', (e) => { cur.date = e.target.value; touch(); });
    det.querySelector('#pTags').addEventListener('input', (e) => { cur.tags = U.tagsFromString(e.target.value); touch(); });
    const ta = det.querySelector('#pContent'); if (ta) ta.addEventListener('input', () => { cur.content = ta.value; touch(); });
    det.querySelector('#pPub').onclick = () => { cur.public = !cur.public; touch(); DP.app.route(); };
    det.querySelector('#pCover').onclick = async () => { const ids = await UI.pickImages({ title: T('Couverture de l\'article', 'Post cover') }); if (ids && ids[0]) { cur.cover = ids[0]; touch(); DP.app.route(); } };
    const cx = det.querySelector('#pCoverX'); if (cx) cx.onclick = () => { cur.cover = ''; touch(); DP.app.route(); };
    det.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { mode = b.dataset.mode; DP.app.route(); }; });
    det.querySelector('#insChanges').onclick = () => {
      const prev = p.devlog.posts.filter((x) => x.id !== cur.id && x.createdAt < cur.createdAt).sort((a, b) => b.createdAt - a.createdAt)[0];
      const ch = changesSince(prev ? prev.createdAt : 0);
      if (!ch.length) { UI.toast(T('Aucun changement détecté.', 'No changes detected.')); return; }
      cur.content = `${(cur.content || '').trim()}\n\n${ch.join('\n')}`.trim(); touch(); mode = 'edit'; DP.app.route();
    };
    det.querySelector('#pDel').onclick = () => { S.trash('post', cur); p.devlog.posts = list.filter((x) => x.id !== cur.id); S.touch(); DP.app.refreshNav(); DP.app.go('devlog/posts'); };
  }

  function renderPatches(el, selId) {
    const p = S.project, list = p.devlog.patches;
    const sorted = list.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.createdAt - a.createdAt);
    const cur = list.find((x) => x.id === selId) || sorted[0];
    el.innerHTML = `
      <div class="split">
        <div class="split-list card">
          <button class="btn primary block" id="newPatch">${UI.icon('plus')} ${T('Nouvelle version', 'New version')}</button>
          <div class="list">${sorted.length ? sorted.map((x) => `<button class="list-item ${cur && x.id === cur.id ? 'active' : ''}" data-id="${x.id}">
            <span class="num">${U.esc(String(x.version || '?').slice(0, 5))}</span><span class="li-body"><strong>${U.esc(x.title || x.version || '?')}</strong><small>${U.fmtDay(x.date)} · ${x.public ? '🌐' : T('brouillon', 'draft')}</small></span></button>`).join('')
            : `<p class="muted pad small">${T('Liste ce qui a été ajouté, modifié et corrigé à chaque version.', 'List what was added, changed and fixed in each version.')}</p>`}</div>
        </div>
        <div class="split-detail" id="patchDet"></div>
      </div>`;
    el.querySelector('#newPatch').onclick = () => {
      const last = sorted[0];
      const next = last && /^\d+(\.\d+)*$/.test(last.version) ? last.version.replace(/(\d+)$/, (n) => String(+n + 1)) : '0.1.0';
      const x = { id: U.uid('patch_'), version: next, title: '', date: U.today(), added: '', changed: '', fixed: '', removed: '', notes: '', public: false, createdAt: Date.now(), updatedAt: Date.now() };
      list.unshift(x); S.touch(); DP.app.refreshNav();
      DP.app.go(`devlog/patches/${x.id}`);
    };
    el.querySelectorAll('.list [data-id]').forEach((b) => { b.onclick = () => DP.app.go(`devlog/patches/${b.dataset.id}`); });
    const det = el.querySelector('#patchDet');
    if (!cur) { det.innerHTML = UI.empty('file', T('Aucune note de version', 'No patch notes')); return; }
    const touch = () => { cur.updatedAt = Date.now(); S.touch(); };
    const area = (k, lab, cls) => `<label class="field wide"><span class="lbl ${cls}">${lab}</span><textarea class="input auto" data-k="${k}" rows="3" placeholder="${T('Une ligne par élément', 'One line per item')}">${U.esc(cur[k] || '')}</textarea></label>`;
    det.innerHTML = `
      <div class="card">
        <div class="row gap">
          <input class="input" id="vVer" value="${U.esc(cur.version || '')}" style="max-width:130px" placeholder="1.0.0">
          <input class="title-input grow" id="vTitle" value="${U.esc(cur.title || '')}" placeholder="${T('Nom de la mise à jour (optionnel)', 'Update name (optional)')}">
          ${UI.publicToggle(cur.public, 'id="vPub"')}
          <button class="btn icon ghost" id="vDel">${UI.icon('trash')}</button>
        </div>
        <div class="row gap wrap">
          <label class="field" style="max-width:200px"><span class="lbl">${T('Date', 'Date')}</span><input class="input" type="date" id="vDate" value="${U.esc(cur.date || '')}"></label>
          <button class="btn sm" id="vFill">${UI.icon('refresh')} ${T('Pré-remplir avec les tâches terminées', 'Prefill from completed tasks')}</button>
        </div>
        <div class="fields one patch-block">
          ${area('added', `✚ ${T('Ajouté', 'Added')}`, 'added')}
          ${area('changed', `↻ ${T('Modifié', 'Changed')}`, 'changed')}
          ${area('fixed', `✔ ${T('Corrigé', 'Fixed')}`, 'fixed')}
          ${area('removed', `✖ ${T('Retiré', 'Removed')}`, 'removed')}
          <label class="field wide"><span class="lbl">${T('Notes (Markdown)', 'Notes (Markdown)')}</span><textarea class="input auto" data-k="notes" rows="3">${U.esc(cur.notes || '')}</textarea></label>
        </div>
      </div>`;
    UI.autoGrow(det);
    det.querySelector('#vVer').addEventListener('input', (e) => { cur.version = e.target.value; touch(); });
    det.querySelector('#vTitle').addEventListener('input', (e) => { cur.title = e.target.value; touch(); });
    det.querySelector('#vDate').addEventListener('change', (e) => { cur.date = e.target.value; touch(); });
    det.querySelectorAll('[data-k]').forEach((ta) => ta.addEventListener('input', () => { cur[ta.dataset.k] = ta.value; touch(); }));
    det.querySelector('#vPub').onclick = () => { cur.public = !cur.public; touch(); DP.app.route(); };
    det.querySelector('#vDel').onclick = () => { S.trash('patch', cur); p.devlog.patches = list.filter((x) => x.id !== cur.id); S.touch(); DP.app.refreshNav(); DP.app.go('devlog/patches'); };
    det.querySelector('#vFill').onclick = () => {
      const prev = list.filter((x) => x.id !== cur.id && x.createdAt < cur.createdAt).sort((a, b) => b.createdAt - a.createdAt)[0];
      const since = prev ? prev.createdAt : 0;
      const done = p.tasks.filter((t) => t.status === 'done' && (t.doneAt || t.createdAt) > since);
      if (!done.length) { UI.toast(T('Aucune tâche terminée depuis la version précédente.', 'No task completed since the previous version.')); return; }
      const bugs = done.filter((t) => /bug/i.test(t.category || '') || t.title.startsWith('🐞')).map((t) => t.title.replace(/^🐞\s*/, ''));
      const other = done.filter((t) => !bugs.includes(t.title.replace(/^🐞\s*/, ''))).map((t) => t.title);
      if (other.length) cur.added = `${(cur.added || '').trim()}\n${other.join('\n')}`.trim();
      if (bugs.length) cur.fixed = `${(cur.fixed || '').trim()}\n${bugs.join('\n')}`.trim();
      touch(); DP.app.route();
    };
  }
})();
