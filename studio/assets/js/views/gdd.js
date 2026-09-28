/* Vue : Game Design Document + export (Markdown, HTML, PDF) */
(function () {
  const U = DP.util, S = DP.store, UI = DP.ui, SC = DP.schemas;

  const secTitle = (s) => (s.key && SC.gddDef(s.key) ? L(SC.gddDef(s.key).title) : s.title || T('Section sans titre', 'Untitled section'));
  const secGuide = (s) => (s.key && SC.gddDef(s.key) ? L(SC.gddDef(s.key).guide) : '');
  const secTpl = (s) => (s.key && SC.gddDef(s.key) && SC.gddDef(s.key).template ? L(SC.gddDef(s.key).template) : '');
  const EXPORT_TYPES = ['characters', 'vehicles', 'locations', 'items', 'factions', 'quests', 'lore', 'tracks', 'dialogues', 'team'];

  DP.views.gdd = {
    title: () => T('Game Design Document', 'Game Design Document'),
    render(el, params) {
      const p = S.project;
      const secs = p.gdd.sections;
      let cur = (secs.find((s) => s.id === params.id) || secs[0] || {}).id;
      let mode = 'edit';

      el.innerHTML = `
        <div class="split">
          <div class="split-list card">
            <div id="gddProg"></div>
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
        if (!el.querySelector('#gddProg')) return;
        const filled = secs.filter((s) => U.words(s.content) >= 8).length;
        el.querySelector('#gddProg').innerHTML = `<div class="row"><strong>${filled}/${secs.length}</strong>&nbsp;<span class="muted small">${T('sections rédigées', 'sections written')}</span></div>
          <i class="bar"><b style="width:${secs.length ? (filled / secs.length) * 100 : 0}%"></b></i>`;
        listEl.innerHTML = secs.map((s, i) => {
          const w = U.words(s.content);
          return `<button class="list-item ${s.id === cur ? 'active' : ''}" data-id="${s.id}">
            <span class="dot ${w >= 80 ? 'full' : w >= 8 ? 'half' : ''}"></span>
            <span class="li-body"><strong>${i + 1}. ${U.esc(secTitle(s))}</strong><small>${w} ${T('mots', 'words')}</small></span>
          </button>`;
        }).join('');
        listEl.querySelectorAll('.list-item').forEach((b) => { b.onclick = () => { cur = b.dataset.id; history.replaceState(null, '', `#/gdd/${cur}`); renderList(); renderDetail(); }; });
      };
      const refreshList = U.debounce(renderList, 500);

      const renderDetail = () => {
        const s = secs.find((x) => x.id === cur);
        if (!s) { detailEl.innerHTML = UI.empty('book', T('Aucune section', 'No section')); return; }
        const idx = secs.indexOf(s);
        const guide = secGuide(s);
        const tpl = secTpl(s);
        detailEl.innerHTML = `
          <div class="card">
            <div class="row gap">
              ${s.key ? `<h2 class="grow sec-title">${U.esc(secTitle(s))}</h2>` : `<input class="title-input grow" id="sTitle" value="${U.esc(s.title)}" placeholder="${T('Titre de la section', 'Section title')}">`}
              <button class="btn icon ghost" id="sUp" title="${T('Monter', 'Move up')}" ${idx === 0 ? 'disabled' : ''}>${UI.icon('up')}</button>
              <button class="btn icon ghost" id="sDown" title="${T('Descendre', 'Move down')}" ${idx === secs.length - 1 ? 'disabled' : ''}>${UI.icon('down')}</button>
              <button class="btn icon ghost" id="sDel" title="${T('Supprimer (corbeille)', 'Delete (trash)')}">${UI.icon('trash')}</button>
            </div>
            ${guide ? `<div class="guide">${UI.icon('info')} <span>${U.esc(guide)}</span></div>` : ''}
            <div class="tabs">
              <button data-mode="edit" class="${mode === 'edit' ? 'on' : ''}">${UI.icon('edit')} ${T('Écrire', 'Write')}</button>
              <button data-mode="preview" class="${mode === 'preview' ? 'on' : ''}">${UI.icon('eye')} ${T('Aperçu', 'Preview')}</button>
              ${tpl ? `<button id="insTpl">${UI.icon('file')} ${T('Insérer le modèle', 'Insert template')}</button>` : ''}
              <span class="grow"></span><span class="muted small" id="wc">${U.words(s.content)} ${T('mots', 'words')} · Markdown</span>
            </div>
            ${mode === 'edit'
              ? `<textarea class="input auto doc" id="sContent" rows="16" placeholder="${T('Écris librement… (Markdown : ## titres, - listes, **gras**, | tableaux |)', 'Write freely… (Markdown: ## headings, - lists, **bold**, | tables |)')}">${U.esc(s.content)}</textarea>`
              : `<div class="md preview">${DP.md.render(s.content) || `<p class="muted">${T('Section vide.', 'Empty section.')}</p>`}</div>`}
          </div>`;

        UI.autoGrow(detailEl);
        const ta = detailEl.querySelector('#sContent');
        if (ta) ta.addEventListener('input', () => { s.content = ta.value; S.touch(); detailEl.querySelector('#wc').textContent = `${U.words(s.content)} ${T('mots', 'words')} · Markdown`; refreshList(); });
        const ti = detailEl.querySelector('#sTitle');
        if (ti) ti.addEventListener('input', () => { s.title = ti.value; S.touch(); refreshList(); });
        detailEl.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { mode = b.dataset.mode; renderDetail(); }; });
        const ins = detailEl.querySelector('#insTpl');
        if (ins) ins.onclick = () => { s.content = `${s.content.trim()}\n\n${tpl}`.trim(); S.touch(); mode = 'edit'; renderList(); renderDetail(); };
        detailEl.querySelector('#sUp').onclick = () => { secs.splice(idx, 1); secs.splice(idx - 1, 0, s); S.touch(); renderList(); renderDetail(); };
        detailEl.querySelector('#sDown').onclick = () => { secs.splice(idx, 1); secs.splice(idx + 1, 0, s); S.touch(); renderList(); renderDetail(); };
        detailEl.querySelector('#sDel').onclick = async () => {
          if (!(await UI.confirm(T(`Supprimer la section « ${secTitle(s)} » ? (restaurable depuis la corbeille)`, `Delete section "${secTitle(s)}"? (restorable from trash)`), { danger: true }))) return;
          S.trash('section', s);
          secs.splice(idx, 1); S.touch();
          cur = (secs[Math.max(0, idx - 1)] || {}).id;
          renderList(); renderDetail();
        };
      };

      el.querySelector('#addSec').onclick = async () => {
        const title = await UI.ask(T('Nouvelle section', 'New section'), { placeholder: T('ex. Système de réputation', 'e.g. Reputation system') });
        if (!title) return;
        const s = { id: U.uid('sec_'), key: null, title, content: '' };
        secs.push(s); S.touch(); cur = s.id; renderList(); renderDetail();
      };
      el.querySelector('#expMd').onclick = () => DP.exporter.markdown();
      el.querySelector('#expHtml').onclick = () => DP.exporter.html();
      el.querySelector('#expPdf').onclick = () => DP.exporter.print();
      renderList();
      renderDetail();
    },
  };

  /* ================= Export du document complet ================= */
  const metaRows = (m) => [[T('Genre', 'Genre'), m.genre], [T('Plateformes', 'Platforms'), m.platforms], [T('Moteur', 'Engine'), m.engine],
    [T('Public cible', 'Audience'), m.audience], [T('Équipe', 'Team'), m.team], [T('Sortie visée', 'Target release'), U.fmtDay(m.releaseDate)]].filter(([, v]) => v);
  const storyRows = (st) => [['Logline', st.logline], [T('Synopsis', 'Synopsis'), st.synopsis], [T('Univers', 'Setting'), st.setting],
    [T('Conflit central', 'Central conflict'), st.conflict], [T('Thèmes', 'Themes'), st.themes], [T('Ton', 'Tone'), st.tone], [T('Fin(s)', 'Ending(s)'), st.ending]].filter(([, v]) => v && v.trim());
  const artRows = (a) => [[T('Style', 'Style'), a.styleName], [T('Résumé', 'Summary'), a.summary], [T('Mots-clés', 'Keywords'), (a.keywords || []).join(', ')],
    [T('Références', 'References'), a.references], [T('Palette', 'Palette'), (a.palette || []).join('  ')], [T('Lumière', 'Lighting'), a.lighting],
    [T('Formes & silhouettes', 'Shapes & silhouettes'), a.shapes], [T('Matières & textures', 'Materials & textures'), a.materials], [T('Caméra & cadrage', 'Camera & framing'), a.camera],
    [T('Interface', 'UI'), a.ui], [T('Typographie', 'Typography'), a.typography], [T('À faire', 'Do'), a.dos], [T('À éviter', "Don't"), a.donts]].filter(([, v]) => v && String(v).trim());

  function buildMarkdown() {
    const p = S.project, m = p.meta, out = [];
    out.push(`# ${p.name}`);
    if (m.pitch) out.push(`> ${m.pitch.replace(/\n/g, '\n> ')}`);
    const meta = metaRows(m);
    if (meta.length) out.push(meta.map(([k, v]) => `- **${k}** : ${v}`).join('\n'));
    out.push(`*${T('Document généré par DevPortals le', 'Document generated by DevPortals on')} ${U.fmtDate(Date.now())}*`);
    out.push(`\n## Game Design Document`);
    p.gdd.sections.forEach((s, i) => {
      out.push(`\n### ${i + 1}. ${secTitle(s)}\n`);
      out.push(s.content.trim() ? s.content.trim().replace(/^(#{1,3}) /gm, '#### ') : `*${T('À rédiger', 'To be written')}*`);
    });
    const st = p.story;
    out.push(`\n## ${T('Histoire', 'Story')}`);
    storyRows(st).forEach(([k, v]) => out.push(`\n**${k}**\n\n${v.trim()}`));
    st.chapters.forEach((c, i) => {
      out.push(`\n#### ${i + 1}. ${c.title || T('Sans titre', 'Untitled')}`);
      if (c.summary) out.push(c.summary.trim());
      if (c.content) out.push(c.content.trim());
      const chars = (c.characters || []).map((id) => S.entityName('characters', id)).filter(Boolean);
      if (chars.length) out.push(`- **${T('Personnages', 'Characters')}** : ${chars.join(', ')}`);
      const firsts = SC.ENTITY_ORDER.flatMap((t) => p.entities[t].filter((e) => e.fields.firstChapter === c.id).map((e) => e.fields.name)).filter(Boolean);
      if (firsts.length) out.push(`- **${T('Premières apparitions', 'First appearances')}** : ${firsts.join(', ')}`);
    });
    for (const t of EXPORT_TYPES) {
      const list = p.entities[t];
      if (!list.length) continue;
      out.push(`\n## ${L(SC.ENTITIES[t].label)}`);
      list.forEach((e) => out.push('\n' + DP.format.entityText(t, e, { heading: '###' })));
    }
    const ar = artRows(p.art);
    if (ar.length) { out.push(`\n## ${T('Direction artistique', 'Art direction')}`); ar.forEach(([k, v]) => out.push(`\n**${k}**\n\n${String(v).trim()}`)); }
    const kept = p.ideas.filter((i) => i.status === 'keep' || i.status === 'done');
    if (kept.length) { out.push(`\n## ${T('Idées retenues', 'Kept ideas')}`); kept.forEach((i) => out.push(`- **${i.title || U.truncate(i.content, 60)}** — ${U.truncate((i.content || '').replace(/\s+/g, ' '), 400)}`)); }
    if (p.milestones.length) {
      out.push(`\n## ${T('Jalons', 'Milestones')}`);
      p.milestones.forEach((ms) => out.push(`- [${ms.done ? 'x' : ' '}] **${ms.title}**${ms.date ? ` — ${U.fmtDay(ms.date)}` : ''}${ms.description ? ` : ${ms.description}` : ''}`));
    }
    return out.join('\n');
  }

  async function imgData(id, max = 900) {
    try {
      const rec = await DP.media.get(id);
      if (!rec || rec.kind === 'audio') return '';
      const r = await U.resizeImage(rec.blob, max, 'image/jpeg', 0.85);
      return await U.blobToDataURL(r.blob);
    } catch (e) { return ''; }
  }

  async function buildHTML() {
    const p = S.project, m = p.meta;
    const md = DP.md.render;
    const accent = (SC.ACCENTS[S.settings.accent] || SC.ACCENTS.violet)[0];
    const cover = m.cover ? await imgData(m.cover, 1400) : '';
    let body = `<header class="cover">${cover ? `<img src="${cover}" alt="">` : ''}<h1>${U.esc(p.name)}</h1>${m.pitch ? `<p class="pitch">${U.esc(m.pitch)}</p>` : ''}
      <ul class="meta">${metaRows(m).map(([k, v]) => `<li><b>${U.esc(k)}</b> ${U.esc(v)}</li>`).join('')}</ul></header>`;
    const types = EXPORT_TYPES.filter((t) => p.entities[t].length);
    body += `<nav class="toc"><h2>${T('Sommaire', 'Contents')}</h2><ol><li><a href="#gdd">Game Design Document</a></li><li><a href="#story">${T('Histoire', 'Story')}</a></li>
      ${types.map((t) => `<li><a href="#${t}">${U.esc(L(SC.ENTITIES[t].label))}</a></li>`).join('')}<li><a href="#art">${T('Direction artistique', 'Art direction')}</a></li></ol></nav>`;
    body += `<section id="gdd"><h2>Game Design Document</h2>${p.gdd.sections.map((s, i) => `<h3>${i + 1}. ${U.esc(secTitle(s))}</h3>${s.content.trim() ? md(s.content.replace(/^(#{1,3}) /gm, '#### ')) : `<p class="todo">${T('À rédiger', 'To be written')}</p>`}`).join('')}</section>`;
    body += `<section id="story"><h2>${T('Histoire', 'Story')}</h2>`;
    storyRows(p.story).forEach(([k, v]) => { body += `<h4>${U.esc(k)}</h4>${md(v)}`; });
    p.story.chapters.forEach((c, i) => {
      const chars = (c.characters || []).map((id) => S.entityName('characters', id)).filter(Boolean);
      body += `<h3>${i + 1}. ${U.esc(c.title || T('Sans titre', 'Untitled'))}</h3>${md(c.summary || '')}${md(c.content || '')}${chars.length ? `<p><b>${T('Personnages', 'Characters')} :</b> ${U.esc(chars.join(', '))}</p>` : ''}`;
    });
    body += `</section>`;
    for (const t of types) {
      body += `<section id="${t}"><h2>${U.esc(L(SC.ENTITIES[t].label))}</h2>`;
      for (const e of p.entities[t]) {
        const img = e.cover || e.images[0];
        const src = img ? await imgData(img) : '';
        body += `<article class="ent">${src ? `<img src="${src}" alt="">` : ''}<div><h3>${U.esc(e.fields.name || '?')}</h3>${md(DP.format.entityText(t, e, { skipName: true }))}</div></article>`;
      }
      body += `</section>`;
    }
    const a = p.art;
    body += `<section id="art"><h2>${T('Direction artistique', 'Art direction')}</h2>`;
    if ((a.palette || []).length) body += `<div class="palette">${a.palette.map((c) => `<span style="background:${U.esc(c)}"><i>${U.esc(c)}</i></span>`).join('')}</div>`;
    artRows(a).filter(([k]) => k !== T('Palette', 'Palette')).forEach(([k, v]) => { body += `<h4>${U.esc(k)}</h4>${md(String(v))}`; });
    if (a.moodboard.length) {
      body += `<div class="mood">`;
      for (const id of a.moodboard.slice(0, 24)) { const src = await imgData(id, 600); if (src) body += `<img src="${src}" alt="">`; }
      body += `</div>`;
    }
    body += `</section>`;
    return `<!doctype html><html lang="${DP.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${U.esc(p.name)} — GDD</title>
<style>
body{font-family:Segoe UI,system-ui,-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:32px 24px;color:#1b1b1b;line-height:1.6;background:#fff}
h1{font-size:2.4em;margin:.3em 0}h2{border-bottom:3px solid ${accent};padding-bottom:6px;margin-top:2.2em}h3{margin-top:1.6em}h4{margin:1.2em 0 .3em}
.cover img{width:100%;max-height:420px;object-fit:cover;border-radius:12px}.pitch{font-size:1.2em;font-style:italic;color:#444}
.meta{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px 20px}.meta b{color:${accent};margin-right:4px}
.toc{background:#f4f4f4;padding:12px 24px;border-radius:10px}.todo{color:#999;font-style:italic}
.ent{display:grid;grid-template-columns:220px 1fr;gap:20px;border:1px solid #e5e5e5;border-radius:12px;padding:16px;margin:16px 0;page-break-inside:avoid}
.ent:not(:has(img)){grid-template-columns:1fr}.ent img{width:100%;border-radius:8px;object-fit:cover}.ent h3{margin-top:0}
.palette{display:flex;gap:8px;flex-wrap:wrap}.palette span{width:80px;height:80px;border-radius:8px;display:flex;align-items:flex-end;padding:4px;box-shadow:inset 0 0 0 1px #0002}
.palette i{font-size:11px;background:#fffc;padding:1px 4px;border-radius:4px;font-style:normal}
.mood{columns:3;gap:8px}.mood img{width:100%;margin-bottom:8px;border-radius:6px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}blockquote{border-left:4px solid ${accent};margin:0;padding:4px 16px;color:#555}
code{background:#f3f3f3;padding:1px 5px;border-radius:4px}pre{background:#f3f3f3;padding:12px;border-radius:8px;overflow:auto}
@media print{body{padding:0}h2{page-break-before:always}.toc{page-break-after:always}a{color:inherit;text-decoration:none}}
@media (max-width:600px){.ent{grid-template-columns:1fr}.mood{columns:2}}
</style></head><body>${body}<footer><p style="color:#999;font-size:12px;margin-top:40px">DevPortals — ${U.fmtDate(Date.now())}</p></footer></body></html>`;
  }

  DP.exporter = {
    buildMarkdown, buildHTML,
    markdown() {
      U.download(`${U.slug(S.project.name)}-gdd.md`, buildMarkdown(), 'text/markdown;charset=utf-8');
      UI.toast(T('Markdown exporté', 'Markdown exported'), 'success');
    },
    async html() {
      UI.toast(T('Préparation du document…', 'Preparing document…'));
      U.download(`${U.slug(S.project.name)}-gdd.html`, await buildHTML(), 'text/html;charset=utf-8');
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
