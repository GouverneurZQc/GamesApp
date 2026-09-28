/* Vue : paramètres, sauvegardes, corbeille, projets */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;

  DP.views.settings = {
    title: () => T('Paramètres & données', 'Settings & data'),
    async render(el) {
      const st = S.settings, p = S.project;
      await DP.server.check();
      DP.app.updateServerDot();
      let usage = '';
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const e = await navigator.storage.estimate();
          usage = `${U.fmtSize(e.usage || 0)} ${T('utilisés dans le navigateur', 'used in the browser')}`;
        }
      } catch (e) { /* ignore */ }
      let backups = [];
      if (DP.server.online) { try { backups = (await DP.server.listBackups()).filter((b) => b.name.startsWith(`${U.slug(p.name)}__`)); } catch (e) { /* ignore */ } }

      el.innerHTML = `
        <div class="settings">
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
            <h3>${UI.icon('save')} ${T('Sauvegardes sur le disque', 'Backups on disk')}</h3>
            ${DP.server.online ? `
              <p class="muted small">${T('Les sauvegardes sont écrites dans le dossier « sauvegardes » à côté de DevPortals (les 30 plus récentes par projet sont conservées).', 'Backups are written to the "sauvegardes" folder next to DevPortals (the 30 most recent per project are kept).')}</p>
              <div class="row gap wrap">
                <label class="check"><input type="checkbox" id="autoBk" ${st.autoBackup ? 'checked' : ''}> ${T('Sauvegarde automatique toutes les', 'Automatic backup every')}</label>
                <select class="input" id="bkEvery" style="width:auto">${[5, 10, 15, 30, 60].map((m) => `<option value="${m}" ${st.backupEvery === m ? 'selected' : ''}>${m} min</option>`).join('')}</select>
                <button class="btn primary" id="bkNow">${UI.icon('save')} ${T('Sauvegarder maintenant', 'Back up now')}</button>
                <button class="btn ghost" id="bkOpen">${UI.icon('folder')} ${T('Ouvrir le dossier', 'Open folder')}</button>
              </div>
              <div class="backup-list">${backups.length ? backups.slice(0, 12).map((b) => `<div class="proj-item"><span class="grow">${UI.icon('archive')} ${U.esc(b.name)}</span><small class="muted">${U.fmtDate(b.time)} · ${U.fmtSize(b.size)}</small><button class="btn sm ghost" data-restore="${U.esc(b.name)}">${UI.icon('refresh')} ${T('Restaurer comme copie', 'Restore as copy')}</button></div>`).join('')
                : `<p class="muted small">${T('Aucune sauvegarde pour ce projet pour l\'instant.', 'No backup for this project yet.')}</p>`}</div>`
              : `<div class="banner warn">${UI.icon('server')}<div>${T('Lance DevPortals avec DevPortals.bat pour activer la sauvegarde automatique sur le disque. En attendant, exporte ton projet régulièrement.', 'Start DevPortals with DevPortals.bat to enable automatic backups to disk. Meanwhile, export your project regularly.')}</div></div>`}
            <div class="sep"></div>
            <p class="muted small">${usage} · ${T('Dernière sauvegarde', 'Last backup')} : ${st.lastBackup ? U.fmtDate(st.lastBackup) : T('jamais', 'never')}</p>
            <div class="row gap wrap">
              <button class="btn" id="dExp">${UI.icon('download')} ${T('Exporter ce projet (.json)', 'Export this project (.json)')}</button>
              <button class="btn" id="dExpAll">${UI.icon('download')} ${T('Exporter tous les projets', 'Export all projects')}</button>
              <button class="btn" id="dImp">${UI.icon('upload')} ${T('Importer une sauvegarde', 'Import a backup')}</button>
              <button class="btn" id="dMd">${UI.icon('file')} ${T('Exporter le GDD (.md)', 'Export GDD (.md)')}</button>
            </div>
          </div>

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

      if (DP.server.online) {
        el.querySelector('#autoBk').onchange = (e) => { st.autoBackup = e.target.checked; S.saveSettings(); };
        el.querySelector('#bkEvery').onchange = (e) => { st.backupEvery = +e.target.value; S.saveSettings(); };
        el.querySelector('#bkNow').onclick = async () => { await DP.backup.now(); DP.app.route(); };
        el.querySelector('#bkOpen').onclick = () => DP.server.openFolder('backups').catch((e) => UI.toast(e.message, 'error'));
        el.querySelectorAll('[data-restore]').forEach((b) => {
          b.onclick = async () => {
            try {
              const txt = await DP.server.getBackup(b.dataset.restore);
              await S.importText(txt);
              UI.toast(T('Sauvegarde restaurée comme nouveau projet', 'Backup restored as a new project'), 'success');
              DP.app.renderShell(); DP.app.go('dashboard');
            } catch (e) { UI.toast(e.message, 'error'); }
          };
        });
      }
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
          if (it.id === p.id) { p.name = name; await S.saveNow(); } else { const pr = await DP.db.get('projects', it.id); pr.name = name; await DP.db.put('projects', pr); }
          await S.refreshList(); DP.app.renderShell(); DP.app.route();
        };
      });
      el.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          const it = S.list.find((x) => x.id === b.dataset.del);
          if (!(await UI.confirm(T(`Supprimer définitivement le projet « ${it.name} » et tous ses médias ? Exporte-le avant.`, `Permanently delete project "${it.name}" and all its media? Export it first.`), { danger: true, ok: T('Supprimer', 'Delete') }))) return;
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
- **Portail joueurs** : rends des fiches, articles, versions, jalons, cartes et médias **publics**, puis clique sur *Publier*. Les joueurs de ton réseau le voient à l'adresse affichée dans *Portail joueurs*.
- **🔒** : les champs marqués d'un cadenas (secrets, spoilers, notes internes) ne sont jamais publiés.
- **Corbeille** : tout ce qui est supprimé peut être restauré ici.
- **Sauvegardes** : avec DevPortals.bat, ton projet est sauvegardé automatiquement dans le dossier *sauvegardes*.`;
  const HELP_EN = `
- **Ctrl+K**: search everything (sheets, ideas, chapters, GDD, devlog, tasks…).
- **Alt+N**: capture an idea from any screen.
- **Ctrl+V**: paste a screenshot into a sheet, an idea, the moodboard or captures.
- **Player portal**: make sheets, posts, versions, milestones, maps and media **public**, then click *Publish*. Players on your network see it at the address shown in *Player portal*.
- **🔒**: fields marked with a lock (secrets, spoilers, internal notes) are never published.
- **Trash**: anything deleted can be restored here.
- **Backups**: with DevPortals.bat, your project is backed up automatically to the *sauvegardes* folder.`;
})();
