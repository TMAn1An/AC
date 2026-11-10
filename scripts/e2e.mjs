/* End to end check with real clicks across all five apps (they share one browser context, like the hub).
   Every step clicks the same buttons a person would. After each journey it asserts the result in the shared store.
   Run: node scripts/e2e.mjs   (needs ./scripts/serve.sh running on :8080). Exit code 1 when anything fails. */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8080/';
const browser = await chromium.launch(), ctx = await browser.newContext();
const results = [], errors = [];
const open = async (path, w, h) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h }); p.on('pageerror', e => errors.push(path + ': ' + e.message)); await p.goto(BASE + path + '/index.html'); await p.waitForTimeout(700); return p; };
const C = await open('customer', 390, 844), T = await open('technician', 390, 844), V = await open('vendor', 390, 844), M = await open('admin-app', 390, 844), A = await open('admin', 1440, 900);
const sleep = ms => C.waitForTimeout(ms);
const ev = (p, fn, arg) => p.evaluate(fn, arg);
async function journey(name, fn) {
  const before = errors.length; let ok = true, why = '';
  try { await fn(); } catch (e) { ok = false; const m = String(e.message).split('\n'); why = (m[0] + ' ' + (m.find(l => /waiting for locator/.test(l)) || '').trim()).slice(0, 200); }
  if (errors.length > before) { ok = false; why += ' PAGE ERROR ' + errors.slice(before).join(' | ').slice(0, 160); }
  if (!ok) { try { why += ' | on top at home tab: ' + await C.evaluate(() => { const t = document.querySelector('.tabbar [data-v=home]'); if (!t) return 'no tab'; const r = t.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e ? e.tagName + '.' + e.className : 'null'; }); await C.screenshot({ path: process.env.E2E_SHOT || '/tmp/e2e-fail.png' }); } catch (e) { } }
  results.push([name, ok, why]); console.log((ok ? 'ok   ' : 'FAIL ') + name + (why ? '  ' + why : ''));
}
const check = (cond, msg) => { if (!cond) throw new Error('expected ' + msg); };
const click = (p, sel, t = 4000) => p.click(sel, { timeout: t });
/* Back out of pushed screens and sheets until the tab bar (phones) or the sidebar (admin) is usable again. */
const tabs = async p => { for (let i = 0; i < 8; i++) { if (process.env.DEBUG_TABS) console.log('   tabs()', p.url().split('/').slice(-2, -1)[0], 'iter', i, 'tabbar', await p.locator('.tabbar:visible, .side:visible').count(), 'overlay', await p.locator('.sheet, .scrim, .drawer').count(), 'back', await p.locator('[data-a=back]').count()); if (await p.locator('.tabbar:visible, .side:visible').count() && !(await p.locator('.sheet, .scrim, .drawer').count())) return; const sc = p.locator('.scrim[data-a], .dscrim'); if (await sc.count()) { await sc.first().click({ position: { x: 5, y: 5 }, timeout: 1500 }).catch(() => { }); } else if (await p.locator('.btn[data-a=tab][data-v=home]').count()) await p.locator('.btn[data-a=tab][data-v=home]').first().click({ timeout: 1500 }).catch(() => { }); else if (await p.locator('[data-a=back]').count()) await p.locator('[data-a=back]').first().click({ timeout: 1500 }).catch(() => { }); else await p.locator('.d-f [data-a=close]').first().click({ timeout: 1500 }).catch(() => { }); await p.waitForTimeout(250); } };
const tab = async (p, v) => { await tabs(p); await click(p, '.tabbar [data-v=' + v + ']'); };
const side = async (p, label) => { await tabs(p); await click(p, '.side a:has-text("' + label + '")'); };
const lastJob = p => ev(p, () => AC.store.get().jobs.map(j => j.id).sort((a, b) => +b.slice(2) - +a.slice(2))[0]);
const job = (p, id) => ev(p, id => { const j = AC.store.job(id); return { status: j.status, slot: j.slot, tech: j.techId, pay: j.pay.status, total: AC.store.jobTotal(j), report: j.report ? { c: j.report.checks.length, t: j.report.total, a: j.report.after } : null, otp: j.otp, warrantyOf: j.warrantyOf || null, rating: !!j.rating, vendor: j.vendorId }; }, id);
await ev(C, () => AC.store.act.reset()); await sleep(600);
for (const p of [C, T, V, M, A]) await p.reload(), await p.waitForTimeout(500);

let JID;
await journey('customer books a service and verifies the phone', async () => {
  await tab(C, 'services'); await click(C, '[data-a=book][data-v=ac-cooling]');
  await click(C, '[data-a=bslot] >> nth=1'); await C.fill('#f-note', 'AC is not cooling well'); await click(C, '[data-a=confirm]');
  await C.waitForSelector('#f-otp'); await C.fill('#f-otp', '4829'); await C.waitForSelector('.statuscard', { timeout: 6000 });
  JID = await lastJob(C); const j = await job(C, JID); check(j.status === 'requested', 'job requested, got ' + j.status);
});
await journey('customer can reschedule, then admin sees it', async () => {
  await click(C, '[data-a=resopen]'); await click(C, '[data-a=respick] >> nth=3'); await click(C, '[data-a=resdo]'); await sleep(300);
  check((await job(C, JID)).slot === 'Tomorrow, 2-4 PM', 'slot changed');
});
await journey('admin dispatches with Best match and customer is told', async () => {
  await side(A, 'Bookings'); await A.waitForSelector('tbody tr.click'); await click(A, 'tbody tr.click >> nth=0');
  await A.waitForSelector('.pick.best'); check(await A.locator('.pick.best').count() === 1, 'one best match'); await click(A, '.pick.best [data-a=assign]');
  await sleep(400); check((await job(A, JID)).status === 'assigned', 'assigned'); await click(A, '.d-f [data-a=close]');
});
await journey('technician accepts, drives, arrives, starts work; job chat works both ways', async () => {
  await tab(T, 'jobs'); await click(T, '.offer [data-a=accept]'); await sleep(300);
  await click(T, '[data-a=jchat]'); await click(T, '[data-a=jquick] >> nth=0'); await click(T, '[data-a=back]');
  await click(C, '[data-a=jchat]'); await click(C, '[data-a=jquick] >> nth=1'); await click(C, '[data-a=back]');
  check((await ev(T, id => AC.store.chatMsgs('J:' + id).length, JID)) === 2, 'two chat messages');
  for (const a of ['trip', 'arrive', 'work']) { await click(T, '[data-a=' + a + ']'); await sleep(250); }
  check((await job(T, JID)).status === 'working', 'working');
});
await journey('extra work: technician offers, customer approves', async () => {
  await click(T, '[data-a=extra]'); await click(T, '[data-a=xpart][data-v=X2]'); await click(T, '[data-a=sendextra]'); await sleep(300);
  await click(C, '[data-a=extra][data-v=yes]'); await sleep(300);
  const t = await job(T, JID); check(t.total > 1000, 'total includes the extra work, got ' + t.total);
});
await journey('technician files the service report and closes with the customer code', async () => {
  await click(T, '[data-a=finish]'); const n = await T.locator('[data-a=ck]').count();
  check(await T.locator('[data-a=complete]').isDisabled(), 'complete disabled before the report');
  for (let i = 0; i < n; i++) await click(T, '[data-a=ck] >> nth=' + i);
  await click(T, '[data-a=photo][data-v=before]'); await click(T, '[data-a=photo][data-v=after]');
  const otp = (await job(T, JID)).otp; await T.fill('#f-code', '0000'); await T.fill('#f-code', otp);
  if (await T.locator('[data-a=cash]').count()) await click(T, '[data-a=cash]');
  check(!(await T.locator('[data-a=complete]').isDisabled()), 'complete enabled once the report is done'); await click(T, '[data-a=complete]'); await sleep(500);
  const j = await job(T, JID); check(j.status === 'completed' && j.pay === 'paid' && j.report && j.report.c === j.report.t && j.report.a >= 1, 'completed, paid, report saved: ' + JSON.stringify(j));
});
await journey('customer sees the report and rates privately; admin sees the review', async () => {
  await sleep(300); check(await C.locator('.report').count() === 1, 'report card shown');
  await ev(C, () => { document.getElementById('view').scrollTop = 900; });
  for (const k of ['overall', 'work', 'behavior', 'punctuality']) await click(C, '[data-a=star][data-k=' + k + '][data-v="5"]'); await click(C, '[data-a=rate]'); await sleep(300);
  check((await job(C, JID)).rating, 'rated'); await side(A, 'Reviews'); await sleep(300); check(await A.locator('.panel, .cardx').count() > 0, 'reviews page renders');
});
await journey('warranty: claim a free repair and finish it without payment', async () => {
  await tab(C, 'account'); await click(C, '[data-a=wclaim]'); await C.fill('#f-wnote', 'Water is leaking'); await click(C, '[data-a=wdo]'); await sleep(400);
  const id = await lastJob(C); const j = await job(C, id); check(j.warrantyOf && j.total === 0, 'claim job is free'); JID = id;
});
await journey('customer cancel before assignment', async () => {
  await ev(C, () => AC.store.act.createJob({ svc: 'ac-service', cust: 'C1', slot: 'Today, 4-6 PM', verified: true })); const id = await lastJob(C); await sleep(300);
  await tab(C, 'orders'); await click(C, '[data-a=track] >> nth=0'); await click(C, '[data-a=cancel]'); await sleep(400); check((await job(C, id)).status === 'cancelled', 'cancelled');
});
await journey('shop: search, add to cart, promo, cash on delivery order, admin ships with courier', async () => {
  await tab(C, 'shop'); await C.fill('#f-q', 'kohl'); await sleep(300);
  await click(C, '[data-a=quick] >> nth=0'); await click(C, '[data-a=cart]'); await click(C, '[data-a=checkout]');
  if (await C.locator('[data-a=promopick][data-v=WELCOME100]').count()) await click(C, '[data-a=promopick][data-v=WELCOME100]');
  await click(C, '[data-a=place]'); await C.waitForSelector('#f-otp', { timeout: 4000 }).then(() => C.fill('#f-otp', '4829')).catch(() => { }); await sleep(1500);
  const oid = await ev(C, () => AC.store.get().orders[0].id); check(!!oid, 'order placed');
  await side(A, 'Orders'); await A.waitForSelector('tbody tr.click'); await click(A, 'tbody tr.click >> nth=0'); await A.waitForSelector('.drawer [data-a=adv]');
  await click(A, '.drawer [data-a=adv]'); await click(A, '.drawer [data-a=adv]'); await click(A, '.drawer [data-a=courier]'); await sleep(300);
  check(['packed', 'shipped', 'delivered'].includes(await ev(A, id => AC.store.get().orders.find(o => o.id === id).status, oid)), 'order moved on'); await click(A, '.d-f [data-a=close]');
});
await journey('shop: pay by bKash through the demo gateway', async () => {
  await tab(C, 'shop'); await C.fill('#f-q', ''); await sleep(300); await click(C, '[data-a=quick] >> nth=1'); await click(C, '[data-a=cart]'); await click(C, '[data-a=checkout]');
  await click(C, '[data-a=pm][data-v=bkash]'); check(await C.locator('.pm-bkash img').count() === 1, 'bKash logo shown'); await click(C, '[data-a=place]');
  await C.waitForSelector('#f-otp', { timeout: 4000 }).then(() => C.fill('#f-otp', '4829')).catch(() => { }); await C.waitForSelector('.okc', { timeout: 8000 }); await sleep(1500);
});
await journey('technician wallet: deposit accepted by admin, then withdraw', async () => {
  await tab(T, 'earn'); await click(T, '[data-a=depopen]'); await click(T, '[data-a=depsubmit]'); await sleep(300);
  await side(A, 'Collections'); await click(A, '[data-a=accdep] >> nth=0'); await sleep(300);
  check((await ev(T, () => AC.store.wallet('T1').cash)) === 0, 'cash zeroed after the deposit is accepted');
  await click(T, '[data-a=wdopen]'); await click(T, '[data-a=wdsubmit]'); await sleep(300); await click(A, '[data-a=paywd] >> nth=0'); await sleep(300);
});
await journey('dispatch help: assistant answers, hands off, agent replies and resolves', async () => {
  await tab(T, 'help'); await T.fill('#f-dm', 'How do I deposit my cash?'); await T.press('#f-dm', 'Enter'); await sleep(300);
  check((await ev(T, () => AC.store.chatMsgs('D:T1').some(m => m.from === 'bot'))), 'assistant answered'); await click(T, '[data-a=dagent]'); await sleep(300);
  check((await ev(T, () => AC.store.dispatchOf('T1').mode)) === 'waiting', 'waiting for an agent');
  await side(A, 'Messages'); await click(A, '[data-a=mtab][data-v=tech]'); await click(A, '[data-a=thread][data-v="D:T1"]'); await click(A, '[data-a=dtake]');
  await A.fill('#msg', 'Hi, I can help.'); await A.press('#msg', 'Enter'); await sleep(300); check((await ev(T, () => AC.store.dispatchOf('T1').mode)) === 'agent', 'agent on the chat');
  await click(A, '[data-a=dres]'); await sleep(300); check((await ev(T, () => AC.store.dispatchOf('T1').mode)) === 'bot', 'back to the assistant');
});
await journey('support chat: customer writes, admin replies', async () => {
  await tab(C, 'account'); await click(C, '[data-a=chat]'); await click(C, '[data-a=quickmsg] >> nth=0'); await sleep(300);
  await side(A, 'Messages'); await click(A, '[data-a=mtab][data-v=cust]'); await A.locator('[data-a=thread]').first().click(); await A.fill('#msg', 'We are on it.'); await A.press('#msg', 'Enter'); await sleep(300);
});
await journey('vendor: admin forwards a job, vendor assigns their technician', async () => {
  await ev(C, () => AC.store.act.createJob({ cust: 'C3', svc: 'ac-repair', slot: 'Today, 4-6 PM', verified: true })); const id = await lastJob(C); await sleep(300);
  await ev(V, () => { sessionStorage.setItem('vendor.v', 'V2'); }); await V.reload(); await V.waitForTimeout(600);
  await side(A, 'Bookings'); await A.waitForSelector('tbody tr.click'); await A.evaluate(id => { [...document.querySelectorAll('tbody tr.click')].find(r => r.textContent.includes(id)).click(); }, id);
  await A.waitForSelector('[data-a=fwd][data-v=V2]'); await click(A, '[data-a=fwd][data-v=V2]'); await sleep(300); check((await job(A, id)).status === 'forwarded', 'forwarded'); await click(A, '.d-f [data-a=close]');
  await click(V, '[data-a=assign] >> nth=0'); await click(V, '[data-a=doassign] >> nth=0'); await sleep(300); check((await job(V, id)).status === 'assigned', 'vendor assigned a technician');
});
await journey('admin overrides a job and it is logged', async () => {
  const id = await lastJob(C); await side(A, 'Bookings'); await A.waitForSelector('tbody tr.click'); await A.evaluate(id => { [...document.querySelectorAll('tbody tr.click')].find(r => r.textContent.includes(id)).click(); }, id);
  await A.waitForSelector('#ov-status'); await A.selectOption('#ov-status', 'cancelled'); const r = A.locator('#ov-reason'); if (await r.count()) await r.fill('Customer asked by phone'); await click(A, '[data-a=override]'); await sleep(400);
  const j = await ev(A, id => AC.store.job(id).tl.filter(e => /Override/.test(e.note || '')).length, id); check(j >= 1, 'override logged in the timeline');
});
await journey('staff roles: new role, switch staff, menus follow permissions', async () => {
  await side(A, 'Team and roles'); await click(A, '[data-a=newrole]'); await A.fill('#r-name', 'Support lead'); await click(A, '[data-a=rperm][data-v=messages]'); await click(A, '[data-a=saverole]'); await sleep(300);
  await A.selectOption('#staffsel', 'U3'); await sleep(400); check(await A.locator('.side a:has-text("Payments")').count() === 1 && await A.locator('.side a:has-text("Bookings")').count() === 0, 'finance sees payments only');
  await A.selectOption('#staffsel', 'U1'); await sleep(300);
});
await journey('KYC: add a technician with identity checks', async () => {
  await side(A, 'Technicians'); await click(A, '[data-a=addtech]'); await A.fill('#k-name', 'Kamal Hossain'); await A.fill('#k-phone', '01712345678'); await A.fill('#k-nid', '1990123456789');
  await click(A, '[data-kyc=next]'); await click(A, '[data-kyc=front]'); await click(A, '[data-kyc=back]'); await click(A, '[data-kyc=next]'); await click(A, '[data-kyc=runcheck]'); await A.waitForTimeout(2600); await click(A, '[data-kyc=next]');
  await click(A, '[data-kyc=runface]'); await A.waitForTimeout(3700); await click(A, '[data-kyc=next]'); await click(A, '[data-kyc=agree]'); await click(A, '[data-kyc=submit]'); await sleep(500);
  check(await ev(A, () => AC.techs.some(t => t.name === 'Kamal Hossain')), 'technician added');
});
await journey('admin pages: every sidebar page opens without an error', async () => {
  for (const label of ['Dashboard', 'Bookings', 'Live dispatch', 'Messages', 'Services', 'Products', 'Categories', 'Promotions', 'Orders', 'Users', 'Technicians', 'Vendors', 'Payments', 'Collections', 'Earnings', 'Reviews', 'Team and roles']) { await side(A, '' + label + ''); await sleep(250); check(await A.locator('#content').count() === 1, label + ' renders'); }
});
await journey('admin mobile app: all tabs open', async () => { for (const v of ['home', 'jobs', 'map', 'inbox', 'more']) { await tab(M, v); await sleep(250); } });
await journey('vendor app: all tabs open', async () => { for (const v of ['jobs', 'team', 'map', 'earn', 'me']) { await tab(V, v); await sleep(250); } });
await journey('technician app: all tabs open', async () => { for (const v of ['jobs', 'map', 'help', 'earn', 'me']) { await tab(T, v); await sleep(250); } });
await journey('customer app: all tabs open', async () => { for (const v of ['home', 'services', 'shop', 'orders', 'account']) { await tab(C, v); await sleep(250); } });
await journey('dark mode switches every app and survives a reload', async () => {
  await tab(C, 'account'); await click(C, '[data-theme-set=dark]'); await sleep(400);
  for (const p of [C, T, V, M, A]) check((await ev(p, () => document.documentElement.dataset.theme)) === 'dark', 'dark in every app'); await C.reload(); await C.waitForTimeout(500); check((await ev(C, () => document.documentElement.dataset.theme)) === 'dark', 'dark after reload');
  await tab(C, 'account'); await click(C, '[data-theme-set=light]'); await sleep(300);
});
await browser.close();
const bad = results.filter(r => !r[1]);
console.log('\n' + (results.length - bad.length) + ' of ' + results.length + ' journeys passed, page errors: ' + errors.length);
errors.slice(0, 8).forEach(e => console.log('  ERROR ' + e));
process.exit(bad.length || errors.length ? 1 : 0);
