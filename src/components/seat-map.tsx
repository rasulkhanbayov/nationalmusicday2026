"use client";

import { cn } from "@/lib/utils";

export type SeatStatusView = "AVAILABLE" | "RESERVED" | "SOLD";

export type SeatMapSeat = {
  label: string;
  row: string;
  number: number;
  status: SeatStatusView;
};

type SeatMapProps = {
  seats: SeatMapSeat[];
  rows: string[];
  seatsPerRow: number;
  /** Currently selected seat labels (rendered blue). */
  selected?: Set<string>;
  onToggle?: (label: string) => void;
  /** When true, seats can't be clicked (admin overview mode). */
  readOnly?: boolean;
  className?: string;
};

function seatClasses(
  status: SeatStatusView,
  isSelected: boolean,
  interactive: boolean,
) {
  if (isSelected) {
    return "bg-blue-600 text-white border-blue-700 hover:bg-blue-700";
  }
  switch (status) {
    case "SOLD":
      return "bg-red-500/90 text-white border-red-600 cursor-not-allowed";
    case "RESERVED":
      return "bg-amber-400 text-amber-950 border-amber-500 cursor-not-allowed";
    case "AVAILABLE":
    default:
      return interactive
        ? "bg-emerald-500/90 text-white border-emerald-600 hover:bg-emerald-600 hover:scale-105"
        : "bg-emerald-500/90 text-white border-emerald-600";
  }
}

export function SeatMap({
  seats,
  rows,
  selected = new Set(),
  onToggle,
  readOnly = false,
  className,
}: SeatMapProps) {
  // Index seats by label for quick lookup.
  const byLabel = new Map(seats.map((s) => [s.label, s]));

  return (
    <div className={cn("w-full", className)}>
      {/* Stage */}
      <div className="mx-auto mb-8 w-full max-w-2xl">
        <div className="rounded-t-[40%] border-x border-t border-gold/40 bg-gradient-to-b from-navy-900 to-navy-950 py-3 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Stage
          </span>
        </div>
      </div>

      <div
        className="mx-auto w-full max-w-2xl overflow-x-auto pb-2"
        role="group"
        aria-label="Seating map"
      >
        <div className="mx-auto w-fit space-y-2">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                {row}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                  const label = `${row}${num}`;
                  const seat = byLabel.get(label);
                  if (!seat) return null;
                  const isSelected = selected.has(label);
                  const interactive =
                    !readOnly && seat.status === "AVAILABLE" && !!onToggle;
                  const clickable = interactive || (isSelected && !readOnly);
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={!clickable}
                      onClick={() => clickable && onToggle?.(label)}
                      aria-pressed={isSelected}
                      aria-label={`Seat ${label} — ${
                        isSelected ? "selected" : seat.status.toLowerCase()
                      }`}
                      title={`${label} — ${
                        isSelected ? "Selected" : seat.status
                      }`}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-semibold transition-all sm:h-8 sm:w-8 sm:text-xs",
                        seatClasses(seat.status, isSelected, interactive),
                      )}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  const items: { label: string; cls: string }[] = [
    { label: "Available", cls: "bg-emerald-500/90 border-emerald-600" },
    { label: "Selected", cls: "bg-blue-600 border-blue-700" },
    { label: "Reserved", cls: "bg-amber-400 border-amber-500" },
    { label: "Sold", cls: "bg-red-500/90 border-red-600" },
  ];
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2">
          <span className={cn("h-4 w-4 rounded border", i.cls)} />
          <span className="text-sm text-muted-foreground">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
