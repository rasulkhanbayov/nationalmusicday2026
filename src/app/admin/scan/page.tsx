import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { TicketScanner } from "@/components/admin/ticket-scanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scan Tickets",
  robots: { index: false, follow: false },
};

export default function ScanPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy-900">
          Ticket Validation
        </h1>
        <p className="text-muted-foreground">
          Scan guests in at the entrance. Each ticket can only be used once.
        </p>
      </div>
      <TicketScanner />
    </AdminShell>
  );
}
