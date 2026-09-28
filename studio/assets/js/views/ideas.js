/* Vue : journal d'idées — notes, évaluation, cartes de réflexion */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;
  const state = { q: '', cat: '', status: '', sort: 'recent' };

  const statusDef = (s) => SC.IDEA_STATUS.find((x) => x[0] === s) || SC.IDEA_STATUS[0];
  const catLabel = (c) => { const x = SC.IDEA_CATS.find((y) => y[0] === c); return x ? L(x[1]) : c; };
  const score = (i) => {
    const v = SC.IDEA_SCORES.map(([k]) => (i.scores || {})[k] || 0).filter(Boolean);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const QCAT = { gameplay: 'gameplay', story: 'story', character: 'character', vehicle: 'vehicle', level: 'level', art: 'art', audio: 'audio', ui: 'ui', tech: 'tech', business: 'business', other: 'other' };

  DP.views.ideas = {
    title: () => T('Idées', 'Ideas'),
    render(el, params) {
      const p = S.project;
      el.innerHTML = `
        <div class="split">
          <div class="split-list card">
            <button class="btn primary block" id="newIdea">${UI.icon('plus')} ${T('Nouvelle idée', 'New idea')}</button>
            <div class="search">${UI.icon('search')}<input class="input" id="q" value="${U.esc(state.q)}" placeholder="${T('Rechercher…', 'Search…')}"></div>
            <div class="row gap">
              <select class="input" id="fCat">${UI.options(SC.IDEA_CATS, state.cat, { empty: T('Catégories', 'Categories') })}</select>
              <select class="input" id="fStatus">${UI.options(SC.IDEA_STATUS.map((s) => [s[0], s[1]]), state.status, { empty: T('Statuts', 'Statuses') })}</select>
            </div>
            <div class="seg" id="fSort"><button data-v="recent" class="${state.sort === 'recent' ? 'on' : ''}">${T('Récentes', 'Recent')}</button><button data-v="score" class="${state.sort === 'score' ? 'on' : ''}">${T('Mieux notées', 'Top rated')}</button></div>
            <div class="list" id="ideaList"></div>
          </div>
          <div class="split-detail" id="ideaDetail"></div>
        </div>`;

      const listEl = el.querySelector('#ideaList');
      const detailEl = el.querySelector('#ideaDetail');
      let currentId = params.id;

      const renderList = () => {
        const q = state.q.toLowerCase();
        const items = p.ideas
          .filter((i) => (!state.cat || i.category === state.cat) && (!state.status || i.status === state.status))
          .filter((i) => !q || `${i.title} ${i.content} ${(i.tags || []).join(' ')}`.toLowerCase().includes(q))
          .sort((a, b) => (b.pinned - a.pinned) || (state.sort === 'score' ? score(b) - score(a) : 0) || (b.updatedAt - a.updatedAt));
        listEl.innerHTML = items.length ? items.map((i) => `
          <button class="list-item ${i.id === currentId ? 'active' : ''}" data-id="${i.id}">
            <span class="dot" style="background:${statusDef(i.status)[2]}"></span>
            <span class="li-body">
              <strong>${i.pinned ? '★ ' : ''}${U.esc(i.title || U.truncate(i.content, 60) || T('(vide)', '(empty)'))}</strong>
              <small>${U.esc(catLabel(i.category))} · ${U.relTime(i.updatedAt)}${score(i) ? ` · ${score(i).toFixed(1)}★` : ''}</small>
            </span>
          </button>`).join('')
          : `<p class="muted pad">${p.ideas.length ? T('Aucun résultat.', 'No results.') : T('Aucune idée encore. Clique sur « Nouvelle idée » ou appuie sur Alt+N.', 'No ideas yet. Click "New idea" or press Alt+N.')}</p>`;
        listEl.querySelectorAll('.list-item').forEach((b) => { b.onclick = () => select(b.dataset.id); });
      };
      const refreshList = U.debounce(renderList, 400);

      const select = (id) => {
        currentId = id;
        history.replaceState(null, '', `#/ideas/${id}`);
        listEl.querySelectorAll('.list-item').forEach((b) => b.classList.toggle('active', b.dataset.id === id));
        renderDetail();
      };

      const questionsFor = (idea) => {
        const cat = QCAT[idea.category] || 'other';
        const pool = DP.toolboxData.QUESTIONS.filter((x) => x.cat === cat || (cat === 'vehicle' && x.cat === 'gameplay'));
        return U.shuffle(pool.length >= 3 ? pool : DP.toolboxData.QUESTIONS).slice(0, 3);
      };

      const renderDetail = () => {
        const idea = p.ideas.find((i) => i.id === currentId);
        if (!idea) {
          detailEl.innerHTML = UI.empty('bulb', T('Choisis ou crée une idée', 'Pick or create an idea'),
            T('Note tout : mécaniques, personnages, véhicules, lieux, musiques… Évalue-les, ajoute des notes au fil du temps, puis transforme les meilleures en fiches, sections du GDD ou tâches.',
              'Write everything down: mechanics, characters, vehicles, places, music… Rate them, add notes over time, then turn the best into sheets, GDD sections or tasks.'),
            `<button class="btn primary" id="emptyNew">${UI.icon('plus')} ${T('Nouvelle idée', 'New idea')}</button>`);
          const b = detailEl.querySelector('#emptyNew'); if (b) b.onclick = () => DP.app.quickIdea();
          return;
        }
        const qs = questionsFor(idea);
        detailEl.innerHTML = `
          <div class="card drop-target" id="iCard">
            <div class="row gap">
              <input class="title-input grow" id="iTitle" value="${U.esc(idea.title)}" placeholder="${T('Titre de l\'idée', 'Idea title')}">
              <button class="btn icon ghost ${idea.pinned ? 'on' : ''}" id="iPin" title="${T('Épingler', 'Pin')}">${UI.icon('star')}</button>
              <button class="btn icon ghost" id="iDel" title="${T('Supprimer (corbeille)', 'Delete (trash)')}">${UI.icon('trash')}</button>
            </div>
            <div class="row gap wrap">
              <select class="input" id="iCat" style="max-width:200px">${UI.options(SC.IDEA_CATS, idea.category)}</select>
              <select class="input" id="iStatus" style="max-width:180px">${UI.options(SC.IDEA_STATUS.map((s) => [s[0], s[1]]), idea.status)}</select>
              <input class="input grow" id="iTags" value="${U.esc((idea.tags || []).join(', '))}" placeholder="${T('tags, séparés, par des virgules', 'tags, comma, separated')}">
            </div>
            <textarea class="input auto big" id="iContent" rows="6" placeholder="${T('Décris ton idée…', 'Describe your idea…')}">${U.esc(idea.content)}</textarea>
            <div class="thumbs" id="iImgs">${idea.images.map((id) => UI.tile(id, { actions: ['view', 'download', 'attach', 'remove'] })).join('')}</div>
            <div class="row gap wrap small">
              <span class="muted">${T('Créée', 'Created')} ${U.fmtDate(idea.createdAt)}</span><span class="grow"></span>
              <button class="btn sm ghost" id="iAddImg">${UI.icon('image')} ${T('Image', 'Image')}</button>
              <button class="btn sm ghost" id="iToGdd">${UI.icon('book')} ${T('→ GDD', '→ GDD')}</button>
              <button class="btn sm ghost" id="iToTask">${UI.icon('check')} ${T('→ Tâche', '→ Task')}</button>
              <button class="btn sm ghost" id="iToSheet">${UI.icon('users')} ${T('→ Fiche', '→ Sheet')}</button>
            </div>
          </div>

          <div class="grid2">
            <div class="card">
              <h3>${UI.icon('star')} ${T('Évaluation', 'Evaluation')} ${score(idea) ? `<span class="tag">${score(idea).toFixed(1)} / 5</span>` : ''}</h3>
              <div class="stack">${SC.IDEA_SCORES.map(([k, lab]) => `<div class="row between"><span>${U.esc(L(lab))}</span>${UI.stars((idea.scores || {})[k] || 0, `data-score="${k}"`)}</div>`).join('')}</div>
              <p class="muted small">${T('Note tes idées pour repérer les plus prometteuses (tri « Mieux notées »).', 'Rate your ideas to spot the most promising (sort "Top rated").')}</p>
            </div>
            <div class="card">
              <div class="card-head"><h3>${UI.icon('sparkles')} ${T('Pour creuser l\'idée', 'To dig deeper')}</h3><button class="btn icon sm ghost" id="qRefresh">${UI.icon('refresh')}</button></div>
              <div class="stack" id="qList">${qs.map((x) => `<div class="qcard"><p>${U.esc(L(x.t))}</p><button class="btn icon sm ghost" data-answer="${U.esc(L(x.t))}" title="${T('Répondre dans une note', 'Answer in a note')}">${UI.icon('edit')}</button></div>`).join('')}</div>
            </div>
          </div>

          <div class="card">
            <h3>${UI.icon('chat')} ${T('Notes & évolution de l\'idée', 'Notes & evolution')} <span class="muted small">${idea.notes.length}</span></h3>
            <div class="notes" id="notes">${idea.notes.map((n) => `<div class="note" data-n="${n.id}"><div class="note-head"><span>${U.fmtDate(n.ts)}</span><button class="btn icon sm ghost" data-del-note="${n.id}">${UI.icon('x')}</button></div><div class="md">${DP.md.render(n.text)}</div></div>`).join('')}</div>
            <div class="composer">
              <textarea class="input auto grow" id="noteText" rows="2" placeholder="${T('Ajoute une note, une variante, un retour… (Ctrl+Entrée)', 'Add a note, a variant, feedback… (Ctrl+Enter)')}"></textarea>
              <button class="btn primary" id="noteAdd">${UI.icon('plus')}</button>
            </div>
          </div>`;

        DP.media.hydrate(detailEl);
        UI.autoGrow(detailEl);
        const touch = () => { idea.updatedAt = Date.now(); S.touch(); };
        detailEl.querySelector('#iTitle').addEventListener('input', (e) => { idea.title = e.target.value; touch(); refreshList(); });
        detailEl.querySelector('#iContent').addEventListener('input', (e) => { idea.content = e.target.value; touch(); refreshList(); });
        detailEl.querySelector('#iCat').onchange = (e) => { idea.category = e.target.value; touch(); renderList(); };
        detailEl.querySelector('#iStatus').onchange = (e) => { idea.status = e.target.value; touch(); renderList(); };
        detailEl.querySelector('#iTags').addEventListener('input', (e) => { idea.tags = U.tagsFromString(e.target.value); touch(); });
        detailEl.querySelector('#iPin').onclick = () => { idea.pinned = !idea.pinned; touch(); renderList(); renderDetail(); };
        detailEl.querySelector('#iDel').onclick = () => {
          S.trash('idea', idea);
          p.ideas.splice(p.ideas.indexOf(idea), 1);
          S.touch(); DP.app.refreshNav();
          UI.toast(T('Idée déplacée dans la corbeille', 'Idea moved to trash'), 'success');
          currentId = null; history.replaceState(null, '', '#/ideas');
          renderList(); renderDetail();
        };
        detailEl.querySelectorAll('[data-score] [data-star]').forEach((b) => {
          b.onclick = () => {
            const k = b.closest('[data-score]').dataset.score;
            const v = +b.dataset.star;
            idea.scores[k] = idea.scores[k] === v ? 0 : v;
            touch(); renderList(); renderDetail();
          };
        });
        detailEl.querySelector('#qRefresh').onclick = renderDetail;
        detailEl.querySelectorAll('[data-answer]').forEach((b) => {
          b.onclick = () => { const t = detailEl.querySelector('#noteText'); t.value = `**${b.dataset.answer}**\n`; t.focus(); UI.autoGrow(detailEl); };
        });
        const addNote = () => {
          const t = detailEl.querySelector('#noteText').value.trim();
          if (!t) return;
          idea.notes.push({ id: U.uid('n_'), text: t, ts: Date.now() });
          touch(); renderDetail();
        };
        detailEl.querySelector('#noteAdd').onclick = addNote;
        detailEl.querySelector('#noteText').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote(); } });
        detailEl.querySelectorAll('[data-del-note]').forEach((b) => { b.onclick = () => { idea.notes = idea.notes.filter((n) => n.id !== b.dataset.delNote); touch(); renderDetail(); }; });

        const imgsEl = detailEl.querySelector('#iImgs');
        UI.bindTiles(imgsEl, { remove: (id) => { idea.images = idea.images.filter((x) => x !== id); touch(); renderDetail(); } });
        const addImgs = async (files) => { const ids = await UI.importFiles(files); idea.images.push(...ids); touch(); renderDetail(); };
        UI.setPaste(addImgs);
        UI.bindDrop(detailEl.querySelector('#iCard'), addImgs);
        detailEl.querySelector('#iAddImg').onclick = async () => {
          const ids = await UI.pickImages({ multiple: true });
          if (ids && ids.length) { idea.images.push(...ids.filter((i) => !idea.images.includes(i))); touch(); renderDetail(); }
        };
        detailEl.querySelector('#iToGdd').onclick = () => toGdd(`## ${idea.title || T('Idée', 'Idea')}\n\n${idea.content}`);
        detailEl.querySelector('#iToTask').onclick = () => {
          p.tasks.unshift({ id: U.uid('task_'), title: idea.title || U.truncate(idea.content, 80), desc: idea.content, status: 'todo', priority: 'med', category: catLabel(idea.category), milestone: '', createdAt: Date.now() });
          S.touch(); DP.app.refreshNav();
          UI.toast(T('Tâche créée dans « À faire »', 'Task created in "To do"'), 'success');
        };
        detailEl.querySelector('#iToSheet').onclick = () => toSheet(idea);
      };

      function toGdd(content) {
        const secs = p.gdd.sections;
        UI.modal({
          title: T('Ajouter au Game Design Doc', 'Add to Game Design Doc'),
          body: `<label class="lbl">${T('Section', 'Section')}</label>
            <select class="input" id="gSec">${secs.map((s) => `<option value="${s.id}">${U.esc(s.key ? L(SC.gddDef(s.key).title) : s.title)}</option>`).join('')}</select>`,
          buttons: [
            { label: T('Annuler', 'Cancel'), cls: 'ghost' },
            { label: T('Ajouter', 'Add'), cls: 'primary', action: (c, root) => {
              const s = secs.find((x) => x.id === root.querySelector('#gSec').value);
              s.content = `${s.content.trim()}\n\n${content}`.trim();
              S.touch();
              UI.toast(T('Ajouté au GDD', 'Added to GDD'), 'success');
            } },
          ],
        });
      }

      function toSheet(idea) {
        const guess = { vehicle: 'vehicles', character: 'characters', level: 'locations', audio: 'tracks' }[idea.category] || 'characters';
        UI.modal({
          title: T('Créer une fiche à partir de l\'idée', 'Create a sheet from the idea'),
          body: `<label class="lbl">${T('Type de fiche', 'Sheet type')}</label>
            <select class="input" id="sType">${SC.ENTITY_ORDER.map((t) => `<option value="${t}" ${t === guess ? 'selected' : ''}>${U.esc(L(SC.ENTITIES[t].singular))}</option>`).join('')}</select>`,
          buttons: [
            { label: T('Annuler', 'Cancel'), cls: 'ghost' },
            { label: T('Créer', 'Create'), cls: 'primary', action: (c, root) => {
              const t = root.querySelector('#sType').value;
              const descKey = ['description', 'summary', 'bio', 'usage', 'context', 'content'].find((k) => SC.field(t, k)) || 'notes';
              const e = S.newEntity(t, { name: idea.title || T('Nouvelle fiche', 'New sheet'), [descKey]: idea.content });
              e.images = idea.images.filter((i) => i.startsWith('img_')); e.cover = e.images[0] || '';
              idea.status = 'done'; S.touch();
              DP.app.go(`e/${t}/${e.id}`);
            } },
          ],
        });
      }

      el.querySelector('#newIdea').onclick = () => {
        const idea = DP.app.createIdea({ category: state.cat || 'gameplay' });
        renderList(); select(idea.id);
        const t = detailEl.querySelector('#iContent'); if (t) t.focus();
      };
      el.querySelector('#q').addEventListener('input', (e) => { state.q = e.target.value; renderList(); });
      el.querySelector('#fCat').onchange = (e) => { state.cat = e.target.value; renderList(); };
      el.querySelector('#fStatus').onchange = (e) => { state.status = e.target.value; renderList(); };
      el.querySelectorAll('#fSort [data-v]').forEach((b) => { b.onclick = () => { state.sort = b.dataset.v; el.querySelectorAll('#fSort button').forEach((x) => x.classList.toggle('on', x === b)); renderList(); }; });

      if (!currentId && p.ideas.length && window.innerWidth > 900) currentId = p.ideas.slice().sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt))[0].id;
      renderList();
      renderDetail();
    },
  };
})();
