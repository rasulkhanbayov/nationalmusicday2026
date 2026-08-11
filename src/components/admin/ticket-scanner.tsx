"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  CameraOff,
  Loader2,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Result =
  | {
      status: "VALID";
      seatLabel: string | null;
      tierName: string | null;
      orderNumber: string;
      purchaserName: string;
      eventName: string;
    }
  | {
      status: "ALREADY_USED";
      seatLabel: string | null;
      tierName: string | null;
      orderNumber: string;
      purchaserName: string;
      eventName: string;
      checkedInAt: string;
    }
  | {
      status: "WRONG_EVENT";
      seatLabel: string | null;
      tierName: string | null;
      orderNumber: string;
      purchaserName: string;
      eventName: string;
    }
  | { status: "INVALID"; ticketId: string };

export type ScanEvent = { id: string; name: string };

const SCANNER_ID = "qr-scanner-region";

export function TicketScanner({ events }: { events: ScanEvent[] }) {
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const [eventId, setEventId] = useState<string>(events[0]?.id ?? "");
  const [result, setResult] = useState<Result | null>(null);
  // True while a result is on screen and the camera feed is frozen.
  const [paused, setPaused] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  // Debounce so a held-up QR isn't validated dozens of times per second.
  const lastScanRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  // Keep the latest selected event available to the scan callback.
  const eventIdRef = useRef(eventId);
  eventIdRef.current = eventId;

  const validate = useCallback(async (ticketId: string) => {
    const trimmed = ticketId.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: trimmed,
          checkIn: true,
          eventId: eventIdRef.current || null,
        }),
      });
      const json = (await res.json()) as Result;
      setResult(json);
    } catch {
      setResult({ status: "INVALID", ticketId: trimmed });
    } finally {
      setBusy(false);
    }
  }, []);

  /** Clears the current result and re-arms the camera for the next guest. */
  const scanNext = useCallback(() => {
    setResult(null);
    lastScanRef.current = { text: "", at: 0 };
    setPaused(false);
    try {
      scannerRef.current?.resume();
    } catch {
      /* if resume fails the operator can restart the camera */
    }
  }, []);

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current;
    if (s) {
      try {
        await s.stop();
        await s.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setPaused(false);
  }, []);

  const startScanner = useCallback(async () => {
    setResult(null);
    setPaused(false);
    lastScanRef.current = { text: "", at: 0 };
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;
    setScanning(true);
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          const now = Date.now();
          if (
            decoded === lastScanRef.current.text &&
            now - lastScanRef.current.at < 3000
          ) {
            return; // debounce duplicate reads within one burst
          }
          lastScanRef.current = { text: decoded, at: now };
          // Freeze the feed immediately: at 10fps the same ticket would
          // otherwise be decoded again and reported as already used while
          // it is still in front of the camera.
          try {
            scannerRef.current?.pause(true);
          } catch {
            /* pause is best-effort */
          }
          setPaused(true);
          validate(decoded);
        },
        () => {
          /* per-frame decode errors are normal; ignore */
        },
      );
    } catch (err) {
      console.error("[scanner] start failed:", err);
      setScanning(false);
      scannerRef.current = null;
    }
  }, [validate]);

  // Clean up camera on unmount.
  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-serif text-xl font-semibold text-navy-900">
            Scan Ticket
          </h2>

          {events.length > 0 ? (
            <label className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Door for</span>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div
            id={SCANNER_ID}
            className={cn(
              "mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg border-2 border-dashed border-border bg-navy-50/50",
              scanning ? "border-solid border-gold" : "",
            )}
          />

          <div className="mt-4 flex justify-center">
            {scanning ? (
              <Button variant="outline" onClick={stopScanner}>
                <CameraOff /> Stop Camera
              </Button>
            ) : (
              <Button variant="default" onClick={startScanner}>
                <Camera /> Start Camera
              </Button>
            )}
          </div>

          {/* Manual fallback */}
          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-2 text-sm font-medium text-navy-900">
              Or enter ticket ID manually
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                // Freeze the camera too, so a stray scan can't overwrite the
                // result the operator just looked up by hand.
                if (scannerRef.current) {
                  try {
                    scannerRef.current.pause(true);
                  } catch {
                    /* pause is best-effort */
                  }
                  setPaused(true);
                }
                validate(manual);
                setManual("");
              }}
            >
              <Input
                placeholder="NM2026-000123-01"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : "Check"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Result panel */}
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-6 pt-6">
          <ResultView result={result} busy={busy} />
          {/* The camera freezes on a result so the same ticket can't be read
              twice; this re-arms it for the next guest. */}
          {paused && result && !busy ? (
            <Button variant="gold" size="lg" onClick={scanNext}>
              <ScanLine /> Scan next guest
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultView({
  result,
  busy,
}: {
  result: Result | null;
  busy: boolean;
}) {
  if (busy && !result) {
    return (
      <div className="text-center text-muted-foreground">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p className="mt-2">Checking…</p>
      </div>
    );
  }
  if (!result) {
    return (
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        Scan a QR code or enter a ticket ID to verify entry.
      </p>
    );
  }

  if (result.status === "VALID") {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
        <p className="mt-4 font-serif text-2xl font-bold text-green-700">
          Valid Ticket
        </p>
        <p className="mt-1 text-muted-foreground">Checked in successfully</p>
        <Details
          name={result.purchaserName}
          seat={result.seatLabel}
          tier={result.tierName}
          order={result.orderNumber}
          event={result.eventName}
        />
      </div>
    );
  }

  if (result.status === "ALREADY_USED") {
    return (
      <div className="text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
        <p className="mt-4 font-serif text-2xl font-bold text-amber-600">
          Already Used
        </p>
        <p className="mt-1 text-muted-foreground">
          Checked in{" "}
          {result.checkedInAt
            ? new Date(result.checkedInAt).toLocaleTimeString()
            : "previously"}
        </p>
        <Details
          name={result.purchaserName}
          seat={result.seatLabel}
          tier={result.tierName}
          order={result.orderNumber}
          event={result.eventName}
        />
      </div>
    );
  }

  if (result.status === "WRONG_EVENT") {
    return (
      <div className="text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
        <p className="mt-4 font-serif text-2xl font-bold text-amber-600">
          Wrong Event
        </p>
        <p className="mt-1 max-w-xs text-muted-foreground">
          This is a valid ticket, but for a different event. Not checked in.
        </p>
        <Details
          name={result.purchaserName}
          seat={result.seatLabel}
          tier={result.tierName}
          order={result.orderNumber}
          event={result.eventName}
        />
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircle className="mx-auto h-16 w-16 text-destructive" />
      <p className="mt-4 font-serif text-2xl font-bold text-destructive">
        Invalid Ticket
      </p>
      <p className="mt-1 max-w-xs text-muted-foreground">
        This ticket was not recognised or has not been paid for.
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {result.ticketId}
      </p>
    </div>
  );
}

function Details({
  name,
  seat,
  tier,
  order,
  event,
}: {
  name: string;
  // General-admission tickets have no seat; seated events still do.
  seat?: string | null;
  tier?: string | null;
  order: string;
  event?: string;
}) {
  return (
    <div className="mx-auto mt-6 max-w-xs space-y-2 rounded-lg bg-secondary p-4 text-left text-sm">
      {event ? <Row label="Event" value={event} /> : null}
      <Row label="Guest" value={name} />
      {tier ? <Row label="Ticket" value={tier} /> : null}
      {seat ? <Row label="Seat" value={seat} /> : null}
      <Row label="Order" value={order} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-navy-900">{value}</span>
    </div>
  );
}
