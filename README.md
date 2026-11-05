# TLVPark-P2P

Peer-to-peer parking spot rental PWA for Tel Aviv-Yafo: residents rent out
private spots (driveways, underground garages, gated lots) by the hour or day,
and drivers find them on a map. Prices are in ILS (₪). UI in Hebrew (RTL) and
English.

## Features

**Renters**: map + list search filtered by time window, vehicle size and
features (covered, gated, EV charger); live price preview; simulated
checkout; bookings grouped as parked now / upcoming / past / cancelled;
gate dial-in number and access instructions after booking, **saved on the
device for use without signal** (underground garages); cancel any time before
the start; 1-5 star review after the booking ends; Waze navigation link.

**Hosts**: list a spot (address search + draggable pin, dimensions, features,
hourly price + daily cap, gate phone, access instructions); weekly schedule
(e.g. Sun-Thu 08:00-18:00) plus one-off blocked or extra windows; unlist a
spot; dashboard with earned / upcoming totals; cancel a renter's booking.
Blocking time that already has bookings is refused until those bookings are
cancelled.

**Mobile-first UI**: bottom tab bar (Search, My bookings, Host, Account);
"Day · From · For" pickers instead of cramped date-time inputs; results
default to the next two hours; large tap targets (44px+); light and dark
themes; Hebrew (RTL) and English. Every screen passes an axe-core
WCAG 2.1 AA scan in both themes.

**Pricing**: per 30 minutes at half the hourly rate, never more than the
daily cap per 24-hour block. Bookings are 1 hour minimum, 30 days maximum, on
:00/:30 boundaries, in Israel time.

**Demo login (mock auth)**: no passwords: pick a demo user or create one.
Anyone can sign in as anyone, so this must be replaced by real
authentication before real use. Demo users: Noa Levi and Yossi Cohen (hosts
with seeded spots), Dana Mizrahi and Avi Peretz (renters).

## Stack

- **Next.js 16** (App Router, Cache Components) + **Tailwind CSS 4**
- **PostgreSQL 16** via **Prisma 7** (`@prisma/adapter-pg` driver adapter)
- **PWA**: `src/app/manifest.json`, `public/sw.js` service worker, `public/offline.html` fallback
- **Deployment**: Render Blueprint (`render.yaml`)

## Local development

Requires Node 22 and a PostgreSQL 16 server.

```bash
npm install
cp .env.example .env        # then set DATABASE_URL
npm run db:migrate          # applies prisma/migrations to your database
npm run db:seed             # demo users and spots (safe to re-run)
npm run dev                 # http://localhost:3000 (redirects to /he or /en)
```

`DATABASE_URL` is required even for `prisma generate` (run by `dev` and
`build`). A missing value fails immediately with a clear error.

| Script               | What it does                                      |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Generate Prisma client, start the dev server      |
| `npm run build`      | Generate Prisma client, production build          |
| `npm run start`      | Serve the production build                        |
| `npm run lint`       | ESLint                                            |
| `npm run typecheck`  | TypeScript, no emit (run after a build or `dev`)  |
| `npm run db:migrate` | Create/apply migrations in development            |
| `npm run db:deploy`  | Apply pending migrations (production)             |
| `npm run db:seed`    | Insert missing demo users/spots (idempotent)      |
| `npm run db:studio`  | Prisma Studio database browser                    |
| `npm test`           | Unit tests (time zones, pricing, availability)    |

The service worker registers only in production builds. To test offline
mode, run `npm run build && npm run start`, open an upcoming booking, then go
offline in DevTools and reload: the booking page (with gate details) still
opens, and any other page shows the offline screen listing saved bookings.
Signing out deletes the saved booking pages from the device.

## Project layout

```
prisma/
  schema.prisma                 Data model (User, ParkingSpot, availability, Booking, Review)
  migrations/                   Generated SQL + hand-written integrity constraints
src/
  proxy.ts                      Redirects locale-less URLs to /he or /en
  app/[lang]/                   All pages, under the locale root segment
    page.tsx                    Map search
    spots/[spotId]/             Spot details + checkout
    bookings/                   Renter bookings + booking details
    host/                       Host dashboard, new spot, manage spot
    login/                      Mock login
    account/                    Profile, language, sign out
  app/api/geocode/route.ts      Tel Aviv address search (OpenStreetMap Nominatim)
  app/api/health/route.ts       Render health check
  app/manifest.json             Web app manifest
  i18n/                         Locale config + Hebrew/English dictionaries
  lib/                          Pure domain logic (time zones, pricing, availability,
                                vehicle sizes) + Prisma client, mock auth, form readers
  actions/                      Server actions (bookings, spots, availability, auth)
  server/                       Server-only queries (search, ownership, row lock)
  components/                   Shared React components (forms, maps)
public/
  sw.js, offline.html, icons/   PWA assets
render.yaml                     Render Blueprint (web service + Postgres)
```

## Data integrity

Business rules the Prisma schema cannot express are enforced by PostgreSQL in
`prisma/migrations/*_integrity_constraints/migration.sql`:

- No double-booking: an `EXCLUDE` constraint over `tstzrange(startsAt, endsAt)`
  for confirmed bookings of the same spot (safe under concurrent checkouts).
- Bookings last at least 1 hour, on 30-minute boundaries.
- Spots must be inside the Tel Aviv-Yafo bounding box; prices in whole shekels.
- Weekly availability rules and one-off exceptions cannot overlap.
- Ratings are 1-5.

Booking creation and adding a blocked window both lock the spot's row in a
transaction, so a booking can't slip into time a host is blocking at the
same moment.

Money is stored as integer agorot (₪1 = 100). Times are stored in UTC and
displayed in Asia/Jerusalem.

## Deployment (Render)

1. Push this repository to GitHub.
2. In Render: **New > Blueprint**, select the repository. Render reads
   `render.yaml` and creates `tlvpark-db` (PostgreSQL) and `tlvpark-web`.
3. Each deploy runs `npm ci --include=dev && npm run build`, then
   `npm run db:deploy && npm run db:seed && npm run start`.

The free Postgres plan expires after 30 days; see the comments in `render.yaml`.
