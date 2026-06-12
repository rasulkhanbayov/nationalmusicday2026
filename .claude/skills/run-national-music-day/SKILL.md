---
name: run-national-music-day
description: Build, launch, and drive the National Music Day 2026 ticketing web app (Next.js). Use to run, start, serve, smoke-test, or screenshot the site, the seat-booking flow, the Stripe checkout, or the admin dashboard locally.
---

# Run National Music Day 2026

A Next.js 15 ticketing site for a classical concert: home page, interactive
120-seat selection, guest checkout → Stripe Checkout, PDF/QR tickets by email,
and an admin dashboard with QR validation. PostgreSQL via Prisma.

It's a **web app**, so the driver is an HTTP smoke script
([driver.mjs](.claude/skills/run-national-music-day/driver.mjs)) that hits the
real API routes the browser UI calls — seat map, checkout (creates a live
Stripe session), and admin auth-guard. There is no GUI binary to screenshot;
the server is driven over HTTP with `curl` / `fetch`.

**All paths below are relative to the repo root** (the `<unit>`).

## Prerequisites

- Node 18+ (verified on v24). `npm install` already vendors everything; no
  `apt-get` needed on the dev machine.
- A **PostgreSQL** database. A free Neon (`postgresql://...?sslmode=require`)
  string in `.env` works.
- `.env` present (copy from `.env.example`). The booking flow needs **Stripe
  test keys** (`sk_test_…`, `pk_test_…`) or `/api/checkout` returns 500.

## Build / setup

```bash
npm install                              # installs deps + runs prisma generate
npx prisma migrate dev --name init       # create tables (idempotent if synced)
npx tsx prisma/seed.ts                   # seed 120 seats + default €25 price
```

Seed is idempotent — rerunning it never resets seat status. Expect:
`Ensured 120 seats (12 rows × 10).`

## Run (agent path) — START HERE

Launch the dev server in the background and **poll** until it answers (Next
compiles on first request, so don't trust the launch line alone):

```bash
npm run dev > /tmp/nmd-dev.log 2>&1 &
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  [ "$code" = "200" ] && { echo "READY (HTTP $code)"; break; }
  sleep 2
done
```

Then drive the real booking + admin flows:

```bash
node .claude/skills/run-national-music-day/driver.mjs
```

Expected tail (12 checks, all passing):

```
  ✓ seat map has 120 seats — 120 seats
  ✓ POST /api/checkout responds 200 — seats A1,A2
  ✓ checkout returns a Stripe Checkout URL — got stripe url
  ✓ chosen seats are now RESERVED — A1,A2
  ✓ POST /api/admin/validate rejects unauthenticated (401) — status 401

12 passed, 0 failed
```

The driver picks the first two AVAILABLE seats, posts a guest checkout, asserts
a `checkout.stripe.com` URL comes back, then re-fetches the map to confirm those
seats flipped to **RESERVED**. Point it elsewhere with
`BASE=http://host:port node .claude/skills/run-national-music-day/driver.mjs`.

### Spot-check individual surfaces with curl

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/seats   # 200
curl -s http://localhost:3000/api/seats | head -c 200                  # seat JSON
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/login        # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  http://localhost:3000/admin/dashboard            # 307 -> /api/auth/signin (protected)
```

## Run (human path)

`npm run dev`, then open <http://localhost:3000>. Booking is at `/seats`; admin
at `/admin` (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`). Test
card on the Stripe page: `4242 4242 4242 4242`, any future expiry, any CVC.

## Test

```bash
npx tsc --noEmit     # typecheck (clean)
npx next lint        # eslint (no warnings)
```

## Gotchas

- **Stripe `expires_at` must be ≥ 30 min.** `RESERVATION_MINUTES` in
  [src/lib/constants.ts](src/lib/constants.ts) is kept in sync with the Stripe
  session expiry; setting it below 30 makes `/api/checkout` 500 with
  *"expires_at … must be at least 30 minutes."* Don't lower it.
- **`/api/checkout` needs real Stripe test keys.** With the placeholder
  `sk_test_xxx` the route returns 500 ("Payment could not be started"). The
  driver reports this distinctly: `status 500 … (Stripe keys set in .env?)`.
- **The Stripe client is lazy** ([src/lib/stripe.ts](src/lib/stripe.ts)) — a
  Proxy that constructs on first use. This is deliberate so `next build` /
  page-data collection doesn't crash when keys are absent. Don't "simplify" it
  back to a top-level `new Stripe()`.
- **Email failures are non-fatal.** With an invalid `RESEND_API_KEY` the
  purchase still completes; `fulfillOrder` catches the send error and logs
  `[orders] Confirmation email failed for NM2026-…`. The success page still
  returns 200. The Resend test sender `onboarding@resend.dev` only delivers to
  the Resend account's own email.
- **The driver leaves real reservations.** Each run reserves 2 seats and
  creates a `PENDING` order. Holds auto-expire after 30 min; to reset hard,
  `npm run db:reset` (drops + re-seeds — destroys all orders).
- **`force-dynamic` everywhere.** Pages/APIs are `export const dynamic =
  "force-dynamic"`, so there's no static cache to bust — but first hit to each
  route still compiles in dev (a few seconds).

## Troubleshooting

- **`curl ... 000` / "Driver crashed: fetch failed"** — server isn't up yet.
  Poll the readiness loop above; check `tail -20 /tmp/nmd-dev.log`.
- **A bare `&&` readiness one-liner exits 1 even when ready** — the trailing
  guard runs after a successful `break`; the printed `READY` line is the truth.
  Harmless; the driver doesn't depend on it.
- **`checkout returns a Stripe Checkout URL — no url` / 500** — Stripe keys are
  placeholders or invalid. Put real `sk_test_…` / `pk_test_…` in `.env` and
  restart `npm run dev` (server-side env is read at boot).
- **Prisma `P1001` can't reach database** — `DATABASE_URL` wrong/unreachable
  (Neon string needs `?sslmode=require`). Fix `.env`, rerun migrate + seed.
- **`migrate` says "Already in sync"** — fine; tables already exist. Run the
  seed and move on.
