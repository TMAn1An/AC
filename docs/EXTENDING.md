# Extending the platform

Rules and content are data, not code, so most changes need no release.

| Change | Where in the prototype | Where in production |
| --- | --- | --- |
| Offer timeout, vendor timeout, service radius, installation fee and discount, incentive rate | `AC.config` in `prototype/shared/data.js` | `settings` table, edited in Admin web, Settings |
| Services and prices | `AC.services` | `services` table, Admin web, Services |
| Extra work price list | Admin web, Services, Extra work price list (runtime) | `extra_work_catalog` table |
| Shop promo codes | `AC.shopPromos` | `promotions` table with rule fields (percent, flat, cap, minimum, first order, category) |
| Staff roles and permissions | Admin web, Team and roles (runtime). Permission list in `AC.perms` | `staff_roles`, `staff_permissions`. Add a permission by adding a row and checking it on the server |
| Courier statuses | `AC.courierSteps` | `courier_status` enum, or mapped from courier webhooks |
| Payment methods | `AC.payMethods` | `PaymentGateway` implementations, enabled per environment |
| Notification wording and recipients | `mkNotifs` in `prototype/shared/store.js` | Notification templates table and a routing function with the same rules |
| New job step | `META`, `ORDER` and the action in `store.js`, then the timeline in each app | State machine in the backend plus a new event kind |
| New app role | Add an audience string (`role:id`) and a notification route | New role in `profiles` and row level security rules |

Principles to keep: every state change is a command that writes an append-only event; every screen is a view of those events; recipients of notifications are decided in one place; permissions are enforced on the server.
