// Records the FULL client walkthrough (1920x1080): every role and every admin module. Writes marketing/audio/timeline.json with the time of every caption.
// Needs the prototype served (PORT, default 8080) and ffmpeg.  Usage: PORT=8080 node scripts/make-full-video.mjs
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const PORT = process.env.PORT || 8080, out = 'marketing/out'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: out + '/raw-full', size: { width: 1920, height: 1080 } } });
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
const T0 = Date.now(), TL = []; const now = () => Math.max(0, (Date.now() - T0) / 1000 - 2.2);
let IDX = 0;
const say = async (a, b, ms = 2500) => { const n = ++IDX; TL.push({ n, t: +now().toFixed(1), kind: 'caption', a, b }); await page.evaluate(([x, y, n]) => { V.cap(x, y); V.mark(n); }, [a, b, n]); await wait(ms); };
const stepL = t => { const n = ++IDX; TL.push({ n, t: +now().toFixed(1), kind: 'section', a: t }); return page.evaluate(([x, n]) => { V.step(x); V.mark(n); }, [t, n]); }, show = (...k) => page.evaluate(x => V.show(x), k);
const FRAMES = 'customer technician vendor adminapp admin'.split(' ');


// Fresh data and a clean device
for (const k of FRAMES) { await ev(k, () => { try { localStorage.removeItem('shital.verified'); sessionStorage.clear(); } catch (e) { } }); }
await ev('customer', () => AC.store.act.reset()); await wait(800);
const sel = async (k, s, v) => { try { await F(k).locator(s).first().selectOption(v); } catch (e) { logs.push('select ' + s); } await wait(900); };
const nav = (p, ms = 1700) => click('admin', `.nav a[data-v=${p}]`, ms);

/* 0. Title */
await page.evaluate(() => V.title('NEW: sell, book and dispatch in one live system', 'Air conditioners, bags and local cosmetics, plus field service across Dhaka. Five apps, one workflow.', ['Customer app', 'Technician app', 'Vendor app', 'Admin app', 'Admin web']));
{ const n = ++IDX; TL.push({ n, t: +now().toFixed(1), kind: 'section', a: 'Title' }); await page.evaluate(n => V.mark(n), n); } await wait(7000); await page.evaluate(() => V.untitle());

/* 1. Customer app tour */
await show('customer'); await stepL('1  Customer app');
await say('The customer app', 'Three sections: air conditioners, bags and local cosmetics. A first-purchase offer is always visible.', 4200);
await click('customer', '.tab[data-v=services]', 1800);
await say('Services with fixed prices', 'AC repair, cooling problem, servicing, gas refill, installation and relocation.', 3800);
await click('customer', '.tab[data-v=shop]', 1200);
await say('Search, categories and sorting', 'A category menu and a filter sheet keep the shop clean.', 2200);
await click('customer', '[data-a=opencats]', 1200); await click('customer', '[data-a=shopcat][data-v=bag]', 1400);
await click('customer', '[data-a=opensort]', 1000); await click('customer', '[data-a=sort][data-v=low]', 1600);
await click('customer', '[data-a=shopcat][data-v=all]', 800);
await say('Add to cart or Buy now', 'Heart a product to save it. Everything is in plain taka.', 3000);
await click('customer', '.tab[data-v=account]', 1400);
await say('Personal history stays on the phone', 'Searches, products viewed and orders are kept on this device only.', 3800);
await click('customer', '[data-a=history]', 1800); await click('customer', '[data-a=back]', 700); await click('customer', '.tab[data-v=home]', 800);

/* 2. Booking + OTP + admin sees it */
await show('customer', 'admin'); await stepL('2  Booking');
await say('The customer books a service', 'Fixed price, time slot, address. Pay after the job.', 2600);
await click('customer', '.tab[data-v=services]', 700); await click('customer', '[data-a=book][data-v=ac-cooling]', 1200);
await click('customer', '[data-a=bslot] >> nth=1', 500); await type('customer', '#f-note', 'AC is not cooling well', 70);
await click('customer', '[data-a=confirm]', 900);
await say('A one-time code verifies the phone', 'Fake orders are blocked before they reach the team.', 2600);
await type('customer', '#f-otp', '4829', 350); await wait(2600);
await say('Admin sees it instantly', 'A count appears on Bookings. Unread items are marked and turn read when opened.', 3600);
await nav('bookings', 1200); await click('admin', 'tbody tr.click >> nth=0', 1500);
await stepL('3  Dispatch');
await say('The nearest technicians are ranked by distance', 'If none is close, admin forwards to a vendor instead.', 3800);
await click('admin', '[data-a=assign][data-v=T1]', 1800); await click('admin', '.d-f [data-a=close]', 700);
await say('Assigned. The customer is told right away.', 'Every action is logged with who did it and when.', 3000);
await nav('map', 1800);
await say('Live dispatch map', 'Technicians and vendors on one map. Moving markers show real positions.', 4200);

/* 3. Technician */
await show('technician', 'customer', 'admin'); await stepL('4  Technician');
await say('The technician gets an offer with a timer', 'If nobody answers in 60 seconds, the job returns and admin can reassign.', 4200);
await click('technician', '.offer [data-a=accept]', 1200);
await say('Accepted. Customer and admin see it at once.', '', 2600);
await click('technician', '[data-a=trip]', 1500);
await say('Live directions guide the technician', 'The customer and admin watch the same trip on the map. No paid map service.', 8500);

/* 4. Work, extra, completion */
await click('technician', '[data-a=arrive]', 1200); await click('technician', '[data-a=work]', 1200); await stepL('5  The job');
await click('technician', '[data-a=extra]', 1000);
await say('Extra work: pick a priced item', 'No office approval to wait for. The customer decides, admin is informed.', 3800);
await click('technician', '[data-a=xpart][data-v=X2]', 800); await click('technician', '[data-a=sendextra]', 1500);
await click('customer', '[data-a=extra][data-v=yes]', 1500);
await say('The customer approves in the app', 'Items that are not priced yet are priced by admin or the vendor.', 3200);
await click('technician', '[data-a=finish]', 1000);
await say('The job closes only with the customer code', 'Generated by our backend, shown in the customer app. Not an SMS.', 4200);
const otp = await ev('customer', () => AC.store.get().jobs[0].otp);
for (let i = 0; i < 6; i++) { try { await F('technician').locator('[data-a=ck]').nth(i).click({ timeout: 800 }); await wait(250); } catch (e) { break; } }
await click('technician', '[data-a=photo][data-v=before]', 400); await click('technician', '[data-a=photo][data-v=after]', 500);
await type('technician', '#f-code', otp, 300); await click('technician', '[data-a=cash]', 700); await click('technician', '[data-a=complete]', 2200);
await say('Completed. Admin can complete, cancel or override any step.', 'Every override records where it was done.', 4200);

/* 5. Reviews and chat */
await stepL('6  Reviews and support');
await ev('customer', () => { const v = document.getElementById('view'); v.scrollTop = 700; }); await wait(600);
await click('customer', '[data-a=star][data-k=overall][data-v="5"]', 300); await click('customer', '[data-a=star][data-k=work][data-v="5"]', 300);
await click('customer', '[data-a=rate]', 1200);
await say('Ratings and feedback are private to admin', 'Technicians and vendors never see them.', 3200);
await nav('reviews', 1800);
await click('customer', '[data-a=back]', 600); await click('customer', '.tab[data-v=account]', 800); await click('customer', '[data-a=chat]', 1200);
await click('customer', '[data-a=quickmsg] >> nth=0', 1500);
await say('Customers talk to admin in the app', 'After a booking is confirmed, the customer reaches the technician by call or WhatsApp.', 3600);
await nav('messages', 1500); await click('admin', '[data-a=thread] >> nth=0', 1200);
await type('admin', '#msg', 'He is on the way and will arrive in ten minutes.', 40); await click('admin', '.conv-f [data-a=send]', 1800);

/* 6. Wallet */
await stepL('7  Technician wallet');
await click('technician', '[data-a=back]', 700); await click('technician', '.tab[data-v=earn]', 1200);
await say('The technician wallet', 'Cash collected stays on the balance until a deposit is accepted. Incentive is earned per paid job.', 4200);
await click('technician', '[data-a=depopen]', 900); await click('technician', '[data-a=depsubmit]', 1200);
await nav('collections', 1500);
await say('Admin accepts the deposit', 'Only then does the technician cash go to zero. Vendors accept deposits for their own team.', 3600);
await click('admin', '[data-a=accdep] >> nth=0', 1800);
await click('technician', '[data-a=wdopen]', 900); await click('technician', '[data-a=wdsubmit]', 1200);
await click('admin', '[data-a=paywd] >> nth=0', 1800);
await say('Incentive withdrawal is paid by finance', 'Every movement is in a ledger that can be audited.', 3400);

/* 7. Vendors */
await show('adminapp', 'vendor'); await stepL('8  Vendors');
await ev('customer', () => AC.store.act.createJob({ cust: 'C3', svc: 'ac-repair', slot: 'Today, 4-6 PM', method: 'cod', note: 'Indoor unit is leaking', verified: true }));
await ev('vendor', () => { sessionStorage.setItem('vendor.v', 'V2'); location.reload(); }); await wait(2500);
await say('No technician nearby? Forward to a vendor', 'Vendors have their own app and see only their own jobs, team and earnings.', 3600);
await click('adminapp', '.tab[data-v=jobs]', 900); await click('adminapp', '[data-a=seg][data-v=new]', 700); await click('adminapp', '[data-a=job] >> nth=0', 1500);
await click('adminapp', '[data-a=fwd][data-v=V2]', 1800);
await say('The vendor assigns one of their own technicians', 'If they do not reply in 15 minutes, admin can forward to another vendor.', 3600);
await click('vendor', '[data-a=assign] >> nth=0', 1000); await click('vendor', '[data-a=doassign] >> nth=0', 1800);
await click('adminapp', '[data-a=back]', 700); await click('adminapp', '.tab[data-v=map]', 1500);
await say('The admin app does the same on the go', 'Home, Jobs with dispatch, Map, Inbox and More.', 3400);

/* 8. Shop and courier */
await show('customer', 'admin'); await stepL('9  Shop and delivery');
await say('Back to the shop', 'The same customer app also sells products with courier delivery.', 2400);
await click('customer', '[data-a=back]', 600); await click('customer', '.tab[data-v=shop]', 800); await click('customer', '[data-a=opencats]', 700); await click('customer', '[data-a=shopcat][data-v=ac]', 900);
await say('Shop ACs, bags and local cosmetics', 'Installation is an optional add-on with a discount when you buy an AC.', 3400);
await click('customer', '[data-a=buynow][data-v=ac1] >> nth=0', 1200);
await say('Promo codes apply with one tap', 'Items can be removed or changed right in checkout. Cash on delivery first, then bKash, Nagad and cards.', 3800);
await click('customer', '[data-a=promopick][data-v=COOL10]', 900);
await click('customer', '[data-a=place]', 1800);
await click('customer', '[data-a=order] >> nth=0', 800);
await nav('orders', 1000); await click('admin', 'tbody tr.click >> nth=0', 1200);
await say('Admin packs and ships with a courier partner', 'Delivery updates are added in one tap and appear in the customer timeline.', 3400);
await click('admin', '.drawer [data-a=adv]', 900); await click('admin', '.drawer [data-a=adv]', 900); await click('admin', '.drawer [data-a=courier]', 1500);
await say('No paid courier API required', 'Statuses come from admin now, and from the courier automatically if their API is enabled later.', 3800); await click('admin', '.d-f [data-a=close]', 700);

/* 9. Admin modules */
await show('admin'); await stepL('10  Admin modules');
await nav('dash', 2000);
await say('The dashboard', 'Bookings, active jobs, revenue and what needs attention, updating live.', 3800);
await nav('services', 1800);
await say('Services and prices', 'Add or change a service, its price and its time slots without a developer.', 3200);
await nav('products', 1600);
await say('Products', 'Bought from vendors, sold by NEW. Stock, price and discount in one place.', 3000);
await nav('categories', 1400); await nav('promos', 1800);
await say('Categories and promotions', 'Create offers and codes. Provider offers for bKash, Nagad and cards can be added later.', 3600);
await nav('users', 1600);
await say('Customers', 'Every customer with their orders and bookings.', 2600);
await nav('techs', 1600); await nav('vendors', 1600);
await say('Technicians and vendors', 'Vendor name, address and phone are stored here. Admin sees every technician.', 3600);
await nav('payments', 1600);
await say('Payments', 'Every payment by method: cash on delivery, bKash, Nagad and card.', 3000);
await nav('earnings', 1800);
await say('Earnings', 'Revenue, incentives and vendor commission at a glance.', 3000);

/* 10. Roles */
await stepL('11  Staff roles');
await nav('team', 1800);
await say('Staff roles with custom permissions', 'Five ready roles, and you can make your own.', 3400);
await click('admin', '[data-a=newrole]', 1000);
await type('admin', '#r-name', 'Support lead', 60);
await click('admin', '[data-a=rperm][data-v=messages]', 500); await click('admin', '[data-a=rperm][data-v=dispatch]', 500); await click('admin', '[data-a=rperm][data-v=reviews]', 700);
await click('admin', '[data-a=saverole]', 1600);
await say('Choose exactly what each role can do', 'A new role in seconds. Permissions are enforced on every request.', 3400);
await sel('admin', '#staffsel', 'U2');
await say('Operations executive', 'Dispatch, override, extra-work pricing, orders, technicians and customers. No finance.', 4200);
await sel('admin', '#staffsel', 'U3');
await say('Finance', 'Payments, collections and earnings, plus reviews. No dispatch.', 3600);
await sel('admin', '#staffsel', 'U4');
await say('Catalog manager', 'Services, products, categories, promotions and orders. Nothing else.', 3600);
await sel('admin', '#staffsel', 'U5');
await say('Support agent', 'Messages and dispatch, so customers get answers fast.', 3400);
await sel('admin', '#staffsel', 'U1');
await say('Super admin', 'Everything, including roles. Menus and actions appear only when a role allows them.', 3600);

/* 11. Technician onboarding */
await stepL('12  Verified technicians');
await nav('techs', 1200);
await say('Technicians are verified before they can work', 'NID photos, a live NID check and a live selfie. The onboarder is responsible.', 3600);
await click('admin', '[data-a=addtech]', 900);
await type('admin', '#k-name', 'Kamal Hossain', 60); await type('admin', '#k-phone', '01712345678', 60); await type('admin', '#k-nid', '1990123456789', 60);
await click('admin', '[data-kyc=next]', 700); await click('admin', '[data-kyc=front]', 400); await click('admin', '[data-kyc=back]', 400); await click('admin', '[data-kyc=next]', 600);
await click('admin', '[data-kyc=runcheck]', 2600); await click('admin', '[data-kyc=next]', 600); await click('admin', '[data-kyc=runface]', 3600); await click('admin', '[data-kyc=next]', 600);
await click('admin', '[data-kyc=agree]', 500); await click('admin', '[data-kyc=submit]', 1800);
await say('Vendor technicians are visible only to that vendor and admin', 'Admin sees every technician and every assignment.', 4000);

/* 12. Close */
await page.evaluate(() => V.title('Everything in one live system', 'Faster dispatch. Fewer surprises. Full accountability.', ['Live tracking', 'Completion code', 'Verified technicians', 'Wallet and payouts', 'Roles and permissions']));
{ const n = ++IDX; TL.push({ n, t: +now().toFixed(1), kind: 'section', a: 'Close' }); await page.evaluate(n => V.mark(n), n); } await wait(8000);
const total = +now().toFixed(1);
await ctx.close(); await browser.close();
const raw = fs.readdirSync(out + '/raw-full').filter(f => f.endsWith('.webm')).map(f => out + '/raw-full/' + f).sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs).pop();
// Start on the title card (about 1.6 s after the trim point), hold it 4 s longer for the opening line, then continue
execSync(`ffmpeg -y -loglevel error -ss 3.8 -t 6.9 -i "${raw}" -vf "tpad=stop_mode=clone:stop_duration=4" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -r 30 marketing/out/part-a.mp4`);
execSync(`ffmpeg -y -loglevel error -ss 10.7 -i "${raw}" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -r 30 marketing/out/part-b.mp4`);
fs.writeFileSync('marketing/out/parts.txt', "file 'part-a.mp4'\nfile 'part-b.mp4'\n");
execSync('ffmpeg -y -loglevel error -f concat -safe 0 -i marketing/out/parts.txt -c copy marketing/out/with-markers.mp4');
fs.mkdirSync('marketing/audio', { recursive: true }); fs.writeFileSync('marketing/audio/timeline.json', JSON.stringify({ total, items: TL }, null, 1));
execSync('python3 scripts/video_timeline.py', { stdio: 'inherit' });
execSync(`ffmpeg -y -loglevel error -i marketing/out/with-markers.mp4 -vf "crop=1920:1076:0:4,pad=1920:1080:0:4:color=0xF4F1EC" -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -r 30 -movflags +faststart marketing/new-full-walkthrough.mp4`);
console.log('duration', total, 's');
console.log('issues:', logs.length ? '\n' + logs.join('\n') : 'none');
