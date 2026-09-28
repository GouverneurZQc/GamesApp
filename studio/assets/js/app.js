/* DevPortals — coquille : navigation, routeur, recherche, lecteur audio, idée rapide, modèles de projet */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;

  function navGroups() {
    const p = S.project;
    const ent = (t) => ({ route: `e/${t}`, icon: SC.ENTITIES[t].icon, label: SC.ENTITIES[t].label, count: p.entities[t].length });
    const openBugs = p.entities.bugs.filter((b) => !['fixed', 'wontfix', 'duplicate'].includes(b.fields.bstatus)).length;
    return [
      { key: 'project', label: ['Projet', 'Project'], items: [
        { route: 'dashboard', icon: 'home', label: ['Tableau de bord', 'Dashboard'] },
        { route: 'ideas', icon: 'bulb', label: ['Idées', 'Ideas'], count: p.ideas.length },
        { route: 'gdd', icon: 'book', label: ['Game Design Doc', 'Game Design Doc'] },
        { route: 'story', icon: 'feather', label: ['Histoire', 'Story'], count: p.story.chapters.length },
        { route: 'toolbox', icon: 'tool', label: ['Boîte à outils', 'Toolbox'] },
      ] },
      { key: 'world', label: ['Univers', 'World'], items: [
        ent('characters'), ent('vehicles'), ent('locations'),
        { route: 'map', icon: 'map', label: ['Cartes du monde', 'World maps'], count: p.maps.length },
        ent('items'), ent('factions'), ent('quests'), ent('dialogues'), ent('lore'),
      ] },
      { key: 'creation', label: ['Création', 'Creation'], items: [
        { route: 'art', icon: 'palette', label: ['Direction artistique', 'Art direction'] },
        ent('tracks'),
        { route: 'media', icon: 'image', label: ['Médiathèque', 'Media library'], count: p.gallery.length },
      ] },
      { key: 'production', label: ['Production', 'Production'], items: [
        { route: 'tasks', icon: 'check', label: ['Tâches & jalons', 'Tasks & milestones'], count: p.tasks.filter((t) => t.status !== 'done').length },
        ent('assets'),
        { ...ent('bugs'), count: openBugs },
        ent('playtests'),
        { route: 'captures', icon: 'camera', label: ['Captures & versions', 'Captures & builds'], count: p.captures.length },
        ent('team'),
      ] },
      { key: 'share', label: ['Partage', 'Sharing'], items: [
        { route: 'devlog', icon: 'megaphone', label: ['Devlog & mises à jour', 'Devlog & updates'], count: p.devlog.posts.length + p.devlog.patches.length },
        { route: 'portal', icon: 'rocket', label: ['Portail joueurs', 'Player portal'] },
      ] },
    ];
  }

  function parse() {
    const parts = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/').map(decodeURIComponent);
    const [a, b, c] = parts;
    if (a === 'e' && SC.ENTITIES[b]) return { view: 'entities', params: { type: b, id: c }, route: `e/${b}` };
    return { view: a, params: { id: b, sub: c }, route: a };
  }

  function applyAccent() {
    const key = S.settings.accent in SC.ACCENTS ? S.settings.accent : 'violet';
    const hex = SC.ACCENTS[key][0];
    document.documentElement.style.setProperty('--accent', hex);
    document.documentElement.style.setProperty('--on-accent', ['amber', 'green', 'white'].includes(key) ? '#0b0b0b' : '#ffffff');
  }

  const App = (DP.app = {
    pending: null,
    current: null,
    applyAccent,

    go(route) {
      const h = '#/' + route;
      if (location.hash === h) App.route(); else location.hash = h;
    },

    renderShell() {
      document.documentElement.lang = DP.lang;
      applyAccent();
      const root = document.getElementById('app');
      root.innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sidebar">
          <a class="brand" href="#/dashboard">
            <div class="logo">${UI.icon('rocket')}</div>
            <div><strong>DevPortals</strong><small>${T('Studio de jeu', 'Game studio')}</small></div>
          </a>
          <div class="proj">
            <label class="lbl">${T('Projet', 'Project')}</label>
            <div class="proj-row">
              <select id="projSel" class="input"></select>
              <button id="projNew" class="btn icon sm" title="${T('Nouveau projet', 'New project')}">${UI.icon('plus')}</button>
            </div>
          </div>
          <button class="searchbar" id="searchBtn">${UI.icon('search')}<span>${T('Rechercher…', 'Search…')}</span><kbd>Ctrl K</kbd></button>
          <nav id="nav" class="nav"></nav>
          <div class="side-foot">
            <div class="seg" id="langSeg">
              <button data-lang="fr" class="${DP.lang === 'fr' ? 'on' : ''}">FR</button>
              <button data-lang="en" class="${DP.lang === 'en' ? 'on' : ''}">EN</button>
            </div>
            <a href="#/portal" id="srvState" title=""><span class="srv-dot"></span></a>
            <span id="saveState" class="save-state" data-state="saved">${T('Enregistré', 'Saved')}</span>
          </div>
        </aside>
        <div class="backdrop" id="backdrop"></div>
        <main class="main">
          <header class="topbar">
            <button class="btn icon ghost mobile-only" id="menuBtn">${UI.icon('menu')}</button>
            <h1 id="viewTitle"></h1>
            <div class="top-actions">
              <button class="btn" id="quickIdeaBtn" title="Alt+N">${UI.icon('bulb')} <span class="hide-sm">${T('Nouvelle idée', 'New idea')}</span> <kbd class="hide-sm">Alt+N</kbd></button>
              <a class="btn primary" href="#/portal">${UI.icon('rocket')} <span class="hide-sm">${T('Portail', 'Portal')}</span></a>
            </div>
          </header>
          <section id="view" class="view"></section>
          <div class="player" id="player"><button class="btn icon sm ghost" id="plClose">${UI.icon('x')}</button>${UI.icon('music')}<strong id="plTitle"></strong><audio id="plAudio" controls></audio></div>
        </main>
      </div>`;

      App.renderProjects();
      App.refreshNav();
      App.updateServerDot();

      document.getElementById('projSel').onchange = async (e) => { await S.open(e.target.value); App.renderShell(); App.go('dashboard'); };
      document.getElementById('projNew').onclick = App.newProject;
      document.getElementById('searchBtn').onclick = App.search;
      document.querySelectorAll('#langSeg [data-lang]').forEach((b) => {
        b.onclick = async () => { S.settings.lang = DP.lang = b.dataset.lang; await S.saveSettings(); App.renderShell(); App.route(); };
      });
      document.getElementById('quickIdeaBtn').onclick = () => App.quickIdea();
      const toggle = (open) => document.body.classList.toggle('nav-open', open);
      document.getElementById('menuBtn').onclick = () => toggle(!document.body.classList.contains('nav-open'));
      document.getElementById('backdrop').onclick = () => toggle(false);
      document.getElementById('plClose').onclick = () => { const a = document.getElementById('plAudio'); a.pause(); document.getElementById('player').classList.remove('show'); };
    },

    updateServerDot() {
      const a = document.getElementById('srvState');
      if (!a) return;
      a.querySelector('.srv-dot').classList.toggle('on', DP.server.online);
      a.title = DP.server.online ? T('Serveur local actif — portail joueurs disponible', 'Local server running — player portal available')
        : T('Serveur local non lancé (ouvre DevPortals avec DevPortals.bat)', 'Local server not running (open DevPortals with DevPortals.bat)');
    },

    renderProjects() {
      const sel = document.getElementById('projSel');
      if (!sel) return;
      sel.innerHTML = S.list.map((p) => `<option value="${p.id}" ${p.id === S.project.id ? 'selected' : ''}>${U.esc(p.name)}</option>`).join('');
    },

    refreshNav() {
      const nav = document.getElementById('nav');
      if (!nav || !S.project) return;
      const cur = App.current ? App.current.route : '';
      const col = S.settings.navCollapsed || {};
      nav.innerHTML = navGroups().map((g) => `
        <button class="nav-sec ${col[g.key] ? 'collapsed' : ''}" data-sec="${g.key}">${U.esc(L(g.label))}${UI.icon('down')}</button>
        <div class="nav-group ${col[g.key] ? 'collapsed' : ''}">${g.items.map((it) =>
          `<a href="#/${it.route}" class="nav-item ${cur === it.route ? 'active' : ''}">${UI.icon(it.icon)}<span>${U.esc(L(it.label))}</span>${it.count ? `<em>${it.count}</em>` : ''}</a>`).join('')}</div>`).join('')
        + `<div class="sep"></div><a href="#/settings" class="nav-item ${cur === 'settings' ? 'active' : ''}">${UI.icon('sliders')}<span>${T('Paramètres & données', 'Settings & data')}</span></a>`;
      nav.querySelectorAll('[data-sec]').forEach((b) => {
        b.onclick = () => { col[b.dataset.sec] = !col[b.dataset.sec]; S.settings.navCollapsed = col; S.saveSettings(); App.refreshNav(); };
      });
    },

    async newProject() {
      const TPL = DP.toolboxData.TEMPLATES;
      let tplKey = 'blank';
      UI.modal({
        title: T('Nouveau projet', 'New project'), wide: true,
        body: `<label class="lbl">${T('Nom du jeu', 'Game name')}</label><input class="input" id="npName" placeholder="${T('ex. Néon Rush', 'e.g. Neon Rush')}">
          <label class="lbl">${T('Point de départ', 'Starting point')}</label>
          <div class="tpl-grid">${TPL.map((t) => `<button class="tpl ${t.key === 'blank' ? 'on' : ''}" data-tpl="${t.key}"><strong>${U.esc(L(t.label))}</strong><p>${U.esc(L(t.desc))}</p></button>`).join('')}</div>`,
        onOpen: (root) => root.querySelectorAll('[data-tpl]').forEach((b) => { b.onclick = () => { tplKey = b.dataset.tpl; root.querySelectorAll('[data-tpl]').forEach((x) => x.classList.toggle('on', x === b)); }; }),
        buttons: [
          { label: T('Annuler', 'Cancel'), cls: 'ghost' },
          { label: T('Créer', 'Create'), cls: 'primary', action: async (c, root) => {
            const name = root.querySelector('#npName').value.trim() || T('Mon jeu', 'My game');
            const p = await S.create(name);
            DP.templates.apply(p, tplKey);
            S.touch();
            App.renderShell(); App.go('dashboard');
            UI.toast(T('Projet créé', 'Project created'), 'success');
          } },
        ],
      });
    },

    async route() {
      UI.setPaste(null);
      const { view, params, route } = parse();
      const ok = !!DP.views[view];
      const V = ok ? DP.views[view] : DP.views.dashboard;
      App.current = { view: ok ? view : 'dashboard', params, route: ok ? route : 'dashboard' };
      App.refreshNav();
      document.body.classList.remove('nav-open');
      const el = document.getElementById('view');
      el.className = `view view-${App.current.view}`;
      el.innerHTML = '';
      el.scrollTop = 0;
      const t = document.getElementById('viewTitle');
      if (t) t.textContent = V.title ? V.title(params) : '';
      document.title = `${t ? t.textContent + ' · ' : ''}DevPortals`;
      try {
        await V.render(el, params);
      } catch (e) {
        console.error(e);
        el.innerHTML = `<div class="banner warn">${UI.icon('alert')}<div><strong>${T('Erreur d\'affichage', 'Display error')}</strong><br>${U.esc(e.message)}</div></div>`;
      }
      DP.media.hydrate(el);
      UI.autoGrow(el);
    },

    /** Lecture d'un son dans le lecteur global */
    async play(mediaId, title) {
      const url = await DP.media.url(mediaId);
      if (!url) { UI.toast(T('Fichier audio introuvable', 'Audio file not found'), 'error'); return; }
      const bar = document.getElementById('player');
      const a = document.getElementById('plAudio');
      document.getElementById('plTitle').textContent = title || '';
      bar.classList.add('show');
      a.src = url;
      a.play().catch(() => {});
    },

    /** Capture rapide d'une idée, depuis n'importe où */
    quickIdea(prefill = '') {
      UI.modal({
        title: T('Nouvelle idée', 'New idea'),
        body: `
          <input class="input" id="qiTitle" placeholder="${T('Titre (optionnel)', 'Title (optional)')}">
          <textarea class="input" id="qiText" rows="6" placeholder="${T('Écris ton idée comme elle vient…', 'Write your idea as it comes…')}">${U.esc(prefill)}</textarea>
          <select class="input" id="qiCat">${UI.options(SC.IDEA_CATS, 'gameplay')}</select>`,
        buttons: [
          { label: T('Annuler', 'Cancel'), cls: 'ghost' },
          { label: `${UI.icon('save')} ${T('Enregistrer', 'Save')}`, cls: 'primary', action: (close, root) => {
            const content = root.querySelector('#qiText').value.trim();
            const title = root.querySelector('#qiTitle').value.trim();
            if (!content && !title) { UI.toast(T('Écris quelque chose 🙂', 'Write something 🙂'), 'error'); return false; }
            const idea = App.createIdea({ title, content, category: root.querySelector('#qiCat').value });
            App.go(`ideas/${idea.id}`);
          } },
        ],
        onOpen: (root) => {
          root.querySelector('#qiText').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) root.querySelector('.modal-foot .primary').click();
          });
        },
      });
    },

    createIdea({ title = '', content = '', category = 'other', tags = [] }) {
      const idea = { id: U.uid('idea_'), title, content, category, tags, status: 'new', pinned: false, images: [], notes: [], scores: {}, createdAt: Date.now(), updatedAt: Date.now() };
      S.project.ideas.unshift(idea);
      S.touch();
      App.refreshNav();
      return idea;
    },

    /* ---------- Recherche globale ---------- */
    search() {
      if (document.querySelector('.search-modal')) return;
      const idx = buildIndex();
      let sel = 0, results = [];
      const m = UI.modal({
        title: T('Rechercher dans le projet', 'Search the project'), cls: 'search-modal',
        body: `<div class="search">${UI.icon('search')}<input class="input" id="sq" placeholder="${T('Nom, mot, réplique, tâche…', 'Name, word, line, task…')}"></div><div class="search-results" id="sr"></div>`,
      });
      const inp = m.root.querySelector('#sq');
      const out = m.root.querySelector('#sr');
      const draw = () => {
        const q = inp.value.trim().toLowerCase();
        results = q ? idx.filter((r) => r.text.includes(q)).sort((a, b) => (b.title.toLowerCase().includes(q) - a.title.toLowerCase().includes(q))).slice(0, 40) : [];
        sel = Math.min(sel, Math.max(0, results.length - 1));
        out.innerHTML = results.length ? results.map((r, i) => {
          const pos = r.text.indexOf(q);
          const snip = pos >= 0 ? U.truncate(r.text.slice(Math.max(0, pos - 40), pos + 80), 120) : '';
          return `<a class="list-item ${i === sel ? 'sel' : ''}" href="#/${r.route}" data-i="${i}">${UI.icon(r.icon)}<span class="li-body"><strong>${U.esc(r.title)}</strong><small>${U.esc(r.kind)} · ${U.esc(snip)}</small></span></a>`;
        }).join('') : (q ? `<p class="muted pad">${T('Aucun résultat.', 'No results.')}</p>` : `<p class="muted pad small">${T('Cherche dans les idées, fiches, chapitres, GDD, devlog, tâches…', 'Search ideas, sheets, chapters, GDD, devlog, tasks…')}</p>`);
        out.querySelectorAll('a').forEach((a) => { a.onclick = () => m.close(); });
      };
      inp.addEventListener('input', () => { sel = 0; draw(); });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, results.length - 1); draw(); e.preventDefault(); }
        if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
        if (e.key === 'Enter' && results[sel]) { m.close(); App.go(results[sel].route); }
      });
      draw();
    },
  });

  function buildIndex() {
    const p = S.project, idx = [];
    const add = (route, icon, kind, title, ...texts) => idx.push({ route, icon, kind, title: title || '?', text: [title, ...texts].join(' ').toLowerCase() });
    p.ideas.forEach((i) => add(`ideas/${i.id}`, 'bulb', T('Idée', 'Idea'), i.title || U.truncate(i.content, 60), i.content, (i.tags || []).join(' '), (i.notes || []).map((n) => n.text).join(' ')));
    SC.ENTITY_ORDER.forEach((t) => p.entities[t].forEach((e) => add(`e/${t}/${e.id}`, SC.ENTITIES[t].icon, L(SC.ENTITIES[t].singular), e.fields.name,
      Object.values(e.fields).map((v) => (typeof v === 'string' ? v : Array.isArray(v) ? v.filter((x) => typeof x === 'string').join(' ') : '')).join(' '), e.publicText || '')));
    p.story.chapters.forEach((c, i) => add(`story/${c.id}`, 'feather', T(`Chapitre ${i + 1}`, `Chapter ${i + 1}`), c.title, c.summary, c.content));
    p.gdd.sections.forEach((s) => add(`gdd/${s.id}`, 'book', 'GDD', s.key ? L(SC.gddDef(s.key).title) : s.title, s.content));
    p.devlog.posts.forEach((x) => add(`devlog/posts/${x.id}`, 'megaphone', T('Article', 'Post'), x.title, x.content));
    p.devlog.patches.forEach((x) => add(`devlog/patches/${x.id}`, 'megaphone', T('Version', 'Version'), `${x.version} ${x.title || ''}`, x.added, x.changed, x.fixed, x.removed));
    p.tasks.forEach((t) => add('tasks', 'check', T('Tâche', 'Task'), t.title, t.desc || ''));
    p.maps.forEach((mp) => add(`map/${mp.id}`, 'map', T('Carte', 'Map'), mp.name, mp.markers.map((k) => `${k.label} ${k.note || ''}`).join(' ')));
    p.captures.forEach((c) => add(`captures/${c.id}`, 'camera', T('Capture', 'Capture'), c.title, c.notes || '', c.version || ''));
    return idx;
  }

  /* ---------- Modèles de projet ---------- */
  DP.templates = {
    apply(p, key) {
      const D = DP.toolboxData;
      const tpl = D.TEMPLATES.find((t) => t.key === key) || D.TEMPLATES[0];
      const ms = D.MILESTONES.map((m) => ({ id: U.uid('ms_'), title: L(m), date: '', description: '', public: true, done: false, createdAt: Date.now() }));
      p.milestones = ms;
      if (tpl.genre) p.meta.genre = L(tpl.genre);
      const set = (k, txt) => { const s = p.gdd.sections.find((x) => x.key === k); if (s && txt) s.content = L(txt); };
      set('concept', tpl.concept); set('pillars', tpl.pillars); set('loop', tpl.loop);
      (tpl.tasks || []).forEach((t, i) => p.tasks.push({ id: U.uid('task_'), title: L(t), desc: '', status: i < 2 ? 'todo' : 'backlog', priority: i < 2 ? 'high' : 'med', category: '', milestone: ms[0].id, createdAt: Date.now() }));
    },
  };

  document.addEventListener('keydown', (e) => {
    if (e.altKey && !e.ctrlKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
      e.preventDefault();
      if (!document.querySelector('.modal-wrap')) App.quickIdea();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      App.search();
    }
  });

  window.addEventListener('hashchange', () => App.route());

  async function boot() {
    try {
      await S.init();
    } catch (e) {
      console.error(e);
      document.getElementById('app').innerHTML = `<div class="boot-error"><h2>DevPortals</h2><p>${U.esc(e.message)}</p></div>`;
      return;
    }
    if (!S.project.milestones.length && !S.project.tasks.length && !S.project.ideas.length) { DP.templates.apply(S.project, 'blank'); await S.saveNow(); }
    App.renderShell();
    if (DP.db.isMemory) UI.toast(T('Stockage local indisponible : exporte ton projet pour ne rien perdre !', 'Local storage unavailable: export your project to avoid losing work!'), 'error', 9000);
    await App.route();
    await DP.server.check();
    App.updateServerDot();
    DP.backup.start();
    if (App.current && (App.current.view === 'portal' || App.current.view === 'dashboard' || App.current.view === 'settings')) App.route();
  }
  boot();
})();
