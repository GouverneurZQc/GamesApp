/* Vue : fiches (personnages, véhicules, lieux, objets, factions, missions) */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;

  const ASPECT = { characters: '3:4', vehicles: '16:9', locations: '16:9', items: '1:1', factions: '1:1', quests: '16:9' };
  const VISUAL_KEYS = ['species', 'gender', 'age', 'role', 'occupation', 'appearance', 'outfit', 'distinctive', 'colors', 'height', 'build',
    'manufacturer', 'model', 'year', 'category', 'description', 'exterior', 'inspiration', 'ltype', 'region', 'atmosphere', 'climate',
    'itype', 'rarity', 'effect', 'ftype', 'symbol', 'ideology', 'summary', 'qtype'];

  /* ---------------- Widgets réutilisables ---------------- */
  const W = (GF.widgets = {
    /** Liste de liens vers d'autres fiches (puces + sélecteur) */
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
            GF.app.refreshNav();
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
          const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
          inp.addEventListener(ev, () => { const r = arr(); r[+inp.dataset.i][inp.dataset.k] = inp.value; onChange(r); });
        });
        el.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { const r = arr(); r.splice(+b.dataset.del, 1); onChange(r); draw(); }; });
        el.querySelector('[data-add]').onclick = () => { onChange([...arr(), { id: '', type: '' }]); draw(); };
      };
      draw();
    },
  });

  function initials(name) {
    return (String(name || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || '?').toUpperCase();
  }

  function fieldHTML(type, fd, v, entId) {
    const lab = `<span class="lbl">${U.esc(L(fd.label))}</span>`;
    const ph = fd.placeholder ? ` placeholder="${U.esc(L(fd.placeholder))}"` : '';
    const wide = fd.wide || fd.type === 'textarea' && fd.rows > 4 ? ' wide' : '';
    switch (fd.type) {
      case 'textarea':
        return `<label class="field${fd.wide ? ' wide' : ''}">${lab}<textarea class="input auto" data-f="${fd.key}" rows="${fd.rows || 3}"${ph}>${U.esc(v || '')}</textarea></label>`;
      case 'number':
        return `<label class="field">${lab}<input class="input" type="number" step="any" data-f="${fd.key}" data-kind="num" value="${U.esc(v ?? '')}"></label>`;
      case 'select':
        return `<label class="field">${lab}<select class="input" data-f="${fd.key}">${UI.options(fd.options, v, { empty: '—' })}</select></label>`;
      case 'tags':
        return `<label class="field${wide}">${lab}<input class="input" data-f="${fd.key}" data-kind="tags" value="${U.esc((v || []).join(', '))}" placeholder="${T('séparés par des virgules', 'comma separated')}"></label>`;
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
      case 'rating':
        return `<label class="field">${lab}<div class="rating"><input type="range" min="0" max="10" step="1" data-f="${fd.key}" data-kind="num" value="${U.esc(v ?? 0)}"><output>${v ?? 0}</output></div></label>`;
      case 'refs':
      case 'kv':
      case 'relations':
        return `<div class="field${fd.wide ? ' wide' : ''}">${lab}<div class="widget ${fd.type}" data-w="${fd.key}"></div></div>`;
      default:
        return `<label class="field">${lab}<input class="input" data-f="${fd.key}" value="${U.esc(v || '')}"${ph}></label>`;
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

  /* ---------------- Vue ---------------- */
  GF.views.entities = {
    title: (params) => L(SC.ENTITIES[params.type].label),
    render(el, params) {
      if (params.id && S.entity(params.type, params.id)) return renderDetail(el, params.type, params.id);
      return renderList(el, params.type);
    },
  };

  const listState = {};

  function renderList(el, type) {
    const def = SC.ENTITIES[type];
    const st = (listState[type] = listState[type] || { q: '' });
    el.innerHTML = `
      <div class="page-head">
        <div><p class="muted">${U.esc(T(`Toutes tes fiches « ${L(def.label).toLowerCase()} » : images, description, apparition dans l'histoire, stats…`, `All your "${L(def.label).toLowerCase()}" sheets: images, description, story appearance, stats…`))}</p></div>
        <div class="row gap wrap">
          <div class="search">${UI.icon('search')}<input class="input" id="q" value="${U.esc(st.q)}" placeholder="${T('Rechercher…', 'Search…')}"></div>
          <button class="btn" id="aiPropose">${UI.icon('sparkles')} ${T('Proposer avec l\'IA', 'Suggest with AI')}</button>
          <button class="btn primary" id="newEnt">${UI.icon('plus')} ${T('Nouvelle fiche', 'New sheet')}</button>
        </div>
      </div>
      <div class="cards" id="cards"></div>
      <div id="genOut"></div>`;

    const draw = () => {
      const q = st.q.toLowerCase();
      const list = S.entities(type).filter((e) => !q || JSON.stringify(e.fields).toLowerCase().includes(q));
      const cards = el.querySelector('#cards');
      if (!S.entities(type).length) {
        cards.innerHTML = UI.empty(def.icon, T(`Aucune fiche « ${L(def.singular)} » pour l'instant`, `No "${L(def.singular)}" sheet yet`),
          T('Crée ta première fiche, ou laisse l\'agent t\'en proposer à partir de ton projet.', 'Create your first sheet, or let the agent suggest some from your project.'));
        return;
      }
      cards.innerHTML = list.map((e) => {
        const x = e.fields;
        const img = e.cover || e.images[0];
        return `<a class="ecard" href="#/e/${type}/${e.id}">
          <div class="ecard-img ${img ? '' : 'noimg'}" ${img ? `data-bg-img="${img}"` : ''}>${img ? '' : `<span>${U.esc(initials(x.name))}</span>`}</div>
          <div class="ecard-body">
            <strong>${U.esc(x.name || T('(sans nom)', '(unnamed)'))}</strong>
            <small>${U.esc(def.subtitle(x) || '')}</small>
            ${type === 'vehicles' ? ratingsHTML(type, x) : ''}
            ${(x.firstChapter || x.chapter) ? `<small class="muted">${UI.icon('flag')} ${U.esc(S.chapterLabel(x.firstChapter || x.chapter))}</small>` : ''}
            ${(x.tags || []).length ? `<div class="tags">${x.tags.slice(0, 4).map((t) => `<span class="tag">${U.esc(t)}</span>`).join('')}</div>` : ''}
          </div></a>`;
      }).join('') || `<p class="muted">${T('Aucun résultat.', 'No results.')}</p>`;
      GF.images.hydrate(cards);
    };
    draw();
    el.querySelector('#q').addEventListener('input', (e) => { st.q = e.target.value; draw(); });
    el.querySelector('#newEnt').onclick = () => {
      const e = S.newEntity(type);
      GF.app.refreshNav();
      GF.app.go(`e/${type}/${e.id}`);
    };
    el.querySelector('#aiPropose').onclick = () => proposeWithAI(el, type);
  }

  async function proposeWithAI(el, type) {
    const def = SC.ENTITIES[type];
    const n = await UI.ask(T('Combien de propositions ?', 'How many proposals?'), { value: '4', label: T('L\'agent va proposer de nouvelles fiches cohérentes avec ton projet. Tu pourras choisir lesquelles garder.', 'The agent will propose new sheets consistent with your project. You choose which to keep.') });
    if (!n) return;
    const count = Math.max(1, Math.min(10, parseInt(n, 10) || 4));
    const out = el.querySelector('#genOut');
    out.innerHTML = `<div class="card">${UI.spinner(T('L\'agent imagine des propositions…', 'The agent is brainstorming…'))}</div>`;
    const fillable = SC.fields(type).filter((fd) => ['text', 'textarea', 'number', 'select', 'tags', 'rating'].includes(fd.type));
    const schema = fieldsSpec(fillable);
    const en = GF.lang === 'en';
    try {
      const data = await GF.agent.json({
        prompt: en
          ? `Propose ${count} new "${L(def.singular)}" sheets for my game, consistent with the project, varied, memorable, and different from existing ones. Answer with a JSON array of objects. Available keys:\n${schema}\nFill as many relevant keys as possible (at least name + description-type fields). Values in English.`
          : `Propose ${count} nouvelles fiches « ${L(def.singular)} » pour mon jeu, cohérentes avec le projet, variées, mémorables et différentes de celles qui existent. Réponds avec un tableau JSON d'objets. Clés possibles :\n${schema}\nRemplis le plus de clés pertinentes possible (au minimum name + les champs de description). Valeurs en français.`,
        persona: type === 'vehicles' ? 'designer' : 'writer', focus: type, maxTokens: 16000,
      });
      const arr = Array.isArray(data) ? data : (data.items || data.fiches || data.sheets || Object.values(data).find(Array.isArray) || []);
      if (!arr.length) throw new Error(T('Aucune proposition reçue.', 'No proposals received.'));
      out.innerHTML = `<div class="card"><h3>${UI.icon('sparkles')} ${T('Propositions de l\'agent', 'Agent proposals')}</h3>
        <div class="proposals">${arr.map((o, i) => `<label class="proposal"><input type="checkbox" data-i="${i}" checked>
          <div><strong>${U.esc(o.name || '?')}</strong><p class="small">${U.esc(U.truncate(o.description || o.summary || o.personality || o.appearance || o.effect || '', 260))}</p></div></label>`).join('')}</div>
        <div class="row gap"><button class="btn primary" id="keep">${UI.icon('check')} ${T('Créer les fiches cochées', 'Create checked sheets')}</button><button class="btn ghost" id="discard">${T('Ignorer', 'Discard')}</button></div></div>`;
      out.querySelector('#discard').onclick = () => { out.innerHTML = ''; };
      out.querySelector('#keep').onclick = () => {
        const chosen = Array.from(out.querySelectorAll('input[data-i]')).filter((cb) => cb.checked).map((cb) => arr[+cb.dataset.i]);
        chosen.reverse().forEach((o) => S.newEntity(type, sanitize(type, o))); // newEntity ajoute en tête : on garde l'ordre proposé
        const k = chosen.length;
        GF.app.refreshNav();
        UI.toast(T(`${k} fiche(s) créée(s)`, `${k} sheet(s) created`), 'success');
        GF.app.route();
      };
    } catch (e) {
      out.innerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(e.message)}</div></div>`;
    }
  }

  function fieldsSpec(fields) {
    return fields.map((fd) => `- ${fd.key} (${L(fd.label)})${fd.type === 'select' ? ` : ${T('une valeur parmi', 'one of')} ${fd.options.map((o) => o.v).join(' | ')}`
      : fd.type === 'number' ? ` : ${T('nombre', 'number')}` : fd.type === 'rating' ? ` : ${T('entier de 0 à 10', 'integer 0-10')}`
        : fd.type === 'tags' ? ` : ${T('tableau de mots-clés', 'array of keywords')}` : ''}`).join('\n');
  }

  function sanitize(type, o) {
    const out = {};
    for (const fd of SC.fields(type)) {
      if (!(fd.key in o)) continue;
      let v = o[fd.key];
      if (v == null || v === '') continue;
      if (fd.type === 'number' || fd.type === 'rating') {
        v = parseFloat(v); if (isNaN(v)) continue;
        if (fd.type === 'rating') v = Math.max(0, Math.min(10, Math.round(v)));
      } else if (fd.type === 'tags') v = Array.isArray(v) ? v.map(String) : U.tagsFromString(v);
      else if (fd.type === 'select') { if (!fd.options.some((x) => x.v === v)) continue; }
      else if (['text', 'textarea'].includes(fd.type)) v = Array.isArray(v) ? v.join('\n') : typeof v === 'object' ? JSON.stringify(v) : String(v);
      else continue;
      out[fd.key] = v;
    }
    return out;
  }

  /* ---------------- Détail d'une fiche ---------------- */
  function renderDetail(el, type, id) {
    const def = SC.ENTITIES[type];
    const e = S.entity(type, id);
    const x = e.fields;
    const touch = () => { e.updatedAt = Date.now(); S.touch(); };
    const coverId = e.cover || e.images[0] || '';

    const aiChips = [
      ['complete', 'wand', ['Compléter la fiche', 'Complete the sheet']],
      ['improve', 'sparkles', ['Suggestions d\'amélioration', 'Improvement ideas']],
      ['coherence', 'target', ['Vérifier la cohérence', 'Check consistency']],
      ...(type === 'characters' ? [['dialogue', 'chat', ['Exemples de dialogues', 'Sample dialogue']], ['arc', 'feather', ['Proposer un arc', 'Propose an arc']]] : []),
      ...(type === 'vehicles' ? [['balance', 'sliders', ['Équilibrage vs autres véhicules', 'Balance vs other vehicles']], ['design', 'palette', ['Idées de design', 'Design ideas']]] : []),
      ...(type === 'locations' ? [['level', 'pin', ['Idées de level design', 'Level design ideas']]] : []),
      ...(type === 'items' ? [['balance', 'sliders', ['Équilibrage', 'Balancing']]] : []),
      ...(type === 'quests' ? [['steps', 'flag', ['Détailler les étapes', 'Detail the steps']]] : []),
      ['critic', 'camera', ['Avis impitoyable', 'Ruthless opinion']],
    ];

    el.innerHTML = `
      <div class="ent-head card">
        <a class="btn icon ghost" href="#/e/${type}" title="${T('Retour', 'Back')}">${UI.icon('left')}</a>
        <button class="ent-cover ${coverId ? '' : 'noimg'}" id="coverBtn" ${coverId ? `data-bg-img="${coverId}"` : ''}>${coverId ? '' : `<span>${U.esc(initials(x.name))}</span>`}</button>
        <div class="grow">
          <input class="title-input" id="eName" value="${U.esc(x.name || '')}" placeholder="${U.esc(L(def.singular))} — ${T('nom', 'name')}">
          <div class="muted" id="eSub">${U.esc(def.subtitle(x) || L(def.singular))}</div>
          ${ratingsHTML(type, x)}
        </div>
        <div class="stack-h">
          <button class="btn sm ghost" id="eDup" title="${T('Dupliquer', 'Duplicate')}">${UI.icon('copy')}</button>
          <button class="btn sm ghost" id="eExp" title="${T('Exporter la fiche (.md)', 'Export sheet (.md)')}">${UI.icon('download')}</button>
          <button class="btn sm ghost" id="eDel" title="${T('Supprimer', 'Delete')}">${UI.icon('trash')}</button>
        </div>
      </div>

      <div class="ent-layout">
        <div class="ent-main">
          ${def.groups.map((g) => `
            <div class="card">
              <h3>${U.esc(L(g.label))}</h3>
              <div class="fields">${g.fields.filter((fd) => fd.key !== 'name').map((fd) => fieldHTML(type, fd, x[fd.key], e.id)).join('')}</div>
            </div>`).join('')}
        </div>
        <div class="ent-side">
          <div class="card">
            <div class="card-head"><h3>${UI.icon('image')} ${T('Images', 'Images')}</h3><span class="muted small">${e.images.length}</span></div>
            <div class="thumbs" id="eImgs">${e.images.map((iid) => UI.tile(iid, { actions: ['view', 'cover', 'download', 'critique', 'edit', 'remove'], badge: iid === e.cover ? '★' : '' })).join('')}</div>
            <div class="dropzone sm" id="eDrop">${UI.icon('upload')} ${T('Glisse, colle (Ctrl+V) ou', 'Drop, paste (Ctrl+V) or')} <button class="link" id="eUp">${T('choisis des images', 'choose images')}</button></div>
            <button class="btn primary block" id="eGen">${UI.icon('wand')} ${T('Générer une image avec l\'IA', 'Generate an image with AI')}</button>
            <div id="eGenStatus"></div>
          </div>
          <div class="card">
            <h3>${UI.icon('sparkles')} ${T('Agent', 'Agent')}</h3>
            <div class="chips">${aiChips.map(([k, ic, lab]) => `<button class="chip" data-ai="${k}">${UI.icon(ic)} ${U.esc(L(lab))}</button>`).join('')}</div>
            <div class="composer mini"><input class="input" id="eAsk" placeholder="${T('Pose une question sur cette fiche…', 'Ask something about this sheet…')}"><button class="btn primary" id="eAskBtn">${UI.icon('send')}</button></div>
          </div>
          <div id="eOut"></div>
        </div>
      </div>`;

    // --- liaisons des champs simples
    el.querySelectorAll('[data-f]').forEach((inp) => {
      const k = inp.dataset.f;
      const kind = inp.dataset.kind;
      const ev = inp.tagName === 'SELECT' || inp.type === 'range' ? 'input' : 'input';
      inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : ev, () => {
        let v = inp.value;
        if (kind === 'num') v = v === '' ? '' : +v;
        if (kind === 'tags') v = U.tagsFromString(v);
        x[k] = v;
        if (inp.type === 'range') inp.nextElementSibling.textContent = v;
        touch();
        el.querySelector('#eSub').textContent = def.subtitle(x) || L(def.singular);
        if (def.ratings && def.ratings.includes(k)) {
          const r = el.querySelector('.ent-head .ratings');
          if (r) r.outerHTML = ratingsHTML(type, x);
        }
      });
    });
    el.querySelector('#eName').addEventListener('input', (ev) => { x.name = ev.target.value; touch(); });

    // --- widgets
    el.querySelectorAll('[data-w]').forEach((w) => {
      const fd = SC.field(type, w.dataset.w);
      const get = () => (Array.isArray(x[fd.key]) ? x[fd.key] : (x[fd.key] = []));
      const set = (v) => { x[fd.key] = v; touch(); };
      if (fd.type === 'refs') W.refs(w, fd.ref, get, set, e.id);
      if (fd.type === 'kv') W.kv(w, get, set, { k: fd.placeholderK, v: fd.placeholderV });
      if (fd.type === 'relations') W.relations(w, get, set, e.id);
    });

    // --- actions d'en-tête
    el.querySelector('#coverBtn').onclick = () => { if (coverId) UI.lightbox(coverId); else addImages(); };
    el.querySelector('#eDup').onclick = () => {
      const c = S.newEntity(type, U.clone(x));
      c.fields.name = `${x.name || ''} (${T('copie', 'copy')})`;
      c.images = [...e.images]; c.cover = e.cover;
      GF.app.refreshNav(); GF.app.go(`e/${type}/${c.id}`);
    };
    el.querySelector('#eExp').onclick = () => U.download(`${U.slug(x.name || type)}.md`, GF.agent.entityText(type, e, { heading: '#' }), 'text/markdown;charset=utf-8');
    el.querySelector('#eDel').onclick = async () => {
      if (!(await UI.confirm(T(`Supprimer la fiche « ${x.name || '?'} » ?`, `Delete sheet "${x.name || '?'}"?`), { danger: true }))) return;
      S.project.entities[type] = S.project.entities[type].filter((z) => z.id !== e.id);
      S.touch(); GF.app.refreshNav(); GF.app.go(`e/${type}`);
    };

    // --- images
    const rerender = () => { const y = el.closest('.view').scrollTop; GF.app.route().then(() => { document.getElementById('view').scrollTop = y; }); };
    const addFiles = async (files) => {
      const ids = await UI.importImages(files);
      if (!ids.length) return;
      e.images.push(...ids); if (!e.cover) e.cover = ids[0]; touch(); rerender();
    };
    const addImages = async () => {
      const ids = await UI.pickImages({ multiple: true });
      if (ids && ids.length) { e.images.push(...ids.filter((i) => !e.images.includes(i))); if (!e.cover) e.cover = e.images[0]; touch(); rerender(); }
    };
    UI.setPaste(addFiles);
    UI.bindDrop(el.querySelector('#eDrop'), addFiles);
    el.querySelector('#eUp').onclick = addImages;
    UI.bindTiles(el.querySelector('#eImgs'), {
      cover: (iid) => { e.cover = iid; touch(); rerender(); },
      remove: (iid) => { e.images = e.images.filter((z) => z !== iid); if (e.cover === iid) e.cover = e.images[0] || ''; touch(); rerender(); },
    });
    el.querySelector('#eGen').onclick = () => genImageModal(type, e, rerender);

    // --- agent
    const out = el.querySelector('#eOut');
    const sheetBlock = () => (GF.lang === 'en'
      ? `<current_sheet type="${L(def.singular)}">\n${GF.agent.entityText(type, e)}\n</current_sheet>`
      : `<fiche_en_cours type="${L(def.singular)}">\n${GF.agent.entityText(type, e)}\n</fiche_en_cours>`);
    const persona = type === 'characters' || type === 'factions' || type === 'quests' ? 'writer' : type === 'locations' ? 'level' : 'designer';
    const PROMPTS = {
      improve: [`Donne des suggestions franches et concrètes pour rendre cette fiche plus mémorable, originale et utile au gameplay. Ce qui marche, ce qui est générique, ce qu'il faut changer.`,
        `Give frank, concrete suggestions to make this sheet more memorable, original and useful for gameplay. What works, what is generic, what to change.`],
      coherence: [`Vérifie la cohérence de cette fiche avec l'histoire, les chapitres et les autres fiches du projet. Liste les contradictions, les liens manquants et propose des connexions.`,
        `Check this sheet's consistency with the story, chapters and other sheets. List contradictions, missing links and propose connections.`],
      dialogue: [`Écris 6 à 8 répliques typiques de ce personnage dans différentes situations de jeu (combat, victoire, échec, rencontre, humour), fidèles à sa personnalité.`,
        `Write 6 to 8 typical lines for this character in various gameplay situations (combat, victory, failure, encounter, humor), true to their personality.`],
      arc: [`Propose un arc narratif complet pour ce personnage (début, bascule, évolution, fin), en l'ancrant dans les chapitres existants.`,
        `Propose a full story arc for this character (start, turning point, evolution, end), anchored in the existing chapters.`],
      balance: [`Analyse l'équilibrage de cette fiche par rapport aux autres fiches du même type dans le projet. Propose des valeurs ajustées dans un tableau et explique la place de cet élément dans la progression.`,
        `Analyze this sheet's balance against the other sheets of the same type. Propose adjusted values in a table and explain its place in the progression.`],
      design: [`Propose 5 directions de design visuel pour ce véhicule (silhouette, détails, livrées, sons), cohérentes avec la direction artistique du projet.`,
        `Propose 5 visual design directions for this vehicle (silhouette, details, liveries, sounds), consistent with the project's art direction.`],
      level: [`Propose des idées de level design pour ce lieu : parcours, points d'intérêt, rythme, secrets, rencontres, landmarks, et un plan schématique en texte.`,
        `Propose level design ideas for this location: paths, points of interest, pacing, secrets, encounters, landmarks, and a rough text layout.`],
      steps: [`Détaille cette mission étape par étape (objectifs, lieux, obstacles, dialogues clés, variantes, récompenses) et signale ce qui pourrait être ennuyeux.`,
        `Detail this mission step by step (objectives, locations, obstacles, key dialogue, variants, rewards) and flag what could be boring.`],
      critic: [`Donne ton avis sans filtre sur cette fiche : note /10, clichés, faiblesses, ce qui ne marcherait pas en jeu, puis 3 changements prioritaires.`,
        `Give your unfiltered opinion on this sheet: score /10, clichés, weaknesses, what would not work in-game, then 3 priority changes.`],
    };
    el.querySelectorAll('[data-ai]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.ai;
        if (k === 'complete') return completeSheet(type, e, rerender);
        const pr = PROMPTS[k];
        GF.agent.run({ into: out, position: 'prepend', title: b.textContent.trim(), prompt: L(pr), persona: k === 'critic' ? 'critic' : k === 'balance' ? 'designer' : persona, extra: sheetBlock(), focus: type });
      };
    });
    const askFree = () => {
      const q = el.querySelector('#eAsk');
      if (!q.value.trim()) return;
      GF.agent.run({ into: out, position: 'prepend', title: U.truncate(q.value, 50), prompt: q.value, persona, extra: sheetBlock(), focus: type });
      q.value = '';
    };
    el.querySelector('#eAskBtn').onclick = askFree;
    el.querySelector('#eAsk').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') askFree(); });
  }

  /* ---------------- Compléter la fiche avec l'IA ---------------- */
  async function completeSheet(type, e, rerender) {
    const def = SC.ENTITIES[type];
    const fillable = SC.fields(type).filter((fd) => ['text', 'textarea', 'number', 'select', 'tags', 'rating'].includes(fd.type));
    const current = {};
    fillable.forEach((fd) => { const v = e.fields[fd.key]; if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) current[fd.key] = v; });
    const empty = fillable.filter((fd) => !(fd.key in current));
    if (!empty.length) { UI.toast(T('Tous les champs sont déjà remplis 👌', 'All fields are already filled 👌'), 'success'); return; }
    const m = UI.modal({ title: T('Compléter la fiche avec l\'IA', 'Complete the sheet with AI'), wide: true, body: UI.spinner(T('L\'agent remplit les champs vides…', 'The agent is filling empty fields…')) });
    const en = GF.lang === 'en';
    try {
      const data = await GF.agent.json({
        prompt: en
          ? `Here is the current "${L(def.singular)}" sheet (JSON):\n${JSON.stringify(current, null, 1)}\n\nFill in the EMPTY fields creatively and consistently with the project and the filled fields. Do not change filled fields.\nEmpty fields to propose:\n${fieldsSpec(empty)}\nAnswer with a JSON object containing only the proposed fields. Values in English.`
          : `Voici la fiche « ${L(def.singular)} » actuelle (JSON) :\n${JSON.stringify(current, null, 1)}\n\nComplète les champs VIDES de façon créative et cohérente avec le projet et les champs déjà remplis. Ne modifie pas les champs remplis.\nChamps vides à proposer :\n${fieldsSpec(empty)}\nRéponds avec un objet JSON contenant uniquement les champs proposés. Valeurs en français.`,
        persona: type === 'vehicles' || type === 'items' ? 'designer' : 'writer', focus: type, maxTokens: 16000,
      });
      const clean = sanitize(type, Array.isArray(data) ? data[0] || {} : data);
      const keys = Object.keys(clean).filter((k) => empty.some((fd) => fd.key === k));
      if (!keys.length) throw new Error(T('Aucune proposition exploitable.', 'No usable proposal.'));
      m.body.innerHTML = `<p class="muted small">${T('Coche les propositions à garder. Tu peux les modifier avant de valider.', 'Check the proposals to keep. You can edit them before confirming.')}</p>
        <div class="proposals">${keys.map((k) => {
          const fd = SC.field(type, k);
          const v = clean[k];
          const shown = fd.type === 'select' ? L((fd.options.find((o) => o.v === v) || {}).l || v) : Array.isArray(v) ? v.join(', ') : v;
          const editable = ['text', 'textarea'].includes(fd.type);
          return `<label class="proposal"><input type="checkbox" data-k="${k}" checked><div class="grow"><strong>${U.esc(L(fd.label))}</strong>
            ${editable ? `<textarea class="input auto" data-v="${k}" rows="2">${U.esc(v)}</textarea>` : `<p>${U.esc(shown)}</p>`}</div></label>`;
        }).join('')}</div>
        <div class="row gap"><button class="btn primary" id="apply">${UI.icon('check')} ${T('Appliquer', 'Apply')}</button></div>`;
      UI.autoGrow(m.body);
      m.body.querySelector('#apply').onclick = () => {
        m.body.querySelectorAll('input[data-k]').forEach((cb) => {
          if (!cb.checked) return;
          const k = cb.dataset.k;
          const ta = m.body.querySelector(`[data-v="${k}"]`);
          e.fields[k] = ta ? ta.value : clean[k];
        });
        e.updatedAt = Date.now(); S.touch(); m.close(); rerender();
        UI.toast(T('Fiche complétée ✔', 'Sheet completed ✔'), 'success');
      };
    } catch (err) {
      m.body.innerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(err.message)}<br><a class="link" href="#/settings">${T('Paramètres IA', 'AI settings')}</a></div></div>`;
    }
  }

  /* ---------------- Générer une image pour la fiche ---------------- */
  function genImageModal(type, e, rerender) {
    const def = SC.ENTITIES[type];
    let prov = null;
    try { prov = GF.ai.resolve('image'); } catch (err) { /* ignore */ }
    const refOK = prov && prov.def.kind !== 'pollinations';
    const cover = e.cover || e.images[0];
    const m = UI.modal({
      title: T('Générer une image', 'Generate an image'),
      body: `
        <p class="muted small">${T('L\'image est construite à partir des champs de la fiche et de la direction artistique du projet.', 'The image is built from the sheet fields and the project art direction.')}</p>
        <label class="lbl">${T('Précisions (optionnel)', 'Extra details (optional)')}</label>
        <textarea class="input" id="gExtra" rows="2" placeholder="${T('ex. de profil, en pleine course sous la pluie, expression déterminée…', 'e.g. side view, racing in the rain, determined expression…')}"></textarea>
        <div class="row gap wrap">
          <label class="field"><span class="lbl">${T('Style', 'Style')}</span><select class="input" id="gStyle">${UI.options(SC.IMAGE_STYLES.map((s) => [s[0], s[1]]), 'project')}</select></label>
          <label class="field"><span class="lbl">${T('Format', 'Aspect')}</span><select class="input" id="gAspect">${UI.options(SC.ASPECTS.map((a) => [a, [a, a]]), ASPECT[type])}</select></label>
          <label class="field"><span class="lbl">${T('Nombre', 'Count')}</span><select class="input" id="gN">${UI.options([['1', ['1', '1']], ['2', ['2', '2']], ['3', ['3', '3']], ['4', ['4', '4']]], '1')}</select></label>
        </div>
        <label class="check"><input type="checkbox" id="gOpt" ${S.settings.agent.optimizePrompts ? 'checked' : ''}> ${T('L\'agent optimise le prompt (recommandé)', 'Let the agent optimize the prompt (recommended)')}</label>
        ${cover ? `<label class="check ${refOK ? '' : 'disabled'}"><input type="checkbox" id="gRef" ${refOK ? '' : 'disabled'}> ${T('Utiliser l\'image principale comme référence (cohérence)', 'Use the main image as reference (consistency)')} ${refOK ? '' : `<small class="muted">(${T('nécessite OpenAI ou Gemini', 'requires OpenAI or Gemini')})</small>`}</label>` : ''}
        <p class="muted small">${T('Fournisseur d\'images', 'Image provider')} : <strong>${U.esc(prov ? `${prov.label}${prov.imageModel ? ' · ' + prov.imageModel : ''}` : '?')}</strong> — <a class="link" href="#/settings">${T('changer', 'change')}</a></p>
        <div id="gStatus"></div>`,
      buttons: [
        { label: T('Fermer', 'Close'), cls: 'ghost' },
        { label: `${UI.icon('wand')} ${T('Générer', 'Generate')}`, cls: 'primary', action: async (close, root) => {
          const st = root.querySelector('#gStatus');
          const x = e.fields;
          const desc = [`${L(def.singular)} "${x.name || ''}"`,
            ...VISUAL_KEYS.filter((k) => x[k] && SC.field(type, k)).map((k) => `${L(SC.field(type, k).label)}: ${GF.agent.fieldText(type, SC.field(type, k), x[k])}`),
            root.querySelector('#gExtra').value.trim()].filter(Boolean).join('. ');
          const useRef = root.querySelector('#gRef') && root.querySelector('#gRef').checked;
          try {
            const { ids, finalPrompt } = await GF.agent.generateImages({
              prompt: desc, kindText: def.imageKind, style: root.querySelector('#gStyle').value, aspect: root.querySelector('#gAspect').value,
              n: +root.querySelector('#gN').value, optimize: root.querySelector('#gOpt').checked, refs: useRef ? [cover] : [], source: type,
              onStatus: (s, pr) => { st.innerHTML = UI.spinner(s) + (pr ? `<details class="small"><summary>${T('Prompt utilisé', 'Prompt used')}</summary><p>${U.esc(pr)}</p></details>` : ''); },
            });
            e.images.push(...ids); if (!e.cover) e.cover = ids[0]; e.updatedAt = Date.now(); S.touch();
            st.innerHTML = `<div class="thumbs">${ids.map((i) => UI.tile(i, { actions: ['view', 'download'] })).join('')}</div>
              <details class="small"><summary>${T('Prompt utilisé', 'Prompt used')}</summary><p>${U.esc(finalPrompt)}</p></details>`;
            GF.images.hydrate(st); UI.bindTiles(st);
            UI.toast(T('Image ajoutée à la fiche ✔', 'Image added to the sheet ✔'), 'success');
            m.onDoneRerender = true;
            return false;
          } catch (err) {
            st.innerHTML = `<div class="ai-error">${UI.icon('info')}<div>${U.esc(err.message)}</div></div>`;
            return false;
          }
        } },
      ],
      onClose: () => { if (m.onDoneRerender) rerender(); },
    });
  }
})();
