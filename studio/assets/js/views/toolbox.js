/* Vue : boîte à outils — générateur d'idées, noms, cartes de réflexion, checklists, courbe d'XP, dés */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui;
  let tab = 'ideas';
  let lastIdea = null;
  let nameStyle = 'fantasy';
  let qCat = '';
  let curQ = null;

  const TABS = [
    ['ideas', 'dice', ['Générateur d\'idées', 'Idea generator']], ['names', 'users', ['Noms', 'Names']], ['cards', 'sparkles', ['Cartes de réflexion', 'Reflection cards']],
    ['check', 'check', ['Checklists', 'Checklists']], ['xp', 'sliders', ['Courbe d\'XP', 'XP curve']], ['dice', 'dice', ['Dés', 'Dice']],
  ];

  DP.views.toolbox = {
    title: () => T('Boîte à outils', 'Toolbox'),
    render(el) {
      el.innerHTML = `<div class="tabs big">${TABS.map(([k, ic, lab]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${UI.icon(ic)} ${U.esc(L(lab))}</button>`).join('')}</div><div id="tb"></div>`;
      el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; DP.views.toolbox.render(el); }; });
      const body = el.querySelector('#tb');
      ({ ideas, names, cards, check, xp, dice })[tab](body);
      UI.autoGrow(el);
    },
  };

  /* ---------- Générateur d'idées ---------- */
  function ideas(el) {
    const G = DP.toolboxData.GEN;
    const roll = () => ({ genre: U.pick(G.genres), mech: U.pick(G.mechanics), setting: U.pick(G.settings), twist: U.pick(G.twists), constraint: U.pick(G.constraints), emotion: U.pick(G.emotions) });
    if (!lastIdea) lastIdea = roll();
    const x = lastIdea;
    const text = () => T(
      `Genre : <b>${U.esc(L(x.genre))}</b>. Mécanique centrale : <b>${U.esc(L(x.mech))}</b>. Univers : <b>${U.esc(L(x.setting))}</b>. Rebondissement : <b>${U.esc(L(x.twist))}</b>. Contrainte : <b>${U.esc(L(x.constraint))}</b>. Émotion visée : <b>${U.esc(L(x.emotion))}</b>.`,
      `Genre: <b>${U.esc(L(x.genre))}</b>. Core mechanic: <b>${U.esc(L(x.mech))}</b>. Setting: <b>${U.esc(L(x.setting))}</b>. Twist: <b>${U.esc(L(x.twist))}</b>. Constraint: <b>${U.esc(L(x.constraint))}</b>. Target emotion: <b>${U.esc(L(x.emotion))}</b>.`);
    el.innerHTML = `
      <div class="card">
        <p class="muted">${T('Combine des ingrédients au hasard pour débloquer ta créativité, trouver une mécanique ou préparer une game jam. Verrouille ce qui te plaît et relance le reste.', 'Randomly combine ingredients to unlock creativity, find a mechanic or prepare a game jam. Lock what you like and reroll the rest.')}</p>
        <div class="gen-result" id="genText">${text()}</div>
        <div class="chips" id="locks">${[['genre', ['Genre', 'Genre']], ['mech', ['Mécanique', 'Mechanic']], ['setting', ['Univers', 'Setting']], ['twist', ['Rebondissement', 'Twist']], ['constraint', ['Contrainte', 'Constraint']], ['emotion', ['Émotion', 'Emotion']]]
          .map(([k, l]) => `<button class="chip" data-lock="${k}">🔓 ${U.esc(L(l))}</button>`).join('')}</div>
        <div class="row gap wrap">
          <button class="btn primary" id="reroll">${UI.icon('dice')} ${T('Relancer', 'Reroll')}</button>
          <button class="btn" id="keep">${UI.icon('bulb')} ${T('Garder comme idée', 'Keep as idea')}</button>
        </div>
      </div>`;
    const locked = new Set();
    el.querySelectorAll('[data-lock]').forEach((b) => { b.onclick = () => { const k = b.dataset.lock; if (locked.has(k)) locked.delete(k); else locked.add(k); b.classList.toggle('on'); b.textContent = `${locked.has(k) ? '🔒' : '🔓'} ${b.textContent.slice(2).trim()}`; }; });
    el.querySelector('#reroll').onclick = () => {
      const n = roll();
      for (const k of Object.keys(n)) if (!locked.has(k)) lastIdea[k] = n[k];
      el.querySelector('#genText').innerHTML = text();
    };
    el.querySelector('#keep').onclick = () => {
      const tmp = document.createElement('div'); tmp.innerHTML = text();
      const idea = DP.app.createIdea({ title: `${L(x.genre)} × ${U.truncate(L(x.mech), 40)}`, content: tmp.textContent, category: 'gameplay', tags: ['générateur'] });
      UI.toast(T('Ajoutée aux idées', 'Added to ideas'), 'success');
      DP.app.go(`ideas/${idea.id}`);
    };
  }

  /* ---------- Noms ---------- */
  function makeName(style) {
    const N = DP.toolboxData.NAMES;
    if (style === 'faction') {
      const lists = N.faction[DP.lang === 'en' ? 'en' : 'fr'];
      return `${U.pick(lists[0])} ${U.pick(lists[1])}`;
    }
    const d = N[style];
    const n = `${U.pick(d.a)}${U.pick(d.b)}${U.pick(d.c)}`;
    return style === 'place' ? n.replace(/--/g, '-').replace(/^(.)/, (c) => c.toUpperCase()) : n;
  }
  function names(el) {
    const styles = [['fantasy', ['Fantasy', 'Fantasy']], ['scifi', ['Science-fiction', 'Sci-fi']], ['human', ['Personnages modernes', 'Modern characters']], ['vehicle', ['Véhicules', 'Vehicles']], ['place', ['Lieux', 'Places']], ['faction', ['Factions / gangs', 'Factions / gangs']]];
    el.innerHTML = `
      <div class="card">
        <div class="row gap wrap"><div class="seg" id="ns">${styles.map(([k, l]) => `<button data-s="${k}" class="${nameStyle === k ? 'on' : ''}">${U.esc(L(l))}</button>`).join('')}</div>
          <button class="btn primary" id="gen">${UI.icon('dice')} ${T('Générer', 'Generate')}</button></div>
        <p class="muted small">${T('Clique sur un nom pour le copier, ou crée directement une fiche.', 'Click a name to copy it, or create a sheet right away.')}</p>
        <div class="names" id="nl"></div>
      </div>`;
    const target = { fantasy: 'characters', scifi: 'characters', human: 'characters', vehicle: 'vehicles', place: 'locations', faction: 'factions' };
    const draw = () => {
      const set = new Set(); let guard = 0;
      while (set.size < 18 && guard++ < 200) set.add(makeName(nameStyle));
      el.querySelector('#nl').innerHTML = Array.from(set).map((n) => `<div class="row gap"><button class="name-chip grow" data-n="${U.esc(n)}">${U.esc(n)}</button><button class="btn icon sm ghost" data-mk="${U.esc(n)}" title="${T('Créer une fiche', 'Create a sheet')}">${UI.icon('plus')}</button></div>`).join('');
      el.querySelectorAll('[data-n]').forEach((b) => { b.onclick = async () => { await U.copyText(b.dataset.n); UI.toast(`${T('Copié', 'Copied')} : ${b.dataset.n}`, 'success'); }; });
      el.querySelectorAll('[data-mk]').forEach((b) => { b.onclick = () => { const t = target[nameStyle]; const e = S.newEntity(t, { name: b.dataset.mk }); DP.app.refreshNav(); DP.app.go(`e/${t}/${e.id}`); }; });
    };
    el.querySelectorAll('#ns [data-s]').forEach((b) => { b.onclick = () => { nameStyle = b.dataset.s; el.querySelectorAll('#ns button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }; });
    el.querySelector('#gen').onclick = draw;
    draw();
  }

  /* ---------- Cartes de réflexion ---------- */
  function cards(el) {
    const Q = DP.toolboxData.QUESTIONS;
    const cats = [['', ['Toutes', 'All']], ['gameplay', ['Gameplay', 'Gameplay']], ['story', ['Histoire', 'Story']], ['character', ['Personnages', 'Characters']], ['vehicle', ['Véhicules', 'Vehicles']],
      ['level', ['Niveaux', 'Levels']], ['art', ['Art', 'Art']], ['audio', ['Audio', 'Audio']], ['ui', ['UI', 'UI']], ['tech', ['Technique', 'Tech']], ['business', ['Business', 'Business']], ['other', ['Général', 'General']]];
    const draw = () => { const pool = Q.filter((q) => !qCat || q.cat === qCat); curQ = U.pick(pool); el.querySelector('#bq').textContent = L(curQ.t); };
    el.innerHTML = `
      <div class="card">
        <p class="muted">${T('Pioche une question pour challenger ton design — seul ou en équipe. Réponds-y dans une idée.', 'Draw a question to challenge your design — alone or as a team. Answer it in an idea.')}</p>
        <div class="seg" id="qc">${cats.map(([k, l]) => `<button data-c="${k}" class="${qCat === k ? 'on' : ''}">${U.esc(L(l))}</button>`).join('')}</div>
        <div class="big-q" id="bq"></div>
        <div class="row gap"><button class="btn primary" id="draw">${UI.icon('refresh')} ${T('Autre carte', 'Another card')}</button><button class="btn" id="answer">${UI.icon('bulb')} ${T('Répondre dans une idée', 'Answer in an idea')}</button></div>
      </div>
      <div class="card"><h3>${T('Toutes les cartes', 'All cards')} <span class="muted small">${Q.length}</span></h3><div class="stack">${Q.filter((q) => !qCat || q.cat === qCat).map((q) => `<div class="qcard"><p>${U.esc(L(q.t))}</p></div>`).join('')}</div></div>`;
    el.querySelectorAll('#qc [data-c]').forEach((b) => { b.onclick = () => { qCat = b.dataset.c; cards(el); }; });
    el.querySelector('#draw').onclick = draw;
    el.querySelector('#answer').onclick = () => DP.app.quickIdea(`${L(curQ.t)}\n\n`);
    draw();
  }

  /* ---------- Checklists ---------- */
  function check(el) {
    const p = S.project;
    const lists = DP.toolboxData.CHECKLISTS;
    el.innerHTML = `<div class="grid2">${lists.map((c) => {
      const state = p.checklists[c.key] || {};
      const done = c.items.filter((_, i) => state[i]).length;
      return `<div class="card"><div class="card-head"><h3>${U.esc(L(c.title))}</h3><span class="tag ${done === c.items.length ? 'pub' : ''}">${done}/${c.items.length}</span></div>
        <i class="bar ${done === c.items.length ? 'good' : ''}"><b style="width:${(done / c.items.length) * 100}%"></b></i>
        <div class="checklist">${c.items.map((it, i) => `<label class="${state[i] ? 'done' : ''}"><input type="checkbox" data-cl="${c.key}" data-i="${i}" ${state[i] ? 'checked' : ''}><span>${U.esc(L(it))}</span></label>`).join('')}</div></div>`;
    }).join('')}</div>`;
    el.querySelectorAll('[data-cl]').forEach((cb) => {
      cb.onchange = () => {
        const k = cb.dataset.cl;
        p.checklists[k] = p.checklists[k] || {};
        p.checklists[k][cb.dataset.i] = cb.checked;
        S.touch(); check(el);
      };
    });
  }

  /* ---------- Courbe d'XP ---------- */
  function xp(el) {
    const cfg = S.project.xpCurve || (S.project.xpCurve = { base: 100, growth: 1.5, levels: 20, mode: 'power' });
    el.innerHTML = `
      <div class="grid2">
        <div class="card">
          <h3>${UI.icon('sliders')} ${T('Paramètres', 'Settings')}</h3>
          <div class="fields">
            <label class="field"><span class="lbl">${T('XP du niveau 2', 'XP for level 2')}</span><input class="input" type="number" data-x="base" value="${cfg.base}"></label>
            <label class="field"><span class="lbl">${T('Croissance', 'Growth')}</span><input class="input" type="number" step="0.05" data-x="growth" value="${cfg.growth}"></label>
            <label class="field"><span class="lbl">${T('Niveau max', 'Max level')}</span><input class="input" type="number" data-x="levels" value="${cfg.levels}"></label>
            <label class="field"><span class="lbl">${T('Formule', 'Formula')}</span><select class="input" data-x="mode">${UI.options([['power', ['Puissance : base × niveau^croissance', 'Power: base × level^growth']], ['exp', ['Exponentielle : base × croissance^(niveau-1)', 'Exponential: base × growth^(level-1)']], ['linear', ['Linéaire : base × niveau', 'Linear: base × level']]], cfg.mode)}</select></label>
          </div>
          <div class="row gap"><button class="btn" id="xpCopy">${UI.icon('copy')} ${T('Copier le tableau', 'Copy table')}</button><button class="btn" id="xpGdd">${UI.icon('book')} ${T('Ajouter au GDD (Progression)', 'Add to GDD (Progression)')}</button></div>
        </div>
        <div class="card"><h3>${T('Aperçu', 'Preview')}</h3><svg id="xpChart" viewBox="0 0 400 200" style="width:100%;height:200px"></svg></div>
      </div>
      <div class="card"><div class="md" id="xpTable"></div></div>`;
    const compute = () => {
      const rows = [];
      let cum = 0;
      for (let lv = 2; lv <= Math.max(2, Math.min(200, +cfg.levels || 20)); lv++) {
        const n = lv - 1;
        const need = Math.round(cfg.mode === 'exp' ? cfg.base * Math.pow(cfg.growth, n - 1) : cfg.mode === 'linear' ? cfg.base * n : cfg.base * Math.pow(n, cfg.growth));
        cum += need;
        rows.push([lv, need, cum]);
      }
      return rows;
    };
    const md = (rows) => `| ${T('Niveau', 'Level')} | ${T('XP requise', 'XP needed')} | ${T('XP cumulée', 'Total XP')} |\n|---|---|---|\n${rows.map((r) => `| ${r[0]} | ${r[1].toLocaleString()} | ${r[2].toLocaleString()} |`).join('\n')}`;
    const draw = () => {
      const rows = compute();
      el.querySelector('#xpTable').innerHTML = DP.md.render(md(rows));
      const max = rows[rows.length - 1][2] || 1;
      const pts = rows.map((r, i) => `${(i / Math.max(1, rows.length - 1)) * 390 + 5},${195 - (r[2] / max) * 185}`).join(' ');
      el.querySelector('#xpChart').innerHTML = `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/><line x1="5" y1="195" x2="395" y2="195" stroke="var(--border2)"/>`;
    };
    el.querySelectorAll('[data-x]').forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => { cfg[i.dataset.x] = i.tagName === 'SELECT' ? i.value : +i.value; S.touch(); draw(); }));
    el.querySelector('#xpCopy').onclick = async () => { await U.copyText(md(compute())); UI.toast(T('Tableau copié (Markdown)', 'Table copied (Markdown)'), 'success'); };
    el.querySelector('#xpGdd').onclick = () => {
      const s = S.project.gdd.sections.find((x) => x.key === 'progression');
      if (s) { s.content = `${s.content.trim()}\n\n### ${T('Courbe d\'expérience', 'Experience curve')}\n\n${md(compute())}`.trim(); S.touch(); UI.toast(T('Ajouté à la section Progression', 'Added to the Progression section'), 'success'); }
    };
    draw();
  }

  /* ---------- Dés ---------- */
  function dice(el) {
    el.innerHTML = `
      <div class="card">
        <p class="muted">${T('Pratique pour prototyper des règles, équilibrer des tirages ou tester sur papier.', 'Handy to prototype rules, balance random rolls or paper-test.')}</p>
        <div class="row gap wrap">${[4, 6, 8, 10, 12, 20, 100].map((d) => `<button class="btn" data-d="${d}">d${d}</button>`).join('')}
          <input class="input" id="expr" style="max-width:160px" value="2d6+1" placeholder="2d6+1"><button class="btn primary" id="rollExpr">${UI.icon('dice')} ${T('Lancer', 'Roll')}</button></div>
        <div class="row gap"><span class="dice-out" id="dOut">–</span><span class="muted" id="dDetail"></span></div>
        <div class="muted small" id="dHist"></div>
      </div>`;
    const hist = [];
    const roll = (expr) => {
      const m = String(expr).replace(/\s+/g, '').toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
      if (!m) { UI.toast(T('Format : 2d6+1', 'Format: 2d6+1'), 'error'); return; }
      const n = Math.min(100, +m[1] || 1), f = +m[2], mod = +(m[3] || 0);
      const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * f));
      const total = rolls.reduce((a, b) => a + b, 0) + mod;
      el.querySelector('#dOut').textContent = total;
      el.querySelector('#dDetail').textContent = `${expr} → [${rolls.join(', ')}]${mod ? ` ${mod > 0 ? '+' : ''}${mod}` : ''}`;
      hist.unshift(`${expr} = ${total}`);
      el.querySelector('#dHist').textContent = hist.slice(0, 12).join(' · ');
    };
    el.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => roll(`1d${b.dataset.d}`); });
    el.querySelector('#rollExpr').onclick = () => roll(el.querySelector('#expr').value);
  }
})();
