/* Vue : tableau de bord */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;

  const STAGES = [['concept', ['Concept', 'Concept']], ['prototype', ['Prototype', 'Prototype']], ['vslice', ['Vertical slice', 'Vertical slice']],
    ['alpha', ['Alpha', 'Alpha']], ['beta', ['Bêta', 'Beta']], ['early', ['Accès anticipé', 'Early access']], ['release', ['Sorti', 'Released']]];
  DP.STAGES = STAGES;

  function recent(p) {
    const items = [];
    p.ideas.forEach((i) => items.push({ t: i.updatedAt, icon: 'bulb', label: i.title || U.truncate(i.content, 60), route: `ideas/${i.id}` }));
    SC.ENTITY_ORDER.forEach((t) => p.entities[t].forEach((e) => items.push({ t: e.updatedAt, icon: SC.ENTITIES[t].icon, label: `${e.fields.name || '?'}`, sub: L(SC.ENTITIES[t].singular), route: `e/${t}/${e.id}` })));
    p.devlog.posts.forEach((x) => items.push({ t: x.updatedAt || x.createdAt, icon: 'megaphone', label: x.title, route: `devlog/posts/${x.id}` }));
    p.captures.forEach((c) => items.push({ t: c.createdAt, icon: 'camera', label: c.title, route: `captures/${c.id}` }));
    return items.filter((x) => x.t).sort((a, b) => b.t - a.t).slice(0, 8);
  }

  DP.views.dashboard = {
    title: () => T('Tableau de bord', 'Dashboard'),
    render(el) {
      const p = S.project, m = p.meta;
      const gddFilled = p.gdd.sections.filter((s) => U.words(s.content) >= 8).length;
      const gddPct = p.gdd.sections.length ? Math.round((gddFilled / p.gdd.sections.length) * 100) : 0;
      const tasksDone = p.tasks.filter((t) => t.status === 'done').length;
      const openBugs = p.entities.bugs.filter((b) => !['fixed', 'wontfix', 'duplicate'].includes(b.fields.bstatus)).length;
      const stats = [
        { route: 'ideas', icon: 'bulb', n: p.ideas.length, label: ['Idées', 'Ideas'] },
        ...['characters', 'vehicles', 'locations', 'tracks'].map((t) => ({ route: `e/${t}`, icon: SC.ENTITIES[t].icon, n: p.entities[t].length, label: SC.ENTITIES[t].label })),
        { route: 'gdd', icon: 'book', n: gddPct + ' %', label: ['GDD rédigé', 'GDD written'], pct: gddPct },
        { route: 'story', icon: 'feather', n: p.story.chapters.length, label: ['Chapitres', 'Chapters'] },
        { route: 'tasks', icon: 'check', n: `${tasksDone}/${p.tasks.length}`, label: ['Tâches faites', 'Tasks done'], pct: p.tasks.length ? (tasksDone / p.tasks.length) * 100 : 0 },
        { route: 'e/bugs', icon: 'bug', n: openBugs, label: ['Bugs ouverts', 'Open bugs'] },
        { route: 'media', icon: 'image', n: p.gallery.length, label: ['Médias', 'Media'] },
      ];
      const upcoming = p.milestones.filter((x) => !x.done).sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')))[0];
      const msTasks = upcoming ? p.tasks.filter((t) => t.milestone === upcoming.id) : [];
      const msPct = msTasks.length ? Math.round((msTasks.filter((t) => t.status === 'done').length / msTasks.length) * 100) : 0;
      const days = upcoming ? U.daysUntil(upcoming.date) : null;
      const doing = p.tasks.filter((t) => t.status === 'doing').concat(p.tasks.filter((t) => t.status === 'todo' && t.priority === 'high')).slice(0, 6);
      const publicCount = SC.PORTAL_TYPES.reduce((n, t) => n + p.entities[t].filter((e) => e.public).length, 0) + p.devlog.posts.filter((x) => x.public).length + p.devlog.patches.filter((x) => x.public).length;
      const needBackup = !DP.server.online && (Date.now() - (S.settings.lastBackup || 0)) > 7 * 864e5 && (p.ideas.length + SC.ENTITY_ORDER.reduce((n, t) => n + p.entities[t].length, 0)) > 3;
      const pool = DP.toolboxData.QUESTIONS;
      let q = U.pick(pool);

      el.innerHTML = `
        <div class="hero card">
          <button class="hero-cover ${m.cover ? '' : 'empty'}" id="coverBtn" ${m.cover ? `data-bg-img="${m.cover}"` : ''} title="${T('Changer l\'image de couverture', 'Change cover image')}">
            ${m.cover ? '' : `${UI.icon('image', 'big')}<span>${T('Ajouter une couverture', 'Add a cover')}</span>`}
          </button>
          <div class="hero-body">
            <input class="hero-title" id="pName" value="${U.esc(p.name)}" placeholder="${T('Nom du jeu', 'Game name')}">
            <textarea class="input auto" id="pPitch" rows="2" placeholder="${T('Pitch en une ou deux phrases : c\'est quoi ton jeu ?', 'One or two sentence pitch: what is your game?')}">${U.esc(m.pitch)}</textarea>
            <div class="meta-grid">
              ${metaInput('genre', T('Genre', 'Genre'), T('ex. Course arcade', 'e.g. Arcade racing'))}
              ${metaInput('platforms', T('Plateformes', 'Platforms'), 'PC, Switch, PS5…')}
              ${metaInput('engine', T('Moteur', 'Engine'), 'Unity, Unreal, Godot…')}
              ${metaInput('audience', T('Public cible', 'Audience'), T('ex. 16-30 ans', 'e.g. 16-30'))}
              ${metaInput('team', T('Équipe', 'Team'), T('ex. Solo, 3 personnes', 'e.g. Solo, 3 people'))}
              <label class="field"><span class="lbl">${T('Étape', 'Stage')}</span><select class="input" data-meta="stage">${UI.options(STAGES, m.stage)}</select></label>
              <label class="field"><span class="lbl">${T('Début', 'Start')}</span><input class="input" type="date" data-meta="startDate" value="${U.esc(m.startDate || '')}"></label>
              <label class="field"><span class="lbl">${T('Sortie visée', 'Target release')}</span><input class="input" type="date" data-meta="releaseDate" value="${U.esc(m.releaseDate || '')}"></label>
            </div>
          </div>
        </div>

        ${DP.server.online ? '' : `
        <div class="banner">${UI.icon('server')}
          <div><strong>${T('Serveur local non lancé', 'Local server not running')}</strong> — ${T('ouvre DevPortals avec DevPortals.bat pour activer le portail joueurs et la sauvegarde automatique sur ton disque.', 'open DevPortals with DevPortals.bat to enable the player portal and automatic backups to your disk.')}</div>
          <a class="btn sm" href="#/portal">${T('En savoir plus', 'Learn more')}</a></div>`}
        ${needBackup ? `<div class="banner warn">${UI.icon('save')}<div><strong>${T('Pense à sauvegarder', 'Remember to back up')}</strong> — ${T('exporte ton projet dans un fichier.', 'export your project to a file.')}</div><button class="btn sm" id="backupBtn">${UI.icon('download')} ${T('Exporter', 'Export')}</button></div>` : ''}

        <div class="stats">${stats.map((s) => `<a class="stat" href="#/${s.route}">${UI.icon(s.icon)}<strong>${s.n}</strong><span>${U.esc(L(s.label))}</span>${s.pct != null ? `<i class="bar"><b style="width:${s.pct}%"></b></i>` : ''}</a>`).join('')}</div>

        <div class="grid3">
          <div class="card">
            <h3>${UI.icon('bulb')} ${T('Idée rapide', 'Quick idea')}</h3>
            <textarea class="input auto" id="qText" rows="4" placeholder="${T('Note ton idée dès qu\'elle arrive…', 'Jot your idea the moment it comes…')}"></textarea>
            <div class="row gap"><select class="input" id="qCat">${UI.options(SC.IDEA_CATS, 'gameplay')}</select><button class="btn primary" id="qSave">${UI.icon('save')}</button></div>
          </div>
          <div class="card">
            <div class="card-head"><h3>${UI.icon('milestone')} ${T('Prochain jalon', 'Next milestone')}</h3><a class="link small" href="#/tasks">${T('Tâches →', 'Tasks →')}</a></div>
            ${upcoming ? `<strong>${U.esc(upcoming.title)}</strong>
              ${days != null ? `<div class="row gap"><span class="countdown">${Math.abs(days)}</span><span class="muted">${days >= 0 ? T('jours restants', 'days left') : T('jours de retard', 'days late')}<br>${U.fmtDay(upcoming.date)}</span></div>` : `<p class="muted small">${T('Pas de date fixée.', 'No date set.')}</p>`}
              <i class="bar"><b style="width:${msPct}%"></b></i><small class="muted">${msPct} % · ${msTasks.length} ${T('tâche(s)', 'task(s)')}</small>`
              : `<p class="muted">${T('Aucun jalon à venir.', 'No upcoming milestone.')}</p>`}
          </div>
          <div class="card">
            <div class="card-head"><h3>${UI.icon('rocket')} ${T('Portail joueurs', 'Player portal')}</h3><a class="link small" href="#/portal">${T('Gérer →', 'Manage →')}</a></div>
            <p><strong>${publicCount}</strong> <span class="muted">${T('élément(s) public(s)', 'public item(s)')}</span></p>
            <p class="muted small">${p.portal.lastPublished ? T(`Publié ${U.relTime(p.portal.lastPublished)}`, `Published ${U.relTime(p.portal.lastPublished)}`) : T('Jamais publié', 'Never published')}${p.portal.dirty && p.portal.lastPublished ? ` · <span class="tag warn">${T('changements non publiés', 'unpublished changes')}</span>` : ''}</p>
            ${DP.server.online && DP.server.info ? `<a class="btn sm" href="/" target="_blank">${UI.icon('globe')} ${T('Voir le portail', 'View portal')}</a>` : ''}
          </div>
        </div>

        <div class="qcard">${UI.icon('sparkles')}<p id="qOfDay"><strong>${T('Question à te poser :', 'Question to ask yourself:')}</strong> ${U.esc(L(q.t))}</p><button class="btn sm ghost" id="qNext">${UI.icon('refresh')}</button></div>

        <div class="grid2">
          <div class="card">
            <div class="card-head"><h3>${UI.icon('check')} ${T('À faire maintenant', 'Do now')}</h3><a class="link small" href="#/tasks">${T('Tout voir →', 'See all →')}</a></div>
            ${doing.length ? `<div class="mini-list">${doing.map((t) => `<a class="mini-item" href="#/tasks"><span class="dot ${t.status === 'doing' ? 'half' : ''}"></span><span class="grow">${U.esc(t.title)}</span><span class="muted small">${t.status === 'doing' ? T('en cours', 'in progress') : T('priorité haute', 'high priority')}</span></a>`).join('')}</div>`
              : `<p class="muted">${T('Rien d\'urgent. Planifie tes prochaines tâches.', 'Nothing urgent. Plan your next tasks.')}</p>`}
          </div>
          <div class="card">
            <h3>${UI.icon('clock')} ${T('Activité récente', 'Recent activity')}</h3>
            ${recent(p).length ? `<div class="mini-list">${recent(p).map((x) => `<a class="mini-item" href="#/${x.route}">${UI.icon(x.icon)}<span class="grow">${U.esc(x.label || '?')}${x.sub ? ` <small class="muted">· ${U.esc(x.sub)}</small>` : ''}</span><span class="muted small">${U.relTime(x.t)}</span></a>`).join('')}</div>`
              : `<p class="muted">${T('Commence par une idée, une fiche ou une section du GDD.', 'Start with an idea, a sheet or a GDD section.')}</p>`}
          </div>
        </div>`;

      function metaInput(key, label, ph) {
        return `<label class="field"><span class="lbl">${U.esc(label)}</span><input class="input" data-meta="${key}" value="${U.esc(m[key] || '')}" placeholder="${U.esc(ph)}"></label>`;
      }

      el.querySelector('#pName').addEventListener('input', (e) => {
        p.name = e.target.value || T('Sans nom', 'Untitled');
        S.touch();
        const it = S.list.find((x) => x.id === p.id); if (it) it.name = p.name;
        DP.app.renderProjects();
      });
      el.querySelector('#pPitch').addEventListener('input', (e) => { m.pitch = e.target.value; S.touch(); });
      el.querySelectorAll('[data-meta]').forEach((inp) => inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', () => { m[inp.dataset.meta] = inp.value; S.touch(); }));
      el.querySelector('#coverBtn').onclick = async () => {
        const ids = await UI.pickImages({ title: T('Image de couverture', 'Cover image') });
        if (ids && ids[0]) { m.cover = ids[0]; S.touch(); DP.app.route(); }
      };
      const bk = el.querySelector('#backupBtn');
      if (bk) bk.onclick = async () => { await S.exportProject(); DP.app.route(); };
      el.querySelector('#qSave').onclick = () => {
        const content = el.querySelector('#qText').value.trim();
        if (!content) { UI.toast(T('Écris ton idée d\'abord 🙂', 'Write your idea first 🙂'), 'error'); return; }
        DP.app.createIdea({ content, category: el.querySelector('#qCat').value });
        UI.toast(T('Idée enregistrée', 'Idea saved'), 'success');
        DP.app.route();
      };
      el.querySelector('#qNext').onclick = () => { q = U.pick(pool); el.querySelector('#qOfDay').innerHTML = `<strong>${T('Question à te poser :', 'Question to ask yourself:')}</strong> ${U.esc(L(q.t))}`; };
    },
  };
})();
