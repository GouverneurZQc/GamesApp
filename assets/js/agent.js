/* GameForge Studio — l'agent : personas, contexte du projet, exécution en streaming, génération d'images */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;

  const PERSONAS = {
    designer: { icon: 'target', label: ['Game designer', 'Game designer'],
      fr: 'un game designer senior (20 ans d\'expérience, jeux indés et AAA) qui pense boucles de gameplay, motivation du joueur, équilibrage et scope',
      en: 'a senior game designer (20 years, indie and AAA) who thinks in gameplay loops, player motivation, balancing and scope' },
    writer: { icon: 'feather', label: ['Scénariste', 'Narrative designer'],
      fr: 'un scénariste / narrative designer spécialisé dans le jeu vidéo : structure, personnages, dialogues, narration environnementale, cohérence du lore',
      en: 'a game writer / narrative designer: structure, characters, dialogue, environmental storytelling, lore consistency' },
    artdir: { icon: 'palette', label: ['Directeur artistique', 'Art director'],
      fr: 'un directeur artistique de jeu vidéo : lisibilité, silhouettes, couleurs, lumière, cohérence de style, contraintes de production',
      en: 'a game art director: readability, silhouettes, color, lighting, style consistency, production constraints' },
    level: { icon: 'pin', label: ['Level designer', 'Level designer'],
      fr: 'un level designer : rythme, guidage du joueur, blockout, points d\'intérêt, difficulté, rejouabilité',
      en: 'a level designer: pacing, player guidance, blockout, points of interest, difficulty, replayability' },
    tech: { icon: 'box', label: ['Directeur technique', 'Technical director'],
      fr: 'un directeur technique / programmeur gameplay : architecture, moteur (Unity, Unreal, Godot…), performances, faisabilité, outils',
      en: 'a technical director / gameplay programmer: architecture, engines (Unity, Unreal, Godot…), performance, feasibility, tools' },
    producer: { icon: 'check', label: ['Producteur', 'Producer'],
      fr: 'un producteur de jeu : scope réaliste, planning, priorités, risques, budget, jalons (prototype, vertical slice, sortie)',
      en: 'a game producer: realistic scope, schedule, priorities, risks, budget, milestones (prototype, vertical slice, launch)' },
    critic: { icon: 'camera', label: ['Critique impitoyable', 'Ruthless critic'],
      fr: 'un critique de jeux vidéo réputé pour sa franchise : tu ne flattes jamais, tu dis ce qui cloche avec précision, puis ce qu\'il faudrait pour que ce soit excellent',
      en: 'a game critic known for bluntness: you never flatter, you pinpoint what is wrong, then what it would take to be excellent' },
    player: { icon: 'users', label: ['Joueur testeur', 'Playtester'],
      fr: 'un joueur testeur passionné et exigeant qui réagit spontanément : ce qui donne envie, ce qui ennuie, ce qui frustre, ce qui manque',
      en: 'a passionate, demanding playtester reacting spontaneously: what excites, bores, frustrates, what is missing' },
    audio: { icon: 'sparkles', label: ['Sound designer', 'Sound designer'],
      fr: 'un sound designer / compositeur de jeu : ambiance sonore, musique adaptative, feedback audio, identité sonore',
      en: 'a game sound designer / composer: soundscape, adaptive music, audio feedback, sonic identity' },
    marketing: { icon: 'flag', label: ['Marketing & communauté', 'Marketing & community'],
      fr: 'un expert marketing du jeu indé : positionnement, page Steam, capsule, trailer, réseaux sociaux, communauté, festivals',
      en: 'an indie game marketing expert: positioning, Steam page, capsule art, trailer, social media, community, festivals' },
  };

  /* ---------- Formatage des fiches ---------- */
  function fieldText(type, fd, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    switch (fd.type) {
      case 'select': { const o = (fd.options || []).find((x) => x.v === v); return o ? L(o.l) : v; }
      case 'tags': return Array.isArray(v) ? v.join(', ') : v;
      case 'ref': return S.entityName(fd.ref, v);
      case 'refs': return (v || []).map((id) => S.entityName(fd.ref, id)).filter(Boolean).join(', ');
      case 'chapter': return S.chapterLabel(v);
      case 'rating': return `${v}/10`;
      case 'kv': return (v || []).filter((r) => r.k || r.v).map((r) => `${r.k}: ${r.v}`).join(' ; ');
      case 'relations': return (v || []).filter((r) => r.id).map((r) => `${S.entityName('characters', r.id)}${r.type ? ` (${r.type})` : ''}`).join(' ; ');
      default: return String(v);
    }
  }

  function entityText(type, e, { heading = '###', skipName = false } = {}) {
    const def = SC.ENTITIES[type];
    const lines = [];
    if (!skipName) lines.push(`${heading} ${e.fields.name || T('(sans nom)', '(unnamed)')}`);
    for (const g of def.groups) {
      for (const fd of g.fields) {
        if (fd.key === 'name') continue;
        const t = fieldText(type, fd, e.fields[fd.key]);
        if (t) lines.push(`- **${L(fd.label)}** : ${t}`);
      }
    }
    return lines.join('\n');
  }

  function entityShort(type, e) {
    const x = e.fields;
    const def = SC.ENTITIES[type];
    const sub = def.subtitle ? def.subtitle(x) : '';
    const desc = x.description || x.summary || x.appearance || x.personality || x.backstory || x.effect || x.ideology || '';
    const extra = [];
    if (x.firstChapter || x.firstAppearance) extra.push(T('arrive : ', 'appears: ') + [S.chapterLabel(x.firstChapter), U.truncate(x.firstAppearance, 80)].filter(Boolean).join(' — '));
    return `- **${x.name || '?'}**${sub ? ` (${sub})` : ''}${desc ? ` — ${U.truncate(desc.replace(/\s+/g, ' '), 260)}` : ''}${extra.length ? ` [${extra.join('; ')}]` : ''}`;
  }

  /* ---------- Contexte du projet ---------- */
  function context({ focus = null, maxChars = 45000 } = {}) {
    const p = S.project;
    if (!p) return '';
    const m = p.meta, out = [];
    out.push(`# ${T('Projet', 'Project')} : ${p.name}`);
    const metaLines = [
      [T('Pitch', 'Pitch'), m.pitch], [T('Genre', 'Genre'), m.genre], [T('Plateformes', 'Platforms'), m.platforms],
      [T('Moteur', 'Engine'), m.engine], [T('Public cible', 'Audience'), m.audience], [T('Équipe', 'Team'), m.team],
    ].filter(([, v]) => v);
    metaLines.forEach(([k, v]) => out.push(`- ${k} : ${v}`));

    const secs = p.gdd.sections.filter((s) => s.content.trim());
    if (secs.length) {
      out.push(`\n## Game Design Document`);
      for (const s of secs) {
        const title = s.key ? L(SC.gddDef(s.key).title) : s.title;
        out.push(`### ${title}\n${U.truncate(s.content.trim(), focus === 'gdd' ? 5000 : 1800)}`);
      }
    }
    const st = p.story;
    const storyBits = [
      ['Logline', st.logline], [T('Synopsis', 'Synopsis'), st.synopsis], [T('Thèmes', 'Themes'), st.themes], [T('Ton', 'Tone'), st.tone],
      [T('Univers', 'Setting'), st.setting], [T('Conflit central', 'Central conflict'), st.conflict], [T('Fin(s)', 'Ending(s)'), st.ending],
    ].filter(([, v]) => v && v.trim());
    if (storyBits.length || st.chapters.length) {
      out.push(`\n## ${T('Histoire', 'Story')}`);
      storyBits.forEach(([k, v]) => out.push(`- **${k}** : ${U.truncate(v, focus === 'story' ? 4000 : 1500)}`));
      if (st.chapters.length) {
        out.push(`### ${T('Chapitres', 'Chapters')}`);
        st.chapters.forEach((c, i) => out.push(`${i + 1}. **${c.title || T('Sans titre', 'Untitled')}** — ${U.truncate(c.summary || '', focus === 'story' ? 1200 : 300)}`));
      }
    }
    for (const t of SC.ENTITY_ORDER) {
      const list = p.entities[t];
      if (!list.length) continue;
      out.push(`\n## ${L(SC.ENTITIES[t].label)} (${list.length})`);
      if (focus === t) list.forEach((e) => out.push(entityText(t, e)));
      else list.slice(0, 60).forEach((e) => out.push(entityShort(t, e)));
    }
    const a = p.art;
    const artBits = [
      [T('Style', 'Style'), a.styleName], [T('Résumé', 'Summary'), a.summary], [T('Mots-clés', 'Keywords'), (a.keywords || []).join(', ')],
      [T('Références', 'References'), a.references], [T('Palette', 'Palette'), (a.palette || []).join(' ')],
      [T('Lumière', 'Lighting'), a.lighting], [T('Formes', 'Shapes'), a.shapes], [T('Matières', 'Materials'), a.materials],
      [T('Caméra', 'Camera'), a.camera], ['UI', a.ui], [T('À faire', 'Do'), a.dos], [T('À éviter', "Don't"), a.donts],
    ].filter(([, v]) => v && String(v).trim());
    if (artBits.length) {
      out.push(`\n## ${T('Direction artistique', 'Art direction')}`);
      artBits.forEach(([k, v]) => out.push(`- **${k}** : ${U.truncate(v, focus === 'art' ? 2000 : 500)}`));
    }
    const ideas = p.ideas.filter((i) => i.status !== 'rejected').slice(0, focus === 'ideas' ? 60 : 20);
    if (ideas.length) {
      out.push(`\n## ${T('Idées notées', 'Logged ideas')}`);
      ideas.forEach((i) => out.push(`- [${i.status}] ${i.title ? `**${i.title}** : ` : ''}${U.truncate((i.content || '').replace(/\s+/g, ' '), focus === 'ideas' ? 400 : 160)}`));
    }
    let txt = out.join('\n');
    if (txt.length > maxChars) txt = txt.slice(0, maxChars) + '\n[…]';
    return txt;
  }

  /* ---------- Prompt système ---------- */
  function system({ persona = 'designer', extra = '', context: withCtx, focus = null } = {}) {
    const st = S.settings.agent;
    const P = PERSONAS[persona] || PERSONAS.designer;
    const useCtx = withCtx === undefined ? st.includeContext : withCtx;
    const en = GF.lang === 'en';
    const tone = {
      gentle: en ? 'Be kind and encouraging, but honest about important problems.' : 'Sois bienveillant et encourageant, mais honnête sur les problèmes importants.',
      frank: en ? 'Be frank and direct: say clearly what does not work and why, without gratuitous harshness, then propose something better. Never flatter by default.'
        : 'Sois franc et direct : dis clairement ce qui ne fonctionne pas et pourquoi, sans méchanceté gratuite, puis propose mieux. Ne flatte jamais par défaut.',
      brutal: en ? 'Be brutally honest, zero complacency or flattery: point out every weakness like a demanding studio director or a merciless player would, then give concrete fixes.'
        : 'Sois brutalement honnête, zéro complaisance ni flatterie : pointe chaque faiblesse comme le ferait un directeur de studio exigeant ou un joueur impitoyable, puis donne des solutions concrètes.',
    }[st.frankness] || '';
    const len = {
      short: en ? 'Keep answers short and dense (about 200 words max) unless asked for more.' : 'Réponses courtes et denses (environ 200 mots max) sauf si on te demande plus.',
      normal: en ? 'Adapt the length: complete but no filler.' : 'Longueur adaptée : complet mais sans remplissage.',
      long: en ? 'Give detailed, in-depth answers with examples.' : 'Réponses détaillées et approfondies, avec exemples.',
    }[st.length] || '';
    const base = en
      ? `You are "Forge", the AI agent built into GameForge Studio, a workshop that helps developers design their video game (game design, story, characters, vehicles, levels, art direction, tech, production, marketing).
Current role: you speak as ${P.en}.
Principles:
- ${tone}
- Be concrete and actionable: precise examples, references to existing games when useful, clear steps.
- Respect the creator's vision and stay consistent with the project described below (names, lore, style). Point out inconsistencies.
- Format in Markdown (short headings, lists, tables when useful).
- ${len}
- When relevant, end with 1 to 3 questions or leads to keep going.
Language: always answer in English unless asked otherwise.`
      : `Tu es « Forge », l'agent IA intégré à GameForge Studio, un atelier qui aide les développeurs à concevoir leur jeu vidéo (game design, histoire, personnages, véhicules, niveaux, direction artistique, technique, production, marketing).
Rôle actuel : tu t'exprimes en tant que ${P.fr}.
Principes :
- ${tone}
- Sois concret et actionnable : exemples précis, références à des jeux existants quand c'est utile, étapes claires.
- Respecte la vision du créateur et reste cohérent avec le projet décrit ci-dessous (noms, lore, style). Signale les incohérences.
- Mets en forme en Markdown (titres courts, listes, tableaux si utile).
- ${len}
- Quand c'est pertinent, termine par 1 à 3 questions ou pistes pour continuer.
Langue : réponds toujours en français, sauf demande contraire.`;
    let sys = base;
    if (useCtx) {
      const ctx = context({ focus });
      if (ctx) sys += `\n\n<${en ? 'project' : 'projet'}>\n${ctx}\n</${en ? 'project' : 'projet'}>`;
    }
    if (extra) sys += `\n\n${extra}`;
    return sys;
  }

  async function resolveImages(list) {
    const out = [];
    for (const im of list || []) {
      if (typeof im === 'string') out.push(await GF.images.base64(im));
      else if (im && im.data) out.push(im);
    }
    return out;
  }
  async function resolveMessages(msgs) {
    const out = [];
    for (const m of msgs || []) out.push({ role: m.role, content: m.content, images: await resolveImages(m.images) });
    return out;
  }

  function providerNote(p) {
    if (!p) return '';
    let s = ` · ${p.label}${p.model ? ' · ' + p.model : ''}`;
    return s;
  }

  function errorHTML(e) {
    return `<div class="ai-error">${UI.icon('info')}<div><strong>${T('Erreur de l\'agent', 'Agent error')}</strong><br>${U.esc(e.message)}
      <div><a href="#/settings" class="link">${T('Ouvrir les paramètres IA →', 'Open AI settings →')}</a></div></div></div>`;
  }

  /**
   * Lance l'agent et affiche la réponse en streaming dans `into`.
   * o: { into, prompt, history, images, persona, system, extra, focus, context, task, position, title, actions:[{label, icon, onClick(text)}], onDone(text) }
   */
  async function run(o) {
    const box = document.createElement('div');
    box.className = 'ai-out';
    box.innerHTML = `
      <div class="ai-head">
        <span class="ai-badge">${UI.icon('sparkles')} ${U.esc(o.title || 'Forge')}<span class="ai-model"></span></span>
        <div class="ai-tools"><button class="btn sm ghost ai-stop">${UI.icon('stop')} ${T('Arrêter', 'Stop')}</button></div>
      </div>
      <div class="ai-note" hidden></div>
      <div class="md ai-md"><div class="typing"><span></span><span></span><span></span></div></div>
      <div class="ai-actions"></div>`;
    if (o.into) {
      if (o.position === 'replace') o.into.innerHTML = '';
      if (o.position === 'prepend') o.into.prepend(box); else o.into.appendChild(box);
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    const mdEl = box.querySelector('.ai-md');
    const stopBtn = box.querySelector('.ai-stop');
    const ctrl = new AbortController();
    stopBtn.onclick = () => ctrl.abort();
    let last = '';
    const render = U.throttle(() => { mdEl.innerHTML = GF.md.render(last); }, 70);
    let text = null;
    try {
      const messages = await resolveMessages([...(o.history || []), { role: 'user', content: o.prompt, images: o.images }]);
      const sys = o.system || system({ persona: o.persona, extra: o.extra, focus: o.focus, context: o.context });
      text = await GF.ai.chat({
        messages, system: sys, task: o.task, signal: ctrl.signal,
        onDelta: (t) => { last = t; render(); },
        onProvider: (p) => {
          box.querySelector('.ai-model').textContent = providerNote(p);
          if (p.fallback) {
            const n = box.querySelector('.ai-note');
            n.hidden = false;
            n.innerHTML = p.free
              ? `${UI.icon('info')} ${T('Mode gratuit (qualité limitée). Ajoute une clé Claude, OpenAI ou Gemini dans', 'Free mode (limited quality). Add a Claude, OpenAI or Gemini key in')} <a href="#/settings" class="link">${T('Paramètres', 'Settings')}</a>.`
              : `${UI.icon('info')} ${T('Fournisseur choisi non configuré : utilisation de', 'Chosen provider not configured: using')} ${U.esc(p.label)}.`;
          }
        },
      });
      await U.sleep(80);
      mdEl.innerHTML = GF.md.render(text) || `<p class="muted">${T('(réponse vide)', '(empty response)')}</p>`;
    } catch (e) {
      if (e.name === 'AbortError') {
        text = last ? last + T('\n\n*(interrompu)*', '\n\n*(stopped)*') : '';
        mdEl.innerHTML = GF.md.render(text) || `<p class="muted">${T('Interrompu.', 'Stopped.')}</p>`;
      } else {
        console.error(e);
        mdEl.innerHTML = errorHTML(e);
        stopBtn.remove();
        o.onError && o.onError(e);
        return null;
      }
    }
    stopBtn.remove();
    const acts = box.querySelector('.ai-actions');
    const all = [
      { label: T('Copier', 'Copy'), icon: 'copy', onClick: async (t) => { await U.copyText(t); UI.toast(T('Copié', 'Copied'), 'success'); } },
      ...(o.actions || []),
    ];
    if (o.saveAsIdea !== false) {
      all.push({ label: T('Garder comme idée', 'Keep as idea'), icon: 'bulb', onClick: (t) => {
        const title = U.truncate((o.ideaTitle || o.title || T('Suggestion de l\'agent', 'Agent suggestion')), 80);
        S.project.ideas.unshift({ id: U.uid('idea_'), title, content: t, category: o.ideaCategory || 'other', tags: ['agent'], status: 'explore', pinned: false, images: [], thread: [], createdAt: Date.now(), updatedAt: Date.now() });
        S.touch(); GF.app.refreshNav();
        UI.toast(T('Ajouté aux idées', 'Added to ideas'), 'success');
      } });
    }
    if (text) {
      for (const a of all) {
        const b = document.createElement('button');
        b.className = 'btn sm ghost';
        b.innerHTML = `${UI.icon(a.icon || 'check')} ${U.esc(a.label)}`;
        b.onclick = () => a.onClick(text, box);
        acts.appendChild(b);
      }
    }
    o.onDone && o.onDone(text, box);
    return text;
  }

  /** Appel sans interface (renvoie le texte) */
  async function ask(o) {
    const messages = await resolveMessages([...(o.history || []), { role: 'user', content: o.prompt, images: o.images }]);
    const sys = o.system || system({ persona: o.persona, extra: o.extra, focus: o.focus, context: o.context });
    return GF.ai.chat({ messages, system: sys, task: o.task, signal: o.signal, maxTokens: o.maxTokens, onProvider: o.onProvider });
  }

  /** Appel qui attend du JSON */
  async function json(o) {
    const suffix = GF.lang === 'en'
      ? '\n\nIMPORTANT: answer ONLY with valid JSON (no text before or after, no comments).'
      : '\n\nIMPORTANT : réponds UNIQUEMENT avec du JSON valide (aucun texte avant ou après, pas de commentaires).';
    const txt = await ask({ ...o, prompt: o.prompt + suffix });
    return U.extractJSON(txt);
  }

  /* ---------- Images ---------- */
  function styleText(styleKey) {
    const a = S.project.art;
    if (styleKey === 'none') return '';
    if (!styleKey || styleKey === 'project') {
      if (a.stylePrompt && a.stylePrompt.trim()) return a.stylePrompt.trim();
      return [a.styleName, (a.keywords || []).join(', '), a.lighting].filter(Boolean).join(', ');
    }
    const s = SC.IMAGE_STYLES.find((x) => x[0] === styleKey);
    return s ? s[2] : '';
  }

  async function imagePrompt(desc, { kindText = '', style = '', signal } = {}) {
    const sys = `You are an expert prompt writer for image generation models, specialized in video game concept art.
Write ONE image prompt in English, 60 to 130 words, concrete and visual: subject, key details, pose/composition, camera angle, lighting, color palette, materials, mood, art style.
Stay faithful to the description and to the project's names/lore. No text, captions, watermarks or logos in the image unless requested.
Output ONLY the prompt, no preamble, no quotes.`;
    const user = `Description (may be in French): ${desc}\n${kindText ? `Image type: ${kindText}\n` : ''}${style ? `Required art style: ${style}\n` : ''}Game: ${S.project.name}${S.project.meta.genre ? ` (${S.project.meta.genre})` : ''}`;
    const txt = await GF.ai.chat({ messages: [{ role: 'user', content: user }], system: sys, task: 'text', signal, maxTokens: 4000 });
    return txt.replace(/^["'«\s]+|["'»\s]+$/g, '').trim();
  }

  /**
   * Génère des images et les enregistre dans le projet (galerie).
   * o: { prompt, kind, style, aspect, n, refs:[imageIds], optimize, onStatus, signal, source }
   * -> { ids, finalPrompt, provider }
   */
  async function generateImages(o) {
    const kindDef = SC.IMAGE_KINDS.find((k) => k[0] === o.kind);
    const kindText = o.kindText || (kindDef ? kindDef[2] : '');
    const style = styleText(o.style);
    let finalPrompt = [kindText, o.prompt, style].filter(Boolean).join(', ');
    const optimize = o.optimize ?? S.settings.agent.optimizePrompts;
    if (optimize) {
      o.onStatus && o.onStatus(T('L\'agent optimise le prompt…', 'The agent is optimizing the prompt…'));
      try { finalPrompt = await imagePrompt(o.prompt, { kindText, style, signal: o.signal }) || finalPrompt; } catch (e) {
        if (e.name === 'AbortError') throw e;
        console.warn('Optimisation du prompt impossible', e);
      }
    }
    o.onStatus && o.onStatus(T('Génération de l\'image…', 'Generating image…'), finalPrompt);
    const refs = await resolveImages(o.refs || []);
    const { blobs, provider } = await GF.ai.image({ prompt: finalPrompt, aspect: o.aspect || '1:1', n: o.n || 1, refs, signal: o.signal });
    const ids = [];
    for (const b of blobs) {
      const id = await GF.images.add(b, { name: U.truncate(o.prompt, 40), maxDim: 4096 });
      ids.push(id);
      S.addToGallery(id, { prompt: finalPrompt, idea: o.prompt, provider: provider.label, model: provider.imageModel || '', kind: o.kind || 'free', source: o.source || 'studio' });
    }
    return { ids, finalPrompt, provider };
  }

  function canSee() {
    try { GF.ai.resolve('vision'); return true; } catch (e) { return false; }
  }

  GF.agent = { canSee, PERSONAS, context, system, run, ask, json, entityText, entityShort, fieldText, imagePrompt, generateImages, styleText, resolveImages };
})();
