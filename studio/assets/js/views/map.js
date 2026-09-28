/* Vue : cartes du monde avec repères reliés aux fiches */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899', '#e5e5e5', '#171717'];
  const LINK_TYPES = ['locations', 'quests', 'characters', 'vehicles', 'items', 'factions', 'lore'];
  let zoom = 1;
  let adding = false;

  DP.views.map = {
    title: () => T('Cartes du monde', 'World maps'),
    render(el, params) {
      const p = S.project;
      const cur = p.maps.find((m) => m.id === params.id) || p.maps[0];
      if (!cur) {
        el.innerHTML = UI.empty('map', T('Aucune carte pour l\'instant', 'No map yet'),
          T('Importe une image de ta carte (monde, ville, niveau, circuit…) puis place des repères reliés à tes lieux, missions et personnages. Les cartes publiques sont interactives sur le portail joueurs.',
            'Import an image of your map (world, city, level, track…) then place markers linked to your locations, missions and characters. Public maps are interactive on the player portal.'),
          `<button class="btn primary" id="newMap">${UI.icon('upload')} ${T('Créer une carte', 'Create a map')}</button>`);
        el.querySelector('#newMap').onclick = () => createMap();
        return;
      }
      cur.markers = cur.markers || [];
      el.innerHTML = `
        <div class="page-head">
          <div class="row gap wrap">
            <select class="input" id="mapSel" style="width:auto">${p.maps.map((m) => `<option value="${m.id}" ${m.id === cur.id ? 'selected' : ''}>${U.esc(m.name)}</option>`).join('')}</select>
            <button class="btn" id="newMap">${UI.icon('plus')} ${T('Nouvelle carte', 'New map')}</button>
            ${UI.publicToggle(cur.public, 'id="mPub"')}
          </div>
          <div class="row gap wrap">
            <button class="btn ${adding ? 'primary' : ''}" id="addMode">${UI.icon('pin')} ${adding ? T('Clique sur la carte…', 'Click the map…') : T('Ajouter un repère', 'Add a marker')}</button>
            <div class="seg"><button id="zOut">−</button><button id="zReset">${Math.round(zoom * 100)} %</button><button id="zIn">+</button></div>
            <button class="btn icon ghost" id="mEdit" title="${T('Renommer / description / image', 'Rename / description / image')}">${UI.icon('edit')}</button>
            <button class="btn icon ghost" id="mDel" title="${T('Supprimer la carte', 'Delete map')}">${UI.icon('trash')}</button>
          </div>
        </div>
        <div class="ent-layout">
          <div class="map-wrap" id="mapWrap">
            <div class="map-stage ${adding ? 'adding' : ''}" id="stage" style="width:${zoom * 100}%">
              <img data-img="${cur.image}" alt="" draggable="false">
              ${cur.markers.map((k) => markerHTML(k)).join('')}
            </div>
          </div>
          <div class="ent-side">
            <div class="card">
              <h3>${UI.icon('pin')} ${T('Repères', 'Markers')} <span class="muted small">${cur.markers.length}</span></h3>
              ${cur.description ? `<p class="muted small">${U.esc(cur.description)}</p>` : ''}
              <div class="list" id="mkList">${cur.markers.length ? cur.markers.map((k) => `<button class="list-item" data-mk="${k.id}"><span class="dot" style="background:${k.color}"></span>
                <span class="li-body"><strong>${U.esc(k.label || '?')}${k.priv ? ' 🔒' : ''}</strong><small>${k.ref ? U.esc(S.entityName(k.ref.type, k.ref.id)) : T('sans lien', 'no link')}</small></span></button>`).join('')
                : `<p class="muted small">${T('Clique sur « Ajouter un repère » puis sur la carte.', 'Click "Add a marker" then click the map.')}</p>`}</div>
            </div>
            <div class="tip">${UI.icon('info')}<span>${T('Glisse un repère pour le déplacer. Clique dessus pour le modifier, le relier à une fiche ou le rendre privé.', 'Drag a marker to move it. Click it to edit, link it to a sheet or make it private.')}</span></div>
          </div>
        </div>`;

      const touch = () => { cur.updatedAt = Date.now(); S.touch(); };
      el.querySelector('#mapSel').onchange = (e) => DP.app.go(`map/${e.target.value}`);
      el.querySelector('#newMap').onclick = () => createMap();
      el.querySelector('#mPub').onclick = () => { cur.public = !cur.public; touch(); DP.app.route(); };
      el.querySelector('#addMode').onclick = () => { adding = !adding; DP.app.route(); };
      el.querySelector('#zIn').onclick = () => { zoom = Math.min(4, zoom + 0.25); DP.app.route(); };
      el.querySelector('#zOut').onclick = () => { zoom = Math.max(0.5, zoom - 0.25); DP.app.route(); };
      el.querySelector('#zReset').onclick = () => { zoom = 1; DP.app.route(); };
      el.querySelector('#mDel').onclick = async () => {
        if (!(await UI.confirm(T(`Supprimer la carte « ${cur.name} » ? (restaurable depuis la corbeille)`, `Delete map "${cur.name}"? (restorable from trash)`), { danger: true }))) return;
        S.trash('map', cur);
        p.maps = p.maps.filter((m) => m.id !== cur.id); S.touch(); DP.app.refreshNav(); DP.app.go('map');
      };
      el.querySelector('#mEdit').onclick = () => editMap(cur);

      const stage = el.querySelector('#stage');
      stage.addEventListener('click', (e) => {
        if (!adding || e.target.closest('.marker')) return;
        const r = stage.getBoundingClientRect();
        const k = { id: U.uid('mk_'), x: +(((e.clientX - r.left) / r.width) * 100).toFixed(2), y: +(((e.clientY - r.top) / r.height) * 100).toFixed(2), label: T('Nouveau repère', 'New marker'), color: COLORS[0], note: '', ref: null, priv: false };
        cur.markers.push(k); adding = false; touch();
        DP.app.route().then(() => editMarker(cur, k));
      });

      // Glisser-déposer des repères
      stage.querySelectorAll('.marker').forEach((mEl) => {
        mEl.addEventListener('pointerdown', (ev) => {
          ev.preventDefault();
          const k = cur.markers.find((m) => m.id === mEl.dataset.id);
          const r = stage.getBoundingClientRect();
          const sx = ev.clientX, sy = ev.clientY;
          let moved = false;
          mEl.setPointerCapture(ev.pointerId);
          const move = (e2) => {
            if (Math.abs(e2.clientX - sx) + Math.abs(e2.clientY - sy) > 4) moved = true;
            if (!moved) return;
            mEl.classList.add('dragging');
            k.x = Math.max(0, Math.min(100, ((e2.clientX - r.left) / r.width) * 100));
            k.y = Math.max(0, Math.min(100, ((e2.clientY - r.top) / r.height) * 100));
            mEl.style.left = `${k.x}%`; mEl.style.top = `${k.y}%`;
          };
          const up = () => {
            mEl.removeEventListener('pointermove', move); mEl.removeEventListener('pointerup', up);
            mEl.classList.remove('dragging');
            if (moved) { k.x = +k.x.toFixed(2); k.y = +k.y.toFixed(2); touch(); } else editMarker(cur, k);
          };
          mEl.addEventListener('pointermove', move);
          mEl.addEventListener('pointerup', up);
        });
      });
      el.querySelectorAll('[data-mk]').forEach((b) => {
        b.onclick = () => {
          const mEl = stage.querySelector(`.marker[data-id="${b.dataset.mk}"]`);
          stage.querySelectorAll('.marker').forEach((x) => x.classList.toggle('sel', x === mEl));
          if (mEl) mEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          editMarker(cur, cur.markers.find((m) => m.id === b.dataset.mk));
        };
      });
    },
  };

  function markerHTML(k) {
    return `<div class="marker" data-id="${k.id}" style="left:${k.x}%;top:${k.y}%"><span class="pinhead" style="background:${k.color}"></span><span class="mlabel">${U.esc(k.label || '')}${k.priv ? ' 🔒' : ''}</span></div>`;
  }

  async function createMap() {
    const files = await U.pickFiles({ multiple: false });
    if (!files[0]) return;
    const [img] = await UI.importFiles(files);
    if (!img) return;
    const name = (await UI.ask(T('Nom de la carte', 'Map name'), { value: T('Carte du monde', 'World map') })) || T('Carte', 'Map');
    const m = { id: U.uid('map_'), name, description: '', image: img, markers: [], public: false, createdAt: Date.now(), updatedAt: Date.now() };
    S.project.maps.push(m); S.touch(); DP.app.refreshNav();
    DP.app.go(`map/${m.id}`);
  }

  function editMap(m) {
    UI.modal({
      title: T('Modifier la carte', 'Edit map'),
      body: `<label class="lbl">${T('Nom', 'Name')}</label><input class="input" id="mName" value="${U.esc(m.name)}">
        <label class="lbl">${T('Description (visible sur le portail)', 'Description (visible on the portal)')}</label><textarea class="input" id="mDesc" rows="3">${U.esc(m.description || '')}</textarea>
        <button class="btn" id="mImg">${UI.icon('image')} ${T('Remplacer l\'image (les repères sont conservés)', 'Replace image (markers are kept)')}</button>`,
      onOpen: (root) => {
        root.querySelector('#mImg').onclick = async () => {
          const ids = await UI.pickImages({ title: T('Nouvelle image de carte', 'New map image') });
          if (ids && ids[0]) { m.image = ids[0]; S.touch(); UI.toast(T('Image remplacée', 'Image replaced'), 'success'); }
        };
      },
      buttons: [
        { label: T('Annuler', 'Cancel'), cls: 'ghost' },
        { label: T('Enregistrer', 'Save'), cls: 'primary', action: (c, root) => { m.name = root.querySelector('#mName').value.trim() || m.name; m.description = root.querySelector('#mDesc').value; m.updatedAt = Date.now(); S.touch(); DP.app.route(); } },
      ],
    });
  }

  function editMarker(m, k) {
    if (!k) return;
    const opts = LINK_TYPES.map((t) => {
      const list = S.entities(t);
      if (!list.length) return '';
      return `<optgroup label="${U.esc(L(SC.ENTITIES[t].label))}">${list.map((e) => `<option value="${t}:${e.id}" ${k.ref && k.ref.id === e.id ? 'selected' : ''}>${U.esc(e.fields.name || '?')}</option>`).join('')}</optgroup>`;
    }).join('');
    let color = k.color;
    UI.modal({
      title: T('Repère', 'Marker'),
      body: `<label class="lbl">${T('Nom', 'Label')}</label><input class="input" id="kLabel" value="${U.esc(k.label || '')}">
        <label class="lbl">${T('Relié à une fiche', 'Linked sheet')}</label><select class="input" id="kRef"><option value="">— ${T('aucune', 'none')} —</option>${opts}</select>
        <label class="lbl">${T('Note', 'Note')}</label><textarea class="input" id="kNote" rows="2">${U.esc(k.note || '')}</textarea>
        <label class="lbl">${T('Couleur', 'Color')}</label><div class="accent-pick" id="kColors">${COLORS.map((c) => `<button data-c="${c}" class="${c === color ? 'on' : ''}" style="background:${c}"></button>`).join('')}</div>
        <label class="check"><input type="checkbox" id="kPriv" ${k.priv ? 'checked' : ''}> 🔒 ${T('Repère privé (caché sur le portail : secret, spoiler)', 'Private marker (hidden on the portal: secret, spoiler)')}</label>`,
      onOpen: (root) => root.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { color = b.dataset.c; root.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b)); }; }),
      buttons: [
        { label: `${UI.icon('trash')} ${T('Supprimer', 'Delete')}`, cls: 'ghost danger-text', action: () => { m.markers = m.markers.filter((x) => x.id !== k.id); S.touch(); DP.app.route(); } },
        { label: T('Enregistrer', 'Save'), cls: 'primary', action: (c, root) => {
          k.label = root.querySelector('#kLabel').value.trim();
          const r = root.querySelector('#kRef').value;
          k.ref = r ? { type: r.split(':')[0], id: r.split(':')[1] } : null;
          if (k.ref && (!k.label || k.label === T('Nouveau repère', 'New marker'))) k.label = S.entityName(k.ref.type, k.ref.id);
          k.note = root.querySelector('#kNote').value;
          k.color = color;
          k.priv = root.querySelector('#kPriv').checked;
          m.updatedAt = Date.now(); S.touch(); DP.app.route();
        } },
      ],
    });
  }
})();
