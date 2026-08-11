import { z } from "zod";
import { MAX_TICKETS_PER_ORDER } from "./constants";

// General-admission checkout: quantities per ticket type, no seats.
export const checkoutSchema = z.object({
  eventId: z.string().min(1, "Missing event"),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("A valid email is required").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        tier: z.string().trim().min(1).max(120),
        quantity: z.number().int().min(0).max(MAX_TICKETS_PER_ORDER),
      }),
    )
    .min(1, "Select at least one ticket"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const validateSchema = z.object({
  ticketId: z.string().trim().min(1),
  checkIn: z.boolean().optional().default(true),
  // Optional: scope the scan to a specific event's door.
  eventId: z.string().optional().nullable(),
});

// Admin: create / edit an event.
export const eventSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  status: z.enum(["DRAFT", "PUBLISHED", "SOLD_OUT", "PAST"]),
  name: z.string().trim().min(1).max(140),
  nameEn: z.string().trim().max(140).optional().or(z.literal("")),
  subtitle: z.string().trim().max(200).optional().or(z.literal("")),
  subtitleEn: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(4000).optional().or(z.literal("")),
  notice: z.string().trim().max(2000).optional().or(z.literal("")),
  noticeEn: z.string().trim().max(2000).optional().or(z.literal("")),
  // ISO datetime-local string from the form.
  startsAt: z.string().min(1, "Start date/time is required"),
  endsAt: z.string().optional().or(z.literal("")),
  doorsTime: z.string().trim().max(20).optional().or(z.literal("")),
  venueName: z.string().trim().min(1).max(140),
  venueStreet: z.string().trim().min(1).max(140),
  venuePostalCode: z.string().trim().min(1).max(20),
  venueCity: z.string().trim().min(1).max(80),
  venueCountry: z.string().trim().max(80).optional().or(z.literal("")),
  // External ticket-shop link. Empty means "not on sale yet".
  ticketUrl: z
    .string()
    .trim()
    .url("Must be a full URL, e.g. https://…")
    .max(500)
    .optional()
    .or(z.literal("")),
  // Hero/card artwork: a path under /public (e.g. "/images/foo.jpeg") or a
  // full URL. Empty falls back to the plain navy gradient.
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  posterUrl: z.string().trim().max(500).optional().or(z.literal("")),
  isFree: z.boolean(),
  // Euros as a number from the form; ignored when isFree.
  priceEuros: z.number().min(0).max(100000),
  // Total tickets on sale. 0 / empty means unlimited.
  capacity: z.number().int().min(0).max(100000).optional(),
  rows: z.number().int().min(1).max(26),
  seatsPerRow: z.number().int().min(1).max(40),
  orderPrefix: z
    .string()
    .trim()
    .min(1)
    .max(12)
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
});

export type EventInput = z.infer<typeof eventSchema>;
