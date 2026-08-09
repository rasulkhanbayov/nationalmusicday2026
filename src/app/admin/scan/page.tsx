import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { TicketScanner } from "@/components/admin/ticket-scanner";
import { listAllEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scan Tickets",
  robots: { index: false, follow: false },
};

export default async function ScanPage() {
  const events = await listAllEvents();
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy-900">
          Ticket Validation
        </h1>
        <p className="text-muted-foreground">
          Select the event door, then scan guests in. Each ticket can only be
          used once.
        </p>
      </div>
      <TicketScanner events={events.map((e) => ({ id: e.id, name: e.name }))} />
    </AdminShell>
  );
}
