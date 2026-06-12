import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Hall geometry: 12 rows (A–L), 10 seats each = 120 seats.
const ROWS = "ABCDEFGHIJKL".split("");
const SEATS_PER_ROW = 10;

// Default ticket price in cents (€25). Admin can change this later.
const DEFAULT_TICKET_PRICE_CENTS = 2500;

async function main() {
  console.log("Seeding database…");

  // 1. Seats — idempotent upsert so re-running seed is safe.
  let created = 0;
  for (const row of ROWS) {
    for (let n = 1; n <= SEATS_PER_ROW; n++) {
      const label = `${row}${n}`;
      await prisma.seat.upsert({
        where: { label },
        update: {}, // never reset status of an existing seat
        create: { label, row, number: n },
      });
      created++;
    }
  }
  console.log(`Ensured ${created} seats (${ROWS.length} rows × ${SEATS_PER_ROW}).`);

  // 2. Default ticket price config.
  await prisma.appConfig.upsert({
    where: { key: "TICKET_PRICE_CENTS" },
    update: {},
    create: { key: "TICKET_PRICE_CENTS", value: String(DEFAULT_TICKET_PRICE_CENTS) },
  });
  console.log(`Set default ticket price: €${(DEFAULT_TICKET_PRICE_CENTS / 100).toFixed(2)}`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
