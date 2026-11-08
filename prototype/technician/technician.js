/* NEW technician app prototype. Default user: Rakib Hasan (T1, own staff). Switch to a vendor technician from Profile. */
(function () {
  const S = AC.store, money = AC.fmt.money, $app = document.getElementById('app'); AC.ui.dedupe($app);
  const ui = { me: 'T1', tab: 'jobs', stack: [], sheet: null, signed: true, extra: {}, d: {}, done: { cash: false, ck: [true, true, false], photos: 1, err: false }, key: '', scroll: {}, map: null };
  try { if (sessionStorage.getItem('tech.me')) ui.me = sessionStorage.getItem('tech.me'); if (sessionStorage.getItem('tech.out')) ui.signed = false; } catch (e) { }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = () => AC.techById[ui.me];
  const mine = () => S.get().jobs.filter(j => j.techId === ui.me);
  const offer = () => mine().find(j => j.status === 'assigned');
  const current = () => mine().find(j => ['accepted', 'ontheway', 'arrived', 'working'].includes(j.status));
  const doneJobs = () => mine().filter(j => j.status === 'completed');
  const INC = 0.12, fmtLeft = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  function toast(msg, ic) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon(ic || 'checkc', 18) + '<span>' + esc(msg) + '</span>'; document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 3200); }
  const top = (title, o) => o && o.back === false ? `<div class="band sm">${top0(title, o)}</div>` : top0(title, o);
  const top0 = (title, o) => `<div class="top">${o && o.back === false ? '' : `<button class="back" data-a="back" aria-label="Back">${icon('left', 22)}</button>`}<h1>${title}</h1>${(o && o.right) || ''}</div>`;

  function Login() {
    return `<div class="login"><div>${AC.logo.full(104)}</div><div><h1 style="font-size:30px">NEW Technician</h1><p class="muted" style="margin-top:6px">Sign in with the phone number registered by your admin or vendor.</p></div>
      <div class="field"><label for="f-p">Phone number</label><input class="input" id="f-p" value="${T().phone}" readonly></div>
      <div class="field"><label>One-time code</label><div class="otp"><span>4</span><span>8</span><span>1</span><span>9</span></div><span class="faint" style="font-size:12px">Demo code is filled in for you.</span></div>
      <button class="btn btn-p btn-lg btn-block" data-a="signin">Verify and continue</button></div>`;
  }

  function Home() {
    const t = T(), of = offer(), cur = current(), on = S.get().online[ui.me] !== false, dj = doneJobs();
    const earn = Math.round(dj.reduce((s, j) => s + S.jobTotal(j), 0) * INC);
    const left = of ? Math.max(1, Math.round(((of.offerAt || Date.now()) + AC.config.OFFER_SECONDS * 1000 - Date.now()) / 1000)) : 0;
    const offerHtml = of ? `<div class="offer"><div class="offer-h"><span>New job offer</span><span class="cd" data-end="${(of.offerAt || Date.now()) + AC.config.OFFER_SECONDS * 1000}">${icon('clock', 16)} Respond in ${fmtLeft(left)}</span></div><div style="background:var(--brand);padding:0 16px 12px"><div class="bar"><i style="animation-duration:${left}s;animation-delay:-${AC.config.OFFER_SECONDS - left}s"></i></div></div>
      <div class="offer-b"><div class="big">${esc(of.svcName)}</div>
        <div class="kv">${icon('pin', 18)}<span><b>${AC.areas[of.cust.area].n}</b> . ${AC.fmt.km(S.dist(t, of.cust))} away<br><span class="muted">${esc(of.cust.addr)}</span></span></div>
        <div class="kv">${icon('clock', 18)}<span>${esc(of.slot)}</span></div>
        <div class="kv">${icon('wallet', 18)}<span><b>${money(S.jobTotal(of))}</b> . ${AC.payName(of.pay.method)}${of.vendorId ? '<br><span class="muted">From ' + esc(AC.vendById[of.vendorId].name) + '</span>' : ''}</span></div>
        <div class="row"><button class="btn btn-s btn-lg grow" data-a="decline" data-id="${of.id}">Decline</button><button class="btn btn-ok btn-lg grow" style="flex:1.5" data-a="accept" data-id="${of.id}">Accept job</button></div></div></div>` : '';
    const curHtml = cur ? `<div class="sec"><div class="sec-h"><h2>Active job</h2></div><div style="padding:0 20px"><button class="jcard active" data-a="job" data-v="${cur.id}"><span class="svc-ic">${icon(AC.svcById[cur.svc].icon, 22)}</span><span class="grow"><b>${esc(cur.svcName)}</b><div class="muted" style="font-size:13px">${esc(cur.cust.name)} . ${AC.areas[cur.cust.area].n}</div></span><span class="badge ${S.META[cur.status].cls}">${S.META[cur.status].label}</span></button></div></div>` : '';
    const empty = !of && !cur ? `<div class="empty" style="padding-top:36px"><div class="radar"><span class="core">${icon(on ? 'nav' : 'power', 26, 2)}</span></div><h3>${on ? 'Waiting for jobs' : 'You are offline'}</h3><span>${on ? 'New requests near ' + AC.areas[t.area].n + ' appear here.' : 'Go online to receive requests.'}</span></div>` : '';
    return `<div class="band"><div class="top">${AC.logo.tile(40, false)}<div class="grow"><small class="muted" style="font-weight:600">${t.vendor ? 'Partner of ' + esc(AC.vendById[t.vendor].name) : 'NEW technician'}</small><h1 style="font-size:24px">Hi, ${esc(t.name.split(' ')[0])}</h1></div><div class="avatar" style="background:var(--brand);color:#fff">${AC.fmt.ini(t.name)}</div></div>
    <div style="padding:0 20px"><button class="online ${on ? '' : 'off'}" data-a="online" style="width:100%;margin:0"><span class="dotg"></span><span class="grow"><b>${on ? 'Online' : 'Offline'}</b><div class="muted" style="font-size:12.5px">${on ? 'Accepting jobs in ' + AC.areas[t.area].n : 'Not receiving requests'}</div></span><span class="sw ${on ? 'on' : ''}"></span></button></div></div>
    <div class="statrow" style="margin-top:-26px;position:relative;z-index:2"><div class="stat"><small>Jobs today</small><b>${dj.length + (cur ? 1 : 0)}</b></div><div class="stat"><small>${t.vendor ? 'Job value' : 'Incentive'}</small><b>${money(t.vendor ? dj.reduce((s, j) => s + S.jobTotal(j), 0) : earn)}</b></div><div class="stat"><small>All-time jobs</small><b>${t.jobs}</b></div></div>
    ${offerHtml}${curHtml}${empty}
    ${dj.length ? `<div class="sec"><div class="sec-h"><h2>Completed today</h2></div><div class="stack" style="gap:10px">${dj.map(j => `<button class="jcard" data-a="job" data-v="${j.id}"><span class="svc-ic" style="background:var(--ok-l);color:var(--ok)">${icon('check', 20, 2.2)}</span><span class="grow"><b>${esc(j.svcName)}</b><div class="muted" style="font-size:13px">${esc(j.cust.name)} . ${AC.areas[j.cust.area].n}</div></span><b>${money(S.jobTotal(j))}</b></button>`).join('')}</div></div>` : ''}
    <div class="pad sec"><div class="proto"><div class="eyebrow">Prototype tools</div><div class="muted" style="font-size:13px">Creates a request near you and assigns it, as the admin would.</div><button class="btn btn-s" data-a="sim">Simulate incoming job offer</button></div></div>`;
  }

  function Job(id) {
    const j = S.job(id); if (!j) return top('Job');
    const cod = j.pay.method === 'cod';
    const jcN = S.chatMsgs('J:' + j.id).length, jcOpen = S.chatOpen(j), jcUn = S.chatUnread('tech:' + ui.me).includes('J:' + j.id);
    const jChatBtn = j.techId === ui.me && (jcOpen || jcN) ? `<button class="btn ${jcOpen ? 'btn-p' : 'btn-s'} btn-block" style="margin-top:12px" data-a="jchat" data-v="${j.id}">${icon('chat', 18)}${jcOpen ? 'Message ' + esc(j.cust.name.split(' ')[0]) : 'Chat history'}${jcUn ? '<span class="pill-n">New</span>' : ''}</button>` : '';
    const stepHint = { assigned: 'Review and accept to start.', accepted: 'Head to the customer when ready.', ontheway: 'Customer can see your live location.', arrived: 'Greet the customer and confirm the issue.', working: 'Only do work covered by the booking. Anything extra needs approval first.', completed: 'Job finished.' }[j.status];
    return `${top(esc(j.id), { right: `<span class="badge ${S.META[j.status].cls}">${S.META[j.status].label}</span>` })}
    ${j.status === 'ontheway' ? navBanner(j) : ''}
    <div class="trackmap" id="trackmap" style="height:${j.status === 'ontheway' ? 300 : 210}px"></div>
    <div class="stack" style="margin-top:14px">
      <div class="cardx"><div class="row" style="align-items:flex-start"><span class="svc-ic">${icon(AC.svcById[j.svc].icon, 22)}</span><div class="grow"><b style="font-size:16px">${esc(j.svcName)}</b><div class="muted" style="font-size:13px">${j.units} x ${esc(j.ac)} AC . ${esc(j.slot)}</div></div><b>${money(S.jobTotal(j))}</b></div>
        ${j.note ? `<div class="note" style="margin-top:12px">${icon('info', 18)}<span>${esc(j.note)}</span></div>` : ''}</div>
      <div class="cardx"><div class="row"><div class="avatar">${AC.fmt.ini(j.cust.name)}</div><div class="grow"><b>${esc(j.cust.name)}</b><div class="muted" style="font-size:13px">${esc(j.cust.addr)}</div></div></div>
        ${jChatBtn}<div class="actions" style="grid-template-columns:1fr 1fr"><button class="btn btn-s" data-a="toast" data-v="Calling ${esc(j.cust.name)} (dialer opens in the real app)">${icon('phone', 18)}Call</button><button class="btn btn-s" data-a="toast" data-v="Opening WhatsApp with ${esc(j.cust.name)}">${icon('chat', 18)}WhatsApp</button></div></div>
      <div class="cardx"><div class="row between"><b>Payment</b><span class="badge ${j.pay.status === 'paid' ? 'b-ok' : cod ? 'b-warn' : 'b-info'}">${j.pay.status === 'paid' ? 'Paid' : cod ? 'Collect cash' : 'Customer pays online'}</span></div>
        <div class="sum" style="margin-top:12px"><div><span>Service</span><span>${money(j.price)}</span></div>${j.discount ? `<div class="sv"><span>Discount</span><span>-${money(j.discount)}</span></div>` : ''}${j.extra.status === 'approved' ? `<div><span>Approved extra work</span><span>${money(S.extraTotal(j))}</span></div>` : ''}<div class="tot"><span>Total</span><span>${money(S.jobTotal(j))}</span></div></div></div>
      ${j.extra.status === 'proposed' ? `<div class="note warn">${icon('clock', 18)}<span><b>Waiting for the customer.</b> ${money(j.extra.items.reduce((a, i) => a + i.price, 0))} of extra work was sent to the customer. Start it only after they approve. NEW is informed.</span></div>` : ''}
      ${j.extraReq && j.extraReq.status === 'open' && j.extra.status !== 'proposed' ? `<div class="note warn">${icon('clock', 18)}<span><b>Price requested.</b> NEW or your vendor is adding a price for "${esc(j.extraReq.text)}". The customer will get it as an offer.</span></div>` : ''}
      ${j.extra.status === 'declined' ? `<div class="note">${icon('info', 18)}<span>Customer declined extra work. Finish the original job only.</span></div>` : ''}
      ${stepHint ? `<div class="muted" style="text-align:center;font-size:13px">${stepHint}</div>` : ''}</div>`;
  }
  function navBanner(j) {
    const n = S.navInfo(j, Date.now()) || {};
    return `<div class="navbar"><div class="nav-arrow" id="nav-arrow" style="transform:rotate(${n.rot || 0}deg)">${icon('arrowr', 30, 2.4)}</div><div class="grow"><div class="nav-ins" id="nav-ins">${esc(n.text || '')}</div><div class="nav-sub"><span id="nav-rem">${n.remTxt || ''}</span> left . <span id="nav-eta">${n.etaMin || 0}</span> min</div></div><button class="nav-ext" data-a="toast" data-v="Opens your navigation app with the customer location (Android geo intent)" aria-label="Open in navigation app">${icon('nav', 20)}</button></div>`;
  }
  function jobCta(j) {
    if (j.status === 'assigned') return `<div class="cta-bar two"><button class="btn btn-s btn-big" data-a="decline" data-id="${j.id}">Decline</button><button class="btn btn-ok btn-big" style="flex:1.6" data-a="accept" data-id="${j.id}">Accept job</button></div>`;
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
    const t = T(), w = S.wallet(ui.me), st = S.get(), dj = doneJobs(), vend = t.vendor ? AC.vendById[t.vendor].name : '';
    const dep = st.deposits.filter(d => d.tech === ui.me).slice().reverse(), wd = st.withdrawals.filter(x => x.tech === ui.me).slice().reverse(), led = st.ledger.filter(l => l.tech === ui.me).slice(-12).reverse();
    const pendDep = dep.filter(d => d.status === 'pending').reduce((a, d) => a + d.amount, 0), canNet = w.cash > 0 && w.incentive > 0 && !pendDep;
    const chip = s => `<span class="badge ${s === 'accepted' || s === 'paid' ? 'b-ok' : s === 'pending' ? 'b-warn' : 'b-bad'}">${s[0].toUpperCase() + s.slice(1)}</span>`;
    const L = { cash_in: ['Cash collected', 'plus'], incentive: ['Incentive earned', 'plus'], deposit: ['Cash deposited', 'minus'], net: ['Net settled', 'minus'], withdraw: ['Withdrawn', 'minus'] };
    return `${top('Wallet', { back: false })}<div class="stack">
      <div class="wallet"><div class="w-col"><small>Cash to deposit</small><b>${money(w.cash)}</b><span>${pendDep ? money(pendDep) + ' waiting for ' + (vend || 'NEW') + ' to accept' : 'Collected from customers'}</span><button class="btn btn-a btn-sm" data-a="depopen" ${w.cash > 0 && w.cash > pendDep ? '' : 'disabled'}>Deposit cash</button></div>
        <div class="w-col"><small>${t.vendor ? 'Payout' : 'Incentive balance'}</small>${t.vendor ? `<b style="font-size:20px">Paid by ${esc(vend)}</b><span>Your vendor settles your earnings.</span>` : `<b>${money(w.incentive)}</b><span>${AC.config.INCENTIVE_RATE * 100}% of each paid job</span><button class="btn btn-s btn-sm" data-a="wdopen" ${w.incentive > 0 && w.cash === 0 ? '' : 'disabled'}>Withdraw</button>`}</div></div>
      ${w.cash > 0 && !t.vendor ? `<div class="note warn">${icon('info', 18)}<span><b>Deposit your cash first.</b> Withdrawals open when cash to deposit is ${money(0)}.${canNet ? ' You can also settle net: your incentive pays off cash you owe.' : ''}</span></div>${canNet ? `<button class="btn btn-s btn-block" data-a="netsettle">Settle net ${money(Math.min(w.cash, w.incentive))}</button>` : ''}` : ''}
      <div class="cardx"><b>How it works</b><div class="muted" style="font-size:13px;margin-top:6px">Cash you collect stays in your wallet until ${vend ? esc(vend) : 'NEW'} confirms your deposit. Then it goes to zero. ${t.vendor ? '' : 'Incentive is added when a job is paid. Withdraw it to bKash or Nagad.'}</div></div>
      ${dep.length || wd.length ? `<div class="cardx"><b>Requests</b><div class="col" style="gap:12px;margin-top:12px">${dep.map(d => `<div class="row"><span class="nico ${d.status === 'accepted' ? 'ok' : d.status === 'rejected' ? 'bad' : 'warn'}">${icon('wallet', 18)}</span><div class="grow"><b style="font-size:14px">Deposit ${money(d.amount)}</b><div class="muted" style="font-size:12.5px">${esc(d.method)} . ${AC.fmt.ago(d.at)}${d.by ? ' . ' + esc(d.by) : ''}</div></div>${chip(d.status)}</div>`).join('')}${wd.map(x => `<div class="row"><span class="nico ${x.status === 'paid' ? 'ok' : x.status === 'rejected' ? 'bad' : 'warn'}">${icon('arrowur', 18)}</span><div class="grow"><b style="font-size:14px">Withdraw ${money(x.amount)}</b><div class="muted" style="font-size:12.5px">${esc(x.method)} ${esc(x.number)} . ${AC.fmt.ago(x.at)}</div></div>${chip(x.status)}</div>`).join('')}</div></div>` : ''}
      <div class="cardx"><b>Wallet statement</b><div class="col" style="gap:12px;margin-top:12px">${led.length ? led.map(l => `<div class="row"><div class="grow"><b style="font-size:14px">${(L[l.kind] || [l.kind])[0]}</b><div class="muted" style="font-size:12.5px">${esc(l.note)} . ${AC.fmt.ago(l.at)}</div></div><b style="color:${(L[l.kind] || [])[1] === 'plus' ? 'var(--ok)' : 'var(--ink-2)'}">${(L[l.kind] || [])[1] === 'plus' ? '+' : '-'}${money(l.amount)}</b></div>`).join('') : '<span class="muted">Entries appear here as you complete jobs.</span>'}</div></div>
      <div class="cardx"><b>Jobs today</b><div class="col" style="gap:12px;margin-top:12px">${dj.length ? dj.map(j => `<div class="row"><div class="grow"><b style="font-size:14px">${esc(j.svcName)}</b><div class="muted" style="font-size:12.5px">${j.id} . ${AC.payName(j.pay.method)}</div></div><b>${money(S.jobTotal(j))}</b></div>`).join('') : '<span class="muted">No completed jobs yet today.</span>'}</div></div></div>`;
  }

  function Me() {
    const t = T();
    return `${top('Profile', { back: false })}<div class="stack">
      <div class="cardx row" style="gap:14px"><div class="avatar lg">${AC.fmt.ini(t.name)}</div><div class="grow"><b style="font-size:17px">${esc(t.name)}</b><div class="muted">${t.phone}</div><div class="muted" style="font-size:13px">${t.jobs} jobs completed</div></div></div>
      <div class="cardx lrow">${icon('store', 20)}<div class="grow"><b>${t.vendor ? esc(AC.vendById[t.vendor].name) : 'NEW (direct)'}</b><small>${t.vendor ? 'Vendor partner' : 'Company technician'} . ${AC.areas[t.area].n}</small></div></div>
      <div class="cardx"><b>Switch demo technician</b><div class="col" style="gap:8px;margin-top:12px">${AC.techs.map(x => `<button class="me-row ${x.id === ui.me ? 'on' : ''}" data-a="who" data-v="${x.id}"><span class="avatar sm">${AC.fmt.ini(x.name)}</span><span class="grow"><b style="font-size:14px">${esc(x.name)}</b><div class="muted" style="font-size:12px">${x.vendor ? esc(AC.vendById[x.vendor].name) : 'NEW direct'} . ${AC.areas[x.area].n}</div></span>${x.id === ui.me ? icon('check', 18) : ''}</button>`).join('')}</div></div>
      <button class="cardx lrow" data-a="history">${icon('clock', 20)}<div class="grow"><b>History</b><small>Your updates, saved on this phone</small></div>${icon('right', 18)}</button>
      <button class="btn btn-s btn-block" data-a="signout">${icon('logout', 18)} Sign out</button><button class="btn btn-g btn-block" data-a="reset">Reset demo data</button></div>`;
  }

  function Sheet() {
    const sh = ui.sheet; if (!sh) return '';
    const j = S.job(sh.id);
    if (sh.t === 'deposit') {
      const w = S.wallet(ui.me), tv = T().vendor, M = tv ? ['Hand to vendor', 'bKash', 'Nagad'] : ['Office handover', 'bKash', 'Nagad', 'Bank transfer'], cur = ui.d.dm || M[0], amt = ui.d.amt == null ? w.cash : ui.d.amt, need = cur !== M[0];
      return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Deposit cash</h2><p class="muted" style="margin:6px 0 14px">To ${tv ? esc(AC.vendById[tv].name) : 'NEW'}. Your cash balance goes down when they accept.</p>
        <div class="field"><label for="f-amt">Amount</label><input class="input" id="f-amt" data-b="amt" inputmode="numeric" value="${esc(amt)}"></div><div class="lab">How are you paying</div><div class="row wrap" style="gap:8px">${M.map(m => `<button class="chip ${cur === m ? 'on' : ''}" data-a="dm" data-v="${m}">${m}</button>`).join('')}</div>
        ${need ? `<div class="field" style="margin-top:12px"><label for="f-ref">Transaction ID</label><input class="input" id="f-ref" data-b="ref" value="${esc(ui.d.ref || '')}" placeholder="Example: 9K3X7P2L"></div>` : `<div class="note" style="margin-top:12px">${icon('info', 18)}<span>Hand the cash over and ask them to accept it in the app.</span></div>`}
        <button class="btn btn-p btn-lg btn-block" style="margin-top:16px" data-a="depsubmit" ${+amt > 0 && +amt <= w.cash && (!need || (ui.d.ref || '').trim().length > 3) ? '' : 'disabled'}>Send deposit request</button></div>`;
    }
    if (sh.t === 'withdraw') {
      const w = S.wallet(ui.me), cur = ui.d.wm || 'bKash', amt = ui.d.wamt == null ? w.incentive : ui.d.wamt;
      return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Withdraw incentive</h2><p class="muted" style="margin:6px 0 14px">Available ${money(w.incentive)}. NEW sends it to your wallet account.</p>
        <div class="field"><label for="f-wamt">Amount</label><input class="input" id="f-wamt" data-b="wamt" inputmode="numeric" value="${esc(amt)}"></div><div class="lab">Send to</div><div class="row" style="gap:8px">${['bKash', 'Nagad'].map(m => `<button class="chip ${cur === m ? 'on' : ''}" data-a="wm" data-v="${m}">${m}</button>`).join('')}</div>
        <div class="field" style="margin-top:12px"><label for="f-num">${cur} number</label><input class="input" id="f-num" data-b="num" inputmode="tel" value="${esc(ui.d.num == null ? T().phone : ui.d.num)}"></div>
        <button class="btn btn-p btn-lg btn-block" style="margin-top:16px" data-a="wdsubmit" ${+amt > 0 && +amt <= w.incentive && /^01[3-9]\d{8}$/.test(String(ui.d.num == null ? T().phone : ui.d.num).replace(/\D/g, '')) ? '' : 'disabled'}>Request withdrawal</button></div>`;
    }
    if (sh.t === 'extra') {
      const cat = S.get().extraCatalog, sel = cat.filter(p => ui.extra[p.id]), sum = sel.reduce((s, p) => s + p.price, 0);
      return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Extra work</h2><p class="muted" style="margin:6px 0 14px">Pick from the price list. The customer decides. NEW only gets an update, so you never wait for an office approval.</p>
        <div class="col" style="gap:8px">${cat.map(p => `<button class="chk ${ui.extra[p.id] ? 'on' : ''}" data-a="xpart" data-v="${p.id}"><span class="ck" style="${ui.extra[p.id] ? 'background:var(--brand);border-color:var(--brand)' : ''}">${ui.extra[p.id] ? icon('check', 14, 3) : ''}</span><span class="grow"><b>${esc(p.label)}</b></span><b>${money(p.price)}</b></button>`).join('')}</div>
        <button class="btn btn-p btn-lg btn-block" style="margin-top:14px" data-a="sendextra" ${sum ? '' : 'disabled'}>Send to customer${sum ? ' . ' + money(sum) : ''}</button>
        <div class="lab">Item not in the list?</div><div class="row"><input class="input" id="f-xtext" data-b="xtext" placeholder="Describe the part or work" value="${esc(ui.d.xtext || '')}" autocomplete="off"><button class="btn btn-s" data-a="xask" ${(ui.d.xtext || '').trim() ? '' : 'disabled'}>Ask for price</button></div>
        <div class="note warn" style="margin-top:14px">${icon('alert', 18)}<span>Do not start extra work until the customer approves. NEW is not responsible for work outside the order.</span></div></div>`;
    }
    if (sh.t === 'finish') {
      const cod = j.pay.method === 'cod', tot = S.jobTotal(j), d = ui.done;
      return `<div class="scrim" data-a="close"></div><div class="sheet"><div class="grab"></div><h2 style="font-size:20px">Complete job</h2>
        <div class="col" style="gap:8px;margin-top:14px">${['Tested cooling and airflow', 'Cleaned the work area', 'Explained the work to the customer'].map((x, i) => `<button class="chk ${d.ck[i] ? 'on' : ''}" data-a="ck" data-v="${i}"><span class="ck" style="${d.ck[i] ? 'background:var(--brand);border-color:var(--brand)' : ''}">${d.ck[i] ? icon('check', 14, 3) : ''}</span><b>${x}</b></button>`).join('')}</div>
        <div class="lab">After photos</div><div class="row" style="gap:10px">${[0, 1, 2].map(i => `<button class="photo grow ${i < d.photos ? 'has' : ''}" data-a="photo">${icon(i < d.photos ? 'check' : 'camera', 22)}</button>`).join('')}</div>
        <div class="lab">Customer's completion code</div><input class="input otp-in" id="f-code" data-b="code" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${esc(ui.d.code || '')}">${d.err ? `<div class="err" style="color:var(--bad);font-weight:600;font-size:13px;margin-top:8px">That code does not match. Ask the customer to check the NEW app.</div>` : `<div class="muted" style="font-size:12.5px;margin-top:6px">The customer sees this code in their app. The job closes when you enter it.</div>`}
        ${cod ? `<div class="lab">Payment</div><button class="chk ${d.cash ? 'on' : ''}" data-a="cash"><span class="ck" style="${d.cash ? 'background:var(--brand);border-color:var(--brand)' : ''}">${d.cash ? icon('check', 14, 3) : ''}</span><span class="grow"><b>I collected ${money(tot)} in cash</b></span></button>` : `<div class="note" style="margin-top:16px">${icon('info', 18)}<span>The customer pays ${money(tot)} online through ${AC.payName(j.pay.method)}.</span></div>`}
        <button class="btn btn-ok btn-lg btn-block" style="margin-top:16px" data-a="complete" data-id="${j.id}" ${(cod && !d.cash) || d.ck.filter(Boolean).length < 2 || (ui.d.code || '').length !== 4 ? 'disabled' : ''}>Mark as completed</button></div>`;
    }
    return '';
  }

  /* ---------- Render ---------- */
  function JChat(id) {
    const j = S.job(id), open = S.chatOpen(j), first = j.cust.name.split(' ')[0], ms = S.chatMsgs('J:' + id);
    const QUICK = ['I am 10 minutes away', 'I am at your door', 'Please share the exact address', 'Please call me'];
    return { body: `${top('Chat with ' + esc(first), { right: `<span class="badge ${open ? 'b-ok' : 'b-n'}">${open ? 'On the job' : 'Closed'}</span>` })}
      ${open ? '' : `<div class="chat-closed note">${icon('info', 18)}<span>Chat closes when the job ends. You can still read it.</span></div>`}
      ${ms.length ? AC.chatUI.bubbles(ms, ['tech'], { customer: j.cust.name }) : `<div class="empty"><h3>No messages yet</h3><span>Tell ${esc(first)} when you are close. Messages stay between you and the customer while the job is on.</span></div>`}`,
      cta: open ? `<div class="qr" style="background:var(--surface);padding-top:10px">${QUICK.map(q => `<button class="chip" data-a="jquick" data-v="${q}">${q}</button>`).join('')}</div><div class="chat-in"><input class="input" id="f-jchat" data-b="jchat" placeholder="Message ${esc(first)}" value="${esc(ui.d.jchat || '')}" autocomplete="off"><button class="send" data-a="jsend" aria-label="Send">${icon('send', 20)}</button></div>` : '' };
  }
  /* Dispatch help: assistant first, then a human agent from the admin panel */
  function Help() {
    const d = S.dispatchOf(ui.me), ms = S.chatMsgs('D:' + ui.me), mode = d.mode;
    const st = mode === 'agent' ? [`${esc(d.agent || 'An agent')} is with you`, 'A dispatch agent is replying here.', 'b-ok', 'user'] : mode === 'waiting' ? ['Waiting for a dispatch agent', 'You are in the queue. You can keep typing, the agent sees everything.', 'b-warn', 'clock'] : ['Dispatch assistant', 'Replies at once. An agent joins if it cannot solve it.', 'b-info', 'chat'];
    const QUICK = ['Customer not answering', 'Cannot find the address', 'Cash or payment question', 'App problem'];
    return { body: `${top('Dispatch', { back: false })}
      <div class="cardx chat-head-card"><div class="row"><span class="svc-ic">${icon(st[3], 20)}</span><div class="grow"><b>${st[0]}</b><div class="muted" style="font-size:13px">${st[1]}</div></div><span class="badge ${st[2]}">${mode === 'bot' ? 'Assistant' : mode === 'waiting' ? 'Queue' : 'Agent'}</span></div></div>
      ${ms.length ? AC.chatUI.bubbles(ms, ['tech'], {}) : `<div class="empty"><h3>Need help on a job?</h3><span>Tell dispatch what is wrong. The assistant answers first and an agent takes over when needed.</span></div>`}`,
      cta: `<div class="qr" style="background:var(--surface);padding-top:10px">${mode === 'bot' ? `<button class="chip on" data-a="dagent">Talk to an agent</button>` + QUICK.map(q => `<button class="chip" data-a="dquick" data-v="${q}">${q}</button>`).join('') : ''}</div><div class="chat-in"><input class="input" id="f-dm" data-b="dm" placeholder="${mode === 'agent' ? 'Reply to ' + esc(d.agent || 'the agent') : 'Describe the problem'}" value="${esc(ui.d.dm || '')}" autocomplete="off"><button class="send" data-a="dsend" aria-label="Send">${icon('send', 20)}</button></div>` };
  }
  const TABS = [['jobs', 'Jobs', 'briefcase'], ['map', 'Map', 'map'], ['help', 'Dispatch', 'chat'], ['earn', 'Earnings', 'wallet'], ['me', 'Profile', 'user']];
  function render() {
    const af = document.activeElement, afId = af && af.id, afSel = af && af.selectionStart;
    const t = ui.stack[ui.stack.length - 1], key = t ? t.s + (t.id || '') : ui.tab;
    const old = document.getElementById('view'); if (old) ui.scroll[ui.key] = old.scrollTop;
    let body, cta = '', tabs = !t;
    if (!ui.signed) { $app.innerHTML = `<div class="statusbar"><span>${clock()}</span></div>${Login()}`; return; }
    if (t && t.s === 'history') body = top('History') + `<div class="pad">${AC.history.html('tech:' + ui.me)}</div>`; else if (t && t.s === 'notifs') body = top('Notifications') + `<div class="pad"><div class="cardx" style="padding:4px 16px">${AC.notifUI.html('tech:' + ui.me, 'job')}</div></div>`; else if (t && t.s === 'jchat') { const c = JChat(t.id); body = c.body; cta = c.cta; if (S.chatUnread('tech:' + ui.me).includes('J:' + t.id)) setTimeout(() => S.act.markSeen('tech:' + ui.me, 'c:J:' + t.id), 0); } else if (t) { body = Job(t.id); const j = S.job(t.id); if (j) cta = jobCta(j); } else if (ui.tab === 'help') { const h = Help(); body = h.body; cta = h.cta; if (S.chatUnread('tech:' + ui.me).includes('D:' + ui.me)) setTimeout(() => S.act.markSeen('tech:' + ui.me, 'c:D:' + ui.me), 0); } else body = { jobs: Home, map: Map, earn: Earn, me: Me }[ui.tab]();
    const CU = S.chatUnread('tech:' + ui.me), dot = S.unread('tech:' + ui.me, 'jobs').length + CU.filter(x => x.startsWith('J:')).length, helpDot = CU.filter(x => x.startsWith('D:')).length;
    $app.innerHTML = `<div class="statusbar${!t && ui.tab === 'jobs' || !t ? ' dk' : ''}"><span>${clock()}</span><span class="sb-r"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg></span></div><div class="view" id="view">${body}</div>${cta}${tabs ? `<nav class="tabbar">${TABS.map(x => `<button class="tab ${ui.tab === x[0] ? 'on' : ''}" data-a="tab" data-v="${x[0]}">${icon(x[2], 22, ui.tab === x[0] ? 2.1 : 1.7)}${x[1]}${x[0] === 'jobs' && dot ? `<span class="dot">${dot}</span>` : ''}${x[0] === 'help' && helpDot ? `<span class="dot">${helpDot}</span>` : ''}</button>`).join('')}</nav>` : ''}${Sheet()}`;
    const v = document.getElementById('view'); v.scrollTop = (t && t.s === 'jchat') || (!t && ui.tab === 'help') ? 99999 : key === ui.key ? (ui.scroll[key] || 0) : 0; ui.key = key;
    if (afId) { const e = document.getElementById(afId); if (e && e !== document.activeElement) { e.focus(); try { e.setSelectionRange(afSel, afSel); } catch (x) { } } }
    mountMap(t);
  }
  const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/ [AP]M/, '');

  function mountMap(t) {
    ui.map = null; const host = document.getElementById('trackmap'); if (!host) return;
    ui.map = { api: CityMap.mount(host), id: t ? t.id : null }; const tt = T();
    const j = t ? S.job(t.id) : current();
    if (j) { ui.map.id = j.id; ui.map.api.fit([j.cust, tt], 100); } else ui.map.api.full(); drawMap();
  }
  function updateNav() {
    const j = ui.map && ui.map.id && S.job(ui.map.id); if (!j || j.status !== 'ontheway' || !document.getElementById('nav-ins')) return; const n = S.navInfo(j, Date.now()); if (!n) return;
    document.getElementById('nav-ins').textContent = n.text; document.getElementById('nav-rem').textContent = n.remTxt || ''; document.getElementById('nav-eta').textContent = n.etaMin; document.getElementById('nav-arrow').style.transform = 'rotate(' + n.rot + 'deg)';
    if (!n.arrived) { const p = S.techPos(j, Date.now()); ui.map.api.fit([p, j.cust], 70); }
  }
  function drawMap() {
    updateNav(); if (!ui.map) return; const tt = T(), j = ui.map.id ? S.job(ui.map.id) : current(), now = Date.now();
    const pins = [];
    if (j) { const p = tt && S.techPos(j, now) || tt; pins.push({ key: 'c', kind: 'cust', x: j.cust.x, y: j.cust.y, label: j.cust.name.split(' ')[0] }, { key: 't', kind: 'tech', x: p.x, y: p.y, label: 'You', pulse: j.status === 'ontheway' }); }
    else pins.push({ key: 't', kind: 'tech', x: tt.x, y: tt.y, label: 'You', pulse: true });
    ui.map.api.setPins(pins);
    ui.map.api.setRoutes(j && j.techId === ui.me && ['assigned', 'accepted', 'ontheway'].includes(j.status) ? [{ key: 'r', pts: S.tripPoints(j), p: S.tripProgress(j, now) }] : []);
  }
  setInterval(drawMap, 450);

  /* ---------- Actions ---------- */
  const A = {
    tab(el) { ui.tab = el.dataset.v; ui.stack = []; render(); }, back() { const x = ui.stack[ui.stack.length - 1]; ui.stack.pop(); render(); if (x && x.s === 'notifs') S.act.markNotifs('tech:' + ui.me); }, notifs() { ui.stack.push({ s: 'notifs' }); render(); }, history() { ui.stack.push({ s: 'history' }); render(); }, hf(el) { AC.history.filter = el.dataset.v; render(); }, hclear() { AC.history.clear('tech:' + ui.me); render(); }, toast(el) { toast(el.dataset.v, 'phone'); }, close() { ui.sheet = null; render(); },
    signin() { ui.signed = true; try { sessionStorage.removeItem('tech.out'); } catch (e) { } render(); },
    signout() { ui.signed = false; try { sessionStorage.setItem('tech.out', '1'); } catch (e) { } render(); },
    online() { S.act.setOnline(ui.me, S.get().online[ui.me] === false); },
    jchat(el) { ui.d.jchat = ''; ui.stack.push({ s: 'jchat', id: el.dataset.v }); render(); S.act.markSeen('tech:' + ui.me, 'c:J:' + el.dataset.v); },
    jsend() { const x = ui.stack[ui.stack.length - 1]; if (!x || x.s !== 'jchat') return; const v = (ui.d.jchat || '').trim(); if (!v) return; S.act.jobChat(x.id, 'tech', v); ui.d.jchat = ''; render(); },
    jquick(el) { const x = ui.stack[ui.stack.length - 1]; if (!x || x.s !== 'jchat') return; S.act.jobChat(x.id, 'tech', el.dataset.v); },
    dsend() { const v = (ui.d.dm || '').trim(); if (!v) return; S.act.dispatchSend(ui.me, v); ui.d.dm = ''; render(); },
    dquick(el) { S.act.dispatchSend(ui.me, el.dataset.v); },
    dagent() { S.act.dispatchHandoff(ui.me); toast('A dispatch agent will reply here', 'chat'); },
    job(el) { ui.stack.push({ s: 'job', id: el.dataset.v }); render(); S.act.markSeen('tech:' + ui.me, 'j:' + el.dataset.v); },
    accept(el) { S.act.respond(el.dataset.id, true); toast('Job accepted. Customer notified.'); if (!ui.stack.length) { ui.stack.push({ s: 'job', id: el.dataset.id }); } render(); },
    decline(el) { S.act.respond(el.dataset.id, false); ui.stack = []; toast('Job declined', 'info'); render(); },
    trip(el) { S.act.startTrip(el.dataset.id); toast('Trip started. Sharing live location.', 'nav'); },
    arrive(el) { S.act.arrive(el.dataset.id); toast('Customer notified: you have arrived', 'pin'); },
    work(el) { S.act.startWork(el.dataset.id); },
    depopen() { ui.d.amt = null; ui.d.ref = ''; ui.d.dm = null; ui.sheet = { t: 'deposit' }; render(); }, wdopen() { ui.d.wamt = null; ui.d.wm = 'bKash'; ui.d.num = null; ui.sheet = { t: 'withdraw' }; render(); },
    dm(el) { ui.d.dm = el.dataset.v; render(); }, wm(el) { ui.d.wm = el.dataset.v; render(); },
    depsubmit() { const w = S.wallet(ui.me), M = T().vendor ? 'Hand to vendor' : 'Office handover', m = ui.d.dm || M; S.act.requestDeposit(ui.me, ui.d.amt == null ? w.cash : +ui.d.amt, m, ui.d.ref); ui.sheet = null; toast('Deposit request sent. Cash updates when accepted.', 'wallet'); render(); },
    wdsubmit() { const w = S.wallet(ui.me); S.act.requestWithdraw(ui.me, ui.d.wamt == null ? w.incentive : +ui.d.wamt, ui.d.wm || 'bKash', ui.d.num == null ? T().phone : ui.d.num); ui.sheet = null; toast('Withdrawal requested', 'wallet'); render(); },
    netsettle() { S.act.requestNet(ui.me); toast('Net settlement sent for acceptance', 'wallet'); },
    extra(el) { ui.extra = {}; ui.sheet = { t: 'extra', id: el.dataset.id }; render(); },
    xpart(el) { ui.extra[el.dataset.v] = !ui.extra[el.dataset.v]; render(); },
    sendextra() { const id = ui.sheet.id; S.act.proposeExtra(id, S.get().extraCatalog.filter(p => ui.extra[p.id]).map(p => ({ label: p.label, price: p.price }))); ui.sheet = null; toast('Sent to the customer. NEW is informed.', 'send'); render(); },
    xask() { const id = ui.sheet.id; S.act.requestExtraItem(id, ui.d.xtext.trim()); ui.d.xtext = ''; ui.sheet = null; toast('Price requested from NEW', 'send'); render(); },
    finish(el) { ui.d.code = ''; ui.done = { cash: false, ck: [true, true, false], photos: 1, err: false }; ui.sheet = { t: 'finish', id: el.dataset.id }; render(); },
    ck(el) { const i = +el.dataset.v; ui.done.ck[i] = !ui.done.ck[i]; render(); }, cash() { ui.done.cash = !ui.done.cash; render(); }, photo() { ui.done.photos = Math.min(3, ui.done.photos + 1); render(); },
    complete(el) { const ok = S.act.complete(el.dataset.id, ui.done.cash, (ui.d.code || '').trim()); if (!ok) { ui.done.err = true; ui.d.code = ''; render(); return; } ui.sheet = null; ui.d.code = ''; toast('Job completed. Nice work.'); render(); },
    who(el) { ui.me = el.dataset.v; try { sessionStorage.setItem('tech.me', ui.me); } catch (e) { } ui.tab = 'jobs'; ui.stack = []; render(); toast('Signed in as ' + T().name, 'user'); },
    sim() {
      const pool = ['C10', 'C9', 'C1', 'C5'].map(id => AC.custById[id]).sort((a, b) => S.dist(a, T()) - S.dist(b, T()));
      const c = pool[0], svc = ['ac-repair', 'ac-cooling', 'ac-service'][Math.floor(Math.random() * 3)];
      const id = S.act.createJob({ cust: c.id, svc, slot: 'Today, 4-6 PM', method: 'cod', note: 'Simulated request', discount: 100, verified: true }); S.act.assign(id, ui.me, 'Admin');
    },
    reset() { S.act.reset(); ui.stack = []; ui.tab = 'jobs'; render(); toast('Demo data reset', 'info'); }
  };
  $app.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const f = A[el.dataset.a]; if (f) f(el); });

  $app.addEventListener('input', e => { const k = e.target.dataset.b; if (!k) return; ui.d[k] = e.target.value; if (k === 'code' && e.target.value.length === 4) { ui.done.err = false; render(); } if (k === 'xtext' || k === 'amt' || k === 'ref' || k === 'wamt' || k === 'num') render(); });
  $app.addEventListener('keydown', e => { if (e.key !== 'Enter') return; if (e.target.id === 'f-jchat') A.jsend(); if (e.target.id === 'f-dm') A.dsend(); });
  S.subscribe((s, prev) => {
    const lc = (s.chat || []).slice(-1)[0], pc = (prev.chat || []).slice(-1)[0], x = ui.stack[ui.stack.length - 1];
    if (ui.signed && lc && (!pc || lc.id !== pc.id) && S.chatUnread('tech:' + ui.me).includes(lc.thread) && !(x && x.s === 'jchat' && 'J:' + x.id === lc.thread) && !(lc.thread.startsWith('D:') && !x && ui.tab === 'help')) toast(lc.thread.startsWith('D:') ? 'New message from dispatch' : 'New message from the customer', 'chat');
    render();
  });
  setInterval(() => document.querySelectorAll('.cd').forEach(e => { const s = Math.max(0, Math.round((+e.dataset.end - Date.now()) / 1000)); e.innerHTML = icon('clock', 16) + ' Respond in ' + fmtLeft(s); }), 1000);
  AC.history.track(() => 'tech:' + ui.me);
  render();
})();
