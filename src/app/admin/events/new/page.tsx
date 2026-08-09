import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventForm, emptyEvent } from "@/components/admin/event-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Event",
  robots: { index: false, follow: false },
};

export default function NewEventPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy-900">
          Create Event
        </h1>
        <p className="text-muted-foreground">
          Set up a new event with its own seats, pricing and tickets.
        </p>
      </div>
      <EventForm mode="create" initial={emptyEvent} />
    </AdminShell>
  );
}
