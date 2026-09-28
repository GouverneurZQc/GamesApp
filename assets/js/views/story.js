/* Vue : histoire — trame, chapitres, chronologie des apparitions */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;
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

  const PLOT_AI = [
    ['structure', 'book', ['Structure en actes', 'Act structure'],
      'Propose une structure en 3 actes pour mon histoire (incident déclencheur, pivots, point médian, climax, résolution), en plaçant les personnages et les lieux existants. Présente-la sous forme de tableau puis commente.',
      'Propose a 3-act structure for my story (inciting incident, turning points, midpoint, climax, resolution), placing existing characters and locations. Present it as a table then comment.'],
    ['twists', 'dice', ['Rebondissements', 'Plot twists'],
      'Propose 7 rebondissements surprenants mais cohérents pour mon histoire, du plus subtil au plus spectaculaire, avec le moment idéal pour chacun.',
      'Propose 7 surprising yet consistent plot twists, from subtle to spectacular, with the ideal moment for each.'],
    ['holes', 'target', ['Trous scénaristiques', 'Plot holes'],
      'Analyse mon histoire sans complaisance : trous scénaristiques, motivations faibles, personnages sous-exploités, incohérences avec les fiches. Propose une correction pour chaque problème.',
      'Analyze my story without complacency: plot holes, weak motivations, underused characters, inconsistencies with the sheets. Propose a fix for each problem.'],
    ['synopsis', 'feather', ['Réécrire le synopsis', 'Rewrite the synopsis'],
      'Réécris un synopsis captivant de 250 à 400 mots à partir de tout le projet. Réponds uniquement avec le synopsis.',
      'Rewrite a captivating 250-400 word synopsis from the whole project. Answer only with the synopsis.'],
    ['cast', 'users', ['Personnages manquants', 'Missing characters'],
      'Quels personnages manquent à mon histoire ? Propose-en 4 avec leur rôle, leur motivation, leur lien avec les autres et le moment où ils arrivent.',
      'Which characters are missing from my story? Propose 4 with their role, motivation, ties to others and when they appear.'],
    ['gameplay', 'target', ['Lier au gameplay', 'Tie into gameplay'],
      'Comment mieux lier mon histoire au gameplay (narration par le jeu, missions, choix du joueur, progression, environnement) ? Donne des exemples concrets.',
      'How can I better tie my story to gameplay (ludonarrative, missions, player choices, progression, environment)? Give concrete examples.'],
  ];

  const CH_AI = [
    ['develop', 'feather', ['Développer le chapitre', 'Develop the chapter'],
      'Développe ce chapitre en détail : déroulé scène par scène, objectifs de jeu, moments forts, rythme, et comment il fait avancer les personnages.',
      'Develop this chapter in detail: scene by scene, gameplay objectives, key moments, pacing, and how it moves the characters forward.'],
    ['scenes', 'flag', ['Idées de missions / scènes', 'Mission / scene ideas'],
      'Propose 6 idées de missions ou de scènes jouables pour ce chapitre, variées en gameplay, cohérentes avec l\'histoire.',
      'Propose 6 playable mission or scene ideas for this chapter, varied in gameplay, consistent with the story.'],
    ['dialogue', 'chat', ['Dialogues clés', 'Key dialogue'],
      'Écris les 3 dialogues les plus importants de ce chapitre (courts, percutants, fidèles aux personnages), sous forme de script.',
      'Write the 3 most important dialogues of this chapter (short, punchy, true to the characters), as a script.'],
    ['critic', 'camera', ['Critique du chapitre', 'Chapter critique'],
      'Critique franchement ce chapitre : rythme, intérêt, clichés, utilité dans l\'histoire. Note /10 et 3 améliorations prioritaires.',
      'Frankly critique this chapter: pacing, interest, clichés, usefulness in the story. Score /10 and 3 priority improvements.'],
  ];

  GF.views.story = {
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
      el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; GF.views.story.render(el, {}); GF.images.hydrate(el); UI.autoGrow(el); }; });
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
        <div class="ent-main">
          <div class="card"><div class="fields one">
            ${PLOT_FIELDS.map(([k, lab, rows]) => rows === 1
              ? `<label class="field wide"><span class="lbl">${U.esc(L(lab))}</span><input class="input" data-k="${k}" value="${U.esc(st[k] || '')}"></label>`
              : `<label class="field wide"><span class="lbl">${U.esc(L(lab))}</span><textarea class="input auto" rows="${rows}" data-k="${k}">${U.esc(st[k] || '')}</textarea></label>`).join('')}
          </div></div>
        </div>
        <div class="ent-side">
          <div class="card">
            <h3>${UI.icon('sparkles')} ${T('Scénariste IA', 'AI writer')}</h3>
            <div class="chips">${PLOT_AI.map(([k, ic, lab]) => `<button class="chip" data-ai="${k}">${UI.icon(ic)} ${U.esc(L(lab))}</button>`).join('')}</div>
            <button class="btn block" id="genCh">${UI.icon('book')} ${T('Générer un découpage en chapitres', 'Generate a chapter outline')}</button>
          </div>
          <div id="plotOut"></div>
        </div>
      </div>`;
    el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => { st[inp.dataset.k] = inp.value; S.touch(); }));
    el.querySelectorAll('[data-ai]').forEach((b) => {
      b.onclick = () => {
        const a = PLOT_AI.find((x) => x[0] === b.dataset.ai);
        const actions = a[0] === 'synopsis' ? [{ label: T('Remplacer le synopsis', 'Replace synopsis'), icon: 'refresh', onClick: (t) => { st.synopsis = t.trim(); S.touch(); GF.app.route(); } }] : [];
        GF.agent.run({ into: el.querySelector('#plotOut'), position: 'prepend', title: L(a[2]), prompt: GF.lang === 'en' ? a[4] : a[3], persona: a[0] === 'holes' ? 'critic' : 'writer', focus: 'story', actions, ideaCategory: 'story' });
      };
    });
    el.querySelector('#genCh').onclick = () => generateChapters(el.querySelector('#plotOut'));
  }

  async function generateChapters(out) {
    const st = S.project.story;
    out.insertAdjacentHTML('afterbegin', `<div class="card" id="chGen">${UI.spinner(T('L\'agent découpe l\'histoire en chapitres…', 'The agent is outlining chapters…'))}</div>`);
    const box = out.querySelector('#chGen');
    try {
      const data = await GF.agent.json({
        prompt: GF.lang === 'en'
          ? `Propose a chapter outline (6 to 12 chapters) for my game's story, consistent with the project${st.chapters.length ? ' and complementary to the existing chapters' : ''}. JSON array of objects: {"title": string, "summary": string (2-4 sentences)}.`
          : `Propose un découpage en chapitres (6 à 12) pour l'histoire de mon jeu, cohérent avec le projet${st.chapters.length ? ' et complémentaire aux chapitres existants' : ''}. Tableau JSON d'objets : {"title": texte, "summary": texte (2 à 4 phrases)}.`,
        persona: 'writer', focus: 'story', maxTokens: 16000,
      });
      const arr = (Array.isArray(data) ? data : Object.values(data).find(Array.isArray) || []).filter((c) => c && c.title);
      if (!arr.length) throw new Error(T('Aucun chapitre proposé.', 'No chapters proposed.'));
      box.innerHTML = `<h3>${T('Chapitres proposés', 'Proposed chapters')}</h3>
        <div class="proposals">${arr.map((c, i) => `<label class="proposal"><input type="checkbox" data-i="${i}" checked><div><strong>${i + 1}. ${U.esc(c.title)}</strong><p class="small">${U.esc(c.summary || '')}</p></div></label>`).join('')}</div>
        <div class="row gap"><button class="btn primary" id="chKeep">${UI.icon('check')} ${T('Ajouter les chapitres cochés', 'Add checked chapters')}</button><button class="btn ghost" id="chNo">${T('Ignorer', 'Discard')}</button></div>`;
      box.querySelector('#chNo').onclick = () => box.remove();
      box.querySelector('#chKeep').onclick = () => {
        box.querySelectorAll('input[data-i]').forEach((cb) => {
          if (!cb.checked) return;
          const c = arr[+cb.dataset.i];
          st.chapters.push(newChapter(String(c.title), String(c.summary || '')));
        });
        S.touch(); GF.app.refreshNav(); tab = 'chapters'; GF.app.go('story');
      };
    } catch (e) {
      box.innerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(e.message)}</div></div>`;
    }
  }

  function newChapter(title = '', summary = '') {
    return { id: U.uid('ch_'), title, summary, content: '', characters: [], locations: [], notes: '' };
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
        : `<p class="muted pad">${T('Aucun chapitre. Crée-en un ou génère un découpage depuis l\'onglet Trame.', 'No chapters. Create one or generate an outline from the Plot tab.')}</p>`;
      listEl.querySelectorAll('.list-item').forEach((b) => { b.onclick = () => { cur = b.dataset.id; history.replaceState(null, '', `#/story/${cur}`); drawList(); drawDetail(); }; });
    };

    const drawDetail = () => {
      const c = st.chapters.find((x) => x.id === cur);
      if (!c) { detEl.innerHTML = UI.empty('book', T('Aucun chapitre sélectionné', 'No chapter selected')); return; }
      const i = st.chapters.indexOf(c);
      const firsts = SC.ENTITY_ORDER.flatMap((t) => S.entities(t).filter((e) => e.fields.firstChapter === c.id).map((e) => ({ t, e })));
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
          ${firsts.length ? `<div class="firsts"><span class="lbl">${T('Premières apparitions dans ce chapitre', 'First appearances in this chapter')}</span>
            <div class="avatars">${firsts.map(({ t, e }) => avatar(t, e)).join('')}</div></div>` : ''}
        </div>
        <div class="card">
          <h3>${UI.icon('sparkles')} ${T('Agent', 'Agent')}</h3>
          <div class="chips">${CH_AI.map(([k, ic, lab]) => `<button class="chip" data-ai="${k}">${UI.icon(ic)} ${U.esc(L(lab))}</button>`).join('')}</div>
        </div>
        <div id="chOut"></div>`;
      GF.images.hydrate(detEl);
      UI.autoGrow(detEl);
      detEl.querySelector('#cTitle').addEventListener('input', (e) => { c.title = e.target.value; S.touch(); redrawList(); });
      detEl.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => { c[inp.dataset.k] = inp.value; S.touch(); if (inp.dataset.k === 'summary') redrawList(); }));
      GF.widgets.refs(detEl.querySelector('#cChars'), 'characters', () => c.characters || (c.characters = []), (v) => { c.characters = v; S.touch(); });
      GF.widgets.refs(detEl.querySelector('#cLocs'), 'locations', () => c.locations || (c.locations = []), (v) => { c.locations = v; S.touch(); });
      detEl.querySelector('#cUp').onclick = () => { st.chapters.splice(i, 1); st.chapters.splice(i - 1, 0, c); S.touch(); drawList(); drawDetail(); };
      detEl.querySelector('#cDown').onclick = () => { st.chapters.splice(i, 1); st.chapters.splice(i + 1, 0, c); S.touch(); drawList(); drawDetail(); };
      detEl.querySelector('#cDel').onclick = async () => {
        if (!(await UI.confirm(T('Supprimer ce chapitre ?', 'Delete this chapter?'), { danger: true }))) return;
        st.chapters.splice(i, 1); S.touch(); GF.app.refreshNav();
        cur = (st.chapters[Math.max(0, i - 1)] || {}).id; drawList(); drawDetail();
      };
      detEl.querySelectorAll('[data-ai]').forEach((b) => {
        b.onclick = () => {
          const a = CH_AI.find((x) => x[0] === b.dataset.ai);
          const extra = GF.lang === 'en'
            ? `<current_chapter number="${i + 1}">\nTitle: ${c.title}\nSummary: ${c.summary}\nDetails: ${c.content}\nCharacters: ${(c.characters || []).map((id) => S.entityName('characters', id)).join(', ')}\n</current_chapter>`
            : `<chapitre_en_cours numero="${i + 1}">\nTitre : ${c.title}\nRésumé : ${c.summary}\nDétails : ${c.content}\nPersonnages : ${(c.characters || []).map((id) => S.entityName('characters', id)).join(', ')}\n</chapitre_en_cours>`;
          const actions = a[0] === 'develop' ? [{ label: T('Mettre dans « Déroulé détaillé »', 'Put in "Detailed flow"'), icon: 'plus', onClick: (t) => { c.content = `${c.content.trim()}\n\n${t}`.trim(); S.touch(); drawDetail(); } }] : [];
          GF.agent.run({ into: detEl.querySelector('#chOut'), position: 'prepend', title: `${L(a[2])} — ${c.title || i + 1}`, prompt: GF.lang === 'en' ? a[4] : a[3], persona: a[0] === 'critic' ? 'critic' : 'writer', extra, focus: 'story', actions, ideaCategory: 'story' });
        };
      });
    };
    const redrawList = U.debounce(drawList, 400);

    el.querySelector('#addCh').onclick = () => {
      const c = newChapter(T(`Chapitre ${st.chapters.length + 1}`, `Chapter ${st.chapters.length + 1}`));
      st.chapters.push(c); S.touch(); GF.app.refreshNav(); cur = c.id; drawList(); drawDetail();
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
        return `<div class="tl-item">
          <div class="tl-dot">${i + 1}</div>
          <div class="card tl-card">
            <div class="card-head"><h3><a href="#/story/${c.id}" class="tl-link" data-ch="${c.id}">${U.esc(c.title || T('Sans titre', 'Untitled'))}</a></h3></div>
            ${c.summary ? `<p>${U.esc(c.summary)}</p>` : ''}
            ${firsts.length ? `<div class="lbl">${UI.icon('star')} ${T('Arrivées', 'Arrivals')}</div><div class="avatars">${firsts.map(({ t, e }) => avatar(t, e)).join('')}</div>` : ''}
            ${present.length ? `<div class="lbl">${T('Présents', 'Present')}</div><div class="tags">${present.map((e) => `<a class="tag" href="#/e/characters/${e.id}">${U.esc(e.fields.name || '?')}</a>`).join('')}</div>` : ''}
            ${quests.length ? `<div class="lbl">${T('Missions', 'Missions')}</div><div class="tags">${quests.map((q) => `<a class="tag" href="#/e/quests/${q.id}">${U.esc(q.fields.name || '?')}</a>`).join('')}</div>` : ''}
          </div></div>`;
      }).join('')}</div>` : UI.empty('flag', T('Pas encore de chapitres', 'No chapters yet'), T('Crée des chapitres pour voir la chronologie.', 'Create chapters to see the timeline.'))}
      ${unplaced.length ? `<div class="card"><h3>${T('Pas encore placés dans l\'histoire', 'Not yet placed in the story')}</h3><div class="avatars">${unplaced.map(({ t, e }) => avatar(t, e)).join('')}</div></div>` : ''}`;
    el.querySelectorAll('.tl-link').forEach((a) => { a.onclick = (e) => { e.preventDefault(); tab = 'chapters'; GF.app.go(`story/${a.dataset.ch}`); }; });
  }
})();
