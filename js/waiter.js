  // ── Icons ────────────────────────────────────────────────────
  const ICON_PATHS = {
    bell: '<path d="M12 3a5 5 0 0 0-5 5v3.5c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.2c-.6-.6-1-1.4-1-2.3V8a5 5 0 0 0-5-5z"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/>',
    receipt: '<path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/>',
  };
  function icon(name, size) { size = size || 18; return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`; }

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
  function playAlertSound() { playTone([500, 700, 940], [0.08, 0.08, 0.16], 'triangle', 0.15); }

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

  // ── Request store ────────────────────────────────────────────
  const REQ_KEY = 'tarita_requests_v1';
  function _readReq() { try { const raw = localStorage.getItem(REQ_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
  function _writeReq(list) { localStorage.setItem(REQ_KEY, JSON.stringify(list)); window.dispatchEvent(new CustomEvent('requests-updated')); }
  const RequestStore = {
    getAll() { return _readReq().sort((a, b) => a.createdAt - b.createdAt); },
    getPending() { return this.getAll().filter(r => r.status === 'pending'); },
    getHistory() { return _readReq().filter(r => r.status === 'acknowledged').sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6); },
    acknowledge(id) { const list = _readReq(); const r = list.find(r => r.id === id); if (r) { r.status = 'acknowledged'; r.updatedAt = Date.now(); } _writeReq(list); },
    subscribe(cb) { window.addEventListener('storage', e => { if (e.key === REQ_KEY) cb(); }); window.addEventListener('requests-updated', cb); setInterval(cb, 2000); }
  };

  const REQUEST_META = {
    call_waiter: { icon: 'bell', text: 'Needs a waiter', cls: 'type-waiter' },
    request_bill: { icon: 'receipt', text: 'Wants the bill', cls: 'type-bill' }
  };

  let knownReqIds = new Set();
  let firstRender = true;

  function timeAgo(ts) { const mins = Math.floor((Date.now() - ts) / 60000); return mins < 1 ? 'just now' : `${mins} min ago`; }

  function attachSwipe(cardEl, id) {
    const inner = cardEl.querySelector('.alert-inner');
    let startX = null, dx = 0;
    cardEl.addEventListener('touchstart', e => { startX = e.touches[0].clientX; inner.style.transition = 'none'; }, { passive: true });
    cardEl.addEventListener('touchmove', e => {
      if (startX === null) return;
      dx = e.touches[0].clientX - startX;
      inner.style.transform = `translateX(${dx}px)`;
    }, { passive: true });
    cardEl.addEventListener('touchend', () => {
      inner.style.transition = 'transform 0.25s ease';
      if (Math.abs(dx) > 80) {
        inner.style.transform = `translateX(${dx > 0 ? 500 : -500}px)`;
        setTimeout(() => RequestStore.acknowledge(id), 150);
      } else {
        inner.style.transform = 'translateX(0)';
      }
      startX = null; dx = 0;
    });
  }

  function renderAlerts() {
    const pending = RequestStore.getPending();
    const currentIds = new Set(pending.map(r => r.id));
    const arrived = pending.filter(r => !knownReqIds.has(r.id));
    if (arrived.length && !firstRender) playAlertSound();

    const counterEl = document.getElementById('reqCounter');
    counterEl.textContent = pending.length;
    counterEl.classList.toggle('zero', pending.length === 0);

    const el = document.getElementById('alerts-list');
    el.innerHTML = pending.length
      ? pending.map(r => {
          const meta = REQUEST_META[r.type] || { icon: 'bell', text: r.type, cls: 'type-waiter' };
          const mins = Math.floor((Date.now() - r.createdAt) / 60000);
          const urgent = mins >= 3;
          return `
            <div class="alert-card ${meta.cls} ${urgent ? 'urgent-glow' : ''}" data-cardid="${r.id}">
              <div class="swipe-hint">swipe to acknowledge</div>
              <div class="alert-inner">
                <div class="alert-left">
                  <span class="alert-icon">${icon(meta.icon, 22)}</span>
                  <div>
                    <div class="alert-type">${meta.text}</div>
                    <div class="alert-table">Table ${r.tableNumber}</div>
                    <div class="alert-time">${timeAgo(r.createdAt)}</div>
                  </div>
                </div>
                <button class="ack-btn" data-ack="${r.id}">Acknowledge</button>
              </div>
            </div>`;
        }).join('')
      : '';
    document.querySelectorAll('[data-ack]').forEach(btn => btn.addEventListener('click', () => RequestStore.acknowledge(btn.dataset.ack)));
    document.querySelectorAll('[data-cardid]').forEach(cardEl => attachSwipe(cardEl, cardEl.dataset.cardid));

    knownReqIds = currentIds;
    firstRender = false;
  }

  function renderHistory() {
    const history = RequestStore.getHistory();
    document.getElementById('history-list').innerHTML = history.length
      ? history.map(r => {
          const meta = REQUEST_META[r.type] || { icon: 'bell', text: r.type };
          return `<div class="history-row"><span class="h-type">${icon(meta.icon, 14)} ${meta.text} — Table ${r.tableNumber}</span><span>${new Date(r.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>`;
        }).join('')
      : `<div class="history-row" style="border-bottom:none;">No requests acknowledged yet</div>`;
  }

  function renderOrders() {
    const ready = OrderStore.getByStatus(['ready']); // already oldest-first from getAll()
    const served = OrderStore.getByStatus(['served']).slice(-6).reverse();

    document.getElementById('ready-list').innerHTML = ready.length
      ? ready.map(o => `
        <div class="card">
          <div class="card-left">
            <span class="badge">Ready</span>
            <div class="card-order">Order #${o.orderNumber} — Table ${o.tableNumber}</div>
            <div class="card-items">${o.items.map(i => `${i.qty}× ${i.name}`).join(', ')}</div>
          </div>
          <button class="serve-btn" data-serve="${o.id}">Mark served</button>
        </div>`).join('')
      : `<div class="empty">Nothing waiting to be served right now.</div>`;

    document.getElementById('served-list').innerHTML = served.length
      ? served.map(o => `<div class="served-row"><span>#${o.orderNumber} — Table ${o.tableNumber}</span><span>${new Date(o.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>`).join('')
      : `<div class="served-row" style="border-bottom:none;">Nothing served yet</div>`;

    document.querySelectorAll('[data-serve]').forEach(btn => btn.addEventListener('click', () => OrderStore.updateStatus(btn.dataset.serve, 'served')));
  }

  OrderStore.subscribe(renderOrders);
  RequestStore.subscribe(() => { renderAlerts(); renderHistory(); });
  renderOrders();
  renderAlerts();
  renderHistory();