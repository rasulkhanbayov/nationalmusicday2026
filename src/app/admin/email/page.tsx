import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";
import { listAllEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email Ticket Holders",
  robots: { index: false, follow: false },
};

export default async function BroadcastPage() {
  const events = await listAllEvents();

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy-900">
          Email ticket holders
        </h1>
        <p className="mt-1 text-muted-foreground">
          Sends from {process.env.EMAIL_FROM ?? "info@commontone.de"} to
          everyone with a paid ticket. One email per person — recipients never
          see each other&apos;s addresses.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">Create an event first.</p>
      ) : (
        <BroadcastComposer
          events={events.map((e) => ({ id: e.id, name: e.name }))}
          adminEmail={process.env.ADMIN_EMAIL ?? "your admin address"}
        />
      )}
    </AdminShell>
  );
}
