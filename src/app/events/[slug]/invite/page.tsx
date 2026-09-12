import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TicketPurchase } from "@/components/ticket-purchase";
import { Card, CardContent } from "@/components/ui/card";
import { getEventBySlug } from "@/lib/events";
import { checkInvite } from "@/lib/invites";

export const dynamic = "force-dynamic";

// Never let this page be indexed or shared onward by search engines — it is a
// private purchase link for a sold-out event.
export const metadata: Metadata = {
  title: "Private Invitation",
  robots: { index: false, follow: false },
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { slug } = await params;
  const { k } = await searchParams;

  const event = await getEventBySlug(slug);
  if (!event || event.status === "DRAFT") notFound();

  const state = await checkInvite(k, event.id);

  return (
    <>
      <SiteHeader />
      <main className="bg-navy-50/30">
        <div className="container py-16">
          {!state.ok ? (
            <InviteProblem reason={state.reason} />
          ) : (
            <>
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <span className="section-eyebrow">Private invitation</span>
                <h1 className="font-serif text-3xl font-bold text-navy-900 sm:text-4xl">
                  {event.name}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  This event is sold out, but a place has been reserved for you.
                  This link is valid for{" "}
                  <strong>
                    {state.invite.remaining} ticket
                    {state.invite.remaining === 1 ? "" : "s"}
                  </strong>{" "}
                  and can only be used once.
                </p>
              </div>
              <TicketPurchase event={event} inviteToken={k} />
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function InviteProblem({
  reason,
}: {
  reason: "not_found" | "expired" | "used" | "revoked";
}) {
  const copy = {
    used: {
      title: "This invitation has been used",
      body: "The ticket from this link has already been purchased. If that was not you, please get in touch.",
    },
    expired: {
      title: "This invitation has expired",
      body: "Invitation links are valid for a limited time. Please contact us for a new one.",
    },
    revoked: {
      title: "This invitation is no longer valid",
      body: "This link has been withdrawn. Please contact us if you think this is a mistake.",
    },
    not_found: {
      title: "Invitation not found",
      body: "This link is not valid. Please check you copied the whole address, including the part after the question mark.",
    },
  }[reason];

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="pt-10 text-center">
        <h1 className="font-serif text-2xl font-bold text-navy-900">
          {copy.title}
        </h1>
        <p className="mt-3 text-muted-foreground">{copy.body}</p>
      </CardContent>
    </Card>
  );
}
