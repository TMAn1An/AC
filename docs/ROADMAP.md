# Roadmap

Phase 0 is complete. Each phase ends with something demonstrable.

## Phase 0. Design prototype (done)

Clickable, synchronised prototype of customer, technician and admin/vendor apps. Design sprint and architecture documented.

## Phase 1. Foundations (1 to 2 weeks)

- Create the Flutter workspace per `docs/ARCHITECTURE.md` (apps, `shital_core`, `shital_ui`, `shital_l10n`).
- Port design tokens to a Flutter theme. Build shared widgets: button, badge, timeline, status card, product card, map pin.
- Backend project, migrations for profiles, vendors, technicians, services, jobs, job_events. Seed from `prototype/shared/data.js`.
- Phone OTP auth and role routing.
- CI: analyze, format, test.

Done when: three apps boot, sign in by role, and read seeded services and technicians.

## Phase 2. Service workflow MVP (3 to 4 weeks)

- Customer: service list, booking form, tracking screen with timeline, support chat.
- Admin: bookings table, dispatch drawer with nearest technicians (PostGIS) and vendor forward, live map.
- Technician: job offer, accept, trip with location sharing, arrive, work, extra work request, complete.
- Vendor app and admin app: forwarded job requests, technician assignment, dispatch and approvals on mobile.
- Extra work approval by customer or admin. Cash payment and Collections.

Done when: the six-step demo on the hub runs against the real backend on two phones and a browser.

## Phase 3. Shop and orders (2 to 3 weeks)

- Catalog admin (products, categories, stock, promotions).
- Customer shop, cart, checkout, orders, installation add-on and linked booking, warranty record.
- Admin orders with courier and tracking id (manual), Collections for courier cash.

## Phase 4. Payments, offers, polish (2 to 3 weeks)

- SSLCommerz integration with webhook confirmation. bKash and Nagad offers as promotion rules.
- Push notifications. Reviews and moderation. Earnings and vendor settlement reports.
- Bangla localization, accessibility pass, performance pass.

## Phase 5. Launch readiness (1 to 2 weeks)

- Store listings, privacy policy, terms, data retention.
- Load test dispatch and realtime. Monitoring and alerting. Backups.
- Pilot in one or two areas with a small technician group.

## Prompts to continue with Claude Code

- "Read CLAUDE.md and docs/ARCHITECTURE.md. Start phase 1: scaffold the Flutter workspace and shared theme, using the Flutter skills."
- "Port the booking form and tracking screen from prototype/customer into apps/customer, matching the prototype visuals."
- "Implement the dispatch query and admin drawer from docs/ARCHITECTURE.md with tests."
- "Update the prototype and docs for the new client decision: ..."

Note: the detailed phase plan, timeline and quality gates are in docs/PRODUCTION_PLAN.md (sections 13 and 17).
