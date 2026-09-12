import { Resend } from "resend";
import { SITE } from "./constants";
import { prisma } from "./prisma";
import { OrderStatus } from "@prisma/client";

/**
 * Announcement emails to an event's ticket holders.
 *
 * Separate from the confirmation email in email.ts: that one is transactional
 * and carries PDF tickets; this is a plain branded message the organiser
 * writes by hand (schedule change, parking info, thank-you note).
 */

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || `${SITE.name} <${SITE.contactEmail}>`;

const NAVY = "#0a1733";
const GOLD = "#c9a14a";

/** Escapes text so an apostrophe or angle bracket can't break the markup. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Distinct paid recipients for an event.
 *
 * Deduplicated by lower-cased address, so someone who ordered twice gets one
 * email. Only PAID orders — people who abandoned checkout are not attending.
 */
export async function getRecipients(
  eventId: string,
): Promise<{ email: string; firstName: string }[]> {
  const orders = await prisma.order.findMany({
    where: { eventId, status: OrderStatus.PAID },
    select: { email: true, firstName: true },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Map<string, { email: string; firstName: string }>();
  for (const o of orders) {
    const key = o.email.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.set(key, { email: o.email.trim(), firstName: o.firstName });
    }
  }
  return [...seen.values()];
}

/** Renders the announcement body into the branded shell. */
export function buildBroadcastHtml(input: {
  eventName: string;
  body: string;
  greetingName?: string;
}): string {
  // The organiser writes plain text; blank lines become paragraphs.
  const paragraphs = input.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:1.65;margin:0 0 16px;color:#33405c;">${esc(
          p,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  const greeting = input.greetingName
    ? `<p style="font-size:16px;margin:0 0 16px;">Dear ${esc(input.greetingName)},</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f5f8;font-family:Helvetica,Arial,sans-serif;color:${NAVY};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e9f0;">
          <tr>
            <td style="background:${NAVY};padding:28px 40px;">
              <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:bold;letter-spacing:-0.5px;color:#ffffff;">common<span style="color:${GOLD};">tone</span></p>
              <h1 style="margin:0;color:#ffffff;font-family:Georgia,serif;font-size:22px;">${esc(input.eventName)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              ${greeting}
              ${paragraphs}
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9fc;padding:20px 40px;border-top:1px solid #e6e9f0;">
              <p style="margin:0;font-size:12px;color:#7a869c;">
                <strong style="color:#33405c;">commontone</strong> · ${esc(input.eventName)}<br/>
                Questions? Reply to this email or contact ${SITE.contactEmail}.<br/>
                <a href="${SITE.instagram}" style="color:${GOLD};text-decoration:none;">Instagram ${SITE.instagramHandle}</a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Plain-text alternative — multipart mail is far less likely to be filtered. */
export function buildBroadcastText(input: {
  eventName: string;
  body: string;
  greetingName?: string;
}): string {
  return [
    input.greetingName ? `Dear ${input.greetingName},` : "",
    "",
    input.body.trim(),
    "",
    "—",
    `commontone · ${input.eventName}`,
    `Questions? Reply to this email or contact ${SITE.contactEmail}.`,
    `${SITE.instagram}`,
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");
}

export type SendResult = {
  sent: number;
  failed: { email: string; error: string }[];
};

/** Splits a list into chunks of at most `size`. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Sends the announcement to every recipient.
 *
 * Uses Resend's batch endpoint: up to 100 personalised messages per API call,
 * so a 100-person send costs one request instead of 100. That matters because
 * Resend allows ~10 requests/second per team — sending one-by-one trips the
 * limit and silently drops recipients.
 *
 * Still one message per person (not a BCC blast), so recipients never see each
 * other's addresses and each greeting can use their first name.
 */
export async function sendBroadcast(params: {
  recipients: { email: string; firstName: string }[];
  subject: string;
  body: string;
  eventName: string;
  personalise: boolean;
}): Promise<SendResult> {
  const { recipients, subject, body, eventName, personalise } = params;

  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const failed: { email: string; error: string }[] = [];
  let sent = 0;

  // 100 is the batch endpoint's documented maximum per call.
  const groups = chunk(recipients, 100);

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]!;
    const payload = group.map((r) => ({
      from: FROM,
      to: r.email,
      replyTo: SITE.contactEmail,
      subject,
      html: buildBroadcastHtml({
        eventName,
        body,
        greetingName: personalise ? r.firstName : undefined,
      }),
      text: buildBroadcastText({
        eventName,
        body,
        greetingName: personalise ? r.firstName : undefined,
      }),
    }));

    try {
      const { error } = await resend.batch.send(payload);
      if (error) throw new Error(error.message);
      sent += group.length;
    } catch (err) {
      // A whole batch failing is rare (auth, quota, malformed payload). Retry
      // this group one message at a time so one bad address cannot cost the
      // other 99 their email, and so the failure list names real recipients.
      const message = err instanceof Error ? err.message : "unknown error";
      console.error(`[broadcast] batch ${g + 1} failed (${message}) — retrying individually`);

      for (const r of group) {
        try {
          const { error } = await resend.emails.send({
            from: FROM,
            to: r.email,
            replyTo: SITE.contactEmail,
            subject,
            html: buildBroadcastHtml({
              eventName,
              body,
              greetingName: personalise ? r.firstName : undefined,
            }),
            text: buildBroadcastText({
              eventName,
              body,
              greetingName: personalise ? r.firstName : undefined,
            }),
          });
          if (error) throw new Error(error.message);
          sent += 1;
        } catch (e) {
          failed.push({
            email: r.email,
            error: e instanceof Error ? e.message : "unknown error",
          });
        }
        // ~5 requests/second, comfortably inside Resend's ~10/s limit.
        await new Promise((res) => setTimeout(res, 200));
      }
    }

    // Space out batch calls too, in case several groups are sent back to back.
    if (g + 1 < groups.length) {
      await new Promise((res) => setTimeout(res, 1000));
    }
  }

  return { sent, failed };
}
