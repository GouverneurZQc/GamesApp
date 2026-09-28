/* Vue : paramètres — fournisseurs IA, comportement de l'agent, données */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui;

  GF.views.settings = {
    title: () => T('Paramètres', 'Settings'),
    async render(el) {
      const st = S.settings, ag = st.agent;
      const PR = GF.ai.PROVIDERS;
      const ready = (id) => GF.ai.isReady(id);
      const provOpts = (cap) => Object.entries(PR).filter(([, d]) => d[cap])
        .map(([id, d]) => `<option value="${id}" ${(cap === 'text' ? st.textProvider : cap === 'vision' ? st.visionProvider : st.imageProvider) === id ? 'selected' : ''}>${U.esc(d.label)}${ready(id) ? ' ✓' : d.needsKey ? ` — ${T('clé manquante', 'key missing')}` : ''}</option>`).join('');
      let usage = '';
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const e = await navigator.storage.estimate();
          usage = `${(e.usage / 1048576).toFixed(1)} Mo ${T('utilisés', 'used')}${e.quota ? ` / ${(e.quota / 1073741824).toFixed(1)} Go ${T('disponibles', 'available')}` : ''}`;
        }
      } catch (e) { /* ignore */ }

      el.innerHTML = `
        <div class="settings">
          <div class="card">
            <h3>${UI.icon('globe')} ${T('Général', 'General')}</h3>
            <div class="row gap wrap">
              <div class="field"><span class="lbl">${T('Langue', 'Language')}</span>
                <div class="seg" id="sLang"><button data-v="fr" class="${st.lang === 'fr' ? 'on' : ''}">Français</button><button data-v="en" class="${st.lang === 'en' ? 'on' : ''}">English</button></div></div>
              <div class="field"><span class="lbl">${T('Thème', 'Theme')}</span>
                <div class="seg" id="sTheme"><button data-v="dark" class="${st.theme === 'dark' ? 'on' : ''}">${T('Sombre', 'Dark')}</button><button data-v="light" class="${st.theme === 'light' ? 'on' : ''}">${T('Clair', 'Light')}</button></div></div>
            </div>
          </div>

          <div class="card">
            <h3>${UI.icon('sparkles')} ${T('Quelle IA fait quoi ?', 'Which AI does what?')}</h3>
            <p class="muted small">${T('Si le fournisseur choisi n\'est pas configuré, l\'app utilise automatiquement un autre fournisseur configuré, ou le mode gratuit.', 'If the chosen provider is not configured, the app automatically uses another configured provider, or free mode.')}</p>
            <div class="fields">
              <label class="field"><span class="lbl">${T('Agent (texte, idées, GDD, fiches)', 'Agent (text, ideas, GDD, sheets)')}</span><select class="input" data-role="textProvider">${provOpts('text')}</select></label>
              <label class="field"><span class="lbl">${T('Vision (critique de captures, moodboard)', 'Vision (screenshot critique, moodboard)')}</span><select class="input" data-role="visionProvider">${provOpts('vision')}</select></label>
              <label class="field"><span class="lbl">${T('Génération d\'images', 'Image generation')}</span><select class="input" data-role="imageProvider">${provOpts('image')}</select></label>
            </div>
            <div class="tip">${UI.icon('info')} <span>${T('Recommandé : <b>Claude</b> pour l\'agent et la vision (écriture et critique de haut niveau), <b>Gemini</b> ou <b>OpenAI</b> pour les images. Sans aucune clé, tout fonctionne en mode gratuit (Pollinations), avec une qualité moindre.',
              'Recommended: <b>Claude</b> for the agent and vision (top-tier writing and critique), <b>Gemini</b> or <b>OpenAI</b> for images. With no key at all, everything works in free mode (Pollinations), at lower quality.')}</span></div>
          </div>

          <div class="card">
            <h3>${UI.icon('key')} ${T('Fournisseurs & clés API', 'Providers & API keys')}</h3>
            <p class="muted small">${UI.icon('shield')} ${T('Tes clés restent dans ce navigateur (stockage local) et ne sont envoyées qu\'au fournisseur concerné. Ne partage pas ce navigateur si tes clés y sont enregistrées.', 'Your keys stay in this browser (local storage) and are only sent to the matching provider. Do not share this browser profile if your keys are saved in it.')}</p>
            <div class="providers">${Object.entries(PR).map(([id, d]) => provCard(id, d)).join('')}</div>
          </div>

          <div class="card">
            <h3>${UI.icon('sliders')} ${T('Comportement de l\'agent', 'Agent behavior')}</h3>
            <div class="fields">
              <div class="field"><span class="lbl">${T('Franchise', 'Frankness')}</span>
                <div class="seg" data-ag="frankness">${[['gentle', T('Bienveillant', 'Kind')], ['frank', T('Franc', 'Frank')], ['brutal', T('Brutal', 'Brutal')]].map(([v, l]) => `<button data-v="${v}" class="${ag.frankness === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
              <div class="field"><span class="lbl">${T('Longueur des réponses', 'Answer length')}</span>
                <div class="seg" data-ag="length">${[['short', T('Courtes', 'Short')], ['normal', T('Normales', 'Normal')], ['long', T('Détaillées', 'Detailed')]].map(([v, l]) => `<button data-v="${v}" class="${ag.length === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
              <label class="field"><span class="lbl">${T('Effort de réflexion (Claude)', 'Thinking effort (Claude)')}</span>
                <select class="input" data-agsel="effort">${[['low', T('Faible (rapide)', 'Low (fast)')], ['medium', T('Moyen', 'Medium')], ['high', T('Élevé', 'High')], ['xhigh', T('Très élevé', 'Extra high')], ['max', T('Maximum (lent)', 'Max (slow)')], ['auto', T('Défaut du modèle', 'Model default')]]
                  .map(([v, l]) => `<option value="${v}" ${ag.effort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            </div>
            <div class="stack">
              <label class="check"><input type="checkbox" data-agchk="autoReact" ${ag.autoReact ? 'checked' : ''}> ${T('L\'agent réagit automatiquement à chaque nouvelle idée (par défaut dans « Nouvelle idée »)', 'The agent automatically reacts to each new idea (default in "New idea")')}</label>
              <label class="check"><input type="checkbox" data-agchk="includeContext" ${ag.includeContext ? 'checked' : ''}> ${T('Donner à l\'agent le contexte complet du projet (recommandé)', 'Give the agent the full project context (recommended)')}</label>
              <label class="check"><input type="checkbox" data-agchk="optimizePrompts" ${ag.optimizePrompts ? 'checked' : ''}> ${T('Optimiser les prompts d\'images avec l\'IA', 'Optimize image prompts with AI')}</label>
              <label class="check"><input type="checkbox" data-agchk="fallback" ${ag.fallback ? 'checked' : ''}> ${T('Claude : basculer automatiquement sur un autre modèle Claude si une demande est refusée par les filtres', 'Claude: automatically fall back to another Claude model if a request is declined by safety filters')}</label>
            </div>
          </div>

          <div class="card">
            <h3>${UI.icon('save')} ${T('Données & sauvegardes', 'Data & backups')}</h3>
            <p class="muted small">${T('Tout est stocké localement dans ce navigateur.', 'Everything is stored locally in this browser.')} ${usage} · ${T('Dernière sauvegarde', 'Last backup')} : ${st.lastBackup ? U.fmtDate(st.lastBackup) : T('jamais', 'never')}</p>
            <div class="row gap wrap">
              <button class="btn primary" id="dExp">${UI.icon('download')} ${T('Exporter ce projet (.json)', 'Export this project (.json)')}</button>
              <button class="btn" id="dExpAll">${UI.icon('download')} ${T('Sauvegarde complète (tous les projets)', 'Full backup (all projects)')}</button>
              <button class="btn" id="dImp">${UI.icon('upload')} ${T('Importer une sauvegarde', 'Import a backup')}</button>
              <button class="btn" id="dMd">${UI.icon('file')} ${T('Exporter le GDD (.md)', 'Export GDD (.md)')}</button>
            </div>
            <div class="sep"></div>
            <div class="lbl">${T('Projets', 'Projects')}</div>
            <div class="proj-list">${S.list.map((p) => `
              <div class="proj-item ${p.id === S.project.id ? 'active' : ''}">
                <span class="grow"><strong>${U.esc(p.name)}</strong> <small class="muted">${U.relTime(p.updatedAt)}</small></span>
                ${p.id === S.project.id ? `<span class="tag">${T('ouvert', 'open')}</span>` : `<button class="btn sm ghost" data-open="${p.id}">${T('Ouvrir', 'Open')}</button>`}
                <button class="btn sm ghost" data-ren="${p.id}">${UI.icon('edit')}</button>
                <button class="btn sm ghost" data-del="${p.id}">${UI.icon('trash')}</button>
              </div>`).join('')}</div>
            <button class="btn ghost" id="dNew">${UI.icon('plus')} ${T('Nouveau projet', 'New project')}</button>
          </div>

          <div class="card">
            <h3>${UI.icon('info')} ${T('Aide rapide', 'Quick help')}</h3>
            <div class="md">${GF.md.render(GF.lang === 'en' ? HELP_EN : HELP_FR)}</div>
          </div>
        </div>`;

      const save = U.debounce(() => S.saveSettings(), 300);

      el.querySelectorAll('#sLang [data-v]').forEach((b) => { b.onclick = async () => { st.lang = GF.lang = b.dataset.v; await S.saveSettings(); GF.app.renderShell(); GF.app.route(); }; });
      el.querySelectorAll('#sTheme [data-v]').forEach((b) => { b.onclick = async () => { st.theme = b.dataset.v; await S.saveSettings(); GF.app.renderShell(); GF.app.route(); }; });
      el.querySelectorAll('[data-role]').forEach((s) => { s.onchange = () => { st[s.dataset.role] = s.value; save(); }; });
      el.querySelectorAll('[data-ag]').forEach((seg) => {
        seg.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { ag[seg.dataset.ag] = b.dataset.v; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); save(); }; });
      });
      el.querySelectorAll('[data-agsel]').forEach((s) => { s.onchange = () => { ag[s.dataset.agsel] = s.value; save(); }; });
      el.querySelectorAll('[data-agchk]').forEach((c) => { c.onchange = () => { ag[c.dataset.agchk] = c.checked; save(); }; });

      // cartes fournisseurs
      el.querySelectorAll('[data-pf]').forEach((inp) => {
        inp.addEventListener('input', () => {
          const [id, k] = inp.dataset.pf.split('.');
          st.providers[id] = st.providers[id] || {};
          st.providers[id][k] = inp.value.trim();
          save();
          const badge = el.querySelector(`[data-badge="${id}"]`);
          if (badge) { const r = GF.ai.isReady(id); badge.className = `badge ${r ? 'ok' : 'off'}`; badge.textContent = r ? T('prêt', 'ready') : T('non configuré', 'not set'); }
        });
      });
      el.querySelectorAll('[data-show]').forEach((b) => {
        b.onclick = () => { const i = el.querySelector(`[data-pf="${b.dataset.show}.key"]`); i.type = i.type === 'password' ? 'text' : 'password'; };
      });
      el.querySelectorAll('[data-test]').forEach((b) => {
        b.onclick = async () => {
          await S.saveSettings();
          const id = b.dataset.test;
          const out = el.querySelector(`[data-res="${id}"]`);
          b.disabled = true;
          out.innerHTML = UI.spinner(T('Test en cours…', 'Testing…'));
          try {
            const r = await GF.ai.test(id);
            out.innerHTML = `<span class="ok-text">${UI.icon('check')} ${U.esc(U.truncate(r.trim() || 'OK', 120))}</span>`;
          } catch (e) {
            out.innerHTML = `<span class="err">${U.esc(e.message)}</span>`;
          } finally { b.disabled = false; }
        };
      });
      el.querySelectorAll('[data-list]').forEach((b) => {
        b.onclick = async () => {
          await S.saveSettings();
          const id = b.dataset.list;
          const out = el.querySelector(`[data-res="${id}"]`);
          b.disabled = true;
          out.innerHTML = UI.spinner(T('Récupération des modèles…', 'Fetching models…'));
          try {
            const models = await GF.ai.listModels(id);
            const dl = el.querySelector(`#dl-${id}`);
            if (dl) dl.innerHTML = models.map((m) => `<option value="${U.esc(m)}">`).join('');
            const dli = el.querySelector(`#dli-${id}`);
            if (dli) dli.innerHTML = models.filter((m) => /image|imagen|dall|flux|banana/i.test(m)).map((m) => `<option value="${U.esc(m)}">`).join('');
            out.innerHTML = `<span class="ok-text">${UI.icon('check')} ${models.length} ${T('modèles disponibles — clique dans le champ « Modèle » pour choisir.', 'models available — click the "Model" field to choose.')}</span>`;
          } catch (e) {
            out.innerHTML = `<span class="err">${U.esc(e.message)}</span>`;
          } finally { b.disabled = false; }
        };
      });

      // données
      el.querySelector('#dExp').onclick = async () => { await S.exportProject(); UI.toast(T('Projet exporté', 'Project exported'), 'success'); GF.app.route(); };
      el.querySelector('#dExpAll').onclick = async () => { await S.exportAll(); UI.toast(T('Sauvegarde complète exportée', 'Full backup exported'), 'success'); GF.app.route(); };
      el.querySelector('#dMd').onclick = () => GF.exporter.markdown();
      el.querySelector('#dImp').onclick = async () => {
        const files = await U.pickFiles({ accept: '.json,application/json', multiple: false });
        if (!files.length) return;
        try {
          const n = await S.importFile(files[0]);
          UI.toast(T(`${n} projet(s) importé(s)`, `${n} project(s) imported`), 'success');
          GF.app.renderShell(); GF.app.go('dashboard');
        } catch (e) { UI.toast(e.message, 'error', 7000); }
      };
      el.querySelector('#dNew').onclick = () => GF.app.newProject();
      el.querySelectorAll('[data-open]').forEach((b) => { b.onclick = async () => { await S.open(b.dataset.open); GF.app.renderShell(); GF.app.go('dashboard'); }; });
      el.querySelectorAll('[data-ren]').forEach((b) => {
        b.onclick = async () => {
          const it = S.list.find((x) => x.id === b.dataset.ren);
          const name = await UI.ask(T('Renommer le projet', 'Rename project'), { value: it.name });
          if (!name) return;
          if (it.id === S.project.id) { S.project.name = name; await S.saveNow(); }
          else { const pr = await GF.db.get('projects', it.id); pr.name = name; await GF.db.put('projects', pr); }
          await S.refreshList(); GF.app.renderShell(); GF.app.route();
        };
      });
      el.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          const it = S.list.find((x) => x.id === b.dataset.del);
          if (!(await UI.confirm(T(`Supprimer définitivement le projet « ${it.name} » et toutes ses images ? Pense à l'exporter avant.`, `Permanently delete project "${it.name}" and all its images? Export it first.`), { danger: true, ok: T('Supprimer', 'Delete') }))) return;
          await S.remove(it.id);
          GF.app.renderShell(); GF.app.route();
          UI.toast(T('Projet supprimé', 'Project deleted'), 'success');
        };
      });
    },
  };

  function provCard(id, d) {
    const c = GF.ai.cfg(id);
    const s = GF.store.settings.providers[id] || {};
    const r = GF.ai.isReady(id);
    const showBase = id === 'custom' || d.local;
    const keyField = (d.needsKey || d.keyOptional)
      ? `<label class="field"><span class="lbl">${T('Clé API', 'API key')}${d.keyOptional ? ` (${T('si requise', 'if required')})` : ''}</span>
          <div class="row"><input class="input grow" type="password" autocomplete="off" spellcheck="false" data-pf="${id}.key" value="${U.esc(s.key || '')}" placeholder="${id === 'anthropic' ? 'sk-ant-…' : id === 'openai' ? 'sk-…' : id === 'gemini' ? 'AIza…' : id === 'openrouter' ? 'sk-or-…' : ''}">
          <button class="btn icon ghost" data-show="${id}" title="${T('Afficher', 'Show')}">${UI.icon('eye')}</button></div></label>`
      : '';
    const baseField = `<label class="field"><span class="lbl">${T('URL de base', 'Base URL')}</span><input class="input" data-pf="${id}.base" value="${U.esc(s.base || '')}" placeholder="${U.esc(d.base || 'https://api.exemple.com/v1')}"></label>`;
    return `
      <details class="prov ${r ? 'ready' : ''}" ${r && !d.free ? 'open' : ''}>
        <summary>
          <strong>${U.esc(d.label)}</strong>
          <span class="badge ${r ? 'ok' : 'off'}" data-badge="${id}">${r ? T('prêt', 'ready') : T('non configuré', 'not set')}</span>
          <span class="caps">${d.text ? `<span class="tag">${T('texte', 'text')}</span>` : ''}${d.vision ? `<span class="tag">vision</span>` : ''}${d.image ? `<span class="tag">images</span>` : ''}${d.free ? `<span class="tag free">${T('gratuit', 'free')}</span>` : ''}</span>
        </summary>
        <p class="muted small">${U.esc(L(d.desc))} ${d.keyUrl ? `<a class="link" href="${d.keyUrl}" target="_blank" rel="noopener">${d.needsKey ? T('Obtenir une clé →', 'Get a key →') : T('Site →', 'Website →')}</a>` : ''}</p>
        <div class="fields">
          ${keyField}
          ${showBase ? baseField : ''}
          ${d.text ? `<label class="field"><span class="lbl">${T('Modèle (texte / vision)', 'Model (text / vision)')}</span>
            <input class="input" list="dl-${id}" data-pf="${id}.model" value="${U.esc(s.model || '')}" placeholder="${U.esc(d.model || T('nom du modèle', 'model name'))}">
            <datalist id="dl-${id}">${(d.models || []).map((m) => `<option value="${U.esc(m)}">`).join('')}</datalist></label>` : ''}
          ${d.image ? `<label class="field"><span class="lbl">${T('Modèle d\'images', 'Image model')}</span>
            <input class="input" list="dli-${id}" data-pf="${id}.imageModel" value="${U.esc(s.imageModel || '')}" placeholder="${U.esc(d.imageModel || T('par défaut', 'default'))}">
            <datalist id="dli-${id}">${(d.imageModels || []).filter(Boolean).map((m) => `<option value="${U.esc(m)}">`).join('')}</datalist></label>` : ''}
        </div>
        ${!showBase ? `<details class="adv"><summary class="small muted">${T('Avancé : URL de base (proxy, région…)', 'Advanced: base URL (proxy, region…)')}</summary>${baseField}</details>` : ''}
        <div class="row gap wrap">
          ${d.text ? `<button class="btn sm" data-test="${id}">${UI.icon('check')} ${T('Tester', 'Test')}</button>` : ''}
          <button class="btn sm ghost" data-list="${id}">${UI.icon('refresh')} ${T('Lister les modèles', 'List models')}</button>
          <span data-res="${id}" class="small grow"></span>
        </div>
        ${id === 'ollama' ? `<p class="muted small">${T('Astuce : pour autoriser l\'app à parler à Ollama, lance-le avec la variable OLLAMA_ORIGINS=* (Windows : setx OLLAMA_ORIGINS "*" puis redémarre Ollama). Pour la vision, utilise un modèle comme gemma3 ou llava.', 'Tip: to let the app talk to Ollama, start it with OLLAMA_ORIGINS=* (Windows: setx OLLAMA_ORIGINS "*" then restart Ollama). For vision, use a model like gemma3 or llava.')}</p>` : ''}
        ${id === 'lmstudio' ? `<p class="muted small">${T('Dans LM Studio : onglet Developer → Start Server, et active « Enable CORS ».', 'In LM Studio: Developer tab → Start Server, and enable "Enable CORS".')}</p>` : ''}
      </details>`;
  }

  const HELP_FR = `
- **Alt+N** : capturer une idée depuis n'importe quel écran. L'agent peut réagir automatiquement.
- **Ctrl+V** : colle une capture d'écran directement dans la critique, une fiche, le moodboard ou le chat.
- **Fiches** : chaque personnage / véhicule / lieu a son champ « Arrive au chapitre » → visible dans *Histoire → Chronologie*.
- **Compléter la fiche** : l'agent remplit les champs vides, tu choisis ce que tu gardes.
- **Style du projet** : écris un *prompt de style global* dans Direction artistique pour que toutes les images restent cohérentes.
- **Sauvegarde** : exporte régulièrement ton projet (.json). Tu peux le réimporter sur un autre ordinateur.
- **Export** : le GDD complet (avec fiches et images) s'exporte en Markdown, HTML ou PDF (bouton Imprimer).`;
  const HELP_EN = `
- **Alt+N**: capture an idea from any screen. The agent can react automatically.
- **Ctrl+V**: paste a screenshot straight into the critique, a sheet, the moodboard or the chat.
- **Sheets**: every character / vehicle / location has a "First appears in chapter" field → visible in *Story → Timeline*.
- **Complete the sheet**: the agent fills empty fields, you pick what to keep.
- **Project style**: write a *global style prompt* in Art direction so all images stay consistent.
- **Backup**: export your project (.json) regularly. You can re-import it on another computer.
- **Export**: the full GDD (with sheets and images) exports to Markdown, HTML or PDF (Print button).`;
})();
