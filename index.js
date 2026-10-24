(() => {
  'use strict';
  const ID = 'tavern-floor-floater';
  if (document.getElementById(ID)) return;
  const state = { messages: [], current: 0, minimized: false, dragging: false, filter: 'all' };
  const positionKey = 'tavern-floor-floater-position-v1';
  let refreshQueued = false;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(positionKey) || '{}'); } catch {}

  const panel = document.createElement('section');
  panel.id = ID;
  panel.setAttribute('aria-label', '酒馆楼层导航悬浮窗');
  panel.innerHTML = [
    '<div class="tff-head" title="按住此处拖动"><span class="tff-grip" aria-hidden="true">⠿</span><span class="tff-title">楼层</span><span class="tff-count">0/0</span><button class="tff-icon tff-min" type="button" title="折叠" aria-label="折叠">−</button></div>',
    '<div class="tff-body">',
    '<div class="tff-search-row"><input class="tff-search" type="search" placeholder="搜索楼层 / 内容…" aria-label="搜索楼层或消息内容"><button class="tff-icon tff-clear" type="button" title="清空搜索" aria-label="清空搜索">×</button></div>',
    '<div class="tff-filter-row" role="group" aria-label="消息类型筛选"><button class="tff-filter is-active" data-filter="all" type="button">全部</button><button class="tff-filter" data-filter="user" type="button">用户</button><button class="tff-filter" data-filter="assistant" type="button">AI</button></div>',
    '<div class="tff-row"><button class="tff-icon tff-prev" type="button" title="上一条">↑</button><input class="tff-number" type="number" min="1" step="1" value="1" aria-label="楼层编号"><button class="tff-go" type="button">跳转</button><button class="tff-icon tff-next" type="button" title="下一条">↓</button></div>',
    '<div class="tff-row tff-secondary"><button class="tff-first" type="button">首楼</button><button class="tff-latest" type="button">最新回复 ↓</button></div>',
    '<div class="tff-results" aria-live="polite"></div><div class="tff-hint">楼层序号沿用聊天页面当前消息顺序</div></div>'
  ].join('');
  document.body.appendChild(panel);
  if (Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
    panel.style.left = saved.left + 'px'; panel.style.top = saved.top + 'px';
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
  }

  const $ = s => panel.querySelector(s);
  const input = $('.tff-number'), search = $('.tff-search'), count = $('.tff-count'), results = $('.tff-results');

  function getMessages() {
    return Array.from(document.querySelectorAll('#chat .mes'))
      .filter(el => el.isConnected && el.getClientRects().length > 0);
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
  function textOf(el) {
    const body = el.querySelector('.mes_text, .mesText, .message_text');
    return ((body || el).innerText || '').replace(/\s+/g, ' ').trim();
  }
  function roleLabel(role) { return role === 'user' ? '用户' : role === 'system' ? '系统' : 'AI'; }
  function roleIcon(role) { return role === 'user' ? '我' : role === 'system' ? '系' : 'AI'; }
  function currentVisibleFloor() {
    const idx = state.messages.findIndex(el => {
      const r = el.getBoundingClientRect();
      return r.bottom > 20 && r.top < window.innerHeight - 20;
    });
    return idx >= 0 ? idx + 1 : state.current;
  }
  function filteredMessages() {
    const query = search.value.trim().toLocaleLowerCase();
    return state.messages.map((el, i) => ({ el, floor: i + 1, role: roleOf(el), text: textOf(el) }))
      .filter(item => {
        if (state.filter !== 'all' && item.role !== state.filter) return false;
        if (!query) return true;
        return String(item.floor).includes(query) ||
          roleLabel(item.role).toLocaleLowerCase().includes(query) ||
          item.text.toLocaleLowerCase().includes(query);
      });
  }
  function renderResults() {
    const matches = filteredMessages();
    results.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'tff-empty';
      empty.textContent = state.messages.length ? '没有匹配的楼层' : '尚未检测到聊天消息';
      results.appendChild(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of matches.slice(0, 30)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tff-result' + (item.floor === state.current ? ' is-current' : '');
      button.title = '跳转到第 ' + item.floor + ' 条消息';
      const role = document.createElement('span');
      role.className = 'tff-role tff-role-' + item.role; role.textContent = roleIcon(item.role);
      const floor = document.createElement('span');
      floor.className = 'tff-result-floor'; floor.textContent = String(item.floor);
      const snippet = document.createElement('span');
      snippet.className = 'tff-snippet'; snippet.textContent = item.text || '（无文本内容）';
      button.append(role, floor, snippet);
      button.addEventListener('click', () => jumpTo(item.floor));
      fragment.appendChild(button);
    }
    results.appendChild(fragment);
    if (matches.length > 30) {
      const more = document.createElement('div');
      more.className = 'tff-more';
      more.textContent = '共 ' + matches.length + ' 条匹配，当前显示前 30 条；可输入楼层号精确定位';
      results.appendChild(more);
    }
  }
  function update() {
    const total = state.messages.length;
    state.current = total ? Math.min(Math.max(currentVisibleFloor(), 1), total) : 0;
    count.textContent = (state.current || 0) + '/' + total;
    input.max = String(Math.max(total, 1)); input.value = String(state.current || 1);
    $('.tff-prev').disabled = total < 1 || state.current <= 1;
    $('.tff-next').disabled = total < 1 || state.current >= total;
    $('.tff-first').disabled = total < 1 || state.current <= 1;
    $('.tff-latest').disabled = total < 1; $('.tff-go').disabled = total < 1;
    renderResults();
  }
  function refresh() { state.messages = getMessages(); update(); }
  function jumpTo(number) {
    state.messages = getMessages();
    const total = state.messages.length;
    if (!total) { update(); return; }
    const floor = Math.min(Math.max(Math.trunc(Number(number) || 1), 1), total);
    const target = state.messages[floor - 1];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    state.current = floor; input.value = String(floor); count.textContent = floor + '/' + total;
    renderResults();
  }
  function latestReply() {
    state.messages = getMessages();
    if (!state.messages.length) return;
    let index = -1;
    for (let i = state.messages.length - 1; i >= 0; i--) {
      if (roleOf(state.messages[i]) === 'assistant') { index = i; break; }
    }
    if (index < 0) index = state.messages.length - 1;
    jumpTo(index + 1);
  }

  $('.tff-go').addEventListener('click', () => jumpTo(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') jumpTo(input.value); });
  $('.tff-prev').addEventListener('click', () => jumpTo(state.current - 1));
  $('.tff-next').addEventListener('click', () => jumpTo(state.current + 1));
  $('.tff-first').addEventListener('click', () => jumpTo(1));
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
    new MutationObserver(() => refresh()).observe(chat, { childList: true, subtree: true });
  }
  window.addEventListener('resize', refresh);
  refresh();
  setTimeout(refresh, 500);
  setTimeout(refresh, 1500);
})();