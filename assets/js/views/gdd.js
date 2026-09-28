/* Vue : Game Design Document + export (Markdown, HTML, PDF) */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui, SC = GF.schemas;

  const secTitle = (s) => (s.key && SC.gddDef(s.key) ? L(SC.gddDef(s.key).title) : s.title || T('Section sans titre', 'Untitled section'));
  const secGuide = (s) => (s.key && SC.gddDef(s.key) ? L(SC.gddDef(s.key).guide) : '');
  const words = (t) => (String(t || '').trim().match(/\S+/g) || []).length;

  const AI = [
    { key: 'draft', icon: 'feather', label: ['Rédiger un premier jet', 'Write a first draft'], write: true,
      fr: (s) => `Rédige un premier jet complet de la section « ${secTitle(s)} » de mon GDD, à partir de tout ce que tu sais du projet.${secGuide(s) ? ` Points à couvrir : ${secGuide(s)}` : ''} Utilise des sous-titres ###, des listes et des exemples concrets. Quand une information manque, fais une proposition marquée [À VALIDER]. Réponds uniquement avec le contenu de la section.`,
      en: (s) => `Write a complete first draft of the "${secTitle(s)}" section of my GDD, based on everything you know about the project.${secGuide(s) ? ` Points to cover: ${secGuide(s)}` : ''} Use ### subheadings, lists and concrete examples. When information is missing, make a proposal marked [TO VALIDATE]. Answer only with the section content.` },
    { key: 'improve', icon: 'wand', label: ['Améliorer / structurer', 'Improve / structure'], write: true,
      fr: (s) => `Réécris et améliore cette section « ${secTitle(s)} » de mon GDD. Garde toutes mes idées et mon intention, clarifie, structure (###, listes), complète les trous (marqués [À VALIDER]). Réponds uniquement avec la nouvelle version.\n\n---\n${s.content}`,
      en: (s) => `Rewrite and improve this "${secTitle(s)}" section of my GDD. Keep all my ideas and intent, clarify, structure (###, lists), fill gaps (marked [TO VALIDATE]). Answer only with the new version.\n\n---\n${s.content}` },
    { key: 'suggest', icon: 'sparkles', label: ['Suggestions', 'Suggestions'],
      fr: (s) => `Donne-moi 5 à 8 suggestions concrètes pour enrichir la section « ${secTitle(s)} » (sans la réécrire). Contenu actuel :\n\n${s.content || '(vide)'}`,
      en: (s) => `Give me 5 to 8 concrete suggestions to enrich the "${secTitle(s)}" section (without rewriting it). Current content:\n\n${s.content || '(empty)'}` },
    { key: 'questions', icon: 'info', label: ['Questions clés', 'Key questions'],
      fr: (s) => `Quelles questions importantes la section « ${secTitle(s)} » laisse-t-elle sans réponse ? Classe-les par priorité et propose des pistes. Contenu :\n\n${s.content || '(vide)'}`,
      en: (s) => `What important questions does the "${secTitle(s)}" section leave unanswered? Rank them by priority and propose leads. Content:\n\n${s.content || '(empty)'}` },
    { key: 'coherence', icon: 'target', label: ['Vérifier la cohérence', 'Check consistency'], persona: 'critic',
      fr: (s) => `Vérifie la cohérence de la section « ${secTitle(s)} » avec le reste du projet (autres sections, histoire, fiches, style). Liste les contradictions, les manques et les risques, franchement.\n\n${s.content || '(vide)'}`,
      en: (s) => `Check the consistency of the "${secTitle(s)}" section with the rest of the project (other sections, story, sheets, style). List contradictions, gaps and risks, frankly.\n\n${s.content || '(empty)'}` },
    { key: 'refs', icon: 'star', label: ['Jeux de référence', 'Reference games'],
      fr: (s) => `Cite 5 à 7 jeux de référence pertinents pour la section « ${secTitle(s)} » de mon projet et, pour chacun, ce qu'on peut en apprendre concrètement (à copier / à éviter).`,
      en: (s) => `Name 5 to 7 reference games relevant to the "${secTitle(s)}" section of my project and, for each, what we can concretely learn (to copy / to avoid).` },
  ];

  GF.views.gdd = {
    title: () => T('Game Design Document', 'Game Design Document'),
    render(el, params) {
      const p = S.project;
      const secs = p.gdd.sections;
      let cur = (secs.find((s) => s.id === params.id) || secs[0] || {}).id;
      let mode = 'edit';

      el.innerHTML = `
        <div class="split">
          <div class="split-list card">
            <div class="gdd-progress" id="gddProg"></div>
            <div class="list" id="secList"></div>
            <button class="btn block ghost" id="addSec">${UI.icon('plus')} ${T('Ajouter une section', 'Add a section')}</button>
            <div class="sep"></div>
            <div class="lbl">${T('Exporter le document complet', 'Export the full document')}</div>
            <div class="stack">
              <button class="btn sm" id="expMd">${UI.icon('file')} Markdown (.md)</button>
              <button class="btn sm" id="expHtml">${UI.icon('globe')} ${T('Page web (.html)', 'Web page (.html)')}</button>
              <button class="btn sm" id="expPdf">${UI.icon('printer')} ${T('Imprimer / PDF', 'Print / PDF')}</button>
            </div>
          </div>
          <div class="split-detail" id="secDetail"></div>
        </div>`;

      const listEl = el.querySelector('#secList');
      const detailEl = el.querySelector('#secDetail');

      const renderList = () => {
        if (!el.querySelector('#gddProg')) return; // vue quittée entre-temps
        const filled = secs.filter((s) => words(s.content) >= 8).length;
        el.querySelector('#gddProg').innerHTML = `<div class="row"><strong>${filled}/${secs.length}</strong>&nbsp;<span class="muted small">${T('sections rédigées', 'sections written')}</span></div>
          <i class="bar"><b style="width:${secs.length ? (filled / secs.length) * 100 : 0}%"></b></i>`;
        listEl.innerHTML = secs.map((s, i) => {
          const w = words(s.content);
          return `<button class="list-item ${s.id === cur ? 'active' : ''}" data-id="${s.id}">
            <span class="dot ${w >= 80 ? 'full' : w >= 8 ? 'half' : ''}"></span>
            <span class="li-body"><strong>${i + 1}. ${U.esc(secTitle(s))}</strong><small>${w} ${T('mots', 'words')}</small></span>
          </button>`;
        }).join('');
        listEl.querySelectorAll('.list-item').forEach((b) => { b.onclick = () => { cur = b.dataset.id; history.replaceState(null, '', `#/gdd/${cur}`); renderList(); renderDetail(); }; });
      };

      const renderDetail = () => {
        const s = secs.find((x) => x.id === cur);
        if (!s) { detailEl.innerHTML = UI.empty('book', T('Aucune section', 'No section')); return; }
        const idx = secs.indexOf(s);
        const guide = secGuide(s);
        detailEl.innerHTML = `
          <div class="card">
            <div class="row gap">
              ${s.key ? `<h2 class="grow sec-title">${U.esc(secTitle(s))}</h2>` : `<input class="title-input grow" id="sTitle" value="${U.esc(s.title)}" placeholder="${T('Titre de la section', 'Section title')}">`}
              <button class="btn icon ghost" id="sUp" title="${T('Monter', 'Move up')}" ${idx === 0 ? 'disabled' : ''}>${UI.icon('up')}</button>
              <button class="btn icon ghost" id="sDown" title="${T('Descendre', 'Move down')}" ${idx === secs.length - 1 ? 'disabled' : ''}>${UI.icon('down')}</button>
              <button class="btn icon ghost" id="sDel" title="${T('Supprimer la section', 'Delete section')}">${UI.icon('trash')}</button>
            </div>
            ${guide ? `<div class="guide">${UI.icon('info')} <span>${U.esc(guide)}</span></div>` : ''}
            <div class="tabs">
              <button data-mode="edit" class="${mode === 'edit' ? 'on' : ''}">${UI.icon('edit')} ${T('Écrire', 'Write')}</button>
              <button data-mode="preview" class="${mode === 'preview' ? 'on' : ''}">${UI.icon('eye')} ${T('Aperçu', 'Preview')}</button>
              <span class="grow"></span><span class="muted small" id="wc">${words(s.content)} ${T('mots', 'words')} · Markdown</span>
            </div>
            ${mode === 'edit'
              ? `<textarea class="input auto doc" id="sContent" rows="16" placeholder="${T('Écris librement… (Markdown accepté : ## titres, - listes, **gras**)', 'Write freely… (Markdown supported: ## headings, - lists, **bold**)')}">${U.esc(s.content)}</textarea>`
              : `<div class="md preview">${GF.md.render(s.content) || `<p class="muted">${T('Section vide.', 'Empty section.')}</p>`}</div>`}
          </div>
          <div class="card">
            <h3>${UI.icon('sparkles')} ${T('L\'agent t\'aide sur cette section', 'The agent helps with this section')}</h3>
            <div class="chips">${AI.map((a) => `<button class="chip" data-ai="${a.key}">${UI.icon(a.icon)} ${U.esc(L(a.label))}</button>`).join('')}</div>
          </div>
          <div id="secOut"></div>`;

        UI.autoGrow(detailEl);
        const ta = detailEl.querySelector('#sContent');
        if (ta) ta.addEventListener('input', () => { s.content = ta.value; S.touch(); detailEl.querySelector('#wc').textContent = `${words(s.content)} ${T('mots', 'words')} · Markdown`; refreshList(); });
        const ti = detailEl.querySelector('#sTitle');
        if (ti) ti.addEventListener('input', () => { s.title = ti.value; S.touch(); refreshList(); });
        detailEl.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { mode = b.dataset.mode; renderDetail(); }; });
        detailEl.querySelector('#sUp').onclick = () => { secs.splice(idx, 1); secs.splice(idx - 1, 0, s); S.touch(); renderList(); renderDetail(); };
        detailEl.querySelector('#sDown').onclick = () => { secs.splice(idx, 1); secs.splice(idx + 1, 0, s); S.touch(); renderList(); renderDetail(); };
        detailEl.querySelector('#sDel').onclick = async () => {
          if (!(await UI.confirm(T(`Supprimer la section « ${secTitle(s)} » ?`, `Delete section "${secTitle(s)}"?`), { danger: true }))) return;
          secs.splice(idx, 1); S.touch();
          cur = (secs[Math.max(0, idx - 1)] || {}).id;
          renderList(); renderDetail();
        };
        detailEl.querySelectorAll('[data-ai]').forEach((b) => {
          b.onclick = () => {
            const a = AI.find((x) => x.key === b.dataset.ai);
            const actions = [
              { label: T('Remplacer le contenu', 'Replace content'), icon: 'refresh', onClick: async (t) => {
                if (s.content.trim() && !(await UI.confirm(T('Remplacer le contenu actuel de la section ?', 'Replace the current section content?')))) return;
                s.content = cleanDraft(t); S.touch(); mode = 'edit'; renderList(); renderDetail();
                UI.toast(T('Section mise à jour', 'Section updated'), 'success');
              } },
              { label: T('Ajouter à la fin', 'Append'), icon: 'plus', onClick: (t) => { s.content = `${s.content.trim()}\n\n${cleanDraft(t)}`.trim(); S.touch(); renderList(); renderDetail(); UI.toast(T('Ajouté', 'Appended'), 'success'); } },
            ];
            GF.agent.run({
              into: detailEl.querySelector('#secOut'), position: 'prepend', title: `${L(a.label)} — ${secTitle(s)}`,
              prompt: GF.lang === 'en' ? a.en(s) : a.fr(s), persona: a.persona || (s.key === 'narrative' ? 'writer' : s.key === 'art' ? 'artdir' : s.key === 'tech' ? 'tech' : s.key === 'production' || s.key === 'business' ? 'producer' : s.key === 'marketing' ? 'marketing' : s.key === 'audio' ? 'audio' : 'designer'),
              focus: 'gdd', actions, ideaCategory: 'other',
            });
          };
        });
      };

      const refreshList = U.debounce(renderList, 500);

      el.querySelector('#addSec').onclick = async () => {
        const title = await UI.ask(T('Nouvelle section', 'New section'), { placeholder: T('ex. Système de réputation', 'e.g. Reputation system') });
        if (!title) return;
        const s = { id: U.uid('sec_'), key: null, title, content: '' };
        secs.push(s); S.touch(); cur = s.id; renderList(); renderDetail();
      };
      el.querySelector('#expMd').onclick = () => GF.exporter.markdown();
      el.querySelector('#expHtml').onclick = () => GF.exporter.html();
      el.querySelector('#expPdf').onclick = () => GF.exporter.print();

      renderList();
      renderDetail();
    },
  };

  function cleanDraft(t) {
    return String(t).replace(/\n\n\*\((interrompu|stopped)\)\*$/, '').trim();
  }

  /* ================= Export du document complet ================= */
  function buildMarkdown() {
    const p = S.project, m = p.meta, out = [];
    out.push(`# ${p.name}`);
    if (m.pitch) out.push(`> ${m.pitch.replace(/\n/g, '\n> ')}`);
    const meta = [[T('Genre', 'Genre'), m.genre], [T('Plateformes', 'Platforms'), m.platforms], [T('Moteur', 'Engine'), m.engine], [T('Public cible', 'Audience'), m.audience], [T('Équipe', 'Team'), m.team]].filter(([, v]) => v);
    if (meta.length) out.push(meta.map(([k, v]) => `- **${k}** : ${v}`).join('\n'));
    out.push(`*${T('Document généré par GameForge Studio le', 'Document generated by GameForge Studio on')} ${U.fmtDate(Date.now())}*`);

    out.push(`\n## Game Design Document`);
    p.gdd.sections.forEach((s, i) => {
      out.push(`\n### ${i + 1}. ${secTitle(s)}\n`);
      out.push(s.content.trim() ? s.content.trim().replace(/^(#{1,3}) /gm, '#### ') : `*${T('À rédiger', 'To be written')}*`);
    });

    const st = p.story;
    out.push(`\n## ${T('Histoire', 'Story')}`);
    [['Logline', st.logline], [T('Synopsis', 'Synopsis'), st.synopsis], [T('Thèmes', 'Themes'), st.themes], [T('Ton', 'Tone'), st.tone],
      [T('Univers', 'Setting'), st.setting], [T('Conflit central', 'Central conflict'), st.conflict], [T('Fin(s)', 'Ending(s)'), st.ending]]
      .filter(([, v]) => v && v.trim()).forEach(([k, v]) => out.push(`\n**${k}**\n\n${v.trim()}`));
    if (st.chapters.length) {
      out.push(`\n### ${T('Chapitres', 'Chapters')}`);
      st.chapters.forEach((c, i) => {
        out.push(`\n#### ${i + 1}. ${c.title || T('Sans titre', 'Untitled')}`);
        if (c.summary) out.push(c.summary.trim());
        if (c.content) out.push(c.content.trim());
        const chars = (c.characters || []).map((id) => S.entityName('characters', id)).filter(Boolean);
        if (chars.length) out.push(`- **${T('Personnages', 'Characters')}** : ${chars.join(', ')}`);
        const locs = (c.locations || []).map((id) => S.entityName('locations', id)).filter(Boolean);
        if (locs.length) out.push(`- **${T('Lieux', 'Locations')}** : ${locs.join(', ')}`);
        const firsts = SC.ENTITY_ORDER.flatMap((t) => p.entities[t].filter((e) => e.fields.firstChapter === c.id).map((e) => e.fields.name)).filter(Boolean);
        if (firsts.length) out.push(`- **${T('Premières apparitions', 'First appearances')}** : ${firsts.join(', ')}`);
      });
    }
    for (const t of SC.ENTITY_ORDER) {
      const list = p.entities[t];
      if (!list.length) continue;
      out.push(`\n## ${L(SC.ENTITIES[t].label)}`);
      list.forEach((e) => out.push('\n' + GF.agent.entityText(t, e, { heading: '###' })));
    }
    const a = p.art;
    const artRows = [[T('Style', 'Style'), a.styleName], [T('Résumé', 'Summary'), a.summary], [T('Mots-clés', 'Keywords'), (a.keywords || []).join(', ')],
      [T('Références', 'References'), a.references], [T('Palette', 'Palette'), (a.palette || []).join('  ')], [T('Lumière', 'Lighting'), a.lighting],
      [T('Formes & silhouettes', 'Shapes & silhouettes'), a.shapes], [T('Matières & textures', 'Materials & textures'), a.materials], [T('Caméra & cadrage', 'Camera & framing'), a.camera],
      [T('Interface', 'UI'), a.ui], [T('Typographie', 'Typography'), a.typography], [T('À faire', 'Do'), a.dos], [T('À éviter', "Don't"), a.donts], [T('Prompt de style', 'Style prompt'), a.stylePrompt]]
      .filter(([, v]) => v && String(v).trim());
    if (artRows.length) {
      out.push(`\n## ${T('Direction artistique', 'Art direction')}`);
      artRows.forEach(([k, v]) => out.push(`\n**${k}**\n\n${String(v).trim()}`));
    }
    const kept = p.ideas.filter((i) => i.status === 'keep' || i.status === 'done');
    if (kept.length) {
      out.push(`\n## ${T('Idées retenues', 'Kept ideas')}`);
      kept.forEach((i) => out.push(`- **${i.title || U.truncate(i.content, 60)}** — ${U.truncate((i.content || '').replace(/\s+/g, ' '), 400)}`));
    }
    if (p.tasks.length) {
      out.push(`\n## ${T('Tâches', 'Tasks')}`);
      const lab = { backlog: T('Backlog', 'Backlog'), todo: T('À faire', 'To do'), doing: T('En cours', 'In progress'), done: T('Terminé', 'Done') };
      p.tasks.forEach((t) => out.push(`- [${t.status === 'done' ? 'x' : ' '}] ${t.title} *(${lab[t.status] || t.status})*`));
    }
    return out.join('\n');
  }

  async function imgData(id, max = 900) {
    try {
      const rec = await GF.images.get(id);
      if (!rec) return '';
      const r = await U.resizeImage(rec.blob, max, 'image/jpeg', 0.85);
      return await U.blobToDataURL(r.blob);
    } catch (e) { return ''; }
  }

  async function buildHTML() {
    const p = S.project, m = p.meta;
    const md = GF.md.render;
    const cover = m.cover ? await imgData(m.cover, 1400) : '';
    let body = `<header class="cover">${cover ? `<img src="${cover}" alt="">` : ''}<h1>${U.esc(p.name)}</h1>${m.pitch ? `<p class="pitch">${U.esc(m.pitch)}</p>` : ''}
      <ul class="meta">${[[T('Genre', 'Genre'), m.genre], [T('Plateformes', 'Platforms'), m.platforms], [T('Moteur', 'Engine'), m.engine], [T('Public cible', 'Audience'), m.audience], [T('Équipe', 'Team'), m.team]]
        .filter(([, v]) => v).map(([k, v]) => `<li><b>${U.esc(k)}</b> ${U.esc(v)}</li>`).join('')}</ul></header>`;
    body += `<nav class="toc"><h2>${T('Sommaire', 'Contents')}</h2><ol>
      <li><a href="#gdd">Game Design Document</a></li><li><a href="#story">${T('Histoire', 'Story')}</a></li>
      ${SC.ENTITY_ORDER.filter((t) => p.entities[t].length).map((t) => `<li><a href="#${t}">${U.esc(L(SC.ENTITIES[t].label))}</a></li>`).join('')}
      <li><a href="#art">${T('Direction artistique', 'Art direction')}</a></li></ol></nav>`;
    body += `<section id="gdd"><h2>Game Design Document</h2>${p.gdd.sections.map((s, i) => `<h3>${i + 1}. ${U.esc(secTitle(s))}</h3>${s.content.trim() ? md(s.content.replace(/^(#{1,3}) /gm, '#### ')) : `<p class="todo">${T('À rédiger', 'To be written')}</p>`}`).join('')}</section>`;
    const st = p.story;
    body += `<section id="story"><h2>${T('Histoire', 'Story')}</h2>`;
    [['Logline', st.logline], [T('Synopsis', 'Synopsis'), st.synopsis], [T('Thèmes', 'Themes'), st.themes], [T('Ton', 'Tone'), st.tone],
      [T('Univers', 'Setting'), st.setting], [T('Conflit central', 'Central conflict'), st.conflict], [T('Fin(s)', 'Ending(s)'), st.ending]]
      .filter(([, v]) => v && v.trim()).forEach(([k, v]) => { body += `<h4>${U.esc(k)}</h4>${md(v)}`; });
    st.chapters.forEach((c, i) => {
      const chars = (c.characters || []).map((id) => S.entityName('characters', id)).filter(Boolean);
      body += `<h3>${i + 1}. ${U.esc(c.title || T('Sans titre', 'Untitled'))}</h3>${md(c.summary || '')}${md(c.content || '')}${chars.length ? `<p><b>${T('Personnages', 'Characters')} :</b> ${U.esc(chars.join(', '))}</p>` : ''}`;
    });
    body += `</section>`;
    for (const t of SC.ENTITY_ORDER) {
      const list = p.entities[t];
      if (!list.length) continue;
      body += `<section id="${t}"><h2>${U.esc(L(SC.ENTITIES[t].label))}</h2>`;
      for (const e of list) {
        const img = e.cover || e.images[0];
        const src = img ? await imgData(img) : '';
        body += `<article class="ent">${src ? `<img src="${src}" alt="">` : ''}<div><h3>${U.esc(e.fields.name || '?')}</h3>${md(GF.agent.entityText(t, e, { skipName: true }))}</div></article>`;
      }
      body += `</section>`;
    }
    const a = p.art;
    body += `<section id="art"><h2>${T('Direction artistique', 'Art direction')}</h2>`;
    if (a.styleName) body += `<h3>${U.esc(a.styleName)}</h3>`;
    if (a.summary) body += md(a.summary);
    if ((a.palette || []).length) body += `<div class="palette">${a.palette.map((c) => `<span style="background:${U.esc(c)}"><i>${U.esc(c)}</i></span>`).join('')}</div>`;
    [[T('Mots-clés', 'Keywords'), (a.keywords || []).join(', ')], [T('Références', 'References'), a.references], [T('Lumière', 'Lighting'), a.lighting],
      [T('Formes & silhouettes', 'Shapes & silhouettes'), a.shapes], [T('Matières & textures', 'Materials & textures'), a.materials], [T('Caméra & cadrage', 'Camera & framing'), a.camera],
      [T('Interface', 'UI'), a.ui], [T('Typographie', 'Typography'), a.typography], [T('À faire', 'Do'), a.dos], [T('À éviter', "Don't"), a.donts]]
      .filter(([, v]) => v && String(v).trim()).forEach(([k, v]) => { body += `<h4>${U.esc(k)}</h4>${md(String(v))}`; });
    if (a.moodboard.length) {
      body += `<div class="mood">`;
      for (const id of a.moodboard.slice(0, 24)) { const src = await imgData(id, 600); if (src) body += `<img src="${src}" alt="">`; }
      body += `</div>`;
    }
    body += `</section>`;
    return `<!doctype html><html lang="${GF.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${U.esc(p.name)} — GDD</title>
<style>
body{font-family:Segoe UI,system-ui,-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:32px 24px;color:#1b1d24;line-height:1.6;background:#fff}
h1{font-size:2.4em;margin:.3em 0}h2{border-bottom:3px solid #7c3aed;padding-bottom:6px;margin-top:2.2em}h3{color:#5b21b6;margin-top:1.6em}h4{margin:1.2em 0 .3em}
.cover img{width:100%;max-height:420px;object-fit:cover;border-radius:12px}.pitch{font-size:1.2em;font-style:italic;color:#444}
.meta{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px 20px}.meta b{color:#7c3aed;margin-right:4px}
.toc{background:#f5f3ff;padding:12px 24px;border-radius:10px}.todo{color:#999;font-style:italic}
.ent{display:grid;grid-template-columns:220px 1fr;gap:20px;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;page-break-inside:avoid}
.ent:not(:has(img)){grid-template-columns:1fr}.ent img{width:100%;border-radius:8px;object-fit:cover}.ent h3{margin-top:0}
.palette{display:flex;gap:8px;flex-wrap:wrap}.palette span{width:80px;height:80px;border-radius:8px;display:flex;align-items:flex-end;padding:4px;box-shadow:inset 0 0 0 1px #0002}
.palette i{font-size:11px;background:#fffc;padding:1px 4px;border-radius:4px;font-style:normal}
.mood{columns:3;gap:8px}.mood img{width:100%;margin-bottom:8px;border-radius:6px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}blockquote{border-left:4px solid #c4b5fd;margin:0;padding:4px 16px;color:#555}
code{background:#f3f4f6;padding:1px 5px;border-radius:4px}pre{background:#f3f4f6;padding:12px;border-radius:8px;overflow:auto}
@media print{body{padding:0}h2{page-break-before:always}.toc{page-break-after:always}a{color:inherit;text-decoration:none}}
@media (max-width:600px){.ent{grid-template-columns:1fr}.mood{columns:2}}
</style></head><body>${body}<footer><p style="color:#999;font-size:12px;margin-top:40px">GameForge Studio — ${U.fmtDate(Date.now())}</p></footer></body></html>`;
  }

  GF.exporter = {
    buildMarkdown,
    buildHTML,
    markdown() {
      U.download(`${U.slug(S.project.name)}-gdd.md`, buildMarkdown(), 'text/markdown;charset=utf-8');
      UI.toast(T('Markdown exporté', 'Markdown exported'), 'success');
    },
    async html() {
      UI.toast(T('Préparation du document…', 'Preparing document…'));
      const html = await buildHTML();
      U.download(`${U.slug(S.project.name)}-gdd.html`, html, 'text/html;charset=utf-8');
      UI.toast(T('Page HTML exportée', 'HTML page exported'), 'success');
    },
    async print() {
      const w = window.open('', '_blank');
      if (!w) { UI.toast(T('Autorise les fenêtres pop-up pour imprimer.', 'Allow pop-ups to print.'), 'error'); return; }
      w.document.write(`<p style="font-family:sans-serif;padding:40px">${T('Préparation du document…', 'Preparing document…')}</p>`);
      const html = await buildHTML();
      w.document.open(); w.document.write(html); w.document.close();
      setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* ignore */ } }, 600);
    },
  };
})();
