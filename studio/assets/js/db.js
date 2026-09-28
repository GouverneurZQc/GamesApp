/* DevPortals — stockage local (IndexedDB) + médiathèque (images et sons) */
(function () {
  const U = DP.util;
  const DB_NAME = 'devportals';
  const DB_VERSION = 1;
  let dbp = null;
  let memory = null; // repli en mémoire si IndexedDB est indisponible

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      const fallback = (err) => {
        console.warn('IndexedDB indisponible, stockage en mémoire.', err);
        memory = { kv: new Map(), projects: new Map(), media: new Map() };
        resolve(null);
      };
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { return fallback(e); }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('media')) {
          const s = db.createObjectStore('media', { keyPath: 'id' });
          s.createIndex('projectId', 'projectId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => fallback(req.error);
    });
    return dbp;
  }

  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  function tx(store, mode, fn) {
    return open().then((db) => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      let result;
      Promise.resolve(fn(t.objectStore(store))).then((r) => { result = r; });
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transaction aborted'));
    }));
  }

  const DB = (DP.db = {
    open,
    get isMemory() { return !!memory; },
    async get(store, key) {
      await open();
      if (memory) return memory[store].get(key);
      return tx(store, 'readonly', (s) => reqP(s.get(key)));
    },
    async put(store, value, key) {
      await open();
      if (memory) { memory[store].set(key ?? value.id, value); return; }
      return tx(store, 'readwrite', (s) => reqP(key !== undefined ? s.put(value, key) : s.put(value)));
    },
    async del(store, key) {
      await open();
      if (memory) { memory[store].delete(key); return; }
      return tx(store, 'readwrite', (s) => reqP(s.delete(key)));
    },
    async all(store) {
      await open();
      if (memory) return Array.from(memory[store].values());
      return tx(store, 'readonly', (s) => reqP(s.getAll()));
    },
    async byIndex(store, index, value) {
      await open();
      if (memory) return Array.from(memory[store].values()).filter((v) => v[index] === value);
      return tx(store, 'readonly', (s) => reqP(s.index(index).getAll(value)));
    },
  });

  /* ---------------- Médias (images + audio) ---------------- */
  const urlCache = new Map();
  const isImage = (b) => /^image\//.test((b && b.type) || '');
  const isAudio = (b) => /^audio\//.test((b && b.type) || '') || /\.(mp3|ogg|wav|m4a|flac|webm)$/i.test((b && b.name) || '');

  const M = (DP.media = {
    isImage, isAudio,
    /** Ajoute un fichier (image ou son). Retourne l'id. */
    async add(file, meta = {}) {
      if (!file) throw new Error('No file');
      let blob = file, w = 0, h = 0, kind;
      if (isImage(file)) {
        kind = 'image';
        try {
          const r = await U.resizeImage(file, meta.maxDim || 2400);
          blob = r.blob; w = r.w; h = r.h;
        } catch (e) {
          if (file.type !== 'image/svg+xml') throw e;
        }
      } else if (isAudio(file)) {
        kind = 'audio';
        if (!file.type) blob = new Blob([file], { type: 'audio/mpeg' });
      } else {
        throw new Error(T('Format non pris en charge (images ou sons uniquement).', 'Unsupported format (images or audio only).'));
      }
      const id = U.uid(kind === 'audio' ? 'aud_' : 'img_');
      await DB.put('media', {
        id, blob, type: blob.type, kind, w, h, size: blob.size,
        name: meta.name || file.name || kind,
        projectId: meta.projectId || (DP.store && DP.store.project && DP.store.project.id) || null,
        createdAt: Date.now(),
      });
      return id;
    },
    async get(id) { return id ? DB.get('media', id) : null; },
    async url(id) {
      if (!id) return '';
      if (urlCache.has(id)) return urlCache.get(id);
      const rec = await DB.get('media', id);
      if (!rec) return '';
      const u = URL.createObjectURL(rec.blob);
      urlCache.set(id, u);
      return u;
    },
    /** Remplit les <img data-img>, [data-bg-img] et <audio data-audio> d'un conteneur */
    async hydrate(root = document) {
      const els = root.querySelectorAll('img[data-img]:not([data-hyd]), [data-bg-img]:not([data-hyd]), audio[data-audio]:not([data-hyd])');
      await Promise.all(Array.from(els).map(async (el) => {
        el.setAttribute('data-hyd', '1');
        const id = el.getAttribute('data-img') || el.getAttribute('data-bg-img') || el.getAttribute('data-audio');
        if (!id) return;
        const u = await M.url(id);
        if (!u) { el.classList.add('img-missing'); return; }
        if (el.tagName === 'IMG' || el.tagName === 'AUDIO') el.src = u;
        else el.style.backgroundImage = `url("${u}")`;
      }));
    },
    async remove(id) {
      if (!id) return;
      if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); }
      await DB.del('media', id);
    },
    async listByProject(projectId) { return DB.byIndex('media', 'projectId', projectId); },
    extOf(rec) {
      const t = (rec && rec.type) || '';
      const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav',
        'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'audio/flac': 'flac', 'audio/x-flac': 'flac', 'audio/webm': 'webm' };
      return map[t] || (rec && rec.name && (rec.name.split('.').pop() || '').toLowerCase()) || 'bin';
    },
    async download(id, name) {
      const rec = await DB.get('media', id);
      if (!rec) return;
      U.download(`${U.slug(name || (rec.name || '').replace(/\.[a-z0-9]+$/i, '') || 'media')}.${M.extOf(rec)}`, rec.blob);
    },
  });
})();
