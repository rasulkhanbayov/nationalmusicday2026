"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Loader2, X, Ticket, RefreshCw, ArrowRight } from "lucide-react";
import { SeatMap, type SeatMapSeat } from "@/components/seat-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MAX_SEATS_PER_ORDER } from "@/lib/constants";
import { compareSeatLabels } from "@/lib/utils";

type SeatsResponse = {
  eventId: string;
  slug: string;
  isFree: boolean;
  priceCents: number;
  seats: SeatMapSeat[];
  rows: string[];
  seatsPerRow: number;
};

function formatEuros(cents: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function BookingClient({ initial }: { initial: SeatsResponse }) {
  const { toast } = useToast();
  const [data, setData] = useState<SeatsResponse>(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const seatsEndpoint = `/api/events/${initial.slug}/seats`;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(seatsEndpoint, { cache: "no-store" });
      if (res.ok) {
        const fresh: SeatsResponse = await res.json();
        setData(fresh);
        setSelected((prev) => {
          const stillOk = new Set<string>();
          const avail = new Map(fresh.seats.map((s) => [s.label, s.status]));
          prev.forEach((l) => {
            if (avail.get(l) === "AVAILABLE") stillOk.add(l);
          });
          return stillOk;
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, [seatsEndpoint]);

  // Refresh seat availability periodically so two buyers see live state.
  useEffect(() => {
    const id = setInterval(refresh, 20_000);
    return () => clearInterval(id);
  }, [refresh]);

  const toggle = useCallback(
    (label: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(label)) {
          next.delete(label);
        } else {
          if (next.size >= MAX_SEATS_PER_ORDER) {
            toast({
              variant: "destructive",
              title: "Seat limit reached",
              description: `You can select up to ${MAX_SEATS_PER_ORDER} seats per order.`,
            });
            return prev;
          }
          next.add(label);
        }
        return next;
      });
    },
    [toast],
  );

  const selectedList = useMemo(
    () => Array.from(selected).sort(compareSeatLabels),
    [selected],
  );
  const totalCents = selected.size * data.priceCents;
  const isFree = data.isFree;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      toast({
        variant: "destructive",
        title: "No seats selected",
        description: "Please choose at least one seat.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: data.eventId,
          ...form,
          seats: selectedList,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: isFree ? "Reservation failed" : "Checkout failed",
          description: json.error ?? "Please try again.",
        });
        if (res.status === 409) await refresh();
        return;
      }

      // Paid → Stripe URL; Free → success page URL. Both come back as `url`.
      window.location.href = json.url;
    } catch {
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Could not reach the server. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    selected.size > 0 &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    !submitting;

  const ctaText = isFree
    ? `Reserve ${selected.size || ""} ${selected.size === 1 ? "seat" : "seats"}`.trim()
    : `Pay ${formatEuros(totalCents)}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      {/* Seat map */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-navy-900">
            Select Your Seats
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <SeatMap
              seats={data.seats}
              rows={data.rows}
              seatsPerRow={data.seatsPerRow}
              selected={selected}
              onToggle={toggle}
            />
          </CardContent>
        </Card>
      </div>

      {/* Order summary + checkout */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-navy-900">
                Your Order
              </h3>
              <span className="text-sm text-muted-foreground">
                {isFree ? "Free entry" : `${formatEuros(data.priceCents)} / seat`}
              </span>
            </div>

            {selectedList.length === 0 ? (
              <p className="rounded-lg bg-secondary px-4 py-6 text-center text-sm text-muted-foreground">
                No seats selected yet. Click an available seat on the map.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {selectedList.map((label) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => toggle(label)}
                      className="group flex items-center gap-1.5 rounded-full bg-blue-600 py-1 pl-3 pr-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      aria-label={`Remove seat ${label}`}
                    >
                      {label}
                      <X className="h-3.5 w-3.5 opacity-80 group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">
                {selected.size} {selected.size === 1 ? "ticket" : "tickets"}
              </span>
              <span className="font-serif text-2xl font-bold text-navy-900">
                {isFree ? "Free" : formatEuros(totalCents)}
              </span>
            </div>

            {/* Guest checkout form */}
            <form onSubmit={handleCheckout} className="space-y-4 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Guest Checkout
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    required
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    required
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Your tickets will be emailed here.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={!canSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" />{" "}
                    {isFree ? "Reserving…" : "Redirecting…"}
                  </>
                ) : (
                  <>
                    <Ticket /> {ctaText} <ArrowRight />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {isFree
                  ? "Free reservation · Seats are held for 30 minutes."
                  : "Secure payment via Stripe. Seats are held for 30 minutes."}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
