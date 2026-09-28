/* Vue : compte, paramètres, historique des versions, projets, corbeille */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;

  const ROLE = { admin: ['Administrateur', 'Administrator'], user: ['Créateur', 'Creator'] };

  DP.views.settings = {
    title: () => T('Compte & paramètres', 'Account & settings'),
    async render(el) {
      const st = S.settings, p = S.project, me = S.user;
      let versions = [], legacy = [];
      try { versions = await DP.server.versions(p.id); } catch (e) { /* ignore */ }
      try { legacy = await DP.legacy.projects(); } catch (e) { /* ignore */ }

      el.innerHTML = `
        <div class="settings">
          <div class="card">
            <div class="card-head"><h3>${UI.icon('user')} ${T('Mon compte', 'My account')}</h3>
              <button class="btn sm ghost" id="logout">${UI.icon('logout')} ${T('Se déconnecter', 'Log out')}</button></div>
            <div class="account-row">
              <div class="acc-avatar">${U.esc((me.displayName || me.username).slice(0, 1).toUpperCase())}</div>
              <div class="grow">
                <strong>${U.esc(me.displayName)}</strong> <span class="tag ${me.role === 'admin' ? 'pub' : ''}">${U.esc(L(ROLE[me.role] || ROLE.user))}</span>
                <p class="muted small">@${U.esc(me.username)} · ${T('membre depuis', 'member since')} ${U.fmtDay(new Date(me.createdAt).toISOString().slice(0, 10))}</p>
              </div>
            </div>
            <div class="fields">
              <label class="field"><span class="lbl">${T('Nom affiché', 'Display name')}</span><input class="input" id="accName" maxlength="40" value="${U.esc(me.displayName)}"></label>
              <label class="field wide"><span class="lbl">${T('Présentation (visible sur ton profil public)', 'About you (shown on your public profile)')}</span><textarea class="input auto" id="accBio" rows="2" maxlength="500" placeholder="${T('ex. Dev solo, passionné de jeux de course…', 'e.g. Solo dev who loves racing games…')}">${U.esc(me.bio || '')}</textarea></label>
            </div>
            <div class="row gap wrap"><button class="btn" id="accSave">${UI.icon('save')} ${T('Enregistrer le profil', 'Save profile')}</button>
              <a class="btn ghost" href="/#/createur/${encodeURIComponent(me.username)}" target="_blank">${UI.icon('eye')} ${T('Voir mon profil public', 'View my public profile')}</a></div>
            <div class="sep"></div>
            <h4>${T('Changer le mot de passe', 'Change password')}</h4>
            <div class="row gap wrap">
              <input class="input" type="password" id="pwOld" autocomplete="current-password" placeholder="${T('Mot de passe actuel', 'Current password')}" style="max-width:250px">
              <input class="input" type="password" id="pwNew" autocomplete="new-password" placeholder="${T('Nouveau (6 caractères min.)', 'New (6 characters min.)')}" style="max-width:250px">
              <button class="btn" id="pwSave">${UI.icon('shield')} ${T('Modifier', 'Change')}</button>
            </div>
          </div>

          <div class="card">
            <h3>${UI.icon('globe')} ${T('Général', 'General')}</h3>
            <div class="row gap wrap">
              <div class="field"><span class="lbl">${T('Langue', 'Language')}</span>
                <div class="seg" id="sLang"><button data-v="fr" class="${st.lang === 'fr' ? 'on' : ''}">Français</button><button data-v="en" class="${st.lang === 'en' ? 'on' : ''}">English</button></div></div>
              <div class="field"><span class="lbl">${T('Couleur d\'accent', 'Accent color')}</span>
                <div class="accent-pick">${Object.entries(SC.ACCENTS).map(([k, [hex, lab]]) => `<button data-acc="${k}" class="${st.accent === k ? 'on' : ''}" style="background:${hex}" title="${U.esc(L(lab))}"></button>`).join('')}</div></div>
            </div>
          </div>

          <div class="card">
            <h3>${UI.icon('clock')} ${T('Historique des versions', 'Version history')} <span class="muted small">${U.esc(p.name)}</span></h3>
            <p class="muted small">${T('Tes projets sont enregistrés sur le serveur à chaque modification. Une version est gardée automatiquement toutes les 10 minutes de travail (les 30 dernières par projet).', 'Your projects are saved on the server on every change. A version is kept automatically every 10 minutes of work (the last 30 per project).')}</p>
            <div class="backup-list">${versions.length ? versions.slice(0, 30).map((v) => `<div class="proj-item"><span class="grow">${UI.icon('archive')} ${U.esc(U.fmtDate(v.time))}</span><small class="muted">${U.relTime(v.time)} · ${U.fmtSize(v.size)}</small><button class="btn sm ghost" data-restore="${U.esc(v.name)}">${UI.icon('refresh')} ${T('Revenir à cette version', 'Restore this version')}</button></div>`).join('')
              : `<p class="muted small">${T('Pas encore de version précédente pour ce projet.', 'No previous version for this project yet.')}</p>`}</div>
            <div class="sep"></div>
            <div class="row gap wrap">
              <button class="btn" id="dExp">${UI.icon('download')} ${T('Exporter ce projet (.json)', 'Export this project (.json)')}</button>
              <button class="btn" id="dExpAll">${UI.icon('download')} ${T('Exporter tous mes projets', 'Export all my projects')}</button>
              <button class="btn" id="dImp">${UI.icon('upload')} ${T('Importer une sauvegarde', 'Import a backup')}</button>
              <button class="btn" id="dMd">${UI.icon('file')} ${T('Exporter le GDD (.md)', 'Export GDD (.md)')}</button>
            </div>
          </div>

          ${legacy.length ? `
          <div class="card">
            <h3>${UI.icon('archive')} ${T('Anciens projets trouvés dans ce navigateur', 'Old projects found in this browser')}</h3>
            <p class="muted small">${T('Ces projets viennent de l\'ancienne version de DevPortals (sans compte). Importe-les dans ton compte pour les retrouver partout.', 'These projects come from the previous DevPortals version (no account). Import them into your account to find them everywhere.')}</p>
            <div class="proj-list">${legacy.map((x) => `<label class="proj-item"><input type="checkbox" data-leg="${U.esc(x.id)}" checked><span class="grow"><strong>${U.esc(x.name)}</strong> <small class="muted">${U.relTime(x.updatedAt)}</small></span></label>`).join('')}</div>
            <div class="row gap wrap"><button class="btn primary" id="legImport">${UI.icon('upload')} ${T('Importer dans mon compte', 'Import into my account')}</button>
              <button class="btn ghost danger-text" id="legDelete">${UI.icon('trash')} ${T('Effacer du navigateur', 'Erase from the browser')}</button></div>
            <div id="legStatus"></div>
          </div>` : ''}

          <div class="card">
            <h3>${UI.icon('folder')} ${T('Projets', 'Projects')}</h3>
            <div class="proj-list">${S.list.map((x) => `
              <div class="proj-item ${x.id === p.id ? 'active' : ''}">
                <span class="grow"><strong>${U.esc(x.name)}</strong> <small class="muted">${U.relTime(x.updatedAt)}</small></span>
                ${x.id === p.id ? `<span class="tag">${T('ouvert', 'open')}</span>` : `<button class="btn sm ghost" data-open="${x.id}">${T('Ouvrir', 'Open')}</button>`}
                <button class="btn sm ghost" data-ren="${x.id}">${UI.icon('edit')}</button>
                <button class="btn sm ghost" data-del="${x.id}">${UI.icon('trash')}</button>
              </div>`).join('')}</div>
            <button class="btn ghost" id="dNew">${UI.icon('plus')} ${T('Nouveau projet (avec modèle)', 'New project (with template)')}</button>
          </div>

          <div class="card">
            <div class="card-head"><h3>${UI.icon('trash')} ${T('Corbeille', 'Trash')} <span class="muted small">${p.trash.length}</span></h3>
              ${p.trash.length ? `<button class="btn sm ghost danger-text" id="trEmpty">${T('Vider la corbeille', 'Empty trash')}</button>` : ''}</div>
            <div class="trash-list">${p.trash.length ? p.trash.slice(0, 60).map((t) => `<div class="proj-item"><span class="grow">${U.esc(S.trashLabel(t))}</span><small class="muted">${U.relTime(t.deletedAt)}</small><button class="btn sm" data-tr="${t.id}">${UI.icon('refresh')} ${T('Restaurer', 'Restore')}</button></div>`).join('')
              : `<p class="muted small">${T('La corbeille est vide. Les fiches, idées, chapitres, tâches et articles supprimés arrivent ici.', 'Trash is empty. Deleted sheets, ideas, chapters, tasks and posts land here.')}</p>`}</div>
          </div>

          <div class="card">
            <h3>${UI.icon('info')} ${T('Raccourcis & aide', 'Shortcuts & help')}</h3>
            <div class="md">${DP.md.render(DP.lang === 'en' ? HELP_EN : HELP_FR)}</div>
          </div>
        </div>`;

      el.querySelectorAll('#sLang [data-v]').forEach((b) => { b.onclick = async () => { st.lang = DP.lang = b.dataset.v; await S.saveSettings(); DP.app.renderShell(); DP.app.route(); }; });
      el.querySelectorAll('[data-acc]').forEach((b) => { b.onclick = async () => { st.accent = b.dataset.acc; await S.saveSettings(); DP.app.applyAccent(); el.querySelectorAll('[data-acc]').forEach((x) => x.classList.toggle('on', x === b)); S.touch(); }; });
      el.querySelector('#logout').onclick = () => DP.app.logout();
      el.querySelector('#accSave').onclick = async () => {
        try {
          const r = await DP.api('/api/me/profile', { method: 'POST', body: { displayName: el.querySelector('#accName').value, bio: el.querySelector('#accBio').value } });
          Object.assign(S.user, r.user);
          UI.toast(T('Profil enregistré', 'Profile saved'), 'success');
          DP.app.renderShell(); DP.app.route();
        } catch (e) { UI.toast(e.message, 'error'); }
      };
      el.querySelector('#pwSave').onclick = async () => {
        try {
          await DP.api('/api/me/password', { method: 'POST', body: { current: el.querySelector('#pwOld').value, password: el.querySelector('#pwNew').value } });
          el.querySelector('#pwOld').value = el.querySelector('#pwNew').value = '';
          UI.toast(T('Mot de passe modifié. Tes autres sessions ont été déconnectées.', 'Password changed. Your other sessions were logged out.'), 'success', 5000);
        } catch (e) { UI.toast(e.message, 'error'); }
      };
      el.querySelectorAll('[data-restore]').forEach((b) => {
        b.onclick = async () => {
          if (!(await UI.confirm(T('Revenir à cette version du projet ? L\'état actuel est gardé dans l\'historique, tu pourras y revenir.', 'Go back to this version of the project? The current state is kept in the history, so you can come back to it.')))) return;
          try {
            await S.saveNow();
            await DP.server.restoreVersion(p.id, b.dataset.restore);
            await S.reload();
            UI.toast(T('Version restaurée', 'Version restored'), 'success');
            DP.app.renderShell(); DP.app.route();
          } catch (e) { UI.toast(e.message, 'error'); }
        };
      });
      const legSel = () => legacy.filter((x) => { const c = el.querySelector(`[data-leg="${CSS.escape(x.id)}"]`); return c && c.checked; });
      const li = el.querySelector('#legImport');
      if (li) li.onclick = async () => {
        const list = legSel();
        if (!list.length) return;
        const box = el.querySelector('#legStatus');
        li.disabled = true;
        try {
          const n = await S.importLegacy(list, (i, tot, name) => { box.innerHTML = UI.spinner(T(`Import ${i}/${tot} : ${name}…`, `Importing ${i}/${tot}: ${name}…`)); });
          UI.toast(T(`${n} projet(s) importé(s) dans ton compte`, `${n} project(s) imported into your account`), 'success');
          DP.app.renderShell(); DP.app.route();
        } catch (e) { box.innerHTML = `<div class="banner warn">${UI.icon('alert')}<div>${U.esc(e.message)}</div></div>`; li.disabled = false; }
      };
      const ld = el.querySelector('#legDelete');
      if (ld) ld.onclick = async () => {
        const list = legSel();
        if (!list.length) return;
        if (!(await UI.confirm(T(`Effacer ${list.length} ancien(s) projet(s) de ce navigateur ? Vérifie d'abord qu'ils sont bien importés.`, `Erase ${list.length} old project(s) from this browser? Check first that they were imported.`), { danger: true }))) return;
        for (const x of list) await DP.legacy.removeProject(x.id);
        DP.app.route();
      };
      el.querySelector('#dExp').onclick = async () => { await S.exportProject(); UI.toast(T('Projet exporté', 'Project exported'), 'success'); DP.app.route(); };
      el.querySelector('#dExpAll').onclick = async () => { await S.exportAll(); UI.toast(T('Sauvegarde complète exportée', 'Full backup exported'), 'success'); DP.app.route(); };
      el.querySelector('#dMd').onclick = () => DP.exporter.markdown();
      el.querySelector('#dImp').onclick = async () => {
        const files = await U.pickFiles({ accept: '.json,application/json', multiple: false });
        if (!files.length) return;
        try {
          const n = await S.importFile(files[0]);
          UI.toast(T(`${n} projet(s) importé(s)`, `${n} project(s) imported`), 'success');
          DP.app.renderShell(); DP.app.go('dashboard');
        } catch (e) { UI.toast(e.message, 'error', 7000); }
      };
      el.querySelector('#dNew').onclick = () => DP.app.newProject();
      el.querySelectorAll('[data-open]').forEach((b) => { b.onclick = async () => { await S.open(b.dataset.open); DP.app.renderShell(); DP.app.go('dashboard'); }; });
      el.querySelectorAll('[data-ren]').forEach((b) => {
        b.onclick = async () => {
          const it = S.list.find((x) => x.id === b.dataset.ren);
          const name = await UI.ask(T('Renommer le projet', 'Rename project'), { value: it.name });
          if (!name) return;
          try { await S.rename(it.id, name); } catch (e) { UI.toast(e.message, 'error'); }
          await S.refreshList(); DP.app.renderShell(); DP.app.route();
        };
      });
      el.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          const it = S.list.find((x) => x.id === b.dataset.del);
          if (!(await UI.confirm(T(`Supprimer le projet « ${it.name} », ses médias et son portail ? (Une copie est gardée dans la corbeille du serveur.)`, `Delete project "${it.name}", its media and its portal? (A copy is kept in the server trash.)`), { danger: true, ok: T('Supprimer', 'Delete') }))) return;
          await S.remove(it.id);
          DP.app.renderShell(); DP.app.route();
          UI.toast(T('Projet supprimé', 'Project deleted'), 'success');
        };
      });
      el.querySelectorAll('[data-tr]').forEach((b) => { b.onclick = () => { if (S.restore(b.dataset.tr)) { UI.toast(T('Restauré', 'Restored'), 'success'); DP.app.refreshNav(); DP.app.route(); } }; });
      const te = el.querySelector('#trEmpty');
      if (te) te.onclick = async () => {
        if (!(await UI.confirm(T('Vider définitivement la corbeille ?', 'Permanently empty the trash?'), { danger: true }))) return;
        p.trash = []; S.touch(); DP.app.route();
      };
    },
  };

  const HELP_FR = `
- **Ctrl+K** : rechercher partout (fiches, idées, chapitres, GDD, devlog, tâches…).
- **Alt+N** : capturer une idée depuis n'importe quel écran.
- **Ctrl+V** : coller une capture d'écran dans une fiche, une idée, le moodboard ou les captures.
- **Portail & catalogue** : rends des fiches, articles, versions, jalons, cartes et médias **publics**, choisis genres et styles, puis clique sur *Soumettre pour validation*. Une fois approuvé par l'administration, ton jeu apparaît dans le catalogue public.
- **🔒** : les champs marqués d'un cadenas (secrets, spoilers, notes internes) ne sont jamais publiés.
- **Corbeille** : tout ce qui est supprimé peut être restauré ici.
- **Sauvegardes** : tout est enregistré dans ton compte sur le serveur, avec un historique des versions ci-dessus. Exporte en .json pour garder une copie ailleurs.`;
  const HELP_EN = `
- **Ctrl+K**: search everything (sheets, ideas, chapters, GDD, devlog, tasks…).
- **Alt+N**: capture an idea from any screen.
- **Ctrl+V**: paste a screenshot into a sheet, an idea, the moodboard or captures.
- **Portal & catalog**: make sheets, posts, versions, milestones, maps and media **public**, pick genres and styles, then click *Submit for review*. Once approved by the administration, your game appears in the public catalog.
- **🔒**: fields marked with a lock (secrets, spoilers, internal notes) are never published.
- **Trash**: anything deleted can be restored here.
- **Backups**: everything is saved in your account on the server, with a version history above. Export to .json to keep a copy elsewhere.`;
})();
