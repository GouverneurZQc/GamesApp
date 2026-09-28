/* GameForge Studio — coquille de l'application : navigation, routeur, projet, idée rapide */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;
  GF.views = GF.views || {};

  function navItems() {
    const p = S.project;
    const ent = SC.ENTITY_ORDER.map((t) => ({ route: `e/${t}`, view: 'entities', icon: SC.ENTITIES[t].icon, label: SC.ENTITIES[t].label, count: p.entities[t].length }));
    return [
      { section: ['Projet', 'Project'] },
      { route: 'dashboard', icon: 'home', label: ['Tableau de bord', 'Dashboard'] },
      { route: 'ideas', icon: 'bulb', label: ['Idées', 'Ideas'], count: p.ideas.length },
      { route: 'gdd', icon: 'book', label: ['Game Design Doc', 'Game Design Doc'] },
      { route: 'story', icon: 'feather', label: ['Histoire', 'Story'], count: p.story.chapters.length },
      { section: ['Univers', 'World'] },
      ...ent,
      { section: ['Création', 'Creation'] },
      { route: 'art', icon: 'palette', label: ['Direction artistique', 'Art direction'] },
      { route: 'studio', icon: 'wand', label: ['Idée → Image', 'Idea → Image'], count: p.gallery.length },
      { route: 'critique', icon: 'camera', label: ['Critique de captures', 'Screenshot critique'], count: p.critiques.length },
      { route: 'chat', icon: 'chat', label: ['Assistant IA', 'AI assistant'] },
      { section: ['Production', 'Production'] },
      { route: 'tasks', icon: 'check', label: ['Tâches & roadmap', 'Tasks & roadmap'], count: p.tasks.filter((t) => t.status !== 'done').length },
      { route: 'settings', icon: 'sliders', label: ['Paramètres', 'Settings'] },
    ];
  }

  function parse() {
    const parts = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/').map(decodeURIComponent);
    const [a, b, c] = parts;
    if (a === 'e' && SC.ENTITIES[b]) return { view: 'entities', params: { type: b, id: c }, route: `e/${b}` };
    return { view: a, params: { id: b }, route: a };
  }

  const App = (GF.app = {
    pending: null,
    current: null,

    go(route) {
      const h = '#/' + route;
      if (location.hash === h) App.route(); else location.hash = h;
    },

    renderShell() {
      document.documentElement.lang = GF.lang;
      document.documentElement.dataset.theme = S.settings.theme;
      const root = document.getElementById('app');
      root.innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sidebar">
          <a class="brand" href="#/dashboard">
            <div class="logo">${UI.icon('sparkles')}</div>
            <div><strong>GameForge</strong><small>Studio</small></div>
          </a>
          <div class="proj">
            <label class="lbl">${T('Projet', 'Project')}</label>
            <div class="proj-row">
              <select id="projSel" class="input"></select>
              <button id="projNew" class="btn icon sm" title="${T('Nouveau projet', 'New project')}">${UI.icon('plus')}</button>
            </div>
          </div>
          <nav id="nav" class="nav"></nav>
          <div class="side-foot">
            <div class="seg" id="langSeg">
              <button data-lang="fr" class="${GF.lang === 'fr' ? 'on' : ''}">FR</button>
              <button data-lang="en" class="${GF.lang === 'en' ? 'on' : ''}">EN</button>
            </div>
            <button class="btn icon ghost" id="themeBtn" title="${T('Thème clair / sombre', 'Light / dark theme')}">${UI.icon(S.settings.theme === 'dark' ? 'sun' : 'moon')}</button>
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
              <button class="btn primary" id="askBtn">${UI.icon('sparkles')} <span class="hide-sm">${T('Demander à l\'agent', 'Ask the agent')}</span></button>
            </div>
          </header>
          <section id="view" class="view"></section>
        </main>
      </div>`;

      App.renderProjects();
      App.refreshNav();

      document.getElementById('projSel').onchange = async (e) => {
        await S.open(e.target.value);
        App.renderShell();
        App.go('dashboard');
      };
      document.getElementById('projNew').onclick = App.newProject;
      document.querySelectorAll('#langSeg [data-lang]').forEach((b) => {
        b.onclick = async () => {
          S.settings.lang = GF.lang = b.dataset.lang;
          await S.saveSettings();
          App.renderShell();
          App.route();
        };
      });
      document.getElementById('themeBtn').onclick = async () => {
        S.settings.theme = S.settings.theme === 'dark' ? 'light' : 'dark';
        await S.saveSettings();
        document.documentElement.dataset.theme = S.settings.theme;
        document.getElementById('themeBtn').innerHTML = UI.icon(S.settings.theme === 'dark' ? 'sun' : 'moon');
      };
      document.getElementById('quickIdeaBtn').onclick = () => App.quickIdea();
      document.getElementById('askBtn').onclick = () => App.go('chat');
      const toggle = (open) => document.body.classList.toggle('nav-open', open);
      document.getElementById('menuBtn').onclick = () => toggle(!document.body.classList.contains('nav-open'));
      document.getElementById('backdrop').onclick = () => toggle(false);
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
      nav.innerHTML = navItems().map((it) => it.section
        ? `<div class="nav-sec">${U.esc(L(it.section))}</div>`
        : `<a href="#/${it.route}" class="nav-item ${cur === it.route ? 'active' : ''}">${UI.icon(it.icon)}<span>${U.esc(L(it.label))}</span>${it.count ? `<em>${it.count}</em>` : ''}</a>`).join('');
    },

    async newProject() {
      const name = await UI.ask(T('Nouveau projet', 'New project'), { placeholder: T('Nom du jeu', 'Game name') });
      if (!name) return;
      await S.create(name);
      App.renderShell();
      App.go('dashboard');
      UI.toast(T('Projet créé', 'Project created'), 'success');
    },

    async route() {
      UI.setPaste(null);
      const { view, params, route } = parse();
      const V = GF.views[view] ? GF.views[view] : GF.views.dashboard;
      App.current = { view: GF.views[view] ? view : 'dashboard', params, route: GF.views[view] ? route : 'dashboard' };
      App.refreshNav();
      document.body.classList.remove('nav-open');
      const el = document.getElementById('view');
      el.className = `view view-${App.current.view}`;
      el.innerHTML = '';
      el.scrollTop = 0;
      const t = document.getElementById('viewTitle');
      if (t) t.textContent = V.title ? V.title(params) : '';
      document.title = `${t ? t.textContent + ' · ' : ''}GameForge Studio`;
      try {
        await V.render(el, params);
      } catch (e) {
        console.error(e);
        el.innerHTML = `<div class="ai-error">${UI.icon('info')}<div><strong>${T('Erreur d\'affichage', 'Display error')}</strong><br>${U.esc(e.message)}</div></div>`;
      }
      GF.images.hydrate(el);
      UI.autoGrow(el);
    },

    /** Capture rapide d'une idée, depuis n'importe où */
    quickIdea(prefill = '') {
      const autoReact = S.settings.agent.autoReact;
      UI.modal({
        title: T('Nouvelle idée', 'New idea'),
        body: `
          <input class="input" id="qiTitle" placeholder="${T('Titre (optionnel)', 'Title (optional)')}">
          <textarea class="input" id="qiText" rows="6" placeholder="${T('Écris ton idée comme elle vient… l\'agent t\'aidera à la développer.', 'Write your idea as it comes… the agent will help you develop it.')}">${U.esc(prefill)}</textarea>
          <div class="row gap wrap">
            <select class="input" id="qiCat" style="max-width:220px">${UI.options(SC.IDEA_CATS, 'gameplay')}</select>
            <label class="check"><input type="checkbox" id="qiReact" ${autoReact ? 'checked' : ''}> ${T('L\'agent réagit et propose des suggestions', 'The agent reacts with suggestions')}</label>
          </div>`,
        buttons: [
          { label: T('Annuler', 'Cancel'), cls: 'ghost' },
          { label: `${UI.icon('save')} ${T('Enregistrer', 'Save')}`, cls: 'primary', action: (close, root) => {
            const content = root.querySelector('#qiText').value.trim();
            const title = root.querySelector('#qiTitle').value.trim();
            if (!content && !title) { UI.toast(T('Écris quelque chose 🙂', 'Write something 🙂'), 'error'); return false; }
            const idea = App.createIdea({ title, content, category: root.querySelector('#qiCat').value });
            if (root.querySelector('#qiReact').checked) App.pending = { ideaReact: idea.id };
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
      const idea = { id: U.uid('idea_'), title, content, category, tags, status: 'new', pinned: false, images: [], thread: [], createdAt: Date.now(), updatedAt: Date.now() };
      S.project.ideas.unshift(idea);
      S.touch();
      App.refreshNav();
      return idea;
    },
  });

  document.addEventListener('keydown', (e) => {
    if (e.altKey && !e.ctrlKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
      e.preventDefault();
      if (!document.querySelector('.modal-wrap')) App.quickIdea();
    }
  });

  window.addEventListener('hashchange', () => App.route());

  async function boot() {
    try {
      await S.init();
    } catch (e) {
      console.error(e);
      document.getElementById('app').innerHTML = `<div class="boot-error"><h2>GameForge Studio</h2><p>${U.esc(e.message)}</p></div>`;
      return;
    }
    App.renderShell();
    if (GF.db.isMemory) UI.toast(T('Stockage local indisponible : exporte ton projet pour ne rien perdre !', 'Local storage unavailable: export your project to avoid losing work!'), 'error', 9000);
    await App.route();
  }
  boot();
})();
