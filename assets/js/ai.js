/* GameForge Studio — connecteurs IA (texte, vision, images) avec streaming
 * Fournisseurs : Anthropic Claude, OpenAI, Google Gemini, OpenRouter, Ollama, LM Studio,
 * tout service compatible OpenAI, et Pollinations (gratuit, sans clé).
 * Les appels partent directement du navigateur vers le fournisseur choisi. */
(function () {
  const U = GF.util;

  const PROVIDERS = {
    anthropic: {
      label: 'Anthropic Claude', kind: 'anthropic', needsKey: true, text: true, vision: true, image: false,
      base: 'https://api.anthropic.com/v1', model: 'claude-opus-5-5',
      models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5', 'claude-fable-5-1', 'claude-opus-5'],
      keyUrl: 'https://console.anthropic.com/settings/keys',
      desc: ['Recommandé : excellent en écriture créative, en critique franche et en analyse d\'images.',
        'Recommended: excellent at creative writing, honest critique and image analysis.'],
    },
    openai: {
      label: 'OpenAI', kind: 'openai', needsKey: true, text: true, vision: true, image: true,
      base: 'https://api.openai.com/v1', model: 'gpt-6-sol', models: ['gpt-6-astra', 'gpt-6-sol', 'gpt-6-luna'],
      imageModel: 'gpt-image-2.5-flare', imageModels: ['gpt-image-2.5-sunburst', 'gpt-image-2.5-flare'],
      keyUrl: 'https://platform.openai.com/api-keys',
      desc: ['Texte, vision et génération d\'images (GPT Image).', 'Text, vision and image generation (GPT Image).'],
    },
    gemini: {
      label: 'Google Gemini', kind: 'gemini', needsKey: true, text: true, vision: true, image: true,
      base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-3.8-flash',
      models: ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
      imageModel: 'gemini-3.1-flash-image', imageModels: ['gemini-3-pro-image', 'gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'],
      keyUrl: 'https://aistudio.google.com/apikey',
      desc: ['Texte, vision et images « Nano Banana ». Offre gratuite généreuse sur AI Studio.',
        'Text, vision and "Nano Banana" images. Generous free tier on AI Studio.'],
    },
    openrouter: {
      label: 'OpenRouter', kind: 'openai', needsKey: true, text: true, vision: true, image: false,
      base: 'https://openrouter.ai/api/v1', model: 'openrouter/auto', models: ['openrouter/auto'],
      keyUrl: 'https://openrouter.ai/keys',
      desc: ['Une seule clé pour des centaines de modèles (Claude, GPT, Gemini, Llama, Mistral…).',
        'One key for hundreds of models (Claude, GPT, Gemini, Llama, Mistral…).'],
    },
    ollama: {
      label: 'Ollama (local)', kind: 'openai', needsKey: false, local: true, text: true, vision: true, image: false,
      base: 'http://localhost:11434/v1', model: 'gemma3', models: ['gemma3', 'qwen3', 'llama3.2', 'mistral-small3.2'],
      keyUrl: 'https://ollama.com/download',
      desc: ['IA 100 % locale et gratuite sur ton PC (lance « ollama serve »).', '100% local, free AI on your PC (run "ollama serve").'],
    },
    lmstudio: {
      label: 'LM Studio (local)', kind: 'openai', needsKey: false, local: true, text: true, vision: true, image: false,
      base: 'http://localhost:1234/v1', model: '', models: [],
      keyUrl: 'https://lmstudio.ai',
      desc: ['IA locale via le serveur de LM Studio (onglet Developer).', 'Local AI through the LM Studio server (Developer tab).'],
    },
    custom: {
      get label() { return T('Compatible OpenAI (Mistral, Groq, DeepSeek, xAI…)', 'OpenAI-compatible (Mistral, Groq, DeepSeek, xAI…)'); },
      kind: 'openai', needsKey: true, keyOptional: true, text: true, vision: true, image: false,
      base: '', model: '', models: [],
      desc: ['N\'importe quelle API compatible OpenAI : indique l\'URL de base, la clé et le modèle.',
        'Any OpenAI-compatible API: set the base URL, key and model.'],
    },
    pollinations: {
      label: 'Pollinations', kind: 'pollinations', needsKey: false, free: true, text: true, vision: false, image: true,
      base: 'https://text.pollinations.ai/openai', model: 'openai', models: ['openai'],
      imageModel: '', imageModels: ['', 'flux', 'turbo'],
      keyUrl: 'https://pollinations.ai',
      desc: ['Gratuit et sans clé — idéal pour commencer (qualité plus limitée, texte sans vision).',
        'Free, no key — great to get started (lower quality, text without vision).'],
    },
  };
  const CLOUD_ORDER = ['anthropic', 'openai', 'gemini', 'openrouter', 'custom'];

  function cfg(id) {
    const def = PROVIDERS[id];
    const s = (GF.store.settings.providers[id] = GF.store.settings.providers[id] || {});
    return {
      id, def,
      label: def.label,
      key: (s.key || '').trim(),
      base: ((s.base || def.base || '') + '').trim().replace(/\/+$/, ''),
      model: (s.model || def.model || '').trim(),
      imageModel: (s.imageModel != null && s.imageModel !== '' ? s.imageModel : def.imageModel || '').trim(),
    };
  }

  function isReady(id) {
    const c = cfg(id);
    if (!c.def) return false;
    if (id === 'custom') return !!c.base && !!c.model;
    if (c.def.local) return !!c.model;
    if (c.def.needsKey) return !!c.key;
    return true;
  }

  /** Choisit le fournisseur pour une tâche : 'text' | 'vision' | 'image' */
  function resolve(task) {
    const st = GF.store.settings;
    const wanted = task === 'image' ? st.imageProvider : task === 'vision' ? (st.visionProvider || st.textProvider) : st.textProvider;
    const can = (id) => PROVIDERS[id] && PROVIDERS[id][task === 'image' ? 'image' : task === 'vision' ? 'vision' : 'text'];
    if (wanted && can(wanted) && isReady(wanted)) return { ...cfg(wanted), fallback: false };
    // repli : un fournisseur cloud configuré, sinon le gratuit
    const alt = CLOUD_ORDER.find((id) => can(id) && isReady(id));
    if (alt) return { ...cfg(alt), fallback: true, wanted };
    if (can('pollinations')) return { ...cfg('pollinations'), fallback: true, wanted, free: true };
    const err = new Error(task === 'vision'
      ? T("Aucun fournisseur capable d'analyser des images n'est configuré. Ajoute une clé Claude, OpenAI ou Gemini (ou un modèle Ollama avec vision) dans Paramètres.",
        'No provider able to analyze images is configured. Add a Claude, OpenAI or Gemini key (or an Ollama vision model) in Settings.')
      : T('Aucun fournisseur IA configuré. Va dans Paramètres.', 'No AI provider configured. Go to Settings.'));
    err.code = 'no_provider';
    throw err;
  }

  /* ---------- Outils HTTP / SSE ---------- */
  async function readSSE(res, onEvent) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const handle = (chunk) => {
      let ev = 'message';
      const data = [];
      for (const line of chunk.split(/\r?\n/)) {
        if (line.startsWith('event:')) ev = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (data.length) onEvent(ev, data.join('\n'));
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let m;
      while ((m = /\r?\n\r?\n/.exec(buf))) {
        const chunk = buf.slice(0, m.index);
        buf = buf.slice(m.index + m[0].length);
        handle(chunk);
      }
    }
    if (buf.trim()) handle(buf);
  }

  async function httpError(res, p) {
    let msg = '';
    try {
      const txt = await res.text();
      try {
        const j = JSON.parse(txt);
        const e = Array.isArray(j) ? j[0] && j[0].error : j.error;
        msg = (e && (e.message || e.msg)) || j.message || j.detail || txt;
        if (typeof msg !== 'string') msg = JSON.stringify(msg);
      } catch (_) { msg = txt; }
    } catch (_) { /* ignore */ }
    msg = U.truncate(msg || res.statusText, 500);
    let hint = '';
    if (res.status === 401 || res.status === 403) hint = T(' → Vérifie ta clé API dans Paramètres.', ' → Check your API key in Settings.');
    else if (res.status === 404) hint = T(' → Modèle ou URL introuvable : vérifie le nom du modèle.', ' → Model or URL not found: check the model name.');
    else if (res.status === 429) hint = T(' → Limite atteinte (quota ou trop de requêtes). Réessaie plus tard.', ' → Rate/quota limit reached. Try again later.');
    else if (res.status === 402) hint = T(' → Crédits insuffisants sur ce compte.', ' → Insufficient credits on this account.');
    const e = new Error(`${p.label} (${res.status}) : ${msg}${hint}`);
    e.status = res.status;
    e.raw = msg;
    return e;
  }

  async function doFetch(url, init, p) {
    try {
      return await fetch(url, init);
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      const local = p.def && p.def.local;
      throw new Error(`${p.label} : ` + (local
        ? T(`impossible de joindre ${p.base}. Le serveur local est-il lancé ? (Ollama : définis OLLAMA_ORIGINS=* puis « ollama serve »)`,
          `cannot reach ${p.base}. Is the local server running? (Ollama: set OLLAMA_ORIGINS=* then "ollama serve")`)
        : T('connexion impossible (réseau, URL ou blocage CORS).', 'connection failed (network, URL or CORS block).')));
    }
  }

  /* ---------- Anthropic Claude ---------- */
  const EFFORT_MODELS = /claude-(opus-4-[5-9]|opus-5|sonnet-4-6|sonnet-5|fable|mythos)/;
  const FALLBACK_MODELS = /^claude-(opus-5-5|opus-5|fable-5-1|fable-5|sonnet-5-5)$/;

  async function anthropicChat(p, o) {
    const st = GF.store.settings.agent;
    const messages = o.messages.map((m) => ({
      role: m.role,
      content: m.images && m.images.length
        ? [...m.images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.data } })),
          { type: 'text', text: m.content || '…' }]
        : (m.content || '…'),
    }));
    const build = (full) => {
      const body = { model: p.model, max_tokens: full ? (o.maxTokens || 64000) : Math.min(o.maxTokens || 8192, 8192), stream: true, messages };
      if (o.system) body.system = o.system;
      const headers = {
        'content-type': 'application/json',
        'x-api-key': p.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
      if (full) {
        if (EFFORT_MODELS.test(p.model) && st.effort && st.effort !== 'auto') body.output_config = { effort: o.effort || st.effort };
        if (st.fallback && FALLBACK_MODELS.test(p.model)) {
          headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
          body.fallbacks = 'default';
        }
        body.cache_control = { type: 'ephemeral' };
      }
      return { body, headers };
    };
    let req = build(true);
    let res = await doFetch(`${p.base}/messages`, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body), signal: o.signal }, p);
    if (res.status === 400) {
      const err = await httpError(res, p);
      if (/fallback|cache_control|output_config|effort|max_tokens|beta/i.test(err.raw || '')) {
        req = build(false);
        res = await doFetch(`${p.base}/messages`, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body), signal: o.signal }, p);
      } else throw err;
    }
    if (!res.ok) throw await httpError(res, p);

    let text = '', stop = null, streamErr = null;
    await readSSE(res, (ev, data) => {
      let j; try { j = JSON.parse(data); } catch (_) { return; }
      switch (j.type) {
        case 'content_block_start':
          if (j.content_block && j.content_block.type === 'fallback') {
            text = ''; // le modèle de repli reprend : on jette la sortie partielle refusée
            o.onDelta && o.onDelta(text);
          }
          break;
        case 'content_block_delta':
          if (j.delta && j.delta.type === 'text_delta') { text += j.delta.text; o.onDelta && o.onDelta(text); }
          break;
        case 'message_delta':
          if (j.delta && j.delta.stop_reason) stop = j.delta.stop_reason;
          break;
        case 'error':
          streamErr = new Error(`${p.label} : ${(j.error && j.error.message) || 'stream error'}`);
          break;
        default:
      }
    });
    if (streamErr) throw streamErr;
    if (stop === 'refusal') {
      text = (text ? text + '\n\n' : '') + T("> ⚠️ L'IA a refusé de poursuivre cette demande. Reformule-la ou essaie un autre modèle.",
        '> ⚠️ The AI declined to continue this request. Rephrase it or try another model.');
    } else if (stop === 'max_tokens') {
      text += T('\n\n> ✂️ Réponse coupée (limite de longueur atteinte).', '\n\n> ✂️ Response cut off (length limit reached).');
    }
    return text;
  }

  /* ---------- OpenAI et compatibles (OpenRouter, Ollama, LM Studio, Mistral, Groq…) ---------- */
  async function openaiChat(p, o) {
    const messages = [];
    if (o.system) messages.push({ role: 'system', content: o.system });
    for (const m of o.messages) {
      messages.push({
        role: m.role,
        content: m.images && m.images.length
          ? [{ type: 'text', text: m.content || '' }, ...m.images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mediaType};base64,${im.data}` } }))]
          : (m.content || ''),
      });
    }
    const url = p.def.kind === 'pollinations' ? p.base : `${p.base}/chat/completions`;
    const headers = { 'content-type': 'application/json' };
    if (p.key) headers.authorization = `Bearer ${p.key}`;
    const body = { model: p.model, messages, stream: true };
    const res = await doFetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: o.signal }, p);
    if (!res.ok) throw await httpError(res, p);
    let text = '', finish = null, streamErr = null;
    const ctype = res.headers.get('content-type') || '';
    if (!ctype.includes('event-stream')) {
      const j = await res.json();
      text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
      o.onDelta && o.onDelta(text);
      return text;
    }
    await readSSE(res, (ev, data) => {
      if (data === '[DONE]') return;
      let j; try { j = JSON.parse(data); } catch (_) { return; }
      if (j.error) { streamErr = new Error(`${p.label} : ${j.error.message || JSON.stringify(j.error)}`); return; }
      const ch = j.choices && j.choices[0];
      if (!ch) return;
      const d = ch.delta && ch.delta.content;
      if (typeof d === 'string' && d) { text += d; o.onDelta && o.onDelta(text); }
      if (ch.finish_reason) finish = ch.finish_reason;
    });
    if (streamErr) throw streamErr;
    if (finish === 'content_filter') text += T("\n\n> ⚠️ Réponse filtrée par le fournisseur.", '\n\n> ⚠️ Response filtered by the provider.');
    if (finish === 'length') text += T('\n\n> ✂️ Réponse coupée (limite de longueur).', '\n\n> ✂️ Response cut off (length limit).');
    return text;
  }

  /* ---------- Google Gemini ---------- */
  function geminiContents(messages) {
    return messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [...(m.images || []).map((im) => ({ inlineData: { mimeType: im.mediaType, data: im.data } })), { text: m.content || ' ' }],
    }));
  }
  async function geminiChat(p, o) {
    const body = { contents: geminiContents(o.messages) };
    if (o.system) body.systemInstruction = { parts: [{ text: o.system }] };
    const url = `${p.base}/models/${encodeURIComponent(p.model)}:streamGenerateContent?alt=sse`;
    const res = await doFetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': p.key }, body: JSON.stringify(body), signal: o.signal }, p);
    if (!res.ok) throw await httpError(res, p);
    let text = '', blocked = null, finish = null;
    await readSSE(res, (ev, data) => {
      let j; try { j = JSON.parse(data); } catch (_) { return; }
      if (j.promptFeedback && j.promptFeedback.blockReason) blocked = j.promptFeedback.blockReason;
      const c = j.candidates && j.candidates[0];
      if (!c) return;
      for (const part of (c.content && c.content.parts) || []) {
        if (part.text && !part.thought) { text += part.text; o.onDelta && o.onDelta(text); }
      }
      if (c.finishReason) finish = c.finishReason;
    });
    if (blocked) throw new Error(`${p.label} : ${T('demande bloquée', 'request blocked')} (${blocked})`);
    if (finish === 'SAFETY') text += T('\n\n> ⚠️ Réponse interrompue par les filtres de sécurité.', '\n\n> ⚠️ Response stopped by safety filters.');
    if (finish === 'MAX_TOKENS') text += T('\n\n> ✂️ Réponse coupée (limite de longueur).', '\n\n> ✂️ Response cut off (length limit).');
    return text;
  }

  /* ---------- Génération d'images ---------- */
  const OPENAI_SIZES = { '1:1': '1024x1024', '16:9': '1536x1024', '4:3': '1536x1024', '3:2': '1536x1024', '9:16': '1024x1536', '3:4': '1024x1536', '2:3': '1024x1536' };
  const POLLI_SIZES = { '1:1': [1024, 1024], '16:9': [1344, 768], '9:16': [768, 1344], '4:3': [1152, 864], '3:4': [864, 1152], '3:2': [1216, 832], '2:3': [832, 1216] };

  async function openaiImage(p, o) {
    const size = OPENAI_SIZES[o.aspect] || '1024x1024';
    const headers = { authorization: `Bearer ${p.key}` };
    let res;
    if (o.refs && o.refs.length) {
      const fd = new FormData();
      fd.append('model', p.imageModel);
      fd.append('prompt', o.prompt);
      fd.append('n', String(o.n || 1));
      fd.append('size', size);
      o.refs.forEach((r, i) => fd.append('image[]', U.base64ToBlob(r.data, r.mediaType), `ref${i}.${r.mediaType.split('/')[1] || 'png'}`));
      res = await doFetch(`${p.base}/images/edits`, { method: 'POST', headers, body: fd, signal: o.signal }, p);
    } else {
      res = await doFetch(`${p.base}/images/generations`, {
        method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ model: p.imageModel, prompt: o.prompt, n: o.n || 1, size }), signal: o.signal,
      }, p);
    }
    if (!res.ok) throw await httpError(res, p);
    const j = await res.json();
    const out = [];
    for (const d of j.data || []) {
      if (d.b64_json) out.push(U.base64ToBlob(d.b64_json, 'image/png'));
      else if (d.url) { const r = await fetch(d.url); out.push(await r.blob()); }
    }
    return out;
  }

  async function geminiImage(p, o) {
    const out = [];
    const n = o.n || 1;
    for (let i = 0; i < n; i++) {
      const parts = [...(o.refs || []).map((r) => ({ inlineData: { mimeType: r.mediaType, data: r.data } })), { text: o.prompt }];
      const mk = (withCfg) => {
        const body = { contents: [{ role: 'user', parts: withCfg ? parts : [...parts.slice(0, -1), { text: `${o.prompt}\n\nAspect ratio: ${o.aspect || '1:1'}` }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } };
        if (withCfg) body.generationConfig.imageConfig = { aspectRatio: o.aspect || '1:1' };
        return body;
      };
      const url = `${p.base}/models/${encodeURIComponent(p.imageModel)}:generateContent`;
      const headers = { 'content-type': 'application/json', 'x-goog-api-key': p.key };
      let res = await doFetch(url, { method: 'POST', headers, body: JSON.stringify(mk(true)), signal: o.signal }, p);
      if (res.status === 400) {
        const err = await httpError(res, p);
        if (!/imageConfig|aspect/i.test(err.raw || '')) throw err;
        res = await doFetch(url, { method: 'POST', headers, body: JSON.stringify(mk(false)), signal: o.signal }, p);
      }
      if (!res.ok) throw await httpError(res, p);
      const j = await res.json();
      const c = j.candidates && j.candidates[0];
      const img = ((c && c.content && c.content.parts) || []).find((x) => x.inlineData || x.inline_data);
      if (!img) {
        const txt = ((c && c.content && c.content.parts) || []).map((x) => x.text).filter(Boolean).join(' ');
        throw new Error(`${p.label} : ${T("aucune image renvoyée.", 'no image returned.')} ${U.truncate(txt, 200)}`);
      }
      const d = img.inlineData || img.inline_data;
      out.push(U.base64ToBlob(d.data, d.mimeType || d.mime_type || 'image/png'));
    }
    return out;
  }

  async function pollinationsImage(p, o) {
    const [w, h] = POLLI_SIZES[o.aspect] || [1024, 1024];
    const out = [];
    for (let i = 0; i < (o.n || 1); i++) {
      const seed = Math.floor(Math.random() * 1e9);
      const prompt = encodeURIComponent(U.truncate(o.prompt, 1500));
      const model = p.imageModel ? `&model=${encodeURIComponent(p.imageModel)}` : '';
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=${w}&height=${h}&seed=${seed}&nologo=true${model}`;
      const res = await doFetch(url, { signal: o.signal }, p);
      if (!res.ok) throw await httpError(res, p);
      const blob = await res.blob();
      if (!/^image\//.test(blob.type)) throw new Error(`${p.label} : ${T('réponse inattendue.', 'unexpected response.')}`);
      out.push(blob);
    }
    return out;
  }

  /* ---------- API publique ---------- */
  GF.ai = {
    PROVIDERS, cfg, isReady, resolve,

    /**
     * Chat en streaming.
     * @param {object} o { messages:[{role, content, images:[{mediaType,data}]}], system, task, onDelta(text), onProvider(p), signal, maxTokens }
     * @returns {Promise<string>} texte final
     */
    async chat(o) {
      const hasImages = o.messages.some((m) => m.images && m.images.length);
      const p = resolve(hasImages ? 'vision' : (o.task || 'text'));
      o.onProvider && o.onProvider(p);
      if (p.def.kind === 'anthropic') return anthropicChat(p, o);
      if (p.def.kind === 'gemini') return geminiChat(p, o);
      return openaiChat(p, o);
    },

    /** Génère des images. o: { prompt, aspect, n, refs:[{mediaType,data}], signal } -> Blob[] */
    async image(o) {
      const p = resolve('image');
      o.onProvider && o.onProvider(p);
      let blobs;
      if (p.def.kind === 'openai') blobs = await openaiImage(p, o);
      else if (p.def.kind === 'gemini') blobs = await geminiImage(p, o);
      else blobs = await pollinationsImage(p, o);
      if (!blobs.length) throw new Error(T('Aucune image générée.', 'No image generated.'));
      return { blobs, provider: p };
    },

    async listModels(id) {
      const p = cfg(id);
      let url, headers = {};
      if (p.def.kind === 'anthropic') {
        url = `${p.base}/models?limit=100`;
        headers = { 'x-api-key': p.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
      } else if (p.def.kind === 'gemini') {
        url = `${p.base}/models?pageSize=200`;
        headers = { 'x-goog-api-key': p.key };
      } else if (p.def.kind === 'pollinations') {
        url = 'https://text.pollinations.ai/models';
      } else {
        url = `${p.base}/models`;
        if (p.key) headers.authorization = `Bearer ${p.key}`;
      }
      const res = await doFetch(url, { headers }, p);
      if (!res.ok) throw await httpError(res, p);
      const j = await res.json();
      if (p.def.kind === 'gemini') return (j.models || []).map((m) => m.name.replace(/^models\//, ''));
      if (Array.isArray(j)) return j.map((m) => m.name || m.id).filter(Boolean);
      return (j.data || j.models || []).map((m) => m.id || m.name).filter(Boolean).sort();
    },

    /** Test rapide d'un fournisseur texte */
    async test(id) {
      const p = cfg(id);
      const o = {
        messages: [{ role: 'user', content: T('Réponds seulement : « Connexion OK ».', 'Reply only: "Connection OK".') }],
        maxTokens: 4000,
      };
      if (p.def.kind === 'anthropic') return anthropicChat(p, { ...o, effort: 'low' });
      if (p.def.kind === 'gemini') return geminiChat(p, o);
      return openaiChat(p, o);
    },
  };
})();
