/* Vue : tâches & roadmap (kanban) */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui;

  const COLS = [
    ['backlog', ['Backlog / idées', 'Backlog']],
    ['todo', ['À faire', 'To do']],
    ['doing', ['En cours', 'In progress']],
    ['done', ['Terminé', 'Done']],
  ];
  const PRIO = [['high', ['Haute', 'High']], ['med', ['Moyenne', 'Medium']], ['low', ['Basse', 'Low']]];

  GF.views.tasks = {
    title: () => T('Tâches & roadmap', 'Tasks & roadmap'),
    render(el) {
      const p = S.project;
      const total = p.tasks.length, done = p.tasks.filter((t) => t.status === 'done').length;
      el.innerHTML = `
        <div class="page-head">
          <div class="grow">
            <div class="row gap"><strong>${done}/${total}</strong><span class="muted small">${T('tâches terminées', 'tasks done')}</span></div>
            <i class="bar"><b style="width:${total ? (done / total) * 100 : 0}%"></b></i>
          </div>
          <div class="row gap wrap">
            <button class="btn" id="aiPlan">${UI.icon('sparkles')} ${T('Plan de production par l\'IA', 'AI production plan')}</button>
            <button class="btn" id="aiNext">${UI.icon('target')} ${T('Que faire cette semaine ?', 'What to do this week?')}</button>
          </div>
        </div>
        <div id="tOut"></div>
        <div class="kanban">${COLS.map(([k, lab]) => {
          const list = p.tasks.filter((t) => t.status === k);
          return `<div class="kcol" data-col="${k}">
            <div class="kcol-head"><strong>${U.esc(L(lab))}</strong><em>${list.length}</em></div>
            <div class="kcol-body" data-drop="${k}">${list.map(cardHTML).join('')}</div>
            <div class="kadd"><input class="input sm" data-add="${k}" placeholder="+ ${T('Ajouter une tâche (Entrée)', 'Add a task (Enter)')}"></div>
          </div>`;
        }).join('')}</div>`;

      el.querySelectorAll('[data-add]').forEach((inp) => {
        inp.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' || !inp.value.trim()) return;
          p.tasks.push({ id: U.uid('task_'), title: inp.value.trim(), desc: '', status: inp.dataset.add, priority: 'med', category: '', createdAt: Date.now() });
          S.touch(); GF.app.refreshNav();
          GF.views.tasks.render(el);
          const again = el.querySelector(`[data-add="${inp.dataset.add}"]`); if (again) again.focus();
        });
      });

      // glisser-déposer
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
          S.touch(); GF.app.refreshNav(); GF.views.tasks.render(el);
        });
      });

      el.querySelector('#aiPlan').onclick = () => aiPlan(el);
      el.querySelector('#aiNext').onclick = () => {
        const open = p.tasks.filter((t) => t.status !== 'done').map((t) => `- [${t.status}] (${t.priority}) ${t.title}`).join('\n');
        GF.agent.run({
          into: el.querySelector('#tOut'), position: 'prepend', title: T('Cette semaine', 'This week'), persona: 'producer',
          prompt: GF.lang === 'en'
            ? `Here are my open tasks:\n${open || '(none)'}\n\nBased on my project and team, what should I focus on this week? Give a realistic day-by-day plan, what to postpone, and the #1 risk.`
            : `Voici mes tâches ouvertes :\n${open || '(aucune)'}\n\nSelon mon projet et mon équipe, sur quoi dois-je me concentrer cette semaine ? Donne un plan réaliste jour par jour, ce qu'il faut reporter, et le risque n°1.`,
        });
      };
    },
  };

  function cardHTML(t) {
    return `<div class="kcard prio-${t.priority}" draggable="true" data-id="${t.id}">
      <strong>${U.esc(t.title)}</strong>
      ${t.desc ? `<p class="small muted">${U.esc(U.truncate(t.desc, 90))}</p>` : ''}
      <div class="kmeta">${t.category ? `<span class="tag">${U.esc(t.category)}</span>` : ''}<span class="prio">${U.esc(L((PRIO.find((x) => x[0] === t.priority) || PRIO[1])[1]))}</span></div>
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
        <textarea class="input" id="tDesc" rows="4" placeholder="${T('Détails, critères de fin…', 'Details, definition of done…')}">${U.esc(t.desc || '')}</textarea>
        <div class="row gap wrap">
          <label class="field"><span class="lbl">${T('Colonne', 'Column')}</span><select class="input" id="tStatus">${UI.options(COLS, t.status)}</select></label>
          <label class="field"><span class="lbl">${T('Priorité', 'Priority')}</span><select class="input" id="tPrio">${UI.options(PRIO, t.priority)}</select></label>
          <label class="field"><span class="lbl">${T('Catégorie', 'Category')}</span><input class="input" id="tCat" value="${U.esc(t.category || '')}" placeholder="Art, Code, Design…"></label>
        </div>`,
      buttons: [
        { label: `${UI.icon('trash')} ${T('Supprimer', 'Delete')}`, cls: 'ghost danger-text', action: () => { p.tasks = p.tasks.filter((x) => x.id !== id); S.touch(); GF.app.refreshNav(); GF.views.tasks.render(el); } },
        { label: T('Enregistrer', 'Save'), cls: 'primary', action: (c, root) => {
          t.title = root.querySelector('#tTitle').value.trim() || t.title;
          t.desc = root.querySelector('#tDesc').value;
          t.status = root.querySelector('#tStatus').value;
          t.priority = root.querySelector('#tPrio').value;
          t.category = root.querySelector('#tCat').value.trim();
          S.touch(); GF.app.refreshNav(); GF.views.tasks.render(el);
        } },
      ],
    });
  }

  async function aiPlan(el) {
    const p = S.project;
    const out = el.querySelector('#tOut');
    out.innerHTML = `<div class="card">${UI.spinner(T('L\'agent prépare un plan de production…', 'The agent is preparing a production plan…'))}</div>`;
    try {
      const existing = p.tasks.map((t) => t.title).join(' | ');
      const data = await GF.agent.json({
        prompt: GF.lang === 'en'
          ? `Build a realistic production plan for my game as a list of 12 to 25 concrete tasks, ordered (prototype → vertical slice → content → polish → launch), adapted to my team and scope.${existing ? ` Do not repeat existing tasks: ${existing}` : ''} JSON array of {"title": string, "desc": string (1 sentence, definition of done), "priority": "high"|"med"|"low", "category": string (Design, Code, Art, Audio, Story, Marketing, Production)}.`
          : `Construis un plan de production réaliste pour mon jeu sous forme de 12 à 25 tâches concrètes, ordonnées (prototype → vertical slice → contenu → polish → sortie), adaptées à mon équipe et au scope.${existing ? ` Ne répète pas les tâches existantes : ${existing}` : ''} Tableau JSON de {"title": texte, "desc": texte (1 phrase, critère de fin), "priority": "high"|"med"|"low", "category": texte (Design, Code, Art, Audio, Histoire, Marketing, Production)}.`,
        persona: 'producer', maxTokens: 16000,
      });
      const arr = (Array.isArray(data) ? data : Object.values(data).find(Array.isArray) || []).filter((x) => x && x.title);
      if (!arr.length) throw new Error(T('Aucune tâche proposée.', 'No tasks proposed.'));
      out.innerHTML = `<div class="card"><h3>${UI.icon('sparkles')} ${T('Plan proposé', 'Proposed plan')}</h3>
        <div class="proposals">${arr.map((x, i) => `<label class="proposal"><input type="checkbox" data-i="${i}" checked><div><strong>${U.esc(x.title)}</strong> <span class="tag">${U.esc(x.category || '')}</span><p class="small">${U.esc(x.desc || '')}</p></div></label>`).join('')}</div>
        <div class="row gap"><button class="btn primary" id="pKeep">${UI.icon('check')} ${T('Ajouter au backlog', 'Add to backlog')}</button><button class="btn ghost" id="pNo">${T('Ignorer', 'Discard')}</button></div></div>`;
      out.querySelector('#pNo').onclick = () => { out.innerHTML = ''; };
      out.querySelector('#pKeep').onclick = () => {
        out.querySelectorAll('input[data-i]').forEach((cb) => {
          if (!cb.checked) return;
          const x = arr[+cb.dataset.i];
          p.tasks.push({ id: U.uid('task_'), title: String(x.title), desc: String(x.desc || ''), status: 'backlog', priority: ['high', 'med', 'low'].includes(x.priority) ? x.priority : 'med', category: String(x.category || ''), createdAt: Date.now() });
        });
        S.touch(); GF.app.refreshNav(); GF.views.tasks.render(el);
        UI.toast(T('Tâches ajoutées au backlog', 'Tasks added to backlog'), 'success');
      };
    } catch (e) {
      out.innerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(e.message)}</div></div>`;
    }
  }
})();
