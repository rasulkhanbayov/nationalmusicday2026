"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export type EventFormValues = {
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "SOLD_OUT" | "PAST";
  name: string;
  subtitle: string;
  type: string;
  description: string;
  startsAt: string; // datetime-local
  endsAt: string;
  doorsTime: string;
  venueName: string;
  venueStreet: string;
  venuePostalCode: string;
  venueCity: string;
  venueCountry: string;
  ticketUrl: string;
  imageUrl: string;
  isFree: boolean;
  priceEuros: string;
  rows: string;
  seatsPerRow: string;
  orderPrefix: string;
  contactEmail: string;
};

export const emptyEvent: EventFormValues = {
  slug: "",
  status: "DRAFT",
  name: "",
  subtitle: "",
  type: "Concert",
  description: "",
  startsAt: "",
  endsAt: "",
  doorsTime: "",
  venueName: "Einstein Kultur",
  venueStreet: "Einsteinstraße 42",
  venuePostalCode: "81675",
  venueCity: "Munich",
  venueCountry: "Germany",
  ticketUrl: "",
  imageUrl: "",
  isFree: false,
  priceEuros: "25",
  rows: "12",
  seatsPerRow: "10",
  orderPrefix: "EV",
  contactEmail: "",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function EventForm({
  mode,
  eventId,
  initial,
}: {
  mode: "create" | "edit";
  eventId?: string;
  initial: EventFormValues;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState<EventFormValues>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof EventFormValues>(key: K, val: EventFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      slug: v.slug || slugify(v.name),
      status: v.status,
      name: v.name,
      subtitle: v.subtitle,
      type: v.type,
      description: v.description,
      startsAt: v.startsAt,
      endsAt: v.endsAt,
      doorsTime: v.doorsTime,
      venueName: v.venueName,
      venueStreet: v.venueStreet,
      venuePostalCode: v.venuePostalCode,
      venueCity: v.venueCity,
      venueCountry: v.venueCountry,
      ticketUrl: v.ticketUrl.trim(),
      imageUrl: v.imageUrl.trim(),
      isFree: v.isFree,
      priceEuros: v.isFree ? 0 : parseFloat(v.priceEuros) || 0,
      rows: parseInt(v.rows, 10) || 0,
      seatsPerRow: parseInt(v.seatsPerRow, 10) || 0,
      orderPrefix: v.orderPrefix,
      contactEmail: v.contactEmail,
    };

    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/events"
          : `/api/admin/events/${eventId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Could not save event",
          description: json.error,
        });
        return;
      }
      toast({
        variant: "success",
        title: mode === "create" ? "Event created" : "Event updated",
      });
      router.push("/admin/events");
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Basics */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-serif text-lg font-semibold text-navy-900">
            Event details
          </h2>
          <Field label="Name" required>
            <Input
              required
              value={v.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (mode === "create") set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug (URL)" required>
              <Input
                required
                value={v.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                value={v.status}
                onChange={(e) =>
                  set("status", e.target.value as EventFormValues["status"])
                }
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="DRAFT">Draft (hidden)</option>
                <option value="PUBLISHED">Published (on sale)</option>
                <option value="SOLD_OUT">Sold out</option>
                <option value="PAST">Past</option>
              </select>
            </Field>
          </div>
          <Field label="Subtitle">
            <Input
              value={v.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Input
                value={v.type}
                onChange={(e) => set("type", e.target.value)}
                placeholder="Classical Music Concert"
              />
            </Field>
            <Field label="Contact email">
              <Input
                type="email"
                value={v.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Schedule + venue */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-serif text-lg font-semibold text-navy-900">
            Schedule & venue
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Starts at" required>
              <Input
                type="datetime-local"
                required
                value={v.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </Field>
            <Field label="Ends at">
              <Input
                type="datetime-local"
                value={v.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </Field>
            <Field label="Doors (text)">
              <Input
                value={v.doorsTime}
                onChange={(e) => set("doorsTime", e.target.value)}
                placeholder="18:30"
              />
            </Field>
          </div>
          <Field label="Venue name" required>
            <Input
              required
              value={v.venueName}
              onChange={(e) => set("venueName", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Street" required>
              <Input
                required
                value={v.venueStreet}
                onChange={(e) => set("venueStreet", e.target.value)}
              />
            </Field>
            <Field label="City" required>
              <Input
                required
                value={v.venueCity}
                onChange={(e) => set("venueCity", e.target.value)}
              />
            </Field>
            <Field label="Postal code" required>
              <Input
                required
                value={v.venuePostalCode}
                onChange={(e) => set("venuePostalCode", e.target.value)}
              />
            </Field>
            <Field label="Country">
              <Input
                value={v.venueCountry}
                onChange={(e) => set("venueCountry", e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Tickets — external sales link + price display */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-serif text-lg font-semibold text-navy-900">
            Tickets
          </h2>

          <Field label="Event image">
            <Input
              placeholder="/images/mugham-ensemble.jpeg"
              value={v.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
            />
            <p className="mt-1.5 text-sm text-muted-foreground">
              Artwork for the hero banner and event card. Use a path under
              <code className="mx-1 rounded bg-muted px-1">public/</code>
              (e.g. <code>/images/name.jpeg</code>) or a full URL. Leave empty
              for a plain navy background.
            </p>
          </Field>

          <Field label="Ticket shop URL">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://tickets.example.com/your-event"
              value={v.ticketUrl}
              onChange={(e) => set("ticketUrl", e.target.value)}
            />
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tickets are sold on an external site. This is where the
              &ldquo;Buy Tickets&rdquo; button sends visitors. Leave empty and
              the event will show &ldquo;Tickets coming soon&rdquo; instead.
            </p>
          </Field>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => set("isFree", false)}
              className={`flex-1 rounded-lg border p-4 text-left transition-colors ${
                !v.isFree
                  ? "border-gold bg-gold/10"
                  : "border-border hover:border-gold/50"
              }`}
            >
              <p className="font-semibold text-navy-900">Paid event</p>
              <p className="text-sm text-muted-foreground">
                Show a ticket price on the event page.
              </p>
            </button>
            <button
              type="button"
              onClick={() => set("isFree", true)}
              className={`flex-1 rounded-lg border p-4 text-left transition-colors ${
                v.isFree
                  ? "border-gold bg-gold/10"
                  : "border-border hover:border-gold/50"
              }`}
            >
              <p className="font-semibold text-navy-900">Free event</p>
              <p className="text-sm text-muted-foreground">
                Show as free admission.
              </p>
            </button>
          </div>

          {!v.isFree ? (
            <Field label="Ticket price (€)" required>
              <Input
                type="number"
                step="0.50"
                min="0.50"
                required
                value={v.priceEuros}
                onChange={(e) => set("priceEuros", e.target.value)}
                className="max-w-[160px]"
              />
              <p className="mt-1.5 text-sm text-muted-foreground">
                Displayed on the event page. The actual charge is handled by the
                external ticket shop.
              </p>
            </Field>
          ) : (
            <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
              This event is shown as free admission.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seating */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-serif text-lg font-semibold text-navy-900">
            Seating
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rows" required>
              <Input
                type="number"
                min="1"
                max="26"
                required
                value={v.rows}
                onChange={(e) => set("rows", e.target.value)}
              />
            </Field>
            <Field label="Seats per row" required>
              <Input
                type="number"
                min="1"
                max="40"
                required
                value={v.seatsPerRow}
                onChange={(e) => set("seatsPerRow", e.target.value)}
              />
            </Field>
            <Field label="Order prefix" required>
              <Input
                required
                value={v.orderPrefix}
                onChange={(e) => set("orderPrefix", e.target.value)}
                placeholder="NM2026"
              />
            </Field>
          </div>
          <p className="text-sm text-muted-foreground">
            Total capacity:{" "}
            <span className="font-semibold text-navy-900">
              {(parseInt(v.rows, 10) || 0) * (parseInt(v.seatsPerRow, 10) || 0)}{" "}
              seats
            </span>
            .{" "}
            {mode === "edit"
              ? "Reducing the layout keeps existing seats; increasing it adds new ones."
              : "Seats are generated when the event is created."}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          {mode === "create" ? "Create event" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
