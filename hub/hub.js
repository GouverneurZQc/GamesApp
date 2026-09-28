/* DevPortals — catalogue public : tous les portails de jeux validés + connexion / inscription / installation */
(function () {
  'use strict';
  const CAT = window.DP.catalog;
  const LANG_KEY = 'dp_lang';
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };
  const sess = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } return null; };
  let lang = store(LANG_KEY) === 'en' ? 'en' : 'fr';
  const T = (fr, en) => (lang === 'en' ? en : fr);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const lab = (list, k) => CAT.label(list, k, lang);

  const ICONS = {
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    studio: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    gamepad: '<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12h4M8 10v4"/><circle cx="15" cy="11" r="1"/><circle cx="18" cy="13" r="1"/>',
    left: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
  };
  const icon = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

  const ERR = {
    bad_credentials: ["Nom d'utilisateur ou mot de passe incorrect.", 'Wrong username or password.'],
    weak_password: ['Mot de passe trop court (6 caractères minimum).', 'Password too short (6 characters minimum).'],
    invalid_username: ["Nom d'utilisateur invalide : 3 à 32 caractères (lettres, chiffres, . _ -).", 'Invalid username: 3 to 32 characters (letters, digits, . _ -).'],
    username_taken: ["Ce nom d'utilisateur est déjà pris.", 'This username is already taken.'],
    registration_closed: ["Les inscriptions sont fermées. Demande un compte à l'administrateur.", 'Registration is closed. Ask the administrator for an account.'],
    account_disabled: ["Ce compte est désactivé. Contacte l'administrateur.", 'This account is disabled. Contact the administrator.'],
    too_many_attempts: ['Trop de tentatives. Réessaie dans quelques minutes.', 'Too many attempts. Try again in a few minutes.'],
    setup_local_only: ['La première configuration doit se faire sur le PC qui héberge DevPortals.', 'The first setup must be done on the PC hosting DevPortals.'],
    setup_done: ['La plateforme est déjà configurée.', 'The platform is already set up.'],
    mismatch: ['Les deux mots de passe ne correspondent pas.', 'The two passwords do not match.'],
  };
  const errText = (code) => (ERR[code] ? T(ERR[code][0], ERR[code][1]) : `${T('Erreur', 'Error')} (${code || '?'})`);

  async function api(path, body) {
    const opts = { credentials: 'same-origin', cache: 'no-store' };
    if (body !== undefined) Object.assign(opts, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'X-DP': '1' } });
    const res = await fetch(path, opts);
    let data = null;
    try { data = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok) { const err = new Error(errText(data && data.error)); err.code = data && data.error; throw err; }
    return data;
  }

  let state = null; // /api/auth/state
  let hub = null; // /api/hub
  let pending = 0;
  const filters = { q: '', genres: [], styles: [], modes: [], platforms: [], stage: '', sort: 'recent' };

  // « NOUVEAU » : ce qui a été publié ou mis à jour depuis la visite précédente (figé pour la session)
  let lastVisit = +sess('dp_hub_ref');
  if (!lastVisit) {
    lastVisit = +store('dp_hub_last') || Date.now();
    sess('dp_hub_ref', String(lastVisit));
  }
  store('dp_hub_last', String(Date.now()));

  /* ---------------- Routeur ---------------- */
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || '', arg: parts[1] || '', params: new URLSearchParams(qs || '') };
  }
  const safeReturn = (r) => (r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\') ? r : '/studio/');

  async function route() {
    const r = parse();
    renderTop();
    const main = $('#main');
    window.scrollTo(0, 0);
    if (state.setupNeeded) return renderSetup(main);
    if (r.name === 'connexion' || r.name === 'login') return state.user ? location.assign(safeReturn(r.params.get('retour'))) : renderLogin(main, r.params);
    if (r.name === 'inscription' || r.name === 'register') return state.user ? location.assign('/studio/') : renderRegister(main);
    if (!hub) main.innerHTML = '<div class="loading"><span class="spinner"></span></div>';
    await loadHub();
    if (r.name === 'createur' && r.arg) return renderCreator(main, r.arg);
    renderCatalog(main);
  }

  async function loadHub(force) {
    if (hub && !force) return hub;
    try { hub = await api('/api/hub'); } catch (e) { hub = { hubName: 'DevPortals', hubTagline: '', portals: [], creators: {}, allowRegistration: false }; }
    document.title = `${hub.hubName} — ${T('catalogue des jeux', 'game catalog')}`;
    return hub;
  }

  /* ---------------- En-tête ---------------- */
  function renderTop() {
    const u = state.user;
    const name = (hub && hub.hubName) || state.hubName || 'DevPortals';
    $('#top').innerHTML = `<div class="wrap">
      <a class="brand" href="#/"><span class="logo">${icon('rocket')}</span><span class="name">${esc(name)}</span></a>
      <span class="spacer"></span>
      <div class="seg" id="lang"><button data-l="fr" class="${lang === 'fr' ? 'on' : ''}">FR</button><button data-l="en" class="${lang === 'en' ? 'on' : ''}">EN</button></div>
      ${u ? `
        <a class="btn primary" href="/studio/">${icon('studio')} <span class="hide-sm">${T('Mon studio', 'My studio')}</span></a>
        <div class="acct">
          <button class="acct-btn" id="acctBtn"><span class="avatar">${esc((u.displayName || u.username).slice(0, 1).toUpperCase())}</span><span class="nm">${esc(u.displayName)}</span>${pending ? `<em class="badge" style="margin-left:2px">${pending}</em>` : ''}</button>
          <div class="acct-menu" id="acctMenu" hidden>
            <div class="who"><strong>${esc(u.displayName)}</strong><small>@${esc(u.username)} · ${u.role === 'admin' ? T('Administrateur', 'Administrator') : T('Créateur', 'Creator')}</small></div>
            <a href="/studio/">${icon('studio')} ${T('Mon studio', 'My studio')}</a>
            <a href="/studio/#/portal">${icon('rocket')} ${T('Portail de mon jeu', 'My game portal')}</a>
            <a href="#/createur/${encodeURIComponent(u.username)}">${icon('user')} ${T('Mon profil public', 'My public profile')}</a>
            ${u.role === 'admin' ? `<a href="/studio/#/admin">${icon('shield')} ${T('Administration', 'Administration')}${pending ? `<em>${pending}</em>` : ''}</a>` : ''}
            <a href="/studio/#/settings">${icon('sliders')} ${T('Compte & paramètres', 'Account & settings')}</a>
            <button id="logout">${icon('logout')} ${T('Se déconnecter', 'Log out')}</button>
          </div>
        </div>`
    : state.setupNeeded ? '' : `<a class="btn ghost" href="#/connexion">${T('Se connecter', 'Log in')}</a>
        ${state.allowRegistration ? `<a class="btn primary" href="#/inscription">${T('Créer un compte', 'Sign up')}</a>` : ''}`}
    </div>`;
    $$('#lang [data-l]').forEach((b) => { b.onclick = () => { lang = b.dataset.l; store(LANG_KEY, lang); document.documentElement.lang = lang; route(); renderFoot(); }; });
    const ab = $('#acctBtn');
    if (ab) {
      ab.onclick = (e) => { e.stopPropagation(); $('#acctMenu').hidden = !$('#acctMenu').hidden; };
      $('#logout').onclick = async () => { try { await api('/api/auth/logout', {}); } catch (e) { /* ignore */ } state.user = null; pending = 0; route(); };
    }
  }
  document.addEventListener('click', (e) => { const m = $('#acctMenu'); if (m && !m.hidden && !e.target.closest('.acct')) m.hidden = true; });

  function renderFoot() {
    $('#foot').innerHTML = `<div class="wrap"><span>${esc((hub && hub.hubName) || 'DevPortals')} · ${T('propulsé par DevPortals', 'powered by DevPortals')}</span>
      <span>${state.user ? `<a href="/studio/">${T('Mon studio', 'My studio')}</a>` : `<a href="#/connexion">${T('Espace créateurs', 'Creators area')}</a>`}</span></div>`;
  }

  /* ---------------- Catalogue ---------------- */
  function isNew(p) { return (p.updatedAt || 0) > lastVisit; }

  function gameCard(p) {
    const chips = [...p.genres.map((k) => lab(CAT.GENRES, k)), ...p.styles.slice(0, 2).map((k) => lab(CAT.STYLES, k))].slice(0, 4);
    return `<a class="game" href="${esc(p.url)}">
      <div class="badges">${p.featured ? `<span class="badge star">★ ${T('À la une', 'Featured')}</span>` : ''}${isNew(p) ? `<span class="badge">${p.approvedAt && p.approvedAt > lastVisit ? T('Nouveau', 'New') : T('Mis à jour', 'Updated')}</span>` : ''}</div>
      <div class="cover" ${p.cover ? `style="background-image:url('${esc(p.cover)}')"` : ''}>${p.cover ? '' : icon('gamepad')}</div>
      <div class="body">
        <h3>${esc(p.title)}</h3>
        ${p.tagline ? `<p>${esc(p.tagline.length > 130 ? p.tagline.slice(0, 129) + '…' : p.tagline)}</p>` : ''}
        <div>${p.stage ? `<span class="tag stage">${esc(lab(CAT.STAGES, p.stage))}</span>` : ''}${chips.map((c) => `<span class="tag">${esc(c)}</span>`).join('')}</div>
        <div class="foot"><span>${T('par', 'by')} <span class="by" data-creator="${esc(p.ownerUser)}">${esc(p.owner)}</span></span><span>${fmtRel(p.updatedAt)}</span></div>
      </div>
    </a>`;
  }

  function fmtRel(ts) {
    if (!ts) return '';
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (d <= 0) return T("aujourd'hui", 'today');
    if (d === 1) return T('hier', 'yesterday');
    if (d < 30) return T(`il y a ${d} j`, `${d}d ago`);
    return new Date(ts).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function bindCards(root) {
    $$('[data-creator]', root).forEach((s) => {
      s.onclick = (e) => { e.preventDefault(); e.stopPropagation(); location.hash = `#/createur/${encodeURIComponent(s.dataset.creator)}`; };
    });
  }

  function matches(p) {
    const f = filters;
    if (f.q) {
      const hay = `${p.title} ${p.tagline} ${p.owner} ${p.genreText} ${p.platforms} ${(p.tags || []).join(' ')} ${p.genres.map((k) => lab(CAT.GENRES, k)).join(' ')} ${p.styles.map((k) => lab(CAT.STYLES, k)).join(' ')}`.toLowerCase();
      if (!f.q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    if (f.genres.length && !f.genres.some((k) => p.genres.includes(k))) return false;
    if (f.styles.length && !f.styles.some((k) => p.styles.includes(k))) return false;
    if (f.modes.length && !f.modes.some((k) => (p.modes || []).includes(k))) return false;
    if (f.platforms.length && !f.platforms.some((k) => (p.platformList || []).includes(k))) return false;
    if (f.stage && p.stage !== f.stage) return false;
    return true;
  }

  function sorted(list) {
    const l = list.slice();
    if (filters.sort === 'az') l.sort((a, b) => a.title.localeCompare(b.title, lang));
    else if (filters.sort === 'new') l.sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0));
    else l.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return l;
  }

  /** Puces de filtre : seulement les valeurs présentes dans le catalogue, avec leur nombre */
  function chipRow(key, list, caption, field) {
    const counts = {};
    hub.portals.forEach((p) => (p[field] || []).forEach((k) => { counts[k] = (counts[k] || 0) + 1; }));
    const present = list.filter(([k]) => counts[k] || filters[key].includes(k));
    if (!present.length) return '';
    return `<div class="chips" data-f="${key}"><span class="cap">${caption}</span>${present.map(([k]) =>
      `<button class="chip ${filters[key].includes(k) ? 'on' : ''}" data-k="${esc(k)}">${esc(lab(list, k))} <small>${counts[k] || 0}</small></button>`).join('')}</div>`;
  }

  function renderCatalog(main) {
    const all = hub.portals;
    const creators = Object.keys(hub.creators || {}).length;
    const featured = all.filter((p) => p.featured);
    const stages = CAT.STAGES.filter(([k]) => all.some((p) => p.stage === k));
    main.innerHTML = `
      <section class="hub-hero"><div class="wrap">
        <h1>${esc(hub.hubName)}</h1>
        <p class="lead">${esc(hub.hubTagline || T('Découvre les jeux en développement de la communauté : actualités, personnages, musique, mises à jour… tout au même endroit.', 'Discover the community\'s games in development: news, characters, music, updates… all in one place.'))}</p>
        <div class="hub-stats"><span><strong>${all.length}</strong>${T('jeu(x)', 'game(s)')}</span><span><strong>${creators}</strong>${T('créateur(s)', 'creator(s)')}</span>
          ${all.filter(isNew).length ? `<span><strong>${all.filter(isNew).length}</strong>${T('nouveauté(s) depuis ta dernière visite', 'new since your last visit')}</span>` : ''}</div>
        ${state.user ? '' : `<div class="guest-cta">${icon('sparkles')}<p>${T('Tu crées un jeu ? Connecte-toi pour accéder à ton studio (idées, GDD, personnages, musique…) et publier le portail de ton jeu ici.', 'Making a game? Log in to access your studio (ideas, GDD, characters, music…) and publish your game portal here.')}</p>
          <a class="btn" href="#/connexion">${T('Se connecter', 'Log in')}</a>${state.allowRegistration ? `<a class="btn primary" href="#/inscription">${T('Créer un compte', 'Sign up')}</a>` : ''}</div>`}
      </div></section>
      <div class="wrap">
        ${featured.length ? `<h2 class="section-title">${icon('star')} ${T('À la une', 'Featured')}</h2><div class="featured">${featured.map(gameCard).join('')}</div>` : ''}
        ${all.length ? `
        <h2 class="section-title">${icon('gamepad')} ${T('Tous les jeux', 'All games')}</h2>
        <div class="filters">
          <div class="filter-row">
            <div class="search">${icon('search')}<input class="input" id="q" placeholder="${T('Rechercher un jeu, un créateur, un mot-clé…', 'Search a game, a creator, a keyword…')}" value="${esc(filters.q)}"></div>
            ${stages.length ? `<select class="input" id="stage"><option value="">${T('Toutes les étapes', 'All stages')}</option>${stages.map(([k]) => `<option value="${k}" ${filters.stage === k ? 'selected' : ''}>${esc(lab(CAT.STAGES, k))}</option>`).join('')}</select>` : ''}
            <select class="input" id="sort">
              <option value="recent" ${filters.sort === 'recent' ? 'selected' : ''}>${T('Mis à jour récemment', 'Recently updated')}</option>
              <option value="new" ${filters.sort === 'new' ? 'selected' : ''}>${T('Derniers arrivés', 'Newest')}</option>
              <option value="az" ${filters.sort === 'az' ? 'selected' : ''}>${T('Nom (A → Z)', 'Name (A → Z)')}</option>
            </select>
          </div>
          ${chipRow('genres', CAT.GENRES, T('Genre', 'Genre'), 'genres')}
          ${chipRow('styles', CAT.STYLES, T('Style', 'Style'), 'styles')}
          ${chipRow('modes', CAT.MODES, T('Mode', 'Mode'), 'modes')}
          ${chipRow('platforms', CAT.PLATFORMS, T('Plateforme', 'Platform'), 'platformList')}
        </div>
        <div class="result-line"><span id="count"></span><button class="linkbtn" id="reset" hidden>${T('Effacer les filtres', 'Clear filters')}</button></div>
        <div class="grid" id="grid"></div>`
    : `<div class="empty">${icon('gamepad')}<h3>${T('Aucun jeu publié pour l\'instant', 'No game published yet')}</h3>
          <p>${T('Les portails des créateurs apparaîtront ici une fois validés par l\'administration.', 'Creators\' portals will appear here once approved by the administration.')}</p>
          ${state.user ? `<a class="btn primary" href="/studio/#/portal">${icon('rocket')} ${T('Publier mon jeu', 'Publish my game')}</a>` : ''}</div>`}
      </div>`;
    bindCards(main);
    if (!all.length) return;
    const draw = () => {
      const list = sorted(all.filter(matches));
      $('#grid').innerHTML = list.length ? list.map(gameCard).join('') : `<div class="empty" style="grid-column:1/-1">${icon('search')}<h3>${T('Aucun jeu ne correspond', 'No matching game')}</h3></div>`;
      $('#count').textContent = T(`${list.length} jeu(x)`, `${list.length} game(s)`);
      $('#reset').hidden = !(filters.q || filters.stage || filters.genres.length || filters.styles.length || filters.modes.length || filters.platforms.length);
      bindCards($('#grid'));
    };
    $('#q').addEventListener('input', (e) => { filters.q = e.target.value.trim().toLowerCase(); draw(); });
    const st = $('#stage');
    if (st) st.onchange = (e) => { filters.stage = e.target.value; draw(); };
    $('#sort').onchange = (e) => { filters.sort = e.target.value; draw(); };
    $$('.chips[data-f]', main).forEach((row) => {
      $$('.chip', row).forEach((b) => {
        b.onclick = () => {
          const arr = filters[row.dataset.f], k = b.dataset.k, i = arr.indexOf(k);
          if (i >= 0) arr.splice(i, 1); else arr.push(k);
          b.classList.toggle('on', arr.includes(k));
          draw();
        };
      });
    });
    $('#reset').onclick = () => { Object.assign(filters, { q: '', genres: [], styles: [], modes: [], platforms: [], stage: '' }); renderCatalog(main); };
    draw();
  }

  /* ---------------- Profil d'un créateur ---------------- */
  function renderCreator(main, username) {
    const c = (hub.creators || {})[username];
    const games = hub.portals.filter((p) => p.ownerUser === username);
    const isMe = state.user && state.user.username === username;
    if (!c && !isMe) {
      main.innerHTML = `<div class="wrap"><a class="back" href="#/">${icon('left')} ${T('Catalogue', 'Catalog')}</a><div class="empty">${icon('user')}<h3>${T('Aucun jeu publié par ce créateur', 'No game published by this creator')}</h3></div></div>`;
      return;
    }
    const name = c ? c.displayName : state.user.displayName;
    const bio = c ? c.bio : state.user.bio;
    main.innerHTML = `<div class="wrap">
      <a class="back" href="#/">${icon('left')} ${T('Catalogue', 'Catalog')}</a>
      <div class="profile"><span class="avatar xl">${esc(name.slice(0, 1).toUpperCase())}</span>
        <div><h1>${esc(name)}</h1><p class="faint">@${esc(username)} · ${games.length} ${T('jeu(x) publié(s)', 'published game(s)')}</p>${bio ? `<p>${esc(bio)}</p>` : ''}
        ${isMe ? `<p><a class="btn" href="/studio/#/settings">${icon('sliders')} ${T('Modifier mon profil', 'Edit my profile')}</a></p>` : ''}</div></div>
      ${games.length ? `<div class="grid" style="margin-top:20px">${games.map(gameCard).join('')}</div>`
    : `<div class="empty">${icon('gamepad')}<h3>${T('Pas encore de jeu publié', 'No published game yet')}</h3>${isMe ? `<a class="btn primary" href="/studio/#/portal">${icon('rocket')} ${T('Publier mon jeu', 'Publish my game')}</a>` : ''}</div>`}
    </div>`;
    bindCards(main);
  }

  /* ---------------- Connexion / inscription / installation ---------------- */
  function authForm(main, { title, sub, fields, submit, extra = '', onSubmit, cls = '' }) {
    main.innerHTML = `<div class="wrap"><form class="auth ${cls}" id="authForm" novalidate>
      <h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}
      ${fields.map((f) => `<label class="lbl" for="f_${f.name}">${f.label}</label><input class="input" id="f_${f.name}" name="${f.name}" type="${f.type || 'text'}" autocomplete="${f.ac || 'off'}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''} ${f.value ? `value="${esc(f.value)}"` : ''}>`).join('')}
      <div class="err" id="authErr" hidden></div>
      <div class="actions"><button class="btn primary block" type="submit">${submit}</button></div>
      ${extra}
    </form></div>`;
    const form = $('#authForm');
    const first = form.querySelector('input');
    if (first) first.focus();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      const data = Object.fromEntries(new FormData(form).entries());
      $('#authErr').hidden = true;
      btn.disabled = true;
      try { await onSubmit(data); } catch (err) {
        $('#authErr').textContent = err.message;
        $('#authErr').hidden = false;
        btn.disabled = false;
      }
    };
  }

  function renderLogin(main, params) {
    const ret = params.get('retour');
    authForm(main, {
      title: T('Connexion', 'Log in'),
      sub: ret && ret.startsWith('/studio') ? T('Connecte-toi pour ouvrir ton studio.', 'Log in to open your studio.') : T('Accède à ton studio et à tes jeux.', 'Access your studio and your games.'),
      fields: [
        { name: 'username', label: T("Nom d'utilisateur", 'Username'), ac: 'username' },
        { name: 'password', label: T('Mot de passe', 'Password'), type: 'password', ac: 'current-password' },
      ],
      submit: T('Se connecter', 'Log in'),
      extra: `${state.allowRegistration ? `<p class="alt">${T('Pas encore de compte ?', 'No account yet?')} <a href="#/inscription">${T('Créer un compte', 'Sign up')}</a></p>` : `<p class="note">${T("Pas de compte ? Demande à l'administrateur de la plateforme de t'en créer un.", 'No account? Ask the platform administrator to create one for you.')}</p>`}
        <p class="note">${T("Mot de passe oublié ? L'administrateur peut t'en attribuer un nouveau.", 'Forgot your password? The administrator can set a new one for you.')}</p>`,
      onSubmit: async (d) => {
        const r = await api('/api/auth/login', { username: d.username, password: d.password });
        state.user = r.user;
        location.assign(safeReturn(ret));
      },
    });
  }

  function renderRegister(main) {
    if (!state.allowRegistration) {
      main.innerHTML = `<div class="wrap"><div class="auth"><h1>${T('Inscriptions fermées', 'Registration closed')}</h1><p class="sub">${errText('registration_closed')}</p><p class="alt"><a href="#/connexion">${T('Se connecter', 'Log in')}</a></p></div></div>`;
      return;
    }
    authForm(main, {
      title: T('Créer un compte créateur', 'Create a creator account'),
      sub: T('Ton studio personnel : ajoute autant de jeux que tu veux, puis publie leur portail dans le catalogue.', 'Your personal studio: add as many games as you like, then publish their portal to the catalog.'),
      fields: [
        { name: 'username', label: T("Nom d'utilisateur (pour te connecter)", 'Username (to log in)'), ac: 'username', placeholder: T('ex. alex_dev', 'e.g. alex_dev') },
        { name: 'displayName', label: T('Nom affiché (studio, pseudo…)', 'Display name (studio, nickname…)'), placeholder: T('ex. Studio Néon', 'e.g. Neon Studio') },
        { name: 'password', label: T('Mot de passe (6 caractères min.)', 'Password (6 characters min.)'), type: 'password', ac: 'new-password' },
        { name: 'password2', label: T('Confirme le mot de passe', 'Confirm password'), type: 'password', ac: 'new-password' },
      ],
      submit: T('Créer mon compte', 'Create my account'),
      extra: `<p class="alt">${T('Déjà inscrit ?', 'Already registered?')} <a href="#/connexion">${T('Se connecter', 'Log in')}</a></p>`,
      onSubmit: async (d) => {
        if (d.password !== d.password2) throw new Error(errText('mismatch'));
        await api('/api/auth/register', { username: d.username.trim(), displayName: d.displayName.trim(), password: d.password });
        location.assign('/studio/');
      },
    });
  }

  function renderSetup(main) {
    if (!state.canSetup) {
      main.innerHTML = `<div class="wrap"><div class="auth"><h1>${T('Bientôt disponible', 'Coming soon')}</h1>
        <p class="sub">${T("La plateforme n'est pas encore configurée. L'administrateur doit d'abord l'ouvrir sur le PC qui l'héberge.", 'The platform is not set up yet. The administrator must first open it on the PC hosting it.')}</p></div></div>`;
      return;
    }
    authForm(main, {
      cls: 'auth-setup',
      title: T('Bienvenue dans DevPortals 👋', 'Welcome to DevPortals 👋'),
      sub: T("Première utilisation : crée le compte ADMINISTRATEUR. Tu pourras valider les jeux des créateurs avant leur publication, gérer les comptes et régler la plateforme.", 'First use: create the ADMINISTRATOR account. You will be able to review creators\' games before publication, manage accounts and configure the platform.'),
      fields: [
        { name: 'hubName', label: T('Nom de la plateforme (affiché sur le catalogue)', 'Platform name (shown on the catalog)'), value: 'DevPortals' },
        { name: 'username', label: T("Nom d'utilisateur administrateur", 'Administrator username'), ac: 'username', placeholder: 'admin' },
        { name: 'displayName', label: T('Nom affiché', 'Display name'), placeholder: T('ex. Ton nom ou ton studio', 'e.g. Your name or studio') },
        { name: 'password', label: T('Mot de passe (6 caractères min.)', 'Password (6 characters min.)'), type: 'password', ac: 'new-password' },
        { name: 'password2', label: T('Confirme le mot de passe', 'Confirm password'), type: 'password', ac: 'new-password' },
      ],
      submit: T('Créer le compte administrateur', 'Create the administrator account'),
      extra: `<p class="note">${T('Garde bien ce mot de passe. En cas d\'oubli, lance <code>DevPortals.bat --reset-password NOM</code> (ou <code>./lancer.sh --reset-password NOM</code>) dans le dossier de DevPortals.', 'Keep this password safe. If forgotten, run <code>DevPortals.bat --reset-password NAME</code> (or <code>./lancer.sh --reset-password NAME</code>) in the DevPortals folder.')}</p>`,
      onSubmit: async (d) => {
        if (d.password !== d.password2) throw new Error(errText('mismatch'));
        await api('/api/auth/setup', { hubName: d.hubName.trim(), username: d.username.trim(), displayName: d.displayName.trim(), password: d.password });
        location.assign('/studio/');
      },
    });
  }

  /* ---------------- Démarrage ---------------- */
  async function boot() {
    document.documentElement.lang = lang;
    try {
      state = await api('/api/auth/state');
    } catch (e) {
      $('#main').innerHTML = `<div class="wrap"><div class="empty"><h3>${T('Serveur injoignable', 'Server unreachable')}</h3><p>${esc(e.message)}</p></div></div>`;
      return;
    }
    if (state.user && state.user.role === 'admin') {
      try { pending = (await api('/api/admin/portals')).filter((p) => p.hasPending).length; } catch (e) { /* ignore */ }
    }
    await route();
    renderFoot();
    window.addEventListener('hashchange', route);
  }
  boot();
})();
