#!/usr/bin/env node
// Smoke driver for National Music Day 2026 (Next.js ticketing app).
//
// Drives the real running server over HTTP — the same API routes the
// browser UI calls — and asserts the core booking + admin flows work:
//   1. GET  /                     → home page renders
//   2. GET  /seats                → seat selection page renders
//   3. GET  /api/seats            → 120-seat map + price JSON
//   4. POST /api/checkout         → reserves seats, returns a Stripe URL
//   5. GET  /api/seats (again)    → the chosen seats are now RESERVED
//   6. POST /api/admin/validate   → rejects unauthenticated access (401)
//
// Usage:
//   node .claude/skills/run-national-music-day/driver.mjs
//   BASE=http://localhost:3000 node .claude/skills/run-national-music-day/driver.mjs
//
// Exit code 0 = all checks passed, 1 = a check failed.
// Requires the dev server to be running (npm run dev) and the DB seeded.

const BASE = process.env.BASE || "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log(`\nDriving National Music Day at ${BASE}\n`);

  // 1. Home page
  const home = await fetch(`${BASE}/`);
  const homeHtml = await home.text();
  ok("GET / responds 200", home.status === 200, `status ${home.status}`);
  ok(
    "home page shows event title",
    /National Music Day/i.test(homeHtml),
    "found 'National Music Day'",
  );

  // 2. Seats page
  const seatsPage = await fetch(`${BASE}/seats`);
  ok("GET /seats responds 200", seatsPage.status === 200, `status ${seatsPage.status}`);

  // 3. Seat map API
  const seatsRes = await fetch(`${BASE}/api/seats`, { cache: "no-store" });
  const seatsJson = await seatsRes.json();
  ok("GET /api/seats responds 200", seatsRes.status === 200);
  ok(
    "seat map has 120 seats",
    Array.isArray(seatsJson.seats) && seatsJson.seats.length === 120,
    `${seatsJson.seats?.length} seats`,
  );
  ok(
    "price is present (cents)",
    Number.isInteger(seatsJson.priceCents) && seatsJson.priceCents > 0,
    `${seatsJson.priceCents}c`,
  );

  // Pick two AVAILABLE seats to attempt a booking.
  const available = (seatsJson.seats || []).filter((s) => s.status === "AVAILABLE");
  ok("at least 2 available seats exist", available.length >= 2, `${available.length} available`);
  const chosen = available.slice(0, 2).map((s) => s.label);

  // 4. Checkout — creates a PENDING order, holds seats, returns Stripe URL.
  // Uses a unique email so reruns don't collide on anything.
  const ts = Date.now();
  const checkoutRes = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Smoke",
      lastName: "Test",
      email: `smoke+${ts}@example.com`,
      phone: "",
      seats: chosen,
    }),
  });
  const checkoutJson = await checkoutRes.json().catch(() => ({}));

  // If Stripe keys aren't configured the route returns 500 with an error —
  // report that distinctly rather than failing opaquely.
  if (checkoutRes.status === 200) {
    ok("POST /api/checkout responds 200", true, `seats ${chosen.join(",")}`);
    ok(
      "checkout returns a Stripe Checkout URL",
      typeof checkoutJson.url === "string" &&
        checkoutJson.url.includes("checkout.stripe.com"),
      checkoutJson.url ? "got stripe url" : "no url",
    );
    ok(
      "checkout returns an order number",
      /^NM2026-\d{6}$/.test(checkoutJson.orderNumber || ""),
      checkoutJson.orderNumber,
    );

    // 5. Re-fetch the map — chosen seats should now be RESERVED.
    const after = await fetch(`${BASE}/api/seats`, { cache: "no-store" });
    const afterJson = await after.json();
    const byLabel = new Map(afterJson.seats.map((s) => [s.label, s.status]));
    const allReserved = chosen.every((l) => byLabel.get(l) === "RESERVED");
    ok("chosen seats are now RESERVED", allReserved, chosen.join(","));
  } else {
    ok(
      "POST /api/checkout responds 200",
      false,
      `status ${checkoutRes.status}: ${checkoutJson.error || "see server log"} (Stripe keys set in .env?)`,
    );
  }

  // 6. Admin validation must be protected.
  const validateRes = await fetch(`${BASE}/api/admin/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId: "NM2026-000000-A1", checkIn: false }),
  });
  ok(
    "POST /api/admin/validate rejects unauthenticated (401)",
    validateRes.status === 401,
    `status ${validateRes.status}`,
  );

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nDriver crashed:", err.message);
  console.error("Is the dev server running? (npm run dev)\n");
  process.exit(1);
});
