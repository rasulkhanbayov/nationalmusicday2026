# Commontone — Ticketing Platform

The ticketing platform for **Commontone**, an event organizing company presenting
cultural concerts across Germany. Commontone staff create and publish events from
the admin area; visitors browse the catalogue and buy tickets directly on the
site via Stripe.

- 🎭 **Multi-event** — each event has its own venue, schedule, pricing and programme
- 💳 **Direct Stripe checkout** — general admission, no seat selection
- 🎟️ Multiple ticket types per event (e.g. Standard / Support)
- 📧 Unique QR ticket per admission, emailed as PDF via Resend
- 🔐 Admin: event CRUD with publish/draft workflow
- 🎼 Elegant navy & gold concert-hall design

> **How buying works.** Visitors pick a quantity per ticket type, enter their
> details, and pay through Stripe Checkout. On payment confirmation the webhook
> issues one QR-coded PDF ticket per admission and emails them all. There is no
> seat selection — admission is open seating.

## Tech Stack

| Layer     | Choice                                  |
| --------- | --------------------------------------- |
| Framework | Next.js 15 (App Router) + React 19 + TS |
| Styling   | TailwindCSS + shadcn/ui                  |
| Database  | PostgreSQL + Prisma                      |
| Payments  | Stripe Checkout                          |
| Email     | Resend                                   |
| PDF / QR  | @react-pdf/renderer + qrcode             |
| Auth      | NextAuth (admin credentials only)        |
| Hosting   | Vercel                                   |

## Data Model

Everything hangs off `Event` — there is no global event configuration.

```
Event ─┬─ Order   (guest checkout, PENDING | PAID | CANCELLED)
       │            itemsJson = [{ tier, priceCents, quantity }]
       ├─ Ticket  (one per admission; unique QR id + check-in state)
       └─ Seat    (legacy seat map — unused by general admission)

AppConfig — global key/value settings (not per-event)
```

An `Event` carries its own name, venue, schedule, artwork, editorial JSON
(artists, programme), **`tiersJson`** (the purchasable ticket types) and the
admission **`notice`**. Status is `DRAFT | PUBLISHED | SOLD_OUT | PAST`; only
non-draft events are publicly visible.

Editorial fields have optional `…En` variants (`nameEn`, `descriptionEn`,
`noticeEn`) used when a visitor switches to English; empty ones fall back to the
primary language.

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` (see the table below). Selling tickets needs the Stripe keys and
`STRIPE_WEBHOOK_SECRET`; emailing them needs `RESEND_API_KEY` and a verified
`EMAIL_FROM` sender.

### 3. Set up the database

```bash
npm run prisma:migrate    # creates tables (name it e.g. "init")
npm run db:seed           # creates the starter events + their seats
```

> No local Postgres? Use a free hosted DB (Neon, Supabase, Railway) and paste
> its connection string into `DATABASE_URL`.

The seed creates one Commontone event — *Azerbaijani National Music Day* — with two
ticket types (Standard €21.90 / Support €29.90) and the admission notice in
German and English. The seed is idempotent, so re-running never clobbers edits
made in the admin.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

- **Public site:** `/`
- **Event catalogue:** `/events`
- **Event detail:** `/events/[slug]`
- **Buy tickets:** on the event page (`#tickets`) → Stripe Checkout
- **Admin:** `/admin` → log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## Environment Variables

| Variable                             | Required | Purpose                                   |
| ------------------------------------ | -------- | ----------------------------------------- |
| `DATABASE_URL`                       | ✅       | PostgreSQL connection string              |
| `NEXT_PUBLIC_SITE_URL`               | ✅       | Public origin (OG tags, sitemap)          |
| `NEXTAUTH_SECRET`                    | ✅       | Session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`                       | ✅       | Auth base URL                             |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`     | ✅       | Single admin login                        |
| `STRIPE_SECRET_KEY`                  | ✅       | Stripe server key (`sk_test_…` / `sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅       | Stripe client key (`pk_test_…` / `pk_live_…`) |
| `STRIPE_WEBHOOK_SECRET`              | ✅       | Verifies webhook signatures (`whsec_…`)   |
| `RESEND_API_KEY`                     | ✅       | Sends ticket emails                        |
| `EMAIL_FROM`                         | ✅       | Verified Resend sender                     |

Use **test** keys (`sk_test_` / `pk_test_`) while developing — card
`4242 4242 4242 4242` completes a purchase without moving money.

## How the Ticket Flow Works

```
/events/[slug]#tickets
   → pick a quantity per ticket type + guest details
   → POST /api/checkout  → PENDING order (itemsJson = tier breakdown)
   → redirect to Stripe Checkout
   → on payment: webhook → fulfillOrder()
        · order → PAID
        · one Ticket row per admission (id NM2026-000123-01, -02, …)
        · QR-coded PDF per ticket, emailed via Resend
   → /success confirmation page
```

There is no seat selection — admission is open seating, so a ticket carries its
**type** (Standard / Support) rather than a seat.

Prices are never taken from the client: `/api/checkout` resolves each requested
tier against the event's own `tiersJson`, so a tampered request cannot invent a
ticket type or set its own price.

`fulfillOrder()` runs in a serializable transaction and is **idempotent** —
Stripe may deliver a webhook more than once, and `/success` also triggers
fulfillment as a fallback, so tickets are issued exactly once. A failed email is
logged but never rolls back a completed sale; resend it from the admin.

### Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` and restart the dev
server — server-side env is read at boot.

## Admin

- **Events** (`/admin/events`): create, edit and publish events — venue,
  schedule, artwork, prices, artists, programme and the admission notice, each
  with a DE and EN variant.
- **Dashboard** (`/admin/dashboard`): orders, revenue, CSV export, resend
  tickets for a paid order.
- **Scan** (`/admin/scan`): camera QR scanner → `Valid` / `Already Used` /
  `Invalid`, marking valid tickets checked in at the door.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add all env vars (use a production `DATABASE_URL`, e.g. Neon).
3. Set the build command to the default (`npm run build` runs `prisma generate`).
4. Run `prisma migrate deploy` against the production DB, then seed once:
   ```bash
   npm run prisma:deploy && npm run db:seed
   ```
5. Create a **production** Stripe webhook pointing at
   `https://commontone.de/api/webhooks/stripe`, subscribe it to
   `checkout.session.completed`, `checkout.session.expired` and
   `checkout.session.async_payment_failed`, then set `STRIPE_WEBHOOK_SECRET`.
6. Verify **commontone.de** as a sending domain in Resend (DKIM/SPF records at
   IONOS) so ticket emails reach real buyers.

## Project Structure

```
prisma/
  schema.prisma         # Event, Seat, Order, Ticket, AppConfig
  seed.ts               # starter events + their seats
src/
  app/
    page.tsx            # Home (hero + upcoming events)
    events/             # catalogue + [slug] detail (with #tickets purchase)
    success/            # post-payment confirmation
    admin/              # login, events (CRUD), dashboard, scan
    api/                # checkout, webhooks/stripe, orders/confirm,
                        # events/[slug]/seats, admin/{events,validate,
                        # export,resend}, auth
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx
  components/           # UI, seat-map, booking-client, event-*, admin/*
  lib/                  # prisma, events, seats, orders, email, ticket-pdf,
                        # qrcode, stripe, config, validation, auth, stats,
                        # constants
```

Platform-level branding (name, domain, contact email, tagline) lives in
`SITE` in [`src/lib/constants.ts`](src/lib/constants.ts). Everything
event-specific lives on the `Event` row.

## Scripts

| Script                   | Description                  |
| ------------------------ | ---------------------------- |
| `npm run dev`            | Start dev server             |
| `npm run build`          | Production build             |
| `npm run prisma:migrate` | Create/apply migrations      |
| `npm run db:seed`        | Seed starter events + seats  |
| `npm run prisma:studio`  | Browse the database          |
| `npm run db:reset`       | Reset DB and re-seed         |

---

© Commontone. Cultural events across Germany.
