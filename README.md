# National Music Day 2026 — Ticketing

A production-ready ticketing website for **National Music Day 2026**, a classical music concert celebrating Azerbaijan's National Music Day at **Einstein Kultur, Munich** on **Saturday, 13 September 2026**.

- 🎫 Interactive 120-seat selection (12 rows × 10 seats)
- 👤 Guest checkout — no account required
- 💳 Stripe Checkout (EUR) with webhook fulfillment
- 📧 Automated confirmation emails with **PDF tickets + QR codes** (Resend)
- 🔐 Admin dashboard: orders, revenue, seat map, CSV export, resend, ticket price config
- 📷 QR ticket validation / door check-in
- 🎼 Elegant navy & gold concert-hall design

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

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` (see the table below). At minimum you need a `DATABASE_URL`.
Stripe/Resend can be added later — the app degrades gracefully (emails are
skipped with a warning if `RESEND_API_KEY` is missing).

### 3. Set up the database

```bash
npm run prisma:migrate    # creates tables (name it e.g. "init")
npm run db:seed           # creates the 120 seats + default €25 price
```

> No local Postgres? Use a free hosted DB (Neon, Supabase, Railway) and paste
> its connection string into `DATABASE_URL`.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

- **Public site:** `/`
- **Seat selection / checkout:** `/seats`
- **Admin:** `/admin` → log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`

## Environment Variables

| Variable                             | Required | Purpose                                   |
| ------------------------------------ | -------- | ----------------------------------------- |
| `DATABASE_URL`                       | ✅       | PostgreSQL connection string              |
| `NEXT_PUBLIC_SITE_URL`               | ✅       | Public origin (Stripe redirects, OG, SEO) |
| `STRIPE_SECRET_KEY`                  | ✅\*     | Stripe server key                          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅\*     | Stripe client key                          |
| `STRIPE_WEBHOOK_SECRET`              | ✅\*     | Verifies webhook signatures               |
| `RESEND_API_KEY`                     | ✅\*     | Sends ticket emails                        |
| `EMAIL_FROM`                         | ✅\*     | Verified Resend sender                     |
| `NEXTAUTH_SECRET`                    | ✅       | Session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`                       | ✅       | Auth base URL                             |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`     | ✅       | Single admin login                        |

\* Required for the full purchase flow; optional while developing the UI.

## Stripe Setup

1. Grab test keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).
2. Forward webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

3. The webhook handles `checkout.session.completed` (fulfill), `…expired` and
   `…async_payment_failed` (release seats).

The success page also performs a **fallback fulfillment** by retrieving the
Stripe session directly, so tickets are issued even if the webhook is delayed.

## How the Booking Flow Works

```
Home → /seats (pick seats + guest details) → POST /api/checkout
   → seats RESERVED (30-min hold) + PENDING order created
   → redirect to Stripe Checkout
   → on success: webhook → fulfillOrder()
        · seats → SOLD
        · one Ticket per seat (QR = ticket_id)
        · confirmation email with PDF tickets
   → /success confirmation page
```

Seat reservations use a **serializable transaction** so two buyers can't grab
the same seat. Expired holds are automatically treated as available.

## Admin

- **Dashboard** (`/admin/dashboard`): tickets sold / remaining, revenue,
  checked-in count, live 120-seat map, order table, CSV export, resend tickets,
  and an editable ticket price (`TICKET_PRICE`).
- **Scan** (`/admin/scan`): camera QR scanner (with manual entry) →
  `Valid Ticket` / `Already Used` / `Invalid Ticket`, marking valid tickets
  checked in.

Ticket price is stored in the `AppConfig` table and can be changed any time
without redeploying. Past orders keep the price they were sold at.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add all env vars (use a production `DATABASE_URL`, e.g. Neon).
3. Set the build command to the default (`npm run build` runs `prisma generate`).
4. Run `prisma migrate deploy` against the production DB, then seed once:
   ```bash
   npm run prisma:deploy && npm run db:seed
   ```
5. Create a **production** Stripe webhook pointing at
   `https://your-domain/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`.

## Project Structure

```
prisma/
  schema.prisma         # Seat, Order, Ticket, AppConfig
  seed.ts               # 120 seats + default price
src/
  app/
    page.tsx            # Home (hero, about, artists, program, venue, CTA)
    seats/              # Seat selection + guest checkout
    success/            # Post-payment confirmation
    admin/              # login, dashboard, scan
    api/                # seats, checkout, webhooks/stripe, orders/confirm,
                        # admin/{validate,export,resend,price}, auth
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx
  components/           # UI, seat-map, booking-client, admin/*
  lib/                  # prisma, seats, orders, email, ticket-pdf, qrcode,
                        # stripe, config, validation, auth, stats, constants
```

## Scripts

| Script                   | Description                  |
| ------------------------ | ---------------------------- |
| `npm run dev`            | Start dev server             |
| `npm run build`          | Production build             |
| `npm run prisma:migrate` | Create/apply migrations      |
| `npm run db:seed`        | Seed seats + default price   |
| `npm run prisma:studio`  | Browse the database          |
| `npm run db:reset`       | Reset DB and re-seed         |

---

© National Music Day. Built for an evening of Azerbaijani classical music in Munich.
