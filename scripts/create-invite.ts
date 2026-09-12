/**
 * Creates a private purchase link for a sold-out event.
 *
 * The guest opens the link, picks Standard or Support, pays via Stripe and
 * receives QR tickets automatically — exactly like a normal buyer. The public
 * event page keeps showing SOLD OUT throughout.
 *
 *   npx tsx scripts/create-invite.ts [tickets] [hours] ["note"]
 *
 * Defaults: 1 ticket, 24 hours.
 *
 * Examples:
 *   npx tsx scripts/create-invite.ts
 *   npx tsx scripts/create-invite.ts 2 24 "Leyla + guest"
 */
import { PrismaClient } from "@prisma/client";
import { newInviteToken } from "../src/lib/invites";

const prisma = new PrismaClient();
const SLUG = "national-music-day-2026";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://commontone.de"
  );
}

async function main() {
  const [ticketsArg, hoursArg, note] = process.argv.slice(2);
  const maxTickets = Math.max(1, Math.min(10, parseInt(ticketsArg ?? "1", 10) || 1));
  const hours = Math.max(1, Math.min(720, parseInt(hoursArg ?? "24", 10) || 24));

  const event = await prisma.event.findUniqueOrThrow({ where: { slug: SLUG } });
  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await prisma.invite.create({
    data: {
      token,
      eventId: event.id,
      maxTickets,
      expiresAt,
      note: note ?? null,
    },
  });

  const url = `${siteUrl()}/events/${event.slug}/invite?k=${token}`;

  console.log(`Event : ${event.name}`);
  console.log(`Status: ${event.status} (public page unchanged)\n`);
  console.log("Private link — send only to the intended guest:\n");
  console.log(`  ${url}\n`);
  console.log(`Valid for : ${maxTickets} ticket${maxTickets === 1 ? "" : "s"}`);
  console.log(`Expires   : ${expiresAt.toLocaleString("en-GB", { timeZone: "Europe/Berlin" })} (Berlin), in ${hours}h`);
  if (note) console.log(`Note      : ${note}`);
  console.log("\nOnce used, the link stops working automatically.");
}

main()
  .catch((e) => {
    console.error("Failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
