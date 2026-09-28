/* Vue : tableau de bord */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;

  const ADVICE = [
    { key: 'next', icon: 'target', label: ['Prochaines étapes', 'Next steps'],
      fr: 'Analyse l\'état actuel de mon projet et propose les 5 prochaines étapes les plus utiles, par ordre de priorité. Pour chacune : pourquoi, et une action concrète à faire aujourd\'hui.',
      en: 'Analyze the current state of my project and propose the 5 most useful next steps, in priority order. For each: why, and one concrete action to do today.' },
    { key: 'weak', icon: 'camera', label: ['Points faibles', 'Weak spots'],
      fr: 'Quelles sont les 5 plus grandes faiblesses, zones floues ou incohérences de mon projet actuel ? Sois franc. Pour chacune, propose une solution.',
      en: 'What are the 5 biggest weaknesses, blind spots or inconsistencies in my current project? Be frank. Propose a fix for each.' },
    { key: 'features', icon: 'sparkles', label: ['Idées de fonctionnalités', 'Feature ideas'],
      fr: 'Propose 8 idées de fonctionnalités ou de moments forts qui renforceraient l\'identité de mon jeu, cohérentes avec ce qui existe déjà. Classe-les de la plus simple à la plus ambitieuse.',
      en: 'Propose 8 feature ideas or standout moments that would strengthen my game\'s identity, consistent with what exists. Order from simplest to most ambitious.' },
    { key: 'scope', icon: 'check', label: ['Scope réaliste ?', 'Realistic scope?'],
      fr: 'Évalue le scope de mon projet par rapport à mon équipe. Est-il réaliste ? Que couper, que garder pour une première version jouable (vertical slice) ? Donne une estimation grossière.',
      en: 'Evaluate my project\'s scope relative to my team. Is it realistic? What to cut and keep for a first playable version (vertical slice)? Give a rough estimate.' },
    { key: 'pitch', icon: 'flag', label: ['Pitch & noms', 'Pitch & names'],
      fr: 'Propose 5 pitchs percutants d\'une phrase pour mon jeu, puis 8 noms alternatifs (avec une courte justification). Dis franchement ce qui cloche dans le nom et le pitch actuels.',
      en: 'Propose 5 punchy one-sentence pitches for my game, then 8 alternative names (with a short rationale). Say frankly what is wrong with the current name and pitch.' },
  ];

  function aiConfigured() {
    const st = S.settings;
    if (['anthropic', 'openai', 'gemini', 'openrouter', 'custom'].some((id) => GF.ai.isReady(id))) return true;
    return ['ollama', 'lmstudio'].includes(st.textProvider);
  }

  GF.views.dashboard = {
    title: () => T('Tableau de bord', 'Dashboard'),
    render(el) {
      const p = S.project, m = p.meta;
      const gddFilled = p.gdd.sections.filter((s) => s.content.trim().length >= 40).length;
      const gddPct = p.gdd.sections.length ? Math.round((gddFilled / p.gdd.sections.length) * 100) : 0;
      const tasksDone = p.tasks.filter((t) => t.status === 'done').length;
      const stats = [
        { route: 'ideas', icon: 'bulb', n: p.ideas.length, label: ['Idées', 'Ideas'] },
        ...SC.ENTITY_ORDER.slice(0, 4).map((t) => ({ route: `e/${t}`, icon: SC.ENTITIES[t].icon, n: p.entities[t].length, label: SC.ENTITIES[t].label })),
        { route: 'gdd', icon: 'book', n: gddPct + ' %', label: ['GDD rempli', 'GDD filled'], pct: gddPct },
        { route: 'story', icon: 'feather', n: p.story.chapters.length, label: ['Chapitres', 'Chapters'] },
        { route: 'tasks', icon: 'check', n: `${tasksDone}/${p.tasks.length}`, label: ['Tâches faites', 'Tasks done'] },
        { route: 'studio', icon: 'image', n: p.gallery.length, label: ['Images', 'Images'] },
      ];
      const recentIdeas = p.ideas.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
      const recentImgs = p.gallery.slice(0, 8);
      const needBackup = (Date.now() - (S.settings.lastBackup || 0)) > 7 * 864e5 && (p.ideas.length + SC.ENTITY_ORDER.reduce((n, t) => n + p.entities[t].length, 0)) > 3;

      el.innerHTML = `
        <div class="hero card">
          <button class="hero-cover ${m.cover ? '' : 'empty'}" id="coverBtn" ${m.cover ? `data-bg-img="${m.cover}"` : ''} title="${T('Changer l\'image de couverture', 'Change cover image')}">
            ${m.cover ? '' : `${UI.icon('image', 'big')}<span>${T('Ajouter une couverture', 'Add a cover')}</span>`}
          </button>
          <div class="hero-body">
            <input class="hero-title" id="pName" value="${U.esc(p.name)}" placeholder="${T('Nom du jeu', 'Game name')}">
            <textarea class="input auto" id="pPitch" rows="2" placeholder="${T('Pitch en une ou deux phrases : c\'est quoi ton jeu ?', 'One or two sentence pitch: what is your game?')}">${U.esc(m.pitch)}</textarea>
            <div class="meta-grid">
              ${metaInput('genre', T('Genre', 'Genre'), T('ex. Course arcade, RPG d\'action…', 'e.g. Arcade racing, action RPG…'))}
              ${metaInput('platforms', T('Plateformes', 'Platforms'), 'PC, Switch, PS5…')}
              ${metaInput('engine', T('Moteur', 'Engine'), 'Unity, Unreal, Godot…')}
              ${metaInput('audience', T('Public cible', 'Audience'), T('ex. 16-30 ans, fans de…', 'e.g. 16-30, fans of…'))}
              ${metaInput('team', T('Équipe', 'Team'), T('ex. Solo, 3 personnes…', 'e.g. Solo, 3 people…'))}
            </div>
          </div>
        </div>

        ${aiConfigured() ? '' : `
        <div class="banner">
          ${UI.icon('key')}
          <div><strong>${T('Mode gratuit actif', 'Free mode active')}</strong> — ${T('l\'agent fonctionne déjà sans clé (qualité limitée) et la génération d\'images est gratuite. Pour des réponses bien meilleures et la critique de captures, ajoute une clé API (Claude recommandé, ou OpenAI / Gemini).',
            'the agent already works without a key (limited quality) and image generation is free. For much better answers and screenshot critique, add an API key (Claude recommended, or OpenAI / Gemini).')}</div>
          <a class="btn primary sm" href="#/settings">${T('Configurer l\'IA', 'Set up AI')}</a>
        </div>`}

        ${needBackup ? `
        <div class="banner warn">
          ${UI.icon('save')}
          <div><strong>${T('Pense à sauvegarder', 'Remember to back up')}</strong> — ${T('tes données sont stockées dans ce navigateur. Exporte régulièrement ton projet dans un fichier.', 'your data lives in this browser. Export your project to a file regularly.')}</div>
          <button class="btn sm" id="backupBtn">${UI.icon('download')} ${T('Exporter maintenant', 'Export now')}</button>
        </div>` : ''}

        <div class="stats">
          ${stats.map((s) => `<a class="stat" href="#/${s.route}">${UI.icon(s.icon)}<strong>${s.n}</strong><span>${U.esc(L(s.label))}</span>${s.pct != null ? `<i class="bar"><b style="width:${s.pct}%"></b></i>` : ''}</a>`).join('')}
        </div>

        <div class="grid2">
          <div class="card">
            <h3>${UI.icon('bulb')} ${T('Idée rapide', 'Quick idea')}</h3>
            <p class="muted small">${T('Note une idée dès qu\'elle arrive. L\'agent la développe avec toi.', 'Jot an idea the moment it comes. The agent develops it with you.')}</p>
            <textarea class="input auto" id="qText" rows="4" placeholder="${T('Ex. : Et si le héros pouvait rembobiner le temps de 5 secondes pendant les courses ?', 'E.g.: What if the hero could rewind time by 5 seconds during races?')}"></textarea>
            <div class="row gap wrap">
              <select class="input" id="qCat" style="max-width:200px">${UI.options(SC.IDEA_CATS, 'gameplay')}</select>
              <button class="btn" id="qSave">${UI.icon('save')} ${T('Enregistrer', 'Save')}</button>
              <button class="btn primary" id="qAsk">${UI.icon('sparkles')} ${T('Enregistrer + avis de l\'agent', 'Save + agent feedback')}</button>
            </div>
          </div>
          <div class="card">
            <h3>${UI.icon('sparkles')} ${T('Conseils de l\'agent sur ton projet', 'Agent advice on your project')}</h3>
            <p class="muted small">${T('L\'agent lit tout ton projet (GDD, histoire, fiches, style) avant de répondre.', 'The agent reads your whole project (GDD, story, sheets, style) before answering.')}</p>
            <div class="chips">${ADVICE.map((a) => `<button class="chip" data-adv="${a.key}">${UI.icon(a.icon)} ${U.esc(L(a.label))}</button>`).join('')}</div>
          </div>
        </div>
        <div id="advOut"></div>

        <div class="grid2">
          <div class="card">
            <div class="card-head"><h3>${UI.icon('bulb')} ${T('Idées récentes', 'Recent ideas')}</h3><a class="link small" href="#/ideas">${T('Tout voir →', 'See all →')}</a></div>
            ${recentIdeas.length ? `<div class="mini-list">${recentIdeas.map((i) => `
              <a class="mini-item" href="#/ideas/${i.id}">
                <span class="dot" style="background:${statusColor(i.status)}"></span>
                <span class="grow">${U.esc(i.title || U.truncate(i.content, 70) || T('(vide)', '(empty)'))}</span>
                <span class="muted small">${U.relTime(i.updatedAt)}</span>
              </a>`).join('')}</div>` : `<p class="muted">${T('Aucune idée pour l\'instant.', 'No ideas yet.')}</p>`}
          </div>
          <div class="card">
            <div class="card-head"><h3>${UI.icon('image')} ${T('Dernières images', 'Latest images')}</h3><a class="link small" href="#/studio">${T('Studio →', 'Studio →')}</a></div>
            ${recentImgs.length ? `<div class="thumb-strip" id="dashImgs">${recentImgs.map((g) => UI.tile(g.id, { actions: ['view', 'attach'] })).join('')}</div>`
              : `<p class="muted">${T('Transforme une idée en image dans le studio.', 'Turn an idea into an image in the studio.')}</p><a class="btn sm" href="#/studio">${UI.icon('wand')} ${T('Ouvrir le studio', 'Open the studio')}</a>`}
          </div>
        </div>`;

      function metaInput(key, label, ph) {
        return `<label class="field"><span class="lbl">${U.esc(label)}</span><input class="input" data-meta="${key}" value="${U.esc(m[key] || '')}" placeholder="${U.esc(ph)}"></label>`;
      }

      el.querySelector('#pName').addEventListener('input', (e) => {
        p.name = e.target.value || T('Sans nom', 'Untitled');
        S.touch();
        const it = S.list.find((x) => x.id === p.id); if (it) it.name = p.name;
        GF.app.renderProjects();
      });
      el.querySelector('#pPitch').addEventListener('input', (e) => { m.pitch = e.target.value; S.touch(); });
      el.querySelectorAll('[data-meta]').forEach((inp) => inp.addEventListener('input', () => { m[inp.dataset.meta] = inp.value; S.touch(); }));

      el.querySelector('#coverBtn').onclick = async () => {
        const ids = await UI.pickImages({ title: T('Image de couverture', 'Cover image') });
        if (ids && ids[0]) { m.cover = ids[0]; S.touch(); GF.app.route(); }
      };
      const bk = el.querySelector('#backupBtn');
      if (bk) bk.onclick = async () => { await S.exportProject(); GF.app.route(); };

      const saveQuick = (react) => {
        const content = el.querySelector('#qText').value.trim();
        if (!content) { UI.toast(T('Écris ton idée d\'abord 🙂', 'Write your idea first 🙂'), 'error'); return; }
        const idea = GF.app.createIdea({ content, category: el.querySelector('#qCat').value });
        if (react) { GF.app.pending = { ideaReact: idea.id }; GF.app.go(`ideas/${idea.id}`); }
        else { UI.toast(T('Idée enregistrée', 'Idea saved'), 'success'); GF.app.route(); }
      };
      el.querySelector('#qSave').onclick = () => saveQuick(false);
      el.querySelector('#qAsk').onclick = () => saveQuick(true);

      el.querySelectorAll('[data-adv]').forEach((b) => {
        b.onclick = () => {
          const a = ADVICE.find((x) => x.key === b.dataset.adv);
          GF.agent.run({
            into: el.querySelector('#advOut'), position: 'prepend', title: L(a.label),
            prompt: GF.lang === 'en' ? a.en : a.fr, persona: a.key === 'scope' ? 'producer' : a.key === 'pitch' ? 'marketing' : 'designer',
            context: true,
          });
        };
      });
      const strip = el.querySelector('#dashImgs');
      if (strip) UI.bindTiles(strip);
    },
  };

  function statusColor(s) {
    const x = SC.IDEA_STATUS.find((y) => y[0] === s);
    return x ? x[2] : '#888';
  }
})();
