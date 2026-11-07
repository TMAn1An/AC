/* Click crawler: opens every app, seeds jobs in many states, then clicks through every [data-a] control at random.
   Reports page errors, controls that did nothing (dead clicks), controls covered by another element, and handlers that do not exist.
   Run: node scripts/crawl.mjs [steps-per-app]   (needs ./scripts/serve.sh running on :8080) */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/usr/local/lib/node_modules/playwright')); }
const STEPS = +process.argv[2] || 350, BASE = process.env.BASE || 'http://localhost:8080/';
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const APPS = [['customer', 430, 880], ['technician', 430, 880], ['vendor', 430, 880], ['admin-app', 430, 880], ['admin', 1440, 900]];
const SKIP = new Set(['reset', 'cancelall', 'clearhistory']);
const browser = await chromium.launch();
const ctx = await browser.newContext();
const report = { errors: [], dead: {}, covered: {}, total: 0 };

async function seedJobs(page) {
  await page.evaluate(() => {
    const S = AC.store, A = S.act, svc = AC.services;
    const mk = (i) => { A.createJob({ svc: svc[i % svc.length].id, cust: 'C1', slot: 'Today, 4 PM' }); const js = S.get().jobs; return js[js.length - 1].id; };
    const a = mk(0); A.assign(a, 'T1', 'admin');
    const b = mk(1); A.assign(b, 'T1', 'admin'); A.respond(b, 'T1', true); A.startTrip(b);
    const c = mk(2); A.assign(c, 'T2', 'admin'); A.respond(c, 'T2', true); A.startTrip(c); A.arrive(c); A.startWork(c);
    const d = mk(3); A.assign(d, 'T3', 'admin'); A.respond(d, 'T3', true); A.startTrip(d); A.arrive(d); A.startWork(d);
    try { A.proposeExtra(d, [{ label: 'Capacitor', price: 600 }]); } catch (e) { }
    const e = mk(4); try { A.forward(e, AC.vendors[0].id, 'admin'); } catch (x) { }
    mk(5);
  });
}

async function crawl(name, w, h) {
  const page = await ctx.newPage(); await page.setViewportSize({ width: w, height: h });
  page.on('pageerror', e => report.errors.push(name + ': ' + e.message.slice(0, 200)));
  page.on('dialog', d => d.dismiss());
  await page.goto(BASE + name + '/index.html'); await page.waitForTimeout(700);
  await seedJobs(page); await page.waitForTimeout(400);
  const handlers = await page.evaluate(() => null);
  for (let i = 0; i < STEPS; i++) {
    const pick = await page.evaluate((r) => {
      const vis = e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 2 && b.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth; };
      const els = [...document.querySelectorAll('[data-a]')].filter(e => vis(e) && !e.disabled);
      if (!els.length) return null;
      const e = els[Math.floor(r * els.length)];
      document.querySelectorAll('[data-pick]').forEach(x => x.removeAttribute('data-pick')); e.setAttribute('data-pick', '1');
      const b = e.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, top = document.elementFromPoint(cx, cy);
      return { a: e.dataset.a, v: e.dataset.v || '', t: (e.textContent || '').trim().slice(0, 28), cx, cy, covered: !(top && (top === e || e.contains(top))), cov: top ? top.tagName + '.' + top.className : 'null' };
    }, rnd());
    if (!pick) { await page.evaluate(() => { const t = document.querySelector('.tabbar .tab, .side a'); t && t.click(); }); continue; }
    if (SKIP.has(pick.a)) continue;
    const snap = () => page.evaluate(() => document.body.innerHTML.length + '|' + JSON.stringify(AC.store.get()).length + '|' + document.body.innerHTML.slice(0, 4000).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
    const before = await snap(); report.total++;
    // fill text inputs a click may need
    if (pick.covered) { const k = name + ' ' + pick.a + ' [' + pick.t + '] covered by ' + pick.cov; report.covered[k] = (report.covered[k] || 0) + 1; }
    try { await page.mouse.click(pick.cx, pick.cy, { delay: 40 }); } catch (e) { }
    await page.waitForTimeout(90);
    // OTP sheet: supply the demo code
    await page.evaluate(() => { const o = document.getElementById('f-otp'); if (o) { o.value = '4829'; o.dispatchEvent(new Event('input', { bubbles: true })); } });
    await page.waitForTimeout(60);
    const after = await snap();
    if (before === after && !pick.covered) { const k = name + ' ' + pick.a + ' ' + pick.v + ' [' + pick.t + ']'; report.dead[k] = (report.dead[k] || 0) + 1; }
  }
  await page.close();
}
for (const [n, w, h] of APPS) { process.stdout.write('crawl ' + n + '... '); await crawl(n, w, h); console.log('done'); }
await browser.close();
console.log('\nclicks', report.total, ' page errors', report.errors.length);
[...new Set(report.errors)].forEach(e => console.log('  ERROR', e));
const deads = Object.entries(report.dead).sort((a, b) => b[1] - a[1]);
console.log('dead clicks (did nothing):', deads.length); deads.slice(0, 60).forEach(([k, n]) => console.log('  ', n, k));
const cov = Object.entries(report.covered); console.log('covered controls:', cov.length); cov.slice(0, 30).forEach(([k, n]) => console.log('  ', n, k));
process.exit(report.errors.length ? 1 : 0);
