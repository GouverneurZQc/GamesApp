/* DevPortals — état, projets (stockés dans le compte sur le serveur), corbeille, import/export */
(function () {
  const U = DP.util, API = DP.api, SC = DP.schemas;

  const DEFAULT_SETTINGS = {
    lang: 'fr',
    accent: 'violet',
    currentProject: null,
    navCollapsed: {},
    legacyChecked: false, // anciennes données du navigateur déjà proposées à l'import
  };
  const LANG_KEY = 'dp_lang';
  const getLang = () => { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } };
  const setLang = (l) => { try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignore */ } };

  function deepDefaults(target, defs) {
    for (const k of Object.keys(defs)) {
      if (target[k] === undefined || target[k] === null) target[k] = U.clone(defs[k]);
      else if (typeof defs[k] === 'object' && !Array.isArray(defs[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) {
        deepDefaults(target[k], defs[k]);
      }
    }
    return target;
  }

  function blankProject(name) {
    const now = Date.now();
    return {
      id: U.uid('prj_'),
      name: name || T('Mon jeu', 'My game'),
      createdAt: now,
      updatedAt: now,
      version: 2,
      meta: { pitch: '', genre: '', platforms: '', engine: '', audience: '', team: '', cover: '', stage: 'concept', startDate: '', releaseDate: '' },
      gdd: { sections: SC.GDD.map((d) => ({ id: U.uid('sec_'), key: d.key, title: '', content: '' })) },
      ideas: [],
      story: { logline: '', synopsis: '', themes: '', tone: '', setting: '', conflict: '', ending: '', chapters: [] },
      entities: Object.fromEntries(SC.ENTITY_ORDER.map((k) => [k, []])),
      maps: [],
      art: {
        styleName: '', summary: '', keywords: [], references: '', palette: [],
        lighting: '', shapes: '', materials: '', camera: '', ui: '', typography: '', dos: '', donts: '', moodboard: [],
      },
      gallery: [],
      captures: [],
      tasks: [],
      milestones: [],
      devlog: { posts: [], patches: [] },
      portal: {
        title: '', tagline: '', about: '', hero: '', lang: 'fr', links: [], faq: [],
        sections: { news: true, patches: true, roadmap: true, gallery: true, maps: true, story: false, ...Object.fromEntries(SC.PORTAL_TYPES.map((t) => [t, true])) },
        showNew: true, lastPublished: 0, storyTeaser: '',
        catalog: { genres: [], styles: [], tags: [] },
      },
      checklists: {},
      trash: [],
    };
  }

  function normalize(p) {
    const base = blankProject(p.name);
    delete base.id; delete base.createdAt;
    base.gdd = { sections: [] };
    deepDefaults(p, base);
    if (!p.gdd.sections.length) p.gdd.sections = blankProject().gdd.sections;
    for (const k of SC.ENTITY_ORDER) if (!Array.isArray(p.entities[k])) p.entities[k] = [];
    p.ideas.forEach((i) => { i.notes = i.notes || []; i.scores = i.scores || {}; i.images = i.images || []; });
    p.tasks.forEach((t) => { if (!t.status) t.status = 'todo'; });
    delete p.portal.autoPublish;
    return p;
  }

  let saving = null, again = false, rev = 0;

  const S = (DP.store = {
    settings: U.clone(DEFAULT_SETTINGS),
    user: null,
    project: null,
    list: [],
    saveState: 'saved',

    async init(user) {
      S.user = user;
      S.settings = deepDefaults(U.clone(user.settings || {}), DEFAULT_SETTINGS);
      // Français par défaut ; la langue choisie est gardée sur cet appareil (partagée avec le catalogue)
      S.settings.lang = DP.lang = getLang() === 'en' ? 'en' : 'fr';
      await S.refreshList();
      const wanted = new URLSearchParams(location.search).get('projet');
      let id = wanted && S.list.find((x) => x.id === wanted) ? wanted : S.settings.currentProject;
      if (wanted) history.replaceState(null, '', location.pathname + location.hash);
      if (!id || !S.list.find((x) => x.id === id)) id = S.list[0] && S.list[0].id;
      if (id) await S.open(id);
      else await S.create(T('Mon jeu', 'My game'));
    },

    async refreshList() {
      S.list = await API('/api/projects');
      return S.list;
    },

    _saveSettings: U.debounce(() => API('/api/me/settings', { method: 'PUT', body: S.settings }).catch((e) => console.warn(e)), 400),
    async saveSettings() {
      DP.lang = S.settings.lang;
      setLang(S.settings.lang);
      S._saveSettings();
    },

    async create(name, template) {
      if (S.project) await S.saveNow();
      const p = blankProject(name);
      if (template && template.apply) template.apply(p);
      await API(`/api/projects/${p.id}`, { method: 'PUT', body: p });
      S.project = p;
      S.settings.currentProject = p.id;
      await S.saveSettings();
      await S.refreshList();
      return p;
    },

    async open(id, { skipSave = false } = {}) {
      if (!skipSave && S.project && S.project.id !== id) await S.saveNow();
      const p = await API(`/api/projects/${encodeURIComponent(id)}`);
      S.project = normalize(p);
      S.settings.currentProject = id;
      await S.saveSettings();
      DP.media.listByProject(id).catch(() => {}); // noms et tailles des médias
      return S.project;
    },

    /** Recharge le projet depuis le serveur (après une restauration) */
    async reload() {
      rev++;
      await S.open(S.project.id, { skipSave: true });
      S.setSaveState('saved');
    },

    async remove(id) {
      await API(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await S.refreshList();
      if (S.project && S.project.id === id) {
        S.project = null;
        if (S.list.length) await S.open(S.list[0].id);
        else await S.create(T('Mon jeu', 'My game'));
      }
    },

    async rename(id, name) {
      if (S.project && S.project.id === id) { S.project.name = name; S.touch(); await S.saveNow(); return; }
      const p = await API(`/api/projects/${encodeURIComponent(id)}`);
      p.name = name;
      await API(`/api/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: p });
      await S.refreshList();
    },

    /** Marque le projet comme modifié et planifie la sauvegarde */
    touch() {
      if (!S.project) return;
      S.project.updatedAt = Date.now();
      rev++;
      S.setSaveState('saving');
      S._saveDebounced();
      if (DP.publisher) DP.publisher.onChange();
    },

    /** Enregistre le projet sur le serveur (les appels se suivent, jamais en parallèle) */
    async saveNow() {
      if (!S.project) return;
      if (saving) { again = true; return saving; }
      const p = S.project, myRev = rev;
      saving = (async () => {
        try {
          await API(`/api/projects/${p.id}`, { method: 'PUT', body: p });
          if (rev === myRev || S.project !== p) S.setSaveState('saved');
          const it = S.list.find((x) => x.id === p.id);
          if (it) { it.name = p.name; it.updatedAt = p.updatedAt; }
        } catch (e) {
          console.error(e);
          S.setSaveState('error');
          DP.ui && DP.ui.toast(T('Erreur de sauvegarde : ', 'Save error: ') + e.message, 'error');
          if (S.project === p) setTimeout(() => { if (S.saveState === 'error') S._saveDebounced(); }, 15000);
        } finally { saving = null; }
      })();
      await saving;
      if (again) { again = false; return S.saveNow(); }
    },

    setSaveState(st) {
      S.saveState = st;
      const el = document.getElementById('saveState');
      if (el) {
        el.dataset.state = st;
        el.textContent = st === 'saving' ? T('Enregistrement…', 'Saving…') : st === 'error' ? T('Non enregistré', 'Not saved') : T('Enregistré', 'Saved');
      }
    },

    /* ---------- Helpers de données ---------- */
    entities(type) { return (S.project && S.project.entities[type]) || []; },
    entity(type, id) { return S.entities(type).find((e) => e.id === id); },
    entityName(type, id) {
      const e = S.entity(type, id);
      return e ? (e.fields.name || T('(sans nom)', '(unnamed)')) : '';
    },
    newEntity(type, fields = {}) {
      const e = { id: U.uid(type.slice(0, 3) + '_'), fields: { name: '', ...fields }, images: [], cover: '', public: false, publicText: '', createdAt: Date.now(), updatedAt: Date.now() };
      S.project.entities[type].unshift(e);
      S.touch();
      return e;
    },
    chapters() { return (S.project && S.project.story.chapters) || []; },
    chapterLabel(id) {
      const chs = S.chapters();
      const i = chs.findIndex((c) => c.id === id);
      return i < 0 ? '' : `${T('Ch.', 'Ch.')} ${i + 1} — ${chs[i].title || T('Sans titre', 'Untitled')}`;
    },
    addToGallery(mediaId, info = {}) {
      if (S.project.gallery.some((g) => g.id === mediaId)) return;
      S.project.gallery.unshift({ id: mediaId, caption: '', tags: [], public: false, createdAt: Date.now(), ...info });
      S.touch();
    },
    /** Toutes les références d'un média dans le projet */
    mediaUsed(id) {
      const p = S.project;
      if (p.meta.cover === id || p.portal.hero === id || p.art.moodboard.includes(id)) return true;
      if (p.ideas.some((i) => (i.images || []).includes(id))) return true;
      if (p.captures.some((c) => c.images.includes(id))) return true;
      if (p.maps.some((m) => m.image === id)) return true;
      if (p.devlog.posts.some((x) => x.cover === id || (x.images || []).includes(id))) return true;
      return SC.ENTITY_ORDER.some((t) => p.entities[t].some((e) => e.images.includes(id) || e.fields.audio === id));
    },

    /* ---------- Corbeille ---------- */
    trash(kind, item, extra = {}) {
      S.project.trash.unshift({ id: U.uid('tr_'), kind, item: U.clone(item), deletedAt: Date.now(), ...extra });
      S.project.trash = S.project.trash.slice(0, 200);
      S.touch();
    },
    restore(trId) {
      const p = S.project;
      const tr = p.trash.find((x) => x.id === trId);
      if (!tr) return false;
      const it = tr.item;
      switch (tr.kind) {
        case 'entity': (p.entities[tr.type] = p.entities[tr.type] || []).unshift(it); break;
        case 'idea': p.ideas.unshift(it); break;
        case 'chapter': p.story.chapters.push(it); break;
        case 'task': p.tasks.push(it); break;
        case 'milestone': p.milestones.push(it); break;
        case 'post': p.devlog.posts.unshift(it); break;
        case 'patch': p.devlog.patches.unshift(it); break;
        case 'capture': p.captures.unshift(it); break;
        case 'map': p.maps.push(it); break;
        case 'section': p.gdd.sections.push(it); break;
        default: return false;
      }
      p.trash = p.trash.filter((x) => x.id !== trId);
      S.touch();
      return true;
    },
    trashLabel(tr) {
      const it = tr.item;
      const kinds = {
        entity: () => `${L(SC.ENTITIES[tr.type].singular)} : ${it.fields.name || '?'}`,
        idea: () => `${T('Idée', 'Idea')} : ${it.title || U.truncate(it.content, 50)}`,
        chapter: () => `${T('Chapitre', 'Chapter')} : ${it.title}`,
        task: () => `${T('Tâche', 'Task')} : ${it.title}`,
        milestone: () => `${T('Jalon', 'Milestone')} : ${it.title}`,
        post: () => `${T('Article', 'Post')} : ${it.title}`,
        patch: () => `${T('Version', 'Version')} : ${it.version} ${it.title || ''}`,
        capture: () => `${T('Capture', 'Capture')} : ${it.title}`,
        map: () => `${T('Carte', 'Map')} : ${it.name}`,
        section: () => `${T('Section GDD', 'GDD section')} : ${it.title || it.key}`,
      };
      return (kinds[tr.kind] || (() => tr.kind))();
    },

    /* ---------- Import / export ---------- */
    async exportProjectData(p) {
      const med = await DP.media.listByProject(p.id);
      const media = [];
      for (const m of med) {
        const rec = await DP.media.get(m.id);
        if (rec) media.push({ id: m.id, name: m.name, type: rec.type, kind: m.kind, w: m.w, h: m.h, dataURL: await U.blobToDataURL(rec.blob) });
      }
      return { format: 'devportals-project', version: 2, exportedAt: Date.now(), project: p, media };
    },

    async projectJSON() {
      await S.saveNow();
      return JSON.stringify(await S.exportProjectData(S.project));
    },

    async exportProject() {
      U.download(`${U.slug(S.project.name)}-devportals.json`, await S.projectJSON(), 'application/json');
    },

    async exportAll() {
      await S.saveNow();
      const projects = [];
      for (const it of S.list) {
        const p = it.id === S.project.id ? S.project : await API(`/api/projects/${encodeURIComponent(it.id)}`);
        projects.push(await S.exportProjectData(p));
      }
      U.download(`devportals-sauvegarde-${U.today()}.json`, JSON.stringify({ format: 'devportals-backup', version: 2, exportedAt: Date.now(), projects }), 'application/json');
    },

    async importText(txt) {
      let data;
      try { data = JSON.parse(txt); } catch (e) { throw new Error(T('Fichier JSON invalide.', 'Invalid JSON file.')); }
      const packs = /-backup$/.test(data.format || '') ? data.projects : /-project$/.test(data.format || '') ? [data] : null;
      if (!packs) throw new Error(T("Ce fichier n'est pas une sauvegarde DevPortals.", 'This file is not a DevPortals backup.'));
      let lastId = null;
      for (const pack of packs) lastId = await importPack(pack);
      await S.refreshList();
      if (lastId) await S.open(lastId);
      return packs.length;
    },
    async importFile(file) { return S.importText(await U.readText(file)); },

    /** Importe dans le compte des projets de l'ancienne version (stockés dans ce navigateur) */
    async importLegacy(projects, onProgress) {
      let lastId = null, i = 0;
      for (const p of projects) {
        onProgress && onProgress(++i, projects.length, p.name);
        const media = (await DP.legacy.media(p.id)).map((m) => ({ id: m.id, name: m.name, type: m.type, kind: m.kind, w: m.w, h: m.h, blob: m.blob }));
        lastId = await importPack({ project: p, media });
      }
      await S.refreshList();
      if (lastId) await S.open(lastId);
      return projects.length;
    },
  });

  S._saveDebounced = U.debounce(() => S.saveNow(), 500);

  async function importPack(pack) {
    const mediaList = pack.media || pack.images || []; // compatibilité GameForge
    let json = JSON.stringify(pack.project);
    const newPid = U.uid('prj_');
    json = json.split(JSON.stringify(pack.project.id)).join(JSON.stringify(newPid));
    const idMap = {};
    for (const m of mediaList) {
      const nid = U.uid(/^aud_/.test(m.id) ? 'aud_' : 'img_');
      idMap[m.id] = nid;
      json = json.split(`"${m.id}"`).join(`"${nid}"`);
    }
    const raw = JSON.parse(json);
    // ancien format GameForge : critiques -> captures, chats ignorés
    if (Array.isArray(raw.critiques) && !raw.captures) {
      raw.captures = raw.critiques.map((c) => ({ id: c.id, title: c.title, version: '', date: '', images: c.images || [], status: 'review',
        notes: (c.thread || []).filter((m) => m.role === 'assistant').map((m) => m.content).join('\n\n---\n\n'), scores: {}, public: false, createdAt: c.createdAt || Date.now() }));
    }
    delete raw.critiques; delete raw.chats;
    (raw.ideas || []).forEach((i) => {
      if (i.thread && i.thread.length && !i.notes) i.notes = i.thread.filter((m) => m.role === 'assistant').map((m) => ({ id: U.uid('n_'), text: m.content, ts: m.ts || Date.now() }));
      delete i.thread;
    });
    const p = normalize(raw);
    p.id = newPid;
    if (S.list.some((x) => x.name === p.name)) p.name += T(' (importé)', ' (imported)');
    for (const m of mediaList) {
      let blob = m.blob || U.dataURLToBlob(m.dataURL);
      if (m.type && blob.type !== m.type) blob = new Blob([blob], { type: m.type });
      try {
        await DP.media.upload(idMap[m.id], blob, { name: m.name, projectId: newPid, w: m.w, h: m.h });
      } catch (e) { console.warn('média ignoré', m.name, e); }
    }
    p.createdAt = p.createdAt || Date.now();
    p.updatedAt = Date.now();
    await API(`/api/projects/${newPid}`, { method: 'PUT', body: p });
    return newPid;
  }

  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S.saveState !== 'saved') S.saveNow(); });
  window.addEventListener('beforeunload', (e) => {
    if (S.saveState === 'saved') return;
    S.saveNow();
    e.preventDefault();
    e.returnValue = '';
  });
})();
