/* DevPortals — utilitaires communs */
window.DP = window.DP || {};
DP.lang = 'fr';
DP.views = DP.views || {};

/** Traduction inline : T('Texte FR', 'English text') */
window.T = (fr, en) => (DP.lang === 'en' && en != null ? en : fr);
/** Paire [fr, en] -> texte dans la langue courante */
window.L = (pair) => (Array.isArray(pair) ? T(pair[0], pair[1]) : (pair ?? ''));

(function () {
  const U = (DP.util = {});

  U.uid = (prefix = '') =>
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  U.esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  U.debounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.truncate = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const locale = () => (DP.lang === 'en' ? 'en-CA' : 'fr-CA');

  U.fmtDate = (ts) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return new Date(ts).toISOString(); }
  };

  /** Date « AAAA-MM-JJ » -> texte lisible */
  U.fmtDay = (d) => {
    if (!d) return '';
    const dt = typeof d === 'number' ? new Date(d) : new Date(`${d}T12:00:00`);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' });
  };

  U.today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  /** Jours restants avant une date AAAA-MM-JJ (négatif si passée) */
  U.daysUntil = (d) => {
    if (!d) return null;
    const target = new Date(`${d}T00:00:00`);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 864e5);
  };

  U.relTime = (ts) => {
    if (!ts) return '';
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return T("à l'instant", 'just now');
    const m = Math.round(s / 60); if (m < 60) return T(`il y a ${m} min`, `${m} min ago`);
    const h = Math.round(m / 60); if (h < 24) return T(`il y a ${h} h`, `${h} h ago`);
    const d = Math.round(h / 24); if (d < 30) return T(`il y a ${d} j`, `${d} d ago`);
    return U.fmtDate(ts);
  };

  U.slug = (s) => String(s || 'projet').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'projet';

  U.fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`);

  U.download = (filename, data, mime = 'application/octet-stream') => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  U.blobToDataURL = (blob) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });

  U.dataURLToBlob = (dataURL) => {
    const [head, b64] = dataURL.split(',');
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  U.readText = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsText(file);
  });

  U.loadImage = (blob) => new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => res({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error(T('Image illisible', 'Unreadable image'))); };
    img.src = url;
  });

  /** Redimensionne une image (Blob) si elle dépasse maxDim. Retourne {blob, w, h}. */
  U.resizeImage = async (blob, maxDim = 2048, mime, quality = 0.9) => {
    const { img, url } = await U.loadImage(blob);
    try {
      const w0 = img.naturalWidth, h0 = img.naturalHeight;
      const scale = Math.min(1, maxDim / Math.max(w0, h0));
      const targetMime = mime || (blob.type === 'image/png' && blob.size < 3e6 ? 'image/png' : 'image/jpeg');
      if (scale === 1 && (!mime || mime === blob.type) && /^image\/(png|jpeg|webp|gif)$/.test(blob.type)) {
        return { blob, w: w0, h: h0 };
      }
      const w = Math.max(1, Math.round(w0 * scale)), h = Math.max(1, Math.round(h0 * scale));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (targetMime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      const out = await new Promise((r) => c.toBlob(r, targetMime, quality));
      return { blob: out || blob, w, h };
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  U.copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) { /* ignore */ }
      ta.remove();
    }
  };

  U.pickFiles = ({ accept = 'image/*', multiple = true } = {}) => new Promise((res) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept; inp.multiple = multiple;
    inp.style.display = 'none';
    inp.onchange = () => { res(Array.from(inp.files || [])); inp.remove(); };
    document.body.appendChild(inp);
    inp.click();
  });

  U.tagsFromString = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  U.lines = (s) => String(s || '').split('\n').map((x) => x.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean);
  U.words = (t) => (String(t || '').trim().match(/\S+/g) || []).length;
})();
