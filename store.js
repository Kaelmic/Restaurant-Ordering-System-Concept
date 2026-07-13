// ─────────────────────────────────────────────────────────────
// DEMO DATA LAYER
// This simulates the `orders` / `order_items` tables + Supabase
// Realtime from the schema, using localStorage + events so the
// three screens (customer / kitchen / waiter) sync live in the
// browser, with no server required.
//
// To go to production: replace the functions below with Supabase
// client calls (insert / update / .on('postgres_changes', ...)).
// The function signatures are written so that swap is a drop-in.
// ─────────────────────────────────────────────────────────────

const STORE_KEY = 'tarita_orders_v1';
const COUNTER_KEY = 'tarita_order_counter_v1';

function _readAll() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Store read failed', e);
    return [];
  }
}

function _writeAll(orders) {
  localStorage.setItem(STORE_KEY, JSON.stringify(orders));
  // same-tab listeners don't get the native 'storage' event, so fire our own
  window.dispatchEvent(new CustomEvent('orders-updated'));
}

function _nextOrderNumber() {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) || '40', 10);
  const next = current + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return next;
}

const OrderStore = {
  // status flow: new -> preparing -> ready -> served (or cancelled)

  getAll() {
    return _readAll().sort((a, b) => a.createdAt - b.createdAt);
  },

  getByStatus(statuses) {
    return this.getAll().filter(o => statuses.includes(o.status));
  },

  create({ tableNumber, cartItems, notes }) {
    const orders = _readAll();
    const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const order = {
      id: crypto.randomUUID(),
      orderNumber: _nextOrderNumber(),
      tableNumber,
      items: cartItems,
      notes: notes || '',
      total,
      status: 'new',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    orders.push(order);
    _writeAll(orders);
    return order;
  },

  updateStatus(orderId, status) {
    const orders = _readAll();
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = Date.now();
    _writeAll(orders);
    return order;
  },

  getById(orderId) {
    return _readAll().find(o => o.id === orderId) || null;
  },

  // Subscribe to changes. Fires on real cross-tab storage events,
  // same-tab custom events, and a 2s poll as a safety net.
  subscribe(callback) {
    window.addEventListener('storage', (e) => {
      if (e.key === STORE_KEY) callback();
    });
    window.addEventListener('orders-updated', callback);
    const interval = setInterval(callback, 2000);
    return () => clearInterval(interval);
  },

  // Dev helper — clears all demo orders
  _reset() {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(COUNTER_KEY);
    window.dispatchEvent(new CustomEvent('orders-updated'));
  }
};
