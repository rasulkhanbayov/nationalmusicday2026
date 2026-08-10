import { PrismaClient, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Seeds Commontone's initial event catalogue. Commontone is the organizing
// company; each event below is one production it presents.
//
// ── Editorial content for Music Day in Azerbaijan ──
const MDA_ARTISTS = [
  {
    name: "Aziz Panah",
    role: "Oboe",
    roleEn: "Oboe",
    bio: "",
    instagram: "https://www.instagram.com/azizpanah_",
  },
  {
    name: "Shams Agazade",
    role: "Violine",
    roleEn: "Violin",
    bio: "",
    instagram: "https://www.instagram.com/shamsagazada",
  },
  {
    name: "Farid Ganbarli",
    role: "Kamancheh",
    roleEn: "Kamancheh",
    bio: "",
    instagram: "https://www.instagram.com/faridganbarli",
  },
  {
    name: "Nargiz Aliyeva",
    role: "Klavier",
    roleEn: "Piano",
    bio: "",
    instagram: "https://www.instagram.com/nara_pianistin_",
  },
];

// Ticket tiers. priceCents on the Event stays the entry-level price.
const MDA_TIERS = [
  {
    name: "Standard Ticket",
    nameEn: "Standard Ticket",
    priceCents: 2190,
    note: "Regulärer Eintritt",
    noteEn: "Regular admission",
  },
  {
    name: "Support Ticket",
    nameEn: "Support Ticket",
    priceCents: 2990,
    note: "Unterstützt das Projekt",
    noteEn: "Supports the project",
  },
];

const MDA_NOTICE = `Der Eintritt beinhaltet das Konzertprogramm sowie einen kleinen Empfang im Anschluss. Alkoholische Getränke werden nur an Personen ab 16 Jahren ausgegeben. Die Plätze sind begrenzt. Eine Rückerstattung ist nur im Falle einer Absage der Veranstaltung möglich.`;

const MDA_NOTICE_EN = `Admission includes the concert programme and a small reception afterwards. Alcoholic drinks are served only to guests aged 16 and over. Places are limited. Refunds are possible only if the event is cancelled.`;

const MDA_DESCRIPTION_EN = `On the occasion of Azerbaijan's National Music Day, we warmly invite you to a special evening of concert music. Discover the fascinating diversity of Azerbaijan – a country in the Caucasus where Europe and Asia meet, and where different cultural influences are reflected in music, art and tradition.
Look forward to a varied programme featuring works by significant Azerbaijani composers alongside traditional folk melodies. The programme offers a musical insight into the culture of Azerbaijan – shaped by the traditions, the history and the many influences of the Caucasus.
Let yourself be inspired by a unique world of sound, discover a musical culture that may still be unfamiliar, and experience an evening full of music, encounter and cultural exchange. We look forward to welcoming you to our concert!`;

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
      nameEn: "Music Day in Azerbaijan",
      subtitle:
        "Presented by Commontone · Aserbaidschanischer Nationaler Musiktag",
      subtitleEn: "Presented by Commontone · Azerbaijan's National Music Day",
      type: "Classical Music Concert",
      description: MDA_DESCRIPTION,
      descriptionEn: MDA_DESCRIPTION_EN,
      notice: MDA_NOTICE,
      noticeEn: MDA_NOTICE_EN,
      startsAt: new Date("2026-09-13T18:00:00+02:00"),
      endsAt: new Date("2026-09-13T21:00:00+02:00"),
      doorsTime: "17:00",
      venueName: "Einstein Kultur — Halle 1 & 2",
      venueStreet: "Einsteinstraße 42",
      venuePostalCode: "81675",
      venueCity: "Munich",
      venueCountry: "Germany",
      venueCountryCode: "DE",
      // Tickets are sold on this site via Stripe (no external shop).
      ticketUrl: null,
      imageUrl: "/images/mugham-ensemble.jpeg",
      isFree: false,
      priceCents: 2190, // entry-level (Standard) price
      capacity: 120, // total tickets on sale
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
