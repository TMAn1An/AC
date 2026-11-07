/* NEW vendor app prototype. Default vendor: CoolTech Services (V1). Vendors see only jobs forwarded to them. */
(function () {
  const S = AC.store, money = AC.fmt.money, $app = document.getElementById('app');
  const ui = { f: { xl: '', xp: '', xs: true }, kyc: null, v: 'V1', tab: 'jobs', seg: 'new', stack: [], sheet: null, key: '', scroll: {}, map: null };
  try { if (sessionStorage.getItem('vendor.v')) ui.v = sessionStorage.getItem('vendor.v'); } catch (e) { }
  const V = () => AC.vendById[ui.v], esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const jobs = () => S.get().jobs.filter(j => j.vendorId === ui.v);
  const team = () => AC.techs.filter(t => t.vendor === ui.v);
  const km = (a, b) => AC.fmt.km(S.dist(a, b));
  const toast = (m, ic) => { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon(ic || 'checkc', 18) + '<span>' + esc(m) + '</span>'; document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 3200); };
  const top = (t, o) => o && o.back === false ? `<div class="band sm">${top0(t, o)}</div>` : top0(t, o);
  const top0 = (t, o) => `<div class="top">${o && o.back === false ? '' : `<button class="back" data-a="back" aria-label="Back">${icon('left', 22)}</button>`}<h1>${t}</h1>${(o && o.right) || ''}</div>`;
  const state = t => { const s = S.get(); if (s.online[t.id] === false) return ['Offline', 'b-n']; const b = s.jobs.find(j => j.techId === t.id && ['ontheway', 'arrived', 'working'].includes(j.status)); if (b) return [S.META[b.status].label, 'b-brand']; if (s.jobs.find(j => j.techId === t.id && ['assigned', 'accepted'].includes(j.status))) return ['Assigned', 'b-warn']; return ['Available', 'b-ok']; };
  const SEG = { new: j => j.status === 'forwarded', active: j => ['assigned', 'accepted', 'ontheway', 'arrived', 'working'].includes(j.status), done: j => j.status === 'completed' };
  const fwdAt = j => { const e = j.tl.filter(x => x.k === 'forwarded').pop(); return e ? e.at : j.createdAt; };

  function Jobs() {
    const J = jobs(), L = J.filter(SEG[ui.seg]), nNew = J.filter(SEG.new).length;
    return `<div class="band"><div class="top">${AC.logo.tile(40, false)}<div class="grow"><small class="muted" style="font-weight:600">Vendor partner</small><h1 style="font-size:22px">${esc(V().name)}</h1></div><div class="avatar amber" style="background:var(--accent);color:var(--deep)">${AC.fmt.ini(V().name)}</div></div></div>
    <div class="seg" style="margin-top:-24px;position:relative;z-index:2;box-shadow:var(--shadow-2)">${[['new', 'New' + (nNew ? ' (' + nNew + ')' : '')], ['active', 'Active'], ['done', 'Completed']].map(x => `<button class="${ui.seg === x[0] ? 'on' : ''}" data-a="seg" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>
    <div class="stack">${L.map(j => card(j)).join('') || `<div class="empty"><h3>${ui.seg === 'new' ? 'No new requests' : 'Nothing here yet'}</h3><span>${ui.seg === 'new' ? 'Jobs forwarded by NEW appear here.' : ''}</span></div>`}</div>`;
  }
  function card(j) {
    const t = AC.techById[j.techId];
    if (j.status === 'forwarded') {
      const left = Math.max(0, 15 - Math.round((Date.now() - fwdAt(j)) / 60000));
      return `<div class="cardx hot-card fade ${S.unread('vendor:' + ui.v, 'jobs').includes(j.id) ? 'unread' : ''}" style="border:2px solid var(--brand)" data-a="seenjob" data-v="${j.id}"><div class="row between"><span class="badge b-warn">Respond in ${left} min</span><b>${money(S.jobTotal(j))}</b></div>
        <div style="margin:12px 0"><b style="font-size:17px">${esc(j.svcName)}</b><div class="muted" style="font-size:13px;margin-top:4px">${AC.areas[j.cust.area].n} . ${km(V(), j.cust)} from you . ${esc(j.slot)}</div>${j.note ? `<div style="font-size:13px;margin-top:8px">${esc(j.note)}</div>` : ''}</div>
        <div class="row"><button class="btn btn-s grow" data-a="decline" data-id="${j.id}">Decline</button><button class="btn btn-p grow" style="flex:1.5" data-a="assign" data-id="${j.id}">Assign technician</button></div></div>`;
    }
    const U = S.unread('vendor:' + ui.v, 'jobs').includes(j.id);
    return `<button class="jcard ${U ? 'unread' : ''}" data-a="job" data-v="${j.id}"><span class="svc-ic">${icon(AC.svcById[j.svc].icon, 22)}</span><span class="grow"><b>${esc(j.svcName)}</b><div class="muted" style="font-size:13px">${t ? esc(t.name) : 'No technician'} . ${AC.areas[j.cust.area].n}</div></span><span class="col" style="gap:4px;align-items:flex-end"><span class="badge ${S.META[j.status].cls}">${S.META[j.status].label}</span><b style="font-size:13px">${money(S.jobTotal(j))}</b></span></button>`;
  }

  function Job(id) {
    const j = S.job(id); if (!j) return top('Job'); const t = AC.techById[j.techId];
    return `${top(j.id, { right: `<span class="badge ${S.META[j.status].cls}">${S.META[j.status].label}</span>` })}<div class="trackmap" id="trackmap" style="height:210px"></div>
    <div class="stack" style="margin-top:14px">
      <div class="cardx"><div class="row"><span class="svc-ic">${icon(AC.svcById[j.svc].icon, 22)}</span><div class="grow"><b style="font-size:16px">${esc(j.svcName)}</b><div class="muted" style="font-size:13px">${esc(j.slot)}</div></div><b>${money(S.jobTotal(j))}</b></div></div>
      ${t ? `<div class="cardx"><div class="row"><div class="avatar">${AC.fmt.ini(t.name)}</div><div class="grow"><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${j.status === 'ontheway' ? 'Arriving in ' + S.etaMin(j) + ' min' : S.META[j.status].label}</div></div><button class="btn btn-s btn-sm" data-a="toast" data-v="Calling ${esc(t.name)}">${icon('phone', 16)}Call</button></div></div>` : ''}
      <div class="cardx"><div class="lrow">${icon('pin', 20)}<div class="grow"><b>${esc(j.cust.addr)}</b><small>${t ? esc(j.cust.name) + ' . ' + j.cust.phone : 'Customer contact is shown after you assign a technician'}</small></div></div></div>
      ${j.extraReq && j.extraReq.status === 'open' && j.extra.status !== 'proposed' ? `<div class="cardx" style="border-color:var(--accent);background:var(--accent-l)"><b>${esc(t ? t.name : 'Technician')} asks for a price</b><div style="margin:4px 0 12px">"${esc(j.extraReq.text)}"</div><div class="row"><input class="input" id="f-xl" data-b="xl" placeholder="Item" value="${esc(ui.f.xl || j.extraReq.text)}" style="flex:2"><input class="input" id="f-xp" data-b="xp" inputmode="numeric" placeholder="Amount" value="${esc(ui.f.xp)}" style="flex:1"></div><button class="chk-row" style="margin-top:10px;background:#fff" data-a="xs"><span class="ck ${ui.f.xs ? 'on' : ''}">${ui.f.xs ? icon('check', 14, 3) : ''}</span><span>Save to the price list</span></button><button class="btn btn-p btn-block" style="margin-top:10px" data-a="quote" data-id="${j.id}" ${+ui.f.xp > 0 ? '' : 'disabled'}>Send price to customer</button></div>` : ''}
      ${j.status === 'assigned' ? `<div class="row"><button class="btn btn-s grow" data-a="reassign" data-id="${j.id}">Reassign technician</button><button class="btn btn-g grow" style="color:var(--bad)" data-a="retfwd" data-id="${j.id}">Return to NEW</button></div>` : ''}
      ${j.extra.status !== 'none' ? `<div class="note ${j.extra.status === 'proposed' ? 'warn' : 'ok'}">${icon('alert', 18)}<span>Extra work ${j.extra.status}: ${money(j.extra.items.reduce((a, i) => a + i.price, 0))}. The customer decides. No approval is needed from NEW.</span></div>` : ''}
      <div class="cardx"><h3 style="font-size:16px;margin-bottom:14px">Timeline</h3><div class="tl">${j.tl.map((e, i) => `<div class="tl-i ${i === j.tl.length - 1 && S.isActive(j) ? 'now' : 'done'}"><div class="tl-dot">${i === j.tl.length - 1 && S.isActive(j) ? '' : icon('check', 13, 3)}</div><div><div class="tl-t">${esc(({ requested: 'Booked by customer', forwarded: 'Forwarded to you', assigned: 'Technician assigned', accepted: 'Technician accepted', declined: 'Declined', ontheway: 'On the way', arrived: 'Arrived', working: 'Work started', extra: 'Extra work proposed', extra_ok: 'Extra work approved', extra_no: 'Extra work declined', completed: 'Completed', paid: 'Paid' })[e.k] || e.k)}</div><div class="muted" style="font-size:12.5px">${esc(e.by)} . ${AC.fmt.time(e.at)}</div></div></div>`).join('')}</div></div></div>`;
  }

  function TechView(id) {
    const t = AC.techById[id], k = t.kyc || {};
    return `${top(esc(t.name), { right: `<span class="badge ${k.status === 'verified' ? 'b-ok' : 'b-warn'}">${k.status === 'verified' ? 'Verified' : 'Pending'}</span>` })}<div class="stack"><div class="cardx"><div class="row"><div class="avatar amber">${AC.fmt.ini(t.name)}</div><div class="grow"><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${t.phone} . ${AC.areas[t.area].n}</div></div></div></div>
      <div class="cardx"><b>Identity check</b><dl class="kvs" style="margin-top:10px"><dt>NID</dt><dd class="mono">${esc(k.nid || '')}</dd><dt>Method</dt><dd>${esc(k.method || '')}</dd><dt>Verified by</dt><dd>${esc(k.verifiedBy || '')}</dd></dl><div class="row" style="gap:10px;margin-top:12px"><span class="kyc-tile on" style="flex:1;aspect-ratio:1.5"><span class="nid-mock"><i></i><i></i><i></i></span><span class="kyc-ok">NID front</span></span><span class="kyc-tile on" style="flex:1;aspect-ratio:1.5"><span class="nid-mock"><i></i><i></i><i></i></span><span class="kyc-ok">NID back</span></span></div></div>
      <div class="note">${icon('lock', 18)}<span>Only you and NEW Admin can see this. Other vendors cannot. You are responsible for verifying technicians you add.</span></div></div>`;
  }
  function Team() {
    return `${top('My team', { back: false, right: `<button class="btn btn-p btn-sm" data-a="addtech">${icon('plus', 16)}Add</button>` })}<div class="stack">${team().map(t => { const st = state(t), on = S.get().online[t.id] !== false; return `<div class="cardx"><div class="row"><div class="avatar amber">${AC.fmt.ini(t.name)}</div><div class="grow"><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${AC.areas[t.area].n} . ${t.jobs} jobs</div></div><span class="badge ${st[1]}">${st[0]}</span></div>
      <button class="lrow" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)" data-a="tech" data-v="${t.id}"><span class="badge ${t.kyc && t.kyc.status === 'verified' ? 'b-ok' : 'b-warn'}">${t.kyc && t.kyc.status === 'verified' ? 'Identity verified' : 'Pending'}</span><span class="grow muted" style="font-size:13px">View identity details</span>${icon('right', 16)}</button>
      <div class="row between" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><span class="muted">Available for jobs</span><button class="sw ${on ? 'on' : ''}" data-a="online" data-v="${t.id}" aria-label="Toggle availability"></button></div></div>`; }).join('')}</div>`;
  }
  function Map() { return `${top('Live map', { back: false })}<div class="trackmap" id="trackmap" style="height:460px"></div><div class="pad" style="margin-top:14px"><div class="note">${icon('store', 18)}<span>Your location is fixed at ${esc(V().addr)}. Technician positions update while they are on the way.</span></div></div>`; }
  function Earn() {
    const v = V(), m = jobs().filter(j => j.status === 'completed'), g = m.reduce((a, j) => a + S.jobTotal(j), 0), c = Math.round(g * v.commission / 100);
    return `${top('Earnings', { back: false })}<div class="stack"><div class="cardx" style="background:var(--ink);color:#fff;border:0"><div class="eyebrow" style="color:#A9AEDB">Net payout this week</div><div style="font-family:var(--f-display);font-size:38px;font-weight:600;margin:6px 0">${money(g - c)}</div><div style="color:#A9AEDB;font-size:13px">${m.length} completed jobs . settled every week</div></div>
      <div class="cardx sum"><div><span>Gross job value</span><span>${money(g)}</span></div><div><span>NEW commission (${v.commission}%)</span><span>-${money(c)}</span></div><div class="tot"><span>Your payout</span><span>${money(g - c)}</span></div></div>
      <div class="cardx"><b>Technician cash deposits</b><div class="muted" style="font-size:13px;margin:2px 0 10px">Your technicians hand cash to you. Accept it here and their balance goes to zero.</div><div class="col" style="gap:10px">${(function () { const L = S.get().deposits.filter(d => d.to === 'vendor:' + ui.v).slice().reverse(); return L.length ? L.map(d => { const t = AC.techById[d.tech]; return `<div class="pick"><div class="avatar amber">${AC.fmt.ini(t.name)}</div><div class="grow"><b>${esc(t.name)}</b><div class="muted" style="font-size:12.5px">${esc(d.method)} . ${AC.fmt.ago(d.at)}${d.ref ? ' . ' + esc(d.ref) : ''}</div></div><div style="text-align:right"><b>${money(d.amount)}</b>${d.status === 'pending' ? `<div class="row" style="gap:6px;margin-top:6px"><button class="btn btn-g btn-sm" data-a="rejdep" data-v="${d.id}">Reject</button><button class="btn btn-ok btn-sm" data-a="accdep" data-v="${d.id}">Accept</button></div>` : `<div><span class="badge ${d.status === 'accepted' ? 'b-ok' : 'b-bad'}">${d.status[0].toUpperCase() + d.status.slice(1)}</span></div>`}</div></div>`; }).join('') : '<span class="muted">No deposit requests yet.</span>'; })()}</div></div>
      <div class="cardx"><b>Completed jobs</b><div class="col" style="gap:12px;margin-top:12px">${m.length ? m.map(j => `<div class="row"><div class="grow"><b style="font-size:14px">${esc(j.svcName)}</b><div class="muted" style="font-size:12.5px">${j.id} . ${esc((AC.techById[j.techId] || {}).name || '')}</div></div><b>${money(S.jobTotal(j) - Math.round(S.jobTotal(j) * v.commission / 100))}</b></div>`).join('') : '<span class="muted">No completed jobs yet.</span>'}</div></div></div>`;
  }
  function Me() {
    const v = V();
    return `${top('Profile', { back: false })}<div class="stack"><div class="cardx row" style="gap:14px"><div class="avatar lg amber">${AC.fmt.ini(v.name)}</div><div class="grow"><b style="font-size:17px">${esc(v.name)}</b><div class="muted">${esc(v.owner)}</div></div></div>
      <div class="cardx lrow">${icon('pin', 20)}<div class="grow"><b>Registered location</b><small>${esc(v.addr)}</small></div></div><div class="cardx lrow">${icon('phone', 20)}<div class="grow"><b>${v.phone}</b><small>Commission ${v.commission}% . partner since ${v.since}</small></div></div>
      <button class="cardx lrow" data-a="history">${icon('clock', 20)}<div class="grow"><b>History</b><small>Your updates, saved on this phone</small></div>${icon('right', 18)}</button>
      <button class="cardx lrow" data-a="toast" data-v="Opening WhatsApp chat with NEW operations">${icon('chat', 20)}<div class="grow"><b>Contact NEW operations</b><small>Call or WhatsApp</small></div>${icon('right', 18)}</button>
      <div class="cardx"><b>Switch demo vendor</b><div class="col" style="gap:8px;margin-top:12px">${AC.vendors.map(x => `<button class="opt ${x.id === ui.v ? 'on' : ''}" data-a="who" data-v="${x.id}"><span class="rd"></span><span class="grow"><b>${esc(x.name)}</b><small>${AC.areas[x.area].n}</small></span></button>`).join('')}</div></div>
      <button class="btn btn-g btn-block" data-a="reset">Reset demo data</button></div>`;
  }
  function Sheet() {
    const sh = ui.sheet; if (!sh) return '';
    if (sh.t === 'assign') {
      const j = S.job(sh.id), L = S.nearbyTechs(j.cust, {}).filter(x => x.t.vendor === ui.v), tried = (j.tried || { techs: [] }).techs;
      return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Assign a technician</h2><p class="muted" style="margin:6px 0 14px">${esc(j.svcName)} in ${AC.areas[j.cust.area].n}. Closest first.</p><div class="col" style="gap:8px">${L.map((x, i) => { const can = x.online && !x.busy && x.t.id !== j.techId && !tried.includes(x.t.id); return `<div class="pick ${can ? '' : 'dim'}"><div class="avatar amber">${AC.fmt.ini(x.t.name)}</div><div class="grow"><b>${esc(x.t.name)}</b><div class="muted" style="font-size:13px">${AC.fmt.km(x.d)} away . ${x.t.id === j.techId ? 'Current offer' : tried.includes(x.t.id) ? 'Did not respond' : !x.online ? 'Offline' : x.busy ? 'On another job' : 'Available'}</div></div>${can ? `<button class="btn ${i === 0 ? 'btn-p' : 'btn-s'} btn-sm" data-a="doassign" data-id="${j.id}" data-v="${x.t.id}">Assign</button>` : ''}</div>`; }).join('')}</div></div>`;
    }
    if (sh.t === 'add') return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Add technician</h2><div class="col" style="margin-top:14px;gap:10px">${[['Full name', ''], ['Phone', '017'], ['Service area', 'Mirpur']].map((f, i) => `<div class="field"><label for="ft${i}">${f[0]}</label><input class="input" id="ft${i}" placeholder="${f[1]}"></div>`).join('')}<button class="btn btn-p btn-lg btn-block" data-a="saved">Send invite</button></div></div>`;
    return '';
  }

  const TABS = [['jobs', 'Jobs', 'briefcase'], ['team', 'Team', 'users'], ['map', 'Map', 'map'], ['earn', 'Earnings', 'wallet'], ['me', 'Profile', 'store']];
  const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ [AP]M/, '');
  function render() {
    const af = document.activeElement, afId = af && af.id, afSel = af && af.selectionStart;
    const t = ui.stack[ui.stack.length - 1], key = t ? t.s + (t.id || '') : ui.tab, old = document.getElementById('view'); if (old) ui.scroll[ui.key] = old.scrollTop;
    const body = t && t.s === 'history' ? top('History') + `<div class="pad">${AC.history.html('vendor:' + ui.v)}</div>` : t && t.s === 'kyc' ? top('Add technician') + `<div class="pad">${AC.kyc.html(ui.kyc)}</div>` : t && t.s === 'tech' ? TechView(t.id) : t && t.s === 'notifs' ? top('Notifications') + `<div class="pad"><div class="cardx" style="padding:4px 16px">${AC.notifUI.html('vendor:' + ui.v, 'job')}</div></div>` : t ? Job(t.id) : { jobs: Jobs, team: Team, map: Map, earn: Earn, me: Me }[ui.tab](), UNv = S.unread('vendor:' + ui.v, 'jobs'), nNew = UNv.length;
    $app.innerHTML = `<div class="statusbar${!t ? ' dk' : ''}"><span>${clock()}</span></div><div class="view" id="view">${body}</div>${t ? '' : `<nav class="tabbar">${TABS.map(x => `<button class="tab ${ui.tab === x[0] ? 'on' : ''}" data-a="tab" data-v="${x[0]}">${icon(x[2], 22, ui.tab === x[0] ? 2.1 : 1.7)}${x[1]}${x[0] === 'jobs' && nNew ? `<span class="dot">${nNew}</span>` : ''}</button>`).join('')}</nav>`}${Sheet()}`;
    const v = document.getElementById('view'); v.scrollTop = key === ui.key ? (ui.scroll[key] || 0) : 0; ui.key = key; if (afId) { const e = document.getElementById(afId); if (e && e !== document.activeElement) { e.focus(); try { e.setSelectionRange(afSel, afSel); } catch (x) { } } } mountMap(t);
  }
  function mountMap(t) {
    ui.map = null; const host = document.getElementById('trackmap'); if (!host) return;
    ui.map = { api: CityMap.mount(host), id: t ? t.id : null };
    const j = t && S.job(t.id), tech = j && AC.techById[j.techId];
    if (j) ui.map.api.fit(tech ? [j.cust, tech] : [j.cust, V()], 120); else ui.map.api.full(); draw();
  }
  function draw() {
    if (!ui.map) return; const now = Date.now(), pins = [{ key: 'v', kind: 'vendor', x: V().x, y: V().y, label: 'You' }], routes = [];
    if (ui.map.id) { const j = S.job(ui.map.id), t = j && AC.techById[j.techId]; if (j) { pins.push({ key: 'c', kind: 'cust', x: j.cust.x, y: j.cust.y }); if (t) { const p = S.techPos(j, now); pins.push({ key: 't', kind: 'tech', x: p.x, y: p.y, label: t.name.split(' ')[0], pulse: j.status === 'ontheway' }); if (['assigned', 'accepted', 'ontheway'].includes(j.status)) routes.push({ key: 'r', pts: S.tripPoints(j), p: S.tripProgress(j, now) }); } } }
    else { const s = S.get(); team().forEach(t => { const j = jobs().find(x => x.techId === t.id && ['ontheway', 'arrived', 'working'].includes(x.status)), p = j ? S.techPos(j, now) : t; pins.push({ key: 't' + t.id, kind: 'tech', x: p.x, y: p.y, label: t.name.split(' ')[0], pulse: !!j && j.status === 'ontheway', dim: s.online[t.id] === false }); }); jobs().filter(S.isActive).forEach(j => { pins.push({ key: 'c' + j.id, kind: 'cust', x: j.cust.x, y: j.cust.y }); const t = AC.techById[j.techId]; if (t && ['assigned', 'accepted', 'ontheway'].includes(j.status)) routes.push({ key: 'r' + j.id, pts: S.tripPoints(j), p: S.tripProgress(j, now) }); }); }
    ui.map.api.setPins(pins); ui.map.api.setRoutes(routes);
  }
  setInterval(draw, 450);

  const A = {
    accdep(el) { S.act.acceptDeposit(el.dataset.v, V().name); toast('Deposit accepted. Technician cash updated.', 'wallet'); }, rejdep(el) { S.act.rejectDeposit(el.dataset.v, V().name, 'Amount not received'); toast('Deposit rejected', 'info'); },
    seenjob(el) { S.act.markSeen('vendor:' + ui.v, 'j:' + el.dataset.v); },
    tab(el) { ui.tab = el.dataset.v; ui.stack = []; render(); }, back() { const x = ui.stack[ui.stack.length - 1]; ui.stack.pop(); render(); if (x && x.s === 'notifs') S.act.markNotifs('vendor:' + ui.v); if (x && x.s === 'kyc') ui.kyc = null; }, notifs() { ui.stack.push({ s: 'notifs' }); render(); }, history() { ui.stack.push({ s: 'history' }); render(); }, hf(el) { AC.history.filter = el.dataset.v; render(); }, hclear() { AC.history.clear('vendor:' + ui.v); render(); }, seg(el) { ui.seg = el.dataset.v; render(); }, toast(el) { toast(el.dataset.v, 'phone'); }, close() { ui.sheet = null; render(); },
    job(el) { ui.stack.push({ s: 'job', id: el.dataset.v }); render(); S.act.markSeen('vendor:' + ui.v, 'j:' + el.dataset.v); }, assign(el) { ui.sheet = { t: 'assign', id: el.dataset.id }; render(); },
    doassign(el) { S.act.assign(el.dataset.id, el.dataset.v, V().name); ui.sheet = null; ui.seg = 'active'; toast(AC.techById[el.dataset.v].name + ' assigned. NEW and the customer are notified.'); render(); },
    decline(el) { S.act.vendorDecline(el.dataset.id); toast('Declined. NEW will reassign.', 'info'); },
    online(el) { S.act.setOnline(el.dataset.v, S.get().online[el.dataset.v] === false); }, addtech() { ui.kyc = AC.kyc.fresh(ui.v); ui.stack.push({ s: 'kyc' }); render(); }, tech(el) { ui.stack.push({ s: 'tech', id: el.dataset.v }); render(); },
    kyc(el) { AC.kyc.act(el.dataset.kyc, ui.kyc, render, d => { S.act.addTech(d); ui.stack.pop(); ui.kyc = null; render(); toast('Technician added. Identity verified and logged.'); }); },
    xs() { ui.f.xs = !ui.f.xs; render(); },
    quote(el) { const j = S.job(el.dataset.id); S.act.quoteExtra(j.id, (ui.f.xl || j.extraReq.text).trim(), ui.f.xp, V().name, ui.f.xs); ui.f.xl = ''; ui.f.xp = ''; toast('Price sent to the customer and technician'); },
    reassign(el) { ui.sheet = { t: 'assign', id: el.dataset.id }; render(); }, retfwd(el) { S.act.vendorDecline(el.dataset.id); toast('Returned to NEW', 'info'); },
    who(el) { ui.v = el.dataset.v; try { sessionStorage.setItem('vendor.v', ui.v); } catch (e) { } ui.tab = 'jobs'; ui.stack = []; render(); toast('Signed in as ' + V().name, 'store'); }, reset() { S.act.reset(); ui.stack = []; render(); toast('Demo data reset', 'info'); }
  };
  $app.addEventListener('input', e => { if (e.target.dataset.k && ui.kyc) { AC.kyc.set(ui.kyc, e.target.dataset.k, e.target.value); return; } const b = e.target.dataset.b; if (b) { ui.f[b] = e.target.value; if (b === 'xp' || b === 'xl') render(); } });
  $app.addEventListener('change', e => { if (e.target.dataset.k && ui.kyc) AC.kyc.set(ui.kyc, e.target.dataset.k, e.target.value); });
  $app.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const f = A[el.dataset.a]; if (f) f(el); });
  S.subscribe(() => render());
  AC.history.track(() => 'vendor:' + ui.v);
  render();
})();
