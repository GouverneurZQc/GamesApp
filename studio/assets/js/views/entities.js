/* Vue : fiches (personnages, véhicules, lieux, objets, factions, missions, dialogues, lore, musique, assets, bugs, playtests, équipe) */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;

  /* ---------------- Widgets réutilisables ---------------- */
  const W = (DP.widgets = {
    refs(el, refType, arr, onChange, excludeId) {
      const draw = () => {
        const list = S.entities(refType);
        const chosen = arr().filter((id) => S.entity(refType, id));
        el.innerHTML = `${chosen.map((id) => `<span class="chip-ref"><a href="#/e/${refType}/${id}">${U.esc(S.entityName(refType, id))}</a><button data-rm="${id}" title="${T('Retirer', 'Remove')}">×</button></span>`).join('')}
          <select class="input sm refs-add"><option value="">+ ${T('Ajouter…', 'Add…')}</option>
            ${list.filter((e) => !chosen.includes(e.id) && e.id !== excludeId).map((e) => `<option value="${e.id}">${U.esc(e.fields.name || T('(sans nom)', '(unnamed)'))}</option>`).join('')}
            <option value="__new">+ ${T('Créer une nouvelle fiche…', 'Create a new sheet…')}</option>
          </select>`;
        el.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { onChange(arr().filter((x) => x !== b.dataset.rm)); draw(); }; });
        el.querySelector('.refs-add').onchange = async (e) => {
          let v = e.target.value;
          if (v === '__new') {
            const name = await UI.ask(`${T('Nouvelle fiche', 'New sheet')} : ${L(SC.ENTITIES[refType].singular)}`, { placeholder: T('Nom', 'Name') });
            if (!name) { draw(); return; }
            v = S.newEntity(refType, { name }).id;
            DP.app.refreshNav();
          }
          if (v) onChange([...arr(), v]);
          draw();
        };
      };
      draw();
    },

    kv(el, arr, onChange, ph = {}) {
      const draw = () => {
        const rows = arr();
        el.innerHTML = `${rows.map((r, i) => `<div class="kv-row">
            <input class="input sm" data-i="${i}" data-k="k" value="${U.esc(r.k)}" placeholder="${U.esc(L(ph.k || ['Nom', 'Name']))}">
            <input class="input sm" data-i="${i}" data-k="v" value="${U.esc(r.v)}" placeholder="${U.esc(L(ph.v || ['Valeur', 'Value']))}">
            <button class="btn icon sm ghost" data-del="${i}">${UI.icon('x')}</button></div>`).join('')}
          <button class="btn sm ghost" data-add>${UI.icon('plus')} ${T('Ajouter une ligne', 'Add a row')}</button>`;
        el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => { const r = arr(); r[+inp.dataset.i][inp.dataset.k] = inp.value; onChange(r); }));
        el.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { const r = arr(); r.splice(+b.dataset.del, 1); onChange(r); draw(); }; });
        el.querySelector('[data-add]').onclick = () => { onChange([...arr(), { k: '', v: '' }]); draw(); const ins = el.querySelectorAll('input'); if (ins.length) ins[ins.length - 2].focus(); };
      };
      draw();
    },

    relations(el, arr, onChange, selfId) {
      const draw = () => {
        const rows = arr();
        const chars = S.entities('characters').filter((c) => c.id !== selfId);
        el.innerHTML = `${rows.map((r, i) => `<div class="kv-row">
            <select class="input sm" data-i="${i}" data-k="id"><option value="">${T('— personnage —', '— character —')}</option>
              ${chars.map((c) => `<option value="${c.id}" ${c.id === r.id ? 'selected' : ''}>${U.esc(c.fields.name || '?')}</option>`).join('')}</select>
            <input class="input sm" data-i="${i}" data-k="type" value="${U.esc(r.type || '')}" placeholder="${T('ex. sœur, rival, mentor, amour…', 'e.g. sister, rival, mentor, love…')}">
            <button class="btn icon sm ghost" data-del="${i}">${UI.icon('x')}</button></div>`).join('')}
          <button class="btn sm ghost" data-add>${UI.icon('plus')} ${T('Ajouter une relation', 'Add a relationship')}</button>
          ${chars.length ? '' : `<p class="muted small">${T('Crée d\'autres personnages pour les relier.', 'Create other characters to link them.')}</p>`}`;
        el.querySelectorAll('[data-k]').forEach((inp) => {
          inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', () => { const r = arr(); r[+inp.dataset.i][inp.dataset.k] = inp.value; onChange(r); });
        });
        el.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { const r = arr(); r.splice(+b.dataset.del, 1); onChange(r); draw(); }; });
        el.querySelector('[data-add]').onclick = () => { onChange([...arr(), { id: '', type: '' }]); draw(); };
      };
      draw();
    },

    audio(el, get, set, title) {
      const draw = () => {
        const id = get();
        el.innerHTML = id
          ? `<audio controls data-audio="${id}" preload="metadata"></audio>
             <div class="row gap wrap"><button class="btn sm" data-a="replace">${UI.icon('upload')} ${T('Remplacer', 'Replace')}</button>
             <button class="btn sm ghost" data-a="dl">${UI.icon('download')} ${T('Télécharger', 'Download')}</button>
             <button class="btn sm ghost" data-a="rm">${UI.icon('x')} ${T('Retirer', 'Remove')}</button></div>`
          : `<div class="row gap wrap">${UI.icon('music')}<span class="muted grow">${T('Glisse un fichier audio ici (MP3, OGG, WAV, M4A, FLAC)', 'Drop an audio file here (MP3, OGG, WAV, M4A, FLAC)')}</span>
             <button class="btn sm primary" data-a="replace">${UI.icon('upload')} ${T('Choisir un fichier', 'Choose a file')}</button></div>`;
        DP.media.hydrate(el);
        el.querySelectorAll('[data-a]').forEach((b) => {
          b.onclick = async () => {
            if (b.dataset.a === 'rm') { set(''); draw(); }
            if (b.dataset.a === 'dl') DP.media.download(get(), title());
            if (b.dataset.a === 'replace') {
              const files = await U.pickFiles({ accept: 'audio/*,.mp3,.ogg,.wav,.m4a,.flac', multiple: false });
              if (files[0]) await add(files[0]);
            }
          };
        });
      };
      const add = async (file) => {
        if (!DP.media.isAudio(file)) { UI.toast(T('Ce n\'est pas un fichier audio.', 'Not an audio file.'), 'error'); return; }
        const [id] = await UI.importFiles([file]);
        if (id) { set(id); draw(); UI.toast(T('Audio ajouté', 'Audio added'), 'success'); }
      };
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag'); });
      el.addEventListener('dragleave', () => el.classList.remove('drag'));
      el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('drag'); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) add(f); });
      draw();
    },
  });

  const initials = (name) => (String(name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || '?').toUpperCase();

  function fieldHTML(fd, v, entId) {
    const lab = `<span class="lbl">${U.esc(L(fd.label))}${fd.priv ? ` <span class="faint" title="${T('Jamais affiché sur le portail joueurs', 'Never shown on the player portal')}">🔒</span>` : ''}</span>`;
    const ph = fd.placeholder ? ` placeholder="${U.esc(L(fd.placeholder))}"` : '';
    const wide = fd.wide ? ' wide' : '';
    switch (fd.type) {
      case 'textarea': return `<label class="field${wide}">${lab}<textarea class="input auto" data-f="${fd.key}" rows="${fd.rows || 3}"${ph}>${U.esc(v || '')}</textarea></label>`;
      case 'script': return `<label class="field wide">${lab}<textarea class="input auto script" data-f="${fd.key}" rows="${fd.rows || 10}" placeholder="NOVA : ${T('On y va ?', 'Shall we?')}\nREX : ${T('Attache ta ceinture.', 'Buckle up.')}\n(${T('Elle démarre en trombe.', 'She peels out.')})">${U.esc(v || '')}</textarea><div class="script-preview" id="scriptPrev" ${v ? '' : 'hidden'}></div></label>`;
      case 'number': return `<label class="field">${lab}<input class="input" type="number" step="any" data-f="${fd.key}" data-kind="num" value="${U.esc(v ?? '')}"></label>`;
      case 'date': return `<label class="field">${lab}<input class="input" type="date" data-f="${fd.key}" value="${U.esc(v || '')}"></label>`;
      case 'select': return `<label class="field">${lab}<select class="input" data-f="${fd.key}">${UI.options(fd.options, v, { empty: '—' })}</select></label>`;
      case 'tags': return `<label class="field${wide}">${lab}<input class="input" data-f="${fd.key}" data-kind="tags" value="${U.esc((v || []).join(', '))}" placeholder="${T('séparés par des virgules', 'comma separated')}"></label>`;
      case 'ref': {
        const list = S.entities(fd.ref).filter((e) => e.id !== entId);
        return `<label class="field">${lab}<select class="input" data-f="${fd.key}"><option value="">—</option>
          ${list.map((e) => `<option value="${e.id}" ${e.id === v ? 'selected' : ''}>${U.esc(e.fields.name || '?')}</option>`).join('')}</select></label>`;
      }
      case 'chapter': {
        const chs = S.chapters();
        return `<label class="field">${lab}<select class="input" data-f="${fd.key}"><option value="">—</option>
          ${chs.map((c, i) => `<option value="${c.id}" ${c.id === v ? 'selected' : ''}>${i + 1}. ${U.esc(c.title || T('Sans titre', 'Untitled'))}</option>`).join('')}</select>
          ${chs.length ? '' : `<small class="muted">${T('Ajoute des chapitres dans', 'Add chapters in')} <a class="link" href="#/story">${T('Histoire', 'Story')}</a></small>`}</label>`;
      }
      case 'rating': return `<label class="field">${lab}<div class="rating"><input type="range" min="0" max="10" step="1" data-f="${fd.key}" data-kind="num" value="${U.esc(v ?? 0)}"><output>${v ?? 0}</output></div></label>`;
      case 'audio': return `<div class="field wide">${lab}<div class="audio-field" data-w="${fd.key}"></div></div>`;
      case 'refs': case 'kv': case 'relations':
        return `<div class="field${wide}">${lab}<div class="widget ${fd.type}" data-w="${fd.key}"></div></div>`;
      default: return `<label class="field">${lab}<input class="input" data-f="${fd.key}" value="${U.esc(v || '')}"${ph}></label>`;
    }
  }

  function ratingsHTML(type, x) {
    const def = SC.ENTITIES[type];
    if (!def.ratings) return '';
    return `<div class="ratings">${def.ratings.map((k) => {
      const fd = SC.field(type, k); const v = +x[k] || 0;
      return `<div class="rt"><span>${U.esc(L(fd.label))}</span><i class="bar"><b style="width:${v * 10}%"></b></i><em>${v}</em></div>`;
    }).join('')}</div>`;
  }

  function scriptPreview(text) {
    return String(text || '').split('\n').filter((l) => l.trim()).map((l) => {
      const m = l.match(/^\s*([^:()]{1,40}?)\s*:\s*(.+)$/);
      if (m) return `<div class="sl"><b>${U.esc(m[1])}</b><span>${U.esc(m[2])}</span></div>`;
      return `<div class="dir">${U.esc(l.trim())}</div>`;
    }).join('');
  }

  const SEV_CLS = { blocker: 'bad', critical: 'bad', major: 'warn', minor: '', trivial: '' };

  /* ---------------- Vue ---------------- */
  DP.views.entities = {
    title: (params) => L(SC.ENTITIES[params.type].label),
    render(el, params) {
      if (params.id && S.entity(params.type, params.id)) return renderDetail(el, params.type, params.id);
      return renderList(el, params.type);
    },
  };

  const listState = {};

  function renderList(el, type) {
    const def = SC.ENTITIES[type];
    const st = (listState[type] = listState[type] || { q: '', sort: 'recent', view: 'grid', pub: false });
    el.innerHTML = `
      <div class="page-head">
        <div class="row gap wrap">
          <div class="search">${UI.icon('search')}<input class="input" id="q" value="${U.esc(st.q)}" placeholder="${T('Rechercher…', 'Search…')}"></div>
          <select class="input" id="sort" style="width:auto">${UI.options([['recent', ['Récentes', 'Recent']], ['name', ['Nom (A-Z)', 'Name (A-Z)']], ['created', ['Date de création', 'Created']]], st.sort)}</select>
          ${def.portal ? `<label class="check"><input type="checkbox" id="pubOnly" ${st.pub ? 'checked' : ''}> ${T('Publiques seulement', 'Public only')}</label>` : ''}
          <div class="seg" id="viewSeg"><button data-v="grid" class="${st.view === 'grid' ? 'on' : ''}">${UI.icon('grid')}</button><button data-v="list" class="${st.view === 'list' ? 'on' : ''}">${UI.icon('list')}</button></div>
        </div>
        <button class="btn primary" id="newEnt">${UI.icon('plus')} ${T('Nouvelle fiche', 'New sheet')}</button>
      </div>
      <div id="cards"></div>`;

    const draw = () => {
      const q = st.q.toLowerCase();
      let list = S.entities(type).filter((e) => (!q || JSON.stringify(e.fields).toLowerCase().includes(q)) && (!st.pub || e.public));
      if (st.sort === 'name') list = list.slice().sort((a, b) => String(a.fields.name).localeCompare(String(b.fields.name)));
      else if (st.sort === 'created') list = list.slice().sort((a, b) => b.createdAt - a.createdAt);
      else list = list.slice().sort((a, b) => b.updatedAt - a.updatedAt);
      const box = el.querySelector('#cards');
      if (!S.entities(type).length) {
        box.className = '';
        box.innerHTML = UI.empty(def.icon, T(`Aucune fiche « ${L(def.singular)} » pour l'instant`, `No "${L(def.singular)}" sheet yet`),
          def.portal ? T('Crée ta première fiche. Rends-la publique pour que les joueurs la découvrent sur le portail.', 'Create your first sheet. Make it public so players can discover it on the portal.') : '');
        return;
      }
      const badge = (e) => {
        const x = e.fields;
        if (type === 'bugs' && x.severity) return `<span class="tag ${SEV_CLS[x.severity] || ''}">${U.esc(SC.optLabel('bugs', 'severity', x.severity))}</span>`;
        if (type === 'assets' && x.astatus) return `<span class="tag ${x.astatus === 'done' ? 'pub' : ''}">${U.esc(SC.optLabel('assets', 'astatus', x.astatus))}</span>`;
        return '';
      };
      if (st.view === 'list') {
        box.className = 'elist';
        box.innerHTML = list.map((e) => {
          const img = e.cover || e.images[0];
          return `<a class="erow" href="#/e/${type}/${e.id}"><span class="av" ${img ? `data-bg-img="${img}"` : ''}>${img ? '' : U.esc(initials(e.fields.name))}</span>
            <span class="li-body"><strong>${U.esc(e.fields.name || T('(sans nom)', '(unnamed)'))}</strong><small>${U.esc(def.subtitle(e.fields) || '')}</small></span>
            <span class="row gap">${badge(e)}${e.public ? `<span class="tag pub">${T('public', 'public')}</span>` : ''}${type === 'tracks' && e.fields.audio ? `<button class="btn icon sm" data-play="${e.id}">${UI.icon('play')}</button>` : ''}</span></a>`;
        }).join('') || `<p class="muted">${T('Aucun résultat.', 'No results.')}</p>`;
      } else {
        box.className = 'cards';
        box.innerHTML = list.map((e) => {
          const x = e.fields;
          const img = e.cover || e.images[0];
          return `<a class="ecard" href="#/e/${type}/${e.id}">
            <div class="ecard-img ${img ? '' : 'noimg'}" ${img ? `data-bg-img="${img}"` : ''}>${img ? '' : `<span>${U.esc(type === 'tracks' ? '♪' : initials(x.name))}</span>`}</div>
            ${e.public ? `<span class="pub-dot">${UI.icon('globe')}${T('public', 'public')}</span>` : ''}
            ${type === 'tracks' && x.audio ? `<button class="btn icon play-btn" data-play="${e.id}" title="${T('Écouter', 'Play')}">${UI.icon('play')}</button>` : ''}
            <div class="ecard-body">
              <strong>${U.esc(x.name || T('(sans nom)', '(unnamed)'))}</strong>
              <small>${U.esc(def.subtitle(x) || '')}</small>
              ${badge(e)}
              ${def.ratings ? ratingsHTML(type, x) : ''}
              ${(x.firstChapter || x.chapter) ? `<small>${UI.icon('flag')} ${U.esc(S.chapterLabel(x.firstChapter || x.chapter))}</small>` : ''}
              ${(x.tags || []).length ? `<div class="tags">${x.tags.slice(0, 4).map((t) => `<span class="tag">${U.esc(t)}</span>`).join('')}</div>` : ''}
            </div></a>`;
        }).join('') || `<p class="muted">${T('Aucun résultat.', 'No results.')}</p>`;
      }
      box.querySelectorAll('[data-play]').forEach((b) => {
        b.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); const e = S.entity(type, b.dataset.play); DP.app.play(e.fields.audio, e.fields.name); };
      });
      DP.media.hydrate(box);
    };
    draw();
    el.querySelector('#q').addEventListener('input', (e) => { st.q = e.target.value; draw(); });
    el.querySelector('#sort').onchange = (e) => { st.sort = e.target.value; draw(); };
    const po = el.querySelector('#pubOnly'); if (po) po.onchange = (e) => { st.pub = e.target.checked; draw(); };
    el.querySelectorAll('#viewSeg [data-v]').forEach((b) => { b.onclick = () => { st.view = b.dataset.v; el.querySelectorAll('#viewSeg button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }; });
    el.querySelector('#newEnt').onclick = () => {
      const e = S.newEntity(type, type === 'bugs' ? { bstatus: 'new', found: U.today() } : type === 'playtests' ? { date: U.today() } : {});
      DP.app.refreshNav();
      DP.app.go(`e/${type}/${e.id}`);
    };
  }

  /** Fiches, chapitres et cartes qui mentionnent cette fiche */
  function backlinks(type, id) {
    const out = [];
    for (const t of SC.ENTITY_ORDER) {
      for (const e of S.entities(t)) {
        if (e.id === id) continue;
        for (const fd of SC.fields(t)) {
          const v = e.fields[fd.key];
          const hit = (fd.type === 'ref' && fd.ref === type && v === id) || (fd.type === 'refs' && fd.ref === type && (v || []).includes(id))
            || (fd.type === 'relations' && type === 'characters' && (v || []).some((r) => r.id === id));
          if (hit) { out.push({ route: `e/${t}/${e.id}`, label: e.fields.name || '?', kind: `${L(SC.ENTITIES[t].singular)} · ${L(fd.label)}` }); break; }
        }
      }
    }
    S.chapters().forEach((c, i) => {
      if ((c.characters || []).includes(id) || (c.locations || []).includes(id)) out.push({ route: `story/${c.id}`, label: c.title || '?', kind: T(`Chapitre ${i + 1}`, `Chapter ${i + 1}`) });
    });
    S.project.maps.forEach((m) => { if (m.markers.some((k) => k.ref && k.ref.id === id)) out.push({ route: `map/${m.id}`, label: m.name, kind: T('Carte', 'Map') }); });
    return out;
  }

  function renderDetail(el, type, id) {
    const def = SC.ENTITIES[type];
    const e = S.entity(type, id);
    const x = e.fields;
    const touch = () => { e.updatedAt = Date.now(); S.touch(); };
    const coverId = e.cover || e.images[0] || '';
    const links = backlinks(type, id);
    const qcat = { characters: 'character', vehicles: 'vehicle', locations: 'level', tracks: 'audio', quests: 'gameplay', items: 'gameplay', lore: 'story', factions: 'story', dialogues: 'story' }[type];
    const qs = qcat ? U.shuffle(DP.toolboxData.QUESTIONS.filter((q) => q.cat === qcat)).slice(0, 3) : [];

    el.innerHTML = `
      <div class="ent-head card">
        <a class="btn icon ghost" href="#/e/${type}" title="${T('Retour', 'Back')}">${UI.icon('left')}</a>
        <button class="ent-cover ${coverId ? '' : 'noimg'}" id="coverBtn" ${coverId ? `data-bg-img="${coverId}"` : ''}>${coverId ? '' : `<span>${U.esc(type === 'tracks' ? '♪' : initials(x.name))}</span>`}</button>
        <div class="grow">
          <input class="title-input" id="eName" value="${U.esc(x.name || '')}" placeholder="${U.esc(L(def.singular))} — ${T('nom', 'name')}">
          <div class="muted" id="eSub">${U.esc(def.subtitle(x) || L(def.singular))}</div>
          <div id="eRatings">${ratingsHTML(type, x)}</div>
          <small class="faint">${T('Créée', 'Created')} ${U.fmtDate(e.createdAt)} · ${T('modifiée', 'updated')} ${U.relTime(e.updatedAt)}</small>
        </div>
        <div class="stack-h">
          ${def.portal ? UI.publicToggle(e.public, 'id="ePub"') : ''}
          <button class="btn sm ghost" id="eDup" title="${T('Dupliquer', 'Duplicate')}">${UI.icon('copy')}</button>
          <button class="btn sm ghost" id="eExp" title="${T('Exporter la fiche (.md)', 'Export sheet (.md)')}">${UI.icon('download')}</button>
          <button class="btn sm ghost" id="eDel" title="${T('Supprimer (corbeille)', 'Delete (trash)')}">${UI.icon('trash')}</button>
        </div>
      </div>

      <div class="ent-layout">
        <div class="ent-main">
          ${def.portal ? `<div class="card" id="pubCard" ${e.public ? '' : 'hidden'}>
            <h3>${UI.icon('globe')} ${T('Présentation pour les joueurs', 'Presentation for players')}</h3>
            <textarea class="input auto" id="ePubText" rows="3" placeholder="${T('Texte court affiché en premier sur le portail (sinon la description est utilisée). Markdown accepté.', 'Short text shown first on the portal (otherwise the description is used). Markdown supported.')}">${U.esc(e.publicText || '')}</textarea>
            <p class="muted small">🔒 ${T('Les champs marqués d\'un cadenas (secrets, notes internes, spoilers) ne sont jamais publiés.', 'Fields marked with a lock (secrets, internal notes, spoilers) are never published.')}</p>
          </div>` : ''}
          ${def.groups.map((g) => `
            <div class="card">
              <h3>${U.esc(L(g.label))}</h3>
              <div class="fields">${g.fields.filter((fd) => fd.key !== 'name').map((fd) => fieldHTML(fd, x[fd.key], e.id)).join('')}</div>
            </div>`).join('')}
        </div>
        <div class="ent-side">
          <div class="card drop-target" id="imgCard">
            <div class="card-head"><h3>${UI.icon('image')} ${T('Images', 'Images')}</h3><span class="muted small">${e.images.length}</span></div>
            <div class="thumbs" id="eImgs">${e.images.map((iid) => UI.tile(iid, { actions: ['view', 'cover', 'download', 'capture', 'remove'], badge: iid === e.cover ? '★' : '' })).join('')}</div>
            <div class="dropzone sm">${UI.icon('upload')} ${T('Glisse, colle (Ctrl+V) ou', 'Drop, paste (Ctrl+V) or')} <button class="link" id="eUp">${T('choisis des images', 'choose images')}</button></div>
          </div>
          ${type === 'playtests' ? `<div class="card"><h3>${UI.icon('check')} ${T('Suite du playtest', 'Playtest follow-up')}</h3><button class="btn block" id="ptTasks">${UI.icon('check')} ${T('Créer des tâches depuis « Actions à faire »', 'Create tasks from "Action items"')}</button></div>` : ''}
          ${type === 'bugs' ? `<div class="card"><h3>${UI.icon('check')} ${T('Correction', 'Fix')}</h3><button class="btn block" id="bugTask">${UI.icon('check')} ${T('Créer une tâche de correction', 'Create a fix task')}</button></div>` : ''}
          <div class="card">
            <h3>${UI.icon('link')} ${T('Mentionné dans', 'Referenced in')} <span class="muted small">${links.length}</span></h3>
            ${links.length ? `<div class="mini-list">${links.map((l) => `<a class="mini-item" href="#/${l.route}"><span class="grow">${U.esc(l.label)}</span><small class="muted">${U.esc(l.kind)}</small></a>`).join('')}</div>` : `<p class="muted small">${T('Aucune autre fiche ne fait référence à celle-ci.', 'No other sheet references this one.')}</p>`}
          </div>
          ${qs.length ? `<div class="card"><h3>${UI.icon('sparkles')} ${T('Questions à te poser', 'Questions to ask yourself')}</h3><div class="stack">${qs.map((q) => `<div class="qcard"><p>${U.esc(L(q.t))}</p></div>`).join('')}</div></div>` : ''}
        </div>
      </div>`;

    // Champs simples
    el.querySelectorAll('[data-f]').forEach((inp) => {
      const k = inp.dataset.f;
      const kind = inp.dataset.kind;
      inp.addEventListener(inp.tagName === 'SELECT' || inp.type === 'date' ? 'change' : 'input', () => {
        let v = inp.value;
        if (kind === 'num') v = v === '' ? '' : +v;
        if (kind === 'tags') v = U.tagsFromString(v);
        x[k] = v;
        if (inp.type === 'range') inp.nextElementSibling.textContent = v;
        touch();
        el.querySelector('#eSub').textContent = def.subtitle(x) || L(def.singular);
        if (def.ratings && def.ratings.includes(k)) el.querySelector('#eRatings').innerHTML = ratingsHTML(type, x);
        if (k === 'script') { const pv = el.querySelector('#scriptPrev'); pv.hidden = !v; pv.innerHTML = scriptPreview(v); }
      });
    });
    const pv = el.querySelector('#scriptPrev'); if (pv && x.script) pv.innerHTML = scriptPreview(x.script);
    el.querySelector('#eName').addEventListener('input', (ev) => { x.name = ev.target.value; touch(); });

    // Widgets
    el.querySelectorAll('[data-w]').forEach((w) => {
      const fd = SC.field(type, w.dataset.w);
      if (fd.type === 'audio') { W.audio(w, () => x[fd.key] || '', (v) => { x[fd.key] = v; touch(); }, () => x.name); return; }
      const get = () => (Array.isArray(x[fd.key]) ? x[fd.key] : (x[fd.key] = []));
      const set = (v) => { x[fd.key] = v; touch(); };
      if (fd.type === 'refs') W.refs(w, fd.ref, get, set, e.id);
      if (fd.type === 'kv') W.kv(w, get, set, { k: fd.placeholderK, v: fd.placeholderV });
      if (fd.type === 'relations') W.relations(w, get, set, e.id);
    });

    // Portail
    const bindPub = () => {
      const b = el.querySelector('#ePub');
      if (!b) return;
      b.onclick = () => {
        e.public = !e.public; touch();
        b.outerHTML = UI.publicToggle(e.public, 'id="ePub"');
        el.querySelector('#pubCard').hidden = !e.public;
        bindPub();
        UI.toast(e.public ? T('Fiche visible sur le portail (publie le portail pour mettre à jour)', 'Sheet visible on the portal (publish the portal to update)') : T('Fiche retirée du portail', 'Sheet removed from the portal'), 'success');
      };
    };
    bindPub();
    const pt = el.querySelector('#ePubText'); if (pt) pt.addEventListener('input', () => { e.publicText = pt.value; touch(); });

    // En-tête
    el.querySelector('#coverBtn').onclick = () => { if (coverId) UI.lightbox(coverId); else addImages(); };
    el.querySelector('#eDup').onclick = () => {
      const c = S.newEntity(type, U.clone(x));
      c.fields.name = `${x.name || ''} (${T('copie', 'copy')})`;
      c.images = [...e.images]; c.cover = e.cover;
      DP.app.refreshNav(); DP.app.go(`e/${type}/${c.id}`);
    };
    el.querySelector('#eExp').onclick = () => U.download(`${U.slug(x.name || type)}.md`, DP.format.entityText(type, e, { heading: '#' }), 'text/markdown;charset=utf-8');
    el.querySelector('#eDel').onclick = () => {
      S.trash('entity', e, { type });
      S.project.entities[type] = S.project.entities[type].filter((z) => z.id !== e.id);
      S.touch(); DP.app.refreshNav();
      UI.toast(T('Fiche déplacée dans la corbeille (Paramètres → Corbeille)', 'Sheet moved to trash (Settings → Trash)'), 'success');
      DP.app.go(`e/${type}`);
    };

    // Images
    const rerender = () => { const y = document.getElementById('view').scrollTop; DP.app.route().then(() => { document.getElementById('view').scrollTop = y; }); };
    const addFiles = async (files) => {
      const ids = await UI.importFiles(files);
      if (!ids.length) return;
      e.images.push(...ids); if (!e.cover) e.cover = ids[0]; touch(); rerender();
    };
    const addImages = async () => {
      const ids = await UI.pickImages({ multiple: true });
      if (ids && ids.length) { e.images.push(...ids.filter((i) => !e.images.includes(i))); if (!e.cover) e.cover = e.images[0]; touch(); rerender(); }
    };
    UI.setPaste(addFiles);
    UI.bindDrop(el.querySelector('#imgCard'), addFiles);
    el.querySelector('#eUp').onclick = addImages;
    UI.bindTiles(el.querySelector('#eImgs'), {
      cover: (iid) => { e.cover = iid; touch(); rerender(); },
      remove: (iid) => { e.images = e.images.filter((z) => z !== iid); if (e.cover === iid) e.cover = e.images[0] || ''; touch(); rerender(); },
    });

    // Actions spécifiques
    const ptBtn = el.querySelector('#ptTasks');
    if (ptBtn) ptBtn.onclick = () => {
      const lines = U.lines(x.actions);
      if (!lines.length) { UI.toast(T('Remplis d\'abord « Actions à faire » (une par ligne).', 'Fill "Action items" first (one per line).'), 'error'); return; }
      lines.forEach((l) => S.project.tasks.unshift({ id: U.uid('task_'), title: l, desc: `${T('Playtest', 'Playtest')} : ${x.name || ''}`, status: 'todo', priority: 'med', category: 'Playtest', milestone: '', createdAt: Date.now() }));
      S.touch(); DP.app.refreshNav();
      UI.toast(T(`${lines.length} tâche(s) créée(s)`, `${lines.length} task(s) created`), 'success');
    };
    const bugBtn = el.querySelector('#bugTask');
    if (bugBtn) bugBtn.onclick = () => {
      const prio = ['blocker', 'critical'].includes(x.severity) ? 'high' : x.severity === 'major' ? 'med' : 'low';
      S.project.tasks.unshift({ id: U.uid('task_'), title: `🐞 ${x.name || T('Bug', 'Bug')}`, desc: [x.steps, x.actual].filter(Boolean).join('\n\n'), status: 'todo', priority: prio, category: 'Bug', milestone: '', createdAt: Date.now() });
      if (!x.bstatus || x.bstatus === 'new') x.bstatus = 'confirmed';
      touch(); DP.app.refreshNav();
      UI.toast(T('Tâche de correction créée', 'Fix task created'), 'success');
    };
  }
})();
