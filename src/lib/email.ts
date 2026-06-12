import { Resend } from "resend";
import { EVENT } from "./constants";
import { formatEuros } from "./config";
import { renderTicketPdf, type TicketData } from "./ticket-pdf";
import { compareSeatLabels } from "./utils";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.EMAIL_FROM ||
  "National Music Day 2026 <tickets@nationalmusicday2026.com>";

export type ConfirmationEmailInput = {
  to: string;
  purchaserName: string;
  orderNumber: string;
  seatLabels: string[];
  totalCents: number;
  tickets: TicketData[];
};

function buildHtml(input: ConfirmationEmailInput): string {
  const seats = [...input.seatLabels].sort(compareSeatLabels).join(", ");
  const navy = "#0a1733";
  const gold = "#c9a14a";

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f5f8;font-family:Helvetica,Arial,sans-serif;color:${navy};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e9f0;">
          <tr>
            <td style="background:${navy};padding:36px 40px;">
              <h1 style="margin:0;color:#ffffff;font-family:Georgia,serif;font-size:26px;">${EVENT.name}</h1>
              <p style="margin:6px 0 0;color:${gold};font-style:italic;font-size:14px;">${EVENT.subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;margin:0 0 16px;">Dear ${input.purchaserName},</p>
              <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#33405c;">
                Thank you for your purchase. We are delighted to welcome you to an evening
                celebrating Azerbaijan's National Music Day. Your tickets are attached to
                this email as PDFs — each one carries a unique QR code for entry.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border-radius:10px;padding:0;margin:0 0 24px;">
                <tr><td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a869c;">Order</p>
                  <p style="margin:0 0 16px;font-size:16px;font-weight:bold;">${input.orderNumber}</p>

                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a869c;">Date</p>
                  <p style="margin:0 0 16px;font-size:15px;">${EVENT.dateLong} · Doors ${EVENT.doorsTime}, Start ${EVENT.startTime}</p>

                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a869c;">Venue</p>
                  <p style="margin:0 0 16px;font-size:15px;">${EVENT.venue.name}<br/>${EVENT.venue.street}, ${EVENT.venue.postalCode} ${EVENT.venue.city}</p>

                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a869c;">Seats</p>
                  <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:${gold};">${seats}</p>

                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a869c;">Total Paid</p>
                  <p style="margin:0;font-size:16px;font-weight:bold;">${formatEuros(input.totalCents)}</p>
                </td></tr>
              </table>

              <p style="font-size:14px;line-height:1.6;color:#33405c;margin:0 0 8px;">
                Please bring your ticket (printed or on your phone) to the entrance.
                We look forward to seeing you.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9fc;padding:20px 40px;border-top:1px solid #e6e9f0;">
              <p style="margin:0;font-size:12px;color:#7a869c;">
                ${EVENT.name} · ${EVENT.venue.name}, ${EVENT.venue.city}<br/>
                Questions? Reply to this email or contact ${EVENT.contactEmail}.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/**
 * Sends the confirmation email with one PDF ticket attached per seat.
 * Returns the Resend message id (or null if email is not configured).
 */
export async function sendConfirmationEmail(
  input: ConfirmationEmailInput,
): Promise<string | null> {
  // Generate one PDF per ticket.
  const attachments = await Promise.all(
    input.tickets.map(async (t) => ({
      filename: `ticket-${t.seatLabel}.pdf`,
      content: await renderTicketPdf(t),
    })),
  );

  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping send. Order:",
      input.orderNumber,
    );
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `Your Tickets – ${EVENT.name}`,
    html: buildHtml(input),
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
  return data?.id ?? null;
}
