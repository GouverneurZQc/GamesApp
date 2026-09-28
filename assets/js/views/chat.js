/* Vue : assistant IA (conversations avec personas, contexte du projet et images) */
(function () {
  const U = GF.util, S = GF.store, UI = GF.ui;

  const QUICK = [
    ['Brainstorm : propose 10 mécaniques de gameplay originales et cohérentes avec mon jeu.', 'Brainstorm: propose 10 original gameplay mechanics consistent with my game.'],
    ['Quelles sont les failles de mon concept actuel ? Sois franc.', 'What are the flaws of my current concept? Be frank.'],
    ['Aide-moi à planifier un prototype jouable en 2 semaines : quoi construire, dans quel ordre, quoi ignorer.', 'Help me plan a playable prototype in 2 weeks: what to build, in what order, what to skip.'],
    ['Trouve 15 noms percutants pour mon jeu, avec une courte justification.', 'Find 15 punchy names for my game with a short rationale.'],
    ['Écris une description de page Steam accrocheuse (courte + longue) pour mon jeu.', 'Write a catchy Steam page description (short + long) for my game.'],
    ['Propose un système de progression motivant sur 20 heures de jeu.', 'Propose a motivating progression system over 20 hours of play.'],
    ['Comment rendre les moments clés de mon jeu plus mémorables ?', 'How can I make my game\'s key moments more memorable?'],
    ['Quels jeux dois-je absolument étudier pour mon projet, et pourquoi ?', 'Which games must I study for my project, and why?'],
  ];

  let current = null;
  let pendingImgs = [];

  GF.views.chat = {
    title: () => T('Assistant IA', 'AI assistant'),
    render(el, params) {
      const p = S.project;
      if (params.id && p.chats.find((c) => c.id === params.id)) current = params.id;
      if (!p.chats.find((c) => c.id === current)) current = p.chats[0] ? p.chats[0].id : null;
      const conv = p.chats.find((c) => c.id === current);
      const persona = conv ? conv.persona : (GF.views.chat._persona || 'designer');
      const withCtx = conv ? conv.context !== false : true;
      const P = GF.agent.PERSONAS;

      el.innerHTML = `
        <div class="chat-layout">
          <div class="chat-side card">
            <button class="btn primary block" id="newChat">${UI.icon('plus')} ${T('Nouvelle conversation', 'New conversation')}</button>
            <div class="list" id="chatList">${p.chats.map((c) => `
              <div class="list-item ${c.id === current ? 'active' : ''}" data-id="${c.id}">
                ${UI.icon(P[c.persona] ? P[c.persona].icon : 'chat')}
                <span class="li-body"><strong>${U.esc(c.title || T('Nouvelle conversation', 'New conversation'))}</strong><small>${U.esc(L((P[c.persona] || P.designer).label))} · ${U.relTime(c.updatedAt)}</small></span>
                <button class="btn icon sm ghost del" data-del="${c.id}" title="${T('Supprimer', 'Delete')}">${UI.icon('trash')}</button>
              </div>`).join('') || `<p class="muted pad small">${T('Aucune conversation.', 'No conversations.')}</p>`}</div>
          </div>
          <div class="chat-main">
            <div class="chat-top card">
              <label class="field"><span class="lbl">${T('L\'agent parle en tant que', 'The agent speaks as')}</span>
                <select class="input" id="persona">${Object.entries(P).map(([k, v]) => `<option value="${k}" ${k === persona ? 'selected' : ''}>${U.esc(L(v.label))}</option>`).join('')}</select></label>
              <label class="check"><input type="checkbox" id="ctx" ${withCtx ? 'checked' : ''}> ${T('Connaît tout mon projet (GDD, histoire, fiches, style)', 'Knows my whole project (GDD, story, sheets, style)')}</label>
            </div>
            <div class="chat-msgs" id="msgs">
              ${conv && conv.messages.length ? conv.messages.map((m, i) => msgHTML(m, i)).join('') : `
                <div class="chat-welcome">
                  ${UI.icon('sparkles', 'big')}
                  <h3>${T('Que veux-tu construire aujourd\'hui ?', 'What do you want to build today?')}</h3>
                  <p class="muted">${T('Pose n\'importe quelle question sur ton jeu. Joins des images si besoin (glisser, coller ou trombone).', 'Ask anything about your game. Attach images if needed (drag, paste or paperclip).')}</p>
                  <div class="chips">${QUICK.map((q, i) => `<button class="chip" data-q="${i}">${U.esc(L(q))}</button>`).join('')}</div>
                </div>`}
            </div>
            <div class="composer chat-composer" id="composer">
              <div class="thumbs sm" id="pImgs">${pendingImgs.map((id) => UI.tile(id, { actions: ['remove'] })).join('')}</div>
              <div class="row gap">
                <button class="btn icon ghost" id="attach" title="${T('Joindre des images', 'Attach images')}">${UI.icon('clip')}</button>
                <textarea class="input auto grow" id="input" rows="1" placeholder="${T('Écris ton message… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)', 'Type your message… (Enter to send, Shift+Enter for a new line)')}"></textarea>
                <button class="btn primary" id="send">${UI.icon('send')}</button>
              </div>
            </div>
          </div>
        </div>`;

      const msgsEl = el.querySelector('#msgs');
      msgsEl.scrollTop = msgsEl.scrollHeight;
      GF.images.hydrate(el);

      el.querySelector('#newChat').onclick = () => { current = null; pendingImgs = []; history.replaceState(null, '', '#/chat'); GF.views.chat._persona = el.querySelector('#persona').value; GF.app.route(); };
      el.querySelectorAll('#chatList .list-item').forEach((it) => {
        it.onclick = (e) => {
          if (e.target.closest('[data-del]')) return;
          current = it.dataset.id; history.replaceState(null, '', `#/chat/${current}`); GF.app.route();
        };
      });
      el.querySelectorAll('[data-del]').forEach((b) => {
        b.onclick = async () => {
          if (!(await UI.confirm(T('Supprimer cette conversation ?', 'Delete this conversation?'), { danger: true }))) return;
          p.chats = p.chats.filter((c) => c.id !== b.dataset.del);
          if (current === b.dataset.del) current = null;
          S.touch(); GF.app.route();
        };
      });
      el.querySelector('#persona').onchange = (e) => {
        GF.views.chat._persona = e.target.value;
        if (conv) { conv.persona = e.target.value; S.touch(); }
      };
      el.querySelector('#ctx').onchange = (e) => { if (conv) { conv.context = e.target.checked; S.touch(); } };

      const drawPending = () => {
        const box = el.querySelector('#pImgs');
        box.innerHTML = pendingImgs.map((id) => UI.tile(id, { actions: ['remove'] })).join('');
        GF.images.hydrate(box);
      };
      UI.bindTiles(el.querySelector('#pImgs'), { remove: (id) => { pendingImgs = pendingImgs.filter((x) => x !== id); drawPending(); } });
      const addFiles = async (files) => { pendingImgs.push(...(await UI.importImages(files))); drawPending(); };
      UI.setPaste(addFiles);
      UI.bindDrop(el.querySelector('#composer'), addFiles);
      UI.bindDrop(msgsEl, addFiles);
      el.querySelector('#attach').onclick = async () => {
        const ids = await UI.pickImages({ multiple: true, title: T('Joindre des images', 'Attach images') });
        if (ids && ids.length) { pendingImgs.push(...ids); drawPending(); }
      };

      const input = el.querySelector('#input');
      const send = async (text) => {
        text = (text ?? input.value).trim();
        if (!text && !pendingImgs.length) return;
        let c = p.chats.find((x) => x.id === current);
        if (!c) {
          c = { id: U.uid('chat_'), title: U.truncate(text || T('Images', 'Images'), 50), persona: el.querySelector('#persona').value, context: el.querySelector('#ctx').checked, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
          p.chats.unshift(c);
          current = c.id;
          history.replaceState(null, '', `#/chat/${c.id}`);
          S.touch();
        }
        const images = pendingImgs.slice();
        pendingImgs = [];
        input.value = '';
        UI.autoGrow(el);
        drawPending();
        const hist = c.messages.map((m) => ({ role: m.role, content: m.content, images: m.images }));
        const userMsg = { role: 'user', content: text || T('(voir images)', '(see images)'), images };
        c.messages.push(userMsg);
        const welcome = msgsEl.querySelector('.chat-welcome');
        if (welcome) welcome.remove();
        msgsEl.insertAdjacentHTML('beforeend', msgHTML(userMsg, c.messages.length - 1));
        GF.images.hydrate(msgsEl);
        msgsEl.scrollTop = msgsEl.scrollHeight;
        const wrap = document.createElement('div');
        wrap.className = 'msg ai';
        msgsEl.appendChild(wrap);
        const out = await GF.agent.run({
          into: wrap, prompt: userMsg.content, images, history: hist, persona: c.persona, context: c.context !== false, title: L((GF.agent.PERSONAS[c.persona] || GF.agent.PERSONAS.designer).label),
          ideaTitle: c.title,
          actions: [{ label: T('Ajouter au GDD', 'Add to GDD'), icon: 'book', onClick: (t) => addToGdd(t) }],
        });
        if (out) {
          c.messages.push({ role: 'assistant', content: out });
          c.updatedAt = Date.now();
          S.touch();
          const li = el.querySelector(`#chatList [data-id="${c.id}"]`);
          if (!li) GF.app.route();
        } else {
          c.messages.pop();
          S.touch();
        }
      };
      el.querySelector('#send').onclick = () => send();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
      });
      el.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => send(L(QUICK[+b.dataset.q])); });
      msgsEl.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-m]');
        if (!b) return;
        const c = p.chats.find((x) => x.id === current);
        const m = c && c.messages[+b.closest('.msg').dataset.i];
        if (!m) return;
        if (b.dataset.m === 'copy') { await U.copyText(m.content); UI.toast(T('Copié', 'Copied'), 'success'); }
        if (b.dataset.m === 'gdd') addToGdd(m.content);
        if (b.dataset.m === 'idea') GF.app.quickIdea(m.content);
      });
      setTimeout(() => input.focus(), 50);
    },
  };

  function msgHTML(m, i) {
    if (m.role === 'user') {
      return `<div class="msg user" data-i="${i}">${(m.images || []).length ? `<div class="thumbs sm">${m.images.map((id) => `<img data-img="${id}" alt="" class="msg-img">`).join('')}</div>` : ''}${U.esc(m.content)}</div>`;
    }
    return `<div class="msg ai" data-i="${i}"><div class="md">${GF.md.render(m.content)}</div>
      <div class="msg-actions">
        <button class="btn sm ghost" data-m="copy">${UI.icon('copy')} ${T('Copier', 'Copy')}</button>
        <button class="btn sm ghost" data-m="idea">${UI.icon('bulb')} ${T('En faire une idée', 'Make it an idea')}</button>
        <button class="btn sm ghost" data-m="gdd">${UI.icon('book')} ${T('Ajouter au GDD', 'Add to GDD')}</button>
      </div></div>`;
  }

  function addToGdd(content) {
    const secs = S.project.gdd.sections;
    const SC = GF.schemas;
    UI.modal({
      title: T('Ajouter au Game Design Doc', 'Add to Game Design Doc'),
      body: `<select class="input" id="gSec">${secs.map((s) => `<option value="${s.id}">${U.esc(s.key ? L(SC.gddDef(s.key).title) : s.title)}</option>`).join('')}</select>`,
      buttons: [
        { label: T('Annuler', 'Cancel'), cls: 'ghost' },
        { label: T('Ajouter', 'Add'), cls: 'primary', action: (c, root) => {
          const s = secs.find((x) => x.id === root.querySelector('#gSec').value);
          s.content = `${s.content.trim()}\n\n${content}`.trim();
          S.touch();
          UI.toast(T('Ajouté au GDD', 'Added to GDD'), 'success');
        } },
      ],
    });
  }
})();
