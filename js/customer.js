  // ── Icon set (hand-drawn line icons, replaces emoji) ────────
  const ICON_PATHS = {
    bell: '<path d="M12 3a5 5 0 0 0-5 5v3.5c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.2c-.6-.6-1-1.4-1-2.3V8a5 5 0 0 0-5-5z"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/>',
    receipt: '<path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/>',
    leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M5 19c3-3 6-6 9-11"/>',
    chili: '<path d="M6 8c0-2 2-4 4-4 1 0 1.5.6 1 1.5C10 7 8 9 8 12c0 3 2 5 4 6-3 1-7-1-7.5-4.5C4.2 11 5 9.5 6 8z"/><path d="M10 4c1-1 3-1 4 0"/>',
    nut: '<path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M12 9v6M9 12h6"/>',
    milk: '<path d="M9 3h6l1 3-1 2v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8L8 6z"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    plate: '<path d="M7 3v6a2 2 0 0 0 2 2v10M7 3v4M9 3v4"/><path d="M16 3c-1.2 2.2-1.2 5.8 0 8l-1 1v9"/>',
    warning: '<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 17h.01"/>'
  };
  function icon(name, size) {
    size = size || 15;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px">${ICON_PATHS[name]}</svg>`;
  }

  // ── Sound + haptics ──────────────────────────────────────────
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
  function playSuccessSound() { playTone([640, 880], [0.12, 0.2], 'sine', 0.11); }
  function vibrate(pattern) { if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} } }

  // ── i18n ─────────────────────────────────────────────────────
  const STRINGS = {
    en: {
      tagline: "ORDER DIRECT TO KITCHEN", tableLabel: n => `TABLE ${n}`,
      callWaiter: "Call waiter", waiterNotified: "Waiter notified ✓",
      requestBill: "Request bill", billRequested: "Bill requested ✓",
      yourOrder: "Your order", notesPlaceholder: "Notes for the kitchen — allergies, no onions, etc.",
      sendToKitchen: "Send to kitchen", total: "Total", viewOrder: "View order →",
      sentToKitchen: "Sent to kitchen", orderReceived: "Order received",
      orderReceivedSub: "The kitchen has your order.\nNo need to flag anyone down.",
      orderLabel: "Order", liveUpdateNote: "This updates live as the kitchen works on it — no need to refresh.",
      startNewOrder: "← Start a new order",
      statusNew: "New", statusPreparing: "Preparing", statusReady: "Ready", statusServed: "Served",
      reorderTitle: "Already ordered this round", reorderAll: "Add these again",
      legendVeg: "Vegetarian", legendSpicy: "Spicy", legendNuts: "Contains nuts", legendDairy: "Dairy",
      invalidTable: "This QR code isn't recognised. Please ask a member of staff for a fresh one.",
      itemCount: c => `${c} item${c !== 1 ? 's' : ''}`,
      estReady: m => `Estimated ready in ~${m} min`,
      emptyCartTitle: "Nothing here yet", emptyCartSub: "Add a dish from the menu to get started.",
      min: "min",
    },
    mt: {
      tagline: "ORDNA DIRETTAMENT LILL-KUŻINA", tableLabel: n => `MEJDA ${n}`,
      callWaiter: "Sejjaħ kellner", waiterNotified: "Il-kellner ġie avżat ✓",
      requestBill: "Talab il-kont", billRequested: "Il-kont intalab ✓",
      yourOrder: "L-ordni tiegħek", notesPlaceholder: "Noti għall-kuċina — allerġiji, mingħajr basal, eċċ.",
      sendToKitchen: "Ibgħat lill-kuċina", total: "Total", viewOrder: "Ara l-ordni →",
      sentToKitchen: "Intbagħtet lill-kuċina", orderReceived: "L-ordni waslet",
      orderReceivedSub: "Il-kuċina rċeviet l-ordni tiegħek.\nM'hemmx għalfejn issejjaħ lil ħadd.",
      orderLabel: "Ordni", liveUpdateNote: "Dan jaġġorna hekk kif il-kuċina taħdem fuqu — m'hemmx għalfejn tirrefrexja.",
      startNewOrder: "← Ibda ordni ġdida",
      statusNew: "Ġdida", statusPreparing: "Qed titħejja", statusReady: "Lesta", statusServed: "Servuta",
      reorderTitle: "Diġà ordnajt dawn", reorderAll: "Żid mill-ġdid",
      legendVeg: "Veġetarjan", legendSpicy: "Pikkanti", legendNuts: "Fih ġewż", legendDairy: "Ħalib",
      invalidTable: "Dan il-QR code mhux rikonoxxut. Jekk jogħġbok staqsi lil membru tal-persunal.",
      itemCount: c => `${c} oġġett${c !== 1 ? 'i' : ''}`,
      estReady: m => `Lesta bejn wieħed u ieħor f'~${m} min`,
      emptyCartTitle: "Għadu vojt", emptyCartSub: "Żid platt mill-menu biex tibda.",
      min: "min",
    }
  };
  let lang = 'en';
  const t = key => STRINGS[lang][key];

  // ── Theme ────────────────────────────────────────────────────
  let theme = 'light';
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeBtn').innerHTML = icon(theme === 'light' ? 'moon' : 'sun', 15);
  }
  document.getElementById('themeBtn').addEventListener('click', () => { theme = theme === 'light' ? 'dark' : 'light'; applyTheme(); });

  // ── Menu data ────────────────────────────────────────────────
  const VENUE = { name: "Ta' Rita" };
  const CATEGORIES = ["Starters", "Mains", "Sides", "Desserts", "Drinks"];
  const TAG_ICON = { veg: 'leaf', spicy: 'chili', nuts: 'nut', dairy: 'milk' };
  const MENU_ITEMS = [
    { id: 1, cat: "Starters", name: "Ħobż biż-Żejt", price: 6.50, prep: 6, tags: ['veg'],
      desc: { en: "Crusty local bread, tomato, capers, olive oil, tuna on request", mt: "Ħobż tal-Malti, tadam, kappar, żejt taż-żebbuġa, tonn fuq talba" } },
    { id: 2, cat: "Starters", name: "Bigilla", price: 5.00, prep: 5, tags: ['veg', 'spicy'],
      desc: { en: "Broad bean pâté, garlic, chilli, served with galletti", mt: "Pasta tal-ful, tewm, ġildu, servuta mal-galletti" } },
    { id: 3, cat: "Starters", name: "Pastizzi (3pc)", price: 4.50, prep: 8, tags: ['veg', 'dairy'],
      desc: { en: "Ricotta or mushy pea, straight from the oven", mt: "Rikotta jew piżelli, dritt mill-forn" } },
    { id: 4, cat: "Mains", name: "Bragioli", price: 15.50, prep: 25, tags: [],
      desc: { en: "Beef olives, slow braised in red wine, served with rice", mt: "Biċċiet ċanga mimlija, imsajra bl-inbid aħmar, servuti mar-ross" } },
    { id: 5, cat: "Mains", name: "Fenkata", price: 17.00, prep: 30, tags: [],
      desc: { en: "Rabbit stewed in wine and garlic, the Sunday classic", mt: "Fenek imsajjar bl-inbid u tewm, il-klassiku tal-Ħadd" } },
    { id: 6, cat: "Mains", name: "Lampuki Pie", price: 14.00, prep: 20, tags: ['dairy'],
      desc: { en: "Seasonal when available — ask your waiter for today's catch", mt: "Staġjonali meta disponibbli — staqsi lill-kellner" } },
    { id: 7, cat: "Sides", name: "Maltese Ftira Toast", price: 3.50, prep: 5, tags: ['veg'],
      desc: { en: "Grilled, olive oil, oregano", mt: "Mixwija, żejt taż-żebbuġa, oregano" } },
    { id: 8, cat: "Sides", name: "Roast Potatoes", price: 3.00, prep: 10, tags: ['veg'],
      desc: { en: "Rosemary, sea salt", mt: "Rożmarin, melħ tal-baħar" } },
    { id: 11, cat: "Desserts", name: "Kannoli", price: 5.50, prep: 4, tags: ['veg', 'dairy', 'nuts'],
      desc: { en: "Sicilian-style pastry, ricotta, candied fruit, crushed pistachio", mt: "Għaġina Sqallija, rikotta, frotta kandita, pistaċċi mfarrak" } },
    { id: 9, cat: "Drinks", name: "Kinnie", price: 2.50, prep: 1, tags: ['veg'],
      desc: { en: "Ice cold, the local one", mt: "Iffriżat, tal-lokal" } },
    { id: 10, cat: "Drinks", name: "House Red — glass", price: 4.50, prep: 1, tags: ['veg'],
      desc: { en: "Gozitan blend", mt: "Taħlita Għawdxija" } },
  ];
  // Set an `img` URL on any item above to show a real photo instead of the monogram placeholder.

  // ── Table detection ──────────────────────────────────────────
  const TABLE_TOKENS = { 'a3f9': 1, 'b7c2': 2, 'd1e4': 3, 'f8a1': 4, 'c5b6': 5, 'e2d9': 6, 'g4h8': 7, 'h5j2': 8 };
  const params = new URLSearchParams(window.location.search);
  let tableNumber = null;
  if (params.has('t') && TABLE_TOKENS[params.get('t')]) tableNumber = TABLE_TOKENS[params.get('t')];
  else if (params.has('table')) tableNumber = params.get('table');

  if (!tableNumber) {
    document.getElementById('invalidIcon').innerHTML = icon('warning', 40);
    document.getElementById('invalidMessage').textContent = STRINGS.en.invalidTable;
    document.getElementById('invalidScreen').style.display = 'flex';
    throw new Error('No valid table detected — stopping app init');
  }

  // ── Order store ──────────────────────────────────────────────
  const STORE_KEY = 'tarita_orders_v1';
  const COUNTER_KEY = 'tarita_order_counter_v1';
  function _readAll() { try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
  function _writeAll(orders) { localStorage.setItem(STORE_KEY, JSON.stringify(orders)); window.dispatchEvent(new CustomEvent('orders-updated')); }
  function _nextOrderNumber() { const c = parseInt(localStorage.getItem(COUNTER_KEY) || '40', 10); const n = c + 1; localStorage.setItem(COUNTER_KEY, String(n)); return n; }
  const OrderStore = {
    getById(id) { return _readAll().find(o => o.id === id) || null; },
    create({ tableNumber, cartItems, notes }) {
      const orders = _readAll();
      const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
      const order = { id: crypto.randomUUID(), orderNumber: _nextOrderNumber(), tableNumber, items: cartItems, notes: notes || '', total, status: 'new', createdAt: Date.now(), updatedAt: Date.now() };
      orders.push(order); _writeAll(orders); return order;
    },
    subscribe(cb) { window.addEventListener('storage', e => { if (e.key === STORE_KEY) cb(); }); window.addEventListener('orders-updated', cb); setInterval(cb, 2000); }
  };
  const REQ_KEY = 'tarita_requests_v1';
  function _readReq() { try { const raw = localStorage.getItem(REQ_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
  function _writeReq(list) { localStorage.setItem(REQ_KEY, JSON.stringify(list)); window.dispatchEvent(new CustomEvent('requests-updated')); }
  const RequestStore = { create(tableNumber, type) { const list = _readReq(); const req = { id: crypto.randomUUID(), tableNumber, type, status: 'pending', createdAt: Date.now() }; list.push(req); _writeReq(list); return req; } };

  // ── App state ────────────────────────────────────────────────
  let cart = {};
  let activeCat = CATEGORIES[0];
  let currentOrderId = null;
  const LAST_ORDER_KEY = `tarita_last_order_${tableNumber}`;

  document.getElementById('tableLabel').textContent = t('tableLabel')(tableNumber);
  document.getElementById('confirmTable').textContent = t('tableLabel')(tableNumber);
  document.getElementById('langToggle').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => { lang = btn.dataset.lang; renderAll(); }));

  function tagIcons(tags) { return tags.length ? `<span class="item-icons">${tags.map(tag => icon(TAG_ICON[tag], 13)).join('')}</span>` : ''; }

  function renderTabs() {
    const tabsEl = document.getElementById('tabs');
    tabsEl.innerHTML = CATEGORIES.map(c => `<button class="tab ${c === activeCat ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
    tabsEl.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat; renderTabs();
      document.getElementById(`section-${activeCat}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function renderLegend() {
    document.getElementById('legend').innerHTML = `
      <span>${icon('leaf', 13)} ${t('legendVeg')}</span>
      <span>${icon('chili', 13)} ${t('legendSpicy')}</span>
      <span>${icon('nut', 13)} ${t('legendNuts')}</span>
      <span>${icon('milk', 13)} ${t('legendDairy')}</span>`;
  }

  function renderReorderBanner() {
    const el = document.getElementById('reorderBanner');
    let lastOrder;
    try { lastOrder = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || 'null'); } catch (e) { lastOrder = null; }
    if (!lastOrder || !lastOrder.length) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="reorder-banner">
        <div class="reorder-title">${t('reorderTitle')}</div>
        <div class="reorder-items">${lastOrder.map(i => `${i.qty}× ${i.name}`).join(', ')}</div>
        <button class="reorder-btn" id="reorderBtn">${t('reorderAll')}</button>
      </div>`;
    document.getElementById('reorderBtn').addEventListener('click', () => {
      lastOrder.forEach(i => { cart[i.menuItemId] = (cart[i.menuItemId] || 0) + i.qty; });
      vibrate(8); renderMenu(); updateBar();
    });
  }

  function renderMenu() {
    const menuEl = document.getElementById('menu');
    menuEl.innerHTML = CATEGORIES.map(cat => {
      const catItems = MENU_ITEMS.filter(i => i.cat === cat);
      return `<div id="section-${cat}"><div class="section-label">${cat}</div>${catItems.map(renderItem).join('')}</div>`;
    }).join('');
    attachItemHandlers();
  }

  function renderItem(item) {
    const qty = cart[item.id] || 0;
    const thumb = item.img ? `<img src="${item.img}" alt="">` : item.name.charAt(0);
    return `
      <div class="item">
        <div class="item-body">
          <div class="item-thumb">${thumb}</div>
          <div class="item-info">
            <div class="item-name-row"><p class="item-name">${item.name}</p>${tagIcons(item.tags)}</div>
            <p class="item-desc">${item.desc[lang]}</p>
            <div class="item-meta">
              <span class="item-price">€${item.price.toFixed(2)}</span>
              <span class="item-prep">${icon('clock', 12)} ~${item.prep} ${t('min')}</span>
            </div>
          </div>
        </div>
        <div class="item-action" data-wrap="${item.id}">
          ${qty === 0
            ? `<button class="add-btn" data-add="${item.id}">+</button>`
            : `<div class="stepper"><button data-minus="${item.id}">−</button><span class="qty" id="qty-${item.id}">${qty}</span><button data-plus="${item.id}">+</button></div>`
          }
        </div>
      </div>`;
  }

  function popQty(id) {
    const el = document.getElementById(`qty-${id}`);
    if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  function floatPlusOne(id) {
    const wrap = document.querySelector(`[data-wrap="${id}"]`);
    if (!wrap) return;
    const span = document.createElement('span');
    span.className = 'float-plus'; span.textContent = '+1';
    wrap.appendChild(span);
    setTimeout(() => span.remove(), 650);
  }

  function attachItemHandlers() {
    document.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => {
      cart[btn.dataset.add] = 1; vibrate(8); floatPlusOne(btn.dataset.add); renderMenu(); updateBar();
    }));
    document.querySelectorAll('[data-plus]').forEach(btn => btn.addEventListener('click', () => {
      cart[btn.dataset.plus]++; vibrate(8); floatPlusOne(btn.dataset.plus); popQty(btn.dataset.plus); renderMenu(); updateBar();
    }));
    document.querySelectorAll('[data-minus]').forEach(btn => btn.addEventListener('click', () => {
      cart[btn.dataset.minus]--; vibrate(6);
      if (cart[btn.dataset.minus] <= 0) delete cart[btn.dataset.minus];
      renderMenu(); updateBar();
    }));
  }

  function cartTotal() { return Object.entries(cart).reduce((s, [id, qty]) => s + MENU_ITEMS.find(i => i.id == id).price * qty, 0); }
  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }

  const orderBar = document.getElementById('orderBar');
  function updateBar() {
    const count = cartCount();
    document.getElementById('barCount').textContent = t('itemCount')(count);
    const totalEl = document.getElementById('barTotal');
    totalEl.textContent = `€${cartTotal().toFixed(2)}`;
    totalEl.classList.remove('bump'); void totalEl.offsetWidth; totalEl.classList.add('bump');
    document.getElementById('viewOrderLabel').textContent = t('viewOrder');
  }

  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('scrim');
  function openDrawer() { renderTicket(); drawer.classList.add('visible'); scrim.classList.add('visible'); }
  function closeDrawer() { drawer.classList.remove('visible'); scrim.classList.remove('visible'); }
  orderBar.addEventListener('click', openDrawer);
  document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);

  function renderTicket() {
    document.getElementById('drawerTitle').textContent = t('yourOrder');
    document.getElementById('sendBtn').textContent = t('sendToKitchen');
    if (cartCount() === 0) {
      document.getElementById('ticketBody').innerHTML = `
        <div class="empty-cart">
          <div class="icon-wrap">${icon('plate', 44)}</div>
          <p><strong>${t('emptyCartTitle')}</strong><br>${t('emptyCartSub')}</p>
        </div>`;
      return;
    }
    const rows = Object.entries(cart).map(([id, qty]) => {
      const item = MENU_ITEMS.find(i => i.id == id);
      return `<div class="ticket-row"><span class="t-qty">${qty}×</span><span class="t-name">${item.name}</span><span class="t-price">€${(item.price * qty).toFixed(2)}</span></div>`;
    }).join('');
    document.getElementById('ticketBody').innerHTML = `
      ${rows}
      <hr class="ticket-divider">
      <div class="ticket-total-row"><span>${t('total')}</span><span>€${cartTotal().toFixed(2)}</span></div>
      <textarea class="notes-field" id="notesField" placeholder="${t('notesPlaceholder')}"></textarea>`;
  }

  document.getElementById('sendBtn').addEventListener('click', () => {
    if (cartCount() === 0) { openDrawer(); return; }
    const cartItems = Object.entries(cart).map(([id, qty]) => {
      const item = MENU_ITEMS.find(i => i.id == id);
      return { menuItemId: item.id, name: item.name, price: item.price, qty, tags: item.tags, prep: item.prep };
    });
    const notes = document.getElementById('notesField').value;
    const order = OrderStore.create({ tableNumber, cartItems, notes });
    currentOrderId = order.id;
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(cartItems));

    closeDrawer();
    renderConfirm(order);
    document.getElementById('confirm').classList.add('visible');
    playSuccessSound();
    vibrate([10, 30, 10]);
  });

  function renderConfirm(order) {
    document.getElementById('confirmStamp').textContent = t('sentToKitchen');
    document.getElementById('confirmTitle').textContent = t('orderReceived');
    document.getElementById('confirmSub').textContent = t('orderReceivedSub');
    document.getElementById('orderLabelText').textContent = t('orderLabel');
    document.getElementById('orderNo').textContent = '#' + order.orderNumber;
    document.getElementById('confirmNote').textContent = t('liveUpdateNote');
    document.getElementById('backToMenu').textContent = t('startNewOrder');
    const maxPrep = Math.max(...order.items.map(i => i.prep || 5));
    document.getElementById('confirmPrep').innerHTML = `${icon('clock', 13)} ${t('estReady')(maxPrep + 3)}`;
    document.querySelectorAll('.status-step .label').forEach(el => { el.textContent = t(el.dataset.key); });
    renderStatusTrack(order.status);
  }

  function renderStatusTrack(status) {
    const order = ['new', 'preparing', 'ready', 'served'];
    const idx = order.indexOf(status);
    document.querySelectorAll('.status-step').forEach(el => {
      const i = order.indexOf(el.dataset.status);
      el.classList.toggle('active', i === idx);
      el.classList.toggle('done', i < idx);
    });
    document.getElementById('statusFill').style.width = `${(idx / (order.length - 1)) * 100}%`;
  }

  OrderStore.subscribe(() => { if (!currentOrderId) return; const order = OrderStore.getById(currentOrderId); if (order) renderStatusTrack(order.status); });

  document.getElementById('backToMenu').addEventListener('click', () => {
    document.getElementById('confirm').classList.remove('visible');
    cart = {}; currentOrderId = null; renderAll();
  });

  function wireQuickAction(btnId, iconName, stringKeyIdle, stringKeyDone, type) {
    const btn = document.getElementById(btnId);
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      RequestStore.create(tableNumber, type);
      vibrate([10, 20, 10]);
      btn.classList.add('done'); btn.disabled = true;
      btn.innerHTML = `${icon('bell', 14)} <span>${t(stringKeyDone)}</span>`;
      setTimeout(() => { btn.classList.remove('done'); btn.disabled = false; btn.innerHTML = `${icon(iconName, 14)} <span>${t(stringKeyIdle)}</span>`; }, 30000);
    });
  }
  wireQuickAction('callWaiterBtn', 'bell', 'callWaiter', 'waiterNotified', 'call_waiter');
  wireQuickAction('requestBillBtn', 'receipt', 'requestBill', 'billRequested', 'request_bill');

  function renderAll() {
    document.getElementById('langToggle').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    document.querySelector('header .table-tag').innerHTML = `<span class="dot"></span>${t('tableLabel')(tableNumber)} &nbsp;·&nbsp; ${t('tagline')}`;
    if (!document.getElementById('callWaiterBtn').disabled) document.getElementById('callWaiterBtn').innerHTML = `${icon('bell', 14)} <span>${t('callWaiter')}</span>`;
    if (!document.getElementById('requestBillBtn').disabled) document.getElementById('requestBillBtn').innerHTML = `${icon('receipt', 14)} <span>${t('requestBill')}</span>`;
    renderTabs(); renderLegend(); renderReorderBanner(); renderMenu(); updateBar();
  }

  applyTheme();
  document.getElementById('app').style.display = 'flex';
  renderAll();