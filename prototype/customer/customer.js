/* NEW customer app prototype. Signed in as Nadia Rahman (C1). */
(function () {
  const S = AC.store, ME = 'C1', me = AC.custById[ME], money = AC.fmt.money, $app = document.getElementById('app'); AC.ui.dedupe($app); AC.theme.on(() => render());
  const ui = { tab: 'home', stack: [], sheet: null, cat: 'all', cart: [], d: {}, ot: 'book', key: '', pdraft: null, buy: [], buyMode: false, promo: null, promoOff: false, promoOpen: false, promoErr: '', undo: null, wish: {}, sort: 'popular', added: false, book: null, map: null, scroll: {} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const myJobs = () => S.get().jobs.filter(j => j.cust.id === ME);
  const myOrders = () => S.get().orders.filter(o => o.cust === ME);
  const activeJob = () => myJobs().find(S.isActive);
  const firstName = me.name.split(' ')[0];
  function toast(msg, ic) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon(ic || 'checkc', 18) + '<span>' + esc(msg) + '</span>';
    const w = document.getElementById('toasts'); w.appendChild(t); setTimeout(() => t.remove(), 3200);
  }

  /* ---------- Cart ---------- */
  const lines = () => ui.buyMode ? ui.buy : ui.cart;
  function promoEval(p, sub, acSub, first) {
    if (p.first && !first) return { err: p.code + ' is for first orders only.' };
    if (p.cat === 'ac' && !acSub) return { err: p.code + ' works on air conditioners.' };
    const base = p.cat === 'ac' ? acSub : sub;
    if (p.min && base < p.min) return { err: 'Add ' + money(p.min - base) + ' more to use ' + p.code + '.' };
    let d = p.flat ? p.flat : Math.round(base * p.pct / 100); if (p.cap) d = Math.min(p.cap, d); return { disc: d };
  }
  function cartCalc() {
    let sub = 0, inst = 0, ac = false, n = 0, acSub = 0;
    lines().forEach(l => { const p = AC.catById[l.pid], v = p.price * l.qty; sub += v; n += l.qty; if (p.cat === 'ac') { ac = true; acSub += v; if (l.install) inst += Math.round(AC.INSTALL_FEE * (1 - AC.config.INSTALL_DISCOUNT)) * l.qty; } });
    const first = !myOrders().length, code = ui.promo || (first && !ui.promoOff ? 'FIRST15' : null), pr = code && AC.shopPromos.find(p => p.code === code);
    const ev = pr ? promoEval(pr, sub, acSub, first) : {}, disc = ev.disc || 0, free = !ac && sub >= 3000;
    const delivery = lines().length ? (ac ? 350 : (free ? 0 : 80)) : 0;
    const avail = AC.shopPromos.filter(p => p.code !== code && !promoEval(p, sub, acSub, first).err);
    return { sub, inst, disc, code: disc ? code : null, err: ev.err, delivery, total: sub + inst - disc + delivery, ac, n, first, avail, toFree: !ac && !free && sub ? 3000 - sub : 0 };
  }

  /* ---------- Pieces ---------- */
  const art = (p) => Art.product(p);
  const tone = s => { const t = Art.tints[s.tone || 0]; return 'background:' + t.bg + ';color:' + t.fg; };
  function pcard(p) {
    const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0, l = ui.cart.find(x => x.pid === p.id), q = l ? l.qty : 0;
    return `<div class="pc ${q ? 'in' : ''} fade"><div class="pimg"><button class="plink-img" data-a="prod" data-v="${p.id}" aria-label="View ${esc(p.name)}">${art(p)}</button>${S.canBuy(p) ? `<span class="ptag">${esc(p.tag)}</span>` : `<span class="ptag" style="background:var(--ink);color:var(--bg)">Unavailable</span>`}${off ? `<span class="pdisc">-${off}%</span>` : ''}<button class="heart ${ui.wish[p.id] ? 'on' : ''}" data-a="wish" data-v="${p.id}" aria-label="Save ${esc(p.name)}">${icon('heart', 18)}</button></div>
      <button class="ptext" data-a="prod" data-v="${p.id}"><span class="pb">${esc(p.brand)}</span><span class="pn">${esc(p.name)}</span><span class="prate">${icon('star', 12)} ${p.rating} <i>${p.sold} sold</i></span><span class="pp"><b>${money(p.price)}</b>${p.was ? `<s>${money(p.was)}</s>` : ''}</span></button>
      <div class="pact">${!S.canBuy(p) ? `<button class="btn btn-s pbtn" style="flex:1" data-a="prod" data-v="${p.id}">Unavailable</button>` : q ? `<div class="step sm" role="group" aria-label="Quantity"><button data-a="pq" data-v="${p.id}" data-d="-1" aria-label="Less">${icon('minus', 16)}</button><b>${q}</b><button data-a="pq" data-v="${p.id}" data-d="1" aria-label="More">${icon('plus', 16)}</button></div>` : `<button class="btn btn-s pbtn" data-a="quick" data-v="${p.id}" aria-label="Add ${esc(p.name)} to cart">${icon('cart', 16)}Add</button>`}${S.canBuy(p) ? `<button class="btn btn-p pbtn" data-a="buynow" data-v="${p.id}">Buy now</button>` : ''}</div></div>`;
  }
  const top = (title, o) => o && o.back === false ? `<div class="band sm">${top0(title, o)}</div>` : top0(title, o);
  const top0 = (title, o) => `<div class="top">${o && o.back === false ? '' : `<button class="back" data-a="back" aria-label="Back">${icon('left', 22)}</button>`}<h1>${title}</h1>${(o && o.right) || ''}</div>`;
  const cartBtn = () => { const n = cartCalc().n; return `<button class="icon-btn" data-a="cart" aria-label="Cart">${icon('cart', 22)}${n ? `<span class="badge-n">${n}</span>` : ''}</button>`; };

  /* ---------- Screens ---------- */
  function Home() {
    const aj = activeJob(), P = c => S.storeProducts().filter(p => p.cat === c);
    let banner = '';
    if (aj) {
      const t = AC.techById[aj.techId];
      banner = `<button class="live-banner fade" data-a="track" data-v="${aj.id}"><span class="pulse-dot"></span><span class="grow"><b>${esc(aj.svcName)}</b><small>${S.META[aj.status].cust}${t && aj.status === 'ontheway' ? ' . ' + S.etaMin(aj) + ' min away' : ''}</small></span>${icon('right', 18)}</button>`;
    }
    const care = S.careFor(ME), cm = care ? Math.max(1, Math.round(care.days / 30)) : 0;
    const careCard = care ? `<button class="care ${care.overdue ? 'due' : care.soon ? 'soon' : ''}" data-a="book" data-v="ac-service"><span class="svc-ic">${icon('snow', 20)}</span><span class="grow"><b>${care.overdue ? 'AC servicing is overdue' : care.soon ? 'AC servicing due in ' + care.days + ' days' : 'Servicing due in ' + cm + ' month' + (cm > 1 ? 's' : '')}</b><small>Last serviced ${new Date(care.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. ${care.overdue || care.soon ? 'Book now to keep it cooling well.' : 'We will remind you when it is time.'}</small></span><span class="care-cta">${care.overdue || care.soon ? 'Book' : 'Book early'}</span></button>` : '';
    return `<div class="band"><div class="top">${AC.logo.tile(40, false)}<div class="loc" style="margin-left:2px">${icon('pin', 20)}<div><small>Service and delivery</small>Banani, Dhaka</div></div>${cartBtn()}<button class="icon-btn" data-a="notifs" aria-label="Notifications">${icon('bell', 22)}${S.notifUnread('cust:' + ME) ? `<span class="badge-n">${S.notifUnread('cust:' + ME)}</span>` : ''}</button></div>
    <div class="pad"><h1 class="greet">Hello, ${esc(firstName)}</h1><p class="greet-s">What does your AC need today?</p></div>
    <button class="search" style="margin-top:14px" data-a="tab" data-v="shop">${icon('search', 18)}<span>Search ACs, bags, cosmetics</span></button></div>
    ${banner}
    <div class="sec"><div class="sec-h"><h2>Book a service</h2><button data-a="tab" data-v="services">See all</button></div>
      <div class="svc-grid">${AC.services.map(s => `<button class="svc-tile" data-a="book" data-v="${s.id}"><span class="svc-ic" style="background:${Art.tints[s.tone || 0].bg};color:${Art.tints[s.tone || 0].fg}">${icon(s.icon, 22)}</span><b>${s.name}</b><small>${money(s.price)}</small></button>`).join('')}</div></div>
    ${careCard}
    <button class="offer-strip" data-a="tab" data-v="shop"><span class="os-ic">${icon('gift', 20)}</span><span class="grow"><b>15% off your first order</b><small>Use code FIRST15 at checkout</small></span><span class="os-code">FIRST15</span></button>
    <div class="sec"><div class="sec-h"><h2>Shop by category</h2></div>
      <div class="cats3">${[['ac', 'Air conditioners', 'split', 0], ['bag', 'Bags', 'tote', 2], ['cos', 'Cosmetics', 'bottle', 1]].map(x => `<button class="cat3" data-a="shopcat" data-v="${x[0]}"><span class="cat3-art" style="background:${Art.tints[x[3]].bg}">${Art.draw(x[2], x[3])}</span><b>${x[1]}</b></button>`).join('')}</div></div>
    <div class="sec"><div class="sec-h"><h2>Air conditioners</h2><button data-a="shopcat" data-v="ac">See all</button></div><div class="hscroll">${P('ac').map(pcard).join('')}</div></div>
    <div class="sec"><div class="sec-h"><h2>Bags</h2><button data-a="shopcat" data-v="bag">See all</button></div><div class="hscroll">${P('bag').map(pcard).join('')}</div></div>
    <div class="sec"><div class="sec-h"><h2>Local cosmetics</h2><button data-a="shopcat" data-v="cos">See all</button></div><div class="hscroll">${P('cos').map(pcard).join('')}</div></div>
    <div class="sec"><div class="trust"><div>${icon('shield', 22)}Verified technicians</div><div>${icon('wallet', 22)}Pay after service</div><div>${icon('repeat', 22)}1 year repair warranty</div></div></div>`;
  }

  function Services() {
    return `${top('Services', { back: false })}
    <div class="pad" style="margin-top:6px"><div class="note ok">${icon('shield', 18)}<span>Pay after the job is done. Extra parts are quoted first and need your approval.</span></div></div>
    <div class="stack" style="margin-top:14px">${AC.services.map(s => `<button class="svc-row" data-a="book" data-v="${s.id}"><span class="svc-ic" style="${tone(s)}">${icon(s.icon, 24)}</span><div class="grow"><h3>${s.name}</h3><p>${s.desc}</p><div class="meta"><span>${money(s.price)}</span><span class="muted" style="font-weight:600;display:inline-flex;gap:4px;align-items:center">${icon('clock', 14)} ${s.dur}</span></div></div>${icon('right', 18)}</button>`).join('')}</div>
    <div class="pad sec"><div class="cardx" style="display:flex;gap:12px">${icon('gift', 22)}<div><b>Bought an AC from us?</b><div class="muted" style="font-size:13px">Installation is 20% off and repairs are free for 1 year.</div></div></div></div>`;
  }

  function Book() {
    const b = ui.book, s = AC.svcById[b.svc], price = s.price * b.units, total = price - 100;
    return `${top(s.name)}
    <div class="pad">
      <div class="cardx" style="display:flex;gap:14px;align-items:center"><span class="svc-ic" style="width:48px;height:48px;${tone(s)}">${icon(s.icon, 24)}</span><div class="grow"><b>${s.name}</b><div class="muted" style="font-size:13px">${s.desc}</div></div></div>
      <label class="lab">Type of AC</label><div class="choice" style="margin:0">${['Split', 'Window', 'Cassette'].map(t => `<button class="${b.ac === t ? 'on' : ''}" data-a="bac" data-v="${t}">${t}</button>`).join('')}</div>
      <div class="row between" style="margin-top:16px"><b>Number of units</b><div class="step"><button data-a="bunits" data-v="-1" aria-label="Fewer">${icon('minus', 16)}</button><b>${b.units}</b><button data-a="bunits" data-v="1" aria-label="More">${icon('plus', 16)}</button></div></div>
      <label class="lab">When should we come?</label><div class="optgrid">${AC.slots.map(t => `<button class="slot ${b.slot === t ? 'on' : ''}" data-a="bslot" data-v="${t}">${t}</button>`).join('')}</div>
      <label class="lab">Address</label><div class="field"><input class="input" id="f-addr" data-b="addr" value="${esc(b.addr)}" autocomplete="off"></div>
      <div class="field" style="margin-top:10px"><label for="f-phone">Phone number</label><input class="input" id="f-phone" data-b="phone" value="${esc(b.phone)}" inputmode="tel"></div>
      <div class="field" style="margin-top:10px"><label for="f-note">What is the problem? (optional)</label><textarea class="textarea" id="f-note" data-b="note" placeholder="Example: Water drips from the indoor unit">${esc(b.note)}</textarea></div>
      <label class="lab">Pay after the service with</label><div class="col" style="gap:8px">${AC.payMethods.map(m => `<button class="opt ${b.method === m.id ? 'on' : ''}" data-a="bpm" data-v="${m.id}"><span class="rd"></span><span class="grow"><b>${m.name}</b><small>${m.note}</small></span>${AC.payMark(m.id)}</button>`).join('')}</div>
      <div class="cardx sum" style="margin-top:20px"><div><span>${s.name} x ${b.units}</span><span>${money(price)}</span></div><div class="sv"><span>Confirmation call discount</span><span>-${money(100)}</span></div><div class="tot"><span>Estimated total</span><span>${money(total)}</span></div></div>
      <div class="note warn" style="margin-top:12px">${icon('info', 18)}<span>Our support team calls you to confirm. If the technician finds extra work, you approve the cost before anything starts.</span></div>
    </div>`;
  }

  function stageIdx(st) { return { requested: 0, forwarded: 0, assigned: 1, accepted: 1, ontheway: 2, arrived: 3, working: 4, completed: 5 }[st] || 0; }
  const STAGES = [['Request received', ['requested']], ['Technician assigned', ['assigned', 'accepted']], ['On the way', ['ontheway']], ['Technician arrived', ['arrived']], ['Work in progress', ['working']], ['Job completed', ['completed']]];
  function Track(id) {
    const j = S.job(id); if (!j) return top('Booking') + '<div class="empty">Booking not found.</div>';
    const t = AC.techById[j.techId], idx = j.status === 'cancelled' ? -1 : stageIdx(j.status), tot = S.jobTotal(j);
    const head = {
      requested: ['Request received', 'Our team is finding the closest technician.'], forwarded: ['Assigning your technician', 'A partner team near you is confirming.'],
      assigned: ['Technician assigned', (t ? t.name : 'Your technician') + ' will confirm shortly.'], accepted: ['Technician confirmed', 'Getting ready to leave.'],
      ontheway: ['Arriving in <span id="eta">' + S.etaMin(j) + '</span> min', (t ? t.name : 'Technician') + ' is on the way.'], arrived: ['Technician has arrived', 'Please let them in.'],
      working: ['Work in progress', 'We will tell you if extra parts are needed.'], completed: ['Job completed', 'Thank you for choosing NEW.'], cancelled: ['Booking cancelled', 'You can book again any time.']
    }[j.status];
    const tlHtml = STAGES.map((st, i) => {
      const e = j.tl.find(x => st[1].includes(x.k)); const cls = i < idx || (j.status === 'completed' && i === 5) ? 'done' : i === idx ? 'now' : '';
      return `<div class="tl-i ${cls}"><div class="tl-dot">${cls === 'done' ? icon('check', 13, 3) : ''}</div><div><div class="tl-t">${st[0]}</div><div class="muted" style="font-size:12.5px">${e ? AC.fmt.time(e.at) + (e.note && i === 0 ? '' : '') : (i === idx ? 'In progress' : 'Pending')}</div></div></div>`;
    }).join('');
    const vend = t && t.vendor ? AC.vendById[t.vendor].name : '';
    const jc = S.chatMsgs('J:' + j.id), jOpen = S.chatOpen(j), jUn = S.chatUnread('cust:' + ME).includes('J:' + j.id);
    const msgBtn = t && (jOpen || jc.length) ? `<button class="btn ${jOpen ? 'btn-p' : 'btn-s'} btn-block" style="margin-top:12px" data-a="jchat" data-v="${j.id}">${icon('chat', 18)}${jOpen ? 'Message ' + esc(t.name.split(' ')[0]) : 'Chat history'}${jUn ? '<span class="pill-n">New</span>' : ''}</button>` : '';
    const techCard = t && j.status !== 'cancelled' ? `<div class="cardx"><div class="techcard"><div class="avatar lg">${AC.fmt.ini(t.name)}</div><div class="grow"><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${vend ? 'Partner: ' + esc(vend) : 'NEW technician'}</div>${t.kyc && t.kyc.status === 'verified' ? `<div class="verif">${icon('shield', 14)}Identity verified by NEW</div>` : ''}<div class="rate" style="font-weight:600;color:var(--ink-3)">${t.jobs} jobs completed</div></div></div>
      ${(j.crew || []).filter(c => c.status === 'accepted').map(c => { const h = AC.techById[c.id]; return `<div class="techcard" style="margin-top:12px"><div class="avatar">${AC.fmt.ini(h.name)}</div><div class="grow"><b>${esc(h.name)}</b><div class="muted" style="font-size:13px">Helper on your job</div></div></div>`; }).join('')}
      ${msgBtn}<div class="actions"><button class="btn btn-s" data-a="toast" data-v="Calling ${esc(t.name)} (opens the phone dialer in the real app)">${icon('phone', 18)}Call</button><button class="btn btn-s" data-a="toast" data-v="Opening WhatsApp chat with ${esc(t.name)}">${icon('chat', 18)}WhatsApp</button><button class="btn btn-s" data-a="chat">${icon('send', 18)}Support</button></div></div>` : '';
    let extra = '';
    if (j.extra.status === 'proposed') {
      const sum = j.extra.items.reduce((a, i) => a + i.price, 0);
      extra = `<div class="cardx" style="border-color:var(--accent);background:var(--accent-l)"><div class="row" style="gap:10px;align-items:flex-start">${icon('alert', 20)}<div class="grow"><b>Extra work needs your approval</b><div style="font-size:13px;color:#7A4B08;margin-top:2px">${esc(t ? t.name : 'The technician')} found an additional issue. Our support team may call you to explain.</div></div></div>
        <div class="sum" style="margin:14px 0">${j.extra.items.map(i => `<div><span>${esc(i.label)}</span><span>${money(i.price)}</span></div>`).join('')}<div class="tot"><span>Additional cost</span><span>${money(sum)}</span></div></div>
        <div class="row"><button class="btn btn-s grow" data-a="extra" data-v="no" data-id="${j.id}">Decline</button><button class="btn btn-p grow" data-a="extra" data-v="yes" data-id="${j.id}">Approve ${money(sum)}</button></div></div>`;
    } else if (j.extra.status === 'approved') extra = `<div class="note ok">${icon('checkc', 18)}<span>Extra work approved: ${money(S.extraTotal(j))}</span></div>`;
    else if (j.extra.status === 'declined') extra = `<div class="note">${icon('info', 18)}<span>Extra work declined. The technician will finish the original job only.</span></div>`;
    const lines = [`<div><span>${esc(j.svcName)} x ${j.units}</span><span>${money(j.price)}</span></div>`];
    if (j.discount) lines.push(`<div class="sv"><span>Discount</span><span>-${money(j.discount)}</span></div>`);
    if (S.extraTotal(j)) lines.push(`<div><span>Extra work</span><span>${money(S.extraTotal(j))}</span></div>`);
    const payBox = `<div class="cardx"><div class="sum">${lines.join('')}<div class="tot"><span>Total</span><span>${money(tot)}</span></div></div>
      <div class="row between" style="margin-top:12px"><span class="muted">${AC.payName(j.pay.method)}</span>${j.pay.status === 'paid' ? '<span class="badge b-ok">Paid</span>' : '<span class="badge b-warn">' + (j.pay.method === 'cod' ? 'Pay the technician' : 'Pay after service') + '</span>'}</div>
      ${j.status === 'completed' && j.pay.status !== 'paid' && j.pay.method !== 'cod' ? `<button class="btn btn-ok btn-lg btn-block" style="margin-top:14px" data-a="paynow" data-id="${j.id}">Pay ${money(tot)}</button>` : ''}</div>`;
    let rate = '';
    const rt = ui.d.rt || {}, pick = (k, label) => `<div class="rt-row"><span>${label}</span><div class="star-in" style="margin:0;gap:2px">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= (rt[k] || 0) ? 'on' : ''}" data-a="star" data-k="${k}" data-v="${n}" aria-label="${label} ${n} star">${icon('star', k === 'overall' ? 32 : 26, 1.6).replace('fill="none"', 'fill="' + (n <= (rt[k] || 0) ? 'currentColor' : 'none') + '"')}</button>`).join('')}</div></div>`;
    if (j.status === 'completed' && !j.rating) {
      rate = `<div class="cardx"><b style="font-size:16px">How was ${esc(t ? t.name.split(' ')[0] : 'the technician')}?</b><div class="muted" style="font-size:13px;margin:2px 0 8px">Your review goes to NEW only. The technician does not see it.</div>${pick('overall', 'Overall')}<hr class="divider" style="margin:6px 0">${pick('work', 'Quality of work')}${pick('behavior', 'Behaviour')}${pick('punctuality', 'Punctuality')}
        <textarea class="textarea" id="f-rev" data-b="rev" placeholder="Anything else you would like us to know? (optional)" style="margin-top:10px">${esc(ui.d.rev || '')}</textarea><button class="btn btn-p btn-block" style="margin-top:10px" data-a="rate" data-id="${j.id}" ${rt.overall ? '' : 'disabled'}>Submit review</button></div>`;
    } else if (j.rating) rate = `<div class="cardx row">${starRow(S.ratingOf(j), 16)}<span class="muted grow">Thanks for your review</span></div>`;
    const R = j.report, fmtD = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const reportCard = R ? `<div class="cardx report"><div class="row between"><b style="font-size:16px">Service report</b><span class="badge b-ok">${R.checks.length} of ${R.total} checks</span></div><div class="muted" style="font-size:13px;margin-top:2px">By ${esc(R.by)} . ${fmtD(R.at)}</div>
      <div class="rchecks">${AC.checklistFor(j.svc).map(x => { const ok = R.checks.includes(x); return `<div class="${ok ? 'ok' : 'no'}">${icon(ok ? 'check' : 'x', 14, 2.6)}<span>${x}</span></div>`; }).join('')}</div>
      ${R.note ? `<div class="note" style="margin-top:12px">${icon('info', 18)}<span>${esc(R.note)}</span></div>` : ''}
      <div class="row" style="gap:8px;margin-top:12px"><span class="pchip">${icon('camera', 14)}${R.before} before</span><span class="pchip">${icon('camera', 14)}${R.after} after</span></div>
      ${R.nextDue ? `<div class="lrow" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">${icon('calendar', 20)}<div class="grow"><b>Next servicing due ${fmtD(R.nextDue)}</b><small>Regular servicing keeps cooling strong and bills low.</small></div></div>` : ''}</div>` : '';
    const resched = S.canReschedule(j) ? `<button class="cardx lrow" data-a="resopen" data-v="${j.id}">${icon('calendar', 20)}<div class="grow"><b>${esc(j.slot)}</b><small>Change the time. Free until the technician sets off.</small></div>${icon('right', 18)}</button>` : '';
    const wNote = j.warrantyOf ? `<div class="note ok">${icon('shield', 18)}<span><b>Warranty claim.</b> Repair labour is free. Any parts are shown to you for approval first.</span></div>` : '';
    const codeCard = ['arrived', 'working'].includes(j.status) ? `<div class="cardx code-card"><div class="row" style="gap:10px;align-items:flex-start">${icon('lock', 20)}<div class="grow"><b>Completion code</b><div class="muted" style="font-size:13px;margin-top:2px">When you are happy with the work, tell this code to the technician. The job closes only after they enter it.</div></div></div><div class="otp-show" aria-label="Completion code ${j.otp.split('').join(' ')}">${j.otp.split('').map(x => `<span>${x}</span>`).join('')}</div></div>` : '';
    const prog = `<div class="prog">${[0, 1, 2, 3, 4, 5].map(i => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>`;
    const searching = !t && S.isActive(j) ? `<div class="searching"><span class="gate" style="padding:0"><span class="ring"></span></span><span class="grow">${j.status === 'forwarded' ? 'A partner is assigning a technician' : 'Finding the closest technician'}<div class="muted" style="font-weight:500;font-size:12.5px">Usually under 10 minutes</div></span></div>` : '';
    const ssearch = null;
    return `${top('Booking ' + j.id, { right: `<button class="icon-btn" data-a="chat" aria-label="Chat with support">${icon('chat', 22)}</button>` })}
    <div class="trackmap" id="trackmap">${searching}</div>
    <div class="statuscard fade"><div class="eyebrow">${esc(j.svcName)} . ${esc(j.slot)}</div><h2 style="margin-top:4px">${head[0]}</h2><div class="eta">${head[1]}</div>${j.status === 'cancelled' ? '' : prog}</div>
    <div class="stack" style="margin-top:14px">${codeCard}${wNote}${reportCard}${techCard}${extra}${resched}
      <div class="cardx"><h3 style="font-size:16px;margin-bottom:14px">Progress</h3><div class="tl">${tlHtml}</div></div>
      ${payBox}${rate}
      <div class="cardx"><div class="lrow">${icon('pin', 20)}<div class="grow"><b>${esc(j.cust.addr)}</b><small>${esc(j.cust.phone)}</small></div></div>${j.note ? `<div class="muted" style="margin-top:10px;font-size:13px">Note: ${esc(j.note)}</div>` : ''}</div>
      ${['requested', 'forwarded', 'assigned'].includes(j.status) ? `<button class="btn btn-g btn-block" style="color:var(--bad)" data-a="cancel" data-id="${j.id}">Cancel booking</button>` : ''}</div>`;
  }

  function Shop() {
    const q = (ui.d.q || '').trim().toLowerCase(), SORT = { popular: (a, b) => b.sold - a.sold, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating };
    const list = S.storeProducts().filter(p => (ui.cat === 'all' || p.cat === ui.cat) && (!q || (p.name + ' ' + p.brand + ' ' + p.tag).toLowerCase().includes(q))).sort(SORT[ui.sort]);
    const cats = [['all', 'All'], ['ac', 'Air conditioners'], ['bag', 'Bags'], ['cos', 'Cosmetics']], sorts = [['popular', 'Popular'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['rating', 'Top rated']];
    const catName = cats.find(x => x[0] === ui.cat)[1], sortName = sorts.find(x => x[0] === ui.sort)[1], nf = (ui.cat !== 'all' ? 1 : 0) + (ui.sort !== 'popular' ? 1 : 0);
    return `<div class="band sm"><div class="top"><h1>Shop</h1>${cartBtn()}</div>
    <div class="shop-bar"><label class="search" style="cursor:text;margin:0;flex:1;width:auto">${icon('search', 18)}<input id="f-q" data-b="q" placeholder="Search ACs, bags, cosmetics" value="${esc(ui.d.q || '')}" autocomplete="off" style="border:0;background:none;outline:none;flex:1;min-width:0;font:inherit">${q ? `<button data-a="qclear" aria-label="Clear search">${icon('x', 16)}</button>` : ''}</label>
    <button class="sq-btn ${ui.cat !== 'all' ? 'on' : ''}" data-a="opencats" aria-label="Categories">${icon('menu', 20)}</button>
    <button class="sq-btn ${ui.sort !== 'popular' ? 'on' : ''}" data-a="opensort" aria-label="Filter and sort">${icon('sliders', 20)}</button></div></div>
    ${nf ? `<div class="hscroll" style="padding-top:12px;padding-bottom:2px">${ui.cat !== 'all' ? `<button class="chip sm on" data-a="shopcat" data-v="all">${catName} ${icon('x', 12)}</button>` : ''}${ui.sort !== 'popular' ? `<button class="chip sm on" data-a="sort" data-v="popular">${sortName} ${icon('x', 12)}</button>` : ''}</div>` : ''}
    ${ui.cat === 'ac' ? `<div class="pad" style="margin-bottom:14px"><div class="note acc">${icon('gift', 18)}<span>Buy an AC and get 20% off installation plus a 1 year repair warranty.</span></div></div>` : ''}
    <div class="muted" style="padding:0 20px 10px;font-size:13px">${list.length} product${list.length === 1 ? '' : 's'}</div>
    ${list.length ? `<div class="pgrid">${list.map(pcard).join('')}</div>` : `<div class="empty"><h3>No matches</h3><span>Try a different word or clear the search.</span><button class="btn btn-p" data-a="qclear">Clear search</button></div>`}`;
  }

  function Prod(id) {
    const p = AC.catById[id], d = ui.pdraft, off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0, isAC = p.cat === 'ac', ins = Math.round(AC.INSTALL_FEE * (1 - AC.config.INSTALL_DISCOUNT)), n = cartCalc().n;
    return `<div class="phero" style="background:${Art.tints[p.tint].bg}">${art(p)}<button class="back" data-a="back" aria-label="Back">${icon('left', 22)}</button><button class="cartb" data-a="cart" aria-label="Cart">${icon('cart', 22)}${ui.cart.length ? `<span class="badge-n">${ui.cart.reduce((a, l) => a + l.qty, 0)}</span>` : ''}</button></div>
    <div class="pbody"><div class="row between"><span class="eyebrow">${esc(p.brand)}</span><span class="rate">${icon('star', 14)} ${p.rating} <span class="muted" style="font-weight:500">. ${p.sold} sold</span></span></div><h1>${esc(p.name)}</h1><div class="muted" style="font-size:13.5px;margin-top:-6px">Sold by <b style="color:var(--ink-2)">${esc(S.sellerName(p))}</b></div>
      <div class="price-big"><b>${money(p.price)}</b>${p.was ? `<s>${money(p.was)}</s><span class="save">Save ${money(p.was - p.price)}</span>` : ''}</div>
      ${!S.canBuy(p) ? `<div class="stock" style="color:var(--ink-3)">${icon('alert', 14)} Unavailable right now. The seller has marked it out of stock.</div>` : p.stock < 10 ? `<div class="stock">${icon('alert', 14)} Only ${p.stock} left</div>` : `<div class="stock ok">${icon('check', 14)} In stock</div>`}
      <label class="lab">${isAC ? 'Capacity' : 'Option'}</label><div class="row wrap" style="gap:8px">${p.variants.map(v => `<button class="chip ${d.variant === v ? 'on' : ''}" data-a="pvar" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>
      <div class="row between" style="margin-top:18px"><b>Quantity</b><div class="step" role="group" aria-label="Quantity"><button data-a="pqty" data-v="-1" aria-label="Less">${icon('minus', 16)}</button><b>${d.qty}</b><button data-a="pqty" data-v="1" aria-label="More">${icon('plus', 16)}</button></div></div>
      ${isAC ? `<label class="lab">Add installation</label><button class="addon ${d.install ? 'on' : ''}" data-a="pinst"><span class="ck">${d.install ? icon('check', 14, 3) : ''}</span><span class="grow"><b>Professional installation</b><div class="muted" style="font-size:13px"><s>${money(AC.INSTALL_FEE)}</s> <b style="color:var(--accent-d)">${money(ins)}</b> with AC purchase</div></span>${icon('wrench', 20)}</button>` : ''}
      <div class="bullets cardx" style="margin-top:20px">${isAC ? `<div>${icon('shield', 20)}<span><b>1 year warranty</b><br><span class="muted">Free repair labour after installation by NEW.</span></span></div>` : ''}
        <div>${icon('truck', 20)}<span><b>Delivery by courier partner</b><br><span class="muted">${isAC ? 'Safe handling for large items. 3-5 days.' : 'Pathao or RedX. 2-4 days.'} Track every step in the app.</span></span></div>
        <div>${icon('wallet', 20)}<span><b>Cash, bKash, Nagad or card</b><br><span class="muted">Choose how to pay at checkout.</span></span></div></div></div>`;
  }

  function promoBlock() {
    const c = cartCalc(), open = ui.promoOpen;
    const applied = c.code ? `<div class="promo-on">${icon('tag', 18)}<div class="grow"><b>${c.code} applied</b><div class="muted" style="font-size:13px">You save ${money(c.disc)}</div></div><button class="btn btn-g btn-sm" data-a="promorm">Remove</button></div>` : '';
    const entry = c.code ? '' : `<div class="cardx promo-c"><button class="lrow" data-a="promotoggle" aria-expanded="${open}">${icon('tag', 18)}<b class="grow">Have a promo code?</b>${icon(open ? 'up' : 'down', 18)}</button>${open ? `<div class="row" style="margin-top:12px"><input class="input" id="f-promo" data-b="promoIn" placeholder="Enter code" autocomplete="off" value="${esc(ui.d.promoIn || '')}" style="text-transform:uppercase"><button class="btn btn-p" data-a="promoapply">Apply</button></div>` : ''}${ui.promoErr ? `<div class="err">${esc(ui.promoErr)}</div>` : ''}</div>`;
    const offers = c.avail.length ? `<div class="cardx promo-c"><div class="mini" style="margin-bottom:10px">Offers for you</div><div class="col" style="gap:8px">${c.avail.map(p => `<button class="offer-row" data-a="promopick" data-v="${p.code}"><span class="code2">${p.code}</span><span class="grow">${esc(p.desc)}</span><b>Apply</b></button>`).join('')}</div></div>` : '';
    return `<div class="col" style="gap:12px">${applied}${entry}${offers}</div>`;
  }
  const lineRow = (l, i, big) => { const p = AC.catById[l.pid]; return `<div class="cline"><div class="pimg">${art(p)}</div><div class="col" style="gap:6px;min-width:0"><div class="row between" style="align-items:flex-start;gap:8px"><h3>${esc(p.name)}</h3><button class="rm" data-a="crm" data-i="${i}" aria-label="Remove ${esc(p.name)}">${icon('trash', 18)}</button></div><span class="muted" style="font-size:12.5px">${esc(l.variant)} . ${money(p.price)} each</span><div class="row between"><b>${money(p.price * l.qty)}</b><div class="step" role="group" aria-label="Quantity"><button data-a="cqty" data-i="${i}" data-v="-1" aria-label="Less">${icon('minus', 14)}</button><b>${l.qty}</b><button data-a="cqty" data-i="${i}" data-v="1" aria-label="More">${icon('plus', 14)}</button></div></div></div>
    ${p.cat === 'ac' ? `<button class="addon sub ${l.install ? 'on' : ''}" style="padding:10px 12px" data-a="cinst" data-i="${i}"><span class="ck">${l.install ? icon('check', 14, 3) : ''}</span><span class="grow"><b style="font-size:13px">Add installation</b><div class="muted" style="font-size:12.5px">${money(Math.round(AC.INSTALL_FEE * (1 - AC.config.INSTALL_DISCOUNT)))} each, 20% off</div></span></button>` : ''}</div>`; };
  const summary = c => `<div class="cardx sum"><div><span>Subtotal (${c.n} item${c.n > 1 ? 's' : ''})</span><span>${money(c.sub)}</span></div>${c.inst ? `<div><span>Installation</span><span>${money(c.inst)}</span></div>` : ''}${c.disc ? `<div class="sv"><span>Promo ${c.code}</span><span>-${money(c.disc)}</span></div>` : ''}<div><span>Delivery</span><span>${c.delivery ? money(c.delivery) : 'Free'}</span></div><div class="tot"><span>Total</span><span>${money(c.total)}</span></div></div>`;

  function Cart() {
    if (!ui.cart.length) return top('Cart') + `<div class="empty"><div class="ill">${Art.draw('tote', 1)}</div><h3>Your cart is empty</h3><span>Browse ACs, bags and local cosmetics.</span><button class="btn btn-p" data-a="shopcat" data-v="all">Start shopping</button></div>`;
    const c = cartCalc();
    return `${top('Cart')}<div class="stack">${c.toFree ? `<div class="free-bar"><span>Add ${money(c.toFree)} more for free delivery</span><i style="--w:${Math.min(100, Math.round(c.sub / 30))}%"></i></div>` : ''}${ui.cart.map((l, i) => lineRow(l, i)).join('')}${promoBlock()}${summary(c)}</div>`;
  }

  function Checkout() {
    const L = lines(), c = cartCalc(), d = ui.d;
    if (!L.length) return top('Checkout') + `<div class="empty"><h3>Nothing to check out</h3><button class="btn btn-p" data-a="shopcat" data-v="all">Back to the shop</button></div>`;
    return `${top('Checkout')}<div class="pad">
      <label class="lab" style="margin-top:4px">${ui.buyMode ? 'Buying now' : 'Your items'}</label><div class="col" style="gap:10px">${L.map((l, i) => lineRow(l, i)).join('')}</div>
      <label class="lab">Delivery address</label><div class="field"><input class="input" id="f-caddr" data-b="caddr" value="${esc(d.caddr != null ? d.caddr : me.addr)}"></div>
      <div class="field" style="margin-top:10px"><label for="f-cphone">Phone</label><input class="input" id="f-cphone" data-b="cphone" value="${esc(d.cphone != null ? d.cphone : me.phone)}" inputmode="tel"></div>
      <div class="note" style="margin-top:12px">${icon('truck', 18)}<span>Delivered by a courier partner (Pathao or RedX). You can follow each step in Orders.</span></div>
      <label class="lab">Payment</label><div class="col" style="gap:8px">${AC.payMethods.map(m => `<button class="opt ${(d.pm || 'cod') === m.id ? 'on' : ''}" data-a="pm" data-v="${m.id}"><span class="rd"></span><span class="grow"><b>${m.name}</b><small>${m.note}</small></span>${AC.payMark(m.id)}</button>`).join('')}</div>
      <div style="margin-top:18px">${promoBlock()}</div><div style="margin-top:12px">${summary(c)}</div></div>`;
  }

  function OrderDone(id) {
    const o = S.get().orders.find(x => x.id === id);
    return `<div class="empty" style="padding-top:90px"><div class="okc">${icon('check', 36, 2.5)}</div><h3 style="font-size:24px">Order placed</h3><span>Order ${id} is confirmed. We will pack it shortly.${o && o.jobId ? ' Your installation booking is created too.' : ''}</span>
      <div class="col" style="width:100%;margin-top:14px"><button class="btn btn-p btn-lg btn-block" data-a="order" data-v="${id}" data-replace="1">Track order</button><button class="btn btn-g btn-block" data-a="tab" data-v="home">Continue shopping</button></div></div>`;
  }

  function courierCard(o) {
    const ev = o.tl.filter(e => e.k === 'courier'), link = AC.courierLinks[o.courier] ? AC.courierLinks[o.courier](o.tracking) : '#';
    return `<div class="cardx"><div class="row"><span class="svc-ic">${icon('truck', 20)}</span><div class="grow"><b>${esc(o.courier)}</b><div class="muted" style="font-size:13px">Tracking <span class="mono">${esc(o.tracking)}</span></div></div>${bd(o.courierStatus || 'Handed over', 'b-brand')}</div>
      ${ev.length ? `<div class="tl" style="margin-top:14px">${ev.slice().reverse().map((e, i) => `<div class="tl-i ${i === 0 ? 'now' : 'done'}"><div class="tl-dot">${i === 0 ? '' : icon('check', 13, 3)}</div><div><div class="tl-t">${esc(e.label)}</div><div class="muted" style="font-size:12.5px">${AC.fmt.time(e.at)}</div></div></div>`).join('')}</div>` : ''}
      <a class="btn btn-s btn-block" style="margin-top:14px" href="${link}" target="_blank" rel="noopener">${icon('arrowur', 16)}Open ${esc(o.courier)} tracking</a><div class="muted" style="font-size:12.5px;margin-top:10px">Updates come from NEW and the courier. You can also paste the tracking id on the courier's own site.</div></div>`;
  }
  const bd = (t, c) => `<span class="badge ${c}">${t}</span>`;
  const OSTEPS = [['placed', 'Order placed'], ['packed', 'Packed'], ['shipped', 'Handed to courier'], ['delivered', 'Delivered']];
  function Order(id) {
    const o = S.get().orders.find(x => x.id === id); if (!o) return top('Order');
    const idx = OSTEPS.findIndex(s => s[0] === o.status);
    return `${top('Order ' + o.id)}<div class="stack">
      <div class="cardx"><div class="row between"><b>${o.status === 'cancelled' ? 'Cancelled' : idx === 3 ? 'Delivered' : OSTEPS[Math.max(0, idx)][1]}</b><span class="badge ${o.status === 'cancelled' ? 'b-bad' : idx === 3 ? 'b-ok' : 'b-brand'}">${o.status[0].toUpperCase() + o.status.slice(1)}</span></div>
        <div class="tl" style="margin-top:16px">${OSTEPS.map((st, i) => { const e = o.tl.find(x => x.k === st[0]); const cls = i < idx || (i === idx && o.status === 'delivered') ? 'done' : i === idx ? 'now' : ''; return `<div class="tl-i ${cls}"><div class="tl-dot">${cls === 'done' ? icon('check', 13, 3) : ''}</div><div><div class="tl-t">${st[1]}</div><div class="muted" style="font-size:12.5px">${e ? AC.fmt.time(e.at) : 'Pending'}</div></div></div>`; }).join('')}</div></div>
      <div class="cardx col" style="gap:14px">${o.items.map(i => { const p = AC.catById[i.pid]; return `<div class="row"><div class="pimg" style="width:52px;border-radius:10px;flex:none">${art(p)}</div><div class="grow"><b style="font-size:13.5px">${esc(p.name)}</b><div class="muted" style="font-size:12.5px">Qty ${i.qty}</div></div><b>${money(i.price * i.qty)}</b></div>`; }).join('')}
        <hr class="divider"><div class="sum"><div><span>Subtotal</span><span>${money(o.subtotal)}</span></div>${o.inst ? `<div><span>Installation</span><span>${money(o.inst)}</span></div>` : ''}${o.discount ? `<div class="sv"><span>Discount</span><span>-${money(o.discount)}</span></div>` : ''}<div><span>Delivery</span><span>${money(o.delivery)}</span></div><div class="tot"><span>Total</span><span>${money(S.ordTotal(o))}</span></div></div>
        <div class="row between"><span class="muted">${AC.payName(o.pay.method)}</span><span class="badge ${o.pay.status === 'paid' ? 'b-ok' : 'b-warn'}">${o.pay.status === 'paid' ? 'Paid' : 'Pay on delivery'}</span></div></div>
      ${o.courier ? courierCard(o) : ''}
      ${o.jobId ? `<button class="cardx lrow" data-a="track" data-v="${o.jobId}"><span class="svc-ic">${icon('wrench', 20)}</span><span class="grow"><b>Installation booking ${o.jobId}</b><small>Scheduled after delivery</small></span>${icon('right', 18)}</button><div class="note ok">${icon('shield', 18)}<span>1 year free repair warranty starts after installation.</span></div>` : ''}</div>`;
  }

  function Orders() {
    const jobs = myJobs(), ords = myOrders(), UCx = S.unread('cust:' + ME), UCj = new Set(UCx.jobs), UCo = new Set(UCx.orders);
    const jl = jobs.length ? jobs.map(j => { const t = AC.techById[j.techId]; return `<button class="cardx lrow ${UCj.has(j.id) ? 'unread' : ''}" data-a="track" data-v="${j.id}"><span class="svc-ic">${icon((AC.svcById[j.svc] || {}).icon || 'wrench', 20)}</span><span class="grow"><b>${esc(j.svcName)}</b><small>${j.id} . ${t ? esc(t.name) : esc(j.slot)}</small></span><span class="col" style="gap:4px;align-items:flex-end"><span class="badge ${S.META[j.status].cls}">${S.META[j.status].cust}</span><b style="font-size:13px">${money(S.jobTotal(j))}</b></span></button>`; }).join('') : `<div class="empty"><h3>No bookings yet</h3><button class="btn btn-p" data-a="tab" data-v="services">Book a service</button></div>`;
    const ol = ords.length ? ords.map(o => `<button class="cardx lrow ${UCo.has(o.id) ? 'unread' : ''}" data-a="order" data-v="${o.id}"><span class="row" style="gap:0;flex:none">${o.items.slice(0, 2).map((i, k) => `<span class="pimg" style="width:44px;height:44px;border-radius:12px;border:2px solid #fff;margin-left:${k ? '-14px' : '0'};aspect-ratio:1">${art(AC.catById[i.pid])}</span>`).join('')}</span><span class="grow"><b>${o.id}</b><small>${o.items.reduce((s, i) => s + i.qty, 0)} items . ${o.courier ? esc(o.courier) : 'Preparing'}</small></span><span class="col" style="gap:4px;align-items:flex-end"><span class="badge ${o.status === 'delivered' ? 'b-ok' : 'b-brand'}">${o.status[0].toUpperCase() + o.status.slice(1)}</span><b style="font-size:13px">${money(S.ordTotal(o))}</b></span></button>`).join('') : `<div class="empty"><div class="ill">${Art.draw('pack', 2)}</div><h3>No orders yet</h3><span>Your first purchase gets 15% off.</span><button class="btn btn-p" data-a="shopcat" data-v="all">Browse the shop</button></div>`;
    return `${top('Orders', { back: false })}<div class="seg"><button class="${ui.ot === 'book' ? 'on' : ''}" data-a="ot" data-v="book">Bookings</button><button class="${ui.ot === 'shop' ? 'on' : ''}" data-a="ot" data-v="shop">Shop orders</button></div><div class="stack">${ui.ot === 'book' ? jl : ol}</div>`;
  }

  function Account() {
    const W = S.warranties(ME);
    return `${top('Account', { back: false })}<div class="stack">
      <div class="cardx row" style="gap:14px"><div class="avatar lg">${AC.fmt.ini(me.name)}</div><div class="grow"><b style="font-size:17px">${me.name}</b><div class="muted">${me.phone}</div></div></div>
      <div class="cardx"><div class="row between" style="margin-bottom:10px"><b>Appearance</b><span class="muted" style="font-size:13px">Light, dark or follow the phone</span></div>${AC.theme.seg()}</div>
      <div class="cardx lrow">${icon('pin', 20)}<div class="grow"><b>Saved address</b><small>${me.addr}</small></div></div>
      <div class="cardx"><div class="row between"><b>Warranty</b>${W.length ? `<span class="badge b-ok">${W.filter(x => x.active).length} active</span>` : ''}</div>${W.length ? W.map(x => `<div class="wcard ${x.active ? '' : 'off'}"><div class="row" style="align-items:flex-start">${icon('shield', 20)}<div class="grow"><b>${esc(x.title)}</b><div class="muted" style="font-size:12.5px">${x.id} . ${x.active ? 'valid until ' + new Date(x.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'expired'}${x.claims ? ' . ' + x.claims + ' claim' + (x.claims > 1 ? 's' : '') : ''}</div></div><b class="wdays">${x.active ? x.daysLeft + ' d' : ''}</b></div><div class="wbar"><i style="width:${Math.round(100 * x.daysLeft / AC.config.WARRANTY_DAYS)}%"></i></div>${x.active ? `<button class="btn btn-s btn-sm btn-block" style="margin-top:10px" data-a="wclaim" data-v="${x.id}">Claim free repair</button>` : ''}</div>`).join('') : `<div class="muted" style="font-size:13px;margin-top:6px">Buy an AC with installation to get 1 year free repair.</div>`}</div>
      <div class="cardx"><b>Offers for you</b><div class="col" style="gap:10px;margin-top:12px">${AC.promos.filter(p => p.status === 'Active').map(p => `<div class="row"><span class="svc-ic" style="width:36px;height:36px;background:var(--accent-l);color:var(--accent-d)">${icon('tag', 18)}</span><div class="grow"><b style="font-size:13.5px">${p.title}</b><div class="muted" style="font-size:12.5px">${p.desc}</div></div></div>`).join('')}</div></div>
      <button class="cardx lrow" data-a="history">${icon('clock', 20)}<div class="grow"><b>History</b><small>Everything you did, saved on this phone</small></div>${icon('right', 18)}</button>
      <button class="cardx lrow" data-a="chat">${icon('chat', 20)}<div class="grow"><b>Chat with support</b><small>Replies from our team in minutes</small></div>${icon('right', 18)}</button>
      <div class="proto"><div class="eyebrow">Prototype tools</div><div class="muted" style="font-size:13px">Plays the admin, vendor and technician roles on your latest booking so you can review this app alone.</div>
        <button class="btn btn-s" data-a="auto" ${activeJob() ? '' : 'disabled'}>Run autopilot on active booking</button><button class="btn btn-g" data-a="reset">Reset demo data</button></div></div>`;
  }

  function Chat() {
    const ms = S.threadMsgs(ME).sort((a, b) => a.at - b.at);
    return { body: `${top('NEW Support', { right: '<span class="badge b-ok">Online</span>' })}<div class="chat">${ms.map(m => `<div class="bub ${m.from === 'customer' ? 'me' : 'them'}">${esc(m.text)}<small>${AC.fmt.time(m.at)}</small></div>`).join('')}</div>`,
      cta: `<div class="qr" style="background:var(--surface);padding-top:10px">${['Where is my technician?', 'Please call me', 'Change my time slot'].map(q => `<button class="chip" data-a="quickmsg" data-v="${q}">${q}</button>`).join('')}</div><div class="chat-in"><input class="input" id="f-chat" data-b="chat" placeholder="Write a message" value="${esc(ui.d.chat || '')}" autocomplete="off"><button class="send" data-a="send" aria-label="Send">${icon('send', 20)}</button></div>`, flush: true };
  }

  function JChat(id) {
    const j = S.job(id), t = AC.techById[j.techId], first = t ? t.name.split(' ')[0] : 'Technician', open = S.chatOpen(j), ms = S.chatMsgs('J:' + id);
    const QUICK = ['I am home', 'The gate is open', 'Please call me', 'Which floor are you on?'];
    return { body: `${top('Chat with ' + esc(first), { right: `<span class="badge ${open ? 'b-ok' : 'b-n'}">${open ? 'On the job' : 'Closed'}</span>` })}
      ${open ? '' : `<div class="chat-closed note">${icon('info', 18)}<span>Chat closes when the job ends. You can still read it.</span></div>`}
      ${ms.length ? AC.chatUI.bubbles(ms, ['customer'], { tech: t ? t.name : 'Technician' }) : `<div class="empty"><h3>No messages yet</h3><span>Say hello to ${esc(first)}. Messages stay between you and your technician while the job is on.</span></div>`}`,
      cta: open ? `<div class="qr" style="background:var(--surface);padding-top:10px">${QUICK.map(q => `<button class="chip" data-a="jquick" data-v="${q}">${q}</button>`).join('')}</div><div class="chat-in"><input class="input" id="f-jchat" data-b="jchat" placeholder="Message ${esc(first)}" value="${esc(ui.d.jchat || '')}" autocomplete="off"><button class="send" data-a="jsend" aria-label="Send">${icon('send', 20)}</button></div>` : '' };
  }

  function Sheet() {
    const sh = ui.sheet; if (!sh) return '';
    if (sh.t === 'otp') {
      if (sh.ok) return `<div class="scrim"></div><div class="sheet"><div class="grab"></div><div class="gate"><div class="okc">${icon('check', 36, 2.5)}</div><h3 style="font-size:20px">Phone verified</h3><span class="muted">${esc(sh.phone)}</span></div></div>`;
      return `<div class="scrim" data-a="otpclose"></div><div class="sheet"><div class="grab"></div><div class="gate" style="gap:10px"><span class="svc-ic" style="width:56px;height:56px;border-radius:16px">${icon('phone', 26)}</span><h3 style="font-size:20px">Verify your phone</h3><span class="muted">Enter the 4-digit code we sent by SMS to <b>${esc(sh.phone)}</b>. This keeps fake orders out.</span>
        <input class="input otp-in" id="f-otp" data-b="otp" inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="0000" value="${esc(ui.d.otp || '')}">${sh.err ? `<span style="color:var(--bad);font-weight:600;font-size:13px">That code is not correct. Try again.</span>` : ''}
        <button class="btn btn-p btn-lg btn-block" data-a="otpverify">Verify and continue</button><div class="row" style="gap:4px"><button class="btn btn-g btn-sm" data-a="otpresend">Resend code</button><button class="btn btn-g btn-sm" data-a="otpclose">Change number</button></div><span class="faint" style="font-size:12px">Demo code: ${DEMO_OTP}. No SMS is sent in this prototype.</span></div></div>`;
    }
    if (sh.t === 'cats' || sh.t === 'sort') {
      const cc = { all: S.storeProducts().length, ac: 0, bag: 0, cos: 0 }; S.storeProducts().forEach(p => cc[p.cat]++);
      const rows = sh.t === 'cats' ? [['all', 'All products'], ['ac', 'Air conditioners'], ['bag', 'Bags'], ['cos', 'Cosmetics']].map(x => `<button class="sheet-opt ${ui.cat === x[0] ? 'on' : ''}" data-a="shopcat" data-v="${x[0]}"><span>${x[1]}</span><small>${cc[x[0]]}</small>${ui.cat === x[0] ? icon('check', 18, 2.5) : ''}</button>`).join('')
        : [['popular', 'Popular'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['rating', 'Top rated']].map(x => `<button class="sheet-opt ${ui.sort === x[0] ? 'on' : ''}" data-a="sort" data-v="${x[0]}"><span>${x[1]}</span>${ui.sort === x[0] ? icon('check', 18, 2.5) : ''}</button>`).join('');
      return `<div class="scrim" data-a="closesheet"></div><div class="sheet"><div class="grab"></div><h3 style="font-size:18px;margin-bottom:6px">${sh.t === 'cats' ? 'Categories' : 'Sort by'}</h3>${rows}</div>`;
    }
    if (sh.t === 'resched') {
      const j = S.job(sh.id);
      return `<div class="scrim" data-a="closesheet"></div><div class="sheet"><div class="grab"></div><h3 style="font-size:18px">Change the time</h3><div class="muted" style="font-size:13px;margin:2px 0 12px">Now: ${esc(j.slot)}. Your technician and NEW are told at once.</div>
        <div class="optgrid">${AC.slots.concat(['Day after tomorrow, 10 AM-12 PM', 'Day after tomorrow, 4-6 PM']).map(x => `<button class="slot ${sh.slot === x ? 'on' : ''}" ${x === j.slot ? 'disabled' : ''} data-a="respick" data-v="${x}">${x}</button>`).join('')}</div>
        <button class="btn btn-p btn-lg btn-block" style="margin-top:16px" data-a="resdo" ${sh.slot ? '' : 'disabled'}>Confirm new time</button></div>`;
    }
    if (sh.t === 'wclaim') {
      const w = S.warranties(ME).find(x => x.id === sh.id);
      return `<div class="scrim" data-a="closesheet"></div><div class="sheet"><div class="grab"></div><h3 style="font-size:18px">Claim free repair</h3><div class="muted" style="font-size:13px;margin:2px 0 12px">${esc(w.title)} . warranty ${w.id} . ${w.daysLeft} days left. Labour is free; parts need your approval.</div>
        <label class="lab" style="margin-top:0">What is wrong?</label><textarea class="textarea" id="f-wnote" data-b="wnote" rows="2" placeholder="For example: not cooling, water leaking, noise">${esc(ui.d.wnote || '')}</textarea>
        <label class="lab">When should we come?</label><div class="optgrid">${AC.slots.map(x => `<button class="slot ${sh.slot === x ? 'on' : ''}" data-a="wslot" data-v="${x}">${x}</button>`).join('')}</div>
        <button class="btn btn-ok btn-lg btn-block" style="margin-top:16px" data-a="wdo" ${(ui.d.wnote || '').trim().length >= 3 ? '' : 'disabled'}>Book free repair</button></div>`;
    }
    if (sh.t === 'gate') {
      const m = AC.payMethods.find(x => x.id === sh.m), col = { bkash: 'var(--pay-bkash)', nagad: 'var(--pay-nagad)', card: 'var(--brand)' }[sh.m] || 'var(--brand)';
      return `<div class="scrim"></div><div class="sheet"><div class="grab"></div><div class="gate">${sh.stage === 'ok' ? `<div class="okc">${icon('check', 36, 2.5)}</div><h3 style="font-size:20px">Payment received</h3><span class="muted">${money(sh.amount)} paid with ${m.name}</span>` : `<div class="logo gate-mark" style="background:${sh.m === 'bkash' || sh.m === 'nagad' ? 'transparent' : col}">${sh.m === 'card' ? icon('card', 30) : AC.payMark(sh.m)}</div><h3 style="font-size:20px">${sh.m === 'card' ? 'Secure checkout (SSLCommerz)' : 'Confirming with ' + m.name}</h3><span class="muted">${money(sh.amount)}. Do not close this screen.</span><span class="ring"></span><span class="faint" style="font-size:12px">Demo gateway. No real payment is made.</span>`}</div></div>`;
    }
    return '';
  }

  /* ---------- Render ---------- */
  const TABS = [['home', 'Home', 'home'], ['services', 'Services', 'wrench'], ['shop', 'Shop', 'store'], ['orders', 'Orders', 'receipt'], ['account', 'Account', 'user']];
  function render() {
    const af = document.activeElement, afId = af && af.id, afSel = af && af.selectionStart;
    const t = ui.stack[ui.stack.length - 1], key = t ? t.s + (t.p && t.p.id || '') : ui.tab;
    const old = document.getElementById('view'); if (old) ui.scroll[ui.key] = old.scrollTop;
    let body = '', cta = '', tabs = !t, flush = false;
    if (t) {
      if (t.s === 'book') { body = Book(); cta = `<div class="cta-bar"><div class="grow"><div class="muted" style="font-size:12px">Estimated total</div><b style="font-size:18px">${money(AC.svcById[ui.book.svc].price * ui.book.units - 100)}</b></div><button class="btn btn-ok btn-lg" style="flex:1.4" data-a="confirm">Confirm booking</button></div>`; }
      else if (t.s === 'track') body = Track(t.p.id);
      else if (t.s === 'prod') { body = Prod(t.p.id); const p = AC.catById[t.p.id], d = ui.pdraft, unit = p.price + (d.install && p.cat === 'ac' ? Math.round(AC.INSTALL_FEE * (1 - AC.config.INSTALL_DISCOUNT)) : 0); cta = !S.canBuy(p) ? `<div class="cta-bar"><button class="btn btn-s btn-lg grow" disabled>Unavailable</button></div>` : `<div class="cta-bar"><button class="btn btn-s btn-lg grow" data-a="addcart">${ui.added ? icon('check', 18, 2.5) + 'Added' : icon('cart', 18) + 'Add to cart'}</button><button class="btn btn-p btn-lg" style="flex:1.25" data-a="buynow2">Buy now . ${money(unit * d.qty)}</button></div>`; }
      else if (t.s === 'cart') { body = Cart(); if (ui.cart.length) cta = `<div class="cta-bar"><div class="grow"><div class="muted" style="font-size:12px">Total</div><b style="font-size:18px">${money(cartCalc().total)}</b></div><button class="btn btn-p btn-lg" style="flex:1.4" data-a="checkout">Checkout</button></div>`; }
      else if (t.s === 'checkout') { body = Checkout(); cta = `<div class="cta-bar"><div class="grow"><div class="muted" style="font-size:12px">Total</div><b style="font-size:18px">${money(cartCalc().total)}</b></div><button class="btn btn-ok btn-lg" style="flex:1.4" data-a="place">Place order</button></div>`; }
      else if (t.s === 'done') { body = OrderDone(t.p.id); }
      else if (t.s === 'order') body = Order(t.p.id);
      else if (t.s === 'history') body = top('History') + `<div class="pad">${AC.history.html('cust:' + ME)}</div>`;
      else if (t.s === 'notifs') body = top('Notifications') + `<div class="pad"><div class="cardx" style="padding:4px 16px">${AC.notifUI.html('cust:' + ME, 'track', 'order')}</div></div>`;
      else if (t.s === 'chat') { const c = Chat(); body = c.body; cta = c.cta; flush = true; }
      else if (t.s === 'jchat') { const c = JChat(t.p.id); body = c.body; cta = c.cta; flush = true; if (S.chatUnread('cust:' + ME).includes('J:' + t.p.id)) setTimeout(() => S.act.markSeen('cust:' + ME, 'c:J:' + t.p.id), 0); }
    } else body = { home: Home, services: Services, shop: Shop, orders: Orders, account: Account }[ui.tab]();
    const n = cartCalc().n, UC = S.unread('cust:' + ME), ordDot = UC.jobs.length + UC.orders.length;
    const wb = ['track', 'chat'].includes(t && t.s) ? ' w' : (!t ? ' dk' : '');
    const snack = ui.undo ? `<div class="snack" role="status"><span>Removed ${esc(AC.catById[ui.undo.line.pid].name)}</span><button data-a="undo">Undo</button></div>` : '';
    $app.innerHTML = `<div class="statusbar${wb}"><span>${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' PM', '').replace(' AM', '')}</span><span class="sb-r"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/><rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5"/></svg></span></div><div class="view" id="view">${body}</div>${cta}${tabs ? `<nav class="tabbar">${TABS.map(x => `<button class="tab ${ui.tab === x[0] ? 'on' : ''}" data-a="tab" data-v="${x[0]}">${icon(x[2], 22, ui.tab === x[0] ? 2.1 : 1.7)}${x[1]}${x[0] === 'orders' && ordDot ? `<span class="dot">${ordDot}</span>` : ''}</button>`).join('')}</nav>` : ''}${snack}${Sheet()}`;
    AC.ui.nav($app, key, ui.stack.length);
    const v = document.getElementById('view');
    if (key === ui.key && ui.scroll[key] != null) v.scrollTop = ui.scroll[key]; else v.scrollTop = key.startsWith('chat') ? 99999 : 0;
    if (t && (t.s === 'chat' || t.s === 'jchat')) v.scrollTop = 99999;
    ui.key = key;
    if (afId) { const e = document.getElementById(afId); if (e) { e.focus(); try { e.setSelectionRange(afSel, afSel); } catch (x) { } } }
    if (ui.sheet && ui.sheet.t === 'otp' && !ui.sheet.ok) { const o = document.getElementById('f-otp'); if (o && document.activeElement !== o) o.focus(); }
    mountMap(t);
  }

  /* ---------- Live map ---------- */
  function mountMap(t) {
    ui.map = null; const host = document.getElementById('trackmap'); if (!host || !t || t.s !== 'track') return;
    const j = S.job(t.p.id); if (!j) return; ui.map = { api: CityMap.mount(host), id: j.id };
    const tech = AC.techById[j.techId]; ui.map.api.fit(tech ? [j.cust, tech] : [j.cust], tech ? 100 : 150); drawMap();
  }
  function drawMap() {
    if (!ui.map) return; const j = S.job(ui.map.id); if (!j) return; const now = Date.now(), tech = AC.techById[j.techId];
    const pins = [{ key: 'c', kind: 'cust', x: j.cust.x, y: j.cust.y, label: 'You' }];
    if (tech) { const p = S.techPos(j, now); pins.push({ key: 't', kind: 'tech', x: p.x, y: p.y, label: tech.name.split(' ')[0], pulse: j.status === 'ontheway' }); }
    ui.map.api.setPins(pins);
    ui.map.api.setRoutes(tech && ['assigned', 'accepted', 'ontheway'].includes(j.status) ? [{ key: 'r', pts: S.tripPoints(j), p: S.tripProgress(j, now) }] : []);
    const e = document.getElementById('eta'); if (e) e.textContent = S.etaMin(j);
  }
  setInterval(drawMap, 450);

  /* ---------- Actions ---------- */
  const push = (s, p) => { ui.stack.push({ s, p }); render(); };
  const A = {
    tab(el) { ui.tab = el.dataset.v; ui.stack = []; render(); },
    back() { const t = ui.stack[ui.stack.length - 1]; ui.stack.pop(); if (t && t.s === 'checkout') ui.buyMode = false; ui.promoErr = ''; render(); if (t && t.s === 'notifs') S.act.markNotifs('cust:' + ME); },
    notifs() { push('notifs'); }, history() { push('history'); }, hf(el) { AC.history.filter = el.dataset.v; render(); }, hclear() { AC.history.clear('cust:' + ME); render(); },
    toast(el) { toast(el.dataset.v, 'info'); },
    shopcat(el) { ui.cat = el.dataset.v; ui.tab = 'shop'; ui.stack = []; ui.sheet = null; render(); }, opencats() { ui.sheet = { t: 'cats' }; render(); }, opensort() { ui.sheet = { t: 'sort' }; render(); }, closesheet() { ui.sheet = null; render(); },
    prod(el) { const p = AC.catById[el.dataset.v]; ui.pdraft = { variant: p.variants[0], qty: 1, install: false }; push('prod', { id: p.id }); },
    pvar(el) { ui.pdraft.variant = el.dataset.v; render(); },
    pqty(el) { ui.pdraft.qty = Math.max(1, ui.pdraft.qty + +el.dataset.v); render(); },
    pinst() { ui.pdraft.install = !ui.pdraft.install; render(); },
    quick(el) { const p = AC.catById[el.dataset.v]; if (!S.canBuy(p)) { toast('This product is unavailable.', 'alert'); return; } addLine(p, p.variants[0], 1, false); render(); },
    pq(el) { const i = ui.cart.findIndex(l => l.pid === el.dataset.v); if (i < 0) return; ui.cart[i].qty += +el.dataset.d; if (ui.cart[i].qty < 1) ui.cart.splice(i, 1); render(); },
    wish(el) { ui.wish[el.dataset.v] = !ui.wish[el.dataset.v]; render(); },
    sort(el) { ui.sort = el.dataset.v; ui.sheet = null; render(); }, qclear() { ui.d.q = ''; render(); },
    buynow(el) { const p = AC.catById[el.dataset.v]; if (!S.canBuy(p)) { toast('This product is unavailable.', 'alert'); return; } ui.buy = [{ pid: p.id, variant: p.variants[0], qty: 1, install: false }]; ui.buyMode = true; ui.d.pm = ui.d.pm || 'cod'; push('checkout'); },
    buynow2() { const p = AC.catById[ui.stack[ui.stack.length - 1].p.id], d = ui.pdraft; ui.buy = [{ pid: p.id, variant: d.variant, qty: d.qty, install: d.install }]; ui.buyMode = true; ui.d.pm = ui.d.pm || 'cod'; push('checkout'); },
    addcart() { const p = AC.catById[ui.stack[ui.stack.length - 1].p.id], d = ui.pdraft; addLine(p, d.variant, d.qty, d.install); ui.added = true; render(); setTimeout(() => { ui.added = false; render(); }, 1400); },
    cart() { push('cart'); },
    cqty(el) { const L = lines(), l = L[+el.dataset.i]; l.qty = Math.max(1, l.qty + +el.dataset.v); render(); },
    cinst(el) { const l = lines()[+el.dataset.i]; l.install = !l.install; render(); },
    crm(el) { const L = lines(), i = +el.dataset.i, u = { line: L[i], idx: i, buy: ui.buyMode }; L.splice(i, 1); ui.undo = u; render(); setTimeout(() => { if (ui.undo === u) { ui.undo = null; render(); } }, 5000); },
    undo() { const u = ui.undo; if (!u) return; (u.buy ? ui.buy : ui.cart).splice(u.idx, 0, u.line); ui.undo = null; render(); },
    promotoggle() { ui.promoOpen = !ui.promoOpen; ui.promoErr = ''; render(); },
    promorm() { ui.promo = null; ui.promoOff = true; ui.promoErr = ''; render(); },
    promopick(el) { A.applyCode(el.dataset.v); },
    promoapply() { A.applyCode((ui.d.promoIn || '').trim().toUpperCase()); },
    applyCode(code) {
      const pr = AC.shopPromos.find(p => p.code === code), c = cartCalc();
      if (!code) { ui.promoErr = 'Enter a promo code.'; render(); return; }
      if (!pr) { ui.promoErr = code + ' is not a valid code.'; ui.promoOpen = true; render(); return; }
      const ev = promoEval(pr, c.sub, lines().reduce((a, l) => a + (AC.catById[l.pid].cat === 'ac' ? AC.catById[l.pid].price * l.qty : 0), 0), c.first);
      if (ev.err) { ui.promoErr = ev.err; ui.promoOpen = true; render(); return; }
      ui.promo = code; ui.promoOff = false; ui.promoErr = ''; ui.promoOpen = false; ui.d.promoIn = ''; render();
    },
    checkout() { ui.buyMode = false; ui.d.pm = ui.d.pm || 'cod'; push('checkout'); },
    pm(el) { ui.d.pm = el.dataset.v; render(); },
    place() { requireOtp(ui.d.cphone || me.phone, () => A.doPlace()); },
    doPlace() {
      const gone = lines().filter(l => !S.canBuy(AC.catById[l.pid])); if (gone.length) { const ids = gone.map(l => l.pid); ui.cart = ui.cart.filter(l => !ids.includes(l.pid)); ui.buy = ui.buy.filter(l => !ids.includes(l.pid)); ui.sheet = null; toast(gone.length + ' item' + (gone.length > 1 ? 's' : '') + ' became unavailable and ' + (gone.length > 1 ? 'were' : 'was') + ' removed.', 'alert'); render(); return; }
      const c = cartCalc(), m = ui.d.pm || 'cod';
      const finish = () => {
        const id = S.act.placeOrder({ cust: ME, items: lines().map(l => ({ pid: l.pid, qty: l.qty, price: AC.catById[l.pid].price, variant: l.variant })), subtotal: c.sub, inst: c.inst, discount: c.disc, delivery: c.delivery, install: lines().some(l => l.install && AC.catById[l.pid].cat === 'ac'), addr: ui.d.caddr || me.addr, phone: ui.d.cphone || me.phone, verified: true, pay: { method: m, status: m === 'cod' ? 'unpaid' : 'paid' } });
        if (ui.buyMode) { ui.buy = []; ui.buyMode = false; } else ui.cart = []; ui.promo = null; ui.promoOff = false; ui.sheet = null; ui.stack = [{ s: 'done', p: { id } }]; ui.tab = 'orders'; ui.ot = 'shop'; render();
      };
      if (m === 'cod') finish(); else gate(m, c.total, finish);
    },
    order(el) { const s = { s: 'order', p: { id: el.dataset.v } }; if (el.dataset.replace) ui.stack = [s]; else ui.stack.push(s); render(); S.act.markSeen('cust:' + ME, 'o:' + el.dataset.v); },
    ot(el) { ui.ot = el.dataset.v; render(); },
    book(el) { const s = AC.svcById[el.dataset.v]; ui.book = { svc: s.id, units: 1, ac: 'Split', slot: AC.slots[1], addr: me.addr, phone: me.phone, note: '', method: 'cod' }; push('book'); },
    bac(el) { ui.book.ac = el.dataset.v; render(); }, bslot(el) { ui.book.slot = el.dataset.v; render(); }, bpm(el) { ui.book.method = el.dataset.v; render(); },
    bunits(el) { ui.book.units = Math.max(1, Math.min(4, ui.book.units + +el.dataset.v)); render(); },
    confirm() { requireOtp(ui.book.phone, () => A.doConfirm()); },
    doConfirm() {
      const b = ui.book, id = S.act.createJob({ verified: true, cust: ME, svc: b.svc, units: b.units, ac: b.ac, slot: b.slot, note: b.note, addr: b.addr, phone: b.phone, method: b.method, discount: 100 });
      ui.stack = [{ s: 'track', p: { id } }]; ui.tab = 'orders'; ui.ot = 'book'; toast('Booking ' + id + ' sent to NEW', 'checkc'); render();
    },
    jchat(el) { ui.d.jchat = ''; push('jchat', { id: el.dataset.v }); S.act.markSeen('cust:' + ME, 'c:J:' + el.dataset.v); },
    jsend() { const t = ui.stack[ui.stack.length - 1]; if (!t || t.s !== 'jchat') return; const v = (ui.d.jchat || '').trim(); if (!v) return; S.act.jobChat(t.p.id, 'customer', v); ui.d.jchat = ''; render(); },
    jquick(el) { const t = ui.stack[ui.stack.length - 1]; if (!t || t.s !== 'jchat') return; S.act.jobChat(t.p.id, 'customer', el.dataset.v); },
    resopen(el) { ui.sheet = { t: 'resched', id: el.dataset.v, slot: null }; render(); }, respick(el) { ui.sheet.slot = el.dataset.v; render(); },
    resdo() { const sh = ui.sheet; if (!sh || !sh.slot) return; const ok = S.act.reschedule(sh.id, sh.slot, 'Customer'); ui.sheet = null; render(); toast(ok ? 'Time changed. Your technician is told.' : 'This booking can no longer be moved.', ok ? 'calendar' : 'info'); },
    wclaim(el) { ui.d.wnote = ''; ui.sheet = { t: 'wclaim', id: el.dataset.v, slot: AC.slots[1] }; render(); }, wslot(el) { ui.sheet.slot = el.dataset.v; render(); },
    wdo() { const sh = ui.sheet, note = (ui.d.wnote || '').trim(); if (!sh || note.length < 3) return; const id = S.act.createJob({ svc: 'ac-repair', cust: ME, slot: sh.slot, note, method: 'cod', verified: true, warrantyOf: sh.id }); ui.sheet = null; ui.d.wnote = ''; ui.tab = 'orders'; ui.ot = 'book'; ui.stack = [{ s: 'track', p: { id } }]; render(); toast('Free repair booked under warranty', 'shield'); },
    rebook(el) { A.book({ dataset: { v: el.dataset.v } }); },
    track(el) { ui.d.rt = {}; ui.d.rev = ''; push('track', { id: el.dataset.v }); S.act.markSeen('cust:' + ME, 'j:' + el.dataset.v); },
    extra(el) { S.act.resolveExtra(el.dataset.id, el.dataset.v === 'yes', 'Customer'); toast(el.dataset.v === 'yes' ? 'Extra work approved' : 'Extra work declined'); },
    cancel(el) { S.act.cancel(el.dataset.id, 'Customer'); toast('Booking cancelled', 'info'); },
    paynow(el) { const j = S.job(el.dataset.id); gate(j.pay.method, S.jobTotal(j), () => { S.act.pay(j.id, j.pay.method); ui.sheet = null; render(); }); },
    star(el) { ui.d.rt = ui.d.rt || {}; ui.d.rt[el.dataset.k] = +el.dataset.v; render(); },
    rate(el) { const r = ui.d.rt || {}; S.act.rate(el.dataset.id, { overall: r.overall, work: r.work || r.overall, behavior: r.behavior || r.overall, punctuality: r.punctuality || r.overall, text: ui.d.rev || '' }); toast('Thanks for your review'); },
    chat() { push('chat'); },
    send() { const v = (ui.d.chat || '').trim(); if (!v) return; ui.d.chat = ''; S.act.send(ME, 'customer', v); },
    quickmsg(el) { S.act.send(ME, 'customer', el.dataset.v); },
    otpverify() { checkOtp(); }, otpresend() { toast('A new code was sent by SMS', 'phone'); }, otpclose() { ui.sheet = null; render(); },
    auto() { const j = activeJob(); if (j) { S.auto(j.id); toast('Autopilot running', 'zap'); } },
    reset() { S.act.reset(); ui.stack = []; ui.cart = []; ui.tab = 'home'; render(); toast('Demo data reset'); }
  };
  function addLine(p, variant, qty, install) { const l = ui.cart.find(x => x.pid === p.id && x.variant === variant); if (l) { l.qty += qty; l.install = l.install || install; } else ui.cart.push({ pid: p.id, variant, qty, install }); }
  /* Phone verification: required once per number before a booking or order, to stop fake requests. Demo code: 4829. */
  const DEMO_OTP = '4829', digits = p => String(p || '').replace(/\D/g, '').replace(/^88/, '');
  const verifiedList = () => { try { return JSON.parse(localStorage.getItem('shital.verified') || '[]'); } catch (e) { return []; } };
  function requireOtp(phone, done) {
    const d = digits(phone);
    if (!/^01[3-9]\d{8}$/.test(d)) { toast('Enter a valid mobile number, for example 01712345678', 'alert'); return; }
    if (verifiedList().includes(d)) { done(); return; }
    ui.d.otp = ''; ui.sheet = { t: 'otp', phone, d, done, err: false, ok: false }; render();
  }
  function checkOtp() {
    const sh = ui.sheet; if (!sh || sh.t !== 'otp' || sh.ok) return;
    if ((ui.d.otp || '') === DEMO_OTP) {
      sh.ok = true; try { localStorage.setItem('shital.verified', JSON.stringify(verifiedList().concat(sh.d))); } catch (e) { }
      render(); setTimeout(() => { const f = sh.done; ui.sheet = null; render(); f(); }, 900);
    } else { sh.err = true; ui.d.otp = ''; render(); }
  }
  function gate(m, amount, done) { ui.sheet = { t: 'gate', m, amount, stage: 'wait' }; render(); setTimeout(() => { ui.sheet.stage = 'ok'; render(); setTimeout(done, 1000); }, 1700); }

  $app.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const f = A[el.dataset.a]; if (f) f(el); });
  $app.addEventListener('input', e => { const k = e.target.dataset.b; if (!k) return; if (['addr', 'phone', 'note'].includes(k)) ui.book[k] = e.target.value; else ui.d[k] = e.target.value; if (k === 'otp' && e.target.value.length === 4) setTimeout(checkOtp, 120); if (k === 'q' || k === 'wnote') render(); });
  $app.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'f-chat') A.send(); if (e.key === 'Enter' && e.target.id === 'f-jchat') A.jsend(); });

  /* Notifications on live changes from admin / vendor / technician */
  S.subscribe((s, prev) => {
    /* Every notification for this customer shows as a toast as it arrives: technician updates, declines and reassignments, order steps. */
    const seen = new Set((prev.notifs || []).map(n => n.id)); (s.notifs || []).filter(n => n.aud === 'cust:' + ME && !seen.has(n.id)).slice(-2).forEach(n => toast(n.text, ({ declined: 'alert', timeout: 'alert', ontheway: 'nav', arrived: 'pin', working: 'wrench', completed: 'checkc', assigned: 'user', accepted: 'checkc', shipped: 'truck', courier: 'truck', placed: 'box', packed: 'box', delivered: 'checkc' })[n.kind] || 'bell'));
    const last = s.msgs[s.msgs.length - 1], pl = prev.msgs[prev.msgs.length - 1];
    if (last && (!pl || last.id !== pl.id) && last.thread === ME && last.from === 'admin') toast('New message from NEW Support', 'chat');
    const lc = (s.chat || []).slice(-1)[0], pc = (prev.chat || []).slice(-1)[0], tp = ui.stack[ui.stack.length - 1];
    if (lc && (!pc || lc.id !== pc.id) && lc.from === 'tech' && S.chatUnread('cust:' + ME).includes(lc.thread) && !(tp && tp.s === 'jchat' && 'J:' + tp.p.id === lc.thread)) toast('New message from your technician', 'chat');
    render();
  });
  AC.history.track('cust:' + ME);
  render();
})();
