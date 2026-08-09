"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ResendButton({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error);
      }
      toast({ variant: "success", title: "Tickets re-sent" });
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

  return (
    <Button variant="ghost" size="sm" onClick={resend} disabled={loading}>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      Resend
    </Button>
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
