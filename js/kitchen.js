  // ── Icons ────────────────────────────────────────────────────
  const ICON_PATHS = {
    check: '<path d="M5 13l4 4L19 7"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19c3-3 6-6 9-11"/>',
    chili: '<path d="M6 8c0-2 2-4 4-4 1 0 1.5.6 1 1.5C10 7 8 9 8 12c0 3 2 5 4 6-3 1-7-1-7.5-4.5C4.2 11 5 9.5 6 8z"/><path d="M10 4c1-1 3-1 4 0"/>',
    nut: '<path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M12 9v6M9 12h6"/>',
    milk: '<path d="M9 3h6l1 3-1 2v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8L8 6z"/>',
  };
  function icon(name, size) { size = size || 15; return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`; }
  const TAG_ICON = { veg: 'leaf', spicy: 'chili', nuts: 'nut', dairy: 'milk' };
  function tagIcons(tags) { return (tags && tags.length) ? `<span class="tag-icons">${tags.map(tg => icon(TAG_ICON[tg], 12)).join('')}</span>` : ''; }

  function playTone(freqs, durs, type, gain) {
    type = type || 'sine'; gain = gain || 0.13;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = type; osc.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + durs[i]);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t); osc.stop(t + durs[i] + 0.03);
        t += durs[i] * 0.85;
      });
    } catch (e) {}
  }
  function playNewOrderSound() { playTone([720, 720], [0.09, 0.13], 'sine', 0.14); }

  // ── Order store ──────────────────────────────────────────────
  const STORE_KEY = 'tarita_orders_v1';
  function _readAll() { try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
  function _writeAll(orders) { localStorage.setItem(STORE_KEY, JSON.stringify(orders)); window.dispatchEvent(new CustomEvent('orders-updated')); }
  const OrderStore = {
    getAll() { return _readAll().sort((a, b) => a.createdAt - b.createdAt); }, // oldest first, always
    getByStatus(statuses) { return this.getAll().filter(o => statuses.includes(o.status)); },
    updateStatus(orderId, status) { const orders = _readAll(); const order = orders.find(o => o.id === orderId); if (!order) return null; order.status = status; order.updatedAt = Date.now(); _writeAll(orders); return order; },
    subscribe(cb) { window.addEventListener('storage', e => { if (e.key === STORE_KEY) cb(); }); window.addEventListener('orders-updated', cb); setInterval(cb, 2000); }
  };

  let knownIds = new Set();
  let firstRender = true;

  function timeAgo(ts) { const mins = Math.floor((Date.now() - ts) / 60000); return mins < 1 ? 'just now' : `${mins} min ago`; }
  function formatElapsed(ts) {
    const secs = Math.floor((Date.now() - ts) / 1000);
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderTicket(order, actions, isNew) {
    const mins = Math.floor((Date.now() - order.createdAt) / 60000);
    const urgent = mins >= 10 && order.status !== 'ready';
    return `
      <div class="ticket ${urgent ? 'urgent' : ''} ${isNew ? 'flash' : ''}">
        <div class="ticket-top">
          <span class="ticket-order-no">#${order.orderNumber}</span>
          <span class="ticket-table">TABLE ${order.tableNumber}</span>
        </div>
        <div class="ticket-time-row">
          <span class="ticket-time">${timeAgo(order.createdAt)}</span>
          <span class="ticket-timer" data-created="${order.createdAt}">${formatElapsed(order.createdAt)}</span>
        </div>
        ${order.items.map(i => `<div class="ticket-item"><span class="qty">${i.qty}×</span><span>${i.name}${tagIcons(i.tags)}</span></div>`).join('')}
        ${order.notes ? `<div class="ticket-notes">${order.notes}</div>` : ''}
        <div class="ticket-actions">${actions(order)}</div>
      </div>`;
  }

  function render() {
    const all = OrderStore.getAll();
    const currentIds = new Set(all.map(o => o.id));
    const arrived = all.filter(o => !knownIds.has(o.id) && o.status === 'new');
    if (arrived.length && !firstRender) playNewOrderSound();

    const newOrders = all.filter(o => o.status === 'new');
    const preparing = all.filter(o => o.status === 'preparing');
    const ready = all.filter(o => o.status === 'ready');

    document.getElementById('count-new').textContent = newOrders.length;
    document.getElementById('count-preparing').textContent = preparing.length;
    document.getElementById('count-ready').textContent = ready.length;

    document.getElementById('col-new').innerHTML = newOrders.length
      ? newOrders.map(o => renderTicket(o, order => `
          <button class="ticket-btn primary" data-start="${order.id}">Start preparing</button>
          <button class="ticket-btn quick" data-quickready="${order.id}" title="Skip straight to ready">${icon('check', 15)}</button>
        `, !firstRender && arrived.some(a => a.id === o.id))).join('')
      : `<div class="empty-state">No new orders</div>`;

    document.getElementById('col-preparing').innerHTML = preparing.length
      ? preparing.map(o => renderTicket(o, order => `<button class="ticket-btn primary" data-ready="${order.id}">Mark ready</button>`)).join('')
      : `<div class="empty-state">Nothing on the pass</div>`;

    document.getElementById('col-ready').innerHTML = ready.length
      ? ready.map(o => renderTicket(o, () => `<span class="ticket-btn" style="opacity:0.6;cursor:default;">Waiting for pickup</span>`)).join('')
      : `<div class="empty-state">All caught up</div>`;

    document.querySelectorAll('[data-start]').forEach(btn => btn.addEventListener('click', () => OrderStore.updateStatus(btn.dataset.start, 'preparing')));
    document.querySelectorAll('[data-ready]').forEach(btn => btn.addEventListener('click', () => OrderStore.updateStatus(btn.dataset.ready, 'ready')));
    document.querySelectorAll('[data-quickready]').forEach(btn => btn.addEventListener('click', () => OrderStore.updateStatus(btn.dataset.quickready, 'ready')));

    knownIds = currentIds;
    firstRender = false;
  }

  function tickTimers() {
    document.querySelectorAll('.ticket-timer').forEach(el => { el.textContent = formatElapsed(parseInt(el.dataset.created, 10)); });
  }

  function updateClock() { document.getElementById('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  document.getElementById('fullscreenBtn').innerHTML = icon('expand', 17);
  document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });

  OrderStore.subscribe(render);
  render();
  updateClock(); setInterval(updateClock, 1000);
  setInterval(tickTimers, 1000);