/* GameForge Studio — rendu Markdown léger et sûr (tout le HTML est échappé) */
(function () {
  const esc = GF.util.esc;

  function inline(s) {
    let out = esc(s);
    const codes = [];
    out = out.replace(/`([^`\n]+)`/g, (m, c) => { codes.push(`<code>${c}</code>`); return `\u0001${codes.length - 1}\u0001`; });
    out = out
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '[$1]($2)')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    out = out.replace(/\u0001(\d+)\u0001/g, (m, i) => codes[+i]);
    return out;
  }

  const isBlank = (l) => /^\s*$/.test(l);
  const reHeading = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
  const reHr = /^\s*(?:-\s*){3,}$|^\s*(?:\*\s*){3,}$|^\s*(?:_\s*){3,}$/;
  const reList = /^(\s*)([-*+•]|\d+[.)])\s+(.*)$/;
  const reQuote = /^\s*>\s?/;
  const reTableSep = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  const reCodePh = /^\u0000(\d+)\u0000$/;

  function parseList(lines, i) {
    const items = [];
    while (i < lines.length) {
      const l = lines[i];
      const m = l.match(reList);
      if (m) {
        items.push({ indent: m[1].replace(/\t/g, '    ').length, ordered: /\d/.test(m[2]), text: m[3] });
        i++;
        continue;
      }
      if (items.length && /^\s{2,}\S/.test(l) && !reList.test(l)) { items[items.length - 1].text += '\n' + l.trim(); i++; continue; }
      break;
    }
    let idx = 0;
    function level() {
      const base = items[idx].indent;
      const tag = items[idx].ordered ? 'ol' : 'ul';
      let out = `<${tag}>`;
      while (idx < items.length && items[idx].indent >= base) {
        if (items[idx].indent > base) {
          out = out.replace(/<\/li>$/, '') + level() + '</li>';
          continue;
        }
        const it = items[idx++];
        let txt = it.text;
        let cls = '';
        const task = txt.match(/^\[( |x|X)\]\s+(.*)$/);
        if (task) { txt = (task[1] === ' ' ? '☐ ' : '☑ ') + task[2]; cls = ' class="task"'; }
        out += `<li${cls}>${inline(txt).replace(/\n/g, '<br>')}</li>`;
      }
      return out + `</${tag}>`;
    }
    let html = '';
    while (idx < items.length) html += level();
    return { html, next: i };
  }

  function splitRow(row) {
    let r = row.trim();
    if (r.startsWith('|')) r = r.slice(1);
    if (r.endsWith('|')) r = r.slice(0, -1);
    return r.split('|').map((c) => c.trim());
  }

  function blocks(src, codeBlocks) {
    const lines = src.split('\n');
    let html = '';
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const ph = line.trim().match(reCodePh);
      if (ph) { html += codeBlocks[+ph[1]]; i++; continue; }
      if (isBlank(line)) { i++; continue; }
      let m;
      if ((m = line.match(reHeading))) {
        const lvl = Math.min(6, m[1].length);
        html += `<h${lvl}>${inline(m[2])}</h${lvl}>`;
        i++; continue;
      }
      if (reHr.test(line)) { html += '<hr>'; i++; continue; }
      if (reQuote.test(line)) {
        const q = [];
        while (i < lines.length && reQuote.test(lines[i])) { q.push(lines[i].replace(reQuote, '')); i++; }
        html += `<blockquote>${blocks(q.join('\n'), codeBlocks)}</blockquote>`;
        continue;
      }
      if (line.includes('|') && i + 1 < lines.length && reTableSep.test(lines[i + 1]) && lines[i + 1].includes('-')) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && !isBlank(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        html += '<div class="md-table"><table><thead><tr>' + head.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>' +
          rows.map((r) => '<tr>' + head.map((_, k) => `<td>${inline(r[k] || '')}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
        continue;
      }
      if (reList.test(line)) {
        const r = parseList(lines, i);
        html += r.html;
        i = r.next;
        continue;
      }
      const para = [];
      while (i < lines.length && !isBlank(lines[i]) && !reHeading.test(lines[i]) && !reQuote.test(lines[i]) &&
        !reList.test(lines[i]) && !reCodePh.test(lines[i].trim()) && !reHr.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      if (!para.length) { html += `<p>${inline(lines[i])}</p>`; i++; continue; }
      html += `<p>${inline(para.join('\n')).replace(/\n/g, '<br>')}</p>`;
    }
    return html;
  }

  GF.md = {
    render(src) {
      src = String(src || '').replace(/\r\n?/g, '\n');
      const codeBlocks = [];
      src = src.replace(/```[^\n]*\n([\s\S]*?)(?:```|$)/g, (m, code) => {
        codeBlocks.push(`<pre><code>${esc(code.replace(/\n$/, ''))}</code></pre>`);
        return `\n\u0000${codeBlocks.length - 1}\u0000\n`;
      });
      return blocks(src, codeBlocks);
    },
    /** Markdown -> texte brut approximatif */
    strip(src) {
      return String(src || '').replace(/[#*_`>~]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    },
  };
})();
