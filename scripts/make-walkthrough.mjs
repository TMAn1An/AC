// Records the client walkthrough video (1920x1080) by driving the five prototype apps in prototype/video/walkthrough.html.
// Needs the prototype served (PORT, default 8080) and ffmpeg.  Usage: PORT=8080 node scripts/make-walkthrough.mjs
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const PORT = process.env.PORT || 8080, out = 'marketing/out'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: out + '/raw-walk', size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage(); const logs = [];
page.on('pageerror', e => logs.push('PAGEERR ' + e.message));
await page.goto(`http://localhost:${PORT}/video/walkthrough.html`); await page.waitForTimeout(2500);
const F = k => page.frameLocator('#f-' + k), wait = ms => page.waitForTimeout(ms);
const frame = k => page.frames().find(f => f.url().includes(k === 'admin' ? '/admin/' : k === 'adminapp' ? '/admin-app/' : '/' + k + '/'));
const ev = (k, fn, arg) => frame(k).evaluate(fn, arg);
async function click(k, sel, after = 800) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const loc = F(k).locator(sel).first(); await loc.scrollIntoViewIfNeeded({ timeout: 3000 }); const b = await loc.boundingBox({ timeout: 3000 });
      if (b) { await page.evaluate(([x, y]) => V.cursor(x, y), [b.x + b.width / 2, b.y + b.height / 2]); await wait(attempt ? 150 : 700); await page.evaluate(() => V.fx()); }
      await loc.click({ timeout: 3500 }); break;
    } catch (e) { if (attempt) logs.push(`click ${k} ${sel}: ${String(e.message).split('\n')[0]}`); else await wait(400); }
  }
  await wait(after);
}
async function type(k, sel, text, delay = 120) { await click(k, sel, 200); try { await F(k).locator(sel).first().pressSequentially(text, { delay }); } catch (e) { logs.push(`type ${k} ${sel}`); } await wait(500); }
const say = async (a, b, ms = 2500) => { await page.evaluate(([x, y]) => V.cap(x, y), [a, b]); await wait(ms); };
const stepL = t => page.evaluate(x => V.step(x), t), show = (...k) => page.evaluate(x => V.show(x), k);
const FRAMES = 'customer technician vendor adminapp admin'.split(' ');

// Fresh data and a clean device
for (const k of FRAMES) { await ev(k, () => { try { localStorage.removeItem('shital.verified'); sessionStorage.clear(); } catch (e) { } }); }
await ev('customer', () => AC.store.act.reset()); await wait(800);

/* 0. Titles */
await page.evaluate(() => V.title('From a customer request to a finished job', 'One connected system. Five apps. Everyone sees what they need, live.', ['Customer app', 'Technician app', 'Vendor app', 'Admin app', 'Admin web']));
await wait(6500); await page.evaluate(() => V.untitle());

/* 1. Booking + OTP + admin sees it */
await show('customer', 'admin'); await stepL('1  Booking'); 
await say('The customer books a service', 'Fixed price, time slot, address. Pay after the job.', 1800);
await click('customer', '.tab[data-v=services]'); await click('customer', '[data-a=book][data-v=ac-cooling]', 1200);
await click('customer', '[data-a=bslot] >> nth=1', 500); await type('customer', '#f-note', 'AC is not cooling well', 70);
await click('customer', '[data-a=confirm]', 900);
await say('A one-time code verifies the phone', 'Fake orders are blocked before they reach the team.', 2200);
await type('customer', '#f-otp', '4829', 350); await wait(2600);
await say('Admin sees it instantly', 'A count appears on Bookings. Unread items are marked.', 2800);
await click('admin', '.nav a[data-v=bookings]', 1200); await click('admin', 'tbody tr.click >> nth=0', 1500);
await say('The nearest technicians are ranked by distance', 'If none is close, admin forwards to a vendor instead.', 3200);
await stepL('2  Dispatch'); await click('admin', '[data-a=assign][data-v=T1]', 1800); await click('admin', '.d-f [data-a=close]', 700);
await say('Assigned. The customer is told right away.', 'Admin keeps a full log of who assigned whom and when.', 2400);

/* 2. Technician accepts and drives */
await show('technician', 'customer', 'admin'); await stepL('3  Technician');
await say('The technician gets an offer with a timer', 'If nobody answers in 60 seconds, the job returns and admin can reassign.', 3400);
await click('technician', '.offer [data-a=accept]', 1200); 
await say('Accepted. Customer and admin see it at once.', '', 2200);
await click('technician', '[data-a=trip]', 1500);
await say('Live directions guide the technician', 'The customer and admin watch the same trip on the map. No paid map APIs.', 7500);

/* 3. Work, extra work, completion code */
await click('technician', '[data-a=arrive]', 1200); await click('technician', '[data-a=work]', 1200); await stepL('4  The job');
await click('technician', '[data-a=extra]', 1000);
await say('Extra work: pick a priced item', 'No office approval to wait for. The customer decides, admin is informed.', 3000);
await click('technician', '[data-a=xpart][data-v=X2]', 800); await click('technician', '[data-a=sendextra]', 1500);
await click('customer', '[data-a=extra][data-v=yes]', 1500);
await say('The customer approves in the app', '', 2000);
await click('technician', '[data-a=finish]', 1000);
await say('The job closes only with the customer’s code', 'Generated by our backend, shown in the customer app. Not an SMS.', 3400);
const otp = await ev('customer', () => AC.store.get().jobs[0].otp);
for (let i = 0; i < 6; i++) { try { await F('technician').locator('[data-a=ck]').nth(i).click({ timeout: 800 }); await wait(250); } catch (e) { break; } }
await click('technician', '[data-a=photo][data-v=before]', 400); await click('technician', '[data-a=photo][data-v=after]', 500);
await type('technician', '#f-code', otp, 300); await click('technician', '[data-a=cash]', 700); await click('technician', '[data-a=complete]', 2200);
await say('Completed. If the technician’s app fails, admin can complete or cancel and the log records where it was done.', '', 3800);

/* 4. Review + wallet */
await stepL('5  Review and wallet');
await ev('customer', () => { const v = document.getElementById('view'); v.scrollTop = 700; }); await wait(600);
await click('customer', '[data-a=star][data-k=overall][data-v="5"]', 300); await click('customer', '[data-a=star][data-k=work][data-v="5"]', 300); await click('customer', '[data-a=star][data-k=behavior][data-v="5"]', 300); await click('customer', '[data-a=star][data-k=punctuality][data-v="4"]', 300);
await click('customer', '[data-a=rate]', 1200);
await say('Ratings and feedback are private to admin', 'Technicians and vendors never see them.', 2600);
await click('admin', '.nav a[data-v=reviews]', 1800);
await click('technician', '[data-a=back]', 700); await click('technician', '.tab[data-v=earn]', 1200);
await say('The technician wallet', 'Cash collected stays on the balance until a deposit is accepted. Incentive is earned per paid job.', 3600);
await click('technician', '[data-a=depopen]', 900); await click('technician', '[data-a=depsubmit]', 1200);
await click('admin', '.nav a[data-v=collections]', 1500);
await say('Admin accepts the deposit', 'Only then does the technician’s cash go to zero.', 2600);
await click('admin', '[data-a=accdep] >> nth=0', 1800);
await click('technician', '[data-a=wdopen]', 900); await click('technician', '[data-a=wdsubmit]', 1200);
await click('admin', '[data-a=paywd] >> nth=0', 1800);
await say('Incentive withdrawal is paid out by finance', 'Every movement is in a ledger that can be audited.', 3000);

/* 5. Vendor flow */
await show('adminapp', 'vendor'); await stepL('6  Vendors');
await ev('customer', () => AC.store.act.createJob({ cust: 'C3', svc: 'ac-repair', slot: 'Today, 4-6 PM', method: 'cod', note: 'Indoor unit is leaking', verified: true }));
await ev('vendor', () => { sessionStorage.setItem('vendor.v', 'V2'); location.reload(); }); await wait(2500);
await say('No technician nearby? Forward to a vendor', 'Vendors have their own app and see only their own jobs.', 2800);
await click('adminapp', '.tab[data-v=jobs]', 900); await click('adminapp', '[data-a=seg][data-v=new]', 700); await click('adminapp', '[data-a=job] >> nth=0', 1500);
await click('adminapp', '[data-a=fwd][data-v=V2]', 1800);
await say('The vendor assigns one of their own technicians', 'If they do not reply in 15 minutes, admin can forward to another vendor.', 3000);
await click('vendor', '[data-a=assign] >> nth=0', 1000); await click('vendor', '[data-a=doassign] >> nth=0', 1800);

/* 6. Shop */
await show('customer', 'admin'); await stepL('7  Shop');
await ev('customer', () => { const c = document.querySelector('[data-a=back]'); });
await click('customer', '[data-a=back]', 600); await click('customer', '.tab[data-v=shop]', 800); await click('customer', '[data-a=opencats]', 700); await click('customer', '[data-a=shopcat][data-v=ac]', 900);
await say('Shop ACs, bags and local cosmetics', 'Add to cart or Buy now. Installation is an optional add-on with a discount.', 2600);
await click('customer', '[data-a=buynow][data-v=ac1] >> nth=0', 1200);
await say('Promo codes apply with one tap', 'Items can be removed or changed right in checkout.', 2400);
await click('customer', '[data-a=promopick][data-v=COOL10]', 900);
await click('customer', '[data-a=place]', 1800);
await click('customer', '[data-a=order] >> nth=0', 800);
await click('admin', '.nav a[data-v=orders]', 1000); await click('admin', 'tbody tr.click >> nth=0', 1200);
await say('Admin packs and ships with a courier partner', 'Delivery updates are added in one tap and appear in the customer timeline.', 2800);
await click('admin', '.drawer [data-a=adv]', 900); await click('admin', '.drawer [data-a=adv]', 900); await click('admin', '.drawer [data-a=courier]', 1500);
await say('No paid courier API required', 'Statuses come from admin now, and from the courier automatically if their API is enabled later.', 3200); await click('admin', '.d-f [data-a=close]', 700);

/* 7. Roles and technician onboarding */
await show('admin'); await stepL('8  Control');
await say('Staff roles with custom permissions', 'Choose exactly what each person can do.', 2600);
await click('admin', '.nav a[data-v=team]', 2400);
await click('admin', '.nav a[data-v=techs]', 1200);
await say('Technicians are verified before they can work', 'NID photos, a live NID check and a live selfie. The onboarder is responsible.', 3000);
await click('admin', '[data-a=addtech]', 900);
await type('admin', '#k-name', 'Kamal Hossain', 60); await type('admin', '#k-phone', '01712345678', 60); await type('admin', '#k-nid', '1990123456789', 60);
await click('admin', '[data-kyc=next]', 700); await click('admin', '[data-kyc=front]', 400); await click('admin', '[data-kyc=back]', 400); await click('admin', '[data-kyc=next]', 600);
await click('admin', '[data-kyc=runcheck]', 2600); await click('admin', '[data-kyc=next]', 600); await click('admin', '[data-kyc=runface]', 3600); await click('admin', '[data-kyc=next]', 600);
await click('admin', '[data-kyc=agree]', 500); await click('admin', '[data-kyc=submit]', 1800);
await say('Vendor technicians are visible to that vendor and admin only', 'Admin sees every technician and every assignment.', 3200);

/* 8. Close */
await page.evaluate(() => V.title('Everything in one live system', 'Faster dispatch. Fewer surprises. Full accountability.', ['Live tracking', 'Completion code', 'Verified technicians', 'Wallet and payouts', 'Roles and permissions']));
await wait(7000);
await ctx.close(); await browser.close();
const raw = fs.readdirSync(out + '/raw-walk').filter(f => f.endsWith('.webm')).map(f => out + '/raw-walk/' + f).sort().pop();
execSync(`ffmpeg -y -loglevel error -i "${raw}" -ss 2.2 -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -r 30 -movflags +faststart marketing/shital-client-walkthrough.mp4`);
console.log('issues:', logs.length ? '\n' + logs.join('\n') : 'none');
