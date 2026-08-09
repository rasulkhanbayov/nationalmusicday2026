"use client";

import { useRouter } from "next/navigation";

type Option = { id: string; name: string; isFree: boolean };

/** Dropdown that switches the dashboard's active event via the ?event= param. */
export function EventSelector({
  events,
  current,
  basePath = "/admin/dashboard",
}: {
  events: Option[];
  current: string;
  basePath?: string;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Event</span>
      <select
        value={current}
        onChange={(e) => router.push(`${basePath}?event=${e.target.value}`)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
            {e.isFree ? " (Free)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
