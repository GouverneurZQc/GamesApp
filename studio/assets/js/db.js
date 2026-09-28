/* DevPortals — accès au serveur (compte, projets, médias) + lecture des anciennes données du navigateur */
(function () {
  const U = DP.util;

  /* ---------------- API du serveur ---------------- */
  const ERRORS = {
    login_required: ['Ta session a expiré, reconnecte-toi.', 'Your session expired, please log in again.'],
    forbidden: ['Accès refusé.', 'Access denied.'],
    too_large: ['Fichier trop volumineux.', 'File too large.'],
    unsupported_media: ['Format non pris en charge (images ou sons uniquement).', 'Unsupported format (images or audio only).'],
    bad_credentials: ["Nom d'utilisateur ou mot de passe incorrect.", 'Wrong username or password.'],
    weak_password: ['Mot de passe trop court (6 caractères minimum).', 'Password too short (6 characters minimum).'],
    invalid_username: ["Nom d'utilisateur invalide : 3 à 32 caractères (lettres, chiffres, . _ -).", 'Invalid username: 3 to 32 characters (letters, digits, . _ -).'],
    username_taken: ["Ce nom d'utilisateur est déjà pris.", 'This username is already taken.'],
    last_admin: ['Il doit rester au moins un administrateur.', 'There must be at least one administrator left.'],
    cannot_disable_self: ['Tu ne peux pas désactiver ton propre compte.', 'You cannot disable your own account.'],
    cannot_delete_self: ['Tu ne peux pas supprimer ton propre compte.', 'You cannot delete your own account.'],
    nothing_pending: ["Rien n'est en attente pour ce portail.", 'Nothing is pending for this portal.'],
    local_only: ['Disponible seulement sur le PC qui héberge DevPortals.', 'Only available on the PC hosting DevPortals.'],
    too_many_attempts: ['Trop de tentatives. Réessaie dans quelques minutes.', 'Too many attempts. Try again in a few minutes.'],
    not_found: ['Introuvable.', 'Not found.'],
  };
  const errText = (code, status) => (ERRORS[code] ? L(ERRORS[code]) : `${T('Erreur du serveur', 'Server error')} (${status}${code ? ` : ${code}` : ''})`);

  /** Appel à l'API. body : objet (JSON), Blob ou texte. */
  async function api(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
    const h = { ...headers };
    if (method !== 'GET') h['X-DP'] = '1';
    let payload = body;
    if (body !== undefined && !(body instanceof Blob) && typeof body !== 'string') {
      payload = JSON.stringify(body);
      h['Content-Type'] = 'application/json';
    }
    let res;
    try {
      res = await fetch(path, { method, body: payload, headers: h, cache: 'no-store', credentials: 'same-origin' });
    } catch (e) {
      API.online = false;
      API.onStatus && API.onStatus(false);
      throw new Error(T('Serveur DevPortals injoignable. Vérifie que la fenêtre du serveur est toujours ouverte.', 'DevPortals server unreachable. Check that the server window is still open.'));
    }
    if (!API.online) { API.online = true; API.onStatus && API.onStatus(true); }
    if (!res.ok) {
      let code = '';
      try { code = (await res.json()).error || ''; } catch (e) { /* ignore */ }
      if (res.status === 401 && code === 'login_required' && API.onLogout) API.onLogout();
      const err = new Error(errText(code, res.status));
      err.code = code; err.status = res.status;
      throw err;
    }
    if (raw) return res;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('json') ? res.json() : res.text();
  }
  const API = (DP.api = Object.assign(api, { online: true, onStatus: null, onLogout: null, errText }));

  /* ---------------- Anciennes données (IndexedDB, versions sans compte) ---------------- */
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  DP.legacy = {
    async open() {
      try {
        if (!window.indexedDB) return null;
        if (indexedDB.databases) {
          const dbs = await indexedDB.databases();
          if (!dbs.some((d) => d.name === 'devportals')) return null;
        }
        const req = indexedDB.open('devportals');
        req.onupgradeneeded = () => { req.transaction.abort(); };
        const db = await reqP(req).catch(() => null);
        if (!db) return null;
        if (!db.objectStoreNames.contains('projects')) { db.close(); return null; }
        return db;
      } catch (e) { return null; }
    },
    async projects() {
      const db = await DP.legacy.open();
      if (!db) return [];
      const all = await reqP(db.transaction('projects').objectStore('projects').getAll());
      db.close();
      return all;
    },
    async media(projectId) {
      const db = await DP.legacy.open();
      if (!db) return [];
      const st = db.transaction('media').objectStore('media');
      const all = await reqP(st.indexNames.contains('projectId') ? st.index('projectId').getAll(projectId) : st.getAll());
      db.close();
      return all.filter((m) => m.projectId === projectId);
    },
    async removeProject(id) {
      const db = await DP.legacy.open();
      if (!db) return;
      const t = db.transaction(['projects', 'media'], 'readwrite');
      t.objectStore('projects').delete(id);
      const ms = t.objectStore('media');
      const recs = await reqP(ms.getAll());
      recs.filter((m) => m.projectId === id).forEach((m) => ms.delete(m.id));
      await new Promise((res) => { t.oncomplete = res; t.onerror = res; t.onabort = res; });
      db.close();
    },
  };

  /* ---------------- Médias (images + audio), stockés dans le compte ---------------- */
  const metaCache = new Map();
  const isImage = (b) => /^image\//.test((b && b.type) || '');
  const isAudio = (b) => /^audio\//.test((b && b.type) || '') || /\.(mp3|ogg|wav|m4a|flac|webm)$/i.test((b && b.name) || '');
  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav',
    'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'audio/flac': 'flac', 'audio/x-flac': 'flac', 'audio/webm': 'webm' };

  const M = (DP.media = {
    isImage, isAudio,
    /** Envoie un blob déjà prêt sous un identifiant donné */
    async upload(id, blob, { name = '', projectId, w = 0, h = 0 } = {}) {
      const q = new URLSearchParams({ id, project: projectId, name: String(name).slice(0, 120), w: String(w || 0), h: String(h || 0) });
      const meta = await api(`/api/media?${q}`, { method: 'POST', body: blob, headers: { 'Content-Type': blob.type || 'application/octet-stream' } });
      metaCache.set(id, meta);
      return meta;
    },
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
        throw new Error(L(ERRORS.unsupported_media));
      }
      const id = U.uid(kind === 'audio' ? 'aud_' : 'img_');
      const projectId = meta.projectId || (DP.store && DP.store.project && DP.store.project.id);
      await M.upload(id, blob, { name: meta.name || file.name || kind, projectId, w, h });
      return id;
    },
    /** Métadonnées + contenu (blob) */
    async get(id) {
      if (!id) return null;
      try {
        const res = await api(M.url(id), { raw: true });
        const blob = await res.blob();
        const meta = metaCache.get(id) || {};
        return { id, name: meta.name || id, kind: meta.kind || (/^audio\//.test(blob.type) ? 'audio' : 'image'), w: meta.w || 0, h: meta.h || 0,
          createdAt: meta.createdAt, projectId: meta.projectId, size: blob.size, type: blob.type, blob };
      } catch (e) { return null; }
    },
    meta: (id) => metaCache.get(id) || null,
    url(id) { return id ? `/api/media/${encodeURIComponent(id)}` : ''; },
    /** Remplit les <img data-img>, [data-bg-img] et <audio data-audio> d'un conteneur */
    async hydrate(root = document) {
      root.querySelectorAll('img[data-img]:not([data-hyd]), [data-bg-img]:not([data-hyd]), audio[data-audio]:not([data-hyd])').forEach((el) => {
        el.setAttribute('data-hyd', '1');
        const id = el.getAttribute('data-img') || el.getAttribute('data-bg-img') || el.getAttribute('data-audio');
        if (!id) return;
        const u = M.url(id);
        if (el.tagName === 'IMG' || el.tagName === 'AUDIO') {
          el.addEventListener('error', () => el.classList.add('img-missing'), { once: true });
          el.src = u;
        } else el.style.backgroundImage = `url("${u}")`;
      });
    },
    async remove(id) {
      if (!id) return;
      await api(M.url(id), { method: 'DELETE' });
      metaCache.delete(id);
    },
    async listByProject(projectId) {
      const list = await api(`/api/media?project=${encodeURIComponent(projectId)}`);
      list.forEach((m) => metaCache.set(m.id, m));
      return list;
    },
    extOf(rec) {
      const t = (rec && rec.type) || '';
      return EXT[t] || (rec && rec.ext) || (rec && rec.name && (rec.name.split('.').pop() || '').toLowerCase()) || 'bin';
    },
    async download(id, name) {
      const rec = await M.get(id);
      if (!rec) return;
      U.download(`${U.slug(name || (rec.name || '').replace(/\.[a-z0-9]+$/i, '') || 'media')}.${M.extOf(rec)}`, rec.blob);
    },
  });
})();
