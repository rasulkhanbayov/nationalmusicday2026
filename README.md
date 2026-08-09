# Commontone — Ticketing Platform

The ticketing platform for **Commontone**, an event organizing company presenting
cultural concerts across Germany. Commontone staff create and publish events from
the admin area; visitors browse the catalogue and buy tickets via our ticketing
partner.

- 🎭 **Multi-event** — each event has its own venue, schedule, pricing and programme
- 🔗 **Tickets sold externally** — each event links out to a ticketing partner via `ticketUrl`
- 🔐 Admin: event CRUD with publish/draft workflow
- 🎼 Elegant navy & gold concert-hall design

> **Ticketing is off.** Tickets are currently sold on a third-party site, so the
> public site is an event catalogue with outbound "Buy Tickets" links. The
> built-in ticketing stack (seat selection, Stripe, PDF/QR tickets, email,
> door scanner) is **still in the repo but dormant** — see
> [Re-enabling built-in ticketing](#re-enabling-built-in-ticketing).

## Tech Stack

| Layer     | Choice                                  |
| --------- | --------------------------------------- |
| Framework | Next.js 15 (App Router) + React 19 + TS |
| Styling   | TailwindCSS + shadcn/ui                  |
| Database  | PostgreSQL + Prisma                      |
| Payments  | External ticketing partner (Stripe code dormant) |
| Email     | Resend                                   |
| PDF / QR  | @react-pdf/renderer + qrcode             |
| Auth      | NextAuth (admin credentials only)        |
| Hosting   | Vercel                                   |

## Data Model

Everything hangs off `Event` — there is no global event configuration.

```
Event ─┬─ Seat    (AVAILABLE | RESERVED | SOLD, unique label per event)
       ├─ Order   (guest checkout, PENDING | PAID | CANCELLED)
       └─ Ticket  (one per seat; QR payload + check-in state)

AppConfig — global key/value settings (not per-event)
```

An `Event` carries its own name, venue, schedule, `isFree`/`priceCents`, editorial
JSON (artists, programme) and — importantly — **`ticketUrl`**, the external shop
link its "Buy Tickets" button points at. Status is
`DRAFT | PUBLISHED | SOLD_OUT | PAST`; only non-draft events are publicly visible.

`Seat`, `Order` and `Ticket` belong to the dormant built-in ticketing flow. They
remain in the schema so it can be switched back on, but nothing writes to them
while tickets are sold externally.

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` (see the table below). At minimum you need a `DATABASE_URL` plus
the NextAuth/admin values. The Stripe and Resend keys are only used by the
dormant built-in ticketing flow and can be left unset.

### 3. Set up the database

```bash
npm run prisma:migrate    # creates tables (name it e.g. "init")
npm run db:seed           # creates the starter events + their seats
```

> No local Postgres? Use a free hosted DB (Neon, Supabase, Railway) and paste
> its connection string into `DATABASE_URL`.

The seed creates two Commontone events: a **paid** flagship concert
(National Music Day 2026, €25) and a **free** recital. Both ship with
placeholder `tickets.example.com` ticket URLs — replace these in the admin. The
seed is idempotent, so re-running never clobbers edits made in the admin.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

- **Public site:** `/`
- **Event catalogue:** `/events`
- **Event detail:** `/events/[slug]`
- **Buy tickets:** external link per event (set in the admin)
- **Admin:** `/admin` → log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## Environment Variables

| Variable                             | Required | Purpose                                   |
| ------------------------------------ | -------- | ----------------------------------------- |
| `DATABASE_URL`                       | ✅       | PostgreSQL connection string              |
| `NEXT_PUBLIC_SITE_URL`               | ✅       | Public origin (OG tags, sitemap)          |
| `NEXTAUTH_SECRET`                    | ✅       | Session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`                       | ✅       | Auth base URL                             |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`     | ✅       | Single admin login                        |
| `STRIPE_SECRET_KEY`                  | ⚪️\*     | Stripe server key                          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚪️\*     | Stripe client key                          |
| `STRIPE_WEBHOOK_SECRET`              | ⚪️\*     | Verifies webhook signatures               |
| `RESEND_API_KEY`                     | ⚪️\*     | Sends ticket emails                        |
| `EMAIL_FROM`                         | ⚪️\*     | Verified Resend sender                     |

\* Only needed if you re-enable built-in ticketing. Unused while tickets are
sold externally — you can leave them unset.

## How the Ticket Flow Works

```
/events → /events/[slug]  (catalogue → event detail)
   → "Buy Tickets" links out to event.ticketUrl (new tab)
   → the visitor books on the ticketing partner's site
```

Set each event's **Ticket shop URL** in the admin. Events with no `ticketUrl`
render a disabled "Tickets coming soon" button rather than a dead link, so an
event can be published before sales open. Sold-out and past events show a
disabled button too.

Because sales happen off-site, this app has no record of who bought what — the
admin dashboard's order and revenue figures only reflect the dormant built-in
flow, and stay empty.

## Re-enabling built-in ticketing

The seat-selection, Stripe, email, PDF/QR and scanner code is all still present.
To sell on this site again:

1. Flip both feature flags to `true`:
   - `BUILT_IN_CHECKOUT_ENABLED` in [`src/app/api/checkout/route.ts`](src/app/api/checkout/route.ts)
   - `BUILT_IN_BOOKING_ENABLED` in [`src/app/events/[slug]/seats/page.tsx`](src/app/events/[slug]/seats/page.tsx)
2. Point the event CTAs back at `/events/[slug]/seats` in
   [`src/components/event-detail.tsx`](src/components/event-detail.tsx) (see `TicketButton`).
3. Clear `ticketUrl` on events that should use the built-in flow.
4. Restore the Stripe/Resend env vars and re-add the `/events/[slug]/seats`
   entry to [`src/app/sitemap.ts`](src/app/sitemap.ts).

The original flow: seats are held in a **serializable transaction** for 30
minutes, an order number comes from an atomic per-event counter, and
`fulfillOrder()` is idempotent so repeated Stripe webhooks never issue duplicate
tickets or emails.

## Admin

- **Events** (`/admin/events`): create, edit and publish events — venue, schedule,
  **ticket shop URL**, displayed price, artists and programme. This is the main
  screen you'll use.
- **Dashboard** (`/admin/dashboard`) and **Scan** (`/admin/scan`) belong to the
  dormant built-in flow. They still load, but show no data while tickets are
  sold externally.

Pricing lives on each event and is display-only — the actual charge happens on
the ticketing partner's site.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add all env vars (use a production `DATABASE_URL`, e.g. Neon).
3. Set the build command to the default (`npm run build` runs `prisma generate`).
4. Run `prisma migrate deploy` against the production DB, then seed once:
   ```bash
   npm run prisma:deploy && npm run db:seed
   ```
5. Set each event's **Ticket shop URL** in the admin so the "Buy Tickets"
   buttons point at the real ticketing partner (the seed data ships with
   `tickets.example.com` placeholders).

## Project Structure

```
prisma/
  schema.prisma         # Event, Seat, Order, Ticket, AppConfig
  seed.ts               # starter events + their seats
src/
  app/
    page.tsx            # Home (hero + upcoming events)
    events/             # catalogue + [slug] detail  ([slug]/seats: dormant)
    success/            # dormant — post-purchase confirmation
    admin/              # login, events (CRUD); dashboard + scan dormant
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

© Commontone. Cultural concerts across Germany.
