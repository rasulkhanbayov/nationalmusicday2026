"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Loader2, Ticket as TicketIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "./language-provider";
import type { EventView } from "@/lib/events";
import { MAX_TICKETS_PER_ORDER } from "@/lib/constants";

/**
 * General-admission ticket purchase: pick a quantity per ticket type, enter
 * guest details, then hand off to Stripe Checkout. No seat selection — QR
 * tickets are emailed once payment is confirmed.
 */
export function TicketPurchase({ event }: { event: EventView }) {
  const { t, price, content } = useLanguage();
  const { toast } = useToast();

  // Memoised so the totals below don't recompute on every render.
  const tiers = useMemo(
    () =>
      event.tiers.length
        ? event.tiers
        : [{ name: "Ticket", priceCents: event.priceCents } as EventView["tiers"][number]],
    [event.tiers, event.priceCents],
  );

  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(tiers.map((x, i) => [x.name, i === 0 ? 1 : 0])),
  );
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);

  const totalQty = useMemo(
    () => Object.values(qty).reduce((a, b) => a + b, 0),
    [qty],
  );
  const totalCents = useMemo(
    () => tiers.reduce((sum, x) => sum + x.priceCents * (qty[x.name] ?? 0), 0),
    [qty, tiers],
  );

  function bump(name: string, delta: number) {
    setQty((prev) => {
      const next = Math.max(0, (prev[name] ?? 0) + delta);
      const others = Object.entries(prev)
        .filter(([k]) => k !== name)
        .reduce((a, [, v]) => a + v, 0);
      if (others + next > MAX_TICKETS_PER_ORDER) return prev;
      return { ...prev, [name]: next };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (totalQty === 0) {
      toast({ variant: "destructive", title: t.checkout.pickOne });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ...form,
          items: tiers.map((x) => ({ tier: x.name, quantity: qty[x.name] ?? 0 })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast({
          variant: "destructive",
          title: t.checkout.failed,
          description: json.error,
        });
        return;
      }
      // Hand off to Stripe Checkout.
      window.location.href = json.url;
    } catch {
      toast({ variant: "destructive", title: t.checkout.network });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl">
      {/* Ticket types */}
      <div className="grid gap-4 sm:grid-cols-2">
        {tiers.map((tier) => {
          const n = qty[tier.name] ?? 0;
          const active = n > 0;
          return (
            <Card
              key={tier.name}
              className={`relative overflow-hidden transition-all ${
                active ? "border-gold shadow-md" : "hover:border-gold/40"
              }`}
            >
              <CardContent className="pt-6">
                <h3 className="font-serif text-xl font-semibold text-navy-900">
                  {content(tier.name, tier.nameEn)}
                </h3>
                <p className="mt-3 font-serif text-3xl font-bold text-navy-900">
                  {price(tier.priceCents)}
                </p>
                {tier.note ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {content(tier.note, tier.noteEn)}
                  </p>
                ) : null}

                <div className="mt-5 flex items-center justify-between rounded-lg border border-border p-1.5">
                  <button
                    type="button"
                    onClick={() => bump(tier.name, -1)}
                    disabled={n === 0}
                    aria-label={`${t.checkout.decrease} ${tier.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-navy-900 transition-colors hover:bg-navy-50 disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span
                    aria-live="polite"
                    className="min-w-[2ch] text-center font-serif text-xl font-semibold text-navy-900"
                  >
                    {n}
                  </span>
                  <button
                    type="button"
                    onClick={() => bump(tier.name, 1)}
                    disabled={totalQty >= MAX_TICKETS_PER_ORDER}
                    aria-label={`${t.checkout.increase} ${tier.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-navy-900 transition-colors hover:bg-navy-50 disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admission notice */}
      {event.notice ? (
        <div className="mt-6 flex gap-3 rounded-lg border-l-4 border-gold bg-navy-50/50 p-4 text-sm leading-relaxed text-navy-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p>{content(event.notice, event.noticeEn)}</p>
        </div>
      ) : null}

      {/* Guest details */}
      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-serif text-lg font-semibold text-navy-900">
            {t.checkout.yourDetails}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">{t.checkout.firstName}</Label>
              <Input
                id="firstName"
                required
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t.checkout.lastName}</Label>
              <Input
                id="lastName"
                required
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">{t.checkout.email}</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t.checkout.emailHint}
            </p>
          </div>
          <div>
            <Label htmlFor="phone">{t.checkout.phone}</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total + submit */}
      <div className="mt-6 flex flex-col items-center gap-4 rounded-xl bg-navy-950 p-6 text-white sm:flex-row sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/50">
            {t.checkout.total}
          </p>
          <p className="font-serif text-3xl font-bold">{price(totalCents)}</p>
          <p className="text-sm text-white/60">
            {totalQty} {totalQty === 1 ? t.checkout.ticket : t.checkout.tickets}
          </p>
        </div>
        <Button
          type="submit"
          variant="gold"
          size="lg"
          disabled={busy || totalQty === 0}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" /> {t.checkout.redirecting}
            </>
          ) : (
            <>
              <TicketIcon /> {t.checkout.payNow}
            </>
          )}
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t.checkout.securedByStripe}
      </p>
    </form>
  );
}
