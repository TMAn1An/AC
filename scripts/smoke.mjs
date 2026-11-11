// Loads every prototype page in headless Chromium and fails on console errors or uncaught exceptions.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 8099;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'prototype'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const pages = ['index.html', 'plan.html', 'costs.html', 'customer/index.html', 'technician/index.html', 'vendor/index.html', 'admin-app/index.html', 'admin/index.html'];
const browser = await chromium.launch();
let failed = false;
for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://localhost:${PORT}/${p}`);
  await page.waitForTimeout(1200);
  console.log(errors.length ? 'FAIL' : 'ok  ', p, errors.join(' | '));
  if (errors.length) failed = true;
  await page.close();
}
// End-to-end: customer books, admin assigns, technician completes.
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}/index.html`);
const result = await page.evaluate(async () => {
  const S = AC.store; S.act.reset();
  const id = S.act.createJob({ cust: 'C1', svc: 'ac-repair', slot: 'Today, 4-6 PM', method: 'cod', discount: 100 });
  S.act.assign(id, 'T1', 'Admin'); S.act.respond(id, true); S.act.startTrip(id); S.act.arrive(id); S.act.startWork(id);
  S.act.proposeExtra(id, [AC.parts[0]]); S.act.resolveExtra(id, true, 'Customer'); S.act.complete(id, true, S.job(id).otp);
  const j = S.job(id); return { status: j.status, total: S.jobTotal(j), paid: j.pay.status };
});
const ok = result.status === 'completed' && result.total === 1550 && result.paid === 'paid';
console.log(ok ? 'ok  ' : 'FAIL', 'workflow', JSON.stringify(result));
if (!ok) failed = true;
// Notification routing: who hears about an acceptance.
const routing = await page.evaluate(() => {
  const S = AC.store; S.act.reset();
  const aud = id => [...new Set(S.get().notifs.filter(n => n.job === id && n.kind === 'accepted').map(n => n.aud))].sort();
  const a = S.act.createJob({ cust: 'C1', svc: 'ac-repair', slot: 'x', method: 'cod', verified: true }); S.act.assign(a, 'T1', 'Admin'); S.act.respond(a, true);
  const b = S.act.createJob({ cust: 'C1', svc: 'ac-repair', slot: 'x', method: 'cod', verified: true }); S.act.forward(b, 'V1'); S.act.assign(b, 'T5', 'CoolTech Services'); S.act.respond(b, true);
  return { direct: aud(a), viaVendor: aud(b) };
});
const rok = JSON.stringify(routing.direct) === '["admin","cust:C1"]' && JSON.stringify(routing.viaVendor) === '["admin","cust:C1","vendor:V1"]';
console.log(rok ? 'ok  ' : 'FAIL', 'notification routing', JSON.stringify(routing));
if (!rok) failed = true;
// Rules added after client review: timeouts, completion code, override, extra work, wallet, KYC, unread.
const r2 = await page.evaluate(async () => {
  const S = AC.store, out = {}; S.act.reset(); const mkJob = () => S.act.createJob({ cust: 'C1', svc: 'ac-repair', slot: 'x', method: 'cod', verified: true });
  const a = mkJob(); S.act.assign(a, 'T1', 'Admin'); AC.config.OFFER_SECONDS = 0; await new Promise(r => setTimeout(r, 30)); S.act.expire(); AC.config.OFFER_SECONDS = 60;
  let j = S.job(a);
  out.timeout = j.status === 'requested' && j.tried.techs.includes('T1') && S.get().notifs.some(n => n.job === a && n.kind === 'timeout' && n.aud === 'admin');
  S.act.assign(a, 'T3', 'Admin'); S.act.respond(a, true); S.act.startTrip(a); S.act.arrive(a); S.act.startWork(a);
  out.wrongCode = S.act.complete(a, true, '0000') === false && S.job(a).status === 'working';
  S.act.requestExtraItem(a, 'Drain pipe'); out.priceNotif = S.get().notifs.some(n => n.job === a && n.kind === 'extra_req' && n.aud === 'admin');
  S.act.quoteExtra(a, 'Drain pipe', 900, 'Admin', true); out.quoted = S.job(a).extra.status === 'proposed' && S.get().extraCatalog.some(x => x.label === 'Drain pipe');
  S.act.resolveExtra(a, true, 'Customer');
  const before = S.wallet('T3');
  out.rightCode = S.act.complete(a, true, S.job(a).otp) === true && S.job(a).status === 'completed' && /Customer code verified/.test(S.job(a).tl.slice(-1)[0].note);
  const w = S.wallet('T3'); out.cash = w.cash === before.cash + S.jobTotal(S.job(a)); out.incentive = w.incentive > before.incentive;
  // deposit: cash only goes down when accepted
  const d = S.act.requestDeposit('T3', w.cash, 'bKash', 'TRX123'); out.pending = S.wallet('T3').cash === w.cash;
  S.act.acceptDeposit(d, 'Admin'); out.zeroed = S.wallet('T3').cash === 0;
  const wd = S.act.requestWithdraw('T3', 100, 'bKash', '01700000203'); out.withdraw = !!wd && S.wallet('T3').incentive === w.incentive - 100; S.act.payWithdraw(wd, 'Admin'); out.paid = S.get().withdrawals.find(x => x.id === wd).status === 'paid';
  // admin override and its log
  const b = S.act.createJob({ cust: 'C1', svc: 'ac-gas', slot: 'x', method: 'cod', verified: true }); S.act.assign(b, 'T1', 'Admin'); S.act.adminSetStatus(b, 'completed', 'App crashed');
  out.override = S.job(b).status === 'completed' && /Admin panel/.test(S.job(b).tl.slice(-1)[0].note);
  // KYC: technician added by a vendor is visible to that vendor and admin only
  const tid = S.act.addTech({ name: 'Test Tech', phone: '01712345678', area: 'mirpur', vendor: 'V1', kyc: { status: 'verified', nid: '*** 1234' } });
  out.kyc = AC.techById[tid].vendor === 'V1' && AC.techs.filter(t => t.vendor === 'V2').every(t => t.id !== tid);
  // unread: new booking is unread for admin, own action does not re-flag it
  const c = mkJob(); out.unread = S.unread('admin', 'jobs').includes(c); S.act.markSeen('admin', 'j:' + c); out.read = !S.unread('admin', 'jobs').includes(c); S.act.assign(c, 'T1', 'Admin'); out.ownAction = !S.unread('admin', 'jobs').includes(c);
  out.forVendor = !S.unread('vendor:V2', 'jobs').includes(c);
  // job chat: customer and technician can text only while the technician is on the job
  const jc = mkJob(); S.act.assign(jc, 'T1', 'Admin'); S.act.jobChat(jc, 'customer', 'too early');
  out.chatClosedEarly = S.chatMsgs('J:' + jc).length === 0;
  S.act.respond(jc, 'T1', true); S.act.jobChat(jc, 'customer', 'Gate is open'); const unT = S.chatUnread('tech:T1').includes('J:' + jc); S.act.jobChat(jc, 'tech', 'On my way');
  out.chatOpen = S.chatMsgs('J:' + jc).length === 2 && unT && !S.chatUnread('tech:T1').includes('J:' + jc);
  S.act.startTrip(jc); S.act.arrive(jc); S.act.startWork(jc); S.act.complete(jc, true, S.job(jc).otp, 'technician');
  const nChat = S.chatMsgs('J:' + jc).length; S.act.jobChat(jc, 'customer', 'after the job');
  out.chatClosedAfter = S.chatMsgs('J:' + jc).length === nChat;
  // dispatch help: assistant answers, unknown text gets one retry then a human agent, agent replies, resolve returns to the assistant
  S.act.dispatchSend('T2', 'How do I deposit my cash?'); out.botAnswers = S.chatMsgs('D:T2').some(m => m.from === 'bot' && /Deposit cash/.test(m.text)) && S.dispatchOf('T2').mode === 'bot';
  S.act.dispatchSend('T2', 'zzz qqq'); S.act.dispatchSend('T2', 'xyz plm'); out.botHandsOff = S.dispatchOf('T2').mode === 'waiting' && S.chatUnread('admin').includes('D:T2');
  S.act.dispatchAgent('T2', 'Hi, how can I help?', 'Joy Das'); out.agentJoins = S.dispatchOf('T2').mode === 'agent' && S.chatMsgs('D:T2').slice(-1)[0].from === 'agent' && S.chatUnread('tech:T2').includes('D:T2');
  S.act.dispatchResolve('T2', 'Joy Das'); out.resolved = S.dispatchOf('T2').mode === 'bot';
  S.act.dispatchSend('T4', 'urgent accident'); out.urgentHandoff = S.dispatchOf('T4').mode === 'waiting';
  // reschedule: allowed until the technician sets off, logged, technician told; blocked afterwards
  const rj = mkJob(); S.act.assign(rj, 'T1', 'Admin'); S.act.respond(rj, 'T1', true);
  out.reschedOk = S.act.reschedule(rj, 'Tomorrow, 2-4 PM', 'Customer') === true && S.job(rj).slot === 'Tomorrow, 2-4 PM' && S.job(rj).tl.some(e => e.k === 'rescheduled');
  S.act.startTrip(rj); out.reschedBlocked = S.act.reschedule(rj, 'Today, 2-4 PM', 'Customer') === false && S.job(rj).slot === 'Tomorrow, 2-4 PM';
  // service report: saved at completion, sets the next service date, feeds the care reminder
  S.act.arrive(rj); S.act.startWork(rj); S.act.complete(rj, true, S.job(rj).otp, 'technician', '', { checks: ['a', 'b'], total: 3, before: 1, after: 2, note: 'Skipped one step' });
  const rr = S.job(rj).report; out.reportSaved = !!rr && rr.checks.length === 2 && rr.total === 3 && rr.after === 2 && rr.nextDue > Date.now();
  out.careReminder = !!S.careFor(S.job(rj).cust.id) && S.careFor(S.job(rj).cust.id).job === rj;
  // warranty: one year from the covered job, claim is free labour, total is zero and paid on completion
  const wr = S.warranties('C1')[0]; out.warrantyActive = !!wr && wr.active && wr.daysLeft > 300 && wr.daysLeft <= 365;
  const wj = S.act.createJob({ svc: 'ac-repair', cust: 'C1', slot: 'Today, 4-6 PM', verified: true, warrantyOf: wr.id });
  out.warrantyFree = S.jobTotal(S.job(wj)) === 0 && S.job(wj).warrantyOf === wr.id && S.warranties('C1')[0].claims === 1;
  S.act.assign(wj, 'T1', 'Admin'); S.act.respond(wj, 'T1', true); S.act.startTrip(wj); S.act.arrive(wj); S.act.startWork(wj); S.act.complete(wj, false, S.job(wj).otp, 'technician');
  out.warrantyPaid = S.job(wj).status === 'completed' && S.job(wj).pay.status === 'paid';
  // one lead per job: an accepted job cannot be reassigned, a helper cannot be lead, and a declined technician can be assigned again
  const dj = mkJob(); S.act.assign(dj, 'T1', 'Admin'); S.act.respond(dj, false);
  out.declineNotifiesCustomer = S.get().notifs.some(n => n.job === dj && n.aud === 'cust:C1' && n.kind === 'declined');
  out.assignAgainAfterDecline = S.act.assign(dj, 'T1', 'Admin') === true && S.job(dj).techId === 'T1';
  S.act.respond(dj, true); out.noDoubleAssign = S.act.assign(dj, 'T2', 'Admin') === false && S.job(dj).techId === 'T1';
  // crew: helpers join by invitation, lead cannot be a helper, needs-helper clears when the helper joins
  S.act.setHelpers(dj, 1, 'Sumon'); out.needsHelper = S.needsHelper(S.job(dj)) === true;
  out.leadNotHelper = S.act.inviteHelper(dj, 'T1', 'Admin') === false;
  out.inviteHelper = S.act.inviteHelper(dj, 'T3', 'Admin') === true && S.get().notifs.some(n => n.aud === 'tech:T3' && n.kind === 'crew_invited');
  S.act.helperRespond(dj, 'T3', true); out.helperJoins = S.crewOn(S.job(dj)).length === 1 && !S.needsHelper(S.job(dj)) && S.get().notifs.some(n => n.aud === 'cust:C1' && n.kind === 'crew_joined');
  out.helperNotLead = S.act.assign(dj, 'T3', 'Admin') === false;
  // marketplace: a vendor product waits for approval, other vendors cannot edit it, vendors cannot remove, admin can remove
  const pid = S.act.addProduct('V4', { cat: 'ac', name: 'Smoke AC', price: 40000, stock: 3 });
  out.productPending = AC.catById[pid].status === 'pending' && !S.storeProducts().some(p => p.id === pid) && S.get().notifs.some(n => n.aud === 'admin' && n.kind === 'product');
  out.vendorScope = S.productsOf('V5').every(p => p.vendorId === 'V5') && S.act.editProduct(pid, 'V5', { price: 1 }) === false;
  S.act.approveProduct(pid, 'Admin'); out.productLive = S.storeProducts().some(p => p.id === pid) && S.get().notifs.some(n => n.aud === 'vendor:V4' && /approved/.test(n.text));
  S.act.setAvailable(pid, 'V4', false); out.unavailable = !S.canBuy(AC.catById[pid]) && S.storeProducts().some(p => p.id === pid);
  out.vendorCannotRemove = typeof S.act.vendorRemoveProduct === 'undefined' && S.act.setAvailable(pid, 'V5', true) === false;
  S.act.removeProduct(pid, 'Policy', 'Admin'); out.adminRemoves = !S.storeProducts().some(p => p.id === pid) && AC.catById[pid].status === 'removed';
  // commission: admin earns the goods rate on a vendor sale
  const oid = S.act.placeOrder({ cust: 'C1', items: [{ pid: 'ac1', qty: 1, price: AC.catById.ac1.price }], subtotal: AC.catById.ac1.price, discount: 0, delivery: 80, pay: { method: 'cod', status: 'unpaid' } });
  const sl = S.sales('V1').find(r => r.order === oid); out.goodsCommission = !!sl && sl.fee === Math.round(sl.gross * AC.config.GOODS_COMMISSION) && sl.net === sl.gross - sl.fee;
  // vendor name: one free change, then a request with a reason that admin decides
  out.renameOnce = S.act.renameVendor('V5', 'Heritage Bags Ltd') === true && AC.vendById.V5.name === 'Heritage Bags Ltd' && S.act.renameVendor('V5', 'Other') === false;
  out.renameNeedsReason = S.act.requestRename('V5', 'Heritage', '') === false;
  out.renameRequest = S.act.requestRename('V5', 'Heritage Home', 'New brand') === true && !!S.pendingRename('V5') && S.get().notifs.some(n => n.aud === 'admin' && /asks to change/.test(n.text));
  S.act.decideRename(S.get().renames[0].id, true, 'Admin'); out.renameApproved = AC.vendById.V5.name === 'Heritage Home' && !S.pendingRename('V5');
  return out;
});
const bad = Object.entries(r2).filter(([, v]) => v !== true).map(([k]) => k);
console.log(bad.length ? 'FAIL' : 'ok  ', 'rules', bad.length ? bad.join(', ') : Object.keys(r2).length + ' checks');
if (bad.length) failed = true;
await browser.close(); server.kill();
process.exit(failed ? 1 : 0);
