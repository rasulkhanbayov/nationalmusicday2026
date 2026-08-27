"use client";

import { useState } from "react";
import { Loader2, Send, PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/**
 * Resends a paid order's tickets.
 *
 * Also handles the common support case of a mistyped address: "Fix email"
 * reveals an input, and the corrected address is saved on the order before
 * sending. Ticket ids are never regenerated, so QR codes already issued stay
 * valid — only the delivery address changes.
 */
export function ResendButton({
  orderId,
  email,
}: {
  orderId: string;
  email: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(email);

  async function resend(to?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(to ? { orderId, email: to } : { orderId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      toast({
        variant: "success",
        title: "Tickets re-sent",
        description: json.sentTo ? `Sent to ${json.sentTo}` : undefined,
      });
      setEditing(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Resend failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          void resend(value);
        }}
      >
        <Input
          type="email"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="correct@email.com"
          className="h-8 w-52 text-xs"
          aria-label="Corrected email address"
        />
        <Button type="submit" size="sm" variant="gold" disabled={loading}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save & send"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setValue(email);
            setEditing(false);
          }}
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void resend()}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
        Resend
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        title="Correct a mistyped email address, then resend"
      >
        <PencilLine className="h-3.5 w-3.5" />
        Fix email
      </Button>
    </div>
  );
}

export function ExportButton({ eventId }: { eventId?: string }) {
  const href = eventId
    ? `/api/admin/export?eventId=${encodeURIComponent(eventId)}`
    : "/api/admin/export";
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download>
        Export CSV
      </a>
    </Button>
  );
}
