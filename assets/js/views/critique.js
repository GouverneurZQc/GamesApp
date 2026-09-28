/* Vue : critique franche de captures d'écran par l'agent (vision) */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui;

  const FOCUS = [
    ['global', ['Impression générale', 'Overall impression']],
    ['art', ['Direction artistique', 'Art direction']],
    ['readability', ['Lisibilité & UI/HUD', 'Readability & UI/HUD']],
    ['composition', ['Composition & cadrage', 'Composition & framing']],
    ['lighting', ['Lumière & couleurs', 'Lighting & color']],
    ['gamefeel', ['Game feel & ergonomie', 'Game feel & ergonomics']],
    ['level', ['Level design', 'Level design']],
    ['access', ['Accessibilité', 'Accessibility']],
    ['coherence', ['Cohérence avec le projet', 'Project consistency']],
    ['marketing', ['Potentiel marketing (capsule, trailer)', 'Marketing appeal (capsule, trailer)']],
    ['compare', ['Comparer avant / après', 'Compare before / after']],
  ];
  const TONES = [
    ['gentle', ['Encourageant', 'Encouraging'], ['bienveillante mais honnête', 'kind but honest']],
    ['frank', ['Franc & constructif', 'Frank & constructive'], ['franche, directe et constructive, sans flatterie', 'frank, direct and constructive, no flattery']],
    ['brutal', ['Brutalement honnête', 'Brutally honest'], ['brutalement honnête, comme un directeur artistique exigeant ou un joueur impitoyable sur Steam, sans aucune complaisance', 'brutally honest, like a demanding art director or a merciless Steam reviewer, with zero complacency']],
  ];

  let pending = [];
  let focus = ['global', 'art', 'readability'];
  let tone = null;
  let ctxText = '';
  let selected = null;

  GF.views.critique = {
    title: () => T('Critique de captures', 'Screenshot critique'),
    render(el, params) {
      const p = S.project;
      tone = tone || S.settings.agent.frankness || 'frank';
      if (GF.app.pending && GF.app.pending.critiqueImages) {
        pending = Array.from(new Set([...pending, ...GF.app.pending.critiqueImages]));
        GF.app.pending = null;
        selected = null;
      }
      if (params.id) selected = params.id;
      const canSee = GF.agent.canSee();
      el.innerHTML = `
        ${canSee ? '' : `<div class="banner warn">${UI.icon('key')}<div><strong>${T('Vision requise', 'Vision required')}</strong> — ${T('pour analyser des images, configure un fournisseur avec vision : Claude (recommandé), OpenAI, Gemini, OpenRouter ou un modèle Ollama avec vision.', 'to analyze images, set up a vision provider: Claude (recommended), OpenAI, Gemini, OpenRouter or an Ollama vision model.')}</div><a class="btn sm primary" href="#/settings">${T('Paramètres', 'Settings')}</a></div>`}
        <div class="crit-layout">
          <div class="crit-left">
            <div class="card">
              <h3>${UI.icon('camera')} ${T('Nouvelle critique', 'New critique')}</h3>
              <div class="dropzone big" id="cDrop">
                ${pending.length ? `<div class="thumbs" id="cPending">${pending.map((id) => UI.tile(id, { actions: ['view', 'remove'] })).join('')}</div>` : `${UI.icon('upload', 'big')}<p>${T('Glisse tes captures ici, colle-les avec Ctrl+V, ou', 'Drop your screenshots here, paste them with Ctrl+V, or')}</p>`}
                <div class="row gap center"><button class="btn sm" id="cUp">${UI.icon('upload')} ${T('Choisir des fichiers', 'Choose files')}</button>
                <button class="btn sm ghost" id="cPick">${UI.icon('image')} ${T('Depuis le projet', 'From project')}</button></div>
              </div>
              <div class="lbl">${T('Axes de critique', 'Critique focus')}</div>
              <div class="chips">${FOCUS.map(([k, lab]) => `<button class="chip toggle ${focus.includes(k) ? 'on' : ''}" data-focus="${k}">${U.esc(L(lab))}</button>`).join('')}</div>
              <div class="lbl">${T('Ton', 'Tone')}</div>
              <div class="seg wide">${TONES.map(([k, lab]) => `<button data-tone="${k}" class="${tone === k ? 'on' : ''}">${U.esc(L(lab))}</button>`).join('')}</div>
              <label class="lbl">${T('Contexte (optionnel)', 'Context (optional)')}</label>
              <textarea class="input auto" id="cCtx" rows="2" placeholder="${T('Ce que montre la capture, ce qui t\'inquiète, l\'effet recherché…', 'What the screenshot shows, what worries you, the intended effect…')}">${U.esc(ctxText)}</textarea>
              <button class="btn primary block" id="cGo" ${pending.length ? '' : 'disabled'}>${UI.icon('sparkles')} ${T('Analyser franchement', 'Get an honest review')}</button>
            </div>
            <div class="card">
              <h3>${T('Historique', 'History')}</h3>
              <div class="list" id="cHist">${p.critiques.length ? p.critiques.map((c) => `
                <button class="list-item crit-item ${c.id === selected ? 'active' : ''}" data-id="${c.id}">
                  <span class="mini-thumb"><img data-img="${c.images[0]}" alt=""></span>
                  <span class="li-body"><strong>${U.esc(c.title)}</strong><small>${U.relTime(c.createdAt)} · ${c.images.length} ${T('image(s)', 'image(s)')}</small></span>
                </button>`).join('') : `<p class="muted pad">${T('Aucune critique pour l\'instant.', 'No critiques yet.')}</p>`}</div>
            </div>
          </div>
          <div class="crit-right" id="cRight"></div>
        </div>`;

      const addPending = (ids) => { pending = Array.from(new Set([...pending, ...ids])); selected = null; saveCtx(); GF.app.route(); };
      const saveCtx = () => { const c = el.querySelector('#cCtx'); if (c) ctxText = c.value; };
      const addFiles = async (files) => addPending(await UI.importImages(files));
      UI.setPaste(addFiles);
      UI.bindDrop(el.querySelector('#cDrop'), addFiles);
      el.querySelector('#cUp').onclick = async () => { const files = await U.pickFiles({ multiple: true }); if (files.length) addFiles(files); };
      el.querySelector('#cPick').onclick = async () => { const ids = await UI.pickImages({ multiple: true }); if (ids && ids.length) addPending(ids); };
      const pend = el.querySelector('#cPending');
      if (pend) UI.bindTiles(pend, { remove: (id) => { pending = pending.filter((x) => x !== id); saveCtx(); GF.app.route(); } });
      el.querySelectorAll('[data-focus]').forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.focus;
          focus = focus.includes(k) ? focus.filter((x) => x !== k) : [...focus, k];
          b.classList.toggle('on');
        };
      });
      el.querySelectorAll('[data-tone]').forEach((b) => {
        b.onclick = () => { tone = b.dataset.tone; el.querySelectorAll('[data-tone]').forEach((x) => x.classList.toggle('on', x === b)); };
      });
      el.querySelector('#cCtx').addEventListener('input', saveCtx);
      el.querySelector('#cGo').onclick = () => startCritique(el);
      el.querySelectorAll('.crit-item').forEach((b) => { b.onclick = () => { selected = b.dataset.id; history.replaceState(null, '', `#/critique/${selected}`); el.querySelectorAll('.crit-item').forEach((x) => x.classList.toggle('active', x === b)); renderRight(el); }; });
      renderRight(el);
    },
  };

  function buildPrompt(n, focusKeys, toneKey, context) {
    const en = GF.lang === 'en';
    const toneDef = TONES.find((t) => t[0] === toneKey) || TONES[1];
    const labels = focusKeys.filter((k) => k !== 'compare').map((k) => L(FOCUS.find((f) => f[0] === k)[1]));
    const compare = focusKeys.includes('compare');
    if (en) {
      return `You receive ${n} screenshot(s) of my game in development.${context ? `\nContext from the developer: ${context}` : ''}
Give a ${L(toneDef[2])} critique${labels.length ? `, focused on: ${labels.join(', ')}` : ''}.${compare ? '\nThe images are in order: BEFORE then AFTER. Compare them explicitly: what improved, what got worse, what is still missing.' : ''}
Expected format:
## Verdict in one sentence
## Scores
| Criterion | Score /10 | Comment |
(one row per criterion)
## What works
## Problems (most serious first)
For each: what is wrong, why it hurts the player, how to fix it concretely.
## Quick wins (under one hour)
## Priority #1
Be precise: refer to areas of the image (top left, the character in the center…). No flattery. If something is unreadable or ambiguous in the image, say so.`;
    }
    return `Tu reçois ${n} capture(s) d'écran de mon jeu en développement.${context ? `\nContexte du développeur : ${context}` : ''}
Fais une critique ${L(toneDef[2])}${labels.length ? `, axée sur : ${labels.join(', ')}` : ''}.${compare ? '\nLes images sont dans l\'ordre : AVANT puis APRÈS. Compare-les explicitement : ce qui s\'est amélioré, ce qui a empiré, ce qui manque encore.' : ''}
Format attendu :
## Verdict en une phrase
## Notes
| Critère | Note /10 | Commentaire |
(une ligne par critère)
## Ce qui fonctionne
## Problèmes (du plus grave au moins grave)
Pour chacun : ce qui ne va pas, pourquoi ça gêne le joueur, comment corriger concrètement.
## Corrections rapides (moins d'une heure)
## Priorité n°1
Sois précis : réfère-toi aux zones de l'image (en haut à gauche, le personnage au centre…). Aucune flatterie. Si un élément est illisible ou ambigu dans l'image, dis-le.`;
  }

  async function startCritique(el) {
    const p = S.project;
    if (!pending.length) return;
    const images = pending.slice(0, 8);
    const prompt = buildPrompt(images.length, focus, tone, ctxText.trim());
    const c = {
      id: U.uid('crit_'), images, focus: [...focus], tone, context: ctxText.trim(),
      title: U.truncate(ctxText.trim() || focus.map((k) => L(FOCUS.find((f) => f[0] === k)[1])).join(', ') || T('Critique', 'Critique'), 60),
      createdAt: Date.now(), thread: [],
    };
    pending = []; ctxText = '';
    p.critiques.unshift(c);
    S.touch(); GF.app.refreshNav();
    selected = c.id;
    history.replaceState(null, '', `#/critique/${c.id}`);
    GF.views.critique.render(el, { id: c.id });
    GF.images.hydrate(el);
    const r = el.querySelector('#cRetry');
    if (r) r.remove();
    await ask(el, c, prompt, images, true);
  }

  async function ask(el, c, prompt, images, first) {
    const right = el.querySelector('#cRight');
    const threadEl = right.querySelector('#cThread');
    if (!first) threadEl.insertAdjacentHTML('beforeend', `<div class="msg user">${U.esc(prompt)}</div>`);
    const history = c.thread.map((m) => ({ role: m.role, content: m.content, images: m.images }));
    const text = await GF.agent.run({
      into: threadEl, prompt, images, history, persona: 'critic', title: first ? T('Critique', 'Critique') : 'Forge', task: 'vision', saveAsIdea: true,
      ideaTitle: `${T('Critique', 'Critique')} : ${c.title}`, ideaCategory: 'art',
      extra: GF.lang === 'en' ? 'You are reviewing screenshots of the project described above.' : 'Tu examines des captures d\'écran du projet décrit ci-dessus.',
      actions: [{ label: T('Créer des tâches depuis la critique', 'Create tasks from critique'), icon: 'check', onClick: (t) => tasksFromCritique(t) }],
    });
    if (text) {
      c.thread.push({ role: 'user', content: prompt, images });
      c.thread.push({ role: 'assistant', content: text });
      S.touch();
      renderRight(el);
    }
  }

  async function tasksFromCritique(text) {
    try {
      UI.toast(T('L\'agent transforme la critique en tâches…', 'The agent is turning the critique into tasks…'));
      const data = await GF.agent.json({
        prompt: (GF.lang === 'en' ? 'Turn this critique into a list of concrete, actionable tasks (max 10). JSON array of {"title": string, "priority": "high"|"med"|"low"}.\n\n'
          : 'Transforme cette critique en liste de tâches concrètes et actionnables (10 max). Tableau JSON de {"title": texte, "priority": "high"|"med"|"low"}.\n\n') + text,
        context: false,
      });
      const arr = (Array.isArray(data) ? data : Object.values(data).find(Array.isArray) || []).filter((x) => x && x.title);
      arr.forEach((x) => S.project.tasks.unshift({ id: U.uid('task_'), title: String(x.title), desc: '', status: 'todo', priority: ['high', 'med', 'low'].includes(x.priority) ? x.priority : 'med', category: T('Critique', 'Critique'), createdAt: Date.now() }));
      S.touch(); GF.app.refreshNav();
      UI.toast(T(`${arr.length} tâche(s) ajoutée(s)`, `${arr.length} task(s) added`), 'success');
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  function renderRight(el) {
    const right = el.querySelector('#cRight');
    const c = S.project.critiques.find((x) => x.id === selected);
    if (!c) {
      right.innerHTML = UI.empty('camera', T('Envoie une capture, l\'agent te répond franchement', 'Send a screenshot, the agent answers frankly'),
        T('Notes /10 par critère, problèmes classés par gravité, corrections rapides et priorité n°1. Tu peux ensuite poursuivre la discussion.', 'Scores /10 per criterion, problems ranked by severity, quick wins and #1 priority. You can then keep the conversation going.'));
      return;
    }
    right.innerHTML = `
      <div class="card">
        <div class="card-head"><h3>${U.esc(c.title)}</h3>
          <div class="row gap"><span class="muted small">${U.fmtDate(c.createdAt)}</span>
          <button class="btn icon sm ghost" id="cDel" title="${T('Supprimer', 'Delete')}">${UI.icon('trash')}</button></div></div>
        <div class="thumbs big" id="cImgs">${c.images.map((id) => UI.tile(id, { actions: ['view', 'download', 'attach'] })).join('')}</div>
      </div>
      <div class="thread" id="cThread">${c.thread.map((m, i) => (m.role === 'user'
        ? (i === 0 ? '' : `<div class="msg user">${U.esc(m.content)}</div>`)
        : `<div class="msg ai" data-i="${i}"><div class="md">${GF.md.render(m.content)}</div>
            <div class="msg-actions">
              <button class="btn sm ghost" data-m="copy">${UI.icon('copy')} ${T('Copier', 'Copy')}</button>
              <button class="btn sm ghost" data-m="tasks">${UI.icon('check')} ${T('Créer des tâches', 'Create tasks')}</button>
              <button class="btn sm ghost" data-m="idea">${UI.icon('bulb')} ${T('Garder comme idée', 'Keep as idea')}</button>
            </div></div>`)).join('')}</div>
      ${c.thread.length ? '' : `<button class="btn primary" id="cRetry">${UI.icon('refresh')} ${T('Lancer l\'analyse', 'Run the analysis')}</button>`}
      <div class="composer">
        <textarea class="input auto" id="cFollow" rows="2" placeholder="${T('Pose une question sur la critique, ou colle une nouvelle version…', 'Ask about the critique, or paste a new version…')}"></textarea>
        <button class="btn primary" id="cSend">${UI.icon('send')}</button>
      </div>`;
    GF.images.hydrate(right);
    UI.bindTiles(right.querySelector('#cImgs'));
    right.querySelector('#cThread').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      const m = c.thread[+b.closest('.msg').dataset.i];
      if (!m) return;
      if (b.dataset.m === 'copy') { await U.copyText(m.content); UI.toast(T('Copié', 'Copied'), 'success'); }
      if (b.dataset.m === 'tasks') tasksFromCritique(m.content);
      if (b.dataset.m === 'idea') {
        S.project.ideas.unshift({ id: U.uid('idea_'), title: `${T('Critique', 'Critique')} : ${c.title}`, content: m.content, category: 'art', tags: ['critique'], status: 'explore', pinned: false, images: c.images.slice(0, 3), thread: [], createdAt: Date.now(), updatedAt: Date.now() });
        S.touch(); GF.app.refreshNav(); UI.toast(T('Ajouté aux idées', 'Added to ideas'), 'success');
      }
    });
    const retry = right.querySelector('#cRetry');
    if (retry) retry.onclick = () => { retry.remove(); ask(el, c, buildPrompt(c.images.length, c.focus, c.tone, c.context), c.images, true); };
    right.querySelector('#cDel').onclick = async () => {
      if (!(await UI.confirm(T('Supprimer cette critique ?', 'Delete this critique?'), { danger: true }))) return;
      S.project.critiques = S.project.critiques.filter((x) => x.id !== c.id);
      selected = null; S.touch(); GF.app.refreshNav(); GF.app.go('critique');
    };
    const send = () => {
      const t = right.querySelector('#cFollow').value.trim();
      if (!t) return;
      right.querySelector('#cFollow').value = '';
      ask(el, c, t, [], false);
    };
    right.querySelector('#cSend').onclick = send;
    right.querySelector('#cFollow').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } });
  }
})();
