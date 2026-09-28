/* Vue : histoire — trame, chapitres, chronologie des apparitions */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;
  let tab = 'plot';

  const PLOT_FIELDS = [
    ['logline', ['Logline (l\'histoire en une phrase)', 'Logline (the story in one sentence)'], 1],
    ['synopsis', ['Synopsis', 'Synopsis'], 6],
    ['setting', ['Univers / époque / monde', 'Setting / era / world'], 3],
    ['conflict', ['Conflit central & enjeux', 'Central conflict & stakes'], 3],
    ['themes', ['Thèmes', 'Themes'], 2],
    ['tone', ['Ton (sombre, humoristique, épique…)', 'Tone (dark, humorous, epic…)'], 2],
    ['ending', ['Fin(s) envisagée(s)', 'Planned ending(s)'], 3],
  ];

  const STRUCTURE = [
    ['Acte 1 — Mise en place : monde normal, incident déclencheur, le héros s\'engage.', 'Act 1 — Setup: normal world, inciting incident, the hero commits.'],
    ['Acte 2a — Nouveau monde : épreuves, alliés, ennemis, point médian (révélation).', 'Act 2a — New world: trials, allies, enemies, midpoint (revelation).'],
    ['Acte 2b — Tout s\'effondre : l\'antagoniste prend l\'avantage, perte majeure.', 'Act 2b — Everything falls apart: the antagonist gains the upper hand, major loss.'],
    ['Acte 3 — Climax : le héros change, affrontement final, résolution.', 'Act 3 — Climax: the hero changes, final confrontation, resolution.'],
  ];

  DP.views.story = {
    title: () => T('Histoire', 'Story'),
    render(el, params) {
      const st = S.project.story;
      if (params.id) tab = 'chapters';
      el.innerHTML = `
        <div class="tabs big">
          <button data-tab="plot" class="${tab === 'plot' ? 'on' : ''}">${UI.icon('feather')} ${T('Trame', 'Plot')}</button>
          <button data-tab="chapters" class="${tab === 'chapters' ? 'on' : ''}">${UI.icon('book')} ${T('Chapitres', 'Chapters')} <em>${st.chapters.length}</em></button>
          <button data-tab="timeline" class="${tab === 'timeline' ? 'on' : ''}">${UI.icon('flag')} ${T('Chronologie & apparitions', 'Timeline & appearances')}</button>
        </div>
        <div id="tabBody"></div>`;
      el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; history.replaceState(null, '', '#/story'); DP.views.story.render(el, {}); DP.media.hydrate(el); UI.autoGrow(el); }; });
      const body = el.querySelector('#tabBody');
      if (tab === 'plot') renderPlot(body);
      else if (tab === 'chapters') renderChapters(body, params.id);
      else renderTimeline(body);
    },
  };

  function renderPlot(el) {
    const st = S.project.story;
    el.innerHTML = `
      <div class="ent-layout">
        <div class="ent-main"><div class="card"><div class="fields one">
          ${PLOT_FIELDS.map(([k, lab, rows]) => rows === 1
            ? `<label class="field wide"><span class="lbl">${U.esc(L(lab))}</span><input class="input" data-k="${k}" value="${U.esc(st[k] || '')}"></label>`
            : `<label class="field wide"><span class="lbl">${U.esc(L(lab))}</span><textarea class="input auto" rows="${rows}" data-k="${k}">${U.esc(st[k] || '')}</textarea></label>`).join('')}
        </div></div></div>
        <div class="ent-side">
          <div class="card">
            <h3>${UI.icon('book')} ${T('Structure en 3 actes', '3-act structure')}</h3>
            <div class="stack small">${STRUCTURE.map((s) => `<div class="qcard"><p>${U.esc(L(s))}</p></div>`).join('')}</div>
            <button class="btn block" id="mkActs">${UI.icon('plus')} ${T('Créer 4 chapitres à partir de cette structure', 'Create 4 chapters from this structure')}</button>
          </div>
          <div class="card">
            <h3>${UI.icon('sparkles')} ${T('Questions de scénariste', 'Writer\'s questions')}</h3>
            <div class="stack">${DP.toolboxData.QUESTIONS.filter((q) => q.cat === 'story').map((q) => `<div class="qcard"><p>${U.esc(L(q.t))}</p></div>`).join('')}</div>
          </div>
        </div>
      </div>`;
    el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => { st[inp.dataset.k] = inp.value; S.touch(); }));
    el.querySelector('#mkActs').onclick = () => {
      STRUCTURE.forEach((s) => { const [title, ...rest] = L(s).split(' : ').length > 1 ? L(s).split(' : ') : L(s).split(': '); st.chapters.push(newChapter(title, rest.join(' : '))); });
      S.touch(); DP.app.refreshNav(); tab = 'chapters'; DP.app.go('story');
    };
  }

  function newChapter(title = '', summary = '') {
    return { id: U.uid('ch_'), title, summary, content: '', characters: [], locations: [], notes: '', createdAt: Date.now() };
  }

  function renderChapters(el, selId) {
    const st = S.project.story;
    let cur = (st.chapters.find((c) => c.id === selId) || st.chapters[0] || {}).id;
    el.innerHTML = `
      <div class="split">
        <div class="split-list card">
          <button class="btn primary block" id="addCh">${UI.icon('plus')} ${T('Nouveau chapitre', 'New chapter')}</button>
          <div class="list" id="chList"></div>
        </div>
        <div class="split-detail" id="chDetail"></div>
      </div>`;
    const listEl = el.querySelector('#chList');
    const detEl = el.querySelector('#chDetail');

    const drawList = () => {
      listEl.innerHTML = st.chapters.length ? st.chapters.map((c, i) => `<button class="list-item ${c.id === cur ? 'active' : ''}" data-id="${c.id}">
          <span class="num">${i + 1}</span><span class="li-body"><strong>${U.esc(c.title || T('Sans titre', 'Untitled'))}</strong><small>${U.esc(U.truncate(c.summary, 70))}</small></span></button>`).join('')
        : `<p class="muted pad">${T('Aucun chapitre.', 'No chapters.')}</p>`;
      listEl.querySelectorAll('.list-item').forEach((b) => { b.onclick = () => { cur = b.dataset.id; history.replaceState(null, '', `#/story/${cur}`); drawList(); drawDetail(); }; });
    };
    const redrawList = U.debounce(drawList, 400);

    const drawDetail = () => {
      const c = st.chapters.find((x) => x.id === cur);
      if (!c) { detEl.innerHTML = UI.empty('book', T('Aucun chapitre sélectionné', 'No chapter selected')); return; }
      const i = st.chapters.indexOf(c);
      const firsts = SC.ENTITY_ORDER.flatMap((t) => S.entities(t).filter((e) => e.fields.firstChapter === c.id).map((e) => ({ t, e })));
      const linked = [
        ...S.entities('quests').filter((q) => q.fields.chapter === c.id).map((e) => ({ t: 'quests', e })),
        ...S.entities('dialogues').filter((q) => q.fields.chapter === c.id).map((e) => ({ t: 'dialogues', e })),
        ...S.entities('tracks').filter((q) => q.fields.chapter === c.id).map((e) => ({ t: 'tracks', e })),
      ];
      detEl.innerHTML = `
        <div class="card">
          <div class="row gap">
            <span class="num big">${i + 1}</span>
            <input class="title-input grow" id="cTitle" value="${U.esc(c.title)}" placeholder="${T('Titre du chapitre', 'Chapter title')}">
            <button class="btn icon ghost" id="cUp" ${i === 0 ? 'disabled' : ''}>${UI.icon('up')}</button>
            <button class="btn icon ghost" id="cDown" ${i === st.chapters.length - 1 ? 'disabled' : ''}>${UI.icon('down')}</button>
            <button class="btn icon ghost" id="cDel">${UI.icon('trash')}</button>
          </div>
          <div class="fields one">
            <label class="field wide"><span class="lbl">${T('Résumé', 'Summary')}</span><textarea class="input auto" rows="3" data-k="summary">${U.esc(c.summary)}</textarea></label>
            <label class="field wide"><span class="lbl">${T('Déroulé détaillé / scènes', 'Detailed flow / scenes')}</span><textarea class="input auto doc" rows="8" data-k="content">${U.esc(c.content)}</textarea></label>
            <div class="field wide"><span class="lbl">${T('Personnages présents', 'Characters present')}</span><div class="widget refs" id="cChars"></div></div>
            <div class="field wide"><span class="lbl">${T('Lieux', 'Locations')}</span><div class="widget refs" id="cLocs"></div></div>
            <label class="field wide"><span class="lbl">${T('Notes', 'Notes')}</span><textarea class="input auto" rows="2" data-k="notes">${U.esc(c.notes)}</textarea></label>
          </div>
          ${firsts.length ? `<div class="firsts"><span class="lbl">${T('Premières apparitions dans ce chapitre', 'First appearances in this chapter')}</span><div class="avatars">${firsts.map(({ t, e }) => avatar(t, e)).join('')}</div></div>` : ''}
          ${linked.length ? `<div class="firsts"><span class="lbl">${T('Missions, scènes et musiques du chapitre', 'Missions, scenes and music of the chapter')}</span><div class="tags">${linked.map(({ t, e }) => `<a class="tag" href="#/e/${t}/${e.id}">${U.esc(e.fields.name || '?')}</a>`).join('')}</div></div>` : ''}
        </div>`;
      DP.media.hydrate(detEl);
      UI.autoGrow(detEl);
      detEl.querySelector('#cTitle').addEventListener('input', (e) => { c.title = e.target.value; S.touch(); redrawList(); });
      detEl.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => { c[inp.dataset.k] = inp.value; S.touch(); if (inp.dataset.k === 'summary') redrawList(); }));
      DP.widgets.refs(detEl.querySelector('#cChars'), 'characters', () => c.characters || (c.characters = []), (v) => { c.characters = v; S.touch(); });
      DP.widgets.refs(detEl.querySelector('#cLocs'), 'locations', () => c.locations || (c.locations = []), (v) => { c.locations = v; S.touch(); });
      detEl.querySelector('#cUp').onclick = () => { st.chapters.splice(i, 1); st.chapters.splice(i - 1, 0, c); S.touch(); drawList(); drawDetail(); };
      detEl.querySelector('#cDown').onclick = () => { st.chapters.splice(i, 1); st.chapters.splice(i + 1, 0, c); S.touch(); drawList(); drawDetail(); };
      detEl.querySelector('#cDel').onclick = () => {
        S.trash('chapter', c);
        st.chapters.splice(i, 1); S.touch(); DP.app.refreshNav();
        UI.toast(T('Chapitre déplacé dans la corbeille', 'Chapter moved to trash'), 'success');
        cur = (st.chapters[Math.max(0, i - 1)] || {}).id; drawList(); drawDetail();
      };
    };

    el.querySelector('#addCh').onclick = () => {
      const c = newChapter(T(`Chapitre ${st.chapters.length + 1}`, `Chapter ${st.chapters.length + 1}`));
      st.chapters.push(c); S.touch(); DP.app.refreshNav(); cur = c.id; drawList(); drawDetail();
    };
    drawList();
    drawDetail();
  }

  function avatar(t, e) {
    const img = e.cover || e.images[0];
    return `<a class="avatar" href="#/e/${t}/${e.id}" title="${U.esc(e.fields.name || '?')}">
      <span class="av-img ${img ? '' : 'noimg'}" ${img ? `data-bg-img="${img}"` : ''}>${img ? '' : U.esc((e.fields.name || '?')[0].toUpperCase())}</span>
      <small>${U.esc(U.truncate(e.fields.name || '?', 16))}</small></a>`;
  }

  function renderTimeline(el) {
    const st = S.project.story;
    const unplaced = SC.ENTITY_ORDER.flatMap((t) => S.entities(t).filter((e) => SC.field(t, 'firstChapter') && !e.fields.firstChapter).map((e) => ({ t, e })));
    el.innerHTML = `
      <p class="muted">${T('Chaque personnage, véhicule ou lieu apparaît ici au chapitre indiqué dans sa fiche (champ « Arrive au chapitre »).', 'Each character, vehicle or location appears here at the chapter set in its sheet ("First appears in chapter" field).')}</p>
      ${st.chapters.length ? `<div class="timeline">${st.chapters.map((c, i) => {
        const firsts = SC.ENTITY_ORDER.flatMap((t) => S.entities(t).filter((e) => e.fields.firstChapter === c.id).map((e) => ({ t, e })));
        const present = (c.characters || []).map((id) => S.entity('characters', id)).filter(Boolean);
        const quests = S.entities('quests').filter((q) => q.fields.chapter === c.id);
        return `<div class="tl-item"><div class="tl-dot">${i + 1}</div>
          <div class="card">
            <h3><a href="#/story/${c.id}">${U.esc(c.title || T('Sans titre', 'Untitled'))}</a></h3>
            ${c.summary ? `<p>${U.esc(c.summary)}</p>` : ''}
            ${firsts.length ? `<div class="lbl">${T('Arrivées', 'Arrivals')}</div><div class="avatars">${firsts.map(({ t, e }) => avatar(t, e)).join('')}</div>` : ''}
            ${present.length ? `<div class="lbl">${T('Présents', 'Present')}</div><div class="tags">${present.map((e) => `<a class="tag" href="#/e/characters/${e.id}">${U.esc(e.fields.name || '?')}</a>`).join('')}</div>` : ''}
            ${quests.length ? `<div class="lbl">${T('Missions', 'Missions')}</div><div class="tags">${quests.map((q) => `<a class="tag" href="#/e/quests/${q.id}">${U.esc(q.fields.name || '?')}</a>`).join('')}</div>` : ''}
          </div></div>`;
      }).join('')}</div>` : UI.empty('flag', T('Pas encore de chapitres', 'No chapters yet'), T('Crée des chapitres pour voir la chronologie.', 'Create chapters to see the timeline.'))}
      ${unplaced.length ? `<div class="card"><h3>${T('Pas encore placés dans l\'histoire', 'Not yet placed in the story')}</h3><div class="avatars">${unplaced.map(({ t, e }) => avatar(t, e)).join('')}</div></div>` : ''}`;
  }
})();
