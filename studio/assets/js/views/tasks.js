/* Vue : tâches (kanban) & jalons (roadmap) */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui;
  const COLS = [['backlog', ['Backlog / idées', 'Backlog']], ['todo', ['À faire', 'To do']], ['doing', ['En cours', 'In progress']], ['done', ['Terminé', 'Done']]];
  const PRIO = [['high', ['Haute', 'High']], ['med', ['Moyenne', 'Medium']], ['low', ['Basse', 'Low']]];
  const st = { ms: '', q: '' };

  const msProgress = (m) => {
    const tasks = S.project.tasks.filter((t) => t.milestone === m.id);
    const done = tasks.filter((t) => t.status === 'done').length;
    return { total: tasks.length, done, pct: m.done ? 100 : tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  };

  DP.views.tasks = {
    title: () => T('Tâches & jalons', 'Tasks & milestones'),
    render(el) {
      const p = S.project;
      const total = p.tasks.length, done = p.tasks.filter((t) => t.status === 'done').length;
      const ms = p.milestones.slice().sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')));
      const q = st.q.toLowerCase();
      const visible = p.tasks.filter((t) => (!st.ms || (st.ms === '_none' ? !t.milestone : t.milestone === st.ms)) && (!q || `${t.title} ${t.desc} ${t.category}`.toLowerCase().includes(q)));
      el.innerHTML = `
        <div class="card">
          <div class="card-head"><h3>${UI.icon('milestone')} ${T('Jalons (roadmap)', 'Milestones (roadmap)')}</h3>
            <button class="btn sm" id="addMs">${UI.icon('plus')} ${T('Nouveau jalon', 'New milestone')}</button></div>
          <p class="muted small">${T('Les jalons publics forment la roadmap visible par les joueurs sur le portail, avec leur progression.', 'Public milestones make up the roadmap players see on the portal, with progress.')}</p>
          <div class="milestones">${ms.length ? ms.map((m) => {
            const pr = msProgress(m);
            const d = U.daysUntil(m.date);
            return `<div class="ms-card ${pr.pct === 100 ? 'done' : pr.pct > 0 ? 'active' : ''}">
              <div class="row between"><strong>${m.done ? '✔ ' : ''}${U.esc(m.title)}</strong><button class="btn icon sm ghost" data-ms-edit="${m.id}">${UI.icon('edit')}</button></div>
              <small class="muted">${m.date ? `${U.fmtDay(m.date)}${d != null && !m.done ? ` · ${d >= 0 ? T(`dans ${d} j`, `in ${d} d`) : T(`${-d} j de retard`, `${-d} d late`)}` : ''}` : T('Sans date', 'No date')}</small>
              <i class="bar ${pr.pct === 100 ? 'good' : ''}"><b style="width:${pr.pct}%"></b></i>
              <div class="row between"><small class="muted">${pr.done}/${pr.total} ${T('tâches', 'tasks')} · ${pr.pct} %</small>${UI.publicToggle(m.public, `data-ms-pub="${m.id}"`)}</div>
            </div>`;
          }).join('') : `<p class="muted">${T('Aucun jalon.', 'No milestones.')}</p>`}</div>
        </div>

        <div class="page-head">
          <div class="grow" style="max-width:420px">
            <div class="row gap"><strong>${done}/${total}</strong><span class="muted small">${T('tâches terminées', 'tasks done')}</span></div>
            <i class="bar"><b style="width:${total ? (done / total) * 100 : 0}%"></b></i>
          </div>
          <div class="row gap wrap">
            <div class="search">${UI.icon('search')}<input class="input" id="tq" value="${U.esc(st.q)}" placeholder="${T('Filtrer…', 'Filter…')}"></div>
            <select class="input" id="msFilter" style="width:auto"><option value="">${T('Tous les jalons', 'All milestones')}</option><option value="_none" ${st.ms === '_none' ? 'selected' : ''}>${T('Sans jalon', 'No milestone')}</option>
              ${ms.map((m) => `<option value="${m.id}" ${st.ms === m.id ? 'selected' : ''}>${U.esc(m.title)}</option>`).join('')}</select>
            <button class="btn ghost" id="exportCsv">${UI.icon('download')} CSV</button>
          </div>
        </div>
        <div class="kanban">${COLS.map(([k, lab]) => {
          const list = visible.filter((t) => t.status === k);
          return `<div class="kcol" data-col="${k}">
            <div class="kcol-head"><strong>${U.esc(L(lab))}</strong><em>${list.length}</em></div>
            <div class="kcol-body" data-drop="${k}">${list.map(cardHTML).join('')}</div>
            <div class="kadd"><input class="input sm" data-add="${k}" placeholder="+ ${T('Ajouter une tâche (Entrée)', 'Add a task (Enter)')}"></div>
          </div>`;
        }).join('')}</div>`;

      el.querySelector('#addMs').onclick = () => editMilestone(null);
      el.querySelectorAll('[data-ms-edit]').forEach((b) => { b.onclick = () => editMilestone(p.milestones.find((m) => m.id === b.dataset.msEdit)); });
      el.querySelectorAll('[data-ms-pub]').forEach((b) => { b.onclick = () => { const m = p.milestones.find((x) => x.id === b.dataset.msPub); m.public = !m.public; m.updatedAt = Date.now(); S.touch(); DP.app.route(); }; });
      el.querySelector('#msFilter').onchange = (e) => { st.ms = e.target.value; DP.app.route(); };
      el.querySelector('#tq').addEventListener('input', U.debounce((e) => { st.q = e.target.value; DP.app.route(); }, 400));
      el.querySelector('#exportCsv').onclick = () => {
        const rows = [['Titre', 'Statut', 'Priorité', 'Catégorie', 'Jalon', 'Échéance', 'Description']].concat(p.tasks.map((t) => [t.title, t.status, t.priority, t.category, (p.milestones.find((m) => m.id === t.milestone) || {}).title || '', t.due || '', t.desc || '']));
        const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
        U.download(`${U.slug(p.name)}-taches.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
      };
      el.querySelectorAll('[data-add]').forEach((inp) => {
        inp.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' || !inp.value.trim()) return;
          p.tasks.push({ id: U.uid('task_'), title: inp.value.trim(), desc: '', status: inp.dataset.add, priority: 'med', category: '', milestone: st.ms && st.ms !== '_none' ? st.ms : '', due: '', createdAt: Date.now() });
          S.touch(); DP.app.refreshNav();
          DP.views.tasks.render(el);
          const again = el.querySelector(`[data-add="${inp.dataset.add}"]`); if (again) again.focus();
        });
      });

      let dragId = null;
      el.querySelectorAll('.kcard').forEach((c) => {
        c.addEventListener('dragstart', (e) => { dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
        c.addEventListener('dragend', () => c.classList.remove('dragging'));
        c.addEventListener('click', () => edit(el, c.dataset.id));
      });
      el.querySelectorAll('[data-drop]').forEach((zone) => {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('over'));
        zone.addEventListener('drop', (e) => {
          e.preventDefault(); zone.classList.remove('over');
          const id = dragId || e.dataTransfer.getData('text/plain');
          const t = p.tasks.find((x) => x.id === id);
          if (!t) return;
          const after = [...zone.querySelectorAll('.kcard')].find((c) => e.clientY < c.getBoundingClientRect().top + c.offsetHeight / 2);
          p.tasks.splice(p.tasks.indexOf(t), 1);
          t.status = zone.dataset.drop;
          if (t.status === 'done') t.doneAt = Date.now();
          if (after && after.dataset.id !== id) p.tasks.splice(p.tasks.findIndex((x) => x.id === after.dataset.id), 0, t);
          else p.tasks.push(t);
          S.touch(); DP.app.refreshNav(); DP.views.tasks.render(el);
        });
      });
    },
  };

  function cardHTML(t) {
    const m = S.project.milestones.find((x) => x.id === t.milestone);
    const d = t.due ? U.daysUntil(t.due) : null;
    return `<div class="kcard prio-${t.priority}" draggable="true" data-id="${t.id}">
      <strong>${U.esc(t.title)}</strong>
      ${t.desc ? `<p class="small muted">${U.esc(U.truncate(t.desc, 90))}</p>` : ''}
      <div class="kmeta">
        <span>${t.category ? `<span class="tag">${U.esc(t.category)}</span>` : ''}${m ? `<span class="tag">${UI.icon('milestone')} ${U.esc(U.truncate(m.title, 18))}</span>` : ''}</span>
        <span class="prio">${d != null && t.status !== 'done' ? `<span class="${d < 0 ? 'err' : ''}">${U.fmtDay(t.due)}</span> · ` : ''}${U.esc(L((PRIO.find((x) => x[0] === t.priority) || PRIO[1])[1]))}</span>
      </div>
    </div>`;
  }

  function edit(el, id) {
    const p = S.project;
    const t = p.tasks.find((x) => x.id === id);
    if (!t) return;
    UI.modal({
      title: T('Modifier la tâche', 'Edit task'),
      body: `
        <input class="input" id="tTitle" value="${U.esc(t.title)}">
        <textarea class="input" id="tDesc" rows="4" placeholder="${T('Détails, critère de fin…', 'Details, definition of done…')}">${U.esc(t.desc || '')}</textarea>
        <div class="fields">
          <label class="field"><span class="lbl">${T('Colonne', 'Column')}</span><select class="input" id="tStatus">${UI.options(COLS, t.status)}</select></label>
          <label class="field"><span class="lbl">${T('Priorité', 'Priority')}</span><select class="input" id="tPrio">${UI.options(PRIO, t.priority)}</select></label>
          <label class="field"><span class="lbl">${T('Jalon', 'Milestone')}</span><select class="input" id="tMs"><option value="">—</option>${p.milestones.map((m) => `<option value="${m.id}" ${t.milestone === m.id ? 'selected' : ''}>${U.esc(m.title)}</option>`).join('')}</select></label>
          <label class="field"><span class="lbl">${T('Échéance', 'Due date')}</span><input class="input" type="date" id="tDue" value="${U.esc(t.due || '')}"></label>
          <label class="field"><span class="lbl">${T('Catégorie', 'Category')}</span><input class="input" id="tCat" value="${U.esc(t.category || '')}" placeholder="Art, Code, Design…"></label>
          <label class="field"><span class="lbl">${T('Responsable', 'Assignee')}</span><select class="input" id="tWho"><option value="">—</option>${S.entities('team').map((m) => `<option value="${m.id}" ${t.assignee === m.id ? 'selected' : ''}>${U.esc(m.fields.name || '?')}</option>`).join('')}</select></label>
        </div>`,
      buttons: [
        { label: `${UI.icon('trash')} ${T('Supprimer', 'Delete')}`, cls: 'ghost danger-text', action: () => { S.trash('task', t); p.tasks = p.tasks.filter((x) => x.id !== id); S.touch(); DP.app.refreshNav(); DP.views.tasks.render(el); } },
        { label: T('Enregistrer', 'Save'), cls: 'primary', action: (c, root) => {
          t.title = root.querySelector('#tTitle').value.trim() || t.title;
          t.desc = root.querySelector('#tDesc').value;
          t.status = root.querySelector('#tStatus').value;
          t.priority = root.querySelector('#tPrio').value;
          t.milestone = root.querySelector('#tMs').value;
          t.due = root.querySelector('#tDue').value;
          t.category = root.querySelector('#tCat').value.trim();
          t.assignee = root.querySelector('#tWho').value;
          S.touch(); DP.app.refreshNav(); DP.views.tasks.render(el);
        } },
      ],
    });
  }

  function editMilestone(m) {
    const p = S.project;
    const isNew = !m;
    m = m || { id: U.uid('ms_'), title: '', date: '', description: '', public: true, done: false, createdAt: Date.now() };
    UI.modal({
      title: isNew ? T('Nouveau jalon', 'New milestone') : T('Modifier le jalon', 'Edit milestone'),
      body: `<label class="lbl">${T('Titre', 'Title')}</label><input class="input" id="mT" value="${U.esc(m.title)}" placeholder="${T('ex. Démo jouable', 'e.g. Playable demo')}">
        <label class="lbl">${T('Date visée', 'Target date')}</label><input class="input" type="date" id="mD" value="${U.esc(m.date || '')}">
        <label class="lbl">${T('Description (visible sur le portail si public)', 'Description (visible on the portal if public)')}</label><textarea class="input" id="mDesc" rows="3">${U.esc(m.description || '')}</textarea>
        <label class="check"><input type="checkbox" id="mDone" ${m.done ? 'checked' : ''}> ${T('Jalon atteint', 'Milestone reached')}</label>
        <label class="check"><input type="checkbox" id="mPub" ${m.public ? 'checked' : ''}> ${T('Afficher sur la roadmap du portail', 'Show on the portal roadmap')}</label>`,
      buttons: [
        ...(isNew ? [] : [{ label: `${UI.icon('trash')} ${T('Supprimer', 'Delete')}`, cls: 'ghost danger-text', action: () => {
          S.trash('milestone', m);
          p.milestones = p.milestones.filter((x) => x.id !== m.id);
          p.tasks.forEach((t) => { if (t.milestone === m.id) t.milestone = ''; });
          S.touch(); DP.app.route();
        } }]),
        { label: T('Enregistrer', 'Save'), cls: 'primary', action: (c, root) => {
          m.title = root.querySelector('#mT').value.trim() || T('Jalon', 'Milestone');
          m.date = root.querySelector('#mD').value;
          m.description = root.querySelector('#mDesc').value;
          m.done = root.querySelector('#mDone').checked;
          m.public = root.querySelector('#mPub').checked;
          m.updatedAt = Date.now();
          if (isNew) p.milestones.push(m);
          S.touch(); DP.app.route();
        } },
      ],
    });
  }
})();
