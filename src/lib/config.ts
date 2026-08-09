// Currency formatting helpers. Ticket pricing is now stored per-event on the
// Event row (priceCents / isFree), so there is no global price config.

/** Formats euro cents as a localized currency string, e.g. "€25.00". */
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Price label for an event: "Free" or formatted price. */
export function priceLabel(isFree: boolean, cents: number): string {
  return isFree ? "Free" : formatEuros(cents);
}
