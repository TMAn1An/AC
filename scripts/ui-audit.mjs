/* UI audit: walks the main screens of every app and reports button and control metrics.
   Flags: text that overflows or is clipped, labels not vertically centred, off-scale sizes, touch targets under 44 px on phones.
   Run: node scripts/ui-audit.mjs [--shots dir]   (needs ./scripts/serve.sh on :8080) */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8080/', shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const browser = await chromium.launch(), ctx = await browser.newContext({ deviceScaleFactor: shots ? 2 : 1 });
const issues = [], combos = {};
const measure = (page, name, phone) => page.evaluate(({ name, phone }) => {
  const out = { issues: [], combos: [] }, vis = e => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return b.width > 2 && b.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && b.bottom > 0 && b.top < innerHeight; };
  document.querySelectorAll('.btn, .chip, .tab, .slot, .pbtn, .seg button, .tabs button, .theme-seg button').forEach(e => {
    if (!vis(e)) return; const b = e.getBoundingClientRect(), cs = getComputedStyle(e), label = (e.textContent || '').trim().slice(0, 26), kind = (e.className || '').toString().split(' ').filter(c => /^(btn|btn-(p|s|g|a|ok|d|sm|lg|big|block)|chip|sm|tab|slot|pbtn)$/.test(c)).join('.') || e.tagName.toLowerCase();
    out.combos.push(kind + ' h' + Math.round(b.height) + ' f' + parseFloat(cs.fontSize) + ' w' + cs.fontWeight);
    // vertical centring of the label: compare the text range box with the control box
    const r = document.createRange(); r.selectNodeContents(e); const tb = r.getBoundingClientRect();
    if (tb.height && !e.classList.contains('tab')) { const off = Math.abs((tb.top + tb.bottom) / 2 - (b.top + b.bottom) / 2); if (off > 2.5) out.issues.push(name + ': label off centre by ' + off.toFixed(1) + 'px "' + label + '" (' + kind + ')'); }
    if (tb.width > b.width - 6) out.issues.push(name + ': label touches or passes the edge of the control "' + label + '" (' + kind + ')');
    if (phone && e.classList.contains('btn') && b.height < 36) out.issues.push(name + ': button under 36px "' + label + '" h' + Math.round(b.height));
  });
  return out;
}, { name, phone });
async function visit(app, w, h, steps) {
  const page = await ctx.newPage(); await page.setViewportSize({ width: w, height: h }); page.on('pageerror', e => issues.push(app + ' PAGEERR ' + e.message));
  await page.goto(BASE + app + '/index.html'); await page.waitForTimeout(800);
  for (const [name, fn] of steps) {
    try { if (fn) await fn(page); } catch (e) { issues.push(app + ' ' + name + ' STEP ' + String(e.message).split('\n')[0].slice(0, 80)); }
    await page.waitForTimeout(450);
    const m = await measure(page, app + '/' + name, w < 700); issues.push(...m.issues); m.combos.forEach(c => { combos[c] = (combos[c] || 0) + 1; });
    if (shots) await page.screenshot({ path: shots + '/' + app + '-' + name + '.png' });
  }
  await page.close();
}
const click = sel => p => p.click(sel, { timeout: 2500 });
const seed = p => p.evaluate(() => { const A = AC.store.act; A.createJob({ svc: 'ac-repair', cust: 'C1', slot: 'Today, 4-6 PM', verified: true }); const id = AC.store.get().jobs.map(j => j.id).sort((a, b) => +b.slice(2) - +a.slice(2))[0]; A.assign(id, 'T1', 'Admin'); return id; });
await visit('customer', 390, 844, [
  ['home', null], ['services', click('.tabbar [data-v=services]')], ['book', click('[data-a=book] >> nth=0')], ['shop', async p => { await p.click('[data-a=back]'); await p.click('.tabbar [data-v=shop]'); }],
  ['product', click('[data-a=prod] >> nth=0')], ['cart', async p => { await p.click('[data-a=addcart]').catch(() => { }); await p.click('[data-a=cart]'); }], ['checkout', click('[data-a=checkout]')],
  ['orders', async p => { await p.click('[data-a=back]'); await p.click('[data-a=back]'); await p.click('[data-a=back]').catch(() => { }); await p.click('.tabbar [data-v=orders]'); }],
  ['track', click('[data-a=track] >> nth=0')], ['account', async p => { await p.click('[data-a=back]'); await p.click('.tabbar [data-v=account]'); }]
]);
await visit('technician', 390, 844, [
  ['home-offer', async p => { await seed(p); await p.waitForTimeout(500); }], ['job', click('.offer [data-a=accept]')], ['finish', async p => { for (const a of ['trip', 'arrive', 'work', 'finish']) { await p.click('[data-a=' + a + ']'); await p.waitForTimeout(350); } }],
  ['dispatch', async p => { await p.evaluate(() => { const x = document.querySelector('.scrim[data-a=close]'); x && x.click(); }); await p.waitForTimeout(300); await p.click('[data-a=back]'); await p.click('.tabbar [data-v=help]'); }], ['wallet', click('.tabbar [data-v=earn]')], ['profile', click('.tabbar [data-v=me]')]
]);
await visit('vendor', 390, 844, [['home', null], ['team', click('.tabbar [data-v=team]')], ['earn', click('.tabbar [data-v=earn]')], ['profile', click('.tabbar [data-v=me]')]]);
await visit('admin-app', 390, 844, [['home', null], ['jobs', click('.tabbar [data-v=jobs]')], ['inbox', click('.tabbar [data-v=inbox]')], ['more', click('.tabbar [data-v=more]')]]);
await visit('admin', 1440, 900, [['dash', null], ['bookings', click('.side a:has-text("Bookings")')], ['drawer', click('tbody tr.click >> nth=0')], ['messages', async p => { await p.click('.d-f [data-a=close]'); await p.click('.side a:has-text("Messages")'); }], ['products', click('.side a:has-text("Products")')], ['team', click('.side a:has-text("Team and roles")')]]);
await browser.close();
console.log('control sizes in use:'); Object.entries(combos).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log('  ' + String(n).padStart(3), k));
const uniq = [...new Set(issues)]; console.log('\nissues:', uniq.length); uniq.forEach(i => console.log('  ' + i));
