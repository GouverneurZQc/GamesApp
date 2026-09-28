/* Vue : portail du jeu — contenu public, classement dans le catalogue, envoi à la validation */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas, CAT = DP.catalog;

  const STATUS = {
    draft: ['Pas encore envoyé', 'Not sent yet', ''],
    pending: ['En attente de validation', 'Waiting for review', 'warn'],
    live: ['En ligne dans le catalogue', 'Live in the catalog', 'pub'],
    rejected: ['Refusé par l\'administration', 'Rejected by the administration', 'bad'],
    removed: ['Retiré par l\'administration', 'Removed by the administration', 'bad'],
    withdrawn: ['Retiré du catalogue', 'Removed from the catalog', ''],
    approved: ['En ligne dans le catalogue', 'Live in the catalog', 'pub'],
  };
  DP.portalStatus = (st) => { const s = STATUS[st] || STATUS.draft; return { label: L(s), cls: s[2] }; };

  function chipSet(list, selected, key, max) {
    return `<div class="chips" data-cat="${key}" data-max="${max || 0}">${list.map(([k, lab]) =>
      `<button type="button" class="chip ${selected.includes(k) ? 'on' : ''}" data-k="${k}">${U.esc(L(lab))}</button>`).join('')}</div>`;
  }

  DP.views.portal = {
    title: () => T('Portail & catalogue', 'Portal & catalog'),
    async render(el) {
      const p = S.project, po = p.portal;
      po.catalog = po.catalog || { genres: [], styles: [], tags: [] };
      const cat = po.catalog;
      ['genres', 'styles', 'modes', 'platforms', 'tags'].forEach((k) => { cat[k] = cat[k] || []; });
      el.innerHTML = UI.spinner(T('Chargement…', 'Loading…'));
      let info = { portal: null, requireApproval: true };
      try { info = await DP.server.portal(p.id); } catch (e) { UI.toast(e.message, 'error'); }
      if (!DP.server.info) await DP.server.check();
      const pt = info.portal, needReview = info.requireApproval;
      const st = pt ? pt.status : 'draft';
      const stl = DP.portalStatus(st);
      const review = pt && pt.review;
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
      const urls = ((DP.server.info && DP.server.info.urls) || []).map((u) => pt ? `${u}g/${pt.slug}/` : u);
      const sendLabel = pt && pt.hasPending ? T('Renvoyer la version à jour', 'Resend the updated version') : needReview ? (pt && pt.live ? T('Soumettre la mise à jour', 'Submit the update') : T('Soumettre pour validation', 'Submit for review'))
        : (pt && pt.live ? T('Mettre à jour le portail', 'Update the portal') : T('Publier dans le catalogue', 'Publish to the catalog'));
      const noClass = !cat.genres.length && !cat.styles.length;

      el.innerHTML = `
        <div class="card portal-status">
          <div class="row gap wrap between">
            <div>
              <h3>${UI.icon('rocket')} ${T('Portail du jeu', 'Game portal')}</h3>
              <p><span class="tag ${stl.cls}" id="stTag">${U.esc(stl.label)}</span>
                ${pt && pt.live && pt.hasPending ? `<span class="tag warn">${T('Mise à jour en attente de validation', 'Update waiting for review')}</span>` : ''}
                ${po.dirty && po.lastPublished ? `<span class="tag warn">${T('Changements pas encore envoyés', 'Changes not sent yet')}</span>` : ''}</p>
              <p class="muted small">${pt && pt.submittedAt ? `${T('Dernier envoi', 'Last sent')} : ${U.fmtDate(pt.submittedAt)}` : T('Le portail est un mini-site public pour ton jeu, visible dans le catalogue de la plateforme une fois validé.', 'The portal is a small public website for your game, listed in the platform catalog once approved.')}
                ${pt && pt.approvedAt ? ` · ${T('En ligne depuis', 'Live since')} ${U.fmtDate(pt.approvedAt)}` : ''}</p>
            </div>
            ${pt ? `<div class="url-box">${UI.icon('link')}<code>/g/${U.esc(pt.slug)}/</code></div>` : ''}
          </div>
          ${review && review.note && ['rejected', 'removed', 'approved'].includes(review.decision) ? `
            <div class="banner ${review.decision === 'approved' ? 'ok' : 'warn'}">${UI.icon('chat')}<div><strong>${T('Message de l\'administration', 'Message from the administration')}</strong> <small class="muted">${U.fmtDate(review.at)}</small><br>${U.esc(review.note)}</div></div>` : ''}
          ${needReview && st !== 'pending' ? `<p class="muted small">${UI.icon('shield')} ${T('Avant d\'apparaître dans le catalogue, chaque envoi est vérifié par l\'administration. Tu peux continuer à travailler pendant ce temps.', 'Before appearing in the catalog, every submission is checked by the administration. You can keep working meanwhile.')}</p>` : ''}
          ${noClass ? `<div class="banner warn">${UI.icon('info')}<div>${T('Choisis au moins un genre et un style plus bas pour que les joueurs trouvent ton jeu dans le catalogue.', 'Pick at least one genre and one style below so players can find your game in the catalog.')}</div></div>` : ''}
          <div class="row gap wrap">
            <button class="btn primary" id="pubNow">${UI.icon(needReview ? 'send' : 'rocket')} ${sendLabel}</button>
            ${pt && (pt.hasPending || pt.live) ? `<a class="btn" href="/g/${U.esc(pt.slug)}/?preview=1" target="_blank">${UI.icon('eye')} ${T('Aperçu', 'Preview')}</a>` : ''}
            ${pt && pt.live ? `<a class="btn" href="/g/${U.esc(pt.slug)}/" target="_blank">${UI.icon('globe')} ${T('Voir en ligne', 'View live')}</a>` : ''}
            ${pt && pt.hasPending ? `<button class="btn ghost" id="cancelSub">${UI.icon('x')} ${T('Annuler l\'envoi', 'Cancel submission')}</button>` : ''}
            ${pt && pt.live ? `<button class="btn ghost danger-text" id="unpub">${UI.icon('eyeoff')} ${T('Retirer du catalogue', 'Remove from catalog')}</button>` : ''}
          </div>
          <div id="pubStatus"></div>
          ${pt && pt.live && urls.length ? `<details class="small"><summary class="muted">${T('Adresses pour les joueurs sur ton réseau', 'Addresses for players on your network')}</summary>
            <div class="stack">${urls.map((u) => `<div class="url-box">${UI.icon('globe')}<code>${U.esc(u)}</code><button class="btn sm" data-copy="${U.esc(u)}">${UI.icon('copy')}</button></div>`).join('')}</div></details>` : ''}
        </div>

        <div class="card">
          <h3>${UI.icon('grid')} ${T('Classement dans le catalogue', 'Catalog classification')}</h3>
          <p class="muted small">${T('Aide les joueurs à trouver ton jeu : ces choix servent aux filtres du catalogue public.', 'Help players find your game: these choices feed the public catalog filters.')}</p>
          <div class="grid2">
            <div>
              <span class="lbl">${T('Genres (3 max.)', 'Genres (max 3)')}</span>${chipSet(CAT.GENRES, cat.genres, 'genres', 3)}
              <span class="lbl">${T('Modes de jeu', 'Game modes')}</span>${chipSet(CAT.MODES, cat.modes, 'modes')}
              <span class="lbl">${T('Plateformes', 'Platforms')}</span>${chipSet(CAT.PLATFORMS, cat.platforms, 'platforms')}
            </div>
            <div>
              <span class="lbl">${T('Style visuel (4 max.)', 'Visual style (max 4)')}</span>${chipSet(CAT.STYLES, cat.styles, 'styles', 4)}
              <label class="field"><span class="lbl">${T('Mots-clés libres (séparés par des virgules)', 'Free keywords (comma-separated)')}</span>
                <input class="input" id="catTags" value="${U.esc(cat.tags.join(', '))}" placeholder="${T('ex. voitures, nuit, dérapage', 'e.g. cars, night, drifting')}"></label>
              <p class="muted small">${T('Étape affichée', 'Displayed stage')} : <strong>${U.esc(CAT.label(CAT.STAGES, p.meta.stage, DP.lang) || '—')}</strong> · <a href="#/dashboard">${T('modifier dans le tableau de bord', 'change in the dashboard')}</a></p>
            </div>
          </div>
        </div>

        <div class="grid2">
          <div class="card">
            <h3>${UI.icon('globe')} ${T('Contenu public', 'Public content')}</h3>
            <p class="muted small">${T('Coche les rubriques du site. Seuls les éléments marqués « Public » apparaissent.', 'Tick the site sections. Only items marked "Public" appear.')}</p>
            <div class="pub-summary">${secs.map(([k, lab, n, route]) => `<label class="ps"><input type="checkbox" data-sec="${k}" ${po.sections[k] !== false && !(k === 'story' && !po.sections.story) ? 'checked' : ''}><a href="#/${route}">${U.esc(L(lab))}</a><strong>${n}</strong></label>`).join('')}</div>
            <label class="check"><input type="checkbox" id="showNew" ${po.showNew !== false ? 'checked' : ''}> ${T('Afficher les badges « NOUVEAU » aux joueurs', 'Show "NEW" badges to players')}</label>
          </div>
          <div class="card">
            <h3>${UI.icon('eye')} ${T('Aperçu de la carte du catalogue', 'Catalog card preview')}</h3>
            <div class="hub-card-preview" id="cardPrev"></div>
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
      el.querySelector('#showNew').onchange = (e) => { po.showNew = e.target.checked; touch(); };
      el.querySelector('#heroBtn').onclick = async () => { const ids = await UI.pickImages({ title: T('Bannière du portail', 'Portal banner') }); if (ids && ids[0]) { po.hero = ids[0]; touch(); DP.app.route(); } };

      const drawCard = () => {
        const box = el.querySelector('#cardPrev');
        const cover = po.hero || p.meta.cover;
        const chips = [...cat.genres.map((k) => CAT.label(CAT.GENRES, k, DP.lang)), ...cat.styles.map((k) => CAT.label(CAT.STYLES, k, DP.lang))];
        box.innerHTML = `<div class="hc-cover" ${cover ? `data-bg-img="${cover}"` : ''}>${cover ? '' : UI.icon('gamepad')}</div>
          <div class="hc-body"><strong>${U.esc(po.title || p.name)}</strong><p class="muted small">${U.esc(U.truncate(po.tagline || p.meta.pitch || '', 110))}</p>
          <div>${chips.map((c) => `<span class="tag">${U.esc(c)}</span>`).join('')}</div>
          <small class="faint">${U.esc((S.user && S.user.displayName) || '')}${p.meta.stage ? ` · ${U.esc(CAT.label(CAT.STAGES, p.meta.stage, DP.lang))}` : ''}</small></div>`;
        DP.media.hydrate(box);
      };
      drawCard();
      el.querySelectorAll('[data-po]').forEach((inp) => inp.addEventListener('input', drawCard));
      el.querySelectorAll('.chips[data-cat]').forEach((box) => {
        const key = box.dataset.cat, max = +box.dataset.max;
        box.querySelectorAll('.chip').forEach((b) => {
          b.onclick = () => {
            const arr = cat[key], k = b.dataset.k, i = arr.indexOf(k);
            if (i >= 0) arr.splice(i, 1);
            else {
              if (max && arr.length >= max) { UI.toast(T(`${max} choix maximum`, `${max} choices maximum`), 'error'); return; }
              arr.push(k);
            }
            b.classList.toggle('on', arr.includes(k));
            touch(); drawCard();
          };
        });
      });
      el.querySelector('#catTags').addEventListener('input', (e) => { cat.tags = U.tagsFromString(e.target.value).slice(0, 15); touch(); });

      const stBox = el.querySelector('#pubStatus');
      el.querySelector('#pubNow').onclick = async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        try {
          const res = await DP.publisher.publish({ onProgress: (t) => { stBox.innerHTML = UI.spinner(t); } });
          stBox.innerHTML = '';
          if (res) UI.toast(res.published ? T('Portail publié dans le catalogue ✔', 'Portal published to the catalog ✔')
            : T('Envoyé ! L\'administration va vérifier ton portail avant sa mise en ligne.', 'Sent! The administration will check your portal before it goes live.'), 'success', 5000);
          DP.app.route();
        } catch (e) {
          stBox.innerHTML = `<div class="banner warn">${UI.icon('alert')}<div>${U.esc(e.message)}</div></div>`;
        } finally { b.disabled = false; }
      };
      const cancel = el.querySelector('#cancelSub');
      if (cancel) cancel.onclick = async () => {
        try { await DP.server.cancelPortal(p.id); DP.app.route(); } catch (e) { UI.toast(e.message, 'error'); }
      };
      const un = el.querySelector('#unpub');
      if (un) un.onclick = async () => {
        if (!(await UI.confirm(T('Retirer le portail du catalogue ? Il ne sera plus visible par les joueurs. Tu pourras le soumettre à nouveau plus tard.', 'Remove the portal from the catalog? Players will no longer see it. You can submit it again later.'), { danger: true }))) return;
        try { await DP.server.unpublishPortal(p.id); po.lastPublished = 0; await S.saveNow(); DP.app.route(); } catch (e) { UI.toast(e.message, 'error'); }
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
