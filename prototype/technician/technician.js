/* Shital technician app prototype. Default user: Rakib Hasan (T1, own staff). Switch to a vendor technician from Profile. */
(function () {
  const S = AC.store, money = AC.fmt.money, $app = document.getElementById('app');
  const ui = { me: 'T1', tab: 'jobs', stack: [], sheet: null, signed: true, extra: {}, done: { cash: false, ck: [true, true, false], photos: 1 }, key: '', scroll: {}, map: null };
  try { if (sessionStorage.getItem('tech.me')) ui.me = sessionStorage.getItem('tech.me'); if (sessionStorage.getItem('tech.out')) ui.signed = false; } catch (e) { }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = () => AC.techById[ui.me];
  const mine = () => S.get().jobs.filter(j => j.techId === ui.me);
  const offer = () => mine().find(j => j.status === 'assigned');
  const current = () => mine().find(j => ['accepted', 'ontheway', 'arrived', 'working'].includes(j.status));
  const doneJobs = () => mine().filter(j => j.status === 'completed');
  const INC = 0.12;
  function toast(msg, ic) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon(ic || 'checkc', 18) + '<span>' + esc(msg) + '</span>'; document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 3200); }
  const top = (title, o) => `<div class="top">${o && o.back === false ? '' : `<button class="back" data-a="back" aria-label="Back">${icon('left', 22)}</button>`}<h1>${title}</h1>${(o && o.right) || ''}</div>`;

  function Login() {
    return `<div class="login"><div class="mark">${icon('snow', 30, 2)}</div><div><h1 style="font-size:30px">Shital Technician</h1><p class="muted" style="margin-top:6px">Sign in with the phone number registered by your admin or vendor.</p></div>
      <div class="field"><label for="f-p">Phone number</label><input class="input" id="f-p" value="${T().phone}" readonly></div>
      <div class="field"><label>One-time code</label><div class="otp"><span>4</span><span>8</span><span>1</span><span>9</span></div><span class="faint" style="font-size:12px">Demo code is filled in for you.</span></div>
      <button class="btn btn-p btn-lg btn-block" data-a="signin">Verify and continue</button></div>`;
  }

  function Home() {
    const t = T(), of = offer(), cur = current(), on = S.get().online[ui.me] !== false, dj = doneJobs();
    const earn = Math.round(dj.reduce((s, j) => s + S.jobTotal(j), 0) * INC);
    const offerHtml = of ? `<div class="offer"><div class="offer-h"><span>New job offer</span><span>${icon('clock', 16)}</span></div><div style="background:var(--brand);padding:0 16px 12px"><div class="bar"><i></i></div></div>
      <div class="offer-b"><div class="big">${esc(of.svcName)}</div>
        <div class="kv">${icon('pin', 18)}<span><b>${AC.areas[of.cust.area].n}</b> . ${AC.fmt.km(S.dist(t, of.cust))} away<br><span class="muted">${esc(of.cust.addr)}</span></span></div>
        <div class="kv">${icon('clock', 18)}<span>${esc(of.slot)}</span></div>
        <div class="kv">${icon('wallet', 18)}<span><b>${money(S.jobTotal(of))}</b> . ${AC.payName(of.pay.method)}${of.vendorId ? '<br><span class="muted">From ' + esc(AC.vendById[of.vendorId].name) + '</span>' : ''}</span></div>
        <div class="row"><button class="btn btn-s btn-lg grow" data-a="decline" data-id="${of.id}">Decline</button><button class="btn btn-p btn-lg grow" style="flex:1.5" data-a="accept" data-id="${of.id}">Accept job</button></div></div></div>` : '';
    const curHtml = cur ? `<div class="sec"><div class="sec-h"><h2>Active job</h2></div><div style="padding:0 20px"><button class="jcard active" data-a="job" data-v="${cur.id}"><span class="svc-ic">${icon(AC.svcById[cur.svc].icon, 22)}</span><span class="grow"><b>${esc(cur.svcName)}</b><div class="muted" style="font-size:13px">${esc(cur.cust.name)} . ${AC.areas[cur.cust.area].n}</div></span><span class="badge ${S.META[cur.status].cls}">${S.META[cur.status].label}</span></button></div></div>` : '';
    const empty = !of && !cur ? `<div class="empty" style="padding-top:36px"><div class="radar"><span class="core">${icon(on ? 'nav' : 'power', 26, 2)}</span></div><h3>${on ? 'Waiting for jobs' : 'You are offline'}</h3><span>${on ? 'New requests near ' + AC.areas[t.area].n + ' appear here.' : 'Go online to receive requests.'}</span></div>` : '';
    return `<div class="top"><div class="grow"><small class="muted" style="font-weight:600">${t.vendor ? 'Partner of ' + esc(AC.vendById[t.vendor].name) : 'Shital technician'}</small><h1 style="font-size:24px">Hi, ${esc(t.name.split(' ')[0])}</h1></div><div class="avatar">${AC.fmt.ini(t.name)}</div></div>
    <button class="online ${on ? '' : 'off'}" data-a="online"><span class="dotg"></span><span class="grow"><b>${on ? 'Online' : 'Offline'}</b><div class="muted" style="font-size:12.5px">${on ? 'Accepting jobs in ' + AC.areas[t.area].n : 'Not receiving requests'}</div></span><span class="sw ${on ? 'on' : ''}"></span></button>
    <div class="statrow"><div class="stat"><small>Jobs today</small><b>${dj.length + (cur ? 1 : 0)}</b></div><div class="stat"><small>${t.vendor ? 'Job value' : 'Incentive'}</small><b>${money(t.vendor ? dj.reduce((s, j) => s + S.jobTotal(j), 0) : earn)}</b></div><div class="stat"><small>Rating</small><b>${t.rating}</b></div></div>
    ${offerHtml}${curHtml}${empty}
    ${dj.length ? `<div class="sec"><div class="sec-h"><h2>Completed today</h2></div><div class="stack" style="gap:10px">${dj.map(j => `<button class="jcard" data-a="job" data-v="${j.id}"><span class="svc-ic" style="background:var(--ok-l);color:var(--ok)">${icon('check', 20, 2.2)}</span><span class="grow"><b>${esc(j.svcName)}</b><div class="muted" style="font-size:13px">${esc(j.cust.name)} . ${AC.areas[j.cust.area].n}</div></span><b>${money(S.jobTotal(j))}</b></button>`).join('')}</div></div>` : ''}
    <div class="pad sec"><div class="proto"><div class="eyebrow">Prototype tools</div><div class="muted" style="font-size:13px">Creates a request near you and assigns it, as the admin would.</div><button class="btn btn-s" data-a="sim">Simulate incoming job offer</button></div></div>`;
  }

  function Job(id) {
    const j = S.job(id); if (!j) return top('Job');
    const cod = j.pay.method === 'cod';
    const stepHint = { assigned: 'Review and accept to start.', accepted: 'Head to the customer when ready.', ontheway: 'Customer can see your live location.', arrived: 'Greet the customer and confirm the issue.', working: 'Only do work covered by the booking. Anything extra needs approval first.', completed: 'Job finished.' }[j.status];
    return `${top(esc(j.id), { right: `<span class="badge ${S.META[j.status].cls}">${S.META[j.status].label}</span>` })}
    <div class="trackmap" id="trackmap" style="height:210px"></div>
    <div class="stack" style="margin-top:14px">
      <div class="cardx"><div class="row" style="align-items:flex-start"><span class="svc-ic">${icon(AC.svcById[j.svc].icon, 22)}</span><div class="grow"><b style="font-size:16px">${esc(j.svcName)}</b><div class="muted" style="font-size:13px">${j.units} x ${esc(j.ac)} AC . ${esc(j.slot)}</div></div><b>${money(S.jobTotal(j))}</b></div>
        ${j.note ? `<div class="note" style="margin-top:12px">${icon('info', 18)}<span>${esc(j.note)}</span></div>` : ''}</div>
      <div class="cardx"><div class="row"><div class="avatar">${AC.fmt.ini(j.cust.name)}</div><div class="grow"><b>${esc(j.cust.name)}</b><div class="muted" style="font-size:13px">${esc(j.cust.addr)}</div></div></div>
        <div class="actions" style="grid-template-columns:1fr 1fr"><button class="btn btn-s" data-a="toast" data-v="Calling ${esc(j.cust.name)} (dialer opens in the real app)">${icon('phone', 18)}Call</button><button class="btn btn-s" data-a="toast" data-v="Opening WhatsApp with ${esc(j.cust.name)}">${icon('chat', 18)}WhatsApp</button></div></div>
      <div class="cardx"><div class="row between"><b>Payment</b><span class="badge ${j.pay.status === 'paid' ? 'b-ok' : cod ? 'b-warn' : 'b-info'}">${j.pay.status === 'paid' ? 'Paid' : cod ? 'Collect cash' : 'Customer pays online'}</span></div>
        <div class="sum" style="margin-top:12px"><div><span>Service</span><span>${money(j.price)}</span></div>${j.discount ? `<div class="sv"><span>Discount</span><span>-${money(j.discount)}</span></div>` : ''}${j.extra.status === 'approved' ? `<div><span>Approved extra work</span><span>${money(S.extraTotal(j))}</span></div>` : ''}<div class="tot"><span>Total</span><span>${money(S.jobTotal(j))}</span></div></div></div>
      ${j.extra.status === 'proposed' ? `<div class="note warn">${icon('clock', 18)}<span><b>Waiting for approval.</b> Admin is confirming ${money(j.extra.items.reduce((a, i) => a + i.price, 0))} of extra work with the customer. Do not start it yet.</span></div>` : ''}
      ${j.extra.status === 'declined' ? `<div class="note">${icon('info', 18)}<span>Customer declined extra work. Finish the original job only.</span></div>` : ''}
      ${stepHint ? `<div class="muted" style="text-align:center;font-size:13px">${stepHint}</div>` : ''}</div>`;
  }
  function jobCta(j) {
    if (j.status === 'assigned') return `<div class="cta-bar two"><button class="btn btn-s btn-big" data-a="decline" data-id="${j.id}">Decline</button><button class="btn btn-p btn-big" style="flex:1.6" data-a="accept" data-id="${j.id}">Accept job</button></div>`;
    if (j.status === 'accepted') return `<div class="cta-bar"><button class="btn btn-p btn-big btn-block" data-a="trip" data-id="${j.id}">${icon('nav', 20)} Start trip</button></div>`;
    if (j.status === 'ontheway') return `<div class="cta-bar"><button class="btn btn-p btn-big btn-block" data-a="arrive" data-id="${j.id}">${icon('pin', 20)} I have arrived</button></div>`;
    if (j.status === 'arrived') return `<div class="cta-bar"><button class="btn btn-p btn-big btn-block" data-a="work" data-id="${j.id}">${icon('wrench', 20)} Start work</button></div>`;
    if (j.status === 'working') return `<div class="cta-bar two"><button class="btn btn-s btn-big" data-a="extra" data-id="${j.id}" ${j.extra.status === 'proposed' ? 'disabled' : ''}>Extra work</button><button class="btn btn-ok btn-big" style="flex:1.4" data-a="finish" data-id="${j.id}" ${j.extra.status === 'proposed' ? 'disabled' : ''}>Complete job</button></div>`;
    return '';
  }

  function Map() {
    return `${top('Map', { back: false })}<div class="trackmap" id="trackmap" style="height:430px"></div><div class="pad" style="margin-top:14px"><div class="note">${icon('info', 18)}<span>Your location is shared with the customer and admin only while a job is on the way.</span></div></div>`;
  }

  function Earn() {
    const t = T(), dj = doneJobs(), cash = dj.filter(j => j.pay.method === 'cod' && j.pay.status === 'paid' && !j.deposited), cashSum = cash.reduce((s, j) => s + S.jobTotal(j), 0);
    return `${top('Earnings', { back: false })}<div class="stack">
      <div class="cardx" style="background:var(--ink);color:#fff;border:0"><div class="eyebrow" style="color:#98B3BC">Today</div><div style="font-family:var(--f-display);font-size:36px;font-weight:600;margin:6px 0">${money(Math.round(dj.reduce((s, j) => s + S.jobTotal(j), 0) * (t.vendor ? 1 : INC)))}</div><div style="color:#98B3BC;font-size:13px">${t.vendor ? 'Job value. Your payout is settled by ' + esc(AC.vendById[t.vendor].name) + '.' : '12% incentive on ' + dj.length + ' completed jobs'}</div></div>
      <div class="cardx"><div class="row between"><b>Cash in hand</b><span class="badge ${cashSum ? 'b-warn' : 'b-ok'}">${cashSum ? 'To deposit' : 'Clear'}</span></div><div style="font-family:var(--f-display);font-size:26px;font-weight:600;margin:8px 0">${money(cashSum)}</div><div class="muted" style="font-size:13px">Cash collected from customers. Deposit it to ${t.vendor ? 'your vendor' : 'the Shital office'} at the end of the day.</div></div>
      <div class="cardx"><b>Jobs</b><div class="col" style="gap:12px;margin-top:12px">${dj.length ? dj.map(j => `<div class="row"><div class="grow"><b style="font-size:14px">${esc(j.svcName)}</b><div class="muted" style="font-size:12.5px">${j.id} . ${AC.payName(j.pay.method)}${j.rating ? ' . ' + j.rating.stars + ' stars' : ''}</div></div><b>${money(S.jobTotal(j))}</b></div>`).join('') : '<span class="muted">No completed jobs yet today.</span>'}</div></div></div>`;
  }

  function Me() {
    const t = T();
    return `${top('Profile', { back: false })}<div class="stack">
      <div class="cardx row" style="gap:14px"><div class="avatar lg">${AC.fmt.ini(t.name)}</div><div class="grow"><b style="font-size:17px">${esc(t.name)}</b><div class="muted">${t.phone}</div><div class="rate">${icon('star', 13)} ${t.rating} . ${t.jobs} jobs</div></div></div>
      <div class="cardx lrow">${icon('store', 20)}<div class="grow"><b>${t.vendor ? esc(AC.vendById[t.vendor].name) : 'Shital (direct)'}</b><small>${t.vendor ? 'Vendor partner' : 'Company technician'} . ${AC.areas[t.area].n}</small></div></div>
      <div class="cardx"><b>Switch demo technician</b><div class="col" style="gap:8px;margin-top:12px">${AC.techs.map(x => `<button class="me-row ${x.id === ui.me ? 'on' : ''}" data-a="who" data-v="${x.id}"><span class="avatar sm">${AC.fmt.ini(x.name)}</span><span class="grow"><b style="font-size:14px">${esc(x.name)}</b><div class="muted" style="font-size:12px">${x.vendor ? esc(AC.vendById[x.vendor].name) : 'Shital direct'} . ${AC.areas[x.area].n}</div></span>${x.id === ui.me ? icon('check', 18) : ''}</button>`).join('')}</div></div>
      <button class="btn btn-s btn-block" data-a="signout">${icon('logout', 18)} Sign out</button><button class="btn btn-g btn-block" data-a="reset">Reset demo data</button></div>`;
  }

  function Sheet() {
    const sh = ui.sheet; if (!sh) return '';
    const j = S.job(sh.id);
    if (sh.t === 'extra') {
      const sel = AC.parts.filter((p, i) => ui.extra[i]), sum = sel.reduce((s, p) => s + p.price, 0);
      return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Request extra work</h2><p class="muted" style="margin:6px 0 14px">Select parts or work not covered by the booked service.</p>
        <div class="col" style="gap:8px">${AC.parts.map((p, i) => `<button class="chk ${ui.extra[i] ? 'on' : ''}" data-a="xpart" data-v="${i}"><span class="ck" style="${ui.extra[i] ? 'background:var(--brand);border-color:var(--brand)' : ''}">${ui.extra[i] ? icon('check', 14, 3) : ''}</span><span class="grow"><b>${p.label}</b></span><b>${money(p.price)}</b></button>`).join('')}</div>
        <div class="note warn" style="margin-top:14px">${icon('alert', 18)}<span>Do not start extra work until it is approved. Shital is not responsible for work done outside the order.</span></div>
        <button class="btn btn-p btn-lg btn-block" style="margin-top:14px" data-a="sendextra" ${sum ? '' : 'disabled'}>Send for approval${sum ? ' . ' + money(sum) : ''}</button></div>`;
    }
    if (sh.t === 'finish') {
      const cod = j.pay.method === 'cod', tot = S.jobTotal(j), d = ui.done;
      return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Complete job</h2>
        <div class="col" style="gap:8px;margin-top:14px">${['Tested cooling and airflow', 'Cleaned the work area', 'Explained the work to the customer'].map((x, i) => `<button class="chk ${d.ck[i] ? 'on' : ''}" data-a="ck" data-v="${i}"><span class="ck" style="${d.ck[i] ? 'background:var(--brand);border-color:var(--brand)' : ''}">${d.ck[i] ? icon('check', 14, 3) : ''}</span><b>${x}</b></button>`).join('')}</div>
        <div class="lab">After photos</div><div class="row" style="gap:10px">${[0, 1, 2].map(i => `<button class="photo grow ${i < d.photos ? 'has' : ''}" data-a="photo">${icon(i < d.photos ? 'check' : 'camera', 22)}</button>`).join('')}</div>
        ${cod ? `<div class="lab">Payment</div><button class="chk ${d.cash ? 'on' : ''}" data-a="cash"><span class="ck" style="${d.cash ? 'background:var(--brand);border-color:var(--brand)' : ''}">${d.cash ? icon('check', 14, 3) : ''}</span><span class="grow"><b>I collected ${money(tot)} in cash</b></span></button>` : `<div class="note" style="margin-top:16px">${icon('info', 18)}<span>The customer pays ${money(tot)} online through ${AC.payName(j.pay.method)}.</span></div>`}
        <button class="btn btn-ok btn-lg btn-block" style="margin-top:16px" data-a="complete" data-id="${j.id}" ${(cod && !d.cash) || d.ck.filter(Boolean).length < 2 ? 'disabled' : ''}>Mark as completed</button></div>`;
    }
    return '';
  }

  /* ---------- Render ---------- */
  const TABS = [['jobs', 'Jobs', 'briefcase'], ['map', 'Map', 'map'], ['earn', 'Earnings', 'wallet'], ['me', 'Profile', 'user']];
  function render() {
    const t = ui.stack[ui.stack.length - 1], key = t ? t.s + t.id : ui.tab;
    const old = document.getElementById('view'); if (old) ui.scroll[ui.key] = old.scrollTop;
    let body, cta = '', tabs = !t;
    if (!ui.signed) { $app.innerHTML = `<div class="statusbar"><span>${clock()}</span></div>${Login()}`; return; }
    if (t) { body = Job(t.id); const j = S.job(t.id); if (j) cta = jobCta(j); } else body = { jobs: Home, map: Map, earn: Earn, me: Me }[ui.tab]();
    const dot = offer() ? 1 : 0;
    $app.innerHTML = `<div class="statusbar"><span>${clock()}</span><span class="sb-r"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg></span></div><div class="view" id="view">${body}</div>${cta}${tabs ? `<nav class="tabbar t4">${TABS.map(x => `<button class="tab ${ui.tab === x[0] ? 'on' : ''}" data-a="tab" data-v="${x[0]}">${icon(x[2], 22, ui.tab === x[0] ? 2.1 : 1.7)}${x[1]}${x[0] === 'jobs' && dot ? '<span class="dot">1</span>' : ''}</button>`).join('')}</nav>` : ''}${Sheet()}`;
    const v = document.getElementById('view'); v.scrollTop = key === ui.key ? (ui.scroll[key] || 0) : 0; ui.key = key;
    mountMap(t);
  }
  const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ [AP]M/, '');

  function mountMap(t) {
    ui.map = null; const host = document.getElementById('trackmap'); if (!host) return;
    ui.map = { api: CityMap.mount(host), id: t ? t.id : null }; const tt = T();
    const j = t ? S.job(t.id) : current();
    if (j) { ui.map.id = j.id; ui.map.api.fit([j.cust, tt], 100); } else ui.map.api.full(); drawMap();
  }
  function drawMap() {
    if (!ui.map) return; const tt = T(), j = ui.map.id ? S.job(ui.map.id) : current(), now = Date.now();
    const pins = [];
    if (j) { const p = tt && S.techPos(j, now) || tt; pins.push({ key: 'c', kind: 'cust', x: j.cust.x, y: j.cust.y, label: j.cust.name.split(' ')[0] }, { key: 't', kind: 'tech', x: p.x, y: p.y, label: 'You', pulse: j.status === 'ontheway' }); }
    else pins.push({ key: 't', kind: 'tech', x: tt.x, y: tt.y, label: 'You', pulse: true });
    ui.map.api.setPins(pins);
    ui.map.api.setRoutes(j && j.techId === ui.me && ['assigned', 'accepted', 'ontheway'].includes(j.status) ? [{ key: 'r', pts: S.tripPoints(j), p: S.tripProgress(j, now) }] : []);
  }
  setInterval(drawMap, 450);

  /* ---------- Actions ---------- */
  const A = {
    tab(el) { ui.tab = el.dataset.v; ui.stack = []; render(); }, back() { ui.stack.pop(); render(); }, toast(el) { toast(el.dataset.v, 'phone'); }, close() { ui.sheet = null; render(); },
    signin() { ui.signed = true; try { sessionStorage.removeItem('tech.out'); } catch (e) { } render(); },
    signout() { ui.signed = false; try { sessionStorage.setItem('tech.out', '1'); } catch (e) { } render(); },
    online() { S.act.setOnline(ui.me, S.get().online[ui.me] === false); },
    job(el) { ui.stack.push({ s: 'job', id: el.dataset.v }); render(); },
    accept(el) { S.act.respond(el.dataset.id, true); toast('Job accepted. Customer notified.'); if (!ui.stack.length) { ui.stack.push({ s: 'job', id: el.dataset.id }); } render(); },
    decline(el) { S.act.respond(el.dataset.id, false); ui.stack = []; toast('Job declined', 'info'); render(); },
    trip(el) { S.act.startTrip(el.dataset.id); toast('Trip started. Sharing live location.', 'nav'); },
    arrive(el) { S.act.arrive(el.dataset.id); toast('Customer notified: you have arrived', 'pin'); },
    work(el) { S.act.startWork(el.dataset.id); },
    extra(el) { ui.extra = {}; ui.sheet = { t: 'extra', id: el.dataset.id }; render(); },
    xpart(el) { ui.extra[el.dataset.v] = !ui.extra[el.dataset.v]; render(); },
    sendextra() { const id = ui.sheet.id; S.act.proposeExtra(id, AC.parts.filter((p, i) => ui.extra[i])); ui.sheet = null; toast('Sent to admin for approval', 'send'); render(); },
    finish(el) { ui.done = { cash: false, ck: [true, true, false], photos: 1 }; ui.sheet = { t: 'finish', id: el.dataset.id }; render(); },
    ck(el) { const i = +el.dataset.v; ui.done.ck[i] = !ui.done.ck[i]; render(); }, cash() { ui.done.cash = !ui.done.cash; render(); }, photo() { ui.done.photos = Math.min(3, ui.done.photos + 1); render(); },
    complete(el) { S.act.complete(el.dataset.id, ui.done.cash); ui.sheet = null; toast('Job completed. Nice work.'); render(); },
    who(el) { ui.me = el.dataset.v; try { sessionStorage.setItem('tech.me', ui.me); } catch (e) { } ui.tab = 'jobs'; ui.stack = []; render(); toast('Signed in as ' + T().name, 'user'); },
    sim() {
      const pool = ['C10', 'C9', 'C1', 'C5'].map(id => AC.custById[id]).sort((a, b) => S.dist(a, T()) - S.dist(b, T()));
      const c = pool[0], svc = ['ac-repair', 'ac-cooling', 'ac-service'][Math.floor(Math.random() * 3)];
      const id = S.act.createJob({ cust: c.id, svc, slot: 'Today, 4-6 PM', method: 'cod', note: 'Simulated request', discount: 100 }); S.act.assign(id, ui.me, 'Admin');
    },
    reset() { S.act.reset(); ui.stack = []; ui.tab = 'jobs'; render(); toast('Demo data reset', 'info'); }
  };
  $app.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const f = A[el.dataset.a]; if (f) f(el); });

  S.subscribe((s, prev) => {
    s.jobs.filter(j => j.techId === ui.me).forEach(j => {
      const o = prev.jobs.find(x => x.id === j.id);
      if ((!o || o.techId !== ui.me) && j.status === 'assigned') toast('New job offer: ' + j.svcName, 'bell');
      if (o && o.extra.status === 'proposed' && j.extra.status === 'approved') toast('Extra work approved. You can start.', 'checkc');
      if (o && o.extra.status === 'proposed' && j.extra.status === 'declined') toast('Customer declined extra work', 'info');
    });
    render();
  });
  render();
})();
