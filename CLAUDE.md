# CLAUDE.md

Project: Shital, an AC service, AC sales, bag and local cosmetics platform for Bangladesh. Read `README.md` first, then `docs/DESIGN_SPRINT.md` (decisions) and `docs/ARCHITECTURE.md` (production plan).

## Current state

Phase 0 is done: a clickable design prototype in `prototype/` (plain HTML, CSS, JS). The production build (Flutter) has not started. Next step is phase 1 in `docs/ROADMAP.md`, following `docs/PRODUCTION_PLAN.md`. Architecture follows the Flutter skill: MVVM (views, ChangeNotifier view models), repositories and services, optional use cases, `provider` for DI, `go_router`.

## Non-negotiable product decisions (from the client)

- Five apps, Android first: customer, technician, vendor, admin (mobile), admin web. Flutter for all. iOS later from the same code. See `docs/PRODUCTION_PLAN.md`.
- Single seller for goods. Shital buys from vendors and sells itself. Vendors are only for field service in areas without a Shital technician.
- Job routing: customer request goes to admin. Admin assigns a Shital technician if one is near. Otherwise admin forwards to a vendor, and the vendor assigns their own technician. Vendor details (name, address, phone) live in the admin panel. Vendors use their own Vendor app (scoped to their jobs, team and earnings).
- Tracking: the technician location moves live on a map while on the way. Vendors have a fixed location. No Google APIs. Use OpenStreetMap with flutter_map.
- Customer app is an e-commerce app, not Daraz. Three sections: AC (sale plus service), bags, local cosmetics.
- Services: AC Repair 1000, AC Cooling Problem 1000, others are placeholders. Extra work found on site must be approved by the customer or admin before it starts. Work outside the order is not covered by the company.
- Discounts: first purchase discount, installation discount when buying an AC, 1 year repair warranty with installation.
- Payments: cash on delivery first. bKash, Nagad and cards through SSLCommerz behind a gateway interface. Offers with providers are decided later.
- Delivery of goods: third-party couriers (Pathao, RedX). Technician contact: phone call or WhatsApp. Customer to admin: in-app chat.
- Timeline status updates for every job and order, visible to customer and admin. Notification routing: admin hears every job event, the assigning vendor hears about its own jobs, the technician hears about their own jobs, the customer hears about their booking (see `mkNotifs` in `prototype/shared/store.js`).
- Customers verify their mobile number by SMS OTP before a booking or order, to block fake orders.

## Design rules

- No emoji anywhere (UI, docs, commit messages). No gradients. Icons are line icons from `prototype/shared/icons.js`.
- All color, type and spacing come from tokens in `prototype/shared/base.css` (and the Flutter theme that mirrors them). Do not hardcode new colors.
- One primary action per screen. Status first. Large touch targets in the technician app.
- Copy: plain, active voice. The prototype is English only. Bangla is a language option for the Flutter build (phase 4), not mixed into screens.
- Palette: warm ivory neutrals, ocean teal brand, deep ocean chrome, gold for savings, coral, sky, sage and plum as supporting hues for tiles and icons. Defined in `prototype/shared/base.css`.
- Quality bar: Y Combinator demo. Clean, minimal, alive (live updates, motion with purpose, reduced-motion respected).

## Working on the prototype

- Serve with `./scripts/serve.sh` and open `http://localhost:8080`.
- Shared code: `prototype/shared/store.js` is the single source of truth and the live sync layer (BroadcastChannel, localStorage, postMessage relay through the hub). Add new behaviour as an action there, then render it in each app. Do not keep job or order state inside an app.
- `prototype/shared/data.js` holds static reference data (areas, services, catalog, technicians, vendors, customers, promos).
- Smoke test: `npm install && npm run smoke` loads every page in headless Chromium and fails on console errors.
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
