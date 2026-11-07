/* Shared live store. The three prototypes (and the showcase hub) stay in sync through
   BroadcastChannel + localStorage + postMessage relay, so an action in one app shows up in the others in real time.
   In the Flutter build this layer becomes the backend API + realtime channel (see docs/ARCHITECTURE.md). */
(function () {
  const KEY = 'shital.demo.v1', MIN = 60000;
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
  function nearbyTechs(pt, opts) {
    opts = opts || {};
    return AC.techs
      .filter(t => (opts.vendor === undefined ? true : t.vendor === opts.vendor))
      .map(t => ({ t, d: dist(t, pt), online: S.online[t.id] !== false, busy: S.jobs.some(j => j.techId === t.id && isActive(j) && ['ontheway', 'arrived', 'working'].includes(j.status)) }))
      .sort((a, b) => a.d - b.d);
  }

  /* ---------- Seed ---------- */
  function seed() {
    const n = Date.now(), ago = m => n - m * MIN;
    const mk = o => {
      const s = AC.svcById[o.svc], c = AC.custById[o.cust];
      const j = Object.assign({ units: 1, ac: 'Split', slot: 'Today, 4-6 PM', note: '', extra: { items: [], status: 'none' }, discount: 0, pay: { method: 'cod', status: 'unpaid' }, techId: null, vendorId: null, trip: null, rating: null, deposited: false, createdAt: ago(60) }, o);
      j.cust = { id: c.id, name: c.name, phone: c.phone, area: c.area, addr: c.addr, x: c.x, y: c.y };
      j.price = s.price * j.units; j.svcName = s.name; return j;
    };
    const L = (k, m, by, note) => ({ k, at: ago(m), by, note: note || '' });
    const jobs = [
      mk({ id: 'J-2020', cust: 'C1', svc: 'ac-service', status: 'completed', techId: 'T1', createdAt: ago(60 * 24 * 40), slot: 'Past booking', pay: { method: 'bkash', status: 'paid' }, rating: { stars: 5, text: 'Rakib was on time and very tidy.' }, deposited: true,
        tl: [L('requested', 60 * 24 * 40, 'Customer'), L('assigned', 60 * 24 * 40 - 4, 'Admin'), L('completed', 60 * 24 * 40 - 160, 'Rakib Hasan')], warranty: true }),
      mk({ id: 'J-2043', cust: 'C9', svc: 'ac-gas', status: 'completed', techId: 'T1', createdAt: ago(300), pay: { method: 'cod', status: 'paid' }, rating: { stars: 5, text: 'Cooling is back. Fast and honest.' },
        tl: [L('requested', 300, 'Customer'), L('assigned', 296, 'Admin'), L('completed', 215, 'Rakib Hasan')] }),
      mk({ id: 'J-2045', cust: 'C10', svc: 'ac-repair', status: 'completed', techId: 'T1', createdAt: ago(230), pay: { method: 'cod', status: 'paid' }, rating: { stars: 4, text: 'Good work, arrived a little late.' },
        tl: [L('requested', 230, 'Customer'), L('assigned', 226, 'Admin'), L('completed', 150, 'Rakib Hasan')] }),
      mk({ id: 'J-2046', cust: 'C4', svc: 'ac-service', status: 'completed', techId: 'T3', createdAt: ago(190), pay: { method: 'bkash', status: 'paid' }, rating: { stars: 5, text: 'Very professional, would book again.' },
        tl: [L('requested', 190, 'Customer'), L('assigned', 185, 'Admin'), L('completed', 110, 'Imran Hossain')] }),
      mk({ id: 'J-2047', cust: 'C7', svc: 'ac-repair', status: 'completed', techId: 'T6', vendorId: 'V1', createdAt: ago(170), pay: { method: 'cod', status: 'paid' }, rating: { stars: 4, text: 'Fixed the leak. Fair price.' },
        tl: [L('requested', 170, 'Customer'), L('forwarded', 166, 'Admin', 'Forwarded to CoolTech Services'), L('assigned', 160, 'CoolTech Services'), L('completed', 95, 'Faruk Ahmed')] }),
      mk({ id: 'J-2048', cust: 'C5', svc: 'ac-cooling', status: 'completed', techId: 'T4', createdAt: ago(140), pay: { method: 'nagad', status: 'paid' }, rating: { stars: 5, text: 'Explained the problem clearly.' },
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
      mk({ id: 'J-2053', cust: 'C6', svc: 'ac-repair', status: 'assigned', techId: 'T9', vendorId: 'V3', createdAt: ago(25), slot: 'Today, 2-4 PM',
        tl: [L('requested', 25, 'Customer'), L('forwarded', 21, 'Admin', 'Forwarded to Metro Cooling Solutions'), L('assigned', 9, 'Metro Cooling Solutions')] })
    ];
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
      M('m1', 'C1', 'admin', 'Welcome to Shital, Nadia. Ask us anything about servicing or orders.', 60 * 24 * 2),
      M('m2', 'C2', 'customer', 'The technician says extra parts are needed. Can someone call me before he starts?', 11),
      M('m3', 'C3', 'customer', 'I booked a repair in Uttara. When will a technician reach me?', 5),
      M('m4', 'C3', 'admin', 'Thanks Farhana. We are matching you with a partner technician near Uttara.', 3),
      M('m5', 'C8', 'customer', 'Where is my daypack order?', 14)
    ];
    const reviews = [
      { id: 'r1', cust: 'C4', pid: 'bg1', stars: 5, text: 'Beautiful stitching. Looks even better in person.', at: ago(2400) },
      { id: 'r2', cust: 'C2', pid: 'cs2', stars: 4, text: 'Light scent and my hair feels softer.', at: ago(1400) }
    ];
    return {
      rev: n, seq: { job: 2054, order: 1039, msg: 10 }, jobs, orders, msgs, reviews,
      online: { T1: true, T2: true, T3: true, T4: true, T5: true, T6: true, T7: true, T8: true, T9: true },
      readAt: { C1: n, admin: ago(20) }
    };
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
  function receive(st) { if (st && st.rev > S.rev) { const p = S; S = st; notify(p); } }
  if (CH) CH.onmessage = e => e.data && e.data.shital && receive(e.data.state);
  window.addEventListener('message', e => { if (e.data && e.data.shital) receive(e.data.state); });
  window.addEventListener('storage', e => { if (e.key === KEY && e.newValue) { try { receive(JSON.parse(e.newValue)); } catch (x) { } } });
  S = load() || seed();
  if (!S.jobs || !S.seq) S = seed();

  function commit(fn) {
    const prev = S; const next = JSON.parse(JSON.stringify(S)); S = next;
    const out = fn(next); next.rev = Math.max(prev.rev + 1, Date.now());
    emit(); notify(prev); return out;
  }
  const job = id => S.jobs.find(j => j.id === id);
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
          createdAt: Date.now(), tl: [], linkedOrder: d.linkedOrder || null
        };
        push(j, 'requested', 'Customer'); s.jobs.unshift(j); return id;
      });
    },
    assign(id, techId, by) {
      commit(s => { const j = s.jobs.find(x => x.id === id); const t = AC.techById[techId]; j.techId = techId; j.vendorId = t.vendor || null; j.status = 'assigned'; push(j, 'assigned', by || 'Admin', t.name + (t.vendor ? ' (' + AC.vendById[t.vendor].name + ')' : '')); });
    },
    forward(id, vendorId, note) {
      commit(s => { const j = s.jobs.find(x => x.id === id); j.vendorId = vendorId; j.techId = null; j.status = 'forwarded'; push(j, 'forwarded', 'Admin', note || 'Forwarded to ' + AC.vendById[vendorId].name); });
    },
    respond(id, accept) {
      commit(s => {
        const j = s.jobs.find(x => x.id === id); const t = AC.techById[j.techId];
        if (accept) { j.status = 'accepted'; push(j, 'accepted', t.name); }
        else { push(j, 'declined', t.name, 'Technician declined'); j.techId = null; j.status = j.vendorId ? 'forwarded' : 'requested'; }
      });
    },
    vendorDecline(id) { commit(s => { const j = s.jobs.find(x => x.id === id); const v = AC.vendById[j.vendorId]; push(j, 'declined', v ? v.name : 'Vendor', 'Vendor declined the job'); j.vendorId = null; j.techId = null; j.status = 'requested'; }); },
    startTrip(id, opt) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'ontheway'; j.trip = { startedAt: Date.now(), dur: (opt && opt.dur) || 36000 }; push(j, 'ontheway', AC.techById[j.techId].name); }); },
    arrive(id) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'arrived'; push(j, 'arrived', AC.techById[j.techId].name); }); },
    startWork(id) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'working'; push(j, 'working', AC.techById[j.techId].name); }); },
    proposeExtra(id, items) { commit(s => { const j = s.jobs.find(x => x.id === id); j.extra = { items, status: 'proposed', at: Date.now() }; push(j, 'extra', AC.techById[j.techId].name, 'Extra work proposed: ' + AC.fmt.money(items.reduce((a, i) => a + i.price, 0))); }); },
    resolveExtra(id, ok, by) { commit(s => { const j = s.jobs.find(x => x.id === id); j.extra.status = ok ? 'approved' : 'declined'; push(j, ok ? 'extra_ok' : 'extra_no', by, ok ? 'Extra work approved' : 'Extra work declined'); }); },
    complete(id, cashCollected) {
      commit(s => {
        const j = s.jobs.find(x => x.id === id); j.status = 'completed'; push(j, 'completed', AC.techById[j.techId].name);
        if (cashCollected && j.pay.method === 'cod') { j.pay.status = 'paid'; j.pay.paidAt = Date.now(); }
      });
    },
    pay(id, method) { commit(s => { const j = s.jobs.find(x => x.id === id); j.pay = { method, status: 'paid', paidAt: Date.now() }; push(j, 'paid', 'Customer', 'Paid with ' + AC.payName(method)); }); },
    rate(id, stars, text) { commit(s => { const j = s.jobs.find(x => x.id === id); j.rating = { stars, text }; }); },
    cancel(id, by) { commit(s => { const j = s.jobs.find(x => x.id === id); j.status = 'cancelled'; push(j, 'cancelled', by || 'Customer'); }); },
    setOnline(techId, on) { commit(s => { s.online[techId] = on; }); },
    deposit(techId) { commit(s => { s.jobs.forEach(j => { if (j.techId === techId && j.pay.method === 'cod' && j.pay.status === 'paid') j.deposited = true; }); }); },
    placeOrder(o) {
      return commit(s => {
        const id = 'O-' + (s.seq.order++);
        const ord = Object.assign({ id, status: 'placed', courier: null, tracking: null, createdAt: Date.now(), tl: [{ k: 'placed', at: Date.now(), by: 'Customer' }] }, o);
        s.orders.unshift(ord);
        if (o.install) {
          const c = AC.custById[o.cust], sv = AC.svcById['ac-install'];
          const jid = 'J-' + (s.seq.job++);
          const j = { id: jid, cust: { id: c.id, name: c.name, phone: o.phone || c.phone, area: c.area, addr: o.addr || c.addr, x: c.x, y: c.y }, svc: 'ac-install', svcName: sv.name, units: 1, ac: 'Split', slot: 'After delivery of ' + id, note: 'Linked to order ' + id + '. Bundle discount applied.', price: sv.price, discount: Math.round(sv.price * 0.2), extra: { items: [], status: 'none' }, pay: { method: o.pay.method, status: 'unpaid' }, status: 'requested', techId: null, vendorId: null, trip: null, rating: null, deposited: false, createdAt: Date.now(), tl: [], linkedOrder: id, warranty: true };
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
    send(thread, from, text) { commit(s => { s.msgs.push({ id: 'm' + (s.seq.msg++), thread, from, text, at: Date.now() }); }); },
    markRead(who, thread) { commit(s => { s.readAt[who + ':' + thread] = Date.now(); }); },
    reset() { const fresh = seed(); fresh.rev = Math.max(S.rev + 1, Date.now()); const prev = S; S = fresh; emit(); notify(prev); }
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
          if (!workStart) { workStart = Date.now(); d = 4500; break; }
          A.complete(id, true); return;
      }
      timers[id] = setTimeout(tick, d);
    };
    timers[id] = setTimeout(tick, 1200);
  }

  window.AC.store = {
    get: () => S, subscribe: f => { subs.push(f); return () => subs.splice(subs.indexOf(f), 1); },
    act: A, job, auto, ORDER, META, isActive, jobTotal, extraTotal, dist, route, routeLen, along, tripPoints, tripProgress, techPos, etaMin, nearbyTechs,
    ordTotal: o => Math.max(0, o.subtotal + (o.inst || 0) - o.discount + o.delivery),
    threadMsgs: t => S.msgs.filter(m => m.thread === t)
  };
})();
