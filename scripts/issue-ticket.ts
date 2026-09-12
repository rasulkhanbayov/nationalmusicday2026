/**
 * Issues ticket(s) for one guest outside the public checkout, and emails the
 * QR PDFs — for a seat added after the event sold out, a guest who paid by
 * Stripe Payment Link or bank transfer, or a comp.
 *
 * The event's SOLD_OUT status is left untouched, so the public site keeps
 * showing no tickets for sale.
 *
 *   npx tsx scripts/issue-ticket.ts "First" "Last" "email@example.com" [qty] [priceEuros]
 *
 * Examples:
 *   npx tsx scripts/issue-ticket.ts Leyla Mammadova leyla@example.com
 *   npx tsx scripts/issue-ticket.ts Leyla Mammadova leyla@example.com 1 21.90
 *   npx tsx scripts/issue-ticket.ts Guest Artist artist@example.com 1 0
 */
import { PrismaClient } from "@prisma/client";
import { createPendingOrder, fulfillOrder } from "../src/lib/orders";

const prisma = new PrismaClient();
const SLUG = "national-music-day-2026";

async function main() {
  const [firstName, lastName, email, qtyArg, priceArg] = process.argv.slice(2);

  if (!firstName || !lastName || !email) {
    console.error(
      'Usage: npx tsx scripts/issue-ticket.ts "First" "Last" "email@example.com" [qty] [priceEuros]',
    );
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Not a valid email address: ${email}`);
    process.exit(1);
  }

  const event = await prisma.event.findUniqueOrThrow({ where: { slug: SLUG } });
  const quantity = Math.max(1, Math.min(10, parseInt(qtyArg ?? "1", 10) || 1));
  const priceCents =
    priceArg !== undefined
      ? Math.round(parseFloat(priceArg) * 100)
      : event.priceCents;

  const before = await prisma.ticket.count({ where: { eventId: event.id } });
  console.log(`Event : ${event.name}`);
  console.log(`Status: ${event.status} (unchanged by this script)`);
  console.log(`Issued: ${before} tickets so far\n`);
  console.log(
    `Issuing ${quantity} x EUR ${(priceCents / 100).toFixed(2)} for ${firstName} ${lastName} <${email}>...`,
  );

  const order = await createPendingOrder({
    eventId: event.id,
    firstName,
    lastName,
    email,
    items: [{ tier: "Standard Ticket", priceCents, quantity }],
    quantity,
    totalCents: priceCents * quantity,
  });

  await fulfillOrder({ orderId: order.id });

  const tickets = await prisma.ticket.findMany({
    where: { orderId: order.id },
    select: { ticketId: true },
    orderBy: { ticketId: "asc" },
  });
  const after = await prisma.ticket.count({ where: { eventId: event.id } });
  const ev = await prisma.event.findUniqueOrThrow({
    where: { id: event.id },
    select: { status: true },
  });

  console.log(`\nOK - Order ${order.orderNumber}`);
  for (const t of tickets) console.log(`  ticket ${t.ticketId}`);
  console.log(`  emailed to ${email}`);
  console.log(`\nTickets now issued: ${after}   Event status: ${ev.status}`);
}

main()
  .catch((e) => {
    console.error("Failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
