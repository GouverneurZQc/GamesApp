/* Vue : administration — validation des portails, catalogue, comptes, réglages de la plateforme */
(function () {
  const U = DP.util, UI = DP.ui, API = DP.api, CAT = DP.catalog;

  const TABS = [
    ['review', 'shield', ['À valider', 'To review']],
    ['portals', 'globe', ['Portails', 'Portals']],
    ['users', 'users', ['Comptes', 'Accounts']],
    ['platform', 'sliders', ['Plateforme', 'Platform']],
  ];

  const chipsOf = (m) => [
    ...(m.genres || []).map((k) => CAT.label(CAT.GENRES, k, DP.lang)),
    ...(m.styles || []).map((k) => CAT.label(CAT.STYLES, k, DP.lang)),
  ].map((c) => `<span class="tag">${U.esc(c)}</span>`).join('');

  const countsOf = (m) => {
    const c = (m && m.counts) || {};
    const parts = Object.entries(c).filter(([, n]) => n).map(([k, n]) => {
      const lab = DP.schemas.ENTITIES[k] ? L(DP.schemas.ENTITIES[k].label) : ({ news: T('actus', 'news'), patches: T('versions', 'patches'), maps: T('cartes', 'maps'), gallery: T('images', 'images') })[k] || k;
      return `${n} ${U.esc(String(lab).toLowerCase())}`;
    });
    return parts.join(' · ');
  };

  const coverOf = (p, m) => (m && m.cover ? `/g/${encodeURIComponent(p.slug)}/${m.cover}` : '');

  DP.admin = {
    pending: 0,
    async refreshBadge() {
      if (!DP.store.user || DP.store.user.role !== 'admin') return;
      try {
        const list = await API('/api/admin/portals');
        DP.admin.pending = list.filter((p) => p.hasPending).length;
        DP.app.refreshNav();
      } catch (e) { /* ignore */ }
    },
  };

  DP.views.admin = {
    title: () => T('Administration', 'Administration'),
    async render(el, params) {
      if (!DP.store.user || DP.store.user.role !== 'admin') {
        el.innerHTML = UI.empty('shield', T('Réservé aux administrateurs', 'Administrators only'));
        return;
      }
      const tab = TABS.some((t) => t[0] === params.id) ? params.id : 'review';
      el.innerHTML = `
        <div class="tabs">${TABS.map(([k, ic, lab]) => `<a class="tab ${k === tab ? 'on' : ''}" href="#/admin/${k}">${UI.icon(ic)} ${U.esc(L(lab))}${k === 'review' && DP.admin.pending ? ` <em class="badge">${DP.admin.pending}</em>` : ''}</a>`).join('')}</div>
        <div id="adm">${UI.spinner(T('Chargement…', 'Loading…'))}</div>`;
      const box = el.querySelector('#adm');
      try {
        if (tab === 'review') await renderReview(box);
        else if (tab === 'portals') await renderPortals(box);
        else if (tab === 'users') await renderUsers(box);
        else await renderPlatform(box);
      } catch (e) {
        box.innerHTML = `<div class="banner warn">${UI.icon('alert')}<div>${U.esc(e.message)}</div></div>`;
      }
    },
  };

  async function renderReview(box) {
    const all = await API('/api/admin/portals');
    const list = all.filter((p) => p.hasPending);
    DP.admin.pending = list.length;
    DP.app.refreshNav();
    box.innerHTML = list.length ? `
      <p class="muted">${T('Ouvre l\'aperçu de chaque portail, vérifie que tout est en ordre (contenu, images, textes), puis approuve ou refuse avec un message pour le créateur.', 'Open each portal preview, check everything is in order (content, images, texts), then approve or reject with a message for the creator.')}</p>
      <div class="review-list">${list.map((p) => {
        const m = p.pendingMeta || {};
        const cover = coverOf(p, m);
        return `<div class="card review-item">
          <div class="rv-cover" ${cover ? `style="background-image:url('${U.esc(cover)}?preview=1')"` : ''}>${cover ? '' : UI.icon('gamepad')}</div>
          <div class="rv-body">
            <div class="row gap wrap"><strong class="rv-title">${U.esc(m.title || p.slug)}</strong>
              <span class="tag ${p.live ? '' : 'warn'}">${p.live ? T('Mise à jour d\'un portail en ligne', 'Update of a live portal') : T('Nouveau portail', 'New portal')}</span></div>
            <p class="muted small">${T('par', 'by')} <strong>${U.esc(p.ownerName)}</strong> · ${T('envoyé', 'sent')} ${U.relTime(p.submittedAt)} · <code>/g/${U.esc(p.slug)}/</code></p>
            ${m.tagline ? `<p>${U.esc(m.tagline)}</p>` : ''}
            <div>${chipsOf(m) || `<span class="tag warn">${T('Aucun genre ni style choisi', 'No genre or style chosen')}</span>`}</div>
            <p class="faint small">${countsOf(m) || T('Aucun contenu public', 'No public content')}</p>
            <div class="row gap wrap">
              <a class="btn" href="/g/${encodeURIComponent(p.slug)}/?preview=1" target="_blank">${UI.icon('eye')} ${T('Ouvrir l\'aperçu', 'Open preview')}</a>
              <button class="btn primary" data-approve="${U.esc(p.slug)}">${UI.icon('tick')} ${T('Approuver', 'Approve')}</button>
              <button class="btn ghost danger-text" data-reject="${U.esc(p.slug)}">${UI.icon('x')} ${T('Refuser', 'Reject')}</button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>`
      : UI.empty('shield', T('Rien à valider', 'Nothing to review'), T('Les portails envoyés par les créateurs apparaîtront ici avant d\'être publiés dans le catalogue.', 'Portals sent by creators will appear here before being published to the catalog.'));
    box.querySelectorAll('[data-approve]').forEach((b) => {
      b.onclick = async () => {
        const note = await UI.ask(T('Approuver ce portail', 'Approve this portal'), { label: T('Message pour le créateur (optionnel)', 'Message for the creator (optional)'), multiline: true, placeholder: T('ex. Super boulot !', 'e.g. Great job!') });
        if (note === null || note === undefined) return;
        try {
          await API(`/api/admin/portals/${b.dataset.approve}/approve`, { method: 'POST', body: { note } });
          UI.toast(T('Portail approuvé et publié dans le catalogue', 'Portal approved and published to the catalog'), 'success');
          renderReview(box);
        } catch (e) { UI.toast(e.message, 'error'); }
      };
    });
    box.querySelectorAll('[data-reject]').forEach((b) => {
      b.onclick = async () => {
        const note = await UI.ask(T('Refuser ce portail', 'Reject this portal'), { label: T('Explique au créateur ce qu\'il doit corriger', 'Tell the creator what to fix'), multiline: true });
        if (note === null || note === undefined) return;
        if (!String(note).trim()) { UI.toast(T('Ajoute un message pour que le créateur sache quoi corriger.', 'Add a message so the creator knows what to fix.'), 'error'); return; }
        try {
          await API(`/api/admin/portals/${b.dataset.reject}/reject`, { method: 'POST', body: { note } });
          UI.toast(T('Portail refusé — le créateur verra ton message', 'Portal rejected — the creator will see your message'), 'success');
          renderReview(box);
        } catch (e) { UI.toast(e.message, 'error'); }
      };
    });
  }

  async function renderPortals(box) {
    const list = await API('/api/admin/portals');
    let q = '';
    const draw = () => {
      const f = list.filter((p) => !q || `${(p.meta && p.meta.title) || ''} ${(p.pendingMeta && p.pendingMeta.title) || ''} ${p.ownerName} ${p.slug}`.toLowerCase().includes(q));
      box.querySelector('#plist').innerHTML = f.length ? `<table class="table"><thead><tr><th>${T('Jeu', 'Game')}</th><th>${T('Créateur', 'Creator')}</th><th>${T('État', 'Status')}</th><th>${T('Mis à jour', 'Updated')}</th><th></th></tr></thead><tbody>
        ${f.map((p) => {
          const m = p.live ? p.meta : p.pendingMeta;
          const stl = DP.portalStatus(p.status);
          return `<tr>
            <td><strong>${U.esc((m && m.title) || p.slug)}</strong><br><small class="faint">/g/${U.esc(p.slug)}/</small></td>
            <td>${U.esc(p.ownerName)}</td>
            <td><span class="tag ${stl.cls}">${U.esc(stl.label)}</span>${p.live && p.hasPending ? ` <span class="tag warn">${T('màj en attente', 'update pending')}</span>` : ''}${p.featured ? ` <span class="tag pub">★ ${T('À la une', 'Featured')}</span>` : ''}</td>
            <td><small class="muted">${U.relTime(p.updatedAt)}</small></td>
            <td class="row gap end">
              ${p.live ? `<a class="btn sm" href="/g/${encodeURIComponent(p.slug)}/" target="_blank" title="${T('Voir', 'View')}">${UI.icon('eye')}</a>
                <button class="btn sm ${p.featured ? 'primary' : ''}" data-feat="${U.esc(p.slug)}" data-on="${p.featured ? 1 : 0}" title="${T('Mettre à la une', 'Feature')}">${UI.icon('star')}</button>
                <button class="btn sm ghost danger-text" data-unpub="${U.esc(p.slug)}" title="${T('Retirer du catalogue', 'Remove from catalog')}">${UI.icon('eyeoff')}</button>`
                : p.hasPending ? `<a class="btn sm" href="#/admin/review">${T('Valider', 'Review')}</a>` : ''}
            </td></tr>`;
        }).join('')}</tbody></table>` : UI.empty('globe', T('Aucun portail', 'No portal'));
      box.querySelectorAll('[data-feat]').forEach((b) => {
        b.onclick = async () => {
          try {
            const r = await API(`/api/admin/portals/${b.dataset.feat}/feature`, { method: 'POST', body: { featured: b.dataset.on !== '1' } });
            Object.assign(list.find((x) => x.slug === b.dataset.feat), r.portal);
            draw();
          } catch (e) { UI.toast(e.message, 'error'); }
        };
      });
      box.querySelectorAll('[data-unpub]').forEach((b) => {
        b.onclick = async () => {
          const note = await UI.ask(T('Retirer ce portail du catalogue', 'Remove this portal from the catalog'), { label: T('Raison (visible par le créateur)', 'Reason (visible to the creator)'), multiline: true });
          if (note === null || note === undefined) return;
          try {
            const r = await API(`/api/admin/portals/${b.dataset.unpub}/unpublish`, { method: 'POST', body: { note } });
            Object.assign(list.find((x) => x.slug === b.dataset.unpub), r.portal);
            UI.toast(T('Portail retiré', 'Portal removed'), 'success');
            draw();
          } catch (e) { UI.toast(e.message, 'error'); }
        };
      });
    };
    box.innerHTML = `<div class="search mb">${UI.icon('search')}<input class="input" id="pq" placeholder="${T('Filtrer par jeu, créateur…', 'Filter by game, creator…')}"></div><div id="plist"></div>`;
    box.querySelector('#pq').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
    draw();
  }

  async function renderUsers(box) {
    const list = await API('/api/admin/users');
    const me = DP.store.user;
    box.innerHTML = `
      <div class="card">
        <h3>${UI.icon('plus')} ${T('Créer un compte', 'Create an account')}</h3>
        <div class="row gap wrap">
          <input class="input" id="nuName" placeholder="${T('Nom d\'utilisateur', 'Username')}" autocomplete="off" style="max-width:200px">
          <input class="input" id="nuDisp" placeholder="${T('Nom affiché (optionnel)', 'Display name (optional)')}" style="max-width:200px">
          <input class="input" id="nuPw" type="text" placeholder="${T('Mot de passe provisoire', 'Temporary password')}" autocomplete="off" style="max-width:200px">
          <select class="input" id="nuRole" style="width:auto"><option value="user">${T('Créateur', 'Creator')}</option><option value="admin">${T('Administrateur', 'Administrator')}</option></select>
          <button class="btn primary" id="nuGo">${UI.icon('plus')} ${T('Créer', 'Create')}</button>
        </div>
      </div>
      <table class="table"><thead><tr><th>${T('Compte', 'Account')}</th><th>${T('Rôle', 'Role')}</th><th>${T('Projets', 'Projects')}</th><th>${T('Dernière connexion', 'Last login')}</th><th></th></tr></thead><tbody>
      ${list.map((u) => `<tr class="${u.disabled ? 'dim' : ''}">
        <td><strong>${U.esc(u.displayName)}</strong> <small class="faint">@${U.esc(u.username)}</small>${u.id === me.id ? ` <span class="tag">${T('toi', 'you')}</span>` : ''}${u.disabled ? ` <span class="tag bad">${T('désactivé', 'disabled')}</span>` : ''}</td>
        <td><select class="input sm" data-role="${u.id}" ${u.id === me.id ? 'disabled' : ''}><option value="user" ${u.role === 'user' ? 'selected' : ''}>${T('Créateur', 'Creator')}</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>${T('Administrateur', 'Administrator')}</option></select></td>
        <td>${u.projects} <small class="faint">· ${u.portals} ${T('en ligne', 'live')}</small></td>
        <td><small class="muted">${u.lastLogin ? U.relTime(u.lastLogin) : T('jamais', 'never')}</small></td>
        <td class="row gap end">
          <button class="btn sm ghost" data-pw="${u.id}" title="${T('Nouveau mot de passe', 'New password')}">${UI.icon('shield')}</button>
          ${u.id === me.id ? '' : `<button class="btn sm ghost" data-dis="${u.id}" data-on="${u.disabled ? 1 : 0}" title="${u.disabled ? T('Réactiver', 'Enable') : T('Désactiver', 'Disable')}">${UI.icon(u.disabled ? 'eye' : 'eyeoff')}</button>
          <button class="btn sm ghost danger-text" data-deluser="${u.id}" title="${T('Supprimer', 'Delete')}">${UI.icon('trash')}</button>`}
        </td></tr>`).join('')}</tbody></table>`;
    const reload = () => renderUsers(box);
    const act = async (fn, ok) => { try { await fn(); if (ok) UI.toast(ok, 'success'); reload(); } catch (e) { UI.toast(e.message, 'error'); reload(); } };
    box.querySelector('#nuGo').onclick = () => act(() => API('/api/admin/users', { method: 'POST', body: {
      username: box.querySelector('#nuName').value.trim(), displayName: box.querySelector('#nuDisp').value.trim(),
      password: box.querySelector('#nuPw').value, role: box.querySelector('#nuRole').value } }), T('Compte créé', 'Account created'));
    box.querySelectorAll('[data-role]').forEach((s) => { s.onchange = () => act(() => API(`/api/admin/users/${s.dataset.role}`, { method: 'POST', body: { role: s.value } }), T('Rôle modifié', 'Role changed')); });
    box.querySelectorAll('[data-dis]').forEach((b) => { b.onclick = () => act(() => API(`/api/admin/users/${b.dataset.dis}`, { method: 'POST', body: { disabled: b.dataset.on !== '1' } })); });
    box.querySelectorAll('[data-pw]').forEach((b) => {
      b.onclick = async () => {
        const pw = await UI.ask(T('Nouveau mot de passe', 'New password'), { label: T('6 caractères minimum — communique-le à la personne', '6 characters minimum — give it to the person') });
        if (pw) act(() => API(`/api/admin/users/${b.dataset.pw}`, { method: 'POST', body: { password: pw } }), T('Mot de passe modifié', 'Password changed'));
      };
    });
    box.querySelectorAll('[data-deluser]').forEach((b) => {
      b.onclick = async () => {
        const u = list.find((x) => x.id === b.dataset.deluser);
        if (!(await UI.confirm(T(`Supprimer le compte « ${u.username} », ses projets et ses portails ? Une copie est gardée dans le dossier corbeille du serveur.`, `Delete account "${u.username}", its projects and portals? A copy is kept in the server's trash folder.`), { danger: true, ok: T('Supprimer', 'Delete') }))) return;
        act(() => API(`/api/admin/users/${u.id}`, { method: 'DELETE' }), T('Compte supprimé', 'Account deleted'));
      };
    });
  }

  async function renderPlatform(box) {
    const cfg = await API('/api/admin/config');
    const info = DP.server.info || {};
    box.innerHTML = `
      <div class="card">
        <h3>${UI.icon('globe')} ${T('Catalogue public', 'Public catalog')}</h3>
        <div class="fields">
          <label class="field"><span class="lbl">${T('Nom de la plateforme', 'Platform name')}</span><input class="input" id="cName" maxlength="60" value="${U.esc(cfg.hubName)}"></label>
          <label class="field wide"><span class="lbl">${T('Phrase d\'accueil', 'Welcome line')}</span><input class="input" id="cTag" maxlength="300" value="${U.esc(cfg.hubTagline || '')}" placeholder="${T('ex. Les jeux de notre communauté, en développement', 'e.g. Our community\'s games, in development')}"></label>
        </div>
        <label class="check"><input type="checkbox" id="cReg" ${cfg.allowRegistration ? 'checked' : ''}> ${T('Tout le monde peut créer un compte depuis le catalogue', 'Anyone can create an account from the catalog')}</label>
        <label class="check"><input type="checkbox" id="cApp" ${cfg.requireApproval ? 'checked' : ''}> ${T('Les portails des créateurs doivent être validés par un administrateur avant publication (recommandé)', 'Creators\' portals must be approved by an administrator before publication (recommended)')}</label>
        <button class="btn primary" id="cSave">${UI.icon('save')} ${T('Enregistrer', 'Save')}</button>
      </div>
      <div class="card">
        <h3>${UI.icon('server')} ${T('Serveur', 'Server')}</h3>
        <p class="muted small">${T('Adresses à donner aux joueurs et créateurs de ton réseau :', 'Addresses to give players and creators on your network:')}</p>
        <div class="stack">${(info.urls || []).map((u) => `<div class="url-box">${UI.icon('globe')}<code>${U.esc(u)}</code><button class="btn sm" data-copy="${U.esc(u)}">${UI.icon('copy')}</button></div>`).join('') || `<p class="muted small">—</p>`}</div>
        <p class="muted small">${T('Pour Internet : redirige le port', 'For the Internet: forward port')} ${U.esc(String(info.port || ''))} ${T('dans ton routeur ou utilise un tunnel (Tailscale, Cloudflare Tunnel…). Au premier lancement, autorise Python dans le pare-feu Windows (réseaux privés).', 'in your router or use a tunnel (Tailscale, Cloudflare Tunnel…). On first launch, allow Python in the Windows firewall (private networks).')}</p>
        <p class="small">${T('Dossier des données', 'Data folder')} : <code>${U.esc(cfg.dataDir)}</code></p>
        ${info.local ? `<button class="btn ghost" id="cOpen">${UI.icon('folder')} ${T('Ouvrir le dossier', 'Open folder')}</button>` : ''}
      </div>`;
    box.querySelectorAll('[data-copy]').forEach((b) => { b.onclick = async () => { await U.copyText(b.dataset.copy); UI.toast(T('Adresse copiée', 'Address copied'), 'success'); }; });
    box.querySelector('#cSave').onclick = async () => {
      try {
        await API('/api/admin/config', { method: 'POST', body: { hubName: box.querySelector('#cName').value, hubTagline: box.querySelector('#cTag').value,
          allowRegistration: box.querySelector('#cReg').checked, requireApproval: box.querySelector('#cApp').checked } });
        UI.toast(T('Réglages enregistrés', 'Settings saved'), 'success');
      } catch (e) { UI.toast(e.message, 'error'); }
    };
    const op = box.querySelector('#cOpen');
    if (op) op.onclick = () => API('/api/admin/open-folder', { method: 'POST', body: {} }).catch((e) => UI.toast(e.message, 'error'));
  }
})();
