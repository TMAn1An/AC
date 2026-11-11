# CLAUDE.md

Project: NEW, an AC service, AC sales, bag and local cosmetics platform for Bangladesh. Read `README.md` first, then `docs/DESIGN_SPRINT.md` (decisions) and `docs/ARCHITECTURE.md` (production plan).

## Current state

Phase 0 is done: a clickable design prototype in `prototype/` (plain HTML, CSS, JS). The production build (Flutter) has not started. Next step is phase 1 in `docs/ROADMAP.md`, following `docs/PRODUCTION_PLAN.md`. Architecture follows the Flutter skill: MVVM (views, ChangeNotifier view models), repositories and services, optional use cases, `provider` for DI, `go_router`.

## Non-negotiable product decisions (from the client)

- Five apps, Android first: customer, technician, vendor, admin (mobile), admin web. Flutter for all. iOS later from the same code. See `docs/PRODUCTION_PLAN.md`.
- Multi-vendor marketplace (client confirmed). Vendors sell their own products in the customer app (AC, bags, local cosmetics) and some also do field service in areas without a NEW technician. Seller-only vendors (V4 to V6 in the prototype) never get jobs. Each vendor sees and edits only its own products. The customer app shows every live product with "Sold by". A new vendor product is hidden until admin approves it. Admin sees every product with the vendor name, can approve, decline or remove any product. A vendor cannot delete: it can only mark a product unavailable (customers see "Unavailable" and cannot buy it). NEW earns a commission on every vendor sale (`AC.config.GOODS_COMMISSION`, 8 percent), shown in admin Earnings and in the vendor's own earnings. Store actions: `addProduct`, `editProduct`, `setAvailable`, `approveProduct`, `rejectProduct`, `removeProduct`, `restoreProduct`, query `S.sales(vendorId)`.
- Vendor name: a vendor can change its own name once (`AC.config.VENDOR_NAME_CHANGES`). After that it sends a request with a reason and admin approves or declines (`renameVendor`, `requestRename`, `decideRename`).
- One lead technician per job. `assign` only works while a job is requested, forwarded or assigned, and never to a technician already on the crew. A technician who declined can be assigned again. For more hands the lead, admin or vendor sets helpers needed and invites helpers (sub-technicians) from the same employer: `setHelpers`, `inviteHelper`, `helperRespond`, `removeHelper`. A helper joins by accepting, sees the job read only, and the job shows "Needs helper" until the crew is complete. The customer sees the helpers.
- Customers get an in-app toast for every notification as it arrives (technician steps, decline or timeout with reassignment, order steps).
- Job routing: customer request goes to admin. Admin assigns a NEW technician if one is near. Otherwise admin forwards to a vendor, and the vendor assigns their own technician. Vendor details (name, address, phone) live in the admin panel. Vendors use their own Vendor app (scoped to their jobs, team and earnings).
- Tracking: the technician location moves live on a map while on the way. Vendors have a fixed location. No Google APIs. Use OpenStreetMap with flutter_map.
- Customer app is an e-commerce app, not Daraz. Three sections: AC (sale plus service), bags, local cosmetics.
- Services: AC Repair 1000, AC Cooling Problem 1000, others are placeholders. Extra work found on site must be approved by the customer or admin before it starts. Work outside the order is not covered by the company.
- Discounts: first purchase discount, installation discount when buying an AC, 1 year repair warranty with installation.
- Payments: cash on delivery first. bKash, Nagad and cards through SSLCommerz behind a gateway interface. Offers with providers are decided later.
- Delivery of goods: third-party couriers (Pathao, RedX). Courier updates stay manual for now (admin adds each update, plus a tracking link); automatic updates through the courier API are a later option.
- Messaging: customer to admin in-app chat. Customer and technician can also text in the app while the technician is on the job (accepted to working); the chat closes when the job ends and stays readable. Phone call and WhatsApp stay available. Technician to dispatch: the assistant answers first (rules in `AC.botRules`, `prototype/shared/data.js`), and after an explicit request or two misses it hands off to a human agent. Agents work in the admin web Messages page (Technicians tab): take over, reply, resolve.
- Timeline status updates for every job and order, visible to customer and admin. Notification routing: admin hears every job event, the assigning vendor hears about its own jobs, the technician hears about their own jobs, the customer hears about their booking (see `mkNotifs` in `prototype/shared/store.js`).
- Customers verify their mobile number by SMS OTP before a booking or order, to block fake orders. The code fills in automatically from the SMS (Android SMS Retriever, no typing). Not built in the prototype yet.
- Client additions to build next in the prototype (decided in a client call, not yet built): a minimum visit charge is always paid once a technician is confirmed, even if no work follows; for repair or problem requests the customer first gets an estimate (parts plus service charge) and the technician is sent only after the customer agrees; customers pay NEW directly online and technicians do not collect money, with a reward to encourage online payment; small payments use bKash, Nagad, Rocket and Upay, large ones use a gateway (SSLCommerz, EPS and others) or bank transfer.
- No response: technician offers expire after 60 seconds and vendors after 15 minutes. Admin can reassign or forward to another vendor at any time.
- Completion: the technician finishes a job only with the customer's 4 digit completion code (generated by the backend, shown in the customer app). Admin can complete, cancel or override any step and every override is logged with its source.
- Extra work: no admin approval. Technician picks a priced item and the customer decides. Missing items are priced by admin or the vendor.
- Service report: the technician closes a job with a per-service checklist (`AC.checklists`), before and after photos and a note. Skipped steps need a note; one after photo is required. The customer sees the report on the booking, admin sees it in the job drawer.
- Reschedule: the customer can move the time slot until the technician sets off. It is logged and the technician and admin are told.
- Warranty: one year (`AC.config.WARRANTY_DAYS`) after an AC installation by NEW. The customer sees days left in Account and can claim a free repair: labour is free, parts go through the normal extra work approval.
- AC care reminder: each report sets the next servicing date (`SERVICE_INTERVAL_DAYS`, 180). The customer home shows it and offers a booking.
- Reviews and ratings are visible only in the admin panel.
- Technician identity: NID photos, live NID check and live selfie. The onboarder (admin or vendor) is responsible. A vendor sees only its own technicians. Admin sees all.
- Staff roles with custom permissions in the admin web app.
- Unread counts on every section, read and unread items, and a personal history stored on the device only.
- Technician wallet: cash to deposit and incentive. A deposit zeroes the cash only when accepted. Withdrawals open when cash is zero.

## Design rules

- No emoji anywhere (UI, docs, commit messages). No gradients. Icons are line icons from `prototype/shared/icons.js`.
- All color, type and spacing come from tokens in `prototype/shared/base.css` (and the Flutter theme that mirrors them). Do not hardcode new colors.
- One primary action per screen. Status first. Large touch targets in the technician app.
- Controls (design v2, end of `theme.css`): phone buttons are 52 px / 16 px, 44 px / 15 px and 36 px / 14 px, weight 600; desktop 44 / 40 / 32 px. Use `.btn`, `.btn-sm`, `.btn-lg` only, never one-off sizes. Run `node scripts/ui-audit.mjs` after UI changes; it must report 0 issues.
- Red is for flags and warnings: unread counts and badges (`--badge`), "needs attention" cards, errors and cancel. Never use it as a decoration or a brand colour. Payment methods use marks from `AC.payMark` (bKash and Nagad keep their own brand colours via `--pay-bkash`, `--pay-nagad`).
- Copy: plain, active voice. The prototype is English only. Bangla is a language option for the Flutter build (phase 4), not mixed into screens.
- Brand: the client logo (NEW). Palette sampled from it: darker warm tones of the logo blue, green and red (red only for flags and warnings) (neutrals, blue, red and green accents). Tokens in `prototype/shared/base.css`, flat theme in `prototype/shared/theme.css`. See `docs/BRAND.md`. No gloss: flat surfaces, hairline borders, one soft shadow on floating layers. Rebuild the logo with `python3 scripts/build-logo.py`.
- Tab bar: pressing a tab shows the soft tint ripple with the sparkle dots (`ui.js` plus the `.ripple` and `.glitter` rules in `theme.css`), then only the icon and label turn blue. The icon settles smoothly (no bounce). Do not change the press effect or add a pill without being asked.
- Screen transitions: every app calls `AC.ui.nav($app, key, depth)` after a render. A deeper screen slides in from the right, a shallower one from the left, a tab or page change fades up. A render that keeps the same screen (a live update) must not animate. Do not add `animation` to list children or cards; entry motion lives on `.view` and `.content`.
- Dark mode: light, dark or system, chosen in each app (Account, Profile, More, admin top bar) and in the hub header. `prototype/shared/theme.js` sets `data-theme` on `<html>`; dark tokens live in `base.css` under `:root[data-theme="dark"]`. Use tokens only (`--surface`, `--bg-2`, `--ink-bg`, `--surface-a`, map and art colours follow the theme). Never hardcode a light colour.
- Quality bar: Y Combinator demo. Clean, minimal, alive (live updates, motion with purpose, reduced-motion respected).

## Working on the prototype

- Serve with `./scripts/serve.sh` and open `http://localhost:8080`.
- Shared code: `prototype/shared/store.js` is the single source of truth and the live sync layer (BroadcastChannel, localStorage, postMessage relay through the hub). Add new behaviour as an action there, then render it in each app. Do not keep job or order state inside an app.
- `prototype/costs.html` is the client-facing cost estimate: development price (editable in the calculator), fixed costs, usage costs as ranges, payment fees per method, gateway comparison, calculator. Update the numbers from provider quotes. `prototype/NEW-cost-estimate.pdf` is printed from it (Playwright `page.pdf` with print media; copy to `marketing/`). Keep copy short and exact.
- `prototype/shared/data.js` holds static reference data (areas, services, catalog, technicians, vendors, customers, promos).
- Rules to keep passing: `npm run smoke` includes 51 checks for timeouts, completion code, override, extra work, wallet, KYC visibility, unread, job chat, dispatch help, reschedule, service report, warranty, no double assignment, crew and helpers, marketplace approval and scope, commission and vendor rename.
- Smoke test: `npm install && npm run smoke` loads every page in headless Chromium and fails on console errors.
- Before a release run `npm run check` (smoke rules, UI audit, and `scripts/e2e.mjs`: 27 end to end journeys with real clicks across all five apps). `npm run crawl` clicks every control at random, `THEME=dark npm run crawl` does it in dark mode.
- After UI changes, take screenshots (Playwright) and check them before declaring done.

## Working on the Flutter build

Skills are installed in `.claude/skills` (source: `flutter/skills` on skills.sh). Use them:

- `flutter-apply-architecture-best-practices` for the layered structure (UI, logic, data).
- `flutter-setup-declarative-routing` for go_router and deep links.
- `flutter-build-responsive-layout` for the admin web and tablet layouts.
- `flutter-setup-localization` for Bangla and English.
- `flutter-implement-json-serialization`, `flutter-use-http-package` for the data layer.
- `flutter-add-widget-test`, `flutter-add-integration-test`, `dart-add-unit-test` for tests.
- `dart-run-static-analysis` before every commit.

Follow `docs/ARCHITECTURE.md` for the workspace layout and backend contract. Mirror the prototype's tokens in a shared Flutter theme package.

## Git

Develop on the branch you were given. Commit small, descriptive messages. Do not open a pull request unless asked.
