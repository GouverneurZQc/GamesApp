/* Vue : journal d'idées + discussion avec l'agent sur chaque idée */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;

  const ACTIONS = [
    { key: 'react', icon: 'sparkles', label: ['Suggestions', 'Suggestions'],
      fr: 'Réagis à mon idée : ce qui est fort, ce qui est faible, puis 3 à 5 suggestions concrètes pour l\'améliorer ou la pousser plus loin.',
      en: 'React to my idea: what is strong, what is weak, then 3 to 5 concrete suggestions to improve it or push it further.' },
    { key: 'expand', icon: 'feather', label: ['Développer', 'Develop'],
      fr: 'Développe cette idée en détail : fonctionnement précis, exemples concrets en jeu, variantes, et impact sur le reste du jeu (gameplay, histoire, production).',
      en: 'Develop this idea in detail: precise workings, concrete in-game examples, variants, and impact on the rest of the game (gameplay, story, production).' },
    { key: 'critique', icon: 'camera', label: ['Critique franche', 'Frank critique'], persona: 'critic',
      fr: 'Critique cette idée sans complaisance : risques, clichés, problèmes de design, coût de production. Donne une note sur 10 et ce qu\'il faudrait pour atteindre 9/10.',
      en: 'Critique this idea without complacency: risks, clichés, design problems, production cost. Give a score out of 10 and what it would take to reach 9/10.' },
    { key: 'variants', icon: 'dice', label: ['5 variantes', '5 variants'],
      fr: 'Propose 5 variantes très différentes de cette idée, de la plus sage à la plus audacieuse, avec pour chacune son intérêt principal.',
      en: 'Propose 5 very different variants of this idea, from safest to boldest, with the main appeal of each.' },
    { key: 'story', icon: 'book', label: ['Lien avec l\'histoire', 'Tie into the story'], persona: 'writer',
      fr: 'Comment intégrer cette idée à l\'histoire, aux personnages et aux lieux existants ? Propose des connexions concrètes et signale les incohérences.',
      en: 'How can this idea tie into the existing story, characters and locations? Propose concrete connections and flag inconsistencies.' },
    { key: 'implement', icon: 'box', label: ['Comment l\'implémenter', 'How to build it'], persona: 'tech',
      fr: 'Explique comment implémenter cette idée concrètement (systèmes, données, étapes, pièges), adaptée à mon moteur si je l\'ai indiqué, avec une estimation de complexité (S/M/L/XL).',
      en: 'Explain how to implement this idea concretely (systems, data, steps, pitfalls), tailored to my engine if specified, with a complexity estimate (S/M/L/XL).' },
    { key: 'questions', icon: 'info', label: ['Questions clés', 'Key questions'],
      fr: 'Pose-moi les 5 à 8 questions les plus importantes pour clarifier et renforcer cette idée. Pour chacune, donne 2 pistes de réponse.',
      en: 'Ask me the 5 to 8 most important questions to clarify and strengthen this idea. For each, give 2 possible answers.' },
  ];

  const state = { q: '', cat: '', status: '' };

  function statusDef(s) { return SC.IDEA_STATUS.find((x) => x[0] === s) || SC.IDEA_STATUS[0]; }
  function catLabel(c) { const x = SC.IDEA_CATS.find((y) => y[0] === c); return x ? L(x[1]) : c; }

  GF.views.ideas = {
    title: () => T('Idées', 'Ideas'),
    render(el, params) {
      const p = S.project;
      el.innerHTML = `
        <div class="split">
          <div class="split-list card">
            <button class="btn primary block" id="newIdea">${UI.icon('plus')} ${T('Nouvelle idée', 'New idea')}</button>
            <div class="search">${UI.icon('search')}<input class="input" id="q" value="${U.esc(state.q)}" placeholder="${T('Rechercher…', 'Search…')}"></div>
            <div class="row gap">
              <select class="input" id="fCat">${UI.options(SC.IDEA_CATS, state.cat, { empty: T('Toutes catégories', 'All categories') })}</select>
              <select class="input" id="fStatus">${UI.options(SC.IDEA_STATUS.map((s) => [s[0], s[1]]), state.status, { empty: T('Tous statuts', 'All statuses') })}</select>
            </div>
            <div class="list" id="ideaList"></div>
          </div>
          <div class="split-detail" id="ideaDetail"></div>
        </div>`;

      const listEl = el.querySelector('#ideaList');
      const detailEl = el.querySelector('#ideaDetail');
      let currentId = params.id;

      const renderList = () => {
        const q = state.q.toLowerCase();
        const items = p.ideas
          .filter((i) => (!state.cat || i.category === state.cat) && (!state.status || i.status === state.status))
          .filter((i) => !q || `${i.title} ${i.content} ${(i.tags || []).join(' ')}`.toLowerCase().includes(q))
          .sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
        listEl.innerHTML = items.length ? items.map((i) => `
          <button class="list-item ${i.id === currentId ? 'active' : ''}" data-id="${i.id}">
            <span class="dot" style="background:${statusDef(i.status)[2]}"></span>
            <span class="li-body">
              <strong>${i.pinned ? '★ ' : ''}${U.esc(i.title || U.truncate(i.content, 60) || T('(vide)', '(empty)'))}</strong>
              <small>${U.esc(catLabel(i.category))} · ${U.relTime(i.updatedAt)}${i.thread && i.thread.length ? ` · ${UI.icon('chat')} ${Math.ceil(i.thread.length / 2)}` : ''}</small>
            </span>
          </button>`).join('')
          : `<p class="muted pad">${p.ideas.length ? T('Aucun résultat.', 'No results.') : T('Aucune idée encore. Clique sur « Nouvelle idée » ou appuie sur Alt+N.', 'No ideas yet. Click "New idea" or press Alt+N.')}</p>`;
        listEl.querySelectorAll('.list-item').forEach((b) => {
          b.onclick = () => select(b.dataset.id);
        });
      };

      const select = (id) => {
        currentId = id;
        history.replaceState(null, '', `#/ideas/${id}`);
        listEl.querySelectorAll('.list-item').forEach((b) => b.classList.toggle('active', b.dataset.id === id));
        renderDetail();
      };

      const renderDetail = () => {
        const idea = p.ideas.find((i) => i.id === currentId);
        if (!idea) {
          detailEl.innerHTML = UI.empty('bulb', T('Choisis ou crée une idée', 'Pick or create an idea'),
            T('Chaque idée a sa propre discussion avec l\'agent : suggestions, critique, variantes, lien avec l\'histoire, image…', 'Each idea has its own conversation with the agent: suggestions, critique, variants, story ties, image…'),
            `<button class="btn primary" id="emptyNew">${UI.icon('plus')} ${T('Nouvelle idée', 'New idea')}</button>`);
          const b = detailEl.querySelector('#emptyNew'); if (b) b.onclick = () => GF.app.quickIdea();
          return;
        }
        idea.images = idea.images || [];
        idea.thread = idea.thread || [];
        detailEl.innerHTML = `
          <div class="card">
            <div class="row gap">
              <input class="title-input grow" id="iTitle" value="${U.esc(idea.title)}" placeholder="${T('Titre de l\'idée', 'Idea title')}">
              <button class="btn icon ghost ${idea.pinned ? 'on' : ''}" id="iPin" title="${T('Épingler', 'Pin')}">${UI.icon('star')}</button>
              <button class="btn icon ghost" id="iDel" title="${T('Supprimer', 'Delete')}">${UI.icon('trash')}</button>
            </div>
            <div class="row gap wrap">
              <select class="input" id="iCat" style="max-width:200px">${UI.options(SC.IDEA_CATS, idea.category)}</select>
              <select class="input" id="iStatus" style="max-width:180px">${UI.options(SC.IDEA_STATUS.map((s) => [s[0], s[1]]), idea.status)}</select>
              <input class="input grow" id="iTags" value="${U.esc((idea.tags || []).join(', '))}" placeholder="${T('tags, séparés, par des virgules', 'tags, comma, separated')}">
            </div>
            <textarea class="input auto big" id="iContent" rows="6" placeholder="${T('Décris ton idée…', 'Describe your idea…')}">${U.esc(idea.content)}</textarea>
            <div class="thumbs" id="iImgs">${idea.images.map((id) => UI.tile(id, { actions: ['view', 'download', 'attach', 'remove'] })).join('')}</div>
            <div class="row gap wrap small muted">
              <span>${T('Créée', 'Created')} ${U.fmtDate(idea.createdAt)}</span>
              <span class="grow"></span>
              <button class="btn sm ghost" id="iAddImg">${UI.icon('upload')} ${T('Ajouter une image', 'Add image')}</button>
              <button class="btn sm ghost" id="iGenImg">${UI.icon('wand')} ${T('Idée → image', 'Idea → image')}</button>
              <button class="btn sm ghost" id="iToGdd">${UI.icon('book')} ${T('Ajouter au GDD', 'Add to GDD')}</button>
              <button class="btn sm ghost" id="iToTask">${UI.icon('check')} ${T('Créer une tâche', 'Create a task')}</button>
              <button class="btn sm ghost" id="iToSheet">${UI.icon('users')} ${T('Créer une fiche', 'Create a sheet')}</button>
            </div>
            <div id="iImgStatus"></div>
          </div>

          <div class="card">
            <h3>${UI.icon('sparkles')} ${T('Demander à l\'agent', 'Ask the agent')}</h3>
            <div class="chips">${ACTIONS.map((a) => `<button class="chip" data-act="${a.key}">${UI.icon(a.icon)} ${U.esc(L(a.label))}</button>`).join('')}</div>
          </div>

          <div class="thread" id="thread">${idea.thread.map((m, i) => msgHTML(m, i)).join('')}</div>

          <div class="composer">
            <textarea class="input auto" id="follow" rows="2" placeholder="${T('Continue la discussion sur cette idée… (Ctrl+Entrée pour envoyer)', 'Keep discussing this idea… (Ctrl+Enter to send)')}"></textarea>
            <button class="btn primary" id="send">${UI.icon('send')}</button>
          </div>`;

        GF.images.hydrate(detailEl);
        UI.autoGrow(detailEl);
        const touch = () => { idea.updatedAt = Date.now(); S.touch(); };
        detailEl.querySelector('#iTitle').addEventListener('input', (e) => { idea.title = e.target.value; touch(); updateListItem(); });
        detailEl.querySelector('#iContent').addEventListener('input', (e) => { idea.content = e.target.value; touch(); updateListItem(); });
        detailEl.querySelector('#iCat').onchange = (e) => { idea.category = e.target.value; touch(); renderList(); };
        detailEl.querySelector('#iStatus').onchange = (e) => { idea.status = e.target.value; touch(); renderList(); };
        detailEl.querySelector('#iTags').addEventListener('input', (e) => { idea.tags = U.tagsFromString(e.target.value); touch(); });
        detailEl.querySelector('#iPin').onclick = () => { idea.pinned = !idea.pinned; touch(); renderList(); renderDetail(); };
        detailEl.querySelector('#iDel').onclick = async () => {
          if (!(await UI.confirm(T('Supprimer cette idée et sa discussion ?', 'Delete this idea and its conversation?'), { danger: true }))) return;
          p.ideas.splice(p.ideas.indexOf(idea), 1);
          S.touch(); GF.app.refreshNav();
          currentId = null; history.replaceState(null, '', '#/ideas');
          renderList(); renderDetail();
        };

        const imgsEl = detailEl.querySelector('#iImgs');
        UI.bindTiles(imgsEl, {
          remove: (id) => { idea.images = idea.images.filter((x) => x !== id); touch(); renderDetail(); },
        });
        const addImgs = async (files) => { const ids = await UI.importImages(files); idea.images.push(...ids); touch(); renderDetail(); };
        UI.setPaste(addImgs);
        UI.bindDrop(detailEl.querySelector('.card'), addImgs);
        detailEl.querySelector('#iAddImg').onclick = async () => {
          const ids = await UI.pickImages({ multiple: true });
          if (ids && ids.length) { idea.images.push(...ids); touch(); renderDetail(); }
        };
        detailEl.querySelector('#iGenImg').onclick = async (ev) => {
          const btn = ev.currentTarget;
          const st = detailEl.querySelector('#iImgStatus');
          btn.disabled = true;
          try {
            const { ids } = await GF.agent.generateImages({
              prompt: `${idea.title ? idea.title + '. ' : ''}${idea.content}`, kind: 'concept', style: 'project', aspect: '16:9', n: 1, source: 'idea',
              onStatus: (s) => { st.innerHTML = UI.spinner(s); },
            });
            idea.images.push(...ids); touch();
            UI.toast(T('Image générée ✔', 'Image generated ✔'), 'success');
            renderDetail();
          } catch (e) {
            st.innerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(e.message)}</div></div>`;
          } finally { btn.disabled = false; }
        };
        detailEl.querySelector('#iToGdd').onclick = () => toGdd(`## ${idea.title || T('Idée', 'Idea')}\n\n${idea.content}`);
        detailEl.querySelector('#iToTask').onclick = () => {
          p.tasks.unshift({ id: U.uid('task_'), title: idea.title || U.truncate(idea.content, 80), desc: idea.content, status: 'todo', priority: 'med', category: catLabel(idea.category), createdAt: Date.now() });
          S.touch(); GF.app.refreshNav();
          UI.toast(T('Tâche créée dans « À faire »', 'Task created in "To do"'), 'success');
        };
        detailEl.querySelector('#iToSheet').onclick = () => toSheet(idea);

        detailEl.querySelectorAll('[data-act]').forEach((b) => {
          b.onclick = () => {
            const a = ACTIONS.find((x) => x.key === b.dataset.act);
            ask(idea, GF.lang === 'en' ? a.en : a.fr, L(a.label), a.persona);
          };
        });
        const follow = detailEl.querySelector('#follow');
        const send = () => {
          const t = follow.value.trim();
          if (!t) return;
          follow.value = ''; UI.autoGrow(detailEl);
          ask(idea, t, null);
        };
        detailEl.querySelector('#send').onclick = send;
        follow.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } });
        bindThread(idea);

        if (GF.app.pending && GF.app.pending.ideaReact === idea.id) {
          GF.app.pending = null;
          const a = ACTIONS[0];
          ask(idea, GF.lang === 'en' ? a.en : a.fr, L(a.label));
        }
      };

      const updateListItem = U.debounce(renderList, 400);

      function msgHTML(m, i) {
        if (m.role === 'user') return `<div class="msg user" data-i="${i}">${m.label ? `<span class="msg-label">${UI.icon('sparkles')} ${U.esc(m.label)}</span>` : U.esc(m.content)}</div>`;
        return `<div class="msg ai" data-i="${i}"><div class="md">${GF.md.render(m.content)}</div>
          <div class="msg-actions">
            <button class="btn sm ghost" data-m="copy">${UI.icon('copy')} ${T('Copier', 'Copy')}</button>
            <button class="btn sm ghost" data-m="gdd">${UI.icon('book')} ${T('Ajouter au GDD', 'Add to GDD')}</button>
            <button class="btn sm ghost" data-m="append">${UI.icon('plus')} ${T('Ajouter à l\'idée', 'Append to idea')}</button>
            <button class="btn sm ghost" data-m="del">${UI.icon('trash')}</button>
          </div></div>`;
      }

      function bindThread(idea) {
        detailEl.querySelector('#thread').addEventListener('click', async (e) => {
          const b = e.target.closest('[data-m]');
          if (!b) return;
          const i = +b.closest('.msg').dataset.i;
          const m = idea.thread[i];
          if (b.dataset.m === 'copy') { await U.copyText(m.content); UI.toast(T('Copié', 'Copied'), 'success'); }
          if (b.dataset.m === 'gdd') toGdd(m.content);
          if (b.dataset.m === 'append') { idea.content = `${idea.content}\n\n---\n${m.content}`.trim(); idea.updatedAt = Date.now(); S.touch(); renderDetail(); }
          if (b.dataset.m === 'del') {
            // on supprime la paire question/réponse pour garder l'alternance
            const start = idea.thread[i - 1] && idea.thread[i - 1].role === 'user' ? i - 1 : i;
            idea.thread.splice(start, i - start + 1);
            S.touch(); renderDetail();
          }
        });
      }

      async function ask(idea, prompt, label, persona) {
        const threadEl = detailEl.querySelector('#thread');
        const history = idea.thread.map((m) => ({ role: m.role, content: m.content }));
        const userMsg = { role: 'user', content: prompt, label: label || '', ts: Date.now() };
        idea.thread.push(userMsg);
        threadEl.insertAdjacentHTML('beforeend', msgHTML(userMsg, idea.thread.length - 1));
        const extra = GF.lang === 'en'
          ? `<current_idea>\nTitle: ${idea.title}\nCategory: ${catLabel(idea.category)}\nStatus: ${L(statusDef(idea.status)[1])}\n\n${idea.content}\n</current_idea>\nThe user is working on the idea above. Base your answers on it.`
          : `<idee_en_cours>\nTitre : ${idea.title}\nCatégorie : ${catLabel(idea.category)}\nStatut : ${L(statusDef(idea.status)[1])}\n\n${idea.content}\n</idee_en_cours>\nL'utilisateur travaille sur l'idée ci-dessus. Base tes réponses dessus.`;
        const text = await GF.agent.run({
          into: threadEl, prompt, history, persona: persona || 'designer', extra, title: label || 'Forge', saveAsIdea: false,
          images: idea.images.length && history.length === 0 && GF.ai.PROVIDERS[safeVision()]?.vision ? idea.images.slice(0, 3) : [],
          actions: [{ label: T('Ajouter au GDD', 'Add to GDD'), icon: 'book', onClick: (t) => toGdd(t) }],
        });
        if (text) {
          idea.thread.push({ role: 'assistant', content: text, ts: Date.now() });
          idea.updatedAt = Date.now();
          S.touch();
          renderList();
          renderDetail();
          const th = detailEl.querySelector('#thread');
          if (th && th.lastElementChild) th.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          idea.thread.pop();
        }
      }

      function safeVision() {
        try { return GF.ai.resolve('vision').id; } catch (e) { return 'pollinations'; }
      }

      function toGdd(content) {
        const secs = p.gdd.sections;
        UI.modal({
          title: T('Ajouter au Game Design Doc', 'Add to Game Design Doc'),
          body: `<label class="lbl">${T('Section', 'Section')}</label>
            <select class="input" id="gSec">${secs.map((s) => `<option value="${s.id}">${U.esc(s.key ? L(SC.gddDef(s.key).title) : s.title)}</option>`).join('')}</select>`,
          buttons: [
            { label: T('Annuler', 'Cancel'), cls: 'ghost' },
            { label: T('Ajouter', 'Add'), cls: 'primary', action: (c, root) => {
              const s = secs.find((x) => x.id === root.querySelector('#gSec').value);
              s.content = `${s.content.trim()}\n\n${content}`.trim();
              S.touch();
              UI.toast(T('Ajouté au GDD', 'Added to GDD'), 'success');
            } },
          ],
        });
      }

      function toSheet(idea) {
        UI.modal({
          title: T('Créer une fiche à partir de l\'idée', 'Create a sheet from the idea'),
          body: `<label class="lbl">${T('Type de fiche', 'Sheet type')}</label>
            <select class="input" id="sType">${SC.ENTITY_ORDER.map((t) => `<option value="${t}" ${(idea.category === 'vehicle' && t === 'vehicles') || (idea.category === 'character' && t === 'characters') || (idea.category === 'level' && t === 'locations') ? 'selected' : ''}>${U.esc(L(SC.ENTITIES[t].singular))}</option>`).join('')}</select>
            <p class="muted small">${T('Astuce : ouvre ensuite la fiche et clique sur « Compléter avec l\'IA ».', 'Tip: then open the sheet and click "Complete with AI".')}</p>`,
          buttons: [
            { label: T('Annuler', 'Cancel'), cls: 'ghost' },
            { label: T('Créer', 'Create'), cls: 'primary', action: (c, root) => {
              const t = root.querySelector('#sType').value;
              const descKey = SC.field(t, 'description') ? 'description' : SC.field(t, 'summary') ? 'summary' : 'notes';
              const e = S.newEntity(t, { name: idea.title || T('Nouvelle fiche', 'New sheet'), [descKey]: idea.content });
              e.images = [...idea.images]; e.cover = idea.images[0] || '';
              GF.app.go(`e/${t}/${e.id}`);
            } },
          ],
        });
      }

      el.querySelector('#newIdea').onclick = () => {
        const idea = GF.app.createIdea({ category: state.cat || 'gameplay' });
        renderList(); select(idea.id);
        const t = detailEl.querySelector('#iContent'); if (t) t.focus();
      };
      el.querySelector('#q').addEventListener('input', (e) => { state.q = e.target.value; renderList(); });
      el.querySelector('#fCat').onchange = (e) => { state.cat = e.target.value; renderList(); };
      el.querySelector('#fStatus').onchange = (e) => { state.status = e.target.value; renderList(); };

      if (!currentId && p.ideas.length && window.innerWidth > 900) currentId = p.ideas.slice().sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt))[0].id;
      renderList();
      renderDetail();
    },
  };
})();
