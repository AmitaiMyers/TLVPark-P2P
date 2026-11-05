# TLVPark-P2P

Peer-to-peer parking spot rental PWA for Tel Aviv-Yafo: residents rent out
private spots (driveways, underground garages, gated lots) by the hour or day,
and drivers find them on a map. Prices are in ILS (₪). UI in Hebrew (RTL) and
English.

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
| `npm run db:studio`  | Prisma Studio database browser                    |

The service worker registers only in production builds. To test offline
mode, run `npm run build && npm run start`, then go offline in DevTools.

## Project layout

```
prisma/
  schema.prisma                 Data model (User, ParkingSpot, availability, Booking, Review)
  migrations/                   Generated SQL + hand-written integrity constraints
src/
  proxy.ts                      Redirects locale-less URLs to /he or /en
  app/[lang]/                   All pages, under the locale root segment
  app/api/health/route.ts       Render health check
  app/manifest.json             Web app manifest
  i18n/                         Locale config + Hebrew/English dictionaries
  lib/db.ts                     Shared Prisma client
  components/                   Shared React components
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

Money is stored as integer agorot (₪1 = 100). Times are stored in UTC and
displayed in Asia/Jerusalem.

## Deployment (Render)

1. Push this repository to GitHub.
2. In Render: **New > Blueprint**, select the repository. Render reads
   `render.yaml` and creates `tlvpark-db` (PostgreSQL) and `tlvpark-web`.
3. Each deploy runs `npm ci --include=dev && npm run build`, then
   `npm run db:deploy && npm run start`.

The free Postgres plan expires after 30 days; see the comments in `render.yaml`.
