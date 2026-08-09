import { PrismaClient, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Seeds Commontone's initial event catalogue. Commontone is the organizing
// company; each event below is one production it presents.
//
// ── Editorial content for Music Day in Azerbaijan ──
const MDA_ARTISTS = [
  { name: "Aziz Panah", role: "Oboe", bio: "" },
  { name: "Shams Agazade", role: "Violine", bio: "" },
  { name: "Farid Ganbarli", role: "Kamancheh", bio: "" },
  { name: "Nargiz Aliyeva", role: "Klavier", bio: "" },
];

// Ticket tiers. priceCents on the Event stays the entry-level price.
const MDA_TIERS = [
  { name: "Standard Ticket", priceCents: 2190, note: "Regulärer Eintritt" },
  { name: "Support Ticket", priceCents: 2990, note: "Unterstützt das Projekt" },
];

const MDA_DESCRIPTION = `Anlässlich des Aserbaidschanischen Nationalen Musiktages laden wir euch herzlich zu einem besonderen Konzertabend ein. Entdeckt die faszinierende Vielfalt Aserbaidschans – eines Landes im Kaukasus, in dem Europa und Asien aufeinandertreffen und sich unterschiedliche kulturelle Einflüsse in Musik, Kunst und Tradition widerspiegeln.
Freut euch auf ein abwechslungsreiches Programm mit Werken bedeutender aserbaidschanischer Komponisten sowie traditionellen Volksmelodien. Das Programm vermittelt einen musikalischen Einblick in die Kultur Aserbaidschans – geprägt von den Traditionen, der Geschichte und den vielfältigen Einflüssen des Kaukasus.
Lasst euch von einer einzigartigen Klangwelt inspirieren, entdeckt eine vielleicht noch unbekannte Musikkultur und erlebt einen Abend voller Musik, Begegnung und kulturellem Austausch. Wir freuen uns darauf, euch bei unserem Konzert begrüßen zu dürfen!`;

// Generates `rows × seatsPerRow` seat records for an event. Idempotent:
// skipDuplicates means re-running never resets an existing seat's status.
async function ensureSeats(eventId: string, rows: number, seatsPerRow: number) {
  const letters = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i),
  );
  const data = [];
  for (const row of letters) {
    for (let n = 1; n <= seatsPerRow; n++) {
      data.push({ eventId, label: `${row}${n}`, row, number: n });
    }
  }
  await prisma.seat.createMany({ data, skipDuplicates: true });
  return data.length;
}

async function main() {
  console.log("Seeding database…");

  const mda = await prisma.event.upsert({
    where: { slug: "national-music-day-2026" },
    update: {}, // don't clobber edits made via admin
    create: {
      slug: "national-music-day-2026",
      status: EventStatus.PUBLISHED,
      name: "Music Day in Azerbaijan",
      subtitle:
        "Presented by Commontone · Aserbaidschanischer Nationaler Musiktag",
      type: "Classical Music Concert",
      description: MDA_DESCRIPTION,
      startsAt: new Date("2026-09-13T18:00:00+02:00"),
      endsAt: new Date("2026-09-13T21:00:00+02:00"),
      doorsTime: "17:30",
      venueName: "Einstein Kultur",
      venueStreet: "Einsteinstraße 42",
      venuePostalCode: "81675",
      venueCity: "Munich",
      venueCountry: "Germany",
      venueCountryCode: "DE",
      // Tickets are sold externally — replace with the real shop link.
      ticketUrl: null,
      imageUrl: "/images/mugham-ensemble.jpeg",
      isFree: false,
      priceCents: 2190, // entry-level (Standard) price
      currency: "eur",
      rows: 12,
      seatsPerRow: 10,
      orderPrefix: "NM2026",
      artistsJson: JSON.stringify(MDA_ARTISTS),
      programJson: JSON.stringify([]),
      tiersJson: JSON.stringify(MDA_TIERS),
      contactEmail: "info@commontone.de",
    },
  });
  const seats = await ensureSeats(mda.id, mda.rows, mda.seatsPerRow);
  console.log(
    `Event "${mda.name}" (${mda.slug}) — from €${(mda.priceCents / 100).toFixed(2)}, ${seats} seats.`,
  );

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
