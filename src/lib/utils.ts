import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner used by shadcn/ui components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Builds a padded order number like "NM2026-000123" from a prefix + sequence. */
export function formatOrderNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
}

/** Builds a per-seat ticket id like "NM2026-000123-A5". */
export function buildTicketId(orderNumber: string, seatLabel: string): string {
  return `${orderNumber}-${seatLabel}`;
}

/** Sorts seat labels naturally: A1, A2, …, A10, B1, … */
export function compareSeatLabels(a: string, b: string): number {
  const rowA = a.charCodeAt(0);
  const rowB = b.charCodeAt(0);
  if (rowA !== rowB) return rowA - rowB;
  return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
}
