# Ta' Rita — QR Table Ordering (Working Demo)

Three screens that talk to each other live: **customer.html** (scanned at
the table), **kitchen.html** (kitchen display), **waiter.html** (floor
staff). No backend, no build step — open them in a browser and they sync.

## How the sync works

The three pages share `shared/store.js`, which keeps orders in the
browser's `localStorage` and broadcasts changes. This is a stand-in for
Supabase Realtime (see the schema from earlier) so you can demo the full
flow — place an order, watch it hit the kitchen, mark it ready, watch it
appear for the waiter — without standing up a server.

**Important:** for the sync to work across tabs/devices, the pages need
to be served from the same origin, not just double-clicked open. Some
browsers isolate `localStorage` per `file://` path even within the same
folder.

## Run it

From inside the `ordering-system` folder, use any simple local server:

```bash
# Option A — Node (if you have npx)
npx serve .

# Option B — Python (comes with most systems)
python3 -m http.server 8000
```

Then open:
- `http://localhost:8000/customer.html?table=6` — the guest view
- `http://localhost:8000/kitchen.html` — kitchen display
- `http://localhost:8000/waiter.html` — floor staff view

Open all three in separate browser tabs (or separate devices on the same
network, using your machine's local IP instead of `localhost`) and place
an order from `customer.html`. It'll appear instantly on `kitchen.html`.

To demo multiple tables at once, change the `?table=` param, e.g.
`customer.html?table=9`.

To reset all demo data, open the browser console on any page and run:
```js
OrderStore._reset()
```

## New in this version

- **Table detection** — each QR points to a unique token (`?t=e2d9`), mapped
  to a table number in `TABLE_TOKENS` inside `customer.html`. An
  unrecognised or missing token shows a "please ask staff" screen instead
  of silently breaking. Plain `?table=6` still works too, for quick
  testing. In production, this token would be validated against the
  `restaurant_tables.qr_token` column server-side rather than a client-side
  lookup table.
- **Call waiter** — a button in the header creates a request the waiter
  screen picks up instantly, with a 30-second cooldown so it can't be
  spammed.
- **Request bill** — same pattern, separate request type.
- **Reorder** — after an order is sent, its items are remembered per table.
  Next time that table's menu loads, a banner offers to add the same
  items again in one tap (handy after drinks run out).
- **Two languages** — EN/MT toggle in the header. Item names stay in
  Maltese (they already were), descriptions and all UI text switch.
  Adding a third language means adding one more key to the `STRINGS`
  object in `customer.html`.
- **Allergen icons** — 🌱 vegetarian, 🌶 spicy, 🥜 contains nuts, 🥛 dairy.
  Shown on the customer menu next to each dish, and carried through to
  the kitchen ticket too, since that's who actually needs to double-check
  before plating.

## Design refresh + feature pass (this version)

**Type & icons:** swapped Fraunces/Inter/IBM Plex Mono for **Piazzolla** (serif),
**Work Sans** (body), **Space Mono** (numbers/timers) — and replaced every
emoji with a small hand-drawn line-icon set (bell, receipt, leaf, chili,
nut, milk drop, clock, sun/moon, plate, warning), defined inline as SVG
path data in each file (`ICON_PATHS` / `icon()` helper). No icon font or
external library dependency.

**Customer (`customer.html`):**
- Page fade-in on load, drawer/confirm slide transitions (already present, refined)
- Add-to-cart: quantity "pop" animation + floating `+1` indicator + haptic tick (`navigator.vibrate`, where supported — no effect on iOS Safari, which doesn't implement the Vibration API)
- Food thumbnails: each menu item has an optional `img` field. Left unset, it shows a serif monogram placeholder instead of a fake/stock photo. Add a real photo URL to `img` on any item in `MENU_ITEMS` to switch it on.
- Estimated prep time shown per dish and as "Estimated ready in ~X min" on the confirmation screen (max prep time across the order + 3 min buffer)
- Empty-cart state: tapping the order bar with nothing in it shows an illustration + friendly copy instead of an empty list
- Order-bar total "bumps" on change; status track has an animated progress fill and a pulsing active node
- Success chime + stronger haptic pattern on send, synthesized with the Web Audio API (no audio file to host)
- Dark mode toggle (sun/moon icon, top right) — full alternate palette, not just inverted colors
- EN/MT toggle carries through to every string, unchanged from before

**Kitchen (`kitchen.html`):**
- New-order chime (double beep) whenever an order lands in "New" — skipped on first load so existing orders don't all chime at once
- Full-screen toggle (top right) for a tablet mounted in the kitchen
- Larger type/padding throughout — meant to be read from a few feet away
- Urgent highlight now triggers at 10 minutes (was 12) with a pulsing red-orange outline instead of just a text-color change
- Auto-sorted oldest-first, always (via `getAll()`'s sort — nothing to configure)
- Live per-ticket prep timer (mm:ss), ticking every second independent of the sync poll
- New tickets flash briefly on arrival
- One-click "Ready" shortcut (checkmark icon) next to "Start preparing", for simple items that don't need a "preparing" stage
- Allergen icons carried through onto every ticket item, since kitchen staff need that more than anyone

**Waiter (`waiter.html`):**
- Alert chime (three-tone) on new call-waiter/request-bill requests
- Color-coded by type: bottle green for "needs a waiter," oxblood for "wants the bill" — plus a pulsing glow if a request's been sitting 3+ minutes
- Request counter badge next to the header title
- Request history section (last 6 acknowledged, with type/table/time)
- Swipe left or right on an alert card to acknowledge it (the "Acknowledge" button still works too, for desktop/mouse use)
- Ready orders already sorted oldest-first, same underlying store logic as kitchen

## Generating real QR codes

Point each table's QR at a URL like:
```
https://yourdomain.com/customer.html?t=e2d9
```
where `e2d9` is that table's token from `TABLE_TOKENS`. Any free QR
generator (or the `qrcode` npm package, for batch-generating a full set)
will turn that URL into a printable code.

## What's real vs. what's simulated

**Real and reusable as-is:**
- All UI/UX, layout, and interaction logic
- The order data shape (`items`, `notes`, `status`, `tableNumber`, etc.)
  matches the `orders` / `order_items` schema discussed earlier
- The status flow (new → preparing → ready → served)

**Simulated for demo purposes, swap for production:**
- `shared/store.js` uses `localStorage` instead of a real database. Every
  function in `OrderStore` (`create`, `updateStatus`, `getByStatus`,
  `subscribe`) is written so it can be replaced with Supabase client
  calls without touching the UI code — e.g. `OrderStore.create()` becomes
  a Supabase `insert`, and `subscribe()` becomes a
  `.on('postgres_changes', ...)` listener.
- The menu (`shared/menu-data.js`) is a static file. In production this
  is a `menu_items` query, editable from the owner dashboard we scoped
  earlier.
- There's no authentication on kitchen.html or waiter.html — anyone with
  the link can access them. Fine for a pilot on a private local network;
  add Supabase auth + `staff` role checks before a real rollout.
- No payment step — matches the MVP scope we agreed on (bill still
  settled at the table the normal way).

## Suggested next build step

Wire `shared/store.js` to a real Supabase project (schema is already
designed). At that point `customer.html` works from an actual QR code
pointing at `yourdomain.com/order/ta-rita/table-6`, and kitchen/waiter
screens work from any device with a browser — no local network
requirement.
