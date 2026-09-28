/* DevPortals — lien avec le serveur : état, portail du jeu (soumission à la validation), versions */
(function () {
  const U = DP.util, S = DP.store, SC = DP.schemas, API = DP.api;

  const SV = (DP.server = {
    online: true,
    info: null,
    async check() {
      try {
        SV.info = await API('/api/info');
        SV.online = true;
      } catch (e) { SV.online = false; }
      return SV.online;
    },
    portal: (pid) => API(`/api/portals/${pid}`),
    myPortals: () => API('/api/portals/mine'),
    preparePortal: (pid, title) => API(`/api/portals/${pid}/prepare`, { method: 'POST', body: { title } }),
    uploadPortalFile: (pid, name, blob) => API(`/api/portals/${pid}/files?name=${encodeURIComponent(name)}`, { method: 'POST', body: blob, headers: { 'Content-Type': 'application/octet-stream' } }),
    submitPortal: (pid, json) => API(`/api/portals/${pid}/submit`, { method: 'POST', body: json, headers: { 'Content-Type': 'application/json' } }),
    cancelPortal: (pid) => API(`/api/portals/${pid}/cancel`, { method: 'POST', body: {} }),
    unpublishPortal: (pid) => API(`/api/portals/${pid}/unpublish`, { method: 'POST', body: {} }),
    versions: (pid) => API(`/api/projects/${pid}/versions`),
    restoreVersion: (pid, name) => API(`/api/projects/${pid}/versions/${encodeURIComponent(name)}/restore`, { method: 'POST', body: {} }),
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
      catalog: { genres: po.catalog.genres || [], styles: po.catalog.styles || [], modes: po.catalog.modes || [], platforms: po.catalog.platforms || [], tags: po.catalog.tags || [] },
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
    /** Envoie le portail du jeu : publié directement (admin) ou soumis à la validation. onProgress(texte) */
    async publish({ onProgress } = {}) {
      if (PB.busy) return null;
      PB.busy = true;
      try {
        await S.saveNow();
        const p = S.project;
        const { data, media } = build();
        onProgress && onProgress(T('Préparation des médias…', 'Preparing media…'));
        const prep = await SV.preparePortal(p.id, data.site.title || p.name);
        const existing = new Set(prep.files);
        const paths = {};
        let i = 0, uploaded = 0;
        for (const [id, info] of media) {
          i++;
          const m = await prepareMedia(id, info.big);
          if (!m) continue;
          paths[id] = `data/media/${m.name}`;
          if (existing.has(m.name)) continue;
          onProgress && onProgress(T(`Envoi des médias ${i}/${media.size}…`, `Uploading media ${i}/${media.size}…`));
          let blob = m.rec.blob;
          if (m.convert) {
            try { blob = (await U.resizeImage(blob, m.convert.max, m.convert.mime, 0.86)).blob; } catch (e) { /* on envoie l'original */ }
          }
          await SV.uploadPortalFile(p.id, m.name, blob);
          uploaded++;
        }
        const json = JSON.stringify(data).replace(/"@((?:img|aud)_[a-z0-9]+)"/g, (all, id) => JSON.stringify(paths[id] || ''));
        onProgress && onProgress(T('Envoi du portail…', 'Sending portal…'));
        const res = await SV.submitPortal(p.id, json);
        p.portal.lastPublished = Date.now();
        p.portal.dirty = false;
        S.touch();
        p.portal.dirty = false;
        await S.saveNow();
        return { ...res, uploaded };
      } finally { PB.busy = false; }
    },
    onChange() {
      if (S.project && S.project.portal) S.project.portal.dirty = true;
    },
  });
})();
