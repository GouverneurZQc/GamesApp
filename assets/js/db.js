/* GameForge Studio — stockage local (IndexedDB) + gestion des images */
(function () {
  const U = GF.util;
  const DB_NAME = 'gameforge-studio';
  const DB_VERSION = 1;
  let dbp = null;
  let memory = null; // repli en mémoire si IndexedDB est indisponible

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      let req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        memory = { kv: new Map(), projects: new Map(), images: new Map() };
        return resolve(null);
      }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('images')) {
          const s = db.createObjectStore('images', { keyPath: 'id' });
          s.createIndex('projectId', 'projectId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn('IndexedDB indisponible, stockage en mémoire.', req.error);
        memory = { kv: new Map(), projects: new Map(), images: new Map() };
        resolve(null);
      };
    });
    return dbp;
  }

  function tx(store, mode, fn) {
    return open().then((db) => {
      if (!db) return fn(null);
      return new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        let result;
        Promise.resolve(fn(s)).then((r) => { result = r; });
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error || new Error('Transaction aborted'));
      });
    });
  }

  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  const DB = (GF.db = {
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

  /* ---------------- Images ---------------- */
  const urlCache = new Map();

  const IMG = (GF.images = {
    /** Ajoute un fichier / Blob image. Retourne l'id. */
    async add(fileOrBlob, meta = {}) {
      if (!fileOrBlob || !/^image\//.test(fileOrBlob.type || '')) {
        throw new Error(T("Ce fichier n'est pas une image.", 'This file is not an image.'));
      }
      let blob = fileOrBlob, w = 0, h = 0;
      try {
        const r = await U.resizeImage(fileOrBlob, meta.maxDim || 2048);
        blob = r.blob; w = r.w; h = r.h;
      } catch (e) {
        if (fileOrBlob.type !== 'image/svg+xml') throw e;
      }
      const id = U.uid('img_');
      await DB.put('images', {
        id, blob, type: blob.type, w, h,
        name: meta.name || fileOrBlob.name || 'image',
        projectId: meta.projectId || (GF.store && GF.store.project && GF.store.project.id) || null,
        createdAt: Date.now(),
      });
      return id;
    },
    async addDataURL(dataURL, meta = {}) {
      return IMG.add(U.dataURLToBlob(dataURL), meta);
    },
    async get(id) { return id ? DB.get('images', id) : null; },
    async url(id) {
      if (!id) return '';
      if (urlCache.has(id)) return urlCache.get(id);
      const rec = await DB.get('images', id);
      if (!rec) return '';
      const u = URL.createObjectURL(rec.blob);
      urlCache.set(id, u);
      return u;
    },
    /** Remplit tous les <img data-img="id"> et éléments [data-bg-img] d'un conteneur */
    async hydrate(root = document) {
      const els = root.querySelectorAll('img[data-img]:not([data-hyd]), [data-bg-img]:not([data-hyd])');
      await Promise.all(Array.from(els).map(async (el) => {
        el.setAttribute('data-hyd', '1');
        const id = el.getAttribute('data-img') || el.getAttribute('data-bg-img');
        if (!id) return;
        const u = await IMG.url(id);
        if (!u) { el.classList.add('img-missing'); return; }
        if (el.tagName === 'IMG') el.src = u;
        else el.style.backgroundImage = `url("${u}")`;
      }));
    },
    /** Base64 redimensionné pour l'envoi aux IA (vision) */
    async base64(id, maxDim = 1568) {
      const rec = await DB.get('images', id);
      if (!rec) throw new Error(T('Image introuvable', 'Image not found'));
      let blob = rec.blob;
      const needsConvert = !/^image\/(png|jpeg|webp|gif)$/.test(blob.type);
      if (needsConvert || Math.max(rec.w || 0, rec.h || 0) > maxDim || blob.size > 3.5e6 || !rec.w) {
        const r = await U.resizeImage(blob, maxDim, 'image/jpeg', 0.86);
        blob = r.blob;
      }
      const dataURL = await U.blobToDataURL(blob);
      return { mediaType: blob.type || 'image/jpeg', data: dataURL.split(',')[1] };
    },
    async dataURL(id) {
      const rec = await DB.get('images', id);
      return rec ? U.blobToDataURL(rec.blob) : '';
    },
    async remove(id) {
      if (!id) return;
      if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); }
      await DB.del('images', id);
    },
    async listByProject(projectId) { return DB.byIndex('images', 'projectId', projectId); },
    async download(id, name) {
      const rec = await DB.get('images', id);
      if (!rec) return;
      const ext = (rec.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      U.download(`${U.slug(name || rec.name || 'image')}.${ext}`, rec.blob);
    },
  });
})();
