import { z } from "zod";
import { MAX_SEATS_PER_ORDER } from "./constants";

const seatLabelRegex = /^[A-L]([1-9]|10)$/;

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("A valid email is required").max(160),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),
  seats: z
    .array(z.string().regex(seatLabelRegex, "Invalid seat"))
    .min(1, "Select at least one seat")
    .max(MAX_SEATS_PER_ORDER, `At most ${MAX_SEATS_PER_ORDER} seats`),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const validateSchema = z.object({
  ticketId: z.string().trim().min(1),
  checkIn: z.boolean().optional().default(true),
});

export const priceUpdateSchema = z.object({
  // Accept euros as a number (e.g. 25 or 25.5) from the admin form.
  euros: z.number().positive().max(100000),
});
