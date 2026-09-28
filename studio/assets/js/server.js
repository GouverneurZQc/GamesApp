/* DevPortals — lien avec le serveur local : portail joueurs, sauvegardes sur le disque */
(function () {
  const U = DP.util, S = DP.store, SC = DP.schemas;

  async function api(path, { method = 'GET', body, headers } = {}) {
    const res = await fetch(path, { method, body, headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`${T('Serveur local', 'Local server')} (${res.status}) : ${U.truncate(await res.text(), 200)}`);
    const ct = res.headers.get('content-type') || '';
    return ct.includes('json') ? res.json() : res.text();
  }

  const SV = (DP.server = {
    online: false,
    info: null,
    async check() {
      if (location.protocol === 'file:') { SV.online = false; return false; }
      try {
        SV.info = await api('/api/info');
        SV.online = true;
      } catch (e) { SV.online = false; SV.info = null; }
      return SV.online;
    },
    listMedia: () => api('/api/media'),
    uploadMedia: (name, blob) => api(`/api/media?name=${encodeURIComponent(name)}`, { method: 'POST', body: blob, headers: { 'content-type': 'application/octet-stream' } }),
    publishSite: (json) => api('/api/publish', { method: 'POST', body: json, headers: { 'content-type': 'application/json' } }),
    prune: (keep) => api('/api/prune', { method: 'POST', body: keep.join('\n'), headers: { 'content-type': 'text/plain' } }),
    unpublish: () => api('/api/unpublish', { method: 'POST' }),
    backup: (name, json) => api(`/api/backup?name=${encodeURIComponent(name)}`, { method: 'POST', body: json, headers: { 'content-type': 'application/json' } }),
    listBackups: () => api('/api/backups'),
    getBackup: (name) => fetch(`/api/backups/${encodeURIComponent(name)}`, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.statusText); return r.text(); }),
    openFolder: (which) => api(`/api/open-folder?which=${which}`, { method: 'POST' }),
  });

  /* ================= Sauvegarde automatique sur le disque ================= */
  const BK = (DP.backup = {
    last: 0,
    running: false,
    fileName() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${U.slug(S.project.name)}__${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.json`;
    },
    async now({ silent = false } = {}) {
      if (!SV.online || BK.running) return false;
      BK.running = true;
      try {
        await SV.backup(BK.fileName(), await S.projectJSON());
        BK.last = Date.now();
        S.dirtySinceBackup = false;
        S.settings.lastBackup = Date.now();
        await S.saveSettings();
        if (!silent) DP.ui.toast(T('Sauvegarde enregistrée dans le dossier « sauvegardes »', 'Backup saved to the "sauvegardes" folder'), 'success');
        return true;
      } catch (e) {
        if (!silent) DP.ui.toast(e.message, 'error');
        return false;
      } finally { BK.running = false; }
    },
    start() {
      setInterval(() => {
        const st = S.settings;
        if (!st.autoBackup || !SV.online || !S.dirtySinceBackup) return;
        if (Date.now() - BK.last < (st.backupEvery || 10) * 60000) return;
        BK.now({ silent: true });
      }, 30000);
    },
  });

  /* ================= Publication du portail joueurs ================= */
  let webpOK = null;
  function canWebp() {
    if (webpOK === null) {
      try { const c = document.createElement('canvas'); c.width = c.height = 1; webpOK = c.toDataURL('image/webp').startsWith('data:image/webp'); } catch (e) { webpOK = false; }
    }
    return webpOK;
  }

  function build() {
    const p = S.project, po = p.portal, SCE = SC.ENTITIES;
    const media = new Map(); // id -> {big}
    const ref = (id, big = false) => {
      if (!id) return '';
      const prev = media.get(id);
      media.set(id, { big: big || (prev && prev.big) });
      return `@${id}`; // remplacé par le chemin final après conversion
    };
    const isPublic = (type, id) => { const e = S.entity(type, id); return !!(e && e.public && po.sections[type] !== false); };

    const entities = {};
    const types = {};
    for (const t of SC.PORTAL_TYPES) {
      if (po.sections[t] === false) continue;
      const list = p.entities[t].filter((e) => e.public);
      if (!list.length) continue;
      types[t] = { label: L(SCE[t].label), singular: L(SCE[t].singular), icon: SCE[t].icon };
      entities[t] = list.map((e) => ({
        id: e.id,
        name: e.fields.name || T('(sans nom)', '(unnamed)'),
        subtitle: SCE[t].subtitle ? SCE[t].subtitle(e.fields) : '',
        blurb: DP.format.blurb(e),
        image: ref(e.cover || e.images[0]),
        images: e.images.map((i) => ref(i)),
        audio: e.fields.audio ? ref(e.fields.audio) : '',
        tags: e.fields.tags || [],
        groups: DP.format.entityPortal(t, e, isPublic),
        createdAt: e.createdAt, updatedAt: e.updatedAt,
      }));
    }
    const milestones = p.milestones.filter((m) => m.public).map((m) => {
      const tasks = p.tasks.filter((t) => t.milestone === m.id);
      const done = tasks.filter((t) => t.status === 'done').length;
      const progress = m.done ? 100 : tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      return { id: m.id, title: m.title, date: m.date, description: m.description || '', status: m.done || progress === 100 ? 'done' : progress > 0 ? 'active' : 'planned', progress, createdAt: m.createdAt, updatedAt: m.updatedAt || m.createdAt };
    }).sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')));

    const gallery = [
      ...p.gallery.filter((g) => g.public && g.kind !== 'audio').map((g) => ({ src: ref(g.id, true), caption: g.caption || '', createdAt: g.createdAt })),
      ...p.captures.filter((c) => c.public).flatMap((c) => c.images.map((i) => ({ src: ref(i, true), caption: [c.title, c.version].filter(Boolean).join(' — '), createdAt: c.createdAt }))),
    ].sort((a, b) => b.createdAt - a.createdAt);

    const data = {
      app: 'DevPortals', format: 1, generatedAt: Date.now(), lang: po.lang || DP.lang,
      site: {
        title: po.title || p.name, tagline: po.tagline || p.meta.pitch || '', about: po.about || '',
        accent: (SC.ACCENTS[S.settings.accent] || SC.ACCENTS.violet)[0],
        hero: ref(po.hero || p.meta.cover, true), links: (po.links || []).filter((l) => l.url), sections: po.sections, showNew: po.showNew !== false,
        storyTeaser: po.sections.story ? (po.storyTeaser || p.story.logline || '') : '',
      },
      project: { name: p.name, genre: p.meta.genre, platforms: p.meta.platforms, stage: p.meta.stage, releaseDate: p.meta.releaseDate },
      news: po.sections.news === false ? [] : p.devlog.posts.filter((x) => x.public).sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .map((x) => ({ id: x.id, title: x.title, date: x.date, cover: ref(x.cover, true), content: x.content, tags: x.tags || [], createdAt: x.createdAt, updatedAt: x.updatedAt })),
      patches: po.sections.patches === false ? [] : p.devlog.patches.filter((x) => x.public).sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .map((x) => ({ id: x.id, version: x.version, title: x.title, date: x.date, added: U.lines(x.added), changed: U.lines(x.changed), fixed: U.lines(x.fixed), removed: U.lines(x.removed), notes: x.notes || '', createdAt: x.createdAt, updatedAt: x.updatedAt })),
      roadmap: po.sections.roadmap === false ? [] : milestones,
      types, entities,
      maps: po.sections.maps === false ? [] : p.maps.filter((m) => m.public && m.image).map((m) => ({
        id: m.id, name: m.name, description: m.description || '', image: ref(m.image, true),
        markers: m.markers.filter((k) => !k.priv).map((k) => ({ x: k.x, y: k.y, label: k.label, color: k.color, note: k.note || '',
          link: k.ref && isPublic(k.ref.type, k.ref.id) ? { type: k.ref.type, id: k.ref.id, name: S.entityName(k.ref.type, k.ref.id) } : null })),
        createdAt: m.createdAt, updatedAt: m.updatedAt || m.createdAt,
      })),
      gallery: po.sections.gallery === false ? [] : gallery,
      faq: (po.faq || []).filter((f) => f.q),
    };
    return { data, media };
  }

  async function prepareMedia(id, big) {
    const rec = await DP.media.get(id);
    if (!rec) return null;
    if (rec.kind === 'audio' || /^audio\//.test(rec.type)) return { name: `${id}.${DP.media.extOf(rec)}`, rec, audio: true };
    if (rec.type === 'image/gif' || rec.type === 'image/svg+xml') return { name: `${id}.${DP.media.extOf(rec)}`, rec };
    const ext = canWebp() ? 'webp' : 'jpg';
    return { name: `${id}${big ? '-l' : ''}.${ext}`, rec, convert: { max: big ? 2000 : 1400, mime: ext === 'webp' ? 'image/webp' : 'image/jpeg' } };
  }

  const PB = (DP.publisher = {
    busy: false,
    build,
    /** Publie le portail. onProgress(texte) */
    async publish({ onProgress, silent = false } = {}) {
      if (!SV.online) throw new Error(T('Le serveur local n\'est pas lancé. Ouvre DevPortals avec DevPortals.bat (ou lancer.sh).', 'The local server is not running. Open DevPortals with DevPortals.bat (or lancer.sh).'));
      if (PB.busy) return;
      PB.busy = true;
      try {
        const { data, media } = build();
        onProgress && onProgress(T('Préparation des médias…', 'Preparing media…'));
        const existing = new Set(await SV.listMedia());
        const paths = {};
        const keep = [];
        let i = 0, uploaded = 0;
        for (const [id, info] of media) {
          i++;
          const m = await prepareMedia(id, info.big);
          if (!m) continue;
          paths[id] = `data/media/${m.name}`;
          keep.push(m.name);
          if (existing.has(m.name)) continue;
          onProgress && onProgress(T(`Envoi des médias ${i}/${media.size}…`, `Uploading media ${i}/${media.size}…`));
          let blob = m.rec.blob;
          if (m.convert) {
            try { blob = (await U.resizeImage(blob, m.convert.max, m.convert.mime, 0.86)).blob; } catch (e) { /* on envoie l'original */ }
          }
          await SV.uploadMedia(m.name, blob);
          uploaded++;
        }
        const json = JSON.stringify(data).replace(/"@((?:img|aud)_[a-z0-9]+)"/g, (all, id) => JSON.stringify(paths[id] || ''));
        onProgress && onProgress(T('Publication du site…', 'Publishing site…'));
        await SV.publishSite(json);
        await SV.prune(keep);
        S.project.portal.lastPublished = Date.now();
        S.project.portal.dirty = false;
        await S.saveNow();
        if (!silent) DP.ui.toast(T(`Portail publié ✔ (${uploaded} média(s) envoyé(s))`, `Portal published ✔ (${uploaded} media uploaded)`), 'success');
        return { uploaded };
      } finally { PB.busy = false; }
    },
    _auto: U.debounce(async () => {
      const po = S.project && S.project.portal;
      if (!po || !po.autoPublish || !SV.online || !po.lastPublished) return;
      try { await PB.publish({ silent: true }); DP.ui.toast(T('Portail joueurs mis à jour automatiquement', 'Player portal auto-updated')); } catch (e) { console.warn(e); }
    }, 60000),
    onChange() {
      if (S.project && S.project.portal) S.project.portal.dirty = true;
      PB._auto();
    },
  });
})();
