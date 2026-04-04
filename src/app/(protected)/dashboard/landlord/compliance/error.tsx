"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComplianceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <AlertTriangle className="size-12 text-error" />
      <h2 className="text-lg font-bold">Failed to load compliance data</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load your compliance information. This is usually temporary.
      </p>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="size-4" />
        Try Again
      </Button>
    </div>
  );
}
