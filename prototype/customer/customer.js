/* Shital customer app prototype. Signed in as Nadia Rahman (C1). */
(function () {
  const S = AC.store, ME = 'C1', me = AC.custById[ME], money = AC.fmt.money, $app = document.getElementById('app');
  const ui = { tab: 'home', stack: [], sheet: null, cat: 'all', cart: [], d: {}, ot: 'book', key: '', pdraft: null, book: null, map: null, scroll: {} };
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
  function cartCalc() {
    let sub = 0, inst = 0, ac = false, n = 0;
    ui.cart.forEach(l => { const p = AC.catById[l.pid]; sub += p.price * l.qty; n += l.qty; if (p.cat === 'ac') { ac = true; if (l.install) inst += Math.round(AC.INSTALL_FEE * 0.8) * l.qty; } });
    const first = !myOrders().length, disc = first ? Math.min(500, Math.round(sub * 0.15)) : 0, delivery = ui.cart.length ? (ac ? 350 : 80) : 0;
    return { sub, inst, disc, delivery, total: sub + inst - disc + delivery, ac, n, first };
  }

  /* ---------- Pieces ---------- */
  const art = (p) => Art.product(p);
  function pcard(p) {
    const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
    return `<div class="pcard fade"><button class="plink" style="text-align:left;width:100%" data-a="prod" data-v="${p.id}"><div class="pimg">${art(p)}<span class="ptag">${esc(p.tag)}</span>${off ? `<span class="pdisc">-${off}%</span>` : ''}</div>
      <div class="pb">${esc(p.brand)}</div><div class="pn">${esc(p.name)}</div><div class="pp"><b>${money(p.price)}</b>${p.was ? `<s>${money(p.was)}</s>` : ''}</div></button>
      <button class="padd" data-a="quick" data-v="${p.id}" aria-label="Add ${esc(p.name)} to cart">${icon('plus', 18, 2.2)}</button></div>`;
  }
  const top = (title, o) => `<div class="top">${o && o.back === false ? '' : `<button class="back" data-a="back" aria-label="Back">${icon('left', 22)}</button>`}<h1>${title}</h1>${(o && o.right) || ''}</div>`;
  const cartBtn = () => { const n = cartCalc().n; return `<button class="icon-btn" data-a="cart" aria-label="Cart">${icon('cart', 22)}${n ? `<span class="badge-n">${n}</span>` : ''}</button>`; };

  /* ---------- Screens ---------- */
  function Home() {
    const aj = activeJob(), P = c => AC.catalog.filter(p => p.cat === c);
    let banner = '';
    if (aj) {
      const t = AC.techById[aj.techId];
      banner = `<button class="live-banner fade" data-a="track" data-v="${aj.id}"><span class="pulse-dot"></span><span class="grow"><b>${esc(aj.svcName)}</b><small>${S.META[aj.status].cust}${t && aj.status === 'ontheway' ? ' . ' + S.etaMin(aj) + ' min away' : ''}</small></span>${icon('right', 18)}</button>`;
    }
    return `<div class="top"><div class="loc">${icon('pin', 20)}<div><small>Service and delivery</small>Banani, Dhaka</div></div>${cartBtn()}<button class="icon-btn" data-a="toast" data-v="You have no new notifications" aria-label="Notifications">${icon('bell', 22)}</button></div>
    <div class="pad"><h1 class="greet">Hello, ${esc(firstName)}</h1><p class="greet-s">Cool air, fixed fast. Shop or book a technician.</p></div>
    <button class="search" data-a="tab" data-v="shop">${icon('search', 18)}<span>Search ACs, bags, cosmetics</span></button>
    ${banner}
    <div class="hero"><div><div class="eyebrow">First purchase</div><h2>15% off your first order</h2><span class="code">${icon('tag', 14)} FIRST15</span></div><div class="art">${Art.draw('split', 0)}</div></div>
    <div class="sec"><div class="sec-h"><h2>Shop by category</h2></div>
      <div class="cats"><button class="cat cat-ac" style="background:#E3F1F3" data-a="shopcat" data-v="ac"><div class="art">${Art.draw('split', 0)}</div><span><div>Air conditioners<small>Buy and get serviced</small></div>${icon('right', 16)}</span></button>
      <button class="cat" style="background:#FDF2E0" data-a="shopcat" data-v="bag"><div class="art">${Art.draw('tote', 1)}</div><span><div>Bags</div>${icon('right', 16)}</span></button>
      <button class="cat" style="background:#F5E8EE" data-a="shopcat" data-v="cos"><div class="art">${Art.draw('bottle', 3)}</div><span><div>Cosmetics<small>Made locally</small></div>${icon('right', 16)}</span></button></div></div>
    <div class="sec"><div class="sec-h"><h2>Book a service</h2><button data-a="tab" data-v="services">See all</button></div>
      <div class="hscroll">${AC.services.map(s => `<button class="svc-chip" data-a="book" data-v="${s.id}"><span class="svc-ic">${icon(s.icon, 22)}</span><b>${s.name}</b><small>From ${money(s.price)}</small></button>`).join('')}</div></div>
    <div class="sec"><div class="sec-h"><h2>Air conditioners</h2><button data-a="shopcat" data-v="ac">See all</button></div><div class="hscroll">${P('ac').map(pcard).join('')}</div></div>
    <div class="sec"><div class="sec-h"><h2>Bags</h2><button data-a="shopcat" data-v="bag">See all</button></div><div class="hscroll">${P('bag').map(pcard).join('')}</div></div>
    <div class="sec"><div class="sec-h"><h2>Local cosmetics</h2><button data-a="shopcat" data-v="cos">See all</button></div><div class="hscroll">${P('cos').map(pcard).join('')}</div></div>
    <div class="sec"><div class="trust"><div>${icon('shield', 22)}Verified technicians</div><div>${icon('wallet', 22)}Pay after service</div><div>${icon('repeat', 22)}1 year repair warranty</div></div></div>`;
  }

  function Services() {
    return `${top('Services', { back: false })}
    <div class="pad" style="margin-top:6px"><div class="note ok">${icon('shield', 18)}<span>Pay after the job is done. Extra parts are quoted first and need your approval.</span></div></div>
    <div class="stack" style="margin-top:14px">${AC.services.map(s => `<button class="svc-row" data-a="book" data-v="${s.id}"><span class="svc-ic">${icon(s.icon, 24)}</span><div class="grow"><h3>${s.name} <span class="bn faint" style="font-size:13px;font-weight:500">${s.bn}</span></h3><p>${s.desc}</p><div class="meta"><span>${money(s.price)}</span><span class="muted" style="font-weight:600;display:inline-flex;gap:4px;align-items:center">${icon('clock', 14)} ${s.dur}</span></div></div>${icon('right', 18)}</button>`).join('')}</div>
    <div class="pad sec"><div class="cardx" style="display:flex;gap:12px">${icon('gift', 22)}<div><b>Bought an AC from us?</b><div class="muted" style="font-size:13px">Installation is 20% off and repairs are free for 1 year.</div></div></div></div>`;
  }

  function Book() {
    const b = ui.book, s = AC.svcById[b.svc], price = s.price * b.units, total = price - 100;
    return `${top(s.name)}
    <div class="pad">
      <div class="cardx" style="display:flex;gap:14px;align-items:center"><span class="svc-ic" style="width:48px;height:48px">${icon(s.icon, 24)}</span><div class="grow"><b>${s.name}</b><div class="muted" style="font-size:13px">${s.desc}</div></div></div>
      <label class="lab">Type of AC</label><div class="seg" style="margin:0">${['Split', 'Window', 'Cassette'].map(t => `<button class="${b.ac === t ? 'on' : ''}" data-a="bac" data-v="${t}">${t}</button>`).join('')}</div>
      <div class="row between" style="margin-top:16px"><b>Number of units</b><div class="step"><button data-a="bunits" data-v="-1" aria-label="Fewer">${icon('minus', 16)}</button><b>${b.units}</b><button data-a="bunits" data-v="1" aria-label="More">${icon('plus', 16)}</button></div></div>
      <label class="lab">When should we come?</label><div class="optgrid">${AC.slots.map(t => `<button class="slot ${b.slot === t ? 'on' : ''}" data-a="bslot" data-v="${t}">${t}</button>`).join('')}</div>
      <label class="lab">Address</label><div class="field"><input class="input" id="f-addr" data-b="addr" value="${esc(b.addr)}" autocomplete="off"></div>
      <div class="field" style="margin-top:10px"><label for="f-phone">Phone number</label><input class="input" id="f-phone" data-b="phone" value="${esc(b.phone)}" inputmode="tel"></div>
      <div class="field" style="margin-top:10px"><label for="f-note">What is the problem? (optional)</label><textarea class="textarea" id="f-note" data-b="note" placeholder="Example: Water drips from the indoor unit">${esc(b.note)}</textarea></div>
      <label class="lab">Pay after the service with</label><div class="col" style="gap:8px">${AC.payMethods.map(m => `<button class="opt ${b.method === m.id ? 'on' : ''}" data-a="bpm" data-v="${m.id}"><span class="rd"></span><span class="grow"><b>${m.name}</b><small>${m.note}</small></span>${icon(m.icon, 20)}</button>`).join('')}</div>
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
      working: ['Work in progress', 'We will tell you if extra parts are needed.'], completed: ['Job completed', 'Thank you for choosing Shital.'], cancelled: ['Booking cancelled', 'You can book again any time.']
    }[j.status];
    const tlHtml = STAGES.map((st, i) => {
      const e = j.tl.find(x => st[1].includes(x.k)); const cls = i < idx || (j.status === 'completed' && i === 5) ? 'done' : i === idx ? 'now' : '';
      return `<div class="tl-i ${cls}"><div class="tl-dot">${cls === 'done' ? icon('check', 13, 3) : ''}</div><div><div class="tl-t">${st[0]}</div><div class="muted" style="font-size:12.5px">${e ? AC.fmt.time(e.at) + (e.note && i === 0 ? '' : '') : (i === idx ? 'In progress' : 'Pending')}</div></div></div>`;
    }).join('');
    const vend = t && t.vendor ? AC.vendById[t.vendor].name : '';
    const techCard = t && j.status !== 'cancelled' ? `<div class="cardx"><div class="techcard"><div class="avatar lg">${AC.fmt.ini(t.name)}</div><div class="grow"><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${vend ? 'Partner: ' + esc(vend) : 'Shital technician'}</div><div class="rate">${icon('star', 13)} ${t.rating} . ${t.jobs} jobs</div></div></div>
      <div class="actions"><button class="btn btn-s" data-a="toast" data-v="Calling ${esc(t.name)} (opens the phone dialer in the real app)">${icon('phone', 18)}Call</button><button class="btn btn-s" data-a="toast" data-v="Opening WhatsApp chat with ${esc(t.name)}">${icon('chat', 18)}WhatsApp</button><button class="btn btn-s" data-a="chat">${icon('send', 18)}Support</button></div></div>` : '';
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
      ${j.status === 'completed' && j.pay.status !== 'paid' && j.pay.method !== 'cod' ? `<button class="btn btn-p btn-lg btn-block" style="margin-top:14px" data-a="paynow" data-id="${j.id}">Pay ${money(tot)}</button>` : ''}</div>`;
    let rate = '';
    if (j.status === 'completed' && !j.rating) {
      const st = ui.d.stars || 0;
      rate = `<div class="cardx" style="text-align:center"><b>How was ${esc(t ? t.name.split(' ')[0] : 'the technician')}?</b><div class="star-in">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= st ? 'on' : ''}" data-a="star" data-v="${n}" aria-label="${n} star">${icon('star', 32, 1.6).replace('fill="none"', 'fill="' + (n <= st ? 'currentColor' : 'none') + '"')}</button>`).join('')}</div>
        <textarea class="textarea" id="f-rev" data-b="rev" placeholder="Tell us more (optional)">${esc(ui.d.rev || '')}</textarea><button class="btn btn-p btn-block" style="margin-top:10px" data-a="rate" data-id="${j.id}" ${st ? '' : 'disabled'}>Submit review</button></div>`;
    } else if (j.rating) rate = `<div class="cardx row">${starRow(j.rating.stars, 16)}<span class="muted grow">Thanks for your review</span></div>`;
    const prog = `<div class="prog">${[0, 1, 2, 3, 4, 5].map(i => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>`;
    const searching = !t && S.isActive(j) ? `<div class="searching"><span class="gate" style="padding:0"><span class="ring"></span></span><span class="grow">${j.status === 'forwarded' ? 'A partner is assigning a technician' : 'Finding the closest technician'}<div class="muted" style="font-weight:500;font-size:12.5px">Usually under 10 minutes</div></span></div>` : '';
    return `${top('Booking ' + j.id, { right: `<button class="icon-btn" data-a="chat" aria-label="Chat with support">${icon('chat', 22)}</button>` })}
    <div class="trackmap" id="trackmap">${searching}</div>
    <div class="statuscard fade"><div class="eyebrow">${esc(j.svcName)} . ${esc(j.slot)}</div><h2 style="margin-top:4px">${head[0]}</h2><div class="eta">${head[1]}</div>${j.status === 'cancelled' ? '' : prog}</div>
    <div class="stack" style="margin-top:14px">${techCard}${extra}
      <div class="cardx"><h3 style="font-size:16px;margin-bottom:14px">Progress</h3><div class="tl">${tlHtml}</div></div>
      ${payBox}${rate}
      <div class="cardx"><div class="lrow">${icon('pin', 20)}<div class="grow"><b>${esc(j.cust.addr)}</b><small>${esc(j.cust.phone)}</small></div></div>${j.note ? `<div class="muted" style="margin-top:10px;font-size:13px">Note: ${esc(j.note)}</div>` : ''}</div>
      ${['requested', 'forwarded', 'assigned'].includes(j.status) ? `<button class="btn btn-g btn-block" style="color:var(--bad)" data-a="cancel" data-id="${j.id}">Cancel booking</button>` : ''}</div>`;
  }

  function Shop() {
    const list = AC.catalog.filter(p => ui.cat === 'all' || p.cat === ui.cat);
    const cats = [['all', 'All'], ['ac', 'Air conditioners'], ['bag', 'Bags'], ['cos', 'Cosmetics']];
    return `<div class="top"><h1>Shop</h1>${cartBtn()}</div>
    <div class="hscroll" style="padding-top:8px;padding-bottom:14px">${cats.map(c => `<button class="chip ${ui.cat === c[0] ? 'on' : ''}" data-a="shopcat" data-v="${c[0]}">${c[1]}</button>`).join('')}</div>
    ${ui.cat === 'ac' ? `<div class="pad" style="margin-bottom:14px"><div class="note acc">${icon('gift', 18)}<span>Buy an AC and get 20% off installation plus a 1 year repair warranty.</span></div></div>` : ''}
    <div class="pgrid">${list.map(pcard).join('')}</div>`;
  }

  function Prod(id) {
    const p = AC.catById[id], d = ui.pdraft, off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0, isAC = p.cat === 'ac', ins = Math.round(AC.INSTALL_FEE * 0.8);
    return `<div class="phero" style="background:${Art.tints[p.tint].bg}">${art(p)}<button class="back" data-a="back" aria-label="Back">${icon('left', 22)}</button></div>
    <div class="pbody"><div class="row between"><span class="eyebrow">${esc(p.brand)}</span><span class="rate">${icon('star', 14)} ${p.rating}</span></div><h1>${esc(p.name)}</h1>
      <div class="price-big"><b>${money(p.price)}</b>${p.was ? `<s>${money(p.was)}</s><span class="save">Save ${money(p.was - p.price)}</span>` : ''}</div>
      <label class="lab">${isAC ? 'Capacity' : 'Option'}</label><div class="row wrap" style="gap:8px">${p.variants.map(v => `<button class="chip ${d.variant === v ? 'on' : ''}" data-a="pvar" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>
      ${isAC ? `<label class="lab">Add installation</label><button class="addon ${d.install ? 'on' : ''}" data-a="pinst"><span class="ck">${d.install ? icon('check', 14, 3) : ''}</span><span class="grow"><b>Professional installation</b><div class="muted" style="font-size:13px"><s>${money(AC.INSTALL_FEE)}</s> <b style="color:var(--accent-d)">${money(ins)}</b> with AC purchase</div></span>${icon('wrench', 20)}</button>` : ''}
      <div class="bullets cardx" style="margin-top:20px">${isAC ? `<div>${icon('shield', 20)}<span><b>1 year warranty</b><br><span class="muted">Free repair labour after installation by Shital.</span></span></div>` : ''}
        <div>${icon('truck', 20)}<span><b>Delivery by courier partner</b><br><span class="muted">${isAC ? 'Safe handling for large items. 3-5 days.' : 'Pathao or RedX. 2-4 days.'}</span></span></div>
        <div>${icon('wallet', 20)}<span><b>Cash, bKash, Nagad or card</b><br><span class="muted">Choose how to pay at checkout.</span></span></div></div></div>`;
  }

  function Cart() {
    if (!ui.cart.length) return top('Cart') + `<div class="empty"><div class="ill">${Art.draw('tote', 1)}</div><h3>Your cart is empty</h3><span>Browse ACs, bags and local cosmetics.</span><button class="btn btn-p" data-a="shopcat" data-v="all">Start shopping</button></div>`;
    const c = cartCalc();
    return `${top('Cart')}<div class="stack">${ui.cart.map((l, i) => {
      const p = AC.catById[l.pid];
      return `<div class="cline"><div class="pimg">${art(p)}</div><div class="col" style="gap:6px"><h3>${esc(p.name)}</h3><span class="muted" style="font-size:12.5px">${esc(l.variant)}</span><div class="row between"><b>${money(p.price * l.qty)}</b><div class="step"><button data-a="cqty" data-i="${i}" data-v="-1" aria-label="Less">${icon('minus', 14)}</button><b>${l.qty}</b><button data-a="cqty" data-i="${i}" data-v="1" aria-label="More">${icon('plus', 14)}</button></div></div></div>
        ${p.cat === 'ac' ? `<button class="addon sub ${l.install ? 'on' : ''}" style="padding:10px 12px" data-a="cinst" data-i="${i}"><span class="ck">${l.install ? icon('check', 14, 3) : ''}</span><span class="grow"><b style="font-size:13px">Add installation</b><div class="muted" style="font-size:12.5px">${money(Math.round(AC.INSTALL_FEE * .8))} each, 20% off</div></span></button>` : ''}</div>`;
    }).join('')}
      <div class="cardx sum"><div><span>Subtotal</span><span>${money(c.sub)}</span></div>${c.inst ? `<div><span>Installation</span><span>${money(c.inst)}</span></div>` : ''}${c.disc ? `<div class="sv"><span>FIRST15 first purchase</span><span>-${money(c.disc)}</span></div>` : ''}<div><span>Delivery</span><span>${money(c.delivery)}</span></div><div class="tot"><span>Total</span><span>${money(c.total)}</span></div></div>
      ${c.first ? `<div class="note acc">${icon('tag', 18)}<span>First purchase discount applied automatically.</span></div>` : ''}</div>`;
  }

  function Checkout() {
    const c = cartCalc(), d = ui.d;
    return `${top('Checkout')}<div class="pad">
      <label class="lab" style="margin-top:4px">Delivery address</label><div class="field"><input class="input" id="f-caddr" data-b="caddr" value="${esc(d.caddr != null ? d.caddr : me.addr)}"></div>
      <div class="field" style="margin-top:10px"><label for="f-cphone">Phone</label><input class="input" id="f-cphone" data-b="cphone" value="${esc(d.cphone != null ? d.cphone : me.phone)}" inputmode="tel"></div>
      <div class="note" style="margin-top:12px">${icon('truck', 18)}<span>Your order is delivered by a courier partner (Pathao or RedX). You get the tracking id once it ships.</span></div>
      <label class="lab">Payment</label><div class="col" style="gap:8px">${AC.payMethods.map(m => `<button class="opt ${(d.pm || 'cod') === m.id ? 'on' : ''}" data-a="pm" data-v="${m.id}"><span class="rd"></span><span class="grow"><b>${m.name}</b><small>${m.note}</small></span>${icon(m.icon, 20)}</button>`).join('')}</div>
      <div class="cardx sum" style="margin-top:18px"><div><span>${c.n} item${c.n > 1 ? 's' : ''}</span><span>${money(c.sub)}</span></div>${c.inst ? `<div><span>Installation</span><span>${money(c.inst)}</span></div>` : ''}${c.disc ? `<div class="sv"><span>First purchase</span><span>-${money(c.disc)}</span></div>` : ''}<div><span>Delivery</span><span>${money(c.delivery)}</span></div><div class="tot"><span>Total</span><span>${money(c.total)}</span></div></div></div>`;
  }

  function OrderDone(id) {
    const o = S.get().orders.find(x => x.id === id);
    return `<div class="empty" style="padding-top:90px"><div class="okc">${icon('check', 36, 2.5)}</div><h3 style="font-size:24px">Order placed</h3><span>Order ${id} is confirmed. We will pack it shortly.${o && o.jobId ? ' Your installation booking is created too.' : ''}</span>
      <div class="col" style="width:100%;margin-top:14px"><button class="btn btn-p btn-lg btn-block" data-a="order" data-v="${id}" data-replace="1">Track order</button><button class="btn btn-g btn-block" data-a="tab" data-v="home">Continue shopping</button></div></div>`;
  }

  const OSTEPS = [['placed', 'Order placed'], ['packed', 'Packed'], ['shipped', 'Handed to courier'], ['delivered', 'Delivered']];
  function Order(id) {
    const o = S.get().orders.find(x => x.id === id); if (!o) return top('Order');
    const idx = OSTEPS.findIndex(s => s[0] === o.status);
    return `${top('Order ' + o.id)}<div class="stack">
      <div class="cardx"><div class="row between"><b>${idx === 3 ? 'Delivered' : OSTEPS[idx][1]}</b><span class="badge ${idx === 3 ? 'b-ok' : 'b-brand'}">${o.status[0].toUpperCase() + o.status.slice(1)}</span></div>
        ${o.courier ? `<div class="note" style="margin:12px 0 0">${icon('truck', 18)}<span>${esc(o.courier)} . Tracking <span class="mono">${esc(o.tracking)}</span></span></div>` : ''}
        <div class="tl" style="margin-top:16px">${OSTEPS.map((st, i) => { const e = o.tl.find(x => x.k === st[0]); const cls = i < idx || (i === idx && o.status === 'delivered') ? 'done' : i === idx ? 'now' : ''; return `<div class="tl-i ${cls}"><div class="tl-dot">${cls === 'done' ? icon('check', 13, 3) : ''}</div><div><div class="tl-t">${st[1]}</div><div class="muted" style="font-size:12.5px">${e ? AC.fmt.time(e.at) : 'Pending'}</div></div></div>`; }).join('')}</div></div>
      <div class="cardx col" style="gap:14px">${o.items.map(i => { const p = AC.catById[i.pid]; return `<div class="row"><div class="pimg" style="width:52px;border-radius:10px;flex:none">${art(p)}</div><div class="grow"><b style="font-size:13.5px">${esc(p.name)}</b><div class="muted" style="font-size:12.5px">Qty ${i.qty}</div></div><b>${money(i.price * i.qty)}</b></div>`; }).join('')}
        <hr class="divider"><div class="sum"><div><span>Subtotal</span><span>${money(o.subtotal)}</span></div>${o.inst ? `<div><span>Installation</span><span>${money(o.inst)}</span></div>` : ''}${o.discount ? `<div class="sv"><span>Discount</span><span>-${money(o.discount)}</span></div>` : ''}<div><span>Delivery</span><span>${money(o.delivery)}</span></div><div class="tot"><span>Total</span><span>${money(S.ordTotal(o))}</span></div></div>
        <div class="row between"><span class="muted">${AC.payName(o.pay.method)}</span><span class="badge ${o.pay.status === 'paid' ? 'b-ok' : 'b-warn'}">${o.pay.status === 'paid' ? 'Paid' : 'Pay on delivery'}</span></div></div>
      ${o.jobId ? `<button class="cardx lrow" data-a="track" data-v="${o.jobId}"><span class="svc-ic">${icon('wrench', 20)}</span><span class="grow"><b>Installation booking ${o.jobId}</b><small>Scheduled after delivery</small></span>${icon('right', 18)}</button><div class="note ok">${icon('shield', 18)}<span>1 year free repair warranty starts after installation.</span></div>` : ''}</div>`;
  }

  function Orders() {
    const jobs = myJobs(), ords = myOrders();
    const jl = jobs.length ? jobs.map(j => { const t = AC.techById[j.techId]; return `<button class="cardx lrow" data-a="track" data-v="${j.id}"><span class="svc-ic">${icon((AC.svcById[j.svc] || {}).icon || 'wrench', 20)}</span><span class="grow"><b>${esc(j.svcName)}</b><small>${j.id} . ${t ? esc(t.name) : esc(j.slot)}</small></span><span class="col" style="gap:4px;align-items:flex-end"><span class="badge ${S.META[j.status].cls}">${S.META[j.status].cust}</span><b style="font-size:13px">${money(S.jobTotal(j))}</b></span></button>`; }).join('') : `<div class="empty"><h3>No bookings yet</h3><button class="btn btn-p" data-a="tab" data-v="services">Book a service</button></div>`;
    const ol = ords.length ? ords.map(o => `<button class="cardx lrow" data-a="order" data-v="${o.id}"><span class="row" style="gap:0;flex:none">${o.items.slice(0, 2).map((i, k) => `<span class="pimg" style="width:44px;height:44px;border-radius:12px;border:2px solid #fff;margin-left:${k ? '-14px' : '0'};aspect-ratio:1">${art(AC.catById[i.pid])}</span>`).join('')}</span><span class="grow"><b>${o.id}</b><small>${o.items.reduce((s, i) => s + i.qty, 0)} items . ${o.courier ? esc(o.courier) : 'Preparing'}</small></span><span class="col" style="gap:4px;align-items:flex-end"><span class="badge ${o.status === 'delivered' ? 'b-ok' : 'b-brand'}">${o.status[0].toUpperCase() + o.status.slice(1)}</span><b style="font-size:13px">${money(S.ordTotal(o))}</b></span></button>`).join('') : `<div class="empty"><div class="ill">${Art.draw('pack', 2)}</div><h3>No orders yet</h3><span>Your first purchase gets 15% off.</span><button class="btn btn-p" data-a="shopcat" data-v="all">Browse the shop</button></div>`;
    return `${top('Orders', { back: false })}<div class="seg"><button class="${ui.ot === 'book' ? 'on' : ''}" data-a="ot" data-v="book">Bookings</button><button class="${ui.ot === 'shop' ? 'on' : ''}" data-a="ot" data-v="shop">Shop orders</button></div><div class="stack">${ui.ot === 'book' ? jl : ol}</div>`;
  }

  function Account() {
    const w = myOrders().filter(o => o.install && o.status === 'delivered');
    return `${top('Account', { back: false })}<div class="stack">
      <div class="cardx row" style="gap:14px"><div class="avatar lg">${AC.fmt.ini(me.name)}</div><div class="grow"><b style="font-size:17px">${me.name}</b><div class="muted">${me.phone}</div></div></div>
      <div class="cardx lrow">${icon('pin', 20)}<div class="grow"><b>Saved address</b><small>${me.addr}</small></div></div>
      <div class="cardx"><b>Warranty</b>${w.length ? w.map(o => `<div class="note ok" style="margin-top:10px">${icon('shield', 18)}<span>Order ${o.id}: 1 year free repair.</span></div>`).join('') : `<div class="muted" style="font-size:13px;margin-top:6px">Buy an AC with installation to get 1 year free repair.</div>`}</div>
      <div class="cardx"><b>Offers for you</b><div class="col" style="gap:10px;margin-top:12px">${AC.promos.filter(p => p.status === 'Active').map(p => `<div class="row"><span class="svc-ic" style="width:36px;height:36px;background:var(--accent-l);color:var(--accent-d)">${icon('tag', 18)}</span><div class="grow"><b style="font-size:13.5px">${p.title}</b><div class="muted" style="font-size:12.5px">${p.desc}</div></div></div>`).join('')}</div></div>
      <button class="cardx lrow" data-a="chat">${icon('chat', 20)}<div class="grow"><b>Chat with support</b><small>Replies from our team in minutes</small></div>${icon('right', 18)}</button>
      <div class="proto"><div class="eyebrow">Prototype tools</div><div class="muted" style="font-size:13px">Plays the admin, vendor and technician roles on your latest booking so you can review this app alone.</div>
        <button class="btn btn-s" data-a="auto" ${activeJob() ? '' : 'disabled'}>Run autopilot on active booking</button><button class="btn btn-g" data-a="reset">Reset demo data</button></div></div>`;
  }

  function Chat() {
    const ms = S.threadMsgs(ME).sort((a, b) => a.at - b.at);
    return { body: `${top('Shital Support', { right: '<span class="badge b-ok">Online</span>' })}<div class="chat">${ms.map(m => `<div class="bub ${m.from === 'customer' ? 'me' : 'them'}">${esc(m.text)}<small>${AC.fmt.time(m.at)}</small></div>`).join('')}</div>`,
      cta: `<div class="qr" style="background:var(--surface);padding-top:10px">${['Where is my technician?', 'Please call me', 'Change my time slot'].map(q => `<button class="chip" data-a="quickmsg" data-v="${q}">${q}</button>`).join('')}</div><div class="chat-in"><input class="input" id="f-chat" data-b="chat" placeholder="Write a message" value="${esc(ui.d.chat || '')}" autocomplete="off"><button class="send" data-a="send" aria-label="Send">${icon('send', 20)}</button></div>`, flush: true };
  }

  function Sheet() {
    const sh = ui.sheet; if (!sh) return '';
    if (sh.t === 'gate') {
      const m = AC.payMethods.find(x => x.id === sh.m), col = { bkash: '#D12053', nagad: '#E2552B', card: '#0E6B78' }[sh.m] || '#0E6B78';
      return `<div class="scrim"></div><div class="sheet"><div class="grab"></div><div class="gate">${sh.stage === 'ok' ? `<div class="okc">${icon('check', 36, 2.5)}</div><h3 style="font-size:20px">Payment received</h3><span class="muted">${money(sh.amount)} paid with ${m.name}</span>` : `<div class="logo" style="background:${col}">${sh.m === 'card' ? icon('card', 30) : m.name[0]}</div><h3 style="font-size:20px">${sh.m === 'card' ? 'Secure checkout (SSLCommerz)' : 'Confirming with ' + m.name}</h3><span class="muted">${money(sh.amount)}. Do not close this screen.</span><span class="ring"></span><span class="faint" style="font-size:12px">Demo gateway. No real payment is made.</span>`}</div></div>`;
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
      if (t.s === 'book') { body = Book(); cta = `<div class="cta-bar"><div class="grow"><div class="muted" style="font-size:12px">Estimated total</div><b style="font-size:18px">${money(AC.svcById[ui.book.svc].price * ui.book.units - 100)}</b></div><button class="btn btn-p btn-lg" style="flex:1.4" data-a="confirm">Confirm booking</button></div>`; }
      else if (t.s === 'track') body = Track(t.p.id);
      else if (t.s === 'prod') { body = Prod(t.p.id); const p = AC.catById[t.p.id]; cta = `<div class="cta-bar"><div class="step"><button data-a="pqty" data-v="-1" aria-label="Less">${icon('minus', 16)}</button><b>${ui.pdraft.qty}</b><button data-a="pqty" data-v="1" aria-label="More">${icon('plus', 16)}</button></div><button class="btn btn-p btn-lg grow" data-a="addcart">Add to cart . ${money((p.price + (ui.pdraft.install && p.cat === 'ac' ? Math.round(AC.INSTALL_FEE * .8) : 0)) * ui.pdraft.qty)}</button></div>`; }
      else if (t.s === 'cart') { body = Cart(); if (ui.cart.length) cta = `<div class="cta-bar"><div class="grow"><div class="muted" style="font-size:12px">Total</div><b style="font-size:18px">${money(cartCalc().total)}</b></div><button class="btn btn-p btn-lg" style="flex:1.4" data-a="checkout">Checkout</button></div>`; }
      else if (t.s === 'checkout') { body = Checkout(); cta = `<div class="cta-bar"><div class="grow"><div class="muted" style="font-size:12px">Total</div><b style="font-size:18px">${money(cartCalc().total)}</b></div><button class="btn btn-p btn-lg" style="flex:1.4" data-a="place">Place order</button></div>`; }
      else if (t.s === 'done') { body = OrderDone(t.p.id); }
      else if (t.s === 'order') body = Order(t.p.id);
      else if (t.s === 'chat') { const c = Chat(); body = c.body; cta = c.cta; flush = true; }
    } else body = { home: Home, services: Services, shop: Shop, orders: Orders, account: Account }[ui.tab]();
    const n = cartCalc().n, ordDot = myOrders().filter(o => o.status !== 'delivered').length + myJobs().filter(S.isActive).length;
    const wb = ['track', 'chat'].includes(t && t.s) ? ' w' : '';
    $app.innerHTML = `<div class="statusbar${wb}"><span>${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' PM', '').replace(' AM', '')}</span><span class="sb-r"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/><rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5"/></svg></span></div><div class="view" id="view">${body}</div>${cta}${tabs ? `<nav class="tabbar">${TABS.map(x => `<button class="tab ${ui.tab === x[0] ? 'on' : ''}" data-a="tab" data-v="${x[0]}">${icon(x[2], 22, ui.tab === x[0] ? 2.1 : 1.7)}${x[1]}${x[0] === 'orders' && ordDot ? `<span class="dot">${ordDot}</span>` : ''}</button>`).join('')}</nav>` : ''}${Sheet()}`;
    const v = document.getElementById('view');
    if (key === ui.key && ui.scroll[key] != null) v.scrollTop = ui.scroll[key]; else v.scrollTop = key.startsWith('chat') ? 99999 : 0;
    if (t && t.s === 'chat') v.scrollTop = 99999;
    ui.key = key;
    if (afId) { const e = document.getElementById(afId); if (e) { e.focus(); try { e.setSelectionRange(afSel, afSel); } catch (x) { } } }
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
    back() { ui.stack.pop(); render(); },
    toast(el) { toast(el.dataset.v, 'info'); },
    shopcat(el) { ui.cat = el.dataset.v; ui.tab = 'shop'; ui.stack = []; render(); },
    prod(el) { const p = AC.catById[el.dataset.v]; ui.pdraft = { variant: p.variants[0], qty: 1, install: false }; push('prod', { id: p.id }); },
    pvar(el) { ui.pdraft.variant = el.dataset.v; render(); },
    pqty(el) { ui.pdraft.qty = Math.max(1, ui.pdraft.qty + +el.dataset.v); render(); },
    pinst() { ui.pdraft.install = !ui.pdraft.install; render(); },
    quick(el) { const p = AC.catById[el.dataset.v]; addLine(p, p.variants[0], 1, false); toast(p.name + ' added to cart', 'cart'); render(); },
    addcart() { const p = AC.catById[ui.stack[ui.stack.length - 1].p.id], d = ui.pdraft; addLine(p, d.variant, d.qty, d.install); toast('Added to cart', 'cart'); ui.stack.pop(); render(); },
    cart() { push('cart'); },
    cqty(el) { const l = ui.cart[+el.dataset.i]; l.qty += +el.dataset.v; if (l.qty < 1) ui.cart.splice(+el.dataset.i, 1); render(); },
    cinst(el) { const l = ui.cart[+el.dataset.i]; l.install = !l.install; render(); },
    checkout() { ui.d.pm = ui.d.pm || 'cod'; push('checkout'); },
    pm(el) { ui.d.pm = el.dataset.v; render(); },
    place() {
      const c = cartCalc(), m = ui.d.pm || 'cod';
      const finish = () => {
        const id = S.act.placeOrder({ cust: ME, items: ui.cart.map(l => ({ pid: l.pid, qty: l.qty, price: AC.catById[l.pid].price, variant: l.variant })), subtotal: c.sub, inst: c.inst, discount: c.disc, delivery: c.delivery, install: ui.cart.some(l => l.install && AC.catById[l.pid].cat === 'ac'), addr: ui.d.caddr || me.addr, phone: ui.d.cphone || me.phone, pay: { method: m, status: m === 'cod' ? 'unpaid' : 'paid' } });
        ui.cart = []; ui.sheet = null; ui.stack = [{ s: 'done', p: { id } }]; ui.tab = 'orders'; ui.ot = 'shop'; render();
      };
      if (m === 'cod') finish(); else gate(m, c.total, finish);
    },
    order(el) { const s = { s: 'order', p: { id: el.dataset.v } }; if (el.dataset.replace) ui.stack = [s]; else ui.stack.push(s); render(); },
    ot(el) { ui.ot = el.dataset.v; render(); },
    book(el) { const s = AC.svcById[el.dataset.v]; ui.book = { svc: s.id, units: 1, ac: 'Split', slot: AC.slots[1], addr: me.addr, phone: me.phone, note: '', method: 'cod' }; push('book'); },
    bac(el) { ui.book.ac = el.dataset.v; render(); }, bslot(el) { ui.book.slot = el.dataset.v; render(); }, bpm(el) { ui.book.method = el.dataset.v; render(); },
    bunits(el) { ui.book.units = Math.max(1, Math.min(4, ui.book.units + +el.dataset.v)); render(); },
    confirm() {
      const b = ui.book, id = S.act.createJob({ cust: ME, svc: b.svc, units: b.units, ac: b.ac, slot: b.slot, note: b.note, addr: b.addr, phone: b.phone, method: b.method, discount: 100 });
      ui.stack = [{ s: 'track', p: { id } }]; ui.tab = 'orders'; ui.ot = 'book'; toast('Booking ' + id + ' sent to Shital', 'checkc'); render();
    },
    track(el) { ui.d.stars = 0; ui.d.rev = ''; push('track', { id: el.dataset.v }); },
    extra(el) { S.act.resolveExtra(el.dataset.id, el.dataset.v === 'yes', 'Customer'); toast(el.dataset.v === 'yes' ? 'Extra work approved' : 'Extra work declined'); },
    cancel(el) { S.act.cancel(el.dataset.id, 'Customer'); toast('Booking cancelled', 'info'); },
    paynow(el) { const j = S.job(el.dataset.id); gate(j.pay.method, S.jobTotal(j), () => { S.act.pay(j.id, j.pay.method); ui.sheet = null; render(); }); },
    star(el) { ui.d.stars = +el.dataset.v; render(); },
    rate(el) { S.act.rate(el.dataset.id, ui.d.stars, ui.d.rev || ''); toast('Thanks for your review'); },
    chat() { push('chat'); },
    send() { const v = (ui.d.chat || '').trim(); if (!v) return; ui.d.chat = ''; S.act.send(ME, 'customer', v); },
    quickmsg(el) { S.act.send(ME, 'customer', el.dataset.v); },
    auto() { const j = activeJob(); if (j) { S.auto(j.id); toast('Autopilot running', 'zap'); } },
    reset() { S.act.reset(); ui.stack = []; ui.cart = []; ui.tab = 'home'; render(); toast('Demo data reset'); }
  };
  function addLine(p, variant, qty, install) { const l = ui.cart.find(x => x.pid === p.id && x.variant === variant); if (l) { l.qty += qty; l.install = l.install || install; } else ui.cart.push({ pid: p.id, variant, qty, install }); }
  function gate(m, amount, done) { ui.sheet = { t: 'gate', m, amount, stage: 'wait' }; render(); setTimeout(() => { ui.sheet.stage = 'ok'; render(); setTimeout(done, 1000); }, 1700); }

  $app.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; const f = A[el.dataset.a]; if (f) f(el); });
  $app.addEventListener('input', e => { const k = e.target.dataset.b; if (!k) return; if (['addr', 'phone', 'note'].includes(k)) ui.book[k] = e.target.value; else ui.d[k] = e.target.value; });
  $app.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'f-chat') A.send(); });

  /* Notifications on live changes from admin / vendor / technician */
  S.subscribe((s, prev) => {
    s.jobs.filter(j => j.cust.id === ME).forEach(j => {
      const o = prev.jobs.find(x => x.id === j.id); if (!o) return; const t = AC.techById[j.techId], n = t ? t.name.split(' ')[0] : 'Technician';
      if (o.status !== j.status) {
        const m = { forwarded: 'Your request is with a partner team', assigned: n + ' is assigned to your job', accepted: n + ' confirmed your booking', ontheway: n + ' is on the way', arrived: n + ' has arrived', working: 'Work has started', completed: 'Job completed' }[j.status];
        if (m) toast(m, j.status === 'completed' ? 'checkc' : 'bell');
      }
      if (o.extra.status !== 'proposed' && j.extra.status === 'proposed') toast('Extra work needs your approval', 'alert');
    });
    s.orders.filter(x => x.cust === ME).forEach(x => { const o = prev.orders.find(y => y.id === x.id); if (o && o.status !== x.status) toast('Order ' + x.id + ': ' + x.status, 'box'); });
    const last = s.msgs[s.msgs.length - 1], pl = prev.msgs[prev.msgs.length - 1];
    if (last && (!pl || last.id !== pl.id) && last.thread === ME && last.from === 'admin') toast('New message from Shital Support', 'chat');
    render();
  });
  render();
})();
