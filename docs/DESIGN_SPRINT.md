# Design sprint

Goal: agree the concept, flows and visual language before any production code, and produce a prototype convincing enough to win the project and to submit as a demo.

## 1. Brief and decisions

Source: `Client_Requirements.pdf` (client notes plus developer Q&A). Where the brief was open, the chosen default is marked as an assumption.

| Topic | Decision | Source |
| --- | --- | --- |
| Apps | Customer, technician, vendor, admin (mobile) and admin web. Vendors get their own app, scoped to their jobs. Production plan: `docs/PRODUCTION_PLAN.md`. | Client reply 1 and later decision |
| Platforms | Flutter. Android and iOS for the two mobile apps. Web for admin. Desktop possible later. | Client |
| Selling model | Single seller. Shital buys from vendors and sells. No marketplace of third-party sellers. | Client reply 2 |
| Vendor role | Field service only, in areas without a Shital technician. Admin stores name, address and phone. Commission amount decided later. | Client reply 2 |
| Routing | Admin assigns a nearby Shital technician. Otherwise forwards to a vendor who assigns their own technician. | Client reply 1 (second round) |
| Confirmation | Technician informs admin. Admin talks to the customer to confirm extra work. Discounts help the customer cooperate. | Client reply 3 |
| Liability | Company covers extra work only if approved. Work outside the order is the technician's responsibility, not the company's. | Client reply 3 |
| Cart | AC can be added to cart. Installation is an optional add-on. AC bought from Shital gets an installation discount and a 1 year repair warranty. | Client reply 3 |
| Tracking | Timeline status. Live map with a moving technician. Vendor location fixed. No Google APIs. | Client reply 4 and brief |
| Payments | Cash on delivery plus bKash, Nagad and cards. Offers with providers later. | Client reply 5 |
| Messaging | Customer to admin in the app. After confirmation, customer to technician by call or WhatsApp. Admin and technician stay in contact. | Client reply 6 and round 2 |
| Delivery | Third-party courier (Pathao, RedX). | Client round 2 |
| Admin modules | Dashboard, users, services, bookings, payments, collections, earnings, categories, promotions, vendors, reviews, messages. | Brief |

### Assumptions to confirm with the client

1. Brand name. "Shital" is a placeholder.
2. Service radius for direct technicians: 4 km. Vendors cover the rest.
3. Prices beyond the two given: servicing 1200, gas refill 2200, installation 1800, relocation 2500.
4. Discounts: first purchase 15% up to 500, installation 20% off with an AC, 100 off services when the confirmation call happens.
5. Vendor commission 10 to 12% of job value. Technician incentive 12% (direct staff only).
6. Delivery fee: 80 for small items, 350 for an AC.
7. Cash collected by technicians is deposited to the office or the vendor daily (the Collections screen).
8. Customer or admin may approve extra work. The technician cannot start it until approved.

## 2. Research

Desk research on products our users already know. No copying: we took mechanics, not looks.

| Product | What it does well | What we adopted |
| --- | --- | --- |
| Urban Company | Upfront price, slot picker, professional profile before confirming | Fixed service prices, slots, technician card |
| Uber, Pathao | ETA as the headline, map and contacts beneath | Status card with ETA, call and WhatsApp row |
| foodpanda | Short vertical timeline of an order | One timeline component for bookings and orders |
| ServiceTitan, Jobber | Dispatch board, job detail drawer, technician status | Bookings table, dispatch drawer, live map |
| Daraz | Rich catalog, but dense | The client does not want this, so three calm sections |
| Stripe, Linear | Quiet neutrals, hairline borders, one brand color | Admin visual language |

## 3. Principles

1. Calm over loud. Neutral surfaces, one teal for actions, amber only for savings and attention.
2. Status is the product. Every screen says what is happening and what comes next.
3. One primary action per screen. Technicians work one-handed outdoors.
4. Local by default. Bangla names, taka, cash on delivery, bKash and Nagad.
5. Alive but honest. Live markers and toasts reflect real state changes, never decoration.

## 4. Personas

| Persona | Goal | Friction today | Design response |
| --- | --- | --- | --- |
| Nadia, customer, Banani | Trusted technician today without phoning around | Unknown arrival, surprise costs | Fixed prices, ETA-first tracking, approval for extra costs |
| Rafi, operations admin | Dispatch each request within two minutes | No view of who is nearby or free | Technicians ranked by distance, one-click vendor forward |
| Mizan, vendor owner | Receive jobs, assign his team | Access without seeing other vendors | Scoped portal: only his jobs, team and settlement |
| Rakib, technician | Do the job, get paid, move on | Unclear scope, wasted calls | One next action per screen, clear rule for extra work |

## 5. Flows

### Service booking (job states)

```
requested -> (admin) assigned -> (technician) accepted -> ontheway -> arrived -> working -> completed
           \-> forwarded (to vendor) -> (vendor) assigned -> ...
assigned --decline--> requested (or forwarded when a vendor owns it)
working --extra work proposed--> approved or declined (customer or admin) --> working
any active state --> cancelled (before arrival)
```

Customer sees six stages: request received, technician assigned, on the way, arrived, work in progress, completed. Admin sees every event with actor and time.

### Shop order

```
placed -> packed -> shipped (courier and tracking id) -> delivered
```

An AC order with installation also creates an installation booking linked to the order and starts the warranty.

### Payments

Customer chooses a method at booking or checkout. Cash on delivery is collected by the technician (service) or the courier (goods). Wallet and card payments go through the gateway interface. Cash held by technicians appears in Collections until deposited.

## 6. Information architecture

- Customer: Home, Services, Shop, Orders, Account. Pushed screens: service booking, tracking, product, cart, checkout, order detail, support chat.
- Technician: Jobs, Map, Earnings, Profile. Pushed screens: job detail (one action at a time). Sheets: extra work, complete job.
- Admin: Dashboard; Bookings, Live dispatch, Messages; Services, Products, Categories, Promotions; Orders; Users, Technicians, Vendors; Payments, Collections, Earnings; Reviews.
- Vendor app: Jobs (new, active, completed), Team, Map, Earnings, Profile.
- Admin app (mobile): Home, Jobs (with dispatch), Map, Inbox, More (orders, vendors, technicians, collections, payments, reviews, promotions).

## 7. Visual language

- Color: Ink #10222B, Glacier #0E6B78 (brand), Frost #E3F1F3, Amber #E59A2B (savings and attention), semantic green, amber, red, blue. Neutrals lean teal. No gradients.
- Type: Bricolage Grotesque (display, restrained), Hanken Grotesk (interface), Hind Siliguri (Bangla), IBM Plex Mono (ids, codes). Tabular figures for money and time.
- Shape: 8, 12, 18 px radii. Hairline borders over shadows. Shadows only for floating layers.
- Imagery: flat SVG product illustrations on tinted tiles, so every card is visual without photo licensing. Replace with product photography in production.
- Motion: 150 to 280 ms, ease-out, used for state change only. Reduced motion respected.
- Icons: 24 px line set, 1.75 stroke. No emoji.

## 8. Prototype scope

Included and clickable: all flows above across the three apps with live sync, vendor portal, Collections, Payments, demo payment gateway, autopilot for solo review.

Not included on purpose: real authentication, real maps (the city is a schematic SVG), real payments, push notifications, Bangla UI translation (names only), accessibility audit with assistive tech.

## 9. Open questions for the client

1. Brand name, logo and colors if they have any.
2. Final service list and prices. Warranty terms in writing.
3. Commission model for vendors and incentive for technicians.
4. Which wallet or gateway offers will be live at launch.
5. Courier contracts and whether API booking is wanted or manual booking is enough at first.
6. Who confirms extra work in practice: customer in app, admin by phone, or both.
7. Bangla UI at launch or English first.
