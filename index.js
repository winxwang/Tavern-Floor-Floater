(() => {
  'use strict';
  const ID = 'tavern-floor-floater';
  if (document.getElementById(ID)) return;
  const state = { messages: [], current: null, minimized: false, dragging: false, filter: 'all' };
  const positionKey = 'tavern-floor-floater-position-v1';
  let refreshQueued = false;
  let refreshTimer = null;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(positionKey) || '{}'); } catch {}

  const panel = document.createElement('section');
  panel.id = ID;
  panel.setAttribute('aria-label', '酒馆楼层导航悬浮窗');
  panel.innerHTML = [
    '<div class="tff-head" title="按住此处拖动"><span class="tff-grip" aria-hidden="true">⠿</span><span class="tff-title">楼层导航</span><span class="tff-version">v1.2.4</span><span class="tff-count">—/0</span><button class="tff-latest tff-head-latest" type="button" title="跳转到最新 AI 回复">最新 AI 回复</button><button class="tff-icon tff-min" type="button" title="折叠" aria-label="折叠">−</button></div>',
    '<div class="tff-body">',
    '<div class="tff-search-row"><input class="tff-search" type="search" placeholder="搜索系统楼层编号…" aria-label="搜索系统楼层编号"><button class="tff-icon tff-clear" type="button" title="清空搜索" aria-label="清空搜索">×</button></div>',
    '<div class="tff-filter-row" role="group" aria-label="消息类型筛选"><button class="tff-filter is-active" data-filter="all" type="button">全部消息</button><button class="tff-filter" data-filter="user" type="button">用户消息</button><button class="tff-filter" data-filter="assistant" type="button">AI 消息</button></div>',
    '<div class="tff-row"><button class="tff-icon tff-prev" type="button" title="上一条消息">↑</button><input class="tff-number" type="number" step="1" value="0" aria-label="酒馆系统楼层编号"><button class="tff-go" type="button">跳转</button><button class="tff-icon tff-next" type="button" title="下一条消息">↓</button></div>',
    '<div class="tff-row tff-secondary"><button class="tff-first" type="button">最早消息</button></div>',
    '<section class="tff-latest-preview"><div class="tff-preview-head"><span>最新 AI 回复</span><span class="tff-preview-floor">—</span></div><div class="tff-preview-text">尚未检测到 AI 回复</div></section>',
    '<div class="tff-results" aria-live="polite"></div><div class="tff-hint">仅在新消息更新时提取最新 AI 回复的前 420 个字符；楼层列表不读取正文</div></div>'
  ].join('');
  document.body.appendChild(panel);
  if (Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
    panel.style.left = saved.left + 'px'; panel.style.top = saved.top + 'px';
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
  }

  const $ = s => panel.querySelector(s);
  const input = $('.tff-number'), search = $('.tff-search'), count = $('.tff-count'), results = $('.tff-results');
  const previewText = $('.tff-preview-text'), previewFloor = $('.tff-preview-floor');
  let previewedLatestEl = null;

  function readShortPreview(messageEl, limit = 420) {
    const root = messageEl.querySelector('.mes_text') || messageEl;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let text = '', node;
    while (text.length < limit && (node = walker.nextNode())) {
      const part = (node.nodeValue || '').replace(/\\s+/g, ' ');
      if (part) text += (text ? ' ' : '') + part.slice(0, limit - text.length);
    }
    text = text.trim();
    return text.length >= limit ? text.slice(0, limit).trimEnd() + '…' : (text || '这条 AI 回复没有可显示的文本');
  }

  function renderLatestPreview() {
    const latest = [...state.messages].reverse().find(message => message.role === 'assistant');
    if (!latest) {
      previewedLatestEl = null;
      previewFloor.textContent = '—';
      previewText.textContent = '尚未检测到 AI 回复';
      return;
    }
    previewedLatestEl = latest.el;
    previewFloor.textContent = '楼层 ' + latest.floor;
    // MutationObserver 会在 AI 流式输出时触发刷新；每次只读取前 420 个字符。
    previewText.textContent = readShortPreview(latest.el);
    previewText.title = '点击跳转到最新 AI 回复';
    previewText.onclick = () => jumpTo(latest.floor);
  }

  function roleOf(el) {
    const role = (el.getAttribute('data-is_user') || '').toLowerCase();
    if (role === 'true') return 'user';
    if (role === 'false') return 'assistant';
    if (el.classList.contains('is_user') || el.classList.contains('mes_user')) return 'user';
    if (el.classList.contains('is_system')) return 'system';
    const avatar = el.querySelector('.mesAvatarWrapper img, .mesAvatarWrapper .avatar');
    const alt = (avatar && avatar.getAttribute('alt') || '').toLowerCase();
    if (alt.includes('user') || alt.includes('用户')) return 'user';
    return 'assistant';
  }
  function getMessages() {
    return Array.from(document.querySelectorAll('#chat .mes'))
      .filter(el => el.isConnected && el.getClientRects().length > 0)
      .map((el, index) => {
        const rawId = el.getAttribute('mesid') ?? el.dataset.mesid;
        const parsedId = rawId !== null && rawId !== '' ? Number(rawId) : NaN;
        return { el, floor: Number.isFinite(parsedId) ? parsedId : index, role: roleOf(el) };
      })
      .sort((a, b) => a.floor - b.floor);
  }
  function roleLabel(role) { return role === 'user' ? '用户' : role === 'system' ? '系统' : 'AI'; }
  function roleIcon(role) { return role === 'user' ? '我' : role === 'system' ? '系' : 'AI'; }
  function currentVisibleFloor() {
    const item = state.messages.find(({ el }) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 20 && r.top < window.innerHeight - 20;
    });
    return item ? item.floor : state.current;
  }
  function filteredMessages() {
    const query = search.value.trim().toLocaleLowerCase();
    return state.messages.filter(item =>
      (state.filter === 'all' || item.role === state.filter) &&
      (!query || String(item.floor).includes(query) || roleLabel(item.role).toLocaleLowerCase().includes(query))
    );
  }
  function renderResults() {
    const matches = filteredMessages();
    results.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'tff-empty';
      empty.textContent = state.messages.length ? '没有匹配的消息' : '尚未检测到聊天消息';
      results.appendChild(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tff-result' + (item.floor === state.current ? ' is-current' : '');
      button.title = '跳转到酒馆系统编号 ' + item.floor;
      const role = document.createElement('span');
      role.className = 'tff-role tff-role-' + item.role;
      role.textContent = roleIcon(item.role);
      const floor = document.createElement('span');
      floor.className = 'tff-result-floor';
      floor.textContent = String(item.floor);
      const label = document.createElement('span');
      label.className = 'tff-snippet';
      label.textContent = roleLabel(item.role) + '消息';
      button.append(role, floor, label);
      button.addEventListener('click', () => jumpTo(item.floor));
      fragment.appendChild(button);
    }
    results.appendChild(fragment);
  }
  function update() {
    const total = state.messages.length;
    state.current = total ? (currentVisibleFloor() ?? state.messages[0].floor) : null;
    const currentIndex = state.messages.findIndex(item => item.floor === state.current);
    count.textContent = (state.current === null ? '—' : state.current) + '/' + total;
    input.min = String(total ? Math.min(...state.messages.map(item => item.floor)) : 0);
    input.max = String(total ? Math.max(...state.messages.map(item => item.floor)) : 0);
    if (document.activeElement !== input) input.value = String(state.current ?? '');
    $('.tff-prev').disabled = currentIndex <= 0;
    $('.tff-next').disabled = currentIndex < 0 || currentIndex >= total - 1;
    $('.tff-first').disabled = currentIndex <= 0;
    $('.tff-latest').disabled = total < 1;
    $('.tff-go').disabled = total < 1;
    renderResults();
  }
  function refresh() { state.messages = getMessages(); update(); renderLatestPreview(); }
  function scheduleRefresh() {
    if (refreshTimer !== null) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { refreshTimer = null; refresh(); }, 120);
  }
  function jumpTo(number) {
    state.messages = getMessages();
    const requested = Number(number);
    if (!state.messages.length || !Number.isFinite(requested)) { update(); return; }
    let target = state.messages.find(item => item.floor === Math.trunc(requested));
    if (!target) {
      target = state.messages.reduce((best, item) =>
        Math.abs(item.floor - requested) < Math.abs(best.floor - requested) ? item : best, state.messages[0]);
    }
    target.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    state.current = target.floor;
    input.value = String(target.floor);
    count.textContent = target.floor + '/' + state.messages.length;
    renderResults();
  }
  function step(direction) {
    state.messages = getMessages();
    const index = state.messages.findIndex(item => item.floor === state.current);
    const next = Math.max(0, Math.min(state.messages.length - 1, (index < 0 ? 0 : index) + direction));
    if (state.messages[next]) jumpTo(state.messages[next].floor);
  }
  function latestReply() {
    state.messages = getMessages();
    const item = [...state.messages].reverse().find(message => message.role === 'assistant');
    if (item) jumpTo(item.floor);
  }

  $('.tff-go').addEventListener('click', () => jumpTo(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') jumpTo(input.value); });
  $('.tff-prev').addEventListener('click', () => step(-1));
  $('.tff-next').addEventListener('click', () => step(1));
  $('.tff-first').addEventListener('click', () => {
    state.messages = getMessages();
    if (state.messages[0]) jumpTo(state.messages[0].floor);
  });
  $('.tff-latest').addEventListener('click', latestReply);
  search.addEventListener('input', renderResults);
  $('.tff-clear').addEventListener('click', () => { search.value = ''; renderResults(); search.focus(); });
  panel.querySelectorAll('.tff-filter').forEach(button => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      panel.querySelectorAll('.tff-filter').forEach(b => b.classList.toggle('is-active', b === button));
      renderResults();
    });
  });
  $('.tff-min').addEventListener('click', () => {
    state.minimized = !state.minimized;
    panel.classList.toggle('tff-minimized', state.minimized);
    $('.tff-min').textContent = state.minimized ? '+' : '−';
    $('.tff-min').title = state.minimized ? '展开' : '折叠';
    $('.tff-min').setAttribute('aria-label', state.minimized ? '展开' : '折叠');
  });

  const head = $('.tff-head');
  head.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    state.dragging = true;
    const rect = panel.getBoundingClientRect();
    panel.style.left = rect.left + 'px'; panel.style.top = rect.top + 'px';
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
    panel.dataset.dragX = String(e.clientX - rect.left);
    panel.dataset.dragY = String(e.clientY - rect.top);
    head.classList.add('tff-dragging');
    try { head.setPointerCapture(e.pointerId); } catch {}
  });
  head.addEventListener('pointermove', e => {
    if (!state.dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, e.clientX - Number(panel.dataset.dragX)));
    const y = Math.max(0, Math.min(window.innerHeight - 36, e.clientY - Number(panel.dataset.dragY)));
    panel.style.left = x + 'px'; panel.style.top = y + 'px';
  });
  function stopDrag() {
    if (!state.dragging) return;
    state.dragging = false; head.classList.remove('tff-dragging');
    const r = panel.getBoundingClientRect();
    try { localStorage.setItem(positionKey, JSON.stringify({ left: r.left, top: r.top })); } catch {}
  }
  head.addEventListener('pointerup', stopDrag);
  head.addEventListener('pointercancel', stopDrag);

  const chat = document.querySelector('#chat');
  if (chat) {
    chat.addEventListener('scroll', () => {
      if (refreshQueued) return;
      refreshQueued = true;
      requestAnimationFrame(() => { update(); refreshQueued = false; });
    }, { passive: true });
    new MutationObserver(scheduleRefresh).observe(chat, { childList: true, subtree: true });
  }
  window.addEventListener('resize', scheduleRefresh);
  refresh();
  setTimeout(refresh, 500);
  setTimeout(refresh, 1500);
})();