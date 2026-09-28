/* GameForge Studio — composants d'interface : icônes, toasts, modales, images, glisser-déposer */
(function () {
  const U = GF.util;

  const ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h8M8 11h6"/>',
    feather: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.7-1.7h2c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    wand: '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    check: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    edit: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="16" cy="8" r="1.2"/><circle cx="8" cy="16" r="1.2"/>',
  };

  const UI = (GF.ui = {
    icon(name, cls = '') {
      return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
    },
    $: (sel, root = document) => root.querySelector(sel),
    $$: (sel, root = document) => Array.from(root.querySelectorAll(sel)),

    toast(msg, type = 'info', ms = 3800) {
      const box = document.getElementById('toasts');
      if (!box) return;
      const t = document.createElement('div');
      t.className = `toast toast-${type}`;
      t.innerHTML = `${UI.icon(type === 'error' ? 'x' : type === 'success' ? 'check' : 'info')}<span>${U.esc(msg)}</span>`;
      box.appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
    },

    /** Modale générique. buttons: [{label, cls, action(close, root) -> false pour garder ouverte}] */
    modal({ title = '', body = '', wide = false, buttons = [], onOpen, onClose, cls = '' } = {}) {
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap';
      wrap.innerHTML = `
        <div class="modal ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true">
          <div class="modal-head"><h3>${U.esc(title)}</h3><button class="btn icon ghost" data-close title="${T('Fermer', 'Close')}">${UI.icon('x')}</button></div>
          <div class="modal-body"></div>
          ${buttons.length ? '<div class="modal-foot"></div>' : ''}
        </div>`;
      const bodyEl = wrap.querySelector('.modal-body');
      if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        wrap.classList.remove('show');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => wrap.remove(), 200);
        onClose && onClose();
      };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
      wrap.querySelector('[data-close]').onclick = close;
      const foot = wrap.querySelector('.modal-foot');
      buttons.forEach((b) => {
        const btn = document.createElement('button');
        btn.className = `btn ${b.cls || ''}`;
        btn.innerHTML = b.label;
        btn.onclick = async () => {
          if (!b.action) return close();
          btn.disabled = true;
          try {
            const r = await b.action(close, wrap);
            if (r !== false) close();
          } catch (e) {
            UI.toast(e.message, 'error');
          } finally { btn.disabled = false; }
        };
        foot.appendChild(btn);
      });
      document.body.appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('show'));
      onOpen && onOpen(wrap);
      const first = wrap.querySelector('input, textarea, select');
      if (first) setTimeout(() => first.focus(), 50);
      GF.images.hydrate(wrap);
      return { root: wrap, close, body: bodyEl };
    },

    confirm(msg, { danger = false, ok } = {}) {
      return new Promise((res) => {
        let done = false;
        UI.modal({
          title: T('Confirmation', 'Confirmation'),
          body: `<p>${U.esc(msg)}</p>`,
          buttons: [
            { label: T('Annuler', 'Cancel'), cls: 'ghost', action: () => { done = true; res(false); } },
            { label: ok || T('Confirmer', 'Confirm'), cls: danger ? 'danger' : 'primary', action: () => { done = true; res(true); } },
          ],
          onClose: () => { if (!done) res(false); },
        });
      });
    },

    ask(title, { value = '', placeholder = '', multiline = false, label = '' } = {}) {
      return new Promise((res) => {
        let done = false;
        const input = multiline
          ? `<textarea class="input" rows="5" placeholder="${U.esc(placeholder)}">${U.esc(value)}</textarea>`
          : `<input class="input" value="${U.esc(value)}" placeholder="${U.esc(placeholder)}">`;
        const m = UI.modal({
          title,
          body: `${label ? `<label class="lbl">${U.esc(label)}</label>` : ''}${input}`,
          buttons: [
            { label: T('Annuler', 'Cancel'), cls: 'ghost', action: () => { done = true; res(null); } },
            { label: T('Valider', 'OK'), cls: 'primary', action: (c, root) => { done = true; res(root.querySelector('.input').value.trim()); } },
          ],
          onClose: () => { if (!done) res(null); },
        });
        if (!multiline) {
          m.root.querySelector('.input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { done = true; res(e.target.value.trim()); m.close(); }
          });
        }
      });
    },

    async lightbox(imageId) {
      const src = await GF.images.url(imageId);
      if (!src) return;
      const wrap = document.createElement('div');
      wrap.className = 'lightbox';
      wrap.innerHTML = `<img src="${src}" alt=""><div class="lb-bar">
        <button class="btn sm" data-lb="dl">${UI.icon('download')} ${T('Télécharger', 'Download')}</button>
        <button class="btn sm" data-lb="attach">${UI.icon('link')} ${T('Associer à…', 'Attach to…')}</button>
        <button class="btn sm" data-lb="close">${UI.icon('x')} ${T('Fermer', 'Close')}</button></div>`;
      const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      wrap.addEventListener('click', (e) => {
        const b = e.target.closest('[data-lb]');
        if (!b) { if (e.target === wrap) close(); return; }
        if (b.dataset.lb === 'dl') GF.images.download(imageId);
        else if (b.dataset.lb === 'attach') UI.attachImage(imageId);
        else close();
      });
      document.body.appendChild(wrap);
    },

    /** Glisser-déposer d'images sur un élément */
    bindDrop(el, onFiles) {
      if (!el) return;
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag'); });
      el.addEventListener('dragleave', (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove('drag'); });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag');
        const files = Array.from(e.dataTransfer.files || []).filter((f) => /^image\//.test(f.type));
        if (files.length) onFiles(files);
      });
    },

    /** Gestionnaire unique du collage (Ctrl+V) d'images pour la vue active */
    setPaste(fn) { UI._paste = fn; },

    autoGrow(root = document) {
      root.querySelectorAll('textarea.auto').forEach((ta) => {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight + 2, 900) + 'px';
      });
    },

    options(list, current, { empty } = {}) {
      let html = empty != null ? `<option value="">${U.esc(empty)}</option>` : '';
      for (const it of list) {
        const [v, label] = Array.isArray(it) ? it : [it.v, it.l];
        html += `<option value="${U.esc(v)}" ${String(v) === String(current ?? '') ? 'selected' : ''}>${U.esc(L(label))}</option>`;
      }
      return html;
    },

    empty(icon, title, text = '', action = '') {
      return `<div class="empty">${UI.icon(icon, 'big')}<h3>${U.esc(title)}</h3>${text ? `<p>${U.esc(text)}</p>` : ''}${action}</div>`;
    },

    spinner(text = '') {
      return `<div class="spin-row"><span class="spinner"></span>${text ? `<span>${U.esc(text)}</span>` : ''}</div>`;
    },

    /* ---------- Tuiles d'images ---------- */
    tile(id, { caption = '', actions = ['view', 'download', 'attach', 'critique', 'edit', 'remove'], badge = '' } = {}) {
      const names = {
        view: ['eye', T('Agrandir', 'View')], download: ['download', T('Télécharger', 'Download')],
        attach: ['link', T('Associer à une fiche…', 'Attach to a sheet…')], critique: ['camera', T('Faire critiquer', 'Get a critique')],
        edit: ['wand', T('Modifier avec l\'IA', 'Edit with AI')], remove: ['trash', T('Supprimer', 'Delete')],
        cover: ['star', T('Image principale', 'Main image')],
        reuse: ['refresh', T('Réutiliser le prompt', 'Reuse prompt')],
      };
      return `<div class="tile" data-id="${U.esc(id)}">
        <img data-img="${U.esc(id)}" alt="" loading="lazy">
        ${badge ? `<span class="tile-badge">${badge}</span>` : ''}
        <div class="tile-actions">${actions.map((a) => `<button class="btn icon sm" data-tile="${a}" title="${U.esc(names[a][1])}">${UI.icon(names[a][0])}</button>`).join('')}</div>
        ${caption ? `<div class="tile-cap" title="${U.esc(caption)}">${U.esc(caption)}</div>` : ''}
      </div>`;
    },

    bindTiles(root, handlers = {}) {
      root.addEventListener('click', async (e) => {
        const tile = e.target.closest('.tile');
        if (!tile || !root.contains(tile)) return;
        const id = tile.dataset.id;
        const b = e.target.closest('[data-tile]');
        const act = b ? b.dataset.tile : 'view';
        e.stopPropagation();
        if (handlers[act]) return handlers[act](id, tile);
        switch (act) {
          case 'view': return UI.lightbox(id);
          case 'download': return GF.images.download(id);
          case 'attach': return UI.attachImage(id);
          case 'critique': GF.app.pending = { critiqueImages: [id] }; return GF.app.go('critique');
          case 'edit': GF.app.pending = { studioRef: id }; return GF.app.go('studio');
          default:
        }
      });
    },

    /** Ajoute des images (fichiers) au projet et renvoie leurs ids */
    async importImages(files) {
      const ids = [];
      for (const f of files) {
        try { ids.push(await GF.images.add(f)); } catch (e) { UI.toast(`${f.name} : ${e.message}`, 'error'); }
      }
      return ids;
    },

    /** Choisir une image : téléverser ou prendre dans la galerie du projet. -> Promise<id[]|null> */
    pickImages({ multiple = false, title } = {}) {
      return new Promise((res) => {
        const p = GF.store.project;
        const pool = Array.from(new Set([...p.gallery.map((g) => g.id), ...p.art.moodboard,
          ...GF.schemas.ENTITY_ORDER.flatMap((t) => p.entities[t].flatMap((e) => e.images))])).slice(0, 200);
        const selected = new Set();
        let done = false;
        const m = UI.modal({
          title: title || T('Choisir une image', 'Choose an image'), wide: true,
          body: `<div class="row gap"><button class="btn primary" data-up>${UI.icon('upload')} ${T('Téléverser depuis mon ordinateur', 'Upload from my computer')}</button>
            <span class="muted small">${T('ou choisis dans le projet :', 'or pick from the project:')}</span></div>
            <div class="pick-grid">${pool.length ? pool.map((id) => `<button class="pick" data-id="${id}"><img data-img="${id}" alt=""></button>`).join('') : `<p class="muted">${T('Aucune image dans le projet pour l\'instant.', 'No images in the project yet.')}</p>`}</div>`,
          buttons: multiple ? [
            { label: T('Annuler', 'Cancel'), cls: 'ghost' },
            { label: T('Ajouter la sélection', 'Add selection'), cls: 'primary', action: () => { done = true; res(Array.from(selected)); } },
          ] : [],
          onClose: () => { if (!done) res(null); },
        });
        m.root.querySelector('[data-up]').onclick = async () => {
          const files = await U.pickFiles({ multiple });
          if (!files.length) return;
          const ids = await UI.importImages(files);
          done = true; res(ids); m.close();
        };
        m.root.querySelectorAll('.pick').forEach((b) => {
          b.onclick = () => {
            const id = b.dataset.id;
            if (!multiple) { done = true; res([id]); m.close(); return; }
            if (selected.has(id)) { selected.delete(id); b.classList.remove('sel'); } else { selected.add(id); b.classList.add('sel'); }
          };
        });
      });
    },

    /** Choisir une destination puis y associer l'image */
    async attachImage(imageId) {
      const p = GF.store.project;
      const SC = GF.schemas;
      const groups = SC.ENTITY_ORDER.map((t) => {
        const list = p.entities[t];
        if (!list.length) return '';
        return `<optgroup label="${U.esc(L(SC.ENTITIES[t].label))}">${list.map((e) => `<option value="e:${t}:${e.id}">${U.esc(e.fields.name || T('(sans nom)', '(unnamed)'))}</option>`).join('')}</optgroup>`;
      }).join('');
      const ideas = p.ideas.length ? `<optgroup label="${T('Idées', 'Ideas')}">${p.ideas.slice(0, 80).map((i) => `<option value="i:${i.id}">${U.esc(U.truncate(i.title || i.content, 60))}</option>`).join('')}</optgroup>` : '';
      const newOpts = SC.ENTITY_ORDER.map((t) => `<option value="n:${t}">+ ${T('Nouvelle fiche', 'New sheet')} : ${U.esc(L(SC.ENTITIES[t].singular))}</option>`).join('');
      UI.modal({
        title: T('Associer l\'image à…', 'Attach image to…'),
        body: `<div class="attach-prev"><img data-img="${imageId}" alt=""></div>
          <select class="input" id="attTarget">
            <optgroup label="${T('Projet', 'Project')}">
              <option value="mood">${T('Moodboard (direction artistique)', 'Moodboard (art direction)')}</option>
              <option value="cover">${T('Image de couverture du projet', 'Project cover image')}</option>
            </optgroup>
            ${groups}${ideas}
            <optgroup label="${T('Créer', 'Create')}">${newOpts}</optgroup>
          </select>`,
        buttons: [
          { label: T('Annuler', 'Cancel'), cls: 'ghost' },
          { label: T('Associer', 'Attach'), cls: 'primary', action: async (close, root) => {
            const v = root.querySelector('#attTarget').value;
            const [kind, a, b] = v.split(':');
            if (kind === 'mood') { if (!p.art.moodboard.includes(imageId)) p.art.moodboard.push(imageId); }
            else if (kind === 'cover') p.meta.cover = imageId;
            else if (kind === 'e' || kind === 'n') {
              const ent = kind === 'e' ? GF.store.entity(a, b) : GF.store.newEntity(a, { name: T('Nouvelle fiche', 'New sheet') });
              if (!ent.images.includes(imageId)) ent.images.push(imageId);
              if (!ent.cover) ent.cover = imageId;
              ent.updatedAt = Date.now();
              if (kind === 'n') { GF.store.touch(); GF.app.go(`e/${a}/${ent.id}`); }
            } else if (kind === 'i') {
              const idea = p.ideas.find((x) => x.id === a);
              if (idea) { idea.images = idea.images || []; if (!idea.images.includes(imageId)) idea.images.push(imageId); }
            }
            GF.store.touch();
            UI.toast(T('Image associée ✔', 'Image attached ✔'), 'success');
            GF.app.refreshNav();
          } },
        ],
      });
    },
  });

  // Collage global d'images -> gestionnaire de la vue active
  document.addEventListener('paste', (e) => {
    if (!UI._paste) return;
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter((f) => /^image\//.test(f.type));
    if (!files.length) return;
    e.preventDefault();
    UI._paste(files);
  });

  document.addEventListener('input', (e) => {
    if (e.target.matches && e.target.matches('textarea.auto')) {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight + 2, 900) + 'px';
    }
  });
})();
