// Loads every prototype page in headless Chromium and fails on console errors or uncaught exceptions.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 8099;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'prototype'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const pages = ['index.html', 'plan.html', 'customer/index.html', 'technician/index.html', 'vendor/index.html', 'admin-app/index.html', 'admin/index.html'];
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
  S.act.proposeExtra(id, [AC.parts[0]]); S.act.resolveExtra(id, true, 'Customer'); S.act.complete(id, true);
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
await browser.close(); server.kill();
process.exit(failed ? 1 : 0);
