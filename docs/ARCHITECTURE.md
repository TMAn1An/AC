# Architecture (production build)

The prototype in `prototype/` proves the experience. This document is the plan for the real build. Skills in `.claude/skills` (from `flutter/skills`) describe the Flutter patterns to follow.

## 1. Applications

Flutter workspace (pub workspaces or Melos), one repo. Five apps, Android first (see `docs/PRODUCTION_PLAN.md`):

```
apps/
  customer/      Android (iOS later)
  technician/    Android (iOS later)
  vendor/        Android
  admin_mobile/  Android phone and tablet
  admin_web/     Web (desktop optional)
packages/
  shital_core/   models, repositories, API client, auth, realtime, payment and courier interfaces
  shital_ui/     theme from design tokens, buttons, badges, timeline, map widgets, product art
  shital_l10n/   Bangla and English strings (flutter_localizations, intl)
backend/         database migrations, edge functions, seed data
```

Why separate apps: different release cadence, permissions (location only in the technician app), store listings, role isolation and bundle size. Shared packages keep one visual and data language.

Layering inside each app (skill: `flutter-apply-architecture-best-practices`): MVVM. UI layer = Views (lean widgets) plus ViewModels extending `ChangeNotifier`, grouped by feature. Optional domain layer = use cases only for complex rules (dispatch ranking, pricing and discounts). Data layer = Services (stateless API and platform wrappers) and Repositories (single source of truth, map API models to immutable domain models, cache and retry). Dependency injection with `provider`. Routing with `go_router` and deep links (skill: `flutter-setup-declarative-routing`). Responsive admin layouts (skill: `flutter-build-responsive-layout`).

```
lib/
  data/      models/ repositories/ services/
  domain/    models/ use_cases/
  ui/        core/ (theme, shared widgets)  features/<name>/ view_models/ views/
```

Shared repositories, services and domain models live in `packages/shital_core`; each app contains only its features and DI wiring.

## 2. Backend

Recommended: Supabase (managed PostgreSQL, Auth, Realtime, Storage, Edge Functions) for speed to market. Equivalent self-hosted option: NestJS or Go API with PostgreSQL and WebSocket. The Flutter apps depend only on repository interfaces in `shital_core`, so the backend can change later.

Why Postgres: nearest-technician queries need geospatial support (PostGIS) and vendor scoping fits row level security.

### Core tables (sketch)

| Table | Purpose |
| --- | --- |
| profiles | One row per user: role (customer, technician, admin, vendor_owner), phone, name |
| vendors | Name, owner, phone, address, location (geography point), commission_pct, active |
| technicians | profile_id, vendor_id (null for direct staff), home_location, online, rating |
| services | Catalog: name, name_bn, price, duration, active |
| jobs | customer_id, service_id, units, ac_type, slot, address, location, status, technician_id, vendor_id, price, discount, payment_method, payment_status, warranty |
| job_events | job_id, kind, actor, note, at (append-only timeline) |
| job_extras | job_id, label, price, status (proposed, approved, declined), decided_by |
| technician_locations | technician_id, job_id, point, at (written only while on the way, short retention) |
| categories, products, product_variants | Shop catalog, stock, price, compare-at price |
| orders, order_items, order_events | Goods orders, courier, tracking id, installation_job_id |
| payments | Reference, gateway, method, amount, status, raw payload |
| cash_deposits | technician_id, amount, deposited_at, received_by |
| messages | thread (customer), sender, text, at |
| promotions, promotion_redemptions | Codes, rules, usage |
| reviews | job or product, stars, text, moderation state |

### Row level security

- Customer: own profile, jobs, orders, messages.
- Technician: jobs assigned to them, their cash and earnings.
- Vendor owner: jobs where `vendor_id` is theirs, their technicians, their settlement. Never other vendors or customer lists.
- Admin: everything.

Enforce on the server, not only in the UI. The prototype's role switcher mirrors this scoping.

### Dispatch query

```sql
select t.id, t.name, st_distance(t.home_location, :job_point) as meters
from technicians t
where t.vendor_id is null and t.online
  and st_dwithin(t.home_location, :job_point, :radius_m)
  and not exists (select 1 from jobs j where j.technician_id = t.id and j.status in ('ontheway','arrived','working'))
order by meters;
```

If it returns no rows, the admin UI offers vendors ordered by `st_distance(v.location, :job_point)`.

### Realtime

- Channel `job:{id}`: status changes, extras, payment. Subscribed by the customer, admin and the assigned technician.
- Channel `dispatch`: new and changed jobs for admin and vendor portals (filtered by RLS).
- Location: the technician app sends a point every 5 seconds only while status is `ontheway`, throttled and batched. Customers and admin render it on the map. Stop on `arrived`.
- Push notifications: Firebase Cloud Messaging for status changes, new job offers and chat. (FCM is separate from Google Maps APIs.)

## 3. Maps

No Google APIs. Use `flutter_map` with OpenStreetMap tiles (check the tile usage policy; use a paid or self-hosted tile provider such as MapTiler or OpenFreeMap before launch). Routing for ETA: OSRM or Valhalla self-hosted, or straight-line distance with a traffic factor for the first release. Vendors render as fixed markers from their stored location.

## 4. Payments

`PaymentGateway` interface in `shital_core` with implementations:

1. `CashOnDelivery` (first release).
2. `SslCommerz` (initiate session, redirect or in-app WebView, server-side IPN webhook to confirm, idempotent status update). SSLCommerz supports bKash, Nagad, cards and net banking.
3. Provider offers (bKash cashback) are promotion rules, not code branches.

Never trust the client for payment status. The webhook confirms, the app only displays.

## 5. Goods delivery

`CourierProvider` interface. First release: admin books manually and stores courier and tracking id. Later: Pathao and RedX APIs to create parcels and sync status into `order_events`.

## 6. Messaging and calls

- Customer to admin: in-app chat (`messages` table, realtime).
- Customer to technician: `tel:` and `https://wa.me/<number>` deep links, shown only after a technician is assigned. Numbers are visible only for active jobs.
- Admin to technician: phone call or WhatsApp from the booking drawer.

## 7. Localization

Bangla and English via `flutter_localizations` and ARB files (skill: `flutter-setup-localization`). Bangla digits optional. Hind Siliguri bundled for Bangla text.

## 8. Quality

- Unit tests for domain logic (pricing, discounts, dispatch ranking) with `dart-add-unit-test`.
- Widget tests for key components (timeline, booking form) with `flutter-add-widget-test`.
- Integration tests for the happy-path flows (book, assign, travel, complete) with `flutter-add-integration-test`.
- Static analysis (`dart-run-static-analysis`) and formatting in CI. Build matrix: Android, iOS, web.
- Accessibility: contrast AA, 44 px targets, semantic labels, dynamic type.

## 9. Security and privacy

- Phone OTP login. Short-lived tokens. Role checks in RLS and edge functions.
- Location is collected from technicians only while on the way, and shown to the customer of that job only.
- PII access is logged for admin. Delete or anonymize on request.
- Secrets live in the backend environment, never in the apps.

## 10. Prototype to production mapping

| Prototype | Production |
| --- | --- |
| `shared/store.js` actions | Edge functions or API endpoints with the same names (`assign`, `forward`, `respond`, `startTrip`, `arrive`, `proposeExtra`, `resolveExtra`, `complete`, `pay`, `placeOrder`, `advanceOrder`) |
| BroadcastChannel and postMessage sync | Realtime channels |
| `data.js` reference data | Database seed plus admin CRUD |
| Schematic SVG map | `flutter_map` plus OSM tiles |
| Demo gateway sheet | SSLCommerz session |
| Autopilot | Not shipped. Replace with integration tests |
