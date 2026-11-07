# Production plan: Shital Android platform

Status: draft for client review. Built from the client brief and the developer Q&A, then completed with what a production Android launch needs. Items marked (assumption) need a client decision. See section 20.

## 1. Product in one paragraph

Shital sells air conditioners, bags and local cosmetics, and runs a field-service operation for AC repair, servicing and installation in Bangladesh. Customers shop and book services in one app. Admin dispatches every job: to a nearby Shital technician, or to a vendor partner who assigns their own technician. Everyone sees live status, and the technician is tracked on a map while travelling.

## 2. Applications (all Flutter, Android first)

| # | App | Users | Form factor | Release |
| --- | --- | --- | --- | --- |
| 1 | Customer app | Shoppers, service customers | Android phone (iOS later from the same code) | Play Store, public |
| 2 | Technician app | Shital technicians and vendor technicians | Android phone | Play Store, closed or unlisted track |
| 3 | Vendor app | Vendor owners and dispatchers | Android phone | Play Store, closed track |
| 4 | Admin app | Shital operations, owner | Android phone and tablet | Play Store, closed track |
| 5 | Admin web app | Shital operations, finance, catalog staff | Desktop browser | Web, behind login |

Why five and not one: different permissions (only technician and customer tracking use location), different release speed, safer role isolation, smaller downloads, store listings that match each audience. They share packages so the cost is far below five separate builds.

Division of work between the two admin surfaces. Admin app: on-the-go control (dispatch, approve extra work, chat, collections, quick lists). Admin web app: heavy work (catalog, bulk edits, finance reports, user management, settings).

## 3. Roles and permissions

| Role | Can do | Cannot do |
| --- | --- | --- |
| Customer | Browse, order, book, track, pay, rate, chat with support, call or WhatsApp assigned technician | See other customers or any internal data |
| Technician (direct) | Accept or decline offered jobs, travel, work, request extra work, complete, collect cash | See jobs not assigned to them, change prices |
| Technician (vendor) | Same as above, for jobs assigned by their vendor | See Shital internal data or other vendors |
| Vendor owner | See jobs forwarded to them, assign own technicians, manage team and availability, view settlement | See other vendors, customer lists, shop data |
| Admin | Everything operational: dispatch, approve, orders, catalog, finance | Change system security settings (super admin only) |
| Super admin | Roles, settings, audit log | |
| Finance (admin web only) | Payments, collections, earnings, refunds | Dispatch |
| Catalog manager (admin web only) | Products, categories, promotions | Finance |

Enforcement is on the server (row level security and role checks). The apps only reflect it.

## 4. Feature inventory by app

Priority: P0 launch-blocking, P1 launch if time allows, P2 after launch.

### 4.1 Customer app

| Area | Features | Pri |
| --- | --- | --- |
| Onboarding and auth | Phone number OTP login, name, default address, notification permission explained in context | P0 |
| Home | Three sections (AC, bags, cosmetics), active booking banner, offers, service shortcuts | P0 |
| Services | List with fixed prices and Bangla names, booking form (AC type, units, slot, address, phone, note, payment preference), price summary, confirmation | P0 |
| Tracking | Status timeline, ETA, live map, technician card, call and WhatsApp buttons, cancel before arrival | P0 |
| Extra work | Notification and approval screen with itemised price, approve or decline | P0 |
| Completion | Payment (cash or online), invoice, rating and comment, warranty info | P0 |
| Shop | Category lists, product detail, variants, add to cart, installation add-on for ACs, cart, checkout, order tracking with courier and tracking id | P0 |
| Orders | Bookings and shop orders lists, reorder, invoice download | P0 |
| Payments | Cash on delivery, bKash, Nagad, card (SSLCommerz) | P0 COD, P1 online |
| Offers | First purchase discount, installation discount, coupon entry | P0 |
| Support | In-app chat with admin, quick replies, order or booking context attached | P0 |
| Account | Addresses (multiple), warranty list, language (Bangla, English), notification settings, delete account | P0 |
| Search and wishlist | Product search, saved items | P1 |
| Reminders | Seasonal service reminder, warranty expiry | P2 |

### 4.2 Technician app

| Area | Features | Pri |
| --- | --- | --- |
| Auth | Phone OTP, account created by admin or vendor only | P0 |
| Availability | Online and offline switch, working area | P0 |
| Job offer | Full-screen offer with service, area, distance, time, value, countdown, accept or decline with reason | P0 |
| Job flow | Start trip, arrive, start work, complete. One primary action per state | P0 |
| Navigation | Map with route, open in installed navigation app via intent | P0 |
| Location | Foreground service shares location every 5 seconds only while on the way | P0 |
| Extra work | Pick parts or work with prices, send for approval, blocked until approved | P0 |
| Completion | Checklist, after photos, cash collection confirmation | P0 |
| Contact | Call and WhatsApp customer, call admin | P0 |
| Earnings | Today, week, cash in hand, job history | P0 |
| Offline | Queue status changes while offline, sync on reconnect | P1 |
| Documents | Training material, safety checklist | P2 |

### 4.3 Vendor app

| Area | Features | Pri |
| --- | --- | --- |
| Auth | Phone OTP, account created by admin | P0 |
| Job requests | List of forwarded jobs with distance from the vendor location, accept and assign technician, decline with reason | P0 |
| Assignment | Own technicians ranked by distance and availability | P0 |
| Active jobs | Status and live map for own technicians | P0 |
| Team | Add and edit technicians, availability, view performance | P0 |
| Earnings | Gross, Shital commission, net, per job statement, settlement history | P0 |
| Profile | Company details (name, address, phone), fixed map location, service areas | P0 |
| Messages | Chat with Shital operations | P1 |

### 4.4 Admin app (mobile)

| Area | Features | Pri |
| --- | --- | --- |
| Home | Today KPIs, needs-attention list (unassigned, awaiting vendor, extra work approvals, unpaid) | P0 |
| Jobs | Filterable list, job detail, dispatch (nearest technicians, forward to vendor), cancel, reassign | P0 |
| Approvals | Extra work approval after calling the customer | P0 |
| Live map | Technicians, vendors, active jobs | P0 |
| Inbox | Customer chats, quick replies, call button | P0 |
| Orders | List, advance status, courier and tracking id | P0 |
| Quick lists | Vendors, technicians, collections (mark deposited), payments, reviews | P0 |
| Alerts | Push for new request, no technician available, SLA breach | P0 |

### 4.5 Admin web app

| Area | Features | Pri |
| --- | --- | --- |
| Dashboard | KPIs, revenue chart, attention list, live mini map, activity feed | P0 |
| Bookings | Table with filters and search, detail drawer, dispatch, timeline, export | P0 |
| Live dispatch | Full map, active jobs, team status | P0 |
| Messages | Threaded inbox | P0 |
| Catalog | Services, products (with variants and stock), categories, promotions | P0 |
| Orders | Table, bulk status updates, courier booking, returns | P0 |
| People | Users, technicians, vendors (create, suspend, reset phone login) | P0 |
| Finance | Payments, collections, earnings, vendor settlement, refunds, reports export | P0 |
| Reviews | Moderation | P1 |
| Settings | Service radius, commission rates, fees, SLA timers, notification templates, roles | P0 |
| Audit log | Who changed what and when | P1 |

## 5. Core business rules

1. A job always passes through admin. No job reaches a technician or vendor without admin assignment (a future auto-dispatch setting is P2).
2. Direct technicians are considered when they are online, free, and within the service radius (default 4 km). Otherwise admin forwards to a vendor. Vendors are ranked by distance from their fixed location.
3. A technician has a fixed time to respond to an offer (default 60 seconds). On decline or timeout the job returns to the admin queue and the admin is alerted.
4. A vendor has a fixed time to assign a technician (default 15 minutes). On breach admin is alerted and can reassign.
5. Customers see a price before confirming. Fixed prices per service and units. Discounts are applied before confirmation and shown separately.
6. Extra work found on site must be proposed in the app with line items. It starts only after the customer or admin approves. Work outside the order is not covered by the company and the technician is told so on screen.
7. Cancellation is free before the technician starts the trip. After that a cancellation fee applies (assumption: 100).
8. Cash on delivery: the technician or courier collects. Cash held by technicians is recorded and must be deposited. Admin marks deposits.
9. Online payment is confirmed only by the gateway webhook, never by the app.
10. Buying an AC from Shital with installation gives the installation discount and a 1 year repair warranty from the installation date. Installation creates a linked job.
11. First purchase discount applies once per customer, to shop orders.
12. Vendor commission is a percentage of completed job value, set per vendor. Settlement is weekly (assumption).
13. Goods are delivered by third-party couriers. The tracking id is stored on the order and shown to the customer.
14. Technician location is shared only while a job is on the way, and only the customer of that job and admin can see it. Customer phone numbers are visible to a technician only for their active jobs.

## 6. State machines

Job: `requested -> forwarded? -> assigned -> accepted -> ontheway -> arrived -> working -> completed`, with `declined` returning to `requested` or `forwarded`, `cancelled` before `arrived`, and the `working` state holding an optional extra-work sub-flow (`proposed -> approved | declined`).

Order: `placed -> packed -> shipped -> delivered`, with `cancelled` before shipped and `returned` after delivered (P1).

Payment: `unpaid -> paid`, `paid -> refunded` (admin, P1). Gateway sessions: `initiated -> confirmed | failed | expired`.

Every transition writes an append-only event with actor and time. The customer timeline and admin timeline are both views of those events.

## 7. User journeys (happy paths)

1. First booking. Install, OTP, home, Services, AC Cooling Problem, fill form, confirm. Status: request received. Admin dispatches. Notification: technician assigned with name and ETA. Tracking. Arrival. Work. Optional extra work approval. Completion. Payment. Rating.
2. Out-of-radius booking. Same, but admin forwards to the closest vendor. Customer sees "assigning technician" and no difference afterwards. Vendor assigns a technician within 15 minutes.
3. AC purchase with installation. Browse, product, add installation, cart, checkout (bKash), order placed. Admin packs and ships with Pathao. Customer tracks. Installation job created and scheduled after delivery. Warranty starts on installation.
4. Technician day. Go online, receive offer, accept, navigate, complete, collect cash, deposit at end of day.
5. Vendor day. Open job requests, assign a technician, watch progress, check weekly settlement.
6. Admin day. Triage needs-attention, dispatch, approve extra work, answer chats, book couriers, reconcile collections.

## 8. Android specifics

- Min SDK 24 (Android 7.0), target the current Play requirement (API 35 at time of writing). Build Android App Bundles. Separate application ids per app and flavor (dev, staging, prod).
- Background location (technician app): a foreground service with a persistent notification, started on "start trip" and stopped on "arrived" or cancel. Request fine location in context with a rationale screen. Do not request background location permission if the foreground service type is enough.
- Push: Firebase Cloud Messaging with high priority data messages for offers and status changes, notification channels per category (job offers, status, chat, promotions), full-screen intent for job offers if the Play policy allows (otherwise a heads-up notification).
- Battery: handle manufacturer battery optimisation (guide the technician to disable it for the app).
- Deep links: Android App Links for `customer`, order and booking URLs. Intent for `tel:`, `https://wa.me/`, and navigation apps.
- Storage and media: photo capture with the system picker, compression before upload, scoped storage only.
- Security: R8 and obfuscation, certificate pinning for the API (with rotation plan), secure storage for tokens, root and tamper signals as risk inputs (not hard blocks), Play Integrity API on login.
- Performance: cold start under 2 seconds on a mid-range device (2 GB RAM class), 60 fps lists, images sized to their view, lazy lists, startup work deferred. Target app size under 30 MB per app.
- Quality: handle low connectivity (2G or 3G), airplane mode, process death and restore, rotation, font scale up to 200%, TalkBack labels, dark mode (P1).
- Play Store: data safety form, privacy policy URL, account deletion path in app and on the web, content rating, target audience, store listing in Bangla and English.

## 9. Architecture (summary, details in ARCHITECTURE.md)

- Layering per the Flutter skill: UI (views plus ViewModels extending ChangeNotifier), optional domain (use cases for complex rules such as dispatch ranking and pricing), data (repositories and services). Dependency injection with `provider`. Navigation with `go_router`. Immutable domain models. JSON serialization in the data layer.
- Workspace with shared packages so five apps reuse models, repositories, theme and widgets.
- Backend: PostgreSQL with PostGIS, Auth, Realtime channels, Storage, serverless functions for payments and notifications.
- Maps: `flutter_map` with OpenStreetMap-based tiles from a commercial or self-hosted provider. No Google APIs.
- Observability: Crashlytics (crashes), structured logs, backend metrics and alerting, product analytics with events defined in section 14.

## 10. Data model (summary)

Entities: profiles, vendors, technicians, services, jobs, job_events, job_extras, technician_locations, categories, products, product_variants, orders, order_items, order_events, payments, refunds, cash_deposits, vendor_settlements, messages, promotions, redemptions, reviews, notifications, devices (push tokens), audit_log, settings. Full sketch in ARCHITECTURE.md.

Data retention: location points deleted after 30 days, chat 12 months, financial records 7 years (assumption, confirm with accountant).

## 11. API and realtime contract

Resource APIs for catalog, orders, jobs, payments. Command endpoints for state changes, each idempotent and validated server-side: `createJob`, `assignJob`, `forwardJob`, `respondToOffer`, `startTrip`, `arrive`, `startWork`, `proposeExtra`, `decideExtra`, `completeJob`, `payJob`, `rateJob`, `cancelJob`, `placeOrder`, `advanceOrder`, `depositCash`. The prototype store exposes the same command names. Realtime channels: `job:{id}`, `dispatch`, `vendor:{id}`, `technician:{id}`, `thread:{id}`.

## 12. Security, privacy and compliance

- Phone OTP login with rate limits and device binding. Short-lived access tokens, refresh tokens in secure storage.
- Role checks and row level security on every table. Admin actions are audited.
- Encrypt in transit (TLS 1.2+) and at rest. PII minimisation in logs.
- Privacy policy and terms in Bangla and English. Consent for location (technician) and notifications.
- Comply with applicable Bangladesh law on data protection and electronic payments, and with the SSLCommerz, bKash and Nagad merchant onboarding requirements (needs trade licence and bank details). Invoices follow VAT requirements (assumption, confirm with accountant).
- Account deletion and data export on request.
- Threat checklist before launch: broken access control tests per role, replayed or forged payment callbacks, location spoofing, enumeration of order ids, abuse of coupons, spam bookings.

## 13. Quality strategy

| Layer | What | Tool or skill |
| --- | --- | --- |
| Unit | Pricing, discounts, dispatch ranking, state machine transitions, view models | `dart-add-unit-test`, mocks with `dart-generate-test-mocks` |
| Widget | Timeline, booking form, product card, offer sheet, golden tests for key screens | `flutter-add-widget-test` |
| Integration | Book to complete, extra work approval, order to delivery, vendor forward | `flutter-add-integration-test` |
| Contract | API schema tests between apps and backend | CI |
| Static | Analyzer with strict lint set, formatting | `dart-run-static-analysis` |
| Security | Access-control tests per role, dependency audit | CI and manual |
| Device | Real devices: low-end, mid, flagship, Android 7 to 15, 2G throttling | Firebase Test Lab and manual |
| Accessibility | TalkBack pass, contrast, 48 dp targets, 200% text | Manual checklist |
| Load | Dispatch and realtime at 10x expected concurrency | k6 or equivalent |

Definition of done for a feature: designed state coverage (loading, empty, error, offline), analytics events, tests, accessibility pass, translation keys in both languages, no analyzer warnings.

## 14. Analytics and success metrics

Events: `booking_started`, `booking_confirmed`, `job_dispatched`, `job_accepted`, `trip_started`, `job_completed`, `extra_work_proposed`, `extra_work_approved`, `payment_succeeded`, `review_submitted`, `product_viewed`, `add_to_cart`, `checkout_started`, `order_placed`.

Targets (assumption, tune after pilot): request to dispatch under 2 minutes median, dispatch to acceptance under 90 seconds, arrival within the promised slot 90% of the time, booking completion rate above 70% from start, crash-free sessions above 99.5%, order delivered within 5 days 90%.

## 15. Operations and support

- Admin runbook: unassigned job after 5 minutes, vendor not responding, technician offline mid-job, payment mismatch, courier delay, customer complaint, refund.
- SLA timers shown on the admin dashboard and alerted by push.
- Support hours and escalation owner defined before launch.
- Monitoring: uptime checks, error rate, push delivery rate, payment webhook failures, queue depth. On-call rota for the pilot.

## 16. Environments and delivery

dev, staging, production, each with its own backend project and Firebase app. Flavors in every app. CI on every pull request: analyze, test, build. Release train: internal testing, closed testing (technicians, vendors, staff), open or production. Staged rollout 10%, 50%, 100% with crash gates. Feature flags for risky features (online payments, auto-dispatch). Database migrations are versioned and reversible.

## 17. Phases and timeline

Assumes a small team (see section 18). Durations are for planning, not commitments.

| Phase | Weeks | Output | Exit criteria |
| --- | --- | --- | --- |
| 0. Prototype and plan | done | Five prototypes, plan, decisions | Client approves scope |
| 1. Foundations | 1 to 3 | Workspace, theme, shared packages, backend schema, auth, CI, flavors | All apps sign in by role, CI green |
| 2. Service workflow | 4 to 9 | Customer booking and tracking, technician flow with location, admin app and web dispatch, vendor app assignment, extra work, cash collections | Pilot script runs on real devices end to end |
| 3. Shop | 10 to 13 | Catalog admin, shop, cart, checkout, orders, installation link, warranty | Cash on delivery orders delivered by courier in staging |
| 4. Payments and offers | 14 to 16 | SSLCommerz with webhook, promotions engine, push polish, invoices | Test payments reconcile with the gateway report |
| 5. Hardening | 17 to 19 | Bangla localization, accessibility, performance, security review, load test, Play listings | Release candidate passes the quality gates |
| 6. Pilot | 20 to 22 | One or two areas, small technician and vendor group | Metrics in section 14 met for two weeks |
| 7. Launch | 23 to 24 | Staged rollout, marketing, support ready | Production stable |

Critical path: payment merchant onboarding (weeks of paperwork, start in phase 1), Play Console account and verification, vendor and technician onboarding, courier agreements.

## 18. Team (suggested)

1 product owner (client side), 1 designer, 2 to 3 Flutter engineers, 1 backend engineer, 1 QA engineer, part-time DevOps. Operations lead on the client side from phase 2 to run the pilot.

## 19. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Background location killed on some phones | Tracking breaks | Foreground service, battery guidance, fallback to status updates |
| Payment onboarding delay | Online payment slips | Launch with cash first, flag-gated online payments |
| Technician adoption | Low acceptance rate | Simple app, training, clear incentives, offer countdown tuned in pilot |
| Vendor slowness | Customers wait | Response timers, alerts, reassignment |
| Map tile cost or policy | Cost or block | Commercial or self-hosted tiles, caching |
| Fraud (coupon abuse, fake bookings) | Loss | OTP, rate limits, coupon rules, admin review |
| Scope creep (marketplace, chat between all parties) | Delay | Client decisions in CLAUDE.md are the scope. Changes go through the roadmap |
| Low-end devices and weak networks | Poor experience | Budgets in section 8, offline queue, image sizing, test on real devices |

## 20. Open decisions for the client

1. Brand name, logo, colors.
2. Final service list, prices, cancellation fee, warranty wording.
3. Vendor commission model and settlement cycle. Technician pay model.
4. Payment providers and which offers at launch. Merchant documents ready?
5. Courier contracts and whether API integration is wanted at launch.
6. Who approves extra work in practice and the maximum without a call.
7. Service areas for launch and the direct-technician radius.
8. Bangla and English at launch, or English first.
9. Auto-dispatch later: yes or no.
10. Data retention periods, invoice format, VAT.

## 21. Definition of production ready

All P0 features done and tested on real devices. Crash-free sessions above 99.5% in the pilot. Security review passed with no high findings. Payment reconciliation proven. Play listings approved. Runbooks and support in place. Backups and restore tested. Staged rollout plan and rollback plan agreed.
