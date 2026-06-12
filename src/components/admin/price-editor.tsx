"use client";

import { useState } from "react";
import { Loader2, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function PriceEditor({ initialEuros }: { initialEuros: number }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [euros, setEuros] = useState(String(initialEuros));
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(initialEuros);

  async function save() {
    const value = parseFloat(euros);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ variant: "destructive", title: "Enter a valid price" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ euros: value }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCurrent(json.euros);
      setEditing(false);
      toast({ variant: "success", title: "Ticket price updated" });
    } catch {
      toast({ variant: "destructive", title: "Could not update price" });
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-serif text-2xl font-bold text-navy-900">
          €{current.toFixed(2)}
        </span>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" /> Change
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">€</span>
      <Input
        type="number"
        step="0.50"
        min="0.50"
        value={euros}
        onChange={(e) => setEuros(e.target.value)}
        className="w-28"
        autoFocus
      />
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setEuros(String(current));
          setEditing(false);
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
