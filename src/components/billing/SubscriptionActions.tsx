"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

type Props = Readonly<{
  role: string;
  basePath: string;
  returnUrl: string;
}>;

export function SubscriptionActions({ returnUrl }: Props) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handlePortal() {
    setIsRedirecting(true);
    try {
      const res = await fetch("/api/agent/billing?action=portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: `${window.location.origin}${returnUrl}` }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to open billing portal");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal");
      setIsRedirecting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 pt-2">
      <Button
        onClick={() => void handlePortal()}
        disabled={isRedirecting}
        className="bg-brand-primary text-white hover:bg-brand-primary-light gap-1.5"
      >
        {isRedirecting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ExternalLink size={14} />
        )}
        {isRedirecting ? "Opening portal…" : "Manage via Stripe"}
      </Button>
      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Upgrade, downgrade, cancel, or update payment via Stripe
      </p>
    </div>
  );
}
