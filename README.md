# Shital: AC service, AC sales, bags and local cosmetics

Design prototype for a Bangladesh marketplace and field-service platform. Three connected apps share one live system:

| App | Audience | Platform in production | Prototype |
| --- | --- | --- | --- |
| Customer app | Shoppers and service customers | Flutter (Android, iOS) | `prototype/customer` |
| Technician app | Field technicians (direct and vendor) | Flutter (Android, iOS) | `prototype/technician` |
| Admin and vendor panel | Shital staff, vendor owners | Flutter Web (desktop optional) | `prototype/admin` |

"Shital" (Bangla for cool) is a working name. Change it in one place: `AC.brand` in `prototype/shared/data.js`.

## Run the prototype

No build step. Any static server works.

```bash
git clone https://github.com/TMAn1An/AC && cd AC
./scripts/serve.sh            # serves prototype/ on http://localhost:8080
```

Open `http://localhost:8080` for the showcase hub, which runs all three apps side by side and keeps them in sync. Each app also opens on its own:

- `http://localhost:8080/customer/` (device frame on desktop, full screen on a phone)
- `http://localhost:8080/technician/`
- `http://localhost:8080/admin/` and `http://localhost:8080/admin/#vendor-V1` for the vendor portal

## The workflow it demonstrates

1. Customer books an AC service (fixed price, slot, address, phone) or buys from the shop.
2. Admin sees the request. If a Shital technician is within the service radius, admin assigns them. If not, admin forwards it to the nearest vendor, who assigns one of their own technicians.
3. The technician accepts, travels (customer and admin see a live moving marker), arrives, works, optionally requests extra work, and completes.
4. Extra work needs approval from the customer (or admin on their behalf) before it starts.
5. Payment: cash on delivery, bKash, Nagad or card through a demo gateway. Customer rates the technician.
6. Shop orders move through packed, shipped (courier and tracking id) and delivered. Buying an AC with installation creates the linked installation booking and a 1 year repair warranty.

## Repository map

```
prototype/            static HTML, CSS and JS prototypes (no build step)
  index.html          showcase hub (live demo, design sprint, system, run guide)
  shared/             design tokens, icons, illustrations, data, live store, map
  customer/ technician/ admin/
docs/
  DESIGN_SPRINT.md    research, decisions, personas, flows, visual language
  ARCHITECTURE.md     production architecture for the Flutter build
  ROADMAP.md          phases, acceptance criteria, prompts to continue with Claude
.agents/skills        Flutter and Dart skills installed from skills.sh (flutter/skills)
.claude/skills        symlinks so Claude Code loads the same skills
CLAUDE.md             instructions for Claude Code in this repo
scripts/              serve.sh, smoke.mjs
```

## Continue with Claude Code

```bash
claude
```

Then ask: "Read CLAUDE.md and docs/ROADMAP.md, then start phase 1." The Flutter skills in `.claude/skills` are picked up automatically. Reinstall or update them any time with `npx skills add flutter/skills --all -y`.

## Status

Prototype v0.1: all flows are clickable and synchronised. All names, shops, phone numbers and amounts are fictional. Prices other than the two service prices in the client brief, the 4 km radius, commission rates and discount rules are placeholders listed in `docs/DESIGN_SPRINT.md`.
