import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import {
  getRecipients,
  buildBroadcastHtml,
  sendBroadcast,
} from "@/lib/broadcast";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// Sending to a few hundred people takes longer than the default budget.
export const maxDuration = 60;

/**
 * POST /api/admin/broadcast — announcement email to an event's ticket holders.
 *
 * Three modes, matching the compose screen's safety flow:
 *   preview — render the HTML and count recipients, send nothing
 *   test    — send one copy to the admin's own address
 *   send    — the real thing, guarded by a typed recipient count
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Even for an admin: a runaway loop shouldn't be able to mail everyone
  // repeatedly.
  if (!rateLimit(`broadcast:${clientIp(req.headers)}`, 12, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: {
    eventId?: string;
    subject?: string;
    message?: string;
    mode?: "preview" | "test" | "send";
    personalise?: boolean;
    confirmCount?: number;
    /** Retry mode: send only to these addresses, skipping everyone else. */
    onlyEmails?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const mode = body.mode ?? "preview";
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();
  const personalise = body.personalise !== false;

  if (!body.eventId) {
    return NextResponse.json({ error: "Missing event." }, { status: 400 });
  }
  const event = await prisma.event.findUnique({ where: { id: body.eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (mode !== "preview") {
    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
  }

  const all = await getRecipients(event.id);

  // Retry mode: narrow to the given addresses. Still resolved against the real
  // recipient list, so this cannot be used to mail an arbitrary address.
  const only = Array.isArray(body.onlyEmails)
    ? new Set(body.onlyEmails.map((e) => String(e).trim().toLowerCase()))
    : null;
  const recipients = only
    ? all.filter((r) => only.has(r.email.toLowerCase()))
    : all;

  // ── preview ──────────────────────────────────────────────
  if (mode === "preview") {
    return NextResponse.json({
      recipientCount: recipients.length,
      sample: recipients.slice(0, 5).map((r) => r.email),
      html: buildBroadcastHtml({
        eventName: event.name,
        body: message || "(your message will appear here)",
        greetingName: personalise ? recipients[0]?.firstName || "Guest" : undefined,
      }),
    });
  }

  // ── test send ────────────────────────────────────────────
  if (mode === "test") {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json(
        { error: "ADMIN_EMAIL is not configured." },
        { status: 500 },
      );
    }
    const result = await sendBroadcast({
      recipients: [{ email: adminEmail, firstName: "there" }],
      subject: `[TEST] ${subject}`,
      body: message,
      eventName: event.name,
      personalise,
    });
    if (result.failed.length) {
      return NextResponse.json(
        { error: result.failed[0]!.error },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, mode: "test", sentTo: adminEmail });
  }

  // ── real send ────────────────────────────────────────────
  // The typed count must match what the server sees, so the admin cannot
  // confirm a number from a stale screen.
  if (body.confirmCount !== recipients.length) {
    return NextResponse.json(
      {
        error: `Recipient count has changed — it is now ${recipients.length}. Please review and confirm again.`,
        recipientCount: recipients.length,
      },
      { status: 409 },
    );
  }
  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "There are no paid ticket holders to email." },
      { status: 400 },
    );
  }

  const result = await sendBroadcast({
    recipients,
    subject,
    body: message,
    eventName: event.name,
    personalise,
  });

  console.info(
    `[broadcast] "${subject}" -> ${result.sent}/${recipients.length} sent, ${result.failed.length} failed`,
  );

  return NextResponse.json({
    ok: true,
    mode: "send",
    sent: result.sent,
    failed: result.failed,
  });
}
