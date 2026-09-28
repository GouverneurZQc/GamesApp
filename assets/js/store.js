/* GameForge Studio — état de l'application, projets, sauvegarde, import/export */
(function () {
  const U = GF.util, DB = GF.db, SC = GF.schemas;

  const DEFAULT_SETTINGS = {
    lang: 'fr',
    theme: 'dark',
    textProvider: 'anthropic',
    visionProvider: 'anthropic',
    imageProvider: 'pollinations',
    providers: {},
    agent: {
      frankness: 'frank', // gentle | frank | brutal
      length: 'normal', // short | normal | long
      autoReact: true, // l'agent réagit automatiquement aux nouvelles idées
      includeContext: true,
      effort: 'medium', // Claude : low | medium | high | xhigh | max
      fallback: true, // Claude : repli serveur en cas de refus
      optimizePrompts: true, // réécrit les prompts d'images avec l'IA
    },
    currentProject: null,
    lastBackup: 0,
  };

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
      version: 1,
      meta: { pitch: '', genre: '', platforms: '', engine: '', audience: '', team: '', cover: '' },
      gdd: { sections: SC.GDD.map((d) => ({ id: U.uid('sec_'), key: d.key, title: '', content: '' })) },
      ideas: [],
      story: { logline: '', synopsis: '', themes: '', tone: '', setting: '', conflict: '', ending: '', chapters: [] },
      entities: Object.fromEntries(SC.ENTITY_ORDER.map((k) => [k, []])),
      art: {
        styleName: '', summary: '', keywords: [], references: '', palette: [],
        lighting: '', shapes: '', materials: '', camera: '', ui: '', typography: '',
        dos: '', donts: '', stylePrompt: '', applyStyle: true, moodboard: [],
      },
      critiques: [],
      gallery: [],
      chats: [],
      tasks: [],
    };
  }

  function normalize(p) {
    const base = blankProject(p.name);
    delete base.id; delete base.createdAt;
    base.gdd = { sections: [] };
    deepDefaults(p, base);
    if (!p.gdd.sections.length) p.gdd.sections = blankProject().gdd.sections;
    for (const k of SC.ENTITY_ORDER) if (!Array.isArray(p.entities[k])) p.entities[k] = [];
    return p;
  }

  const S = (GF.store = {
    settings: U.clone(DEFAULT_SETTINGS),
    project: null,
    list: [],
    saveState: 'saved',

    async init() {
      await DB.open();
      const saved = await DB.get('kv', 'settings');
      // Français par défaut ; l'anglais se choisit dans la barre latérale ou les paramètres
      if (saved) S.settings = deepDefaults(saved, DEFAULT_SETTINGS);
      GF.lang = S.settings.lang;
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
      await S.refreshList();
      let id = S.settings.currentProject;
      if (!id || !S.list.find((x) => x.id === id)) id = S.list[0] && S.list[0].id;
      if (id) await S.open(id);
      else await S.create(T('Mon jeu', 'My game'));
    },

    async refreshList() {
      const all = await DB.all('projects');
      S.list = all.map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, cover: p.meta && p.meta.cover }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      return S.list;
    },

    async saveSettings() {
      await DB.put('kv', S.settings, 'settings');
    },

    async create(name) {
      if (S.project) await S.saveNow();
      const p = blankProject(name);
      await DB.put('projects', p);
      S.project = p;
      S.settings.currentProject = p.id;
      await S.saveSettings();
      await S.refreshList();
      return p;
    },

    async open(id) {
      if (S.project && S.project.id !== id) await S.saveNow();
      const p = await DB.get('projects', id);
      if (!p) throw new Error('Project not found');
      S.project = normalize(p);
      S.settings.currentProject = id;
      await S.saveSettings();
      return S.project;
    },

    async remove(id) {
      const imgs = await GF.images.listByProject(id);
      for (const im of imgs) await GF.images.remove(im.id);
      await DB.del('projects', id);
      await S.refreshList();
      if (S.project && S.project.id === id) {
        S.project = null;
        if (S.list.length) await S.open(S.list[0].id);
        else await S.create(T('Mon jeu', 'My game'));
      }
    },

    /** Marque le projet comme modifié et planifie la sauvegarde */
    touch() {
      if (!S.project) return;
      S.project.updatedAt = Date.now();
      S.setSaveState('saving');
      S._saveDebounced();
    },

    async saveNow() {
      if (!S.project) return;
      try {
        await DB.put('projects', S.project);
        S.setSaveState('saved');
        const it = S.list.find((x) => x.id === S.project.id);
        if (it) { it.name = S.project.name; it.updatedAt = S.project.updatedAt; it.cover = S.project.meta.cover; }
      } catch (e) {
        console.error(e);
        S.setSaveState('error');
        GF.ui && GF.ui.toast(T('Erreur de sauvegarde : ', 'Save error: ') + e.message, 'error');
      }
    },

    setSaveState(st) {
      S.saveState = st;
      const el = document.getElementById('saveState');
      if (el) {
        el.dataset.state = st;
        el.textContent = st === 'saving' ? T('Enregistrement…', 'Saving…') : st === 'error' ? T('Erreur', 'Error') : T('Enregistré', 'Saved');
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
      const e = { id: U.uid(type.slice(0, 3) + '_'), fields: { name: '', ...fields }, images: [], cover: '', createdAt: Date.now(), updatedAt: Date.now() };
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
    addToGallery(imageId, info = {}) {
      S.project.gallery.unshift({ id: imageId, createdAt: Date.now(), ...info });
      S.touch();
    },

    /* ---------- Import / export ---------- */
    async exportProjectData(p) {
      const imgs = await GF.images.listByProject(p.id);
      const images = [];
      for (const im of imgs) {
        images.push({ id: im.id, name: im.name, type: im.type, w: im.w, h: im.h, dataURL: await U.blobToDataURL(im.blob) });
      }
      return { format: 'gameforge-project', version: 1, exportedAt: Date.now(), project: p, images };
    },

    async exportProject() {
      await S.saveNow();
      const data = await S.exportProjectData(S.project);
      U.download(`${U.slug(S.project.name)}-gameforge.json`, JSON.stringify(data), 'application/json');
      S.settings.lastBackup = Date.now();
      await S.saveSettings();
    },

    async exportAll() {
      await S.saveNow();
      const all = await DB.all('projects');
      const projects = [];
      for (const p of all) projects.push(await S.exportProjectData(p));
      U.download(`gameforge-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify({ format: 'gameforge-backup', version: 1, exportedAt: Date.now(), projects }), 'application/json');
      S.settings.lastBackup = Date.now();
      await S.saveSettings();
    },

    async importFile(file) {
      const txt = await U.readText(file);
      let data;
      try { data = JSON.parse(txt); } catch (e) { throw new Error(T('Fichier JSON invalide.', 'Invalid JSON file.')); }
      const packs = data.format === 'gameforge-backup' ? data.projects : data.format === 'gameforge-project' ? [data] : null;
      if (!packs) throw new Error(T("Ce fichier n'est pas une sauvegarde GameForge.", 'This file is not a GameForge backup.'));
      let lastId = null;
      for (const pack of packs) lastId = await importPack(pack);
      await S.refreshList();
      if (lastId) await S.open(lastId);
      return packs.length;
    },
  });

  S._saveDebounced = U.debounce(() => S.saveNow(), 500);

  async function importPack(pack) {
    let json = JSON.stringify(pack.project);
    const newPid = U.uid('prj_');
    json = json.split(JSON.stringify(pack.project.id)).join(JSON.stringify(newPid));
    const idMap = {};
    for (const im of pack.images || []) {
      const nid = U.uid('img_');
      idMap[im.id] = nid;
      json = json.split(`"${im.id}"`).join(`"${nid}"`);
    }
    const p = normalize(JSON.parse(json));
    p.id = newPid;
    if ((await DB.all('projects')).some((x) => x.name === p.name)) p.name += T(' (importé)', ' (imported)');
    for (const im of pack.images || []) {
      const blob = U.dataURLToBlob(im.dataURL);
      await DB.put('images', { id: idMap[im.id], blob, type: im.type || blob.type, w: im.w || 0, h: im.h || 0, name: im.name, projectId: newPid, createdAt: Date.now() });
    }
    await DB.put('projects', p);
    return newPid;
  }

  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') S.saveNow(); });
  window.addEventListener('beforeunload', () => { S.saveNow(); });
})();
