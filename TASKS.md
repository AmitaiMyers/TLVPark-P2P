# Your tasks

What's left for you after the build, in order. Items marked **(decision)** need
your call before real users arrive.

## 1. Deploy to Render (about 10 minutes)

- [ ] In [Render](https://dashboard.render.com): **New → Blueprint**, connect
      GitHub, pick `AmitaiMyers/TLVPark-P2P`, and approve the plan. It creates
      `tlvpark-db` (PostgreSQL 16) and `tlvpark-web`, both in Frankfurt, both free.
- [ ] Wait for the first deploy (the build takes a few minutes; the first start
      runs the migrations and loads the demo data).
- [ ] Open `https://<your-service>.onrender.com/api/health`; it should return `{"status":"ok"}`.
- [ ] Put a reminder in your calendar **25 days after the database is created**.
      Render's free PostgreSQL expires after 30 days: upgrade its `plan` in
      `render.yaml` (e.g. `basic-256mb`, about $6/month) or recreate it.
- [ ] If Render rejects a field in `render.yaml`, tell me the message. Render's
      docs were not reachable from the build session, so the Blueprint was
      written from the known spec and could not be checked live.

## 2. Check on a real phone (things the build sandbox could not reach)

- [ ] **Map tiles** (OpenStreetMap) show streets on the search and spot pages.
- [ ] **Address search** when listing a spot ("Find on map") finds a Tel Aviv
      address and drops the pin.
- [ ] **Install:** Android Chrome offers "Install app". On iPhone Safari, open a
      booking and follow the "Add to Home Screen" hint.
- [ ] **Offline gate access:** book a spot, open the booking, switch on airplane
      mode, reopen the app. The booking with the gate number should still open.
- [ ] Try the demo flows: sign in as **Dana** (renter) and book; sign in as
      **Noa** (host) to see the booking, block time, or cancel it.

## 3. Before real users (decision)

- [ ] **Real sign-in.** The login is a demo: anyone can act as anyone, which
      exposes gate codes. Options: email magic link, Google, or phone SMS code.
- [ ] **Real payments.** Checkout is simulated. Choose a provider (Israeli
      options include Tranzila, Cardcom, Meshulam; or Stripe) and a refund policy.
- [ ] **Stop loading demo data in production:** remove `npm run db:seed` from
      `startCommand` in `render.yaml`, and delete the demo users and spots.
- [ ] **Map and geocoding providers.** The free OpenStreetMap tile and Nominatim
      servers forbid heavy use. Before launch, switch to a provider with a free
      tier (e.g. MapTiler or Stadia Maps). Each needs an API key.
- [ ] **Legal:** terms of use and a privacy policy (the app stores phone numbers
      and gate codes); check Tel Aviv municipal rules and tax rules for renting
      out private parking.

## 4. Confirm the defaults chosen for you (decision)

- [ ] A booking is at most **30 days** long.
- [ ] Gate number and instructions are shown only for **upcoming and active**
      bookings (hidden after the booking ends or is cancelled).
- [ ] Prices are **whole shekels** per hour (₪15 allowed, ₪15.50 not).
- [ ] Demo listings are written in English (they appear in English in the Hebrew UI).

## 5. Nice to have later

- [ ] Photos of each spot (needs storage such as Cloudinary or S3).
- [ ] Commit an automated browser test suite (Playwright). The flows were tested
      end to end during the build, but those scripts are not in the repo.
- [ ] Error monitoring (e.g. Sentry) and rate limiting on sign-in and booking.
- [ ] A link to a missing spot or booking shows the "not found" page but with
      HTTP status 200 (a Next.js streaming behavior); fine for users, matters
      only for SEO.
