/* DevPortals — portail joueurs : lit data/site.json publié depuis le studio */
(function () {
  const esc = DP.util.esc;
  const md = (s) => DP.md.render(s || '');
  const $main = document.getElementById('main');
  const $top = document.getElementById('top');
  const $foot = document.getElementById('foot');
  let data = null;
  let lang = 'fr';
  let prevVisit = 0;
  const T = (fr, en) => (lang === 'en' ? en : fr);

  const STAGES = { concept: ['Concept', 'Concept'], prototype: ['Prototype', 'Prototype'], vslice: ['Vertical slice', 'Vertical slice'], alpha: ['Alpha', 'Alpha'],
    beta: ['Bêta', 'Beta'], early: ['Accès anticipé', 'Early access'], release: ['Disponible', 'Out now'] };

  const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '');
  const fmtDay = (d) => {
    if (!d) return '';
    const dt = typeof d === 'number' ? new Date(d) : new Date(`${d}T12:00:00`);
    if (isNaN(dt)) return esc(d);
    return dt.toLocaleDateString(lang === 'en' ? 'en-CA' : 'fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const initials = (n) => (String(n || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || '?').toUpperCase();
  const isNew = (it) => prevVisit && data.site.showNew && it.createdAt > prevVisit;
  const isUpd = (it) => prevVisit && data.site.showNew && !isNew(it) && it.updatedAt > prevVisit && (it.updatedAt - (it.createdAt || 0)) > 60000;
  const badge = (it) => (isNew(it) ? `<span class="badge">${T('NOUVEAU', 'NEW')}</span>` : isUpd(it) ? `<span class="badge upd">${T('MIS À JOUR', 'UPDATED')}</span>` : '');

  function setAccent(hex) {
    document.documentElement.style.setProperty('--accent', hex);
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (m) {
      const n = parseInt(m[1], 16);
      const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      document.documentElement.style.setProperty('--on-accent', lum > 0.62 ? '#0b0b0b' : '#ffffff');
    }
  }

  async function fetchData() {
    const r = await fetch(`data/site.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  }

  function trackVisit() {
    const key = `dp_visit_${data.site.title}`;
    try {
      const inSession = sessionStorage.getItem(key);
      if (inSession !== null) prevVisit = +inSession;
      else {
        prevVisit = +(localStorage.getItem(key) || 0);
        sessionStorage.setItem(key, String(prevVisit));
      }
      localStorage.setItem(key, String(Date.now()));
    } catch (e) { prevVisit = 0; }
  }

  /* ---------------- Navigation ---------------- */
  function navItems() {
    const s = data.site.sections || {};
    const items = [['', T('Accueil', 'Home')]];
    if (data.news.length) items.push(['news', T('Actualités', 'News')]);
    if (data.patches.length) items.push(['patches', T('Mises à jour', 'Updates')]);
    if (data.roadmap.length) items.push(['roadmap', T('Roadmap', 'Roadmap')]);
    Object.keys(data.types).forEach((t) => { if ((data.entities[t] || []).length && s[t] !== false) items.push([`t/${t}`, data.types[t].label]); });
    if (data.maps.length) items.push(['maps', T('Cartes', 'Maps')]);
    if (data.gallery.length) items.push(['gallery', T('Galerie', 'Gallery')]);
    if (data.faq.length) items.push(['faq', 'FAQ']);
    return items;
  }

  function renderTop(route) {
    $top.innerHTML = `<div class="wrap"><a class="brand" href="#/">${esc(data.site.title)}</a>
      <nav class="menu">${navItems().map(([r, l]) => `<a href="#/${r}" class="${(route || '') === r || (r && route.startsWith(r + '/')) ? 'on' : ''}">${esc(l)}</a>`).join('')}</nav></div>`;
  }

  function renderFoot() {
    const links = (data.site.links || []).map((l) => (safeUrl(l.url) ? `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.url)}</a>` : '')).filter(Boolean).join(' · ');
    $foot.innerHTML = `<div class="wrap"><span>© ${new Date().getFullYear()} ${esc(data.project.name || data.site.title)}${links ? ` · ${links}` : ''}</span>
      <span>${T('Mis à jour le', 'Updated on')} ${fmtDay(data.generatedAt)} · ${T('Propulsé par', 'Powered by')} DevPortals</span></div>`;
  }

  /* ---------------- Composants ---------------- */
  function itemCard(type, e) {
    const img = e.image;
    return `<a class="item" href="#/t/${type}/${esc(e.id)}">
      <div class="img" ${img ? `style="background-image:url('${esc(img)}')"` : ''}>${img ? '' : esc(type === 'tracks' ? '♪' : initials(e.name))}</div>
      <span class="corner">${badge(e)}</span>
      <div class="body"><strong>${esc(e.name)}</strong>${e.subtitle ? `<small>${esc(e.subtitle)}</small>` : ''}${e.blurb ? `<p>${esc(stripMd(e.blurb))}</p>` : ''}</div></a>`;
  }
  const stripMd = (s) => String(s || '').replace(/[#*_`>~|]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  function newsCard(n) {
    return `<a class="news ${n.cover ? '' : 'noimg'}" href="#/news/${esc(n.id)}">${n.cover ? `<div class="img" style="background-image:url('${esc(n.cover)}')"></div>` : ''}
      <div class="body"><small class="muted">${fmtDay(n.date)}</small> ${badge(n)}<h3>${esc(n.title)}</h3><p class="muted">${esc(stripMd(n.content).slice(0, 220))}${(n.content || '').length > 220 ? '…' : ''}</p>
      ${(n.tags || []).map((t) => `<span class="tagx">${esc(t)}</span>`).join('')}</div></a>`;
  }

  function patchCard(p) {
    const part = (k, lab) => (p[k] && p[k].length ? `<div class="${k}"><h4>${lab}</h4><ul>${p[k].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '');
    return `<div class="patch" id="v-${esc(p.id)}"><h3><span class="ver">${esc(p.version || '')}</span> ${esc(p.title || '')} <small class="muted">${fmtDay(p.date)}</small> ${badge(p)}</h3>
      ${part('added', T('Ajouté', 'Added'))}${part('changed', T('Modifié', 'Changed'))}${part('fixed', T('Corrigé', 'Fixed'))}${part('removed', T('Retiré', 'Removed'))}
      ${p.notes ? `<div class="md">${md(p.notes)}</div>` : ''}</div>`;
  }

  function msCard(m) {
    return `<div class="ms ${m.status}"><div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>${m.status === 'done' ? '✔ ' : ''}${esc(m.title)}</strong>
      <small class="muted">${m.date ? fmtDay(m.date) : ''}</small></div>${m.description ? `<p class="muted">${esc(m.description)}</p>` : ''}
      <div class="bar"><b style="width:${+m.progress || 0}%"></b></div><small class="muted">${+m.progress || 0} %</small></div></div>`;
  }

  /* ---------------- Pages ---------------- */
  function home() {
    const s = data.site, p = data.project;
    const pills = [p.genre, p.platforms, STAGES[p.stage] ? (lang === 'en' ? STAGES[p.stage][1] : STAGES[p.stage][0]) : '', p.releaseDate ? `${T('Sortie', 'Release')} : ${fmtDay(p.releaseDate)}` : '']
      .filter(Boolean).map((x) => `<span class="pill">${esc(x)}</span>`).join('');
    const links = (s.links || []).map((l) => (safeUrl(l.url) ? `<a class="btn" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || 'Lien')}</a>` : '')).join('');
    // Quoi de neuf ?
    const all = [];
    data.news.forEach((n) => all.push({ it: n, t: Math.max(n.createdAt || 0, n.updatedAt || 0), href: `#/news/${n.id}`, title: n.title, kind: T('Actualité', 'News'), img: n.cover }));
    data.patches.forEach((v) => all.push({ it: v, t: Math.max(v.createdAt || 0, v.updatedAt || 0), href: '#/patches', title: `${v.version} ${v.title || ''}`, kind: T('Mise à jour', 'Update') }));
    Object.keys(data.entities).forEach((t) => data.entities[t].forEach((e) => all.push({ it: e, t: Math.max(e.createdAt || 0, e.updatedAt || 0), href: `#/t/${t}/${e.id}`, title: e.name, kind: data.types[t].singular, img: e.image })));
    data.maps.forEach((m) => all.push({ it: m, t: Math.max(m.createdAt || 0, m.updatedAt || 0), href: `#/maps/${m.id}`, title: m.name, kind: T('Carte', 'Map'), img: m.image }));
    all.sort((a, b) => b.t - a.t);
    const fresh = prevVisit ? all.filter((x) => x.t > prevVisit) : all.slice(0, 8);
    const typeStrips = Object.keys(data.types).filter((t) => (data.entities[t] || []).length).map((t) => `
      <section class="block"><div class="wrap"><div class="sec-head"><h2>${esc(data.types[t].label)}</h2><a href="#/t/${t}">${T('Tout voir', 'See all')} →</a></div>
      <div class="grid">${data.entities[t].slice(0, 4).map((e) => itemCard(t, e)).join('')}</div></div></section>`).join('');
    $main.innerHTML = `
      <div class="hero" ${s.hero ? `style="background-image:url('${esc(s.hero)}')"` : ''}><div class="wrap">
        <h1>${esc(s.title)}</h1>${s.tagline ? `<p class="tag">${esc(s.tagline)}</p>` : ''}
        <div class="meta">${pills}</div>
        <div class="btns">${fresh.length ? `<a class="btn primary" href="#whatsnew">${T('Quoi de neuf ?', 'What\'s new?')} (${fresh.length})</a>` : ''}${links}</div>
      </div></div>
      ${fresh.length ? `<section class="block" id="whatsnew"><div class="wrap"><div class="sec-head"><h2>${prevVisit ? T('Nouveautés depuis ta dernière visite', 'New since your last visit') : T('Dernières nouveautés', 'Latest additions')}</h2></div>
        <div class="whatsnew">${fresh.slice(0, 12).map((x) => `<a class="wn" href="${esc(x.href)}"><span class="th" ${x.img ? `style="background-image:url('${esc(x.img)}')"` : ''}>${x.img ? '' : '★'}</span><span><strong>${esc(x.title)}</strong> ${badge(x.it)}<small>${esc(x.kind)} · ${fmtDay(x.t)}</small></span></a>`).join('')}</div></div></section>` : ''}
      ${s.about || s.storyTeaser ? `<section class="block"><div class="wrap" style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
        ${s.about ? `<div class="card md"><h2>${T('À propos', 'About')}</h2>${md(s.about)}</div>` : ''}
        ${s.storyTeaser ? `<div class="card md"><h2>${T('L\'histoire', 'The story')}</h2>${md(s.storyTeaser)}</div>` : ''}</div></section>` : ''}
      ${data.news.length ? `<section class="block"><div class="wrap"><div class="sec-head"><h2>${T('Actualités', 'News')}</h2><a href="#/news">${T('Toutes les actualités', 'All news')} →</a></div>
        <div class="list-col">${data.news.slice(0, 2).map(newsCard).join('')}</div></div></section>` : ''}
      ${data.patches.length ? `<section class="block"><div class="wrap"><div class="sec-head"><h2>${T('Dernière mise à jour', 'Latest update')}</h2><a href="#/patches">${T('Historique', 'History')} →</a></div>${patchCard(data.patches[0])}</div></section>` : ''}
      ${typeStrips}
      ${data.roadmap.length ? `<section class="block"><div class="wrap"><div class="sec-head"><h2>Roadmap</h2><a href="#/roadmap">${T('Voir tout', 'See all')} →</a></div>
        <div class="road">${data.roadmap.filter((m) => m.status !== 'done').slice(0, 3).map(msCard).join('') || data.roadmap.slice(-3).map(msCard).join('')}</div></div></section>` : ''}`;
  }

  function newsList() {
    $main.innerHTML = `<div class="wrap page"><h1>${T('Actualités', 'News')}</h1><div class="list-col">${data.news.map(newsCard).join('') || `<p class="empty">${T('Aucune actualité.', 'No news.')}</p>`}</div></div>`;
  }
  function newsPage(id) {
    const n = data.news.find((x) => x.id === id);
    if (!n) return notFound();
    $main.innerHTML = `<div class="wrap page"><article class="article"><a class="muted small" href="#/news">← ${T('Actualités', 'News')}</a>
      <h1>${esc(n.title)} ${badge(n)}</h1><small class="muted">${fmtDay(n.date)}</small> ${(n.tags || []).map((t) => `<span class="tagx">${esc(t)}</span>`).join('')}
      ${n.cover ? `<img class="cover" src="${esc(n.cover)}" alt="">` : ''}<div class="md">${md(n.content)}</div></article></div>`;
  }
  function patches() {
    $main.innerHTML = `<div class="wrap page"><h1>${T('Mises à jour', 'Updates')}</h1><div class="list-col">${data.patches.map(patchCard).join('') || `<p class="empty">—</p>`}</div></div>`;
  }
  function roadmap() {
    $main.innerHTML = `<div class="wrap page"><h1>Roadmap</h1><p class="muted">${T('Les grandes étapes du développement et leur avancement.', 'The major development milestones and their progress.')}</p><div class="road">${data.roadmap.map(msCard).join('')}</div></div>`;
  }
  function typeList(type) {
    const list = data.entities[type] || [];
    const def = data.types[type];
    if (!def) return notFound();
    if (type === 'tracks') {
      $main.innerHTML = `<div class="wrap page"><h1>${esc(def.label)}</h1><div class="tracks">${list.map((e) => `<div class="track"><a class="cov" href="#/t/tracks/${esc(e.id)}" ${e.image ? `style="background-image:url('${esc(e.image)}')"` : ''}>${e.image ? '' : '♪'}</a>
        <div><a href="#/t/tracks/${esc(e.id)}"><strong>${esc(e.name)}</strong></a> ${badge(e)}<br><small class="muted">${esc(e.subtitle || '')}</small>${e.audio ? `<audio controls preload="none" src="${esc(e.audio)}"></audio>` : ''}</div></div>`).join('')}</div></div>`;
      return;
    }
    $main.innerHTML = `<div class="wrap page"><h1>${esc(def.label)}</h1><div class="grid">${list.map((e) => itemCard(type, e)).join('')}</div></div>`;
  }
  function entityPage(type, id) {
    const e = (data.entities[type] || []).find((x) => x.id === id);
    if (!e) return notFound();
    const imgs = e.images && e.images.length ? e.images.filter(Boolean) : (e.image ? [e.image] : []);
    const val = (f) => {
      if (f.links) return f.links.map((l) => (l.public && data.entities[l.type] ? `<a class="lnk" href="#/t/${l.type}/${esc(l.id)}">${esc(l.name)}</a>` : esc(l.name)) + (l.note ? ` <span class="muted">(${esc(l.note)})</span>` : '')).join(', ');
      if (f.type === 'rating') return `<div class="rating"><div class="bar"><b style="width:${(+f.value || 0) * 10}%"></b></div><strong>${+f.value || 0}/10</strong></div>`;
      if (f.rows) return f.rows.map((r) => `${esc(r.k)} : <strong>${esc(r.v)}</strong>`).join('<br>');
      if (f.tags) return f.tags.map((t) => `<span class="tagx">${esc(t)}</span>`).join('');
      return esc(f.value);
    };
    $main.innerHTML = `<div class="wrap page"><a class="muted small" href="#/t/${type}">← ${esc(data.types[type].label)}</a>
      <h1>${esc(e.name)} ${badge(e)}</h1>${e.subtitle ? `<p class="muted" style="margin-top:-10px">${esc(e.subtitle)}</p>` : ''}
      <div class="detail">
        <div>
          ${imgs.length ? `<div class="main-img"><img id="mainImg" src="${esc(imgs[0])}" alt=""></div>
            ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button data-src="${esc(src)}" class="${i === 0 ? 'on' : ''}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : ''}` : ''}
          ${e.audio ? `<audio controls src="${esc(e.audio)}"></audio>` : ''}
          ${e.blurb ? `<div class="md" style="margin-top:16px">${md(e.blurb)}</div>` : ''}
        </div>
        <div class="card">${(e.groups || []).map((g) => `<div class="fgroup"><h3>${esc(g.label)}</h3>${g.fields.map((f) => `<div class="frow"><b>${esc(f.label)}</b><div class="val">${val(f)}</div></div>`).join('')}</div>`).join('') || `<p class="muted">—</p>`}
          ${(e.tags || []).length ? `<div style="margin-top:12px">${e.tags.map((t) => `<span class="tagx">${esc(t)}</span>`).join('')}</div>` : ''}</div>
      </div></div>`;
    $main.querySelectorAll('.thumbs button').forEach((b) => {
      b.onclick = () => { document.getElementById('mainImg').src = b.dataset.src; $main.querySelectorAll('.thumbs button').forEach((x) => x.classList.toggle('on', x === b)); };
    });
    const mi = document.getElementById('mainImg'); if (mi) mi.onclick = () => lightbox(mi.src);
  }
  function maps(id) {
    const m = data.maps.find((x) => x.id === id) || data.maps[0];
    if (!m) return notFound();
    $main.innerHTML = `<div class="wrap page"><h1>${esc(m.name)} ${badge(m)}</h1>
      ${data.maps.length > 1 ? `<p>${data.maps.map((x) => `<a class="btn sm ${x.id === m.id ? 'primary' : ''}" href="#/maps/${esc(x.id)}">${esc(x.name)}</a>`).join(' ')}</p>` : ''}
      ${m.description ? `<p class="muted">${esc(m.description)}</p>` : ''}
      <div class="map-box" id="mapBox"><img src="${esc(m.image)}" alt="">${m.markers.map((k, i) => `<button class="mk" data-i="${i}" style="left:${+k.x}%;top:${+k.y}%"><span class="pin" style="background:${esc(k.color || '#ef4444')}"></span><span class="lbl">${esc(k.label || '')}</span></button>`).join('')}</div></div>`;
    const box = document.getElementById('mapBox');
    box.addEventListener('click', (ev) => {
      const b = ev.target.closest('.mk');
      const old = box.querySelector('.popup'); if (old) old.remove();
      if (!b) return;
      const k = m.markers[+b.dataset.i];
      const pop = document.createElement('div');
      pop.className = 'popup';
      pop.style.left = `${Math.min(85, Math.max(15, +k.x))}%`; pop.style.top = `${+k.y}%`;
      pop.innerHTML = `<strong>${esc(k.label || '')}</strong>${k.note ? `<p class="muted small" style="margin:6px 0">${esc(k.note)}</p>` : ''}${k.link && data.entities[k.link.type] ? `<div style="margin-top:6px"><a href="#/t/${k.link.type}/${esc(k.link.id)}">${T('Voir la fiche', 'View sheet')} : ${esc(k.link.name)} →</a></div>` : ''}`;
      box.appendChild(pop);
    });
  }
  function gallery() {
    $main.innerHTML = `<div class="wrap page"><h1>${T('Galerie', 'Gallery')}</h1><div class="masonry">${data.gallery.map((g) => `<figure data-src="${esc(g.src)}"><img src="${esc(g.src)}" alt="" loading="lazy">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`).join('')}</div></div>`;
    $main.querySelectorAll('figure').forEach((f) => { f.onclick = () => lightbox(f.dataset.src); });
  }
  function faq() {
    $main.innerHTML = `<div class="wrap page"><h1>FAQ</h1>${data.faq.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><div class="md">${md(f.a)}</div></details>`).join('')}</div>`;
  }
  function notFound() { $main.innerHTML = `<div class="wrap empty"><h2>${T('Page introuvable', 'Page not found')}</h2><a class="btn" href="#/">${T('Accueil', 'Home')}</a></div>`; }
  function lightbox(src) {
    const d = document.createElement('div');
    d.className = 'lightbox';
    d.innerHTML = `<img src="${esc(src)}" alt="">`;
    d.onclick = () => d.remove();
    document.body.appendChild(d);
  }

  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    if (h === 'whatsnew') {
      if (!document.getElementById('whatsnew')) { renderTop(''); home(); }
      const w = document.getElementById('whatsnew'); if (w) w.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const [a, b, c] = h.split('/').map(decodeURIComponent);
    renderTop(h);
    window.scrollTo(0, 0);
    if (!a) home();
    else if (a === 'news') (b ? newsPage(b) : newsList());
    else if (a === 'patches') patches();
    else if (a === 'roadmap') roadmap();
    else if (a === 't') (c ? entityPage(b, c) : typeList(b));
    else if (a === 'maps') maps(b);
    else if (a === 'gallery') gallery();
    else if (a === 'faq') faq();
    else notFound();
    const title = data.site.title;
    document.title = a ? `${title} — ${(navItems().find(([r]) => r === a || (a === 't' && r === `t/${b}`)) || [0, ''])[1]}` : title;
  }

  function comingSoon() {
    $top.innerHTML = '';
    $main.innerHTML = `<div class="soon"><img src="icon.svg" alt=""><h1>${T('Bientôt disponible', 'Coming soon')}</h1><p class="muted">${T('Le portail de ce jeu n\'a pas encore été publié. Reviens bientôt !', 'This game\'s portal has not been published yet. Check back soon!')}</p></div>`;
    $foot.innerHTML = '';
  }

  function watchUpdates() {
    setInterval(async () => {
      try {
        const fresh = await fetchData();
        if (fresh.generatedAt !== data.generatedAt) {
          const bar = document.getElementById('refreshBar');
          bar.hidden = false;
          bar.innerHTML = `${T('Du nouveau contenu a été publié !', 'New content has been published!')} <button id="rf">${T('Actualiser', 'Refresh')}</button>`;
          document.getElementById('rf').onclick = () => location.reload();
        }
      } catch (e) { /* hors ligne ou retiré */ }
    }, 60000);
  }

  async function init() {
    try {
      data = await fetchData();
    } catch (e) {
      lang = (navigator.language || 'fr').startsWith('en') ? 'en' : 'fr';
      comingSoon();
      setTimeout(init, 30000);
      return;
    }
    ['news', 'patches', 'roadmap', 'maps', 'gallery', 'faq'].forEach((k) => { data[k] = data[k] || []; });
    data.types = data.types || {}; data.entities = data.entities || {};
    lang = data.lang === 'en' ? 'en' : 'fr';
    document.documentElement.lang = lang;
    setAccent(data.site.accent);
    trackVisit();
    renderFoot();
    route();
    window.addEventListener('hashchange', route);
    watchUpdates();
  }
  init();
})();
