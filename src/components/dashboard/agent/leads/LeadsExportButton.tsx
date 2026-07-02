"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Your Data, Your Leads" export control (Influence Campaign 45).
 * Plain anchor download against the CSV export endpoint — no client state.
 */
export function LeadsExportButton() {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        render={<a href="/api/agent/leads/export" download />}
      >
        <Download className="size-3.5" />
        Export my leads (CSV)
      </Button>
      <span className="text-[10px] text-muted-foreground">
        Your leads are yours. Export everything, any time.
      </span>
    </div>
  );
}
