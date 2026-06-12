import { prisma } from "./prisma";

// Admin-configurable settings live in the AppConfig table so the price can
// be changed without a redeploy.

const TICKET_PRICE_KEY = "TICKET_PRICE_CENTS";
const DEFAULT_TICKET_PRICE_CENTS = 2500; // €25

/** Returns the current ticket price in euro cents. */
export async function getTicketPriceCents(): Promise<number> {
  const row = await prisma.appConfig.findUnique({
    where: { key: TICKET_PRICE_KEY },
  });
  const parsed = row ? parseInt(row.value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_TICKET_PRICE_CENTS;
}

/** Updates the ticket price (cents). Admin only. */
export async function setTicketPriceCents(cents: number): Promise<void> {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new Error("Ticket price must be a positive integer (cents).");
  }
  await prisma.appConfig.upsert({
    where: { key: TICKET_PRICE_KEY },
    update: { value: String(cents) },
    create: { key: TICKET_PRICE_KEY, value: String(cents) },
  });
}

/** Formats euro cents as a localized currency string, e.g. "€25.00". */
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
