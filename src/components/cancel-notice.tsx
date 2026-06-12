"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

/** Shows a toast when the user returns from a cancelled Stripe Checkout. */
export function CancelNotice() {
  const params = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (params.get("cancelled")) {
      toast({
        title: "Checkout cancelled",
        description:
          "No payment was taken. Your seats have been released — feel free to try again.",
      });
    }
  }, [params, toast]);

  return null;
}
