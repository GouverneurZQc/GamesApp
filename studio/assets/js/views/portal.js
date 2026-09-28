/* Vue : portail joueurs — configuration du site public hébergé sur ce PC, publication */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;

  DP.views.portal = {
    title: () => T('Portail joueurs', 'Player portal'),
    async render(el) {
      await DP.server.check();
      DP.app.updateServerDot();
      const p = S.project, po = p.portal, sv = DP.server;
      const pubCount = (t) => p.entities[t].filter((e) => e.public).length;
      const secs = [
        ['news', ['Actualités (devlog)', 'News (devlog)'], p.devlog.posts.filter((x) => x.public).length, 'devlog/posts'],
        ['patches', ['Notes de version', 'Patch notes'], p.devlog.patches.filter((x) => x.public).length, 'devlog/patches'],
        ['roadmap', ['Roadmap (jalons)', 'Roadmap (milestones)'], p.milestones.filter((x) => x.public).length, 'tasks'],
        ...SC.PORTAL_TYPES.map((t) => [t, SC.ENTITIES[t].label, pubCount(t), `e/${t}`]),
        ['maps', ['Cartes du monde', 'World maps'], p.maps.filter((m) => m.public).length, 'map'],
        ['gallery', ['Galerie (médias + captures)', 'Gallery (media + captures)'], p.gallery.filter((g) => g.public && g.kind !== 'audio').length + p.captures.filter((c) => c.public).reduce((n, c) => n + c.images.length, 0), 'media'],
        ['story', ['Accroche de l\'histoire', 'Story teaser'], po.storyTeaser || p.story.logline ? 1 : 0, 'story'],
      ];
      const urls = (sv.info && sv.info.urls) || [];

      el.innerHTML = `
        ${sv.online ? `
        <div class="banner ok">${UI.icon('server')}<div><strong>${T('Serveur local actif', 'Local server running')}</strong> — ${T('les joueurs sur ton réseau peuvent visiter le portail à ces adresses :', 'players on your network can visit the portal at these addresses:')}</div></div>
        <div class="stack">${urls.map((u) => `<div class="url-box">${UI.icon('globe')}<code>${U.esc(u)}</code><button class="btn sm" data-copy="${U.esc(u)}">${UI.icon('copy')} ${T('Copier', 'Copy')}</button><a class="btn sm" href="${U.esc(u)}" target="_blank">${UI.icon('eye')}</a></div>`).join('')}
          <div class="url-box">${UI.icon('home')}<code>http://localhost:${sv.info.port}/</code><span class="muted small">${T('sur ce PC', 'on this PC')}</span><a class="btn sm" href="/" target="_blank">${UI.icon('eye')} ${T('Ouvrir', 'Open')}</a></div>
        </div>
        <p class="muted small">${T('Astuce : les joueurs doivent être sur le même réseau (Wi-Fi / maison / LAN). Pour Internet, redirige le port', 'Tip: players must be on the same network (Wi-Fi / home / LAN). For the Internet, forward port')} ${sv.info.port} ${T('dans ton routeur, ou utilise un tunnel (ex. Tailscale, ngrok). Au premier lancement, autorise PowerShell dans le pare-feu Windows (réseaux privés).', 'in your router, or use a tunnel (e.g. Tailscale, ngrok). On first launch, allow PowerShell in the Windows firewall (private networks).')}</p>`
        : `
        <div class="banner warn">${UI.icon('server')}<div><strong>${T('Serveur local non lancé', 'Local server not running')}</strong><br>
          ${T('Le portail est un mini site web hébergé sur ce PC. Pour l\'activer, ferme cette page et lance DevPortals avec <b>DevPortals.bat</b> (Windows) ou <b>lancer.sh</b> (Mac / Linux). Tu peux quand même préparer le contenu ici.', 'The portal is a small website hosted on this PC. To enable it, close this page and start DevPortals with <b>DevPortals.bat</b> (Windows) or <b>lancer.sh</b> (Mac / Linux). You can still prepare the content here.')}</div></div>`}

        <div class="grid2">
          <div class="card">
            <h3>${UI.icon('rocket')} ${T('Publication', 'Publishing')}</h3>
            <p>${po.lastPublished ? `${T('Dernière publication', 'Last published')} : <strong>${U.fmtDate(po.lastPublished)}</strong>` : T('Jamais publié.', 'Never published.')}
              ${po.dirty && po.lastPublished ? `<br><span class="tag warn">${T('Des changements ne sont pas encore publiés', 'Some changes are not published yet')}</span>` : ''}</p>
            <div class="row gap wrap">
              <button class="btn primary" id="pubNow" ${sv.online ? '' : 'disabled'}>${UI.icon('rocket')} ${T('Publier maintenant', 'Publish now')}</button>
              ${sv.online ? `<a class="btn" href="/" target="_blank">${UI.icon('eye')} ${T('Voir le portail', 'View portal')}</a>` : ''}
              ${sv.online && po.lastPublished ? `<button class="btn ghost danger-text" id="unpub">${UI.icon('eyeoff')} ${T('Retirer', 'Unpublish')}</button>` : ''}
            </div>
            <div id="pubStatus"></div>
            <label class="check"><input type="checkbox" id="autoPub" ${po.autoPublish ? 'checked' : ''}> ${T('Republier automatiquement après mes modifications (1 min après)', 'Automatically republish after my changes (1 min later)')}</label>
            <label class="check"><input type="checkbox" id="showNew" ${po.showNew !== false ? 'checked' : ''}> ${T('Afficher les badges « NOUVEAU » aux joueurs', 'Show "NEW" badges to players')}</label>
          </div>
          <div class="card">
            <h3>${UI.icon('globe')} ${T('Contenu public', 'Public content')}</h3>
            <p class="muted small">${T('Coche les rubriques du site. Seuls les éléments marqués « Public » apparaissent.', 'Tick the site sections. Only items marked "Public" appear.')}</p>
            <div class="pub-summary">${secs.map(([k, lab, n, route]) => `<label class="ps"><input type="checkbox" data-sec="${k}" ${po.sections[k] !== false && !(k === 'story' && !po.sections.story) ? 'checked' : ''}><a href="#/${route}">${U.esc(L(lab))}</a><strong>${n}</strong></label>`).join('')}</div>
          </div>
        </div>

        <div class="card">
          <h3>${UI.icon('edit')} ${T('Page d\'accueil du portail', 'Portal home page')}</h3>
          <div class="fields">
            <label class="field"><span class="lbl">${T('Titre du site', 'Site title')}</span><input class="input" data-po="title" value="${U.esc(po.title)}" placeholder="${U.esc(p.name)}"></label>
            <label class="field"><span class="lbl">${T('Accroche', 'Tagline')}</span><input class="input" data-po="tagline" value="${U.esc(po.tagline)}" placeholder="${U.esc(p.meta.pitch || T('Le jeu qui…', 'The game that…'))}"></label>
            <label class="field"><span class="lbl">${T('Langue du portail', 'Portal language')}</span><select class="input" data-po="lang">${UI.options([['fr', ['Français', 'French']], ['en', ['Anglais', 'English']]], po.lang || 'fr')}</select></label>
            <div class="field"><span class="lbl">${T('Bannière', 'Banner')}</span><div class="row gap">${po.hero || p.meta.cover ? `<img data-img="${po.hero || p.meta.cover}" style="height:40px;border-radius:6px" alt="">` : ''}<button class="btn sm" id="heroBtn">${UI.icon('image')} ${T('Choisir', 'Choose')}</button></div></div>
            <label class="field wide"><span class="lbl">${T('À propos du jeu (Markdown)', 'About the game (Markdown)')}</span><textarea class="input auto" rows="5" data-po="about" placeholder="${T('Présente le jeu aux joueurs : univers, gameplay, plateformes, date de sortie…', 'Introduce the game: world, gameplay, platforms, release date…')}">${U.esc(po.about)}</textarea></label>
            <label class="field wide"><span class="lbl">${T('Accroche de l\'histoire (sans spoiler)', 'Story teaser (spoiler-free)')}</span><textarea class="input auto" rows="3" data-po="storyTeaser" placeholder="${U.esc(p.story.logline || '')}">${U.esc(po.storyTeaser || '')}</textarea></label>
          </div>
        </div>

        <div class="grid2">
          <div class="card">
            <h3>${UI.icon('link')} ${T('Liens (Steam, Discord, réseaux…)', 'Links (Steam, Discord, social…)')}</h3>
            <div class="widget kv links-edit" id="links"></div>
          </div>
          <div class="card">
            <h3>${UI.icon('info')} ${T('FAQ', 'FAQ')}</h3>
            <div class="stack" id="faq"></div>
            <button class="btn sm ghost" id="faqAdd">${UI.icon('plus')} ${T('Ajouter une question', 'Add a question')}</button>
          </div>
        </div>`;

      DP.media.hydrate(el); UI.autoGrow(el);
      const touch = () => S.touch();
      el.querySelectorAll('[data-copy]').forEach((b) => { b.onclick = async () => { await U.copyText(b.dataset.copy); UI.toast(T('Adresse copiée', 'Address copied'), 'success'); }; });
      el.querySelectorAll('[data-po]').forEach((inp) => inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', () => { po[inp.dataset.po] = inp.value; touch(); }));
      el.querySelectorAll('[data-sec]').forEach((cb) => { cb.onchange = () => { po.sections[cb.dataset.sec] = cb.checked; touch(); }; });
      el.querySelector('#autoPub').onchange = (e) => { po.autoPublish = e.target.checked; touch(); };
      el.querySelector('#showNew').onchange = (e) => { po.showNew = e.target.checked; touch(); };
      el.querySelector('#heroBtn').onclick = async () => { const ids = await UI.pickImages({ title: T('Bannière du portail', 'Portal banner') }); if (ids && ids[0]) { po.hero = ids[0]; touch(); DP.app.route(); } };

      const st = el.querySelector('#pubStatus');
      el.querySelector('#pubNow').onclick = async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        try {
          await DP.publisher.publish({ onProgress: (t) => { st.innerHTML = UI.spinner(t); } });
          st.innerHTML = '';
          DP.app.route();
        } catch (e) {
          st.innerHTML = `<div class="banner warn">${UI.icon('alert')}<div>${U.esc(e.message)}</div></div>`;
        } finally { b.disabled = false; }
      };
      const un = el.querySelector('#unpub');
      if (un) un.onclick = async () => {
        if (!(await UI.confirm(T('Retirer le portail ? Les joueurs verront une page « bientôt disponible ».', 'Unpublish the portal? Players will see a "coming soon" page.'), { danger: true }))) return;
        await DP.server.unpublish(); po.lastPublished = 0; await S.saveNow(); DP.app.route();
      };

      po.links = po.links || [];
      DP.widgets.kv(el.querySelector('#links'), () => po.links.map((l) => ({ k: l.label, v: l.url })), (rows) => { po.links = rows.map((r) => ({ label: r.k, url: r.v })); touch(); },
        { k: ['Nom (ex. Steam)', 'Name (e.g. Steam)'], v: ['https://…', 'https://…'] });

      const faqEl = el.querySelector('#faq');
      const drawFaq = () => {
        faqEl.innerHTML = (po.faq || []).map((f, i) => `<div class="note"><div class="row gap"><input class="input sm grow" data-fq="${i}" value="${U.esc(f.q)}" placeholder="${T('Question', 'Question')}"><button class="btn icon sm ghost" data-fx="${i}">${UI.icon('x')}</button></div>
          <textarea class="input sm auto" data-fa="${i}" rows="2" placeholder="${T('Réponse', 'Answer')}" style="margin-top:6px">${U.esc(f.a)}</textarea></div>`).join('');
        faqEl.querySelectorAll('[data-fq]').forEach((i) => i.addEventListener('input', () => { po.faq[+i.dataset.fq].q = i.value; touch(); }));
        faqEl.querySelectorAll('[data-fa]').forEach((i) => i.addEventListener('input', () => { po.faq[+i.dataset.fa].a = i.value; touch(); }));
        faqEl.querySelectorAll('[data-fx]').forEach((b) => { b.onclick = () => { po.faq.splice(+b.dataset.fx, 1); touch(); drawFaq(); }; });
        UI.autoGrow(faqEl);
      };
      drawFaq();
      el.querySelector('#faqAdd').onclick = () => { po.faq = po.faq || []; po.faq.push({ q: '', a: '' }); touch(); drawFaq(); };
    },
  };
})();
