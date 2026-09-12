import { randomBytes } from "crypto";
import { prisma } from "./prisma";

/**
 * Private purchase links for sold-out events.
 *
 * An invite lets a specific guest buy through the normal checkout — Stripe,
 * QR ticket, confirmation email — without the event leaving SOLD_OUT on the
 * public site. Each link is bounded three ways: a ticket count, an expiry,
 * and manual revocation.
 */

export type InviteState =
  | { ok: true; invite: { id: string; remaining: number; expiresAt: Date } }
  | { ok: false; reason: "not_found" | "expired" | "used" | "revoked" };

/** 32 bytes of URL-safe randomness — not guessable, not sequential. */
export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Resolves a token to a usable invite.
 *
 * Returns a distinct reason on failure so the page can explain what happened
 * ("this invitation has already been used") rather than a bare 404.
 */
export async function checkInvite(
  token: string | undefined | null,
  eventId?: string,
): Promise<InviteState> {
  const t = (token ?? "").trim();
  if (!t) return { ok: false, reason: "not_found" };

  const invite = await prisma.invite.findUnique({ where: { token: t } });
  if (!invite) return { ok: false, reason: "not_found" };
  // An invite is bound to one event; refuse it elsewhere.
  if (eventId && invite.eventId !== eventId) {
    return { ok: false, reason: "not_found" };
  }
  if (invite.revokedAt) return { ok: false, reason: "revoked" };
  if (invite.expiresAt <= new Date()) return { ok: false, reason: "expired" };

  const remaining = invite.maxTickets - invite.usedTickets;
  if (remaining <= 0) return { ok: false, reason: "used" };

  return {
    ok: true,
    invite: { id: invite.id, remaining, expiresAt: invite.expiresAt },
  };
}

/**
 * Atomically consumes `quantity` tickets from an invite.
 *
 * Uses a single guarded UPDATE so the database decides the winner: the
 * `usedTickets + n <= maxTickets` comparison happens inside the same
 * statement that increments, which a read-then-write cannot guarantee. Two
 * people opening the same single-use link at the same moment therefore
 * cannot both get through.
 *
 * Returns false when the invite is expired, revoked, or out of tickets.
 */
export async function consumeInvite(
  inviteId: string,
  quantity: number,
): Promise<boolean> {
  const updated = await prisma.$executeRaw`
    UPDATE "Invite"
       SET "usedTickets" = "usedTickets" + ${quantity},
           "updatedAt"   = NOW()
     WHERE "id" = ${inviteId}
       AND "revokedAt" IS NULL
       AND "expiresAt" > NOW()
       AND "usedTickets" + ${quantity} <= "maxTickets"
  `;
  return updated === 1;
}

/** Releases tickets back to an invite when a checkout could not be started. */
export async function releaseInvite(
  inviteId: string,
  quantity: number,
): Promise<void> {
  await prisma.invite
    .update({
      where: { id: inviteId },
      data: { usedTickets: { decrement: quantity } },
    })
    .catch(() => {});
}
