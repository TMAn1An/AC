/* Shared live store. The three prototypes (and the showcase hub) stay in sync through
   BroadcastChannel + localStorage + postMessage relay, so an action in one app shows up in the others in real time.
   In the Flutter build this layer becomes the backend API + realtime channel (see docs/ARCHITECTURE.md). */
(function () {
  const KEY = 'shital.demo.v4', MIN = 60000, CHAT_OPEN = ['accepted', 'ontheway', 'arrived', 'working'], RESCHEDULE_OK = ['requested', 'forwarded', 'assigned', 'accepted'];
  let S = null; const subs = [];

  /* ---------- Geometry ---------- */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const route = (a, b) => [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }];
  const routeLen = pts => pts.slice(1).reduce((s, p, i) => s + dist(pts[i], p), 0);
  function along(pts, p) {
    const L = routeLen(pts); let d = Math.max(0, Math.min(1, p)) * L;
    for (let i = 1; i < pts.length; i++) {
      const seg = dist(pts[i - 1], pts[i]);
      if (d <= seg || i === pts.length - 1) { const k = seg ? Math.min(1, d / seg) : 1; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k }; }
      d -= seg;
    }
    return pts[pts.length - 1];
  }

  /* ---------- Job helpers ---------- */
  const ORDER = ['requested', 'forwarded', 'assigned', 'accepted', 'ontheway', 'arrived', 'working', 'completed'];
  const META = {
    requested: { label: 'New request', cust: 'Request received', cls: 'b-info' },
    forwarded: { label: 'With vendor', cust: 'Assigning technician', cls: 'b-warn' },
    assigned: { label: 'Awaiting technician', cust: 'Technician assigned', cls: 'b-warn' },
    accepted: { label: 'Accepted', cust: 'Technician confirmed', cls: 'b-brand' },
    ontheway: { label: 'On the way', cust: 'On the way', cls: 'b-brand' },
    arrived: { label: 'Arrived', cust: 'Technician arrived', cls: 'b-brand' },
    working: { label: 'In progress', cust: 'Work in progress', cls: 'b-brand' },
    completed: { label: 'Completed', cust: 'Completed', cls: 'b-ok' },
    cancelled: { label: 'Cancelled', cust: 'Cancelled', cls: 'b-bad' }
  };
  const isActive = j => j.status !== 'completed' && j.status !== 'cancelled';
  const extraTotal = j => j.extra.status === 'approved' ? j.extra.items.reduce((s, i) => s + i.price, 0) : 0;
  const jobTotal = j => Math.max(0, j.price - j.discount + extraTotal(j));
  function tripPoints(j) {
    const t = AC.techById[j.techId]; if (!t) return null;
    return route({ x: t.x, y: t.y }, { x: j.cust.x, y: j.cust.y });
  }
  function tripProgress(j, now) {
    if (!j.trip) return ['arrived', 'working', 'completed'].includes(j.status) ? 1 : 0;
    const p = (now - j.trip.startedAt) / j.trip.dur;
    return j.trip.loop ? p % 1 : Math.min(1, p);
  }
  function techPos(j, now) {
    const t = AC.techById[j.techId]; if (!t) return null;
    if (['arrived', 'working', 'completed'].includes(j.status)) return { x: j.cust.x + 30, y: j.cust.y + 4 };
    if (j.status === 'ontheway') return along(tripPoints(j), tripProgress(j, now));
    return { x: t.x, y: t.y };
  }
  function etaMin(j, now) {
    const pts = tripPoints(j); if (!pts) return 0;
    const left = routeLen(pts) * (1 - tripProgress(j, now || Date.now()));
    return Math.max(1, Math.round(left * 0.025 * 3.2));
  }
  /* Turn-by-turn style guidance along the demo route (production: OSRM or the device navigation app). */
  function navInfo(j, now) {
    const pts = tripPoints(j); if (!pts) return null; const p = tripProgress(j, now), M = 25; // 1 unit = 25 m
    const segs = [[pts[0], pts[1]], [pts[1], pts[2]]].map(([a, b]) => ({ a, b, len: dist(a, b) })).filter(x => x.len > 1), total = segs.reduce((a, x) => a + x.len, 0);
    if (!segs.length || p >= 1) return { arrived: true, remM: 0, etaMin: 0, text: 'You have arrived', rot: 0 };
    let d = p * total, i = 0; while (i < segs.length - 1 && d >= segs[i].len) { d -= segs[i].len; i++; }
    const sg = segs[i], vx = sg.b.x - sg.a.x, vy = sg.b.y - sg.a.y, horiz = Math.abs(vx) >= Math.abs(vy), dir = horiz ? (vx > 0 ? 'east' : 'west') : (vy > 0 ? 'south' : 'north'), rot = horiz ? (vx > 0 ? 0 : 180) : (vy > 0 ? 90 : -90);
    const rem = (sg.len - d) * M, fmt = m => m < 1000 ? Math.max(10, Math.round(m / 10) * 10) + ' m' : (m / 1000).toFixed(1) + ' km';
    let text = 'Continue ' + dir + ' for ' + fmt(rem) + ' to the customer';
    if (i < segs.length - 1) { const n = segs[i + 1], cross = vx * (n.b.y - n.a.y) - vy * (n.b.x - n.a.x); text = 'Continue ' + dir + ' for ' + fmt(rem) + ', then turn ' + (cross > 0 ? 'right' : 'left'); }
    const remM = (total - p * total) * M;
    return { arrived: false, remM, remTxt: remM < 1000 ? Math.round(remM / 10) * 10 + ' m' : (remM / 1000).toFixed(1) + ' km', etaMin: Math.max(1, Math.round(remM / 1000 * 3.2)), text, rot, next: fmt(rem) };
  }
  /* Helpers (sub-technicians) on a job: invited or accepted. A technician is lead or helper on a job, never both. */
  const helps = (j, id) => (j.crew || []).some(c => c.id === id && c.status !== 'declined' && c.status !== 'removed');
  const crewOn = j => (j.crew || []).filter(c => c.status === 'accepted');
  const needsHelper = j => isActive(j) && ['accepted', 'ontheway', 'arrived', 'working'].includes(j.status) && (j.helpersNeeded || 0) > (j.crew || []).filter(c => c.status === 'accepted' || c.status === 'invited').length;
  const engaged = (id, except) => S.jobs.some(j => j.id !== except && isActive(j) && ['accepted', 'ontheway', 'arrived', 'working'].includes(j.status) && (j.techId === id || helps(j, id)));
  function nearbyTechs(pt, opts) {
    opts = opts || {};
    return AC.techs
      .filter(t => (opts.vendor === undefined ? true : t.vendor === opts.vendor))
      .map(t => ({ t, d: dist(t, pt), online: S.online[t.id] !== false, busy: S.jobs.some(j => isActive(j) && ['ontheway', 'arrived', 'working'].includes(j.status) && (j.techId === t.id || helps(j, t.id))) }))
      .sort((a, b) => a.d - b.d);
  }

  /* ---------- Seed ---------- */
  function seed() {
    const n = Date.now(), ago = m => n - m * MIN;
    const mk = o => {
      const s = AC.svcById[o.svc], c = AC.custById[o.cust];
      const j = Object.assign({ units: 1, ac: 'Split', slot: 'Today, 4-6 PM', note: '', extra: { items: [], status: 'none' }, discount: 0, pay: { method: 'cod', status: 'unpaid' }, techId: null, vendorId: null, trip: null, rating: null, deposited: false, createdAt: ago(60), verified: true, otp: String(1000 + Math.floor(Math.random() * 9000)), tried: { vendors: [], techs: [] } }, o);
      j.cust = { id: c.id, name: c.name, phone: c.phone, area: c.area, addr: c.addr, x: c.x, y: c.y };
      j.price = s.price * j.units; j.svcName = s.name; return j;
    };
    const L = (k, m, by, note) => ({ k, at: ago(m), by, note: note || '' });
    const jobs = [
      mk({ id: 'J-2020', cust: 'C1', svc: 'ac-service', status: 'completed', techId: 'T1', createdAt: ago(60 * 24 * 40), slot: 'Past booking', pay: { method: 'bkash', status: 'paid' }, rating: { overall: 5, work: 5, behavior: 5, punctuality: 5, text: 'Rakib was on time and very tidy.' }, deposited: true,
        tl: [L('requested', 60 * 24 * 40, 'Customer'), L('assigned', 60 * 24 * 40 - 4, 'Admin'), L('completed', 60 * 24 * 40 - 160, 'Rakib Hasan')], warranty: true,
        report: { checks: AC.checklistFor('ac-service'), total: AC.checklistFor('ac-service').length, before: 2, after: 2, note: 'Filters were heavily clogged. Cooling is back to normal.', by: 'Rakib Hasan', at: ago(60 * 24 * 40 - 160), nextDue: ago(60 * 24 * 40 - 160) + AC.config.SERVICE_INTERVAL_DAYS * 86400000 } }),
      mk({ id: 'J-2043', cust: 'C9', svc: 'ac-gas', status: 'completed', techId: 'T1', createdAt: ago(300), pay: { method: 'cod', status: 'paid' }, rating: { overall: 5, work: 5, behavior: 5, punctuality: 5, text: 'Cooling is back. Fast and honest.' },
        tl: [L('requested', 300, 'Customer'), L('assigned', 296, 'Admin'), L('completed', 215, 'Rakib Hasan')] }),
      mk({ id: 'J-2045', cust: 'C10', svc: 'ac-repair', status: 'completed', techId: 'T1', createdAt: ago(230), pay: { method: 'cod', status: 'paid' }, rating: { overall: 4, work: 4, behavior: 4, punctuality: 3, text: 'Good work, arrived a little late.' },
        tl: [L('requested', 230, 'Customer'), L('assigned', 226, 'Admin'), L('completed', 150, 'Rakib Hasan')] }),
      mk({ id: 'J-2046', cust: 'C4', svc: 'ac-service', status: 'completed', techId: 'T3', createdAt: ago(190), pay: { method: 'bkash', status: 'paid' }, rating: { overall: 5, work: 5, behavior: 5, punctuality: 5, text: 'Very professional, would book again.' },
        tl: [L('requested', 190, 'Customer'), L('assigned', 185, 'Admin'), L('completed', 110, 'Imran Hossain')] }),
      mk({ id: 'J-2047', cust: 'C7', svc: 'ac-repair', status: 'completed', techId: 'T6', vendorId: 'V1', createdAt: ago(170), pay: { method: 'cod', status: 'paid' }, rating: { overall: 4, work: 4, behavior: 4, punctuality: 3, text: 'Fixed the leak. Fair price.' },
        tl: [L('requested', 170, 'Customer'), L('forwarded', 166, 'Admin', 'Forwarded to CoolTech Services'), L('assigned', 160, 'CoolTech Services'), L('completed', 95, 'Faruk Ahmed')] }),
      mk({ id: 'J-2048', cust: 'C5', svc: 'ac-cooling', status: 'completed', techId: 'T4', createdAt: ago(140), pay: { method: 'nagad', status: 'paid' }, rating: { overall: 5, work: 5, behavior: 5, punctuality: 5, text: 'Explained the problem clearly.' },
        tl: [L('requested', 140, 'Customer'), L('assigned', 135, 'Admin'), L('completed', 60, 'Jahid Karim')] }),
      mk({ id: 'J-2049', cust: 'C2', svc: 'ac-cooling', status: 'working', techId: 'T2', createdAt: ago(90), discount: 100,
        extra: { items: [{ label: 'Gas top-up (R32)', price: 2500 }], status: 'proposed', at: ago(6) },
        tl: [L('requested', 90, 'Customer'), L('assigned', 84, 'Admin'), L('accepted', 82, 'Sumon Mia'), L('ontheway', 70, 'Sumon Mia'), L('arrived', 52, 'Sumon Mia'), L('working', 40, 'Sumon Mia')] }),
      mk({ id: 'J-2050', cust: 'C8', svc: 'ac-service', status: 'ontheway', techId: 'T4', createdAt: ago(30),
        trip: { startedAt: ago(1), dur: 4.5 * MIN, loop: true },
        tl: [L('requested', 30, 'Customer'), L('assigned', 24, 'Admin'), L('accepted', 22, 'Jahid Karim'), L('ontheway', 1, 'Jahid Karim')] }),
      mk({ id: 'J-2051', cust: 'C3', svc: 'ac-repair', status: 'requested', createdAt: ago(6), slot: 'Today, 4-6 PM', note: 'Indoor unit is leaking water.', tl: [L('requested', 6, 'Customer')] }),
      mk({ id: 'J-2052', cust: 'C11', svc: 'ac-install', status: 'forwarded', vendorId: 'V1', createdAt: ago(18), slot: 'Tomorrow, 10 AM-12 PM', note: 'Bedroom, 2nd floor. Wall bracket ready.',
        tl: [L('requested', 18, 'Customer'), L('forwarded', 11, 'Admin', 'Own technicians busy. Forwarded to CoolTech Services')] }),
      mk({ id: 'J-2053', cust: 'C6', svc: 'ac-repair', status: 'assigned', techId: 'T9', vendorId: 'V3', offerAt: ago(0.35), createdAt: ago(25), slot: 'Today, 2-4 PM',
        tl: [L('requested', 25, 'Customer'), L('forwarded', 21, 'Admin', 'Forwarded to Metro Cooling Solutions'), L('assigned', 9, 'Metro Cooling Solutions')] })
    ];
    jobs.forEach(j => { if (j.status === 'completed') { j.incCredited = true; j.cashCounted = true; } });
    const wallets = {}; AC.techs.forEach(t => { const mine = jobs.filter(j => j.techId === t.id); wallets[t.id] = { cash: mine.filter(j => j.pay.method === 'cod' && j.pay.status === 'paid' && !j.deposited).reduce((a, j) => a + (j.price - j.discount + (j.extra.status === 'approved' ? j.extra.items.reduce((x, i) => x + i.price, 0) : 0)), 0), incentive: t.vendor ? 0 : Math.round(mine.filter(j => j.status === 'completed').reduce((a, j) => a + (j.price - j.discount), 0) * AC.config.INCENTIVE_RATE) }; });
    const items = (...a) => a.map(([pid, qty]) => ({ pid, qty, price: AC.catById[pid].price }));
    const sum = it => it.reduce((s, i) => s + i.price * i.qty, 0);
    const mo = (id, cust, it, status, pay, m, extra) => Object.assign({
      id, cust, items: it, status, subtotal: sum(it), discount: 0, delivery: 80, install: false, pay: { method: pay, status: status === 'delivered' ? 'paid' : (pay === 'cod' ? 'unpaid' : 'paid') },
      createdAt: ago(m), courier: null, tracking: null,
      tl: [{ k: 'placed', at: ago(m), by: 'Customer' }]
    }, extra || {});
    const orders = [
      mo('O-1033', 'C4', items(['bg1', 1]), 'delivered', 'bkash', 60 * 50, { courier: 'Pathao Courier', tracking: 'PT-48011', tl: [{ k: 'placed', at: ago(3000), by: 'Customer' }, { k: 'packed', at: ago(2940), by: 'Admin' }, { k: 'shipped', at: ago(2900), by: 'Admin' }, { k: 'delivered', at: ago(2600), by: 'Pathao Courier' }] }),
      mo('O-1034', 'C2', items(['cs1', 2], ['cs2', 1]), 'delivered', 'cod', 60 * 30, { courier: 'RedX', tracking: 'RX-77310', tl: [{ k: 'placed', at: ago(1800), by: 'Customer' }, { k: 'packed', at: ago(1740), by: 'Admin' }, { k: 'shipped', at: ago(1700), by: 'Admin' }, { k: 'delivered', at: ago(1500), by: 'RedX' }] }),
      mo('O-1035', 'C5', items(['bg4', 1], ['cs3', 1]), 'shipped', 'nagad', 60 * 20, { courier: 'Pathao Courier', tracking: 'PT-48217', tl: [{ k: 'placed', at: ago(1200), by: 'Customer' }, { k: 'packed', at: ago(1140), by: 'Admin' }, { k: 'shipped', at: ago(1100), by: 'Admin' }] }),
      mo('O-1036', 'C6', items(['ac2', 1]), 'packed', 'cod', 60 * 7, { install: true, inst: 1440, discount: 0, delivery: 350, tl: [{ k: 'placed', at: ago(420), by: 'Customer' }, { k: 'packed', at: ago(380), by: 'Admin' }] }),
      mo('O-1037', 'C3', items(['cs4', 1], ['cs5', 2]), 'placed', 'cod', 40),
      mo('O-1038', 'C8', items(['bg2', 1]), 'placed', 'card', 12)
    ];
    const M = (id, thread, from, text, m) => ({ id, thread, from, text, at: ago(m) });
    const msgs = [
      M('m1', 'C1', 'admin', 'Welcome to NEW, Nadia. Ask us anything about servicing or orders.', 60 * 24 * 2),
      M('m2', 'C2', 'customer', 'The technician says extra parts are needed. Can someone call me before he starts?', 11),
      M('m3', 'C3', 'customer', 'I booked a repair in Uttara. When will a technician reach me?', 5),
      M('m4', 'C3', 'admin', 'Thanks Farhana. We are matching you with a partner technician near Uttara.', 3),
      M('m5', 'C8', 'customer', 'Where is my daypack order?', 14)
    ];
    const CM = (id, thread, from, text, m) => ({ id, thread, from, text, at: ago(m) });
    const chat = [
      CM('c1', 'D:T3', 'tech', 'The customer is not opening the gate. I have been here for 10 minutes.', 9),
      CM('c2', 'D:T3', 'bot', 'Call the customer twice, then send a message in the job chat. Wait up to ten minutes at the address. If there is still no answer, tap Talk to an agent and dispatch will decide whether to reschedule or cancel.', 9),
      CM('c3', 'D:T3', 'tech', 'I called three times. No answer.', 6),
      CM('c4', 'D:T3', 'bot', 'I am passing you to a dispatch agent. You do not need to repeat yourself.', 6),
      CM('c5', 'D:T3', 'sys', 'Waiting for a dispatch agent', 6)
    ];
    const reviews = [
      { id: 'r1', cust: 'C4', pid: 'bg1', stars: 5, text: 'Beautiful stitching. Looks even better in person.', at: ago(2400) },
      { id: 'r2', cust: 'C2', pid: 'cs2', stars: 4, text: 'Light scent and my hair feels softer.', at: ago(1400) }
    ];
    return {
      rev: n, seq: { job: 2054, order: 1039, msg: 10, prod: 1, ren: 1 }, products: seedProducts(), vendorState: {}, renames: [], jobs, orders, msgs, chat, dispatch: { T3: { mode: 'waiting', miss: 0, agent: null, at: ago(6) } }, reviews,
      online: { T1: true, T2: true, T3: true, T4: true, T5: true, T6: true, T7: true, T8: true, T9: true },
      readAt: { C1: n, admin: ago(20) }, nread: {}, seen: {}, wallets, deposits: [], withdrawals: [], ledger: [], baseline: n - 15 * MIN, newTechs: [], roles: JSON.parse(JSON.stringify(AC.defaultRoles)), staff: JSON.parse(JSON.stringify(AC.defaultStaff)),
      extraCatalog: AC.parts.map((p, i) => ({ id: 'X' + (i + 1), label: p.label, price: p.price })), seq2: { tech: 10, x: 10 },
      notifs: [
        { id: 's1', aud: 'admin', at: ago(6), job: 'J-2051', kind: 'requested', text: 'New booking J-2051 from Farhana Akter, Uttara' },
        { id: 's2', aud: 'admin', at: ago(11), job: 'J-2052', kind: 'forwarded', text: 'J-2052 forwarded to CoolTech Services' },
        { id: 's3', aud: 'vendor:V1', at: ago(11), job: 'J-2052', kind: 'forwarded', text: 'New job forwarded to you: AC Installation in Mirpur (J-2052)' },
        { id: 's4', aud: 'admin', at: ago(6), job: 'J-2049', kind: 'extra', text: 'Extra work proposed on J-2049: \u09F32,500' }
      ]
    };
  }


  /* ---------- Marketplace: products belong to a vendor. A vendor's new product waits for admin approval. ---------- */
  const BASE_CATALOG = JSON.parse(JSON.stringify(AC.catalog));
  function seedProducts() {
    const list = BASE_CATALOG.map(p => Object.assign({}, p, { status: 'live', available: true, note: '', createdAt: Date.now() - 20 * 86400000 }));
    list.find(p => p.id === 'bg3').available = false;
    list.push({ id: 'ac5', vendorId: 'V4', cat: 'ac', brand: 'Hima', name: 'Portable AC 1 Ton', price: 36500, was: 0, rating: 0, kind: 'window', tint: 2, tag: 'Portable', variants: ['1 Ton'], stock: 12, sold: 0, status: 'pending', available: true, note: '', createdAt: Date.now() - 3 * 3600000 });
    list.push({ id: 'cs6', vendorId: 'V6', cat: 'cos', brand: 'Nodi', name: 'Aloe Vera Gel', price: 290, was: 0, rating: 0, kind: 'tube', tint: 2, tag: 'Local', variants: ['150 ml'], stock: 80, sold: 0, status: 'pending', available: true, note: '', createdAt: Date.now() - 50 * 60000 });
    return list;
  }
  function notifP(s, aud, text, kind) { s.notifs = s.notifs || []; const at = Date.now(); s.notifs.push({ id: 'P:' + aud + ':' + at + ':' + s.notifs.length, aud, text, kind: kind || 'product', at }); }
  const isLive = p => p.status === 'live';
  const canBuy = p => p.status === 'live' && p.available !== false && (p.stock == null || p.stock > 0);
  function syncCatalog() {
    const src = (S.products || []);
    AC.catalog.length = 0; src.forEach(p => AC.catalog.push(p));
    AC.catById = Object.fromEntries(AC.catalog.map(p => [p.id, p]));
  }
  function syncVendors() {
    const st = S.vendorState || {};
    AC.partners.forEach(v => { if (v.__name0 == null) v.__name0 = v.name; const n = (st[v.id] || {}).name; v.name = n || v.__name0; });
  }

  /* ---------- Notifications: one entry per recipient, derived from timeline events ---------- */
  const sumExtra = j => j.extra.items.reduce((a, i) => a + i.price, 0);
  function mkNotifs(j, e) {
    const t = AC.techById[j.techId], tn = t ? t.name : 'The technician', id = j.id, area = AC.areas[j.cust.area].n, svc = j.svcName;
    const vend = j.vendorId ? 'vendor:' + j.vendorId : null, cust = 'cust:' + j.cust.id, tech = t ? 'tech:' + t.id : null, out = [];
    const add = (aud, text, kind) => { if (aud) out.push({ aud, text, kind: kind || e.k }); };
    const staff = text => { add('admin', text); add(vend, text); };
    switch (e.k) {
      case 'requested': add('admin', 'New booking ' + id + ' from ' + j.cust.name + ', ' + area); add(cust, 'Booking ' + id + ' received. We are finding your technician.'); break;
      case 'forwarded': add('admin', id + ' forwarded to ' + (j.vendorId ? AC.vendById[j.vendorId].name : 'a vendor')); add(vend, 'New job forwarded to you: ' + svc + ' in ' + area + ' (' + id + ')'); add(cust, 'Your request is with a partner team. They will assign a technician shortly.'); break;
      case 'assigned': staff(tn + ' assigned to ' + id + ' by ' + e.by); add(tech, 'New job offer: ' + svc + ' in ' + area + ' (' + id + ')'); add(cust, tn + ' is assigned to your booking.'); break;
      case 'accepted': staff(tn + ' accepted ' + id); add(cust, tn + ' accepted your booking.'); break;
      case 'declined': staff(e.by + ' declined ' + id + '. It needs to be reassigned.'); add(cust, 'The technician is not available. We are finding another technician for ' + id + '.'); break;
      case 'timeout': staff(e.by + ' did not respond to ' + id + ' in time. Reassign it.'); add(cust, 'The technician did not respond. We are finding another technician for ' + id + '.'); break;
      case 'crew_need': staff(e.by + ': ' + e.note + ' (' + id + ')'); if (e.by !== tn) add(tech, e.note + ' on ' + id + '. Admin will add a helper.'); break;
      case 'crew_invited': { const h = (j.crew || []).filter(c => c.status === 'invited').pop(); staff(e.note + ' on ' + id); if (h) add('tech:' + h.id, 'You are invited as a helper on ' + id + ': ' + svc + ' in ' + area); add(tech, e.note + ' on ' + id); break; }
      case 'crew_joined': staff(e.by + ' joined ' + id + ' as helper'); add(tech, e.by + ' joined your job as helper.'); add(cust, e.by + ' will help ' + tn + ' on your booking.'); break;
      case 'crew_declined': staff(e.by + ' declined to help on ' + id + '. Find another helper.'); add(tech, e.by + ' declined to help.'); break;
      case 'crew_removed': staff(e.note + ' (' + id + ')'); break;
      case 'vendor_timeout': add('admin', e.by + ' has not assigned a technician for ' + id + '. Forward it to another vendor.'); break;
      case 'extra_req': staff(tn + ' needs a price for extra work on ' + id + ': ' + e.note); break;
      case 'ontheway': staff(tn + ' is on the way for ' + id); add(cust, tn + ' is on the way to you.'); break;
      case 'arrived': staff(tn + ' arrived for ' + id); add(cust, tn + ' has arrived.'); break;
      case 'working': staff(tn + ' started work on ' + id); add(cust, 'Work has started.'); break;
      case 'extra': staff('Extra work offered to the customer on ' + id + ': ' + AC.fmt.money(sumExtra(j))); if (e.by !== tn) add(tech, 'Price added for extra work. The customer will decide.'); add(cust, 'Extra work needs your approval: ' + AC.fmt.money(sumExtra(j)) + '.'); break;
      case 'extra_ok': staff('Extra work approved on ' + id + ' by ' + e.by); add(tech, 'Extra work approved. You can start.'); add(cust, 'Extra work approved.'); break;
      case 'extra_no': staff('Extra work declined on ' + id + ' by ' + e.by); add(tech, 'Extra work declined. Finish the original job only.'); add(cust, 'Extra work declined.'); break;
      case 'completed': staff(tn + ' completed ' + id + (e.note ? ' (' + e.note + ')' : '')); add(cust, 'Your job is completed. Thank you.'); break;
      case 'paid': staff('Payment received for ' + id); add(tech, 'Customer paid for ' + id); break;
      case 'rescheduled': staff(id + ' moved by ' + e.by + ': ' + e.note); add(tech, id + ' was moved to a new time: ' + j.slot); if (e.by !== 'Customer') add(cust, 'Your booking ' + id + ' was moved to ' + j.slot + '.'); break;
      case 'cancelled': staff(id + ' was cancelled by ' + e.by); add(tech, id + ' was cancelled.'); add(cust, 'Booking ' + id + ' is cancelled.'); break;
    }
    return out.map((x, i) => Object.assign({ id: id + ':' + e.k + ':' + e.at + ':' + i, at: e.at, job: id }, x));
  }
  function mkOrderNotifs(o, e) {
    const cust = 'cust:' + o.cust, c = AC.custById[o.cust], out = [], add = (aud, text) => out.push({ aud, text, kind: e.k === 'courier' ? 'courier' : e.k });
    switch (e.k) {
      case 'placed': add('admin', 'New order ' + o.id + ' from ' + c.name); add(cust, 'Order ' + o.id + ' placed. We will pack it shortly.'); break;
      case 'packed': add(cust, 'Order ' + o.id + ' is packed.'); break;
      case 'shipped': add(cust, 'Order ' + o.id + ' is with ' + o.courier + '. Tracking ' + o.tracking + '.'); break;
      case 'courier': add(cust, o.courier + ': ' + e.label + ' (' + o.id + ')'); break;
      case 'delivered': add(cust, 'Order ' + o.id + ' was delivered.'); add('admin', 'Order ' + o.id + ' delivered'); break;
      case 'cancelled': add(cust, 'Order ' + o.id + ' was cancelled.'); add('admin', 'Order ' + o.id + ' cancelled by ' + e.by); break;
    }
    return out.map((x, i) => Object.assign({ id: o.id + ':' + e.k + ':' + e.at + ':' + i, at: e.at, job: o.id }, x));
  }
  function derive(prev, next) {
    (next.orders || []).forEach(o => { const p = prev.orders.find(x => x.id === o.id), from = p ? p.tl.length : 0; o.tl.slice(from).forEach(e => mkOrderNotifs(o, e).forEach(n => (next.notifs = next.notifs || []).push(n))); });
    next.notifs = (next.notifs || []).slice(); next.nread = next.nread || {};
    next.jobs.forEach(j => { const o = prev.jobs.find(x => x.id === j.id), from = o ? o.tl.length : 0; j.tl.slice(from).forEach(e => mkNotifs(j, e).forEach(n => next.notifs.push(n))); });
    if (next.notifs.length > 150) next.notifs = next.notifs.slice(-150);
  }

  /* ---------- Persistence + sync ---------- */
  let CH = null; try { CH = new BroadcastChannel('shital-demo'); } catch (e) { }
  function load() { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { } return null; }
  function emit() {
    const msg = { shital: 1, state: S };
    try { CH && CH.postMessage(msg); } catch (e) { }
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
    try { if (window.parent !== window) window.parent.postMessage(msg, '*'); } catch (e) { }
    try { document.querySelectorAll('iframe').forEach(f => f.contentWindow && f.contentWindow.postMessage(msg, '*')); } catch (e) { }
  }
  function notify(prev) { subs.forEach(f => { try { f(S, prev); } catch (e) { console.error(e); } }); }
  function receive(st) { if (st && st.rev > S.rev) { const p = S; S = st; syncTechs(); syncCatalog(); syncVendors(); notify(p); } }
  if (CH) CH.onmessage = e => e.data && e.data.shital && receive(e.data.state);
  window.addEventListener('message', e => { if (e.data && e.data.shital) receive(e.data.state); });
  window.addEventListener('storage', e => { if (e.key === KEY && e.newValue) { try { receive(JSON.parse(e.newValue)); } catch (x) { } } });
  S = load() || seed();
  if (!S.jobs || !S.seq) S = seed();
  S.notifs = S.notifs || []; S.nread = S.nread || {}; S.newTechs = S.newTechs || []; S.seen = S.seen || {}; S.wallets = S.wallets || {}; S.deposits = S.deposits || []; S.withdrawals = S.withdrawals || []; S.ledger = S.ledger || []; S.baseline = S.baseline || (S.rev - 15 * MIN); S.roles = S.roles || JSON.parse(JSON.stringify(AC.defaultRoles)); S.staff = S.staff || JSON.parse(JSON.stringify(AC.defaultStaff)); S.extraCatalog = S.extraCatalog || AC.parts.map((p, i) => ({ id: 'X' + (i + 1), label: p.label, price: p.price })); S.seq2 = S.seq2 || { tech: 10, x: 10 };
  S.products = S.products || seedProducts(); S.vendorState = S.vendorState || {}; S.renames = S.renames || []; S.seq.prod = S.seq.prod || 1; S.seq.ren = S.seq.ren || 1;
  syncTechs(); syncCatalog(); syncVendors();

  function syncTechs() {
    const mine = new Set((S.newTechs || []).map(t => t.id));
    for (let i = AC.techs.length - 1; i >= 0; i--) if (AC.techs[i].dyn && !mine.has(AC.techs[i].id)) { delete AC.techById[AC.techs[i].id]; AC.techs.splice(i, 1); }
    (S.newTechs || []).forEach(t => { if (!AC.techById[t.id]) { AC.techs.push(t); AC.techById[t.id] = t; } });
  }
  function commit(fn) {
    const prev = S; const next = JSON.parse(JSON.stringify(S)); S = next;
    const out = fn(next); derive(prev, next); syncTechs(); syncCatalog(); syncVendors(); next.rev = Math.max(prev.rev + 1, Date.now());
    emit(); notify(prev); return out;
  }
  const job = id => S.jobs.find(j => j.id === id);
  const jt = j => j.price - j.discount + (j.extra.status === 'approved' ? j.extra.items.reduce((a, i) => a + i.price, 0) : 0);
  const wal = (s, id) => (s.wallets[id] = s.wallets[id] || { cash: 0, incentive: 0 });
  const led = (s, tech, kind, amount, note) => s.ledger.push({ id: 'L' + s.ledger.length + ':' + Date.now(), tech, kind, amount, note: note || '', at: Date.now() });
  /* Cash the technician holds, and the incentive they earned, are booked once per job when it is completed and paid. */
  function credit(s, j) {
    if (j.status !== 'completed' || j.pay.status !== 'paid' || !j.techId) return; const t = AC.techById[j.techId], w = wal(s, t.id), tot = jt(j);
    if (j.pay.method === 'cod' && !j.cashCounted) { j.cashCounted = true; w.cash += tot; led(s, t.id, 'cash_in', tot, j.id + ' cash collected'); }
    if (!j.incCredited && !t.vendor) { j.incCredited = true; const inc = Math.round(tot * AC.config.INCENTIVE_RATE); w.incentive += inc; led(s, t.id, 'incentive', inc, j.id + ' incentive'); }
  }
  const wnote = (s, aud, text) => s.notifs.push({ id: 'w' + Math.random().toString(36).slice(2), at: Date.now(), aud, job: '', kind: 'wallet', text });
  const fwdTime = j => { const e = j.tl.filter(x => x.k === 'forwarded').pop(); return e ? e.at : j.createdAt; };
  const push = (j, k, by, note) => j.tl.push({ k, at: Date.now(), by, note: note || '' });

  /* ---------- Actions ---------- */
  const A = {
    createJob(d) {
      return commit(s => {
        const sv = AC.svcById[d.svc], c = AC.custById[d.cust];
        const id = 'J-' + (s.seq.job++);
        const j = {
          id, cust: { id: c.id, name: c.name, phone: d.phone || c.phone, area: d.area || c.area, addr: d.addr || c.addr, x: c.x, y: c.y }, svc: d.svc, svcName: sv.name, units: d.units || 1, ac: d.ac || 'Split', slot: d.slot, note: d.note || '',
          price: sv.price * (d.units || 1), discount: d.discount || 0, extra: { items: [], status: 'none' }, pay: { method: d.method || 'cod', status: 'unpaid' }, status: 'requested', techId: null, vendorId: null, trip: null, rating: null, deposited: false,
          createdAt: Date.now(), tl: [], linkedOrder: d.linkedOrder || null, verified: !!d.verified, otp: String(1000 + Math.floor(Math.random() * 9000)), tried: { vendors: [], techs: [] }
        };
        /* Warranty claim: repair labour is free. Parts still go through the normal extra work approval. */
        if (d.warrantyOf) { j.warrantyOf = d.warrantyOf; j.discount = j.price; }
        push(j, 'requested', 'Customer', d.warrantyOf ? 'Warranty claim (' + d.warrantyOf + '). Labour is free.' : ''); s.jobs.unshift(j); return id;
      });
    },
    /* The customer (or admin) can move the time slot until the technician sets off. Everyone on the job is told. */
    reschedule(id, slot, by) { const j0 = job(id); if (!j0 || !RESCHEDULE_OK.includes(j0.status) || !slot || slot === j0.slot) return false; commit(s => { const j = s.jobs.find(x => x.id === id), was = j.slot; j.slot = slot; push(j, 'rescheduled', by || 'Customer', was + ' to ' + slot); }); return true; },
    assign(id, techId, by) {
      const j0 = job(id); if (!j0 || !AC.techById[techId] || !['requested', 'forwarded', 'assigned'].includes(j0.status) || helps(j0, techId)) return false;
      commit(s => {
        const j = s.jobs.find(x => x.id === id), t = AC.techById[techId], was = j.techId; j.tried = j.tried || { vendors: [], techs: [] };
        /* One lead technician per job. Only an unanswered request can be (re)assigned, and never to someone already on the crew. */
        if (!j || !t || !['requested', 'forwarded', 'assigned'].includes(j.status) || helps(j, techId)) return;
        if (was && was !== techId && !j.tried.techs.includes(was)) j.tried.techs.push(was);
        j.techId = techId; j.vendorId = t.vendor || null; j.status = 'assigned'; j.offerAt = Date.now(); j.vendorStale = false;
        push(j, 'assigned', by || 'Admin', (was ? 'Reassigned to ' : '') + t.name + (t.vendor ? ' (' + AC.vendById[t.vendor].name + ')' : ''));
      });
      return true;
    },
    /* Crew: the lead technician stays one person. Extra hands join as helpers (sub-technicians). */
    setHelpers(id, n, by) { const j0 = job(id); if (!j0 || !isActive(j0)) return false; n = Math.max(0, Math.min(AC.config.MAX_HELPERS, +n || 0)); if (n === (j0.helpersNeeded || 0)) return false; commit(s => { const j = s.jobs.find(x => x.id === id); j.helpersNeeded = n; push(j, 'crew_need', by || 'Admin', n ? n + (n > 1 ? ' helpers' : ' helper') + ' needed on this job' : 'No helper needed'); }); return true; },
    inviteHelper(id, techId, by) {
      const j0 = job(id), t = AC.techById[techId]; if (!j0 || !t || !isActive(j0) || !['assigned', 'accepted', 'ontheway', 'arrived', 'working'].includes(j0.status) || j0.techId === techId || helps(j0, techId)) return false;
      if ((j0.crew || []).filter(c => c.status === 'accepted' || c.status === 'invited').length >= AC.config.MAX_HELPERS) return false;
      commit(s => { const j = s.jobs.find(x => x.id === id); j.crew = j.crew || []; j.crew = j.crew.filter(c => c.id !== techId); j.crew.push({ id: techId, status: 'invited', at: Date.now(), by: by || 'Admin' }); if (!j.helpersNeeded || j.helpersNeeded < j.crew.filter(c => c.status !== 'declined' && c.status !== 'removed').length) j.helpersNeeded = j.crew.filter(c => c.status !== 'declined' && c.status !== 'removed').length; push(j, 'crew_invited', by || 'Admin', t.name + ' invited as helper'); }); return true;
    },
    helperRespond(id, techId, accept) {
      const j0 = job(id); if (!j0 || !(j0.crew || []).some(c => c.id === techId && c.status === 'invited')) return false; const t = AC.techById[techId];
      commit(s => { const j = s.jobs.find(x => x.id === id), c = j.crew.find(x => x.id === techId); c.status = accept ? 'accepted' : 'declined'; c.at = Date.now(); push(j, accept ? 'crew_joined' : 'crew_declined', t.name, accept ? 'Joined as helper' : 'Helper declined'); }); return true;
    },
    removeHelper(id, techId, by) { const j0 = job(id); if (!j0 || !helps(j0, techId)) return false; const t = AC.techById[techId]; commit(s => { const j = s.jobs.find(x => x.id === id), c = j.crew.find(x => x.id === techId); c.status = 'removed'; c.at = Date.now(); push(j, 'crew_removed', by || 'Admin', t.name + ' removed from the crew'); }); return true; },
    forward(id, vendorId, note) {
      commit(s => {
        const j = s.jobs.find(x => x.id === id); j.tried = j.tried || { vendors: [], techs: [] };
        if (j.vendorId && j.vendorId !== vendorId && !j.tried.vendors.includes(j.vendorId)) j.tried.vendors.push(j.vendorId);
        if (j.techId && !j.tried.techs.includes(j.techId)) j.tried.techs.push(j.techId);
        j.vendorId = vendorId; j.techId = null; j.status = 'forwarded'; j.vendorStale = false; j.fwdAt = Date.now();
        push(j, 'forwarded', 'Admin', note || 'Forwarded to ' + AC.vendById[vendorId].name);
      });
    },
    respond(id, accept) {
      commit(s => {
        const j = s.jobs.find(x => x.id === id); const t = AC.techById[j.techId]; j.tried = j.tried || { vendors: [], techs: [] };
        if (accept) { j.status = 'accepted'; push(j, 'accepted', t.name); }
        else { push(j, 'declined', t.name, 'Technician declined'); if (!j.tried.techs.includes(t.id)) j.tried.techs.push(t.id); j.techId = null; j.status = j.vendorId ? 'forwarded' : 'requested'; }
      });
    },
    /* Called by a timer in every app. Marks offers nobody answered and vendors that never assigned. Safe to call often. */
    expire() {
      const now = Date.now(), need = S.jobs.some(j => (j.status === 'assigned' && j.offerAt && now - j.offerAt > AC.config.OFFER_SECONDS * 1000) || (j.status === 'forwarded' && !j.vendorStale && now - (j.fwdAt || fwdTime(j)) > AC.config.VENDOR_MINUTES * 60000));
      if (!need) return;
      commit(s => s.jobs.forEach(j => {
        j.tried = j.tried || { vendors: [], techs: [] };
        if (j.status === 'assigned' && j.offerAt && now - j.offerAt > AC.config.OFFER_SECONDS * 1000) {
          const t = AC.techById[j.techId]; push(j, 'timeout', t.name, 'No response in ' + AC.config.OFFER_SECONDS + ' seconds'); if (!j.tried.techs.includes(t.id)) j.tried.techs.push(t.id); j.techId = null; j.status = j.vendorId ? 'forwarded' : 'requested'; j.fwdAt = Date.now();
        } else if (j.status === 'forwarded' && !j.vendorStale && now - (j.fwdAt || fwdTime(j)) > AC.config.VENDOR_MINUTES * 60000) {
          j.vendorStale = true; push(j, 'vendor_timeout', AC.vendById[j.vendorId].name, 'No technician assigned in ' + AC.config.VENDOR_MINUTES + ' minutes');
        }
      }));
    },
    vendorDecline(id) { commit(s => { const j = s.jobs.find(x => x.id === id); const v = AC.vendById[j.vendorId]; j.tried = j.tried || { vendors: [], techs: [] }; if (v && !j.tried.vendors.includes(v.id)) j.tried.vendors.push(v.id); push(j, 'declined', v ? v.name : 'Vendor', 'Vendor declined the job'); j.vendorId = null; j.techId = null; j.status = 'requested'; }); },
    startTrip(id, opt) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'ontheway'; j.trip = { startedAt: Date.now(), dur: (opt && opt.dur) || 36000 }; push(j, 'ontheway', AC.techById[j.techId].name); }); },
    arrive(id) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'arrived'; push(j, 'arrived', AC.techById[j.techId].name); }); },
    startWork(id) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'working'; push(j, 'working', AC.techById[j.techId].name); }); },
    proposeExtra(id, items) { commit(s => { const j = s.jobs.find(x => x.id === id); j.extra = { items, status: 'proposed', at: Date.now() }; push(j, 'extra', AC.techById[j.techId].name, 'Extra work proposed: ' + AC.fmt.money(items.reduce((a, i) => a + i.price, 0))); }); },
    resolveExtra(id, ok, by) { commit(s => { const j = s.jobs.find(x => x.id === id); j.extra.status = ok ? 'approved' : 'declined'; push(j, ok ? 'extra_ok' : 'extra_no', by, ok ? 'Extra work approved' : 'Extra work declined'); }); },
    /* Technician completes with the customer's code. Admin can override from the admin panel; the source is logged. */
    complete(id, cashCollected, code, via, reason, report) {
      const j0 = job(id); if (!j0) return false;
      if (via !== 'admin' && String(code) !== String(j0.otp)) return false;
      commit(s => {
        const j = s.jobs.find(x => x.id === id); const who = via === 'admin' ? 'Admin' : AC.techById[j.techId].name;
        j.status = 'completed'; push(j, 'completed', who, via === 'admin' ? 'via Admin panel. Override: ' + (reason || 'no reason given') : 'via Technician app. Customer code verified');
        if ((cashCollected && j.pay.method === 'cod') || jobTotal(j) === 0) { j.pay.status = 'paid'; j.pay.paidAt = Date.now(); }
        /* Service report: what was checked, photo counts and a note. The customer and admin can read it; it also sets the next service date. */
        if (report) j.report = { checks: report.checks || [], total: report.total || (report.checks || []).length, before: report.before || 0, after: report.after || 0, note: String(report.note || '').trim(), by: who, at: Date.now(), nextDue: Date.now() + AC.config.SERVICE_INTERVAL_DAYS * 86400000 };
        credit(s, j);
      });
      return true;
    },
    /* Admin override for any job step. Always logged with the source. */
    adminSetStatus(id, status, reason) {
      commit(s => {
        const j = s.jobs.find(x => x.id === id), by = 'Admin', note = 'via Admin panel. Override: ' + (reason || 'no reason given');
        if (status === 'cancelled') { j.status = 'cancelled'; push(j, 'cancelled', by, note); return; }
        if (!j.techId) return;
        j.status = status; if (status === 'ontheway' && !j.trip) j.trip = { startedAt: Date.now(), dur: 36000 };
        push(j, status, by, note);
        if (status === 'completed' && j.pay.method === 'cod') { j.pay.status = 'paid'; j.pay.paidAt = Date.now(); }
        credit(s, j);
      });
    },
    adminMarkPaid(id, reason) { commit(s => { const j = s.jobs.find(x => x.id === id); j.pay.status = 'paid'; j.pay.paidAt = Date.now(); push(j, 'paid', 'Admin', 'via Admin panel. Override: ' + (reason || 'marked paid')); credit(s, j); }); },
    /* Extra work: the technician picks from the price list, or asks for a price. Admin or vendor quotes. The customer decides. */
    requestExtraItem(id, text) { commit(s => { const j = s.jobs.find(x => x.id === id); j.extraReq = { text, at: Date.now(), status: 'open' }; push(j, 'extra_req', AC.techById[j.techId].name, text); }); },
    quoteExtra(id, label, price, by, save) {
      commit(s => {
        const j = s.jobs.find(x => x.id === id), item = { label, price: +price }; if (save) s.extraCatalog.push({ id: 'X' + (s.seq2.x++), label, price: +price });
        j.extra = { items: (j.extra.status === 'proposed' ? j.extra.items : []).concat([item]), status: 'proposed', at: Date.now() }; if (j.extraReq) j.extraReq.status = 'quoted';
        push(j, 'extra', by, 'Priced ' + label + ': ' + AC.fmt.money(price));
      });
    },
    addExtraOption(label, price) { commit(s => { s.extraCatalog.push({ id: 'X' + (s.seq2.x++), label, price: +price }); }); },
    removeExtraOption(id) { commit(s => { s.extraCatalog = s.extraCatalog.filter(x => x.id !== id); }); },
    pay(id, method) { commit(s => { const j = s.jobs.find(x => x.id === id); j.pay = { method, status: 'paid', paidAt: Date.now() }; push(j, 'paid', 'Customer', 'Paid with ' + AC.payName(method)); credit(s, j); }); },
    rate(id, r) { commit(s => { const j = s.jobs.find(x => x.id === id); j.rating = Object.assign({ at: Date.now() }, r); }); },
    cancel(id, by) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'cancelled'; push(j, 'cancelled', by || 'Customer'); }); },
    setOnline(techId, on) { commit(s => { s.online[techId] = on; }); },
    addTech(d) {
      return commit(s => {
        const id = 'T' + (s.seq2.tech++), a = AC.areas[d.area], t = { id, name: d.name, vendor: d.vendor || null, area: d.area, x: a.x + (Math.random() * 30 - 15), y: a.y + 20 + Math.random() * 20, phone: d.phone, rating: 0, jobs: 0, dyn: true, by: d.vendor || 'admin', kyc: d.kyc };
        s.newTechs.push(t); s.online[id] = true; AC.techs.push(t); AC.techById[id] = t;
        const who = d.vendor ? AC.vendById[d.vendor].name : 'NEW Admin';
        s.notifs.push({ id: 'tech:' + id, at: Date.now(), aud: 'admin', job: '', kind: 'tech', text: 'New technician ' + t.name + ' added by ' + who + '. Identity verified.' });
        if (d.vendor) s.notifs.push({ id: 'techv:' + id, at: Date.now(), aud: 'vendor:' + d.vendor, job: '', kind: 'tech', text: t.name + ' was added to your team. Identity verified.' });
        return id;
      });
    },
    saveRole(r) { commit(s => { const i = s.roles.findIndex(x => x.id === r.id); if (i >= 0) s.roles[i] = r; else s.roles.push(r); }); },
    setStaffRole(id, role) { commit(s => { s.staff.find(x => x.id === id).role = role; }); },
    addStaff(u) { commit(s => { s.staff.push(Object.assign({ id: 'U' + (s.staff.length + 1 + Math.floor(Math.random() * 90)) }, u)); }); },
    courierEvent(id, label, by) {
      commit(s => {
        const o = s.orders.find(x => x.id === id); o.courierStatus = label; o.tl.push({ k: 'courier', label, at: Date.now(), by: by || 'Admin' });
        if (label === 'Delivered') { o.status = 'delivered'; o.pay.status = 'paid'; o.tl.push({ k: 'delivered', at: Date.now(), by: o.courier || 'Courier' }); }
      });
    },
    cancelOrder(id, reason) { commit(s => { const o = s.orders.find(x => x.id === id); o.status = 'cancelled'; o.tl.push({ k: 'cancelled', at: Date.now(), by: 'Admin', label: reason || '' }); }); },
    /* Wallet. Cash the technician collected stays on their balance until the receiver (NEW, or the vendor for vendor technicians) accepts a deposit. */
    requestDeposit(techId, amount, method, ref) {
      return commit(s => {
        const t = AC.techById[techId], w = wal(s, techId), amt = Math.min(+amount, w.cash), id = 'D' + (s.deposits.length + 1) + '-' + Date.now().toString(36);
        s.deposits.push({ id, tech: techId, amount: amt, method, ref: ref || '', at: Date.now(), status: 'pending', to: t.vendor ? 'vendor:' + t.vendor : 'admin' });
        wnote(s, t.vendor ? 'vendor:' + t.vendor : 'admin', t.name + ' requests to deposit ' + AC.fmt.money(amt) + ' (' + method + ')'); return id;
      });
    },
    acceptDeposit(id, by) {
      commit(s => {
        const d = s.deposits.find(x => x.id === id); if (!d || d.status !== 'pending') return; const w = wal(s, d.tech); d.status = 'accepted'; d.by = by; d.decidedAt = Date.now();
        w.cash = Math.max(0, w.cash - d.amount); if (d.method === 'Net against incentive') w.incentive = Math.max(0, w.incentive - d.amount);
        led(s, d.tech, d.method === 'Net against incentive' ? 'net' : 'deposit', d.amount, 'Accepted by ' + by);
        s.jobs.forEach(j => { if (j.techId === d.tech && j.pay.method === 'cod' && j.pay.status === 'paid' && w.cash === 0) j.deposited = true; });
        wnote(s, 'tech:' + d.tech, 'Your deposit of ' + AC.fmt.money(d.amount) + ' was accepted by ' + by + '. Cash to deposit: ' + AC.fmt.money(w.cash) + '.');
      });
    },
    rejectDeposit(id, by, note) { commit(s => { const d = s.deposits.find(x => x.id === id); if (!d || d.status !== 'pending') return; d.status = 'rejected'; d.by = by; d.decidedAt = Date.now(); d.note = note || ''; wnote(s, 'tech:' + d.tech, 'Your deposit of ' + AC.fmt.money(d.amount) + ' was not accepted by ' + by + (note ? ': ' + note : '. Contact them.')); }); },
    requestNet(techId) { const w = S.wallets[techId] || { cash: 0, incentive: 0 }, amt = Math.min(w.cash, w.incentive); if (amt <= 0) return null; return A.requestDeposit(techId, amt, 'Net against incentive', 'Net settlement'); },
    requestWithdraw(techId, amount, method, number) {
      return commit(s => {
        const t = AC.techById[techId], w = wal(s, techId), amt = Math.min(+amount, w.incentive); if (amt <= 0 || w.cash > 0) return null;
        w.incentive -= amt; const id = 'W' + (s.withdrawals.length + 1) + '-' + Date.now().toString(36); s.withdrawals.push({ id, tech: techId, amount: amt, method, number, at: Date.now(), status: 'pending' });
        wnote(s, 'admin', t.name + ' requests a withdrawal of ' + AC.fmt.money(amt) + ' to ' + method); return id;
      });
    },
    payWithdraw(id, by, ref) { commit(s => { const x = s.withdrawals.find(v => v.id === id); if (!x || x.status !== 'pending') return; x.status = 'paid'; x.by = by; x.ref = ref || ''; x.decidedAt = Date.now(); led(s, x.tech, 'withdraw', x.amount, 'Paid to ' + x.method + ' ' + x.number); wnote(s, 'tech:' + x.tech, 'Withdrawal of ' + AC.fmt.money(x.amount) + ' was sent to your ' + x.method + '.'); }); },
    rejectWithdraw(id, by, note) { commit(s => { const x = s.withdrawals.find(v => v.id === id); if (!x || x.status !== 'pending') return; x.status = 'rejected'; x.by = by; wal(s, x.tech).incentive += x.amount; wnote(s, 'tech:' + x.tech, 'Withdrawal of ' + AC.fmt.money(x.amount) + ' was returned to your balance' + (note ? ': ' + note : '.')); }); },
    deposit(techId) { commit(s => { const w = wal(s, techId); if (w.cash > 0) led(s, techId, 'deposit', w.cash, 'Recorded by admin'); w.cash = 0; s.jobs.forEach(j => { if (j.techId === techId && j.pay.method === 'cod' && j.pay.status === 'paid') j.deposited = true; }); }); },
    placeOrder(o) {
      return commit(s => {
        const id = 'O-' + (s.seq.order++);
        if (o.items) o.items = o.items.map(i => Object.assign({ vendorId: (AC.catById[i.pid] || {}).vendorId || null }, i));
        const ord = Object.assign({ id, status: 'placed', courier: null, tracking: null, createdAt: Date.now(), tl: [{ k: 'placed', at: Date.now(), by: 'Customer' }] }, o);
        s.orders.unshift(ord);
        if (o.install) {
          const c = AC.custById[o.cust], sv = AC.svcById['ac-install'];
          const jid = 'J-' + (s.seq.job++);
          const j = { id: jid, cust: { id: c.id, name: c.name, phone: o.phone || c.phone, area: c.area, addr: o.addr || c.addr, x: c.x, y: c.y }, svc: 'ac-install', svcName: sv.name, units: 1, ac: 'Split', slot: 'After delivery of ' + id, note: 'Linked to order ' + id + '. Bundle discount applied.', price: sv.price, discount: Math.round(sv.price * 0.2), extra: { items: [], status: 'none' }, pay: { method: o.pay.method, status: 'unpaid' }, status: 'requested', techId: null, vendorId: null, trip: null, rating: null, deposited: false, createdAt: Date.now(), tl: [], linkedOrder: id, warranty: true, verified: !!o.verified, otp: String(1000 + Math.floor(Math.random() * 9000)), tried: { vendors: [], techs: [] } };
          push(j, 'requested', 'Customer', 'Created with order ' + id); s.jobs.unshift(j); ord.jobId = jid;
        }
        return id;
      });
    },
    advanceOrder(id) {
      commit(s => {
        const o = s.orders.find(x => x.id === id); const flow = ['placed', 'packed', 'shipped', 'delivered']; const i = flow.indexOf(o.status); if (i >= flow.length - 1) return;
        o.status = flow[i + 1];
        if (o.status === 'shipped') { o.courier = AC.couriers[Math.floor(Math.random() * 2)]; o.tracking = (o.courier[0] === 'P' ? 'PT-' : 'RX-') + (40000 + Math.floor(Math.random() * 50000)); }
        if (o.status === 'delivered') o.pay.status = 'paid';
        o.tl.push({ k: o.status, at: Date.now(), by: o.status === 'delivered' ? (o.courier || 'Courier') : 'Admin' });
      });
    },
    /* Job chat: customer and technician can text while the technician is on the job. It closes when the job ends. */
    jobChat(id, from, text) { text = String(text || '').trim(); if (!text) return; commit(s => { const j = s.jobs.find(x => x.id === id); if (!j || !CHAT_OPEN.includes(j.status)) return; s.chat.push({ id: 'c' + (s.seq.msg++), thread: 'J:' + id, from, text, at: Date.now() }); }); },
    /* Dispatch help: technician writes, the assistant answers, and the chat moves to a human agent when needed. */
    dispatchSend(techId, text) { text = String(text || '').trim(); if (!text) return; commit(s => { const th = 'D:' + techId, d = s.dispatch[techId] = s.dispatch[techId] || { mode: 'bot', miss: 0, agent: null }, add = (from, t, by) => s.chat.push({ id: 'c' + (s.seq.msg++), thread: th, from, text: t, at: Date.now() + s.chat.length % 3, by }); add('tech', text); d.at = Date.now(); if (d.mode !== 'bot') return; const j = s.jobs.find(x => x.techId === techId && CHAT_OPEN.includes(x.status)), r = AC.bot.reply(text, d.miss, j); d.miss = r.miss; add('bot', r.text); if (r.handoff) { d.mode = 'waiting'; add('sys', 'Waiting for a dispatch agent'); } }); },
    dispatchHandoff(techId) { commit(s => { const th = 'D:' + techId, d = s.dispatch[techId] = s.dispatch[techId] || { mode: 'bot', miss: 0, agent: null }; if (d.mode !== 'bot') return; const add = (from, t) => s.chat.push({ id: 'c' + (s.seq.msg++), thread: th, from, text: t, at: Date.now(), by: undefined }); add('tech', 'Talk to an agent'); add('bot', 'I am passing this to a dispatch agent. You do not need to repeat yourself.'); add('sys', 'Waiting for a dispatch agent'); d.mode = 'waiting'; d.at = Date.now(); }); },
    dispatchAgent(techId, text, by) { text = String(text || '').trim(); if (!text) return; commit(s => { const d = s.dispatch[techId] = s.dispatch[techId] || { mode: 'bot', miss: 0, agent: null }; if (d.mode !== 'agent') s.chat.push({ id: 'c' + (s.seq.msg++), thread: 'D:' + techId, from: 'sys', text: by + ' joined the chat', at: Date.now() }); d.mode = 'agent'; d.agent = by; d.at = Date.now(); s.chat.push({ id: 'c' + (s.seq.msg++), thread: 'D:' + techId, from: 'agent', text, at: Date.now() + 1, by }); }); },
    dispatchTakeover(techId, by) { commit(s => { const d = s.dispatch[techId]; if (!d || d.mode === 'agent') return; d.mode = 'agent'; d.agent = by; d.at = Date.now(); s.chat.push({ id: 'c' + (s.seq.msg++), thread: 'D:' + techId, from: 'sys', text: by + ' joined the chat', at: Date.now() }); }); },
    dispatchResolve(techId, by) { commit(s => { const d = s.dispatch[techId]; if (!d || d.mode === 'bot') return; d.mode = 'bot'; d.miss = 0; d.agent = null; d.at = Date.now(); s.chat.push({ id: 'c' + (s.seq.msg++), thread: 'D:' + techId, from: 'sys', text: 'Resolved by ' + by + '. Message again any time.', at: Date.now() }); }); },
    send(thread, from, text) { commit(s => { s.msgs.push({ id: 'm' + (s.seq.msg++), thread, from, text, at: Date.now() }); }); },
    markSeen(aud, key) { commit(s => { (s.seen[aud] = s.seen[aud] || {})[key] = Date.now(); }); },
    markNotifs(aud) { commit(s => { s.nread[aud] = Date.now(); }); },
    markRead(who, thread) { commit(s => { s.readAt[who + ':' + thread] = Date.now(); }); },
    /* ----- Marketplace ----- */
    addProduct(vendorId, d) {
      return commit(s => {
        const id = (vendorId || 'N') + '-P' + (s.seq.prod++), by = vendorId ? AC.vendById[vendorId].name : 'NEW';
        s.products.push({ id, vendorId: vendorId || null, cat: d.cat, brand: d.brand || by, name: d.name, price: +d.price || 0, was: +d.was || 0, rating: 0, kind: d.kind || ({ ac: 'split', bag: 'tote', cos: 'tube' })[d.cat], tint: Math.floor(Math.random() * 6), tag: d.tag || '', variants: d.variants && d.variants.length ? d.variants : ['Standard'], stock: +d.stock || 0, sold: 0, status: vendorId ? 'pending' : 'live', available: true, note: '', createdAt: Date.now() });
        if (vendorId) { notifP(s, 'admin', by + ' submitted a new product for approval: ' + d.name, 'product'); }
        return id;
      });
    },
    /* A vendor edits only its own product. Price and stock go live at once. */
    editProduct(pid, vendorId, patch) {
      const p0 = S.products.find(x => x.id === pid); if (!p0 || (vendorId && p0.vendorId !== vendorId) || p0.status === 'removed') return false;
      commit(s => { const p = s.products.find(x => x.id === pid); ['name', 'price', 'was', 'stock', 'tag', 'brand'].forEach(k => { if (patch[k] != null && patch[k] !== '') p[k] = ['price', 'was', 'stock'].includes(k) ? +patch[k] : patch[k]; }); if (p.status === 'rejected') { p.status = 'pending'; p.note = ''; notifP(s, 'admin', (AC.vendById[p.vendorId] || { name: 'A vendor' }).name + ' resubmitted ' + p.name + ' for approval', 'product'); } }); return true;
    },
    /* Vendors cannot delete. They mark a product unavailable (out of stock) or available again. */
    setAvailable(pid, vendorId, on) {
      const p0 = S.products.find(x => x.id === pid); if (!p0 || (vendorId && p0.vendorId !== vendorId) || p0.available === !!on) return false;
      commit(s => { const p = s.products.find(x => x.id === pid); p.available = !!on; }); return true;
    },
    approveProduct(pid, by) { const p0 = S.products.find(x => x.id === pid); if (!p0 || p0.status === 'live') return false; commit(s => { const p = s.products.find(x => x.id === pid); p.status = 'live'; p.note = ''; p.liveAt = Date.now(); if (p.vendorId) notifP(s, 'vendor:' + p.vendorId, p.name + ' is approved and live in the store.', 'product'); }); return true; },
    rejectProduct(pid, reason, by) { const p0 = S.products.find(x => x.id === pid); if (!p0 || p0.status !== 'pending') return false; commit(s => { const p = s.products.find(x => x.id === pid); p.status = 'rejected'; p.note = reason || 'Not approved'; if (p.vendorId) notifP(s, 'vendor:' + p.vendorId, p.name + ' was not approved: ' + p.note, 'product'); }); return true; },
    removeProduct(pid, reason, by) { const p0 = S.products.find(x => x.id === pid); if (!p0 || p0.status === 'removed') return false; commit(s => { const p = s.products.find(x => x.id === pid); p.status = 'removed'; p.note = reason || 'Removed by admin'; p.removedAt = Date.now(); if (p.vendorId) notifP(s, 'vendor:' + p.vendorId, 'Admin removed ' + p.name + ': ' + p.note, 'product'); }); return true; },
    restoreProduct(pid) { const p0 = S.products.find(x => x.id === pid); if (!p0 || p0.status !== 'removed') return false; commit(s => { const p = s.products.find(x => x.id === pid); p.status = 'live'; p.note = ''; if (p.vendorId) notifP(s, 'vendor:' + p.vendorId, p.name + ' is live again.', 'product'); }); return true; },
    /* ----- Vendor name: one free change. After that a vendor asks admin and gives a reason. ----- */
    renameVendor(vid, name) {
      name = String(name || '').trim(); const st = (S.vendorState || {})[vid] || {}, used = st.changes || 0;
      if (!name || name === AC.vendById[vid].name || used >= AC.config.VENDOR_NAME_CHANGES) return false;
      commit(s => { const v = (s.vendorState[vid] = s.vendorState[vid] || { changes: 0, history: [] }), was = AC.vendById[vid].name; v.history = v.history || []; v.history.push({ from: was, to: name, at: Date.now(), by: 'Vendor' }); v.name = name; v.changes = (v.changes || 0) + 1; notifP(s, 'admin', was + ' changed its name to ' + name, 'vendor'); }); return true;
    },
    requestRename(vid, name, reason) {
      name = String(name || '').trim(); reason = String(reason || '').trim(); if (!name || !reason || name === AC.vendById[vid].name) return false;
      if ((((S.vendorState || {})[vid] || {}).changes || 0) < AC.config.VENDOR_NAME_CHANGES) return false;
      if (S.renames.some(r => r.vid === vid && r.status === 'pending')) return false;
      commit(s => { s.renames.unshift({ id: 'N' + (s.seq.ren++), vid, name, reason, status: 'pending', at: Date.now(), from: AC.vendById[vid].name }); notifP(s, 'admin', AC.vendById[vid].name + ' asks to change its name to ' + name + '. Reason: ' + reason, 'vendor'); }); return true;
    },
    decideRename(id, ok, by, note) {
      const r0 = S.renames.find(x => x.id === id); if (!r0 || r0.status !== 'pending') return false;
      commit(s => { const r = s.renames.find(x => x.id === id), v = (s.vendorState[r.vid] = s.vendorState[r.vid] || { changes: 0, history: [] }); r.status = ok ? 'approved' : 'declined'; r.decidedAt = Date.now(); r.note = note || ''; if (ok) { v.history = v.history || []; v.history.push({ from: r.from, to: r.name, at: Date.now(), by: 'Admin approved' }); v.name = r.name; v.changes = (v.changes || 0) + 1; } notifP(s, 'vendor:' + r.vid, ok ? 'Your name change to ' + r.name + ' is approved.' : 'Your name change request was declined' + (note ? ': ' + note : '.'), 'vendor'); }); return true;
    },
    reset() { const fresh = seed(); fresh.rev = Math.max(S.rev + 1, Date.now()); const prev = S; S = fresh; syncTechs(); syncCatalog(); syncVendors(); emit(); notify(prev); }
  };

  /* Autopilot: plays the admin, vendor and technician roles so one app can be demoed alone. */
  const timers = {};
  function auto(id, opts) {
    opts = opts || {}; clearTimeout(timers[id]); let workStart = 0;
    const tick = () => {
      const j = job(id); if (!j || !isActive(j)) return; let d = 2200;
      switch (j.status) {
        case 'requested': {
          const near = nearbyTechs(j.cust, { vendor: null }).filter(x => x.d <= AC.SERVICE_RADIUS && x.online && !x.busy)[0];
          if (near) A.assign(id, near.t.id, 'Admin');
          else { const v = AC.vendors.slice().sort((a, b) => dist(a, j.cust) - dist(b, j.cust))[0]; A.forward(id, v.id); d = 2800; }
          break;
        }
        case 'forwarded': {
          const near = nearbyTechs(j.cust, {}).filter(x => x.t.vendor === j.vendorId)[0];
          A.assign(id, near.t.id, AC.vendById[j.vendorId].name); break;
        }
        case 'assigned': A.respond(id, true); break;
        case 'accepted': A.startTrip(id, { dur: 16000 }); d = 1000; break;
        case 'ontheway': if (tripProgress(j, Date.now()) >= 1) A.arrive(id); else d = 800; break;
        case 'arrived': A.startWork(id); break;
        case 'working':
          if (j.extra.status === 'proposed') { d = 1500; break; }
          if (opts.extra && j.extra.status === 'none') { A.proposeExtra(id, [AC.parts[1]]); d = 1500; break; }
          if (j.extra.status === 'proposed') { d = 1500; break; }
          if (!workStart) { workStart = Date.now(); d = 4500; break; }
          A.complete(id, true, j.otp); return;
      }
      timers[id] = setTimeout(tick, d);
    };
    timers[id] = setTimeout(tick, 1200);
  }

  window.AC.store = {
    get: () => S, subscribe: f => { subs.push(f); return () => subs.splice(subs.indexOf(f), 1); },
    act: A, job, helps, engaged, crewOn, needsHelper, auto, navInfo, ORDER, META, isActive, jobTotal, extraTotal, dist, route, routeLen, along, tripPoints, tripProgress, techPos, etaMin, nearbyTechs,
    ordTotal: o => Math.max(0, o.subtotal + (o.inst || 0) - o.discount + o.delivery),
    notifs: aud => (S.notifs || []).filter(n => n.aud === aud).slice().reverse(),
    /* Read state: an item is unread when someone else changed it after you last opened it. Your own actions never flag it. */
    isUnread(aud, key, ver) { const t = Math.max(((S.seen || {})[aud] || {})[key] || 0, S.baseline || 0); return ver > t; },
    jobVer(j, aud) { const mine = e => aud === 'admin' ? e.by === 'Admin' : aud.startsWith('vendor:') ? e.by === (AC.vendById[aud.slice(7)] || {}).name : aud.startsWith('tech:') ? e.by === (AC.techById[aud.slice(5)] || {}).name : e.by === 'Customer'; const ev = j.tl.filter(e => !mine(e)); return ev.length ? ev[ev.length - 1].at : 0; },
    orderVer(o, aud) { const ev = o.tl.filter(e => aud === 'admin' ? e.by !== 'Admin' : e.by !== 'Customer'); return ev.length ? ev[ev.length - 1].at : 0; },
    threadVer(thread, aud) { const from = aud === 'admin' ? 'customer' : 'admin', m = S.msgs.filter(x => x.thread === thread && x.from === from), mine = S.msgs.filter(x => x.thread === thread && x.from !== from); const last = m.length ? m[m.length - 1].at : 0, reply = mine.length ? mine[mine.length - 1].at : 0; return last > reply ? last : 0; },
    unread(aud, kind) {
      const st = S, isU = (k, v) => v && this.isUnread(aud, k, v), out = { jobs: [], orders: [], threads: [] };
      st.jobs.forEach(j => { const mineJ = aud === 'admin' || (aud.startsWith('vendor:') && j.vendorId === aud.slice(7)) || (aud.startsWith('tech:') && j.techId === aud.slice(5)) || (aud.startsWith('cust:') && j.cust.id === aud.slice(5)); if (mineJ && isU('j:' + j.id, this.jobVer(j, aud))) out.jobs.push(j.id); });
      if (aud === 'admin' || aud.startsWith('cust:')) st.orders.forEach(o => { if ((aud === 'admin' || o.cust === aud.slice(5)) && isU('o:' + o.id, this.orderVer(o, aud))) out.orders.push(o.id); });
      if (aud === 'admin') [...new Set(st.msgs.map(m => m.thread))].forEach(t => { if (isU('t:' + t, this.threadVer(t, aud))) out.threads.push(t); });
      if (aud.startsWith('cust:') && isU('t:' + aud.slice(5), this.threadVer(aud.slice(5), aud))) out.threads.push(aud.slice(5));
      return kind ? out[kind] : out;
    },
    notifUnread: aud => (S.notifs || []).filter(n => n.aud === aud && n.at > ((S.nread || {})[aud] || 0)).length,
    watch: (aud, cb) => subs.push((s, p) => { const a = typeof aud === 'function' ? aud() : aud, seen = new Set((p.notifs || []).map(n => n.id)); (s.notifs || []).filter(n => n.aud === a && !seen.has(n.id)).forEach(cb); }),
    threadMsgs: t => S.msgs.filter(m => m.thread === t),
    canReschedule: j => !!j && RESCHEDULE_OK.includes(j.status),
    /* Warranties: one year of free repair labour after an AC is installed by NEW. Derived from installation jobs and delivered AC orders. */
    /* Marketplace queries */
    isLive, canBuy,
    productsOf(vid) { return S.products.filter(p => p.vendorId === vid); },
    storeProducts() { return S.products.filter(isLive); },
    sellerName(p) { return p.vendorId ? (AC.vendById[p.vendorId] || { name: 'Vendor' }).name : 'NEW'; },
    /* Sales lines from orders. Admin earns a commission on every vendor line; NEW own products have no commission. */
    sales(vid) {
      const rows = [];
      S.orders.forEach(o => { if (o.status === 'cancelled') return; o.items.forEach(i => { const p = AC.catById[i.pid], v = i.vendorId !== undefined ? i.vendorId : (p ? p.vendorId : null); if (!v || (vid && v !== vid)) return; const gross = i.price * i.qty, rate = AC.config.GOODS_COMMISSION, fee = Math.round(gross * rate); rows.push({ order: o.id, at: o.createdAt, pid: i.pid, name: p ? p.name : i.pid, qty: i.qty, vendorId: v, gross, rate, fee, net: gross - fee, settled: o.status === 'delivered' }); }); });
      return rows;
    },
    pendingRename(vid) { return S.renames.find(r => r.vid === vid && r.status === 'pending') || null; },
    nameChangesLeft(vid) { return Math.max(0, AC.config.VENDOR_NAME_CHANGES - (((S.vendorState || {})[vid] || {}).changes || 0)); },
    warranties(custId) {
      const out = [], day = 86400000, len = AC.config.WARRANTY_DAYS * day;
      S.jobs.forEach(j => { if (j.cust.id === custId && j.status === 'completed' && (j.warranty || j.svc === 'ac-install')) { const e = j.tl.filter(x => x.k === 'completed').pop(), start = e ? e.at : j.createdAt; out.push({ id: 'W-' + j.id.slice(2), ref: j.id, title: j.svc === 'ac-install' ? 'AC installation' : 'Split AC', start, end: start + len }); } });
      (S.orders || []).forEach(o => { if (o.cust === custId && o.install && o.status === 'delivered' && !o.jobId) { const e = o.tl.filter(x => x.k === 'delivered').pop(), start = e ? e.at : Date.now(); out.push({ id: 'W-' + o.id.slice(2), ref: o.id, title: (o.items.find(i => (AC.catById[i.pid] || {}).cat === 'ac') || { name: 'Air conditioner' }).name || 'Air conditioner', start, end: start + len }); } });
      return out.map(w => Object.assign(w, { daysLeft: Math.max(0, Math.ceil((w.end - Date.now()) / day)), active: w.end > Date.now(), claims: S.jobs.filter(j => j.warrantyOf === w.id).length })).sort((a, b) => b.start - a.start);
    },
    /* AC care: the latest service report tells the customer when the next servicing is due. */
    careFor(custId) { const j = S.jobs.filter(x => x.cust.id === custId && x.report && x.report.nextDue).sort((a, b) => b.report.at - a.report.at)[0]; if (!j) return null; const days = Math.ceil((j.report.nextDue - Date.now()) / 86400000); return { job: j.id, svcName: j.svcName, at: j.report.at, due: j.report.nextDue, days, overdue: days < 0, soon: days <= 30 }; },
    chatMsgs: t => (S.chat || []).filter(m => m.thread === t).sort((a, b) => a.at - b.at),
    chatOpen: j => !!j && CHAT_OPEN.includes(j.status),
    dispatchOf: id => (S.dispatch || {})[id] || { mode: 'bot', miss: 0, agent: null },
    /* Newest message from the other side, or 0 once the reader has replied after it. */
    chatVer(thread, aud) {
      const dm = S.dispatch || {}, ms = (S.chat || []).filter(x => x.thread === thread);
      const other = thread.startsWith('J:') ? (aud.startsWith('cust:') ? ['tech'] : ['customer']) : aud === 'admin' ? ['tech'] : ['bot', 'agent'];
      const mine = thread.startsWith('J:') ? (aud.startsWith('cust:') ? ['customer'] : ['tech']) : aud === 'admin' ? ['agent'] : ['tech'];
      if (thread.startsWith('D:') && aud === 'admin' && (dm[thread.slice(2)] || {}).mode === 'bot') return 0;
      const last = ms.filter(x => other.includes(x.from)).reduce((a, x) => Math.max(a, x.at), 0), reply = ms.filter(x => mine.includes(x.from)).reduce((a, x) => Math.max(a, x.at), 0);
      return last > reply || (thread.startsWith('D:') && aud.startsWith('tech:')) ? last : 0;
    },
    chatUnread(aud) {
      const out = [], th = new Set((S.chat || []).map(m => m.thread)), id = aud.includes(':') ? aud.split(':')[1] : '';
      th.forEach(t => {
        let mineT = false;
        if (t.startsWith('J:')) { const j = S.jobs.find(x => x.id === t.slice(2)); mineT = !!j && ((aud.startsWith('cust:') && j.cust.id === id) || (aud.startsWith('tech:') && j.techId === id)); }
        else mineT = aud === 'admin' || (aud.startsWith('tech:') && t === 'D:' + id);
        if (mineT && this.isUnread(aud, 'c:' + t, this.chatVer(t, aud))) out.push(t);
      });
      return out;
    },
    wallet: id => (S.wallets || {})[id] || { cash: 0, incentive: 0 },
    ratingOf: j => j.rating ? (j.rating.overall || j.rating.stars || 0) : 0
  };
  setInterval(() => { try { A.expire(); } catch (e) { } }, 3000);
})();