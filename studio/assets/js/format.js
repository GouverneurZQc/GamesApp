/* DevPortals — mise en forme des fiches (texte, Markdown, portail) */
(function () {
  const U = DP.util, S = DP.store, SC = DP.schemas;

  function isEmpty(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); }

  /** Valeur lisible d'un champ */
  function fieldText(type, fd, v) {
    if (isEmpty(v)) return '';
    switch (fd.type) {
      case 'select': { const o = (fd.options || []).find((x) => x.v === v); return o ? L(o.l) : v; }
      case 'tags': return Array.isArray(v) ? v.join(', ') : v;
      case 'ref': return S.entityName(fd.ref, v);
      case 'refs': return (v || []).map((id) => S.entityName(fd.ref, id)).filter(Boolean).join(', ');
      case 'chapter': return S.chapterLabel(v);
      case 'rating': return `${v}/10`;
      case 'date': return U.fmtDay(v);
      case 'audio': return T('(fichier audio)', '(audio file)');
      case 'kv': return (v || []).filter((r) => r.k || r.v).map((r) => `${r.k}: ${r.v}`).join(' ; ');
      case 'relations': return (v || []).filter((r) => r.id).map((r) => `${S.entityName('characters', r.id)}${r.type ? ` (${r.type})` : ''}`).join(' ; ');
      default: return String(v);
    }
  }

  function entityText(type, e, { heading = '###', skipName = false, publicOnly = false } = {}) {
    const def = SC.ENTITIES[type];
    const lines = [];
    if (!skipName) lines.push(`${heading} ${e.fields.name || T('(sans nom)', '(unnamed)')}`);
    if (publicOnly && e.publicText) lines.push(e.publicText);
    for (const g of def.groups) {
      for (const fd of g.fields) {
        if (fd.key === 'name' || fd.type === 'audio' || (publicOnly && fd.priv)) continue;
        const t = fieldText(type, fd, e.fields[fd.key]);
        if (t) lines.push(fd.type === 'textarea' || fd.type === 'script' ? `- **${L(fd.label)}** :\n\n  ${t.replace(/\n/g, '\n  ')}` : `- **${L(fd.label)}** : ${t}`);
      }
    }
    return lines.join('\n');
  }

  /** Fiche -> données pour le portail joueurs (uniquement champs publics) */
  function entityPortal(type, e, isPublic) {
    const def = SC.ENTITIES[type];
    const groups = [];
    for (const g of def.groups) {
      const fields = [];
      for (const fd of g.fields) {
        if (fd.key === 'name' || fd.priv || fd.type === 'audio') continue;
        const v = e.fields[fd.key];
        if (isEmpty(v)) continue;
        const item = { label: L(fd.label), type: fd.type };
        if (fd.type === 'ref' || fd.type === 'refs') {
          const ids = fd.type === 'ref' ? [v] : v;
          item.links = ids.map((id) => ({ type: fd.ref, id, name: S.entityName(fd.ref, id), public: isPublic(fd.ref, id) })).filter((x) => x.name);
          if (!item.links.length) continue;
        } else if (fd.type === 'relations') {
          item.links = v.filter((r) => r.id).map((r) => ({ type: 'characters', id: r.id, name: S.entityName('characters', r.id), note: r.type, public: isPublic('characters', r.id) })).filter((x) => x.name);
          if (!item.links.length) continue;
        } else if (fd.type === 'rating') {
          item.value = +v || 0;
        } else if (fd.type === 'kv') {
          item.rows = v.filter((r) => r.k || r.v);
          if (!item.rows.length) continue;
        } else if (fd.type === 'tags') {
          item.tags = v;
        } else {
          item.value = fieldText(type, fd, v);
        }
        fields.push(item);
      }
      if (fields.length) groups.push({ label: L(g.label), fields });
    }
    return groups;
  }

  /** Texte court de présentation d'une fiche */
  function blurb(e) {
    const x = e.fields;
    return e.publicText || x.description || x.summary || x.personality || x.appearance || x.bio || x.effect || x.ideology || x.usage || x.mood || '';
  }

  DP.format = { fieldText, entityText, entityPortal, blurb, isEmpty };
})();
